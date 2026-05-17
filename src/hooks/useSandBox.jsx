import { Sandbox } from 'e2b';
import { useCallback, useEffect, useRef, useState } from 'react';

const PROJECT_DIR = '/home/user/project';
const TIMEOUT_MS = 10 * 60 * 1000;
const STORAGE_KEY = 'e2b_active_sandbox_id';

// ── Kill any sandbox left over from a previous page load ──────────────────────
async function killStaleSandbox() {
    const staleId = localStorage.getItem(STORAGE_KEY);
    if (!staleId) return;
    localStorage.removeItem(STORAGE_KEY);
    try {
        const sbx = await Sandbox.connect(staleId, {
            apiKey: import.meta.env.VITE_E2B_API_KEY,
        });
        await sbx.kill();
    } catch {
        // Sandbox already dead — ignore
    }
}

export function useSandbox() {
    const sbxRef = useRef(null);
    const sbxIdRef = useRef(null);

    // idle | creating | writing | installing | starting | running | pausing | paused | resuming | error
    const [phase, setPhase] = useState('idle');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [logs, setLogs] = useState([]);

    // Kill stale sandbox on mount (handles browser refresh)
    useEffect(() => {
        killStaleSandbox();
    }, []);

    // Kill sandbox on page unload (handles tab close / navigation away)
    useEffect(() => {
        const handler = () => {
            const id = sbxIdRef.current;
            if (!id) return;
            // sendBeacon survives page unload unlike fetch
            // For now this just clears localStorage so next mount does the cleanup
            localStorage.removeItem(STORAGE_KEY);
            // When backend is added: navigator.sendBeacon('/api/sandbox/kill', JSON.stringify({ id }))
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // Cleanup on React unmount
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
        localStorage.removeItem(STORAGE_KEY);
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
            localStorage.setItem(STORAGE_KEY, sbx.sandboxId); // persist for refresh recovery
            addLog('✓ Sandbox ready\n');

            setPhase('writing');
            addLog(`Writing ${Object.keys(files).length} files…\n`);
            await Promise.all(
                Object.entries(files).map(([p, c]) => sbx.files.write(`${PROJECT_DIR}/${p}`, c)),
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
            sbx.commands.run(runCommand, {
                cwd: PROJECT_DIR,
                onStdout: d => appendLog(d),
                onStderr: d => appendLog(d, 'err'),
            });

            await new Promise(r => setTimeout(r, 3000));
            const url = `https://${sbx.getHost(port)}`;
            setPreviewUrl(url);
            setPhase('running');
            addLog(`\n✓ Preview → ${url}\n`);

        } catch (err) {
            setPhase('error');
            addLog(`\nError: ${err.message}\n`, 'err');
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // ── Pause ─────────────────────────────────────────────────────────────────────
    const pause = useCallback(async () => {
        if (!sbxRef.current || phase !== 'running') return;
        try {
            setPhase('pausing');
            addLog('\n[Pausing sandbox…]\n');
            await sbxRef.current.pause();
            sbxRef.current = null;
            setPhase('paused');
            addLog('[Paused — billing stopped]\n');
        } catch (err) {
            setPhase('running');
            addLog(`[Pause failed: ${err.message}]\n`, 'err');
        }
    }, [phase]);

    // ── Resume ────────────────────────────────────────────────────────────────────
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
            addLog('[Resumed — refresh preview]\n');
        } catch (err) {
            setPhase('idle');
            sbxIdRef.current = null;
            localStorage.removeItem(STORAGE_KEY);
            addLog(`[Resume failed: ${err.message} — click Run to restart]\n`, 'err');
        }
    }, []);

    // ── Stop ──────────────────────────────────────────────────────────────────────
    const stop = useCallback(async () => {
        sbxIdRef.current = null;
        localStorage.removeItem(STORAGE_KEY);
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