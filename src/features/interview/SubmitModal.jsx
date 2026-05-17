import { Icons } from '../../lib/icons';

export function SubmitModal({ timeRemaining, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                    flex items-center justify-center">
            <div className="bg-sidebar border border-border-subtle rounded-xl
                      p-6 w-[420px] shadow-2xl">

                <div className="flex items-center justify-center w-12 h-12 rounded-xl
                        bg-accent/10 border border-accent/20 mb-4">
                    <Icons.Send className="w-5 h-5 text-accent" />
                </div>

                <h2 className="text-base font-semibold text-primary mb-1">
                    Submit your solution?
                </h2>
                <p className="text-sm text-secondary mb-5 leading-relaxed">
                    You'll move on to 2 viva questions about your code.
                    This cannot be undone.
                </p>

                {/* Score breakdown */}
                <div className="bg-background border border-border-subtle rounded-lg p-3 mb-5 space-y-2">
                    <p className="text-[11px] text-muted uppercase tracking-wider mb-2">Score breakdown</p>
                    {[
                        { icon: '🧪', label: 'Test cases', pct: '30%' },
                        { icon: '🔍', label: 'Lighthouse audit', pct: '30%' },
                        { icon: '📋', label: 'Process analysis', pct: '20%' },
                        { icon: '🎤', label: 'Viva questions', pct: '20%' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span>{item.icon}</span>
                                <span className="text-xs text-secondary">{item.label}</span>
                            </div>
                            <span className="text-[11px] font-mono text-muted">{item.pct}</span>
                        </div>
                    ))}
                </div>

                {timeRemaining && (
                    <p className="text-[11px] text-muted text-center mb-4">
                        Time remaining: <span className="font-mono text-primary">{timeRemaining}</span>
                    </p>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 text-sm text-secondary bg-transparent
                       border border-border-subtle rounded-lg cursor-pointer
                       hover:bg-hover hover:text-primary transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-2 text-sm font-medium text-white bg-accent
                       rounded-lg border-none cursor-pointer
                       hover:bg-accent-hover transition-colors"
                    >
                        Submit &amp; Continue
                    </button>
                </div>
            </div>
        </div>
    );
}