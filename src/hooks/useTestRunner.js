import { useCallback, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000';

/**
 * useTestRunner — manages the SSE connection to the backend test runner.
 *
 * Returns:
 *   results    — { [testId]: { id, name, status, duration, error } }
 *   isRunning  — true while SSE stream is open
 *   summary    — { total, passed, failed } | null — set when stream completes
 *   runTests({ scenarioId, sandboxUrl }) — opens SSE, streams results
 *   resetResults() — clears all state
 */
export function useTestRunner() {
    const [results,   setResults]   = useState({});
    const [isRunning, setIsRunning] = useState(false);
    const [summary,   setSummary]   = useState(null);

    const runTests = useCallback(({ scenarioId, sandboxUrl }) => {
        if (!sandboxUrl) return;
        if (isRunning) return;

        setIsRunning(true);
        setSummary(null);

        const params = new URLSearchParams({ scenarioId: String(scenarioId), sandboxUrl });
        const es = new EventSource(`${BACKEND_URL}/api/run-tests?${params}`);

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'complete') {
                    setSummary({ total: data.total, passed: data.passed, failed: data.failed });
                    setIsRunning(false);
                    es.close();
                    return;
                }

                if (data.type === 'error') {
                    setIsRunning(false);
                    es.close();
                    return;
                }

                // Individual test result
                setResults(prev => ({ ...prev, [data.id]: data }));
            } catch {
                // Ignore parse errors
            }
        };

        es.onerror = () => {
            setIsRunning(false);
            es.close();
        };
    }, [isRunning]);

    const resetResults = useCallback(() => {
        setResults({});
        setSummary(null);
        setIsRunning(false);
    }, []);

    return { results, isRunning, summary, runTests, resetResults };
}
