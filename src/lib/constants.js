// ── Chat / AI ─────────────────────────────────────────────────────────────────
export const CHAT_SUGGESTIONS = [
  "Add error handling to the fetch calls",
  "Add a loading spinner to App.jsx",
  "Convert class components to functional",
  "Add PropTypes to all components",
];

export const GENERATION_TRIGGERS = [
  "create",
  "generate",
  "build",
  "make",
  "add a new",
  "scaffold",
  "setup",
  "write a new",
  "implement a new",
];

// ── Monaco theme ──────────────────────────────────────────────────────────────
export const MONACO_THEME_NAME = "nocturne";

export const MONACO_THEME_CONFIG = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "4b5263", fontStyle: "italic" },
    { token: "keyword", foreground: "c678dd" },
    { token: "string", foreground: "98c379" },
    { token: "number", foreground: "d19a66" },
    { token: "type", foreground: "e5c07b" },
    { token: "function", foreground: "61afef" },
    { token: "variable", foreground: "e06c75" },
    { token: "variable.parameter", foreground: "e06c75" },
    { token: "delimiter", foreground: "abb2bf" },
    { token: "identifier", foreground: "abb2bf" },
    { token: "tag", foreground: "e06c75" },
    { token: "attribute.name", foreground: "d19a66" },
    { token: "attribute.value", foreground: "98c379" },
  ],
  colors: {
    "editor.background": "#0d1117",
    "editor.foreground": "#e6edf3",
    "editor.lineHighlightBackground": "#1e1e1e",
    "editor.selectionBackground": "#3b82f630",
    "editor.selectionHighlightBackground": "#3b82f618",
    "editorLineNumber.foreground": "#6e7681",
    "editorLineNumber.activeForeground": "#e6edf3",
    "editorCursor.foreground": "#3b82f6",
    "editorWhitespace.foreground": "#ffffff12",
    "editorIndentGuide.background": "#ffffff08",
    "editorIndentGuide.activeBackground": "#3b82f640",
    "scrollbarSlider.background": "#ffffff14",
    "scrollbarSlider.hoverBackground": "#ffffff22",
    "scrollbarSlider.activeBackground": "#3b82f660",
    "editorWidget.background": "#151515",
    "editorWidget.border": "#ffffff10",
    "editorSuggestWidget.background": "#151515",
    "editorSuggestWidget.border": "#ffffff10",
    "editorSuggestWidget.selectedBackground": "#3b82f620",
    "input.background": "#1e1e1e",
    "input.border": "#ffffff10",
    focusBorder: "#3b82f6",
    "list.hoverBackground": "#1e1e1e",
    "list.activeSelectionBackground": "#3b82f620",
  },
};

// ── Gemini / AI models ────────────────────────────────────────────────────────
export const GEMINI_MODEL = "gemini-2.5-flash";

export const SYSTEM_PROMPT = `You are a coding assistant inside a browser-based code editor.

You have tools to interact with the project:
- list_files: see what files exist
- read_file: read a file's content  
- edit_file: replace a file's entire content
- create_file: create a new file

When the user asks you to change or create code, USE THE TOOLS. 
Do NOT output JSON or code fences with file content — call edit_file or create_file instead.

After using tools, respond in plain text explaining what you did. Keep it brief.`;

// ── Monaco editor display ─────────────────────────────────────────────────────
export const EDITOR_FONT_FAMILY =
  "'JetBrains Mono','Fira Code',Consolas,monospace";
export const EDITOR_FONT_SIZE = 13.5;
export const EDITOR_LINE_HEIGHT = 22;
export const GUTTER_WIDTH = 63;

// ── Sandbox ───────────────────────────────────────────────────────────────────
export const SANDBOX_STORAGE_KEY = "e2b_active_sandbox_id";
export const PROJECT_DIR = "/home/user/project";
export const SANDBOX_TIMEOUT_MS = 10 * 60 * 1000;

// ── Interview / session ───────────────────────────────────────────────────────
export const SESSION_DURATION_MINUTES = 45;

// ─────────────────────────────────────────────────────────────────────────────
// Problem / Scenario / Test Case data
// Each top-level key maps to a future DB record ID.
// ─────────────────────────────────────────────────────────────────────────────

export const PROBLEMS = {
  "todo-api": {
    id: "todo-api",
    title: "Todo List API",
    difficulty: "Medium",
    timeLimit: 45,
    scenarios: ["todo-api-s1", "todo-api-s2"],
  },
};

export const SCENARIOS = {
  "todo-api-s1": {
    id: "todo-api-s1",
    problemId: "todo-api",
    order: 1,
    title: "Core CRUD",
    locked: false,
    description: `Build a REST API for a todo list using Node.js and Express.
Your API must store todos in memory (an array) and support 
full CRUD operations.`,
    requirements: [
      "GET /api/todos — return all todos as JSON array",
      "GET /api/todos/:id — return a single todo or 404 if not found",
      "POST /api/todos — create todo, body must have { title: string }. Return 400 if title missing",
      "PUT /api/todos/:id — update title or done status. Return 404 if not found",
      "DELETE /api/todos/:id — delete a todo. Return 404 if not found",
      "Each todo has: { id: number, title: string, done: boolean, createdAt: string }",
      "IDs must auto-increment starting from 1",
      "Return appropriate HTTP status codes for all operations",
    ],
    example: {
      request:
        'POST /api/todos\nContent-Type: application/json\n{ "title": "Buy groceries" }',
      response:
        '201 Created\n{\n  "id": 1,\n  "title": "Buy groceries",\n  "done": false,\n  "createdAt": "2024-01-15T10:30:00.000Z"\n}',
    },
    testCaseIds: [
      "tc-s1-1",
      "tc-s1-2",
      "tc-s1-3",
      "tc-s1-4",
      "tc-s1-5",
      "tc-s1-6",
    ],
  },

  "todo-api-s2": {
    id: "todo-api-s2",
    problemId: "todo-api",
    order: 2,
    title: "Filtering & Stats",
    locked: true, // unlocks when all scenario 1 tests pass
    description: `Extend your todo API with filtering, search, 
and a stats endpoint. Build on top of your Scenario 1 solution.`,
    requirements: [
      "GET /api/todos?done=true — filter by completion status",
      "GET /api/todos?search=keyword — search todos by title (case-insensitive)",
      "GET /api/todos?done=true&search=keyword — combine filters",
      "GET /api/stats — return { total, completed, pending, completionRate }",
      "completionRate is a percentage rounded to 1 decimal place e.g. 66.7",
      "PATCH /api/todos/bulk-complete — mark all todos as done, return updated count",
      "DELETE /api/todos/completed — delete all completed todos, return deleted count",
    ],
    example: {
      request: "GET /api/stats",
      response:
        '200 OK\n{\n  "total": 5,\n  "completed": 2,\n  "pending": 3,\n  "completionRate": 40.0\n}',
    },
    testCaseIds: ["tc-s2-1", "tc-s2-2", "tc-s2-3", "tc-s2-4", "tc-s2-5"],
  },
};

export const TEST_CASES = {
  // ── Scenario 1 ────────────────────────────────────────────────────────────
  "tc-s1-1": {
    id: "tc-s1-1",
    scenarioId: "todo-api-s1",
    name: "GET /api/todos returns empty array initially",
    description:
      "Before any todos are created, GET /api/todos should return []",
  },
  "tc-s1-2": {
    id: "tc-s1-2",
    scenarioId: "todo-api-s1",
    name: "POST /api/todos creates todo with correct shape",
    description: "Created todo has id, title, done=false, createdAt fields",
  },
  "tc-s1-3": {
    id: "tc-s1-3",
    scenarioId: "todo-api-s1",
    name: "POST /api/todos returns 400 when title is missing",
    description: "Request body without title field returns HTTP 400",
  },
  "tc-s1-4": {
    id: "tc-s1-4",
    scenarioId: "todo-api-s1",
    name: "PUT /api/todos/:id updates the todo",
    description: "Can update title and done status, returns updated todo",
  },
  "tc-s1-5": {
    id: "tc-s1-5",
    scenarioId: "todo-api-s1",
    name: "DELETE /api/todos/:id removes the todo",
    description: "Todo is removed and subsequent GET returns 404",
  },
  "tc-s1-6": {
    id: "tc-s1-6",
    scenarioId: "todo-api-s1",
    name: "GET /api/todos/:id returns 404 for unknown ID",
    description: "Non-existent ID returns HTTP 404 with error message",
  },

  // ── Scenario 2 ────────────────────────────────────────────────────────────
  "tc-s2-1": {
    id: "tc-s2-1",
    scenarioId: "todo-api-s2",
    name: "GET /api/todos?done=true returns only completed todos",
    description: "Filter parameter correctly filters by done status",
  },
  "tc-s2-2": {
    id: "tc-s2-2",
    scenarioId: "todo-api-s2",
    name: "GET /api/todos?search= filters by title case-insensitively",
    description: "Search is case-insensitive partial match on title",
  },
  "tc-s2-3": {
    id: "tc-s2-3",
    scenarioId: "todo-api-s2",
    name: "GET /api/stats returns correct counts and completionRate",
    description: "Stats reflect current state of all todos accurately",
  },
  "tc-s2-4": {
    id: "tc-s2-4",
    scenarioId: "todo-api-s2",
    name: "PATCH /api/todos/bulk-complete marks all todos done",
    description: "All todos set to done=true, returns { updated: N }",
  },
  "tc-s2-5": {
    id: "tc-s2-5",
    scenarioId: "todo-api-s2",
    name: "DELETE /api/todos/completed removes all done todos",
    description: "Only completed todos deleted, returns { deleted: N }",
  },
};

// ── Helper: hydrate a scenario with its test case objects ─────────────────────
export function getScenarioWithTests(scenarioId) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario) return null;
  return {
    ...scenario,
    testCases: scenario.testCaseIds.map((id) => TEST_CASES[id]).filter(Boolean),
  };
}
