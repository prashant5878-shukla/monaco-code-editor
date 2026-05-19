import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { tickTimer, stopTimer } from '../store/interviewSlice';
import { SESSION_DURATION_MINUTES } from '../lib/constants';

/**
 * Countdown timer.
 * Reads timerRunning / timerRemaining from interviewSlice.
 * Keeps the setInterval locally — dispatches tickTimer() each second.
 * External API is identical to the original useTimer hook.
 *
 * @param {number} durationMinutes  — kept for API compatibility; actual
 *                                    duration is set in interviewSlice initial state
 * @param {function} onExpire       — called when timer hits zero
 */
export function useTimer(durationMinutes = SESSION_DURATION_MINUTES, onExpire) {
    const dispatch      = useDispatch();
    const timerRunning  = useSelector(s => s.interview.timerRunning);
    const remaining     = useSelector(s => s.interview.timerRemaining);

    const totalSeconds  = durationMinutes * 60;
    const intervalRef   = useRef(null);
    const onExpireRef   = useRef(onExpire);

    useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

    // The interval lives here — it dispatches to Redux on each tick
    useEffect(() => {
        if (!timerRunning) {
            clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            dispatch(tickTimer());
        }, 1000);

        return () => clearInterval(intervalRef.current);
    }, [timerRunning, dispatch]);

    // Fire onExpire when remaining hits 0
    useEffect(() => {
        if (remaining === 0 && !timerRunning) {
            onExpireRef.current?.();
        }
    }, [remaining, timerRunning]);

    // ── Convenience wrappers (same signatures as before) ─────────────────────
    const start = useCallback(() => {
        // startInterview is dispatched from EditorPage; start() is a no-op alias
        // kept so callers that call timer.start() still work when wired correctly.
        // EditorPage dispatches startInterview() which sets timerRunning = true.
    }, []);

    const stop = useCallback(() => {
        dispatch(stopTimer());
        clearInterval(intervalRef.current);
    }, [dispatch]);

    // Format as MM:SS
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    const display = `${minutes}:${seconds}`;

    const isWarning = remaining <= 300 && remaining > 60;
    const isDanger  = remaining <= 60;
    const isExpired = remaining === 0;
    const percentage = (remaining / totalSeconds) * 100;

    return {
        display, remaining, percentage,
        isWarning, isDanger, isExpired,
        running: timerRunning, start, stop,
    };
}