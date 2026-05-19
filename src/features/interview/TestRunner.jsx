import { useState } from 'react';

// ── Mock test cases ───────────────────────────────────────────────────────────
const INITIAL_TESTS = [
  { id: 1, name: 'GET returns array',    status: 'pass'    },
  { id: 2, name: 'POST creates item',    status: 'fail'    },
  { id: 3, name: 'DELETE removes item',  status: 'pending' },
  { id: 4, name: 'Handles 400 on empty', status: 'pending' },
];

const STATUS_STYLES = {
  pending: 'bg-muted/10 text-muted',
  pass:    'bg-success/10 text-success',
  fail:    'bg-danger/10 text-danger',
  running: 'bg-warning/10 text-warning animate-pulse',
};

const STATUS_DOT = {
  pending: '○',
  pass:    '●',
  fail:    '●',
  running: '●',
};

// ── TestRunner ────────────────────────────────────────────────────────────────
export function TestRunner() {
  const [tests, setTests] = useState(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);

  function handleRunTests() {
    if (isRunning) return;
    setIsRunning(true);

    // Set all pending → running
    setTests(prev =>
      prev.map(t => t.status === 'pending' ? { ...t, status: 'running' } : t)
    );

    // After 1500 ms resolve running → pass | fail (random)
    setTimeout(() => {
      setTests(prev =>
        prev.map(t =>
          t.status === 'running'
            ? { ...t, status: Math.random() > 0.4 ? 'pass' : 'fail' }
            : t
        )
      );
      setIsRunning(false);
    }, 1500);
  }

  return (
    <div className="h-10 flex-shrink-0 flex items-center justify-between
                    px-3 bg-sidebar border-b border-border-subtle gap-3">

      {/* Test case pills */}
      <div className="flex items-center gap-1.5 overflow-hidden">
        {tests.map(t => (
          <span
            key={t.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full
                        text-[11px] font-mono whitespace-nowrap flex-shrink-0
                        ${STATUS_STYLES[t.status]}`}
          >
            <span>{STATUS_DOT[t.status]}</span>
            {t.name}
          </span>
        ))}
      </div>

      {/* Run Tests button */}
      <button
        onClick={handleRunTests}
        disabled={isRunning}
        className="flex-shrink-0 px-3 h-6 text-[11px] font-medium
                   bg-accent/10 text-accent border border-accent/20 rounded
                   hover:bg-accent/20 transition-colors cursor-pointer
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Running…' : 'Run Tests'}
      </button>

    </div>
  );
}
