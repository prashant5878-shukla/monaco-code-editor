import Editor from '@monaco-editor/react';
import { useMemo, useRef } from 'react';
import { getLanguage } from '../../lib/fileUtils';
import { useMonacoDiff } from '../../hooks/useMonacoDiff';
import { MONACO_THEME_NAME, MONACO_THEME_CONFIG } from '../../lib/constants';

function configureMonaco(monaco) {
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.languages.typescript.JsxEmit.React,
    allowNonTsExtensions: false,
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    esModuleInterop: true,
    allowJs: true,
    checkJs: false,
    strict: false,
    skipLibCheck: true,
  });

  monaco.editor.defineTheme(MONACO_THEME_NAME, MONACO_THEME_CONFIG);
}

/**
 * @param {object}  props
 * @param {string}  props.code           Current file content (shown in editor)
 * @param {string}  props.filePath       Used for language detection + per-file undo history
 * @param {function} props.onChange      Called with new content on every keystroke
 * @param {{ originalContent: string, changedLines: number[] } | null} props.pendingChange
 * @param {function} props.onDiffStats   Receives { additions, deletions } | null
 */
export function CodeView({ code, filePath, onChange, pendingChange, onDiffStats }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const language = useMemo(() => getLanguage(filePath ?? ''), [filePath]);

  // All diff logic (decorations + view zones) lives here
  useMonacoDiff(editorRef, monacoRef, pendingChange, code, onDiffStats);

  return (
    <div className="w-full h-full bg-editor">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme={MONACO_THEME_NAME}
        path={filePath}
        onChange={v => onChange(v ?? '')}
        beforeMount={monaco => {
          monacoRef.current = monaco;
          configureMonaco(monaco);
        }}
        onMount={editor => {
          editorRef.current = editor;
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
          fontFamily: "'JetBrains Mono','Fira Code',Consolas,monospace",
          fontLigatures: true,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          cursorBlinking: 'phase',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          formatOnPaste: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}