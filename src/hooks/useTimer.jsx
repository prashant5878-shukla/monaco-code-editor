import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown timer.
 * @param {number} durationMinutes  — how long the session runs
 * @param {function} onExpire       — called when timer hits zero
 */
export function useTimer(durationMinutes = 45, onExpire) {
    const totalSeconds = durationMinutes * 60;
    const [remaining, setRemaining] = useState(totalSeconds);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef(null);
    const onExpireRef = useRef(onExpire);

    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    const start = useCallback(() => {
        setRunning(true);
    }, []);

    const stop = useCallback(() => {
        setRunning(false);
        clearInterval(intervalRef.current);
    }, []);

    const reset = useCallback(() => {
        stop();
        setRemaining(totalSeconds);
    }, [stop, totalSeconds]);

    useEffect(() => {
        if (!running) return;

        intervalRef.current = setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    setRunning(false);
                    onExpireRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [running]);

    // Format as MM:SS
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    const display = `${minutes}:${seconds}`;

    // Warning thresholds
    const isWarning = remaining <= 300 && remaining > 60;  // last 5 min
    const isDanger = remaining <= 60;                      // last 1 min
    const isExpired = remaining === 0;
    const percentage = (remaining / totalSeconds) * 100;

    return {
        display, remaining, percentage,
        isWarning, isDanger, isExpired,
        running, start, stop, reset,
    };
}