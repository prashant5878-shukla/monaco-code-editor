import { Icons } from '../lib/icons';

export function PreviewPanel({ onClose }) {
  return (
    <div className="flex flex-col h-full bg-background border-l border-border-subtle w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border-subtle flex-shrink-0 bg-sidebar">
        <div className="flex items-center gap-2">
          <Icons.MonitorPlay className="w-4 h-4 text-accent" />
          <span className="text-xs font-semibold text-secondary font-sans">Preview</span>
        </div>

        <div className="flex items-center gap-1">
          <button className="flex items-center justify-center w-6 h-6 rounded bg-transparent border-none cursor-pointer text-muted hover:bg-hover hover:text-primary transition-colors">
            <Icons.RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center justify-center w-6 h-6 rounded bg-transparent border-none cursor-pointer text-muted hover:bg-hover hover:text-primary transition-colors">
            <Icons.ExternalLink className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 rounded bg-transparent border-none cursor-pointer text-muted hover:bg-hover hover:text-primary transition-colors"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 bg-white overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-3 select-none">
          <Icons.Layout className="w-12 h-12 text-gray-200" />
          <p className="text-sm font-medium">Live Preview</p>
          <p className="text-xs text-gray-400">Waiting for dev server...</p>
        </div>
      </div>
    </div>
  );
}
