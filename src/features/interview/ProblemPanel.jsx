// ── Static task + issue data ──────────────────────────────────────────────────
const TASK = {
    title: 'Todo REST API',
    description: 'Build a REST API for managing todos using Node.js and Express.',
    issues: [
        {
            id: 1,
            title: 'Basic CRUD Endpoints',
            description:
                'Implement GET /api/todos, POST /api/todos, PUT /api/todos/:id, and DELETE /api/todos/:id. Each todo should have id, title, done, and createdAt fields.',
        },
        {
            id: 2,
            title: 'Input Validation & Error Handling',
            description:
                "Return 400 for missing or empty title. Return 404 for non-existent IDs. All errors should return JSON with an 'error' field.",
        },
    ],
    totalTestCount: 10,
};

// ── ProblemPanel ──────────────────────────────────────────────────────────────
export function ProblemPanel({ testResults = {}, isRunning = false, summary = null, onRunTests }) {
    return (
        <div style={{ backgroundColor: '#1e1e1e', borderRight: '1px solid #3c3c3c' }}
             className="h-full flex flex-col">

            {/* ── Non-scrollable header ── */}
            <div style={{ borderBottom: '1px solid #3c3c3c' }} className="px-5 py-4 flex-shrink-0">
                <p style={{ color: '#858585', letterSpacing: '0.1em' }}
                   className="text-[10px] font-semibold uppercase mb-3">
                    Question Description
                </p>
                <h2 style={{ color: '#cccccc' }} className="text-[15px] font-semibold leading-snug mb-2">
                    {TASK.title}
                </h2>
                <p style={{ color: '#9d9d9d' }} className="text-[12px] leading-relaxed">
                    {TASK.description}
                </p>
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>

                {/* YOUR TASK section */}
                <p style={{ color: '#858585', letterSpacing: '0.1em' }}
                   className="text-[10px] font-semibold uppercase mb-3">
                    Your Task
                </p>

                {/* Bullet list of issues */}
                {TASK.issues.map(issue => (
                    <div key={issue.id} className="flex items-start gap-2 mb-4">
                        {/* Blue dot */}
                        <span style={{ backgroundColor: '#569cd6' }}
                              className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" />
                        <div>
                            <span style={{ color: '#cccccc' }}
                                  className="text-[12px] font-semibold block mb-0.5">
                                {issue.title}
                            </span>
                            <p style={{ color: '#9d9d9d' }} className="text-[11px] leading-relaxed">
                                {issue.description}
                            </p>
                        </div>
                    </div>
                ))}

                {/* ── TEST CASES section ── */}
                <div style={{ borderTop: '1px solid #3c3c3c' }} className="pt-4 mt-2">
                    <p style={{ color: '#858585', letterSpacing: '0.1em' }}
                       className="text-[10px] uppercase mb-2">
                        Test Cases
                    </p>
                    <p style={{ color: '#9d9d9d' }} className="text-[11px] mb-3">
                        {TASK.totalTestCount} automated test cases
                    </p>
                    <button
                        onClick={onRunTests}
                        disabled={isRunning}
                        style={{
                            border: '1px solid #3c3c3c',
                            color: isRunning ? '#569cd6' : '#858585',
                            backgroundColor: 'transparent',
                        }}
                        onMouseEnter={e => {
                            if (!isRunning) {
                                e.currentTarget.style.borderColor = '#569cd6';
                                e.currentTarget.style.color = '#569cd6';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isRunning) {
                                e.currentTarget.style.borderColor = '#3c3c3c';
                                e.currentTarget.style.color = '#858585';
                            }
                        }}
                        className="w-full py-2 rounded text-[12px] font-medium
                                   transition-colors cursor-pointer
                                   disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRunning ? 'Running…' : 'Run Tests'}
                    </button>
                </div>
            </div>
        </div>
    );
}
