import { Icons } from '../../lib/icons';

// TimerBar — VS Code dark theme
// Props: { display, isWarning, isDanger, onSubmit, onRunTests, onRun, sandboxPhase }
export function TimerBar({ display, isWarning, isDanger, onSubmit, onRunTests, onRun, sandboxPhase }) {
    const isBusyOrRunning =
        sandboxPhase === 'running'   ||
        sandboxPhase === 'installing'||
        sandboxPhase === 'starting'  ||
        sandboxPhase === 'creating'  ||
        sandboxPhase === 'writing'   ||
        sandboxPhase === 'resuming'  ||
        sandboxPhase === 'pausing';

    const timerColor = isDanger ? '#f48771' : isWarning ? '#dcdcaa' : '#cccccc';

    return (
        <div
            style={{ backgroundColor: '#1e1e1e', borderBottom: '1px solid #3c3c3c' }}
            className="h-11 flex items-center justify-between px-5 flex-shrink-0"
        >
            {/* Left: problem title */}
            <span style={{ color: '#cccccc' }} className="text-[13px] font-semibold">
                Todo REST API
            </span>

            {/* Center: timer */}
            <div className="flex items-center gap-2">
                <Icons.Play
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: isDanger ? '#f48771' : '#858585' }}
                />
                <span
                    className={`text-[14px] font-mono font-semibold tabular-nums${isDanger ? ' animate-pulse' : ''}`}
                    style={{ color: timerColor }}
                >
                    {display}
                </span>
            </div>

            {/* Right: Run | Run Tests | Submit */}
            <div className="flex items-center gap-2">

                {/* Run / Stop */}
                <button
                    onClick={onRun}
                    style={isBusyOrRunning
                        ? { backgroundColor: 'transparent', border: '1px solid #f48771', color: '#f48771' }
                        : { backgroundColor: '#2ea043', border: 'none', color: '#ffffff' }
                    }
                    onMouseEnter={e => {
                        if (!isBusyOrRunning) e.currentTarget.style.backgroundColor = '#3fb950';
                    }}
                    onMouseLeave={e => {
                        if (!isBusyOrRunning) e.currentTarget.style.backgroundColor = '#2ea043';
                    }}
                    className="flex items-center gap-1.5 px-4 h-7 rounded text-[12px] font-semibold cursor-pointer transition-colors"
                >
                    {isBusyOrRunning
                        ? <Icons.Square className="w-3 h-3" />
                        : <Icons.Play  className="w-3 h-3" />
                    }
                    {isBusyOrRunning ? 'Stop' : 'Run'}
                </button>

                {/* Run Tests */}
                <button
                    onClick={onRunTests}
                    style={{ backgroundColor: 'transparent', border: '1px solid #3c3c3c', color: '#858585' }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#569cd6';
                        e.currentTarget.style.color = '#569cd6';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#3c3c3c';
                        e.currentTarget.style.color = '#858585';
                    }}
                    className="flex items-center gap-1.5 px-3 h-7 rounded text-[12px] font-medium cursor-pointer transition-colors"
                >
                    <Icons.FlaskConical className="w-3.5 h-3.5" />
                    Run Tests
                </button>

                {/* Submit */}
                <button
                    onClick={onSubmit}
                    style={{ backgroundColor: '#0078d4', border: 'none', color: '#ffffff' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#106ebe'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#0078d4'; }}
                    className="flex items-center gap-1.5 px-4 h-7 rounded text-[12px] font-semibold cursor-pointer transition-colors"
                >
                    <Icons.Send className="w-3 h-3" />
                    Submit
                </button>
            </div>
        </div>
    );
}