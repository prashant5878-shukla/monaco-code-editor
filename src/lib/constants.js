export const CHAT_SUGGESTIONS = [
  'Add error handling to the fetch calls',
  'Add a loading spinner to App.jsx',
  'Convert class components to functional',
  'Add PropTypes to all components',
];

export const MONACO_THEME_NAME = 'nocturne';

export const MONACO_THEME_CONFIG = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '4b5263', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c678dd' },
    { token: 'string', foreground: '98c379' },
    { token: 'number', foreground: 'd19a66' },
    { token: 'type', foreground: 'e5c07b' },
    { token: 'function', foreground: '61afef' },
    { token: 'variable', foreground: 'e06c75' },
    { token: 'variable.parameter', foreground: 'e06c75' },
    { token: 'delimiter', foreground: 'abb2bf' },
    { token: 'identifier', foreground: 'abb2bf' },
    { token: 'tag', foreground: 'e06c75' },
    { token: 'attribute.name', foreground: 'd19a66' },
    { token: 'attribute.value', foreground: '98c379' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e6edf3',
    'editor.lineHighlightBackground': '#1e1e1e',
    'editor.selectionBackground': '#3b82f630',
    'editor.selectionHighlightBackground': '#3b82f618',
    'editorLineNumber.foreground': '#6e7681',
    'editorLineNumber.activeForeground': '#e6edf3',
    'editorCursor.foreground': '#3b82f6',
    'editorWhitespace.foreground': '#ffffff12',
    'editorIndentGuide.background': '#ffffff08',
    'editorIndentGuide.activeBackground': '#3b82f640',
    'scrollbarSlider.background': '#ffffff14',
    'scrollbarSlider.hoverBackground': '#ffffff22',
    'scrollbarSlider.activeBackground': '#3b82f660',
    'editorWidget.background': '#151515',
    'editorWidget.border': '#ffffff10',
    'editorSuggestWidget.background': '#151515',
    'editorSuggestWidget.border': '#ffffff10',
    'editorSuggestWidget.selectedBackground': '#3b82f620',
    'input.background': '#1e1e1e',
    'input.border': '#ffffff10',
    'focusBorder': '#3b82f6',
    'list.hoverBackground': '#1e1e1e',
    'list.activeSelectionBackground': '#3b82f620',
  },
};

export const GEMINI_MODEL = 'gemini-2.5-flash';

export const SYSTEM_PROMPT = `You are an AI coding assistant embedded in a code editor.
The user will give you their full project file tree and a change request.
They may reference any file by name — you figure out which one to edit.

Respond with ONLY a raw JSON object — no markdown, no code fences, nothing else:
{
  "message": "Short explanation of what you changed",
  "targetFile": "src/components/App.jsx",
  "newContent": "The complete updated file content as a plain string",
  "changedLines": [3, 7, 12]
}

Rules:
- targetFile: exact path key from the files provided (e.g. "src/App.jsx")
- newContent: the FULL file after edits — not a diff, the entire content
- changedLines: 1-indexed line numbers you added or modified
- If no code change is needed, set targetFile and newContent to null, changedLines to []
- Only change what was asked. Preserve code style and indentation.`;
