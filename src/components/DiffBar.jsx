import { Icons } from '../lib/icons';

export function DiffBar({ pendingChange, additions, deletions, onAccept, onReject }) {
    if (!pendingChange) return null;

    const fileName = pendingChange.filePath.split('/').pop();

    return (
        <div className="flex items-center justify-between px-4 h-9 flex-shrink-0
                    bg-[rgba(72,199,116,0.05)] border-b border-success/20">

            {/* Left: file + stats */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
                    <span className="text-xs font-mono text-primary font-medium">{fileName}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                    {additions > 0 && (
                        <span className="text-success font-mono">+{additions}</span>
                    )}
                    {deletions > 0 && (
                        <span className="text-danger font-mono">-{deletions}</span>
                    )}
                    {additions === 0 && deletions === 0 && (
                        <span className="text-muted">{pendingChange.changedLines.length} lines modified</span>
                    )}
                </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center">
                <button
                    onClick={onAccept}
                    className="flex items-center gap-1.5 px-3 h-7 text-[12px] font-medium rounded-md
                     text-success hover:bg-success/10 transition-colors cursor-pointer border-none bg-transparent"
                >
                    <Icons.Check className="w-3.5 h-3.5" />
                    Accept
                </button>

                <div className="w-px h-3.5 bg-border-subtle mx-1" />

                <button
                    onClick={onReject}
                    className="flex items-center gap-1.5 px-3 h-7 text-[12px] font-medium rounded-md
                     text-danger hover:bg-danger/10 transition-colors cursor-pointer border-none bg-transparent"
                >
                    <Icons.X className="w-3.5 h-3.5" />
                    Reject
                </button>
            </div>
        </div>
    );
}