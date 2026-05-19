import { Sandbox } from 'e2b';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    setPhase,
    setPreviewUrl,
    addLog as addLogAction,
    appendLog as appendLogAction,
    clearLogs as clearLogsAction,
    resetSandbox,
} from '../store/sandboxSlice';
import { SANDBOX_STORAGE_KEY, PROJECT_DIR, SANDBOX_TIMEOUT_MS } from '../lib/constants';

// ── Kill stale sandbox from previous page load ────────────────────────────────
async function killStaleSandbox() {
    const staleId = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!staleId) return;
    localStorage.removeItem(SANDBOX_STORAGE_KEY);
    try {
        const sbx = await Sandbox.connect(staleId, {
            apiKey: import.meta.env.VITE_E2B_API_KEY,
        });
        await sbx.kill();
    } catch { /* already dead */ }
}

// ── Stdout patterns that signal the server is ready ───────────────────────────
// Matched against every stdout chunk from the run command.
// This avoids browser HTTP polling (CORS issues, E2B's own error pages, etc.)
const READY_PATTERNS = [
    'running on port',   // Express: "API running on port 3001"
    'ready in',          // Vite:    "ready in 179 ms"
    'local:',            // Vite:    "Local: http://localhost:5173/"
    'listening on',      // generic fallback
];

function isServerReady(chunk) {
    const lower = chunk.toLowerCase();
    return READY_PATTERNS.some(p => lower.includes(p));
}

export function useSandbox() {
    const dispatch = useDispatch();
    const { phase, previewUrl, logs } = useSelector(s => s.sandbox);

    const sbxRef = useRef(null);
    const sbxIdRef = useRef(null);
    const serverReadyRef = useRef(false); // set to true by stdout watcher

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    useEffect(() => { killStaleSandbox(); }, []);

    useEffect(() => {
        const handler = () => {
            if (sbxIdRef.current) localStorage.removeItem(SANDBOX_STORAGE_KEY);
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => () => {
        sbxRef.current?.kill().catch(() => { });
    }, []);

    // ── Logging helpers ───────────────────────────────────────────────────────
    function addLog(text, type = 'out') {
        dispatch(addLogAction({ text, type }));
    }
    function appendLog(text, type = 'out') {
        dispatch(appendLogAction({ text, type }));
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    const start = useCallback(async ({
        files, installCommand, runCommand, port = 5173, waitMs = 30000
    }) => {
        if (sbxRef.current) {
            await sbxRef.current.kill().catch(() => { });
            sbxRef.current = null;
        }
        sbxIdRef.current = null;
        serverReadyRef.current = false;
        localStorage.removeItem(SANDBOX_STORAGE_KEY);
        dispatch(clearLogsAction());
        dispatch(setPreviewUrl(null));

        try {
            dispatch(setPhase('creating'));
            addLog('Creating sandbox…\n');
            const sbx = await Sandbox.create({
                apiKey: import.meta.env.VITE_E2B_API_KEY,
                timeoutMs: SANDBOX_TIMEOUT_MS,
            });
            sbxRef.current = sbx;
            sbxIdRef.current = sbx.sandboxId;
            localStorage.setItem(SANDBOX_STORAGE_KEY, sbx.sandboxId);
            addLog('✓ Sandbox ready\n');

            dispatch(setPhase('writing'));
            addLog(`Writing ${Object.keys(files).length} files…\n`);
            await Promise.all(
                Object.entries(files).map(([p, c]) =>
                    sbx.files.write(`${PROJECT_DIR}/${p}`, c)
                ),
            );
            addLog('✓ Files written\n');

            if (installCommand) {
                dispatch(setPhase('installing'));
                addLog(`\n$ ${installCommand}\n`);
                const r = await sbx.commands.run(installCommand, {
                    cwd: PROJECT_DIR,
                    onStdout: d => appendLog(d),
                    onStderr: d => appendLog(d, 'err'),
                });
                if (r.exitCode !== 0) throw new Error(`Install failed (exit ${r.exitCode})`);
                addLog('\n✓ Dependencies installed\n');
            }

            dispatch(setPhase('starting'));
            addLog(`\n$ ${runCommand}\n`);

            // Start the server — watch stdout for the "ready" signal
            // instead of HTTP polling (avoids CORS, E2B error pages, etc.)
            sbx.commands.run(runCommand, {
                cwd: PROJECT_DIR,
                onStdout: d => {
                    appendLog(d);
                    if (isServerReady(d)) {
                        serverReadyRef.current = true;
                    }
                },
                onStderr: d => appendLog(d, 'err'),
            });

            // Wait until stdout signals ready or we time out
            addLog('\nWaiting for server to be ready…\n');
            const deadline = Date.now() + waitMs;
            while (!serverReadyRef.current && Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 500));
            }

            if (!serverReadyRef.current) {
                addLog('[Warning] Server ready signal not detected — trying anyway\n', 'err');
            }

            // Small extra wait for E2B's routing layer to catch up
            await new Promise(r => setTimeout(r, 1500));

            const url = `https://${sbx.getHost(port)}`;
            dispatch(setPreviewUrl(url));
            dispatch(setPhase('running'));
            addLog(`\n✓ Preview → ${url}\n`);

        } catch (err) {
            dispatch(setPhase('error'));
            addLog(`\nError: ${err.message}\n`, 'err');
            localStorage.removeItem(SANDBOX_STORAGE_KEY);
        }
    }, [dispatch]);

    // ── Pause ─────────────────────────────────────────────────────────────────
    const pause = useCallback(async () => {
        if (!sbxRef.current || phase !== 'running') return;
        try {
            dispatch(setPhase('pausing'));
            addLog('\n[Pausing sandbox…]\n');
            await sbxRef.current.pause();
            sbxRef.current = null;
            dispatch(setPhase('paused'));
            addLog('[Paused — billing stopped]\n');
        } catch (err) {
            dispatch(setPhase('running'));
            addLog(`[Pause failed: ${err.message}]\n`, 'err');
        }
    }, [phase, dispatch]);

    // ── Resume ────────────────────────────────────────────────────────────────
    const resume = useCallback(async () => {
        if (!sbxIdRef.current) return;
        try {
            dispatch(setPhase('resuming'));
            addLog('\n[Resuming sandbox…]\n');
            const sbx = await Sandbox.resume(sbxIdRef.current, {
                apiKey: import.meta.env.VITE_E2B_API_KEY,
                timeoutMs: SANDBOX_TIMEOUT_MS,
            });
            sbxRef.current = sbx;
            dispatch(setPhase('running'));
            addLog('[Resumed — refresh preview]\n');
        } catch (err) {
            dispatch(setPhase('idle'));
            sbxIdRef.current = null;
            localStorage.removeItem(SANDBOX_STORAGE_KEY);
            addLog(`[Resume failed: ${err.message} — click Run to restart]\n`, 'err');
        }
    }, [dispatch]);

    // ── Stop ──────────────────────────────────────────────────────────────────
    const stop = useCallback(async () => {
        sbxIdRef.current = null;
        serverReadyRef.current = false;
        localStorage.removeItem(SANDBOX_STORAGE_KEY);
        if (sbxRef.current) {
            await sbxRef.current.kill().catch(() => { });
            sbxRef.current = null;
        }
        dispatch(resetSandbox());
    }, [dispatch]);

    const clearLogs = useCallback(() => dispatch(clearLogsAction()), [dispatch]);

    return {
        phase, previewUrl, logs,
        start, pause, resume, stop, clearLogs,
        isRunning: phase === 'running',
        isPaused: phase === 'paused',
        isBusy: ['creating', 'writing', 'installing', 'starting', 'pausing', 'resuming'].includes(phase),
        canResume: phase === 'paused' && !!sbxIdRef.current,
    };
}