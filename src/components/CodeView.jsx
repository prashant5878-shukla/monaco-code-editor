import Editor from '@monaco-editor/react';
import { useEffect, useMemo, useRef } from 'react';
import { getLanguage } from '../lib/fileUtils';
import { MONACO_THEME_NAME, MONACO_THEME_CONFIG } from '../lib/constants';

function configureMonaco(monaco) {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowNonTsExtensions: false,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    esModuleInterop: true,
    allowJs: true, checkJs: false, strict: false, skipLibCheck: true,
  });

  // Define premium dark theme
  monaco.editor.defineTheme(MONACO_THEME_NAME, MONACO_THEME_CONFIG);
}

export function CodeView({ code, filePath, onChange, changedLines = [] }) {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const changedLinesRef = useRef(changedLines);
  useEffect(() => { changedLinesRef.current = changedLines; }, [changedLines]);

  const language = useMemo(() => getLanguage(filePath ?? ''), [filePath]);

  function applyDecorations(lines) {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      lines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'ai-changed-line',
          linesDecorationsClassName: 'ai-changed-gutter',
        },
      }))
    );
  }

  useEffect(() => {
    applyDecorations(changedLines);
  }, [changedLines]); // eslint-disable-line

  return (
    <div className="w-full h-full bg-editor">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme={MONACO_THEME_NAME}
        path={filePath}
        onChange={(v) => onChange(v ?? '')}
        beforeMount={(monaco) => {
          monacoRef.current = monaco;
          configureMonaco(monaco);
        }}
        onMount={(editor) => {
          editorRef.current = editor;
          if (changedLinesRef.current.length > 0) {
            applyDecorations(changedLinesRef.current);
          }
        }}
        options={{
          minimap: { enabled: true, scale: 0.8, renderCharacters: false },
          fontSize: 13.5,
          lineHeight: 22,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderValidationDecorations: 'on',
          padding: { top: 24, bottom: 24 },
          stickyScroll: { enabled: true },
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'phase',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          formatOnPaste: true,
          suggest: { showKeywords: true, showSnippets: true },
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}