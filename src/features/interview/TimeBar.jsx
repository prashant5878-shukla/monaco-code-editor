import { Icons } from '../../lib/icons';

export function TimerBar({ display, isWarning, isDanger, onSubmit, onRunTests }) {
    return (
        <div className={`relative flex items-center justify-between px-5 h-11 flex-shrink-0
                         border-b border-border-subtle transition-all duration-300
                         ${isDanger
                ? 'bg-danger/15 animate-pulse border-danger/30'
                : isWarning
                    ? 'bg-warning/10 border-warning/20'
                    : 'bg-sidebar'}`}
        >
            {/* Left: problem info */}
            <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-primary tracking-tight">
                    Todo REST API
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border
                    ${isDanger
                        ? 'bg-danger/10 text-danger border-danger/25'
                        : isWarning
                            ? 'bg-warning/10 text-warning border-warning/25'
                            : 'bg-warning/8 text-warning border-warning/15'}`}
                >
                    Medium
                </span>
            </div>

            {/* Center: timer — absolutely centered in the bar */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <Icons.Play className={`w-3.5 h-3.5 flex-shrink-0
                    ${isDanger ? 'text-danger' : isWarning ? 'text-warning' : 'text-muted'}`}
                />
                <span className={`text-lg font-bold font-mono tabular-nums tracking-tight
                    ${isDanger
                        ? 'text-danger'
                        : isWarning
                            ? 'text-warning'
                            : 'text-primary'}`}
                >
                    {display}
                </span>
            </div>

            {/* Right: Run Tests + Submit */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onRunTests}
                    className="flex items-center gap-1.5 px-3 h-7 text-xs font-semibold
                               border border-accent text-accent rounded-full
                               hover:bg-accent/10 transition-colors cursor-pointer
                               bg-transparent"
                >
                    <Icons.FlaskConical className="w-3 h-3" />
                    Run Tests
                </button>

                <button
                    onClick={onSubmit}
                    className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold
                               bg-accent text-white rounded-full border-none cursor-pointer
                               shadow-md shadow-accent/30
                               hover:bg-accent-hover hover:shadow-accent/50
                               active:scale-95 transition-all duration-150"
                >
                    <Icons.Send className="w-3 h-3" />
                    Submit
                </button>
            </div>
        </div>
    );
}