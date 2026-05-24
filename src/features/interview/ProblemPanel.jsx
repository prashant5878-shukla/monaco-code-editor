import { useEffect, useState } from 'react';
import { SCENARIO_1_TESTS, SCENARIO_2_TESTS } from '../../lib/testCases';

// ── Static problem data ───────────────────────────────────────────────────────
const SCENARIOS_DATA = {
    1: {
        title: 'React Todo App — Basic CRUD',
        difficulty: 'Medium',
        description:
            'Build a React todo app using useState.\nNo backend required — all state is in memory.\nYour components must use specific data-testid attributes for automated testing.',
        requirements: [
            'data-testid="todo-input"  — text input for new todo title',
            'data-testid="add-btn"     — button to add the todo',
            'data-testid="todo-list"   — the <ul> wrapping all todos',
            'data-testid="todo-item"   — each individual <li> todo',
            'data-testid="todo-title"  — the title text inside each todo',
            'data-testid="toggle-btn"  — button to mark a todo done/undone',
            'data-testid="delete-btn"  — button to delete a todo',
            'data-testid="empty-state" — shown only when no todos exist',
            'data-testid="todo-count"  — shows total e.g. "3 todos"',
            'Done todos must have CSS class "done" on the todo-item element',
            'Input must clear after adding a todo',
            'Empty or whitespace-only titles must NOT create a todo',
        ],
        exampleRequest: `<input data-testid="todo-input" />
<button data-testid="add-btn">Add</button>
<p data-testid="empty-state">No todos yet</p>
<ul data-testid="todo-list">
  <li data-testid="todo-item" class="done">
    <span data-testid="todo-title">Buy milk</span>
    <button data-testid="toggle-btn">✓</button>
    <button data-testid="delete-btn">×</button>
  </li>
</ul>
<p data-testid="todo-count">1 todo</p>`,
        exampleResponse: null,  // no HTTP response for UI challenge
        tests: SCENARIO_1_TESTS,
    },
    2: {
        title: 'React Todo App — Edge Cases & Interactions',
        difficulty: 'Hard',
        description:
            'Extend your todo app to handle edge cases and more complex interactions.\nSame data-testids apply. Scenario 1 must be fully passing first.',
        requirements: [
            'Pressing Enter in the input should add the todo',
            'Whitespace-only titles must be rejected silently (no todo added)',
            'Todo count must update correctly on add and delete',
            'Todos must render in insertion order',
            'Toggling done twice returns to undone state',
            'Deleting one todo from many must keep the others intact',
        ],
        exampleRequest: `// Enter key adds todo
<input
  data-testid="todo-input"
  onKeyDown={e => e.key === 'Enter' && addTodo()}
/>`,
        exampleResponse: null,
        tests: SCENARIO_2_TESTS,
    },
};


// ── Style maps ────────────────────────────────────────────────────────────────
const DIFFICULTY_STYLES = {
    Easy:   'bg-success/10 text-success',
    Medium: 'bg-warning/10 text-warning',
    Hard:   'bg-danger/10 text-danger',
};

const STATUS_DOT = {
    pass:    'bg-success',
    fail:    'bg-danger',
    pending: 'bg-muted/30',
    running: 'bg-warning animate-pulse',
};

const STATUS_LABEL = {
    pass:    'text-success',
    fail:    'text-danger',
    pending: 'text-muted',
    running: 'text-warning',
};

// ── Summary bar ───────────────────────────────────────────────────────────────
function SummaryBar({ summary, scenarioNum }) {
    if (!summary) return null;
    const allPass = summary.passed === summary.total;
    return (
        <div className={`px-4 py-2 text-[11px] font-medium border-b border-border-subtle
                         ${allPass ? 'bg-success/8 text-success' : 'bg-warning/8 text-warning'}`}>
            {allPass
                ? `${summary.passed}/${summary.total} passed · Scenario ${scenarioNum} complete ✓`
                : `${summary.passed}/${summary.total} passed · ${summary.failed} failing`}
        </div>
    );
}

// ── Tests tab ─────────────────────────────────────────────────────────────────
function TestsTab({ activeScenario, testResults, isRunning, summary, onRunTests }) {
    const [expanded, setExpanded] = useState(null);

    const tests = SCENARIOS_DATA[activeScenario]?.tests ?? [];

    return (
        <div className="flex flex-col flex-1 min-h-0">

            {/* Summary bar */}
            <SummaryBar summary={summary} scenarioNum={activeScenario} />

            {/* Test rows */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {tests.map(tc => {
                    const result = testResults[tc.id];
                    const status = result?.status ?? 'pending';
                    const isFail = status === 'fail';
                    const isOpen = expanded === tc.id;

                    return (
                        <div key={tc.id}>
                            {/* Row */}
                            <div
                                onClick={() => isFail && setExpanded(e => e === tc.id ? null : tc.id)}
                                className={`flex items-center gap-3 px-4 py-2.5 border-b border-border-subtle
                                            ${isFail ? 'cursor-pointer hover:bg-hover' : ''}
                                            ${isOpen  ? 'bg-danger/5' : ''}`}
                            >
                                {/* Status dot */}
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />

                                {/* Test name */}
                                <span className="text-[12px] text-primary flex-1 select-none leading-snug">
                                    {tc.name}
                                </span>

                                {/* Duration */}
                                {result?.duration != null && (
                                    <span className="text-[10px] text-muted font-mono flex-shrink-0">
                                        {result.duration}ms
                                    </span>
                                )}

                                {/* Status label */}
                                <span className={`text-[11px] font-mono uppercase tracking-wide flex-shrink-0
                                                  ${STATUS_LABEL[status]}`}>
                                    {status}
                                </span>

                                {/* Expand chevron */}
                                {isFail && (
                                    <span className={`text-muted text-[10px] transition-transform duration-150
                                                      ${isOpen ? 'rotate-90' : ''}`}>
                                        ›
                                    </span>
                                )}
                            </div>

                            {/* Expanded error */}
                            {isOpen && result?.error && (
                                <div className="bg-danger/5 border-l-2 border-danger px-4 py-2">
                                    <pre className="font-mono text-[11px] text-danger whitespace-pre-wrap leading-relaxed">
                                        {result.error}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Run Tests button */}
            <div className="px-4 py-3 border-t border-border-subtle flex-shrink-0">
                <button
                    onClick={onRunTests}
                    disabled={isRunning}
                    className="w-full px-3 py-2 text-[12px] font-medium
                               bg-accent/10 text-accent border border-accent/20 rounded
                               hover:bg-accent/20 transition-colors cursor-pointer
                               disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRunning ? 'Running…' : 'Run Tests'}
                </button>
            </div>
        </div>
    );
}

// ── Scenario content ──────────────────────────────────────────────────────────
function ScenarioContent({ scenarioNum }) {
    const sc = SCENARIOS_DATA[scenarioNum];
    if (!sc) return null;

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
            <p className="text-base font-bold text-primary leading-snug">{sc.title}</p>
            <p className="text-[12px] text-secondary leading-relaxed whitespace-pre-line">
                {sc.description}
            </p>

            <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">
                    Requirements
                </p>
                <ul className="space-y-1.5">
                    {sc.requirements.map((req, i) => (
                        <li key={i} className="border-l-2 border-accent/50 pl-3
                                               text-[12px] text-secondary leading-relaxed">
                            {req}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    Example
                </p>
                <pre className="bg-background border border-border-subtle rounded-lg
                                font-mono text-[12px] p-3 text-secondary
                                whitespace-pre-wrap leading-relaxed overflow-x-auto
                                mb-1.5">
                    {sc.exampleRequest}
                </pre>
                {sc.exampleResponse && (
                    <pre className="bg-background border border-border-subtle rounded-lg
                                    font-mono text-[12px] p-3 text-success/80
                                    whitespace-pre-wrap leading-relaxed overflow-x-auto">
                        {sc.exampleResponse}
                    </pre>
                )}
            </div>
        </div>
    );
}

// ── ProblemPanel ──────────────────────────────────────────────────────────────
// Props:
//   activeTestTab     — when truthy, jumps to Tests tab
//   onRunTests        — () => void  — triggers test run in EditorPage
//   testResults       — { [testId]: { id, name, status, duration, error } }
//   isRunning         — boolean
//   summary           — { total, passed, failed } | null
//   scenario1Complete — boolean — whether all scenario 1 tests pass
export function ProblemPanel({
    activeTestTab,
    onRunTests,
    testResults    = {},
    isRunning      = false,
    summary        = null,
    scenario1Complete = false,
}) {
    // 0 = Scenario 1, 1 = Scenario 2, 2 = Tests
    const [activeTab,      setActiveTab]      = useState(activeTestTab ? 2 : 0);
    const [activeScenario, setActiveScenario] = useState(1);
    const [lockedMsg,      setLockedMsg]      = useState(false);

    // Jump to Tests tab when parent signals Run Tests
    useEffect(() => {
        if (activeTestTab) setActiveTab(2);
    }, [activeTestTab]);

    function handleTabClick(tabIdx) {
        if (tabIdx === 1 && !scenario1Complete) {
            setLockedMsg(true);
            setTimeout(() => setLockedMsg(false), 2500);
            return;
        }
        setActiveTab(tabIdx);
        if (tabIdx < 2) setActiveScenario(tabIdx + 1);
    }

    const sc = SCENARIOS_DATA[activeScenario];
    const difficultyBadge = sc && activeTab !== 2
        ? (DIFFICULTY_STYLES[sc.difficulty] ?? 'bg-muted/10 text-muted')
        : null;

    const tabDefs = [
        {
            label:  scenario1Complete ? '✓ Scenario 1' : 'Scenario 1',
            locked: false,
        },
        {
            label:  '🔒 Scenario 2',
            locked: !scenario1Complete,
        },
        {
            label:  'Tests',
            locked: false,
        },
    ];

    return (
        <div className="w-full h-full flex flex-col bg-sidebar overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-4 h-10
                            border-b border-border-subtle flex-shrink-0">
                <span className="text-xs font-semibold text-secondary uppercase tracking-widest">
                    Problem
                </span>
                {difficultyBadge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${difficultyBadge}`}>
                        {sc.difficulty}
                    </span>
                )}
            </div>

            {/* Tab bar */}
            <div className="flex flex-shrink-0 border-b border-border-subtle relative">
                {tabDefs.map(({ label, locked }, i) => {
                    const isActive = i === activeTab;
                    return (
                        <button
                            key={i}
                            title={locked ? 'Complete Scenario 1 first — pass all 10 tests' : undefined}
                            onClick={() => handleTabClick(i)}
                            className={`relative flex-1 px-2 py-2 text-[11px] font-medium border-none
                                        transition-colors whitespace-nowrap
                                        ${locked
                                            ? 'opacity-50 text-muted cursor-not-allowed'
                                            : isActive
                                                ? 'bg-editor text-primary cursor-pointer'
                                                : 'bg-sidebar text-muted hover:text-secondary hover:bg-editor/50 cursor-pointer'
                                        }`}
                        >
                            {label}
                            {isActive && (
                                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />
                            )}
                        </button>
                    );
                })}

                {/* Inline locked message */}
                {lockedMsg && (
                    <div className="absolute top-full left-0 right-0 z-20
                                    bg-background border border-warning/40 text-warning
                                    text-[11px] px-3 py-2 leading-snug shadow-lg">
                        Complete Scenario 1 first — pass all 10 tests
                    </div>
                )}
            </div>

            {/* Content */}
            {activeTab === 2 ? (
                <TestsTab
                    activeScenario={activeScenario}
                    testResults={testResults}
                    isRunning={isRunning}
                    summary={summary}
                    onRunTests={onRunTests}
                />
            ) : (
                <ScenarioContent scenarioNum={activeTab + 1} />
            )}
        </div>
    );
}
