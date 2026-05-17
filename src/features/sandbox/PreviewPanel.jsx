import { useRef, useState, useEffect } from 'react';
import { Icons } from '../../lib/icons';

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  idle: { label: 'Not running', dotClass: 'bg-muted' },
  creating: { label: 'Creating…', dotClass: 'bg-warning animate-pulse' },
  writing: { label: 'Writing…', dotClass: 'bg-warning animate-pulse' },
  installing: { label: 'Installing…', dotClass: 'bg-warning animate-pulse' },
  starting: { label: 'Starting…', dotClass: 'bg-warning animate-pulse' },
  running: { label: 'Running', dotClass: 'bg-success' },
  pausing: { label: 'Pausing…', dotClass: 'bg-warning animate-pulse' },
  paused: { label: 'Paused', dotClass: 'bg-muted' },
  resuming: { label: 'Resuming…', dotClass: 'bg-warning animate-pulse' },
  error: { label: 'Error', dotClass: 'bg-danger' },
};

// ── Terminal log ──────────────────────────────────────────────────────────────
function TerminalLog({ logs, onClear }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle flex-shrink-0">
        <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Output</span>
        <button
          onClick={onClear}
          className="text-[11px] text-muted hover:text-primary transition-colors"
        >
          Clear
        </button>
      </div>
      <pre className="flex-1 overflow-y-auto px-4 py-3 text-[12px] font-mono leading-relaxed whitespace-pre-wrap no-scrollbar">
        {logs.length === 0
          ? <span className="text-muted">Run a project to see output…</span>
          : logs.map((l, i) => (
            <span key={i} className={l.type === 'err' ? 'text-danger' : 'text-secondary'}>
              {l.text}
            </span>
          ))
        }
        <div ref={bottomRef} />
      </pre>
    </div>
  );
}

// ── Empty / paused / stopped state ───────────────────────────────────────────
function IdleState({ phase, onRun, onResume, isBusy, canResume }) {
  const isPaused = phase === 'paused';

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background select-none">
      <Icons.Layout className="w-14 h-14 text-muted opacity-20" />
      <div className="text-center">
        <p className="text-sm font-medium text-secondary">
          {isPaused ? 'Preview paused' : 'Live Preview'}
        </p>
        <p className="text-xs text-muted mt-0.5">
          {isPaused
            ? 'Sandbox is paused — billing stopped'
            : 'Start a sandbox to see your app here'}
        </p>
      </div>
      {isPaused && canResume ? (
        <button
          onClick={onResume}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     bg-accent text-white hover:bg-accent-hover transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icons.Play className="w-3.5 h-3.5" />
          Resume
        </button>
      ) : (
        <button
          onClick={onRun}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                     bg-accent text-white hover:bg-accent-hover transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icons.Play className="w-3.5 h-3.5" />
          Run
        </button>
      )}
    </div>
  );
}

// ── PreviewPanel ──────────────────────────────────────────────────────────────
export function PreviewPanel({
  phase, previewUrl, logs,
  onRun, onStop, onResume, onClose, onClearLogs,
  isBusy, isRunning, canResume,
}) {
  const iframeRef = useRef(null);
  const [tab, setTab] = useState('preview');
  const status = STATUS[phase] ?? STATUS.idle;
  const showIframe = isRunning && previewUrl;

  function refresh() {
    if (iframeRef.current) iframeRef.current.src = previewUrl;
  }

  return (
    <div className="flex flex-col h-full bg-background border-l border-border-subtle">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border-subtle flex-shrink-0 bg-sidebar">

        {/* Left: icon + tabs + status */}
        <div className="flex items-center gap-3">
          <Icons.MonitorPlay className="w-4 h-4 text-accent flex-shrink-0" />

          <div className="flex items-center">
            {['preview', 'terminal'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-2.5 h-7 text-[11px] font-medium capitalize rounded-md transition-colors
                  ${tab === t ? 'bg-active text-primary' : 'text-muted hover:text-secondary'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dotClass}`} />
            <span className="text-[11px] text-muted">{status.label}</span>
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-0.5">
          {isRunning || isBusy ? (
            <button
              onClick={onStop}
              disabled={isBusy}
              title="Stop sandbox"
              className="flex items-center gap-1.5 px-2 h-6 text-[11px] font-medium rounded
                         text-danger hover:bg-danger/10 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icons.Square className="w-3 h-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={isBusy}
              title="Run project"
              className="flex items-center gap-1.5 px-2 h-6 text-[11px] font-medium rounded
                         text-success hover:bg-success/10 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Icons.Play className="w-3 h-3" />
              Run
            </button>
          )}

          {showIframe && (
            <>
              <button
                onClick={refresh}
                title="Refresh preview"
                className="flex items-center justify-center w-6 h-6 rounded text-muted
                           hover:bg-hover hover:text-primary transition-colors"
              >
                <Icons.RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => window.open(previewUrl, '_blank')}
                title="Open in new tab"
                className="flex items-center justify-center w-6 h-6 rounded text-muted
                           hover:bg-hover hover:text-primary transition-colors"
              >
                <Icons.ExternalLink className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {onClose && (
            <button
              onClick={onClose}
              title="Close preview"
              className="flex items-center justify-center w-6 h-6 rounded text-muted
                         hover:bg-hover hover:text-primary transition-colors"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden relative">
        {/* Preview */}
        <div className={`absolute inset-0 ${tab === 'preview' ? '' : 'hidden'}`}>
          {showIframe ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="App preview"
              className="w-full h-full border-none bg-white"
            />
          ) : (
            <IdleState
              phase={phase}
              onRun={onRun}
              onResume={onResume}
              isBusy={isBusy}
              canResume={canResume}
            />
          )}
        </div>

        {/* Terminal */}
        <div className={`absolute inset-0 ${tab === 'terminal' ? '' : 'hidden'}`}>
          <TerminalLog logs={logs} onClear={onClearLogs} />
        </div>
      </div>
    </div>
  );
}