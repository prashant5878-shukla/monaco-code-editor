import { Sandbox } from 'e2b';
import { useCallback, useEffect, useRef, useState } from 'react';

const PROJECT_DIR = '/home/user/project';
const TIMEOUT_MS = 10 * 60 * 1000; // 10 min

export function useSandbox() {
    const sbxRef = useRef(null);
    const sbxIdRef = useRef(null); // preserved across pause so we can resume

    // idle | creating | writing | installing | starting | running | pausing | paused | resuming | error
    const [phase, setPhase] = useState('idle');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [logs, setLogs] = useState([]);

    useEffect(() => () => {
        sbxRef.current?.kill().catch(() => { });
    }, []);

    // ── Logging ──────────────────────────────────────────────────────────────────
    function addLog(text, type = 'out') {
        setLogs(prev => [...prev, { text, type }]);
    }
    function appendLog(text, type = 'out') {
        setLogs(prev => {
            const last = prev[prev.length - 1];
            if (last && last.type === type) {
                return [...prev.slice(0, -1), { text: last.text + text, type }];
            }
            return [...prev, { text, type }];
        });
    }

    // ── Start ─────────────────────────────────────────────────────────────────────
    const start = useCallback(async ({ files, installCommand, runCommand, port = 5173 }) => {
        if (sbxRef.current) {
            await sbxRef.current.kill().catch(() => { });
            sbxRef.current = null;
        }
        sbxIdRef.current = null;
        setLogs([]);
        setPreviewUrl(null);

        try {
            setPhase('creating');
            addLog('Creating sandbox…\n');
            const sbx = await Sandbox.create({
                apiKey: import.meta.env.VITE_E2B_API_KEY,
                timeoutMs: TIMEOUT_MS,
            });
            sbxRef.current = sbx;
            sbxIdRef.current = sbx.sandboxId;
            addLog('✓ Sandbox ready\n');

            setPhase('writing');
            const entries = Object.entries(files);
            addLog(`Writing ${entries.length} files…\n`);
            await Promise.all(
                entries.map(([p, c]) => sbx.files.write(`${PROJECT_DIR}/${p}`, c)),
            );
            addLog('✓ Files written\n');

            if (installCommand) {
                setPhase('installing');
                addLog(`\n$ ${installCommand}\n`);
                const r = await sbx.commands.run(installCommand, {
                    cwd: PROJECT_DIR,
                    onStdout: d => appendLog(d),
                    onStderr: d => appendLog(d, 'err'),
                });
                if (r.exitCode !== 0) throw new Error(`Install failed (exit ${r.exitCode})`);
                addLog('\n✓ Dependencies installed\n');
            }

            setPhase('starting');
            addLog(`\n$ ${runCommand}\n`);
            // Don't await — dev server runs forever
            sbx.commands.run(runCommand, {
                cwd: PROJECT_DIR,
                onStdout: d => appendLog(d),
                onStderr: d => appendLog(d, 'err'),
            });

            // Give it a few seconds to boot then expose the URL
            await new Promise(r => setTimeout(r, 3000));
            const host = sbx.getHost(port);
            const url = `https://${host}`;
            setPreviewUrl(url);
            setPhase('running');
            addLog(`\n✓ Preview → ${url}\n`);

        } catch (err) {
            setPhase('error');
            addLog(`\nError: ${err.message}\n`, 'err');
        }
    }, []);

    // ── Pause — stops billing, preserves state ────────────────────────────────────
    // Call this when user switches away from preview mode
    const pause = useCallback(async () => {
        if (!sbxRef.current || phase !== 'running') return;
        try {
            setPhase('pausing');
            addLog('\n[Pausing sandbox…]\n');
            await sbxRef.current.pause();
            // sandboxId is preserved in sbxIdRef so we can resume
            sbxRef.current = null;
            setPhase('paused');
            addLog('[Sandbox paused — billing stopped]\n');
        } catch (err) {
            // If pause fails, keep running rather than lose the session
            setPhase('running');
            addLog(`[Pause failed: ${err.message} — sandbox still running]\n`, 'err');
        }
    }, [phase]);

    // ── Resume — fast restart from saved state ────────────────────────────────────
    // Call this when user switches back to preview mode
    // previewUrl is still valid — same sandbox ID = same host URL
    const resume = useCallback(async () => {
        if (!sbxIdRef.current) return;
        try {
            setPhase('resuming');
            addLog('\n[Resuming sandbox…]\n');
            const sbx = await Sandbox.resume(sbxIdRef.current, {
                apiKey: import.meta.env.VITE_E2B_API_KEY,
                timeoutMs: TIMEOUT_MS,
            });
            sbxRef.current = sbx;
            setPhase('running');
            addLog('[Sandbox resumed — reload the preview]\n');
            // previewUrl stays the same, caller just needs to reload the iframe
        } catch (err) {
            // Pause state expired or resume failed — need a cold start
            setPhase('idle');
            sbxIdRef.current = null;
            addLog(`[Resume failed: ${err.message} — click Run to restart]\n`, 'err');
        }
    }, []);

    // ── Hard stop ─────────────────────────────────────────────────────────────────
    const stop = useCallback(async () => {
        sbxIdRef.current = null;
        if (sbxRef.current) {
            await sbxRef.current.kill().catch(() => { });
            sbxRef.current = null;
        }
        setPhase('idle');
        setPreviewUrl(null);
    }, []);

    const clearLogs = useCallback(() => setLogs([]), []);

    return {
        phase, previewUrl, logs,
        start, pause, resume, stop, clearLogs,
        isRunning: phase === 'running',
        isPaused: phase === 'paused',
        isBusy: ['creating', 'writing', 'installing', 'starting', 'pausing', 'resuming'].includes(phase),
        canResume: phase === 'paused' && !!sbxIdRef.current,
    };
}