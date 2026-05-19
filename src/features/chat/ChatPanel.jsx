import { useEffect, useRef, useState } from 'react';
import { useGemini } from '../../hooks/useGemini';
import { useGenerate } from '../../hooks/useGenerate';
import { Icons } from '../../lib/icons';
import { CHAT_SUGGESTIONS } from '../../lib/constants';


// Heuristic: generation keywords at the start of the prompt
const GENERATION_TRIGGERS = [
  'create', 'generate', 'build', 'make', 'add a new',
  'scaffold', 'setup', 'write a new', 'implement a new',
];

function isGenerationRequest(prompt) {
  const lower = prompt.toLowerCase().trim();
  return GENERATION_TRIGGERS.some(t => lower.startsWith(t));
}


// ── Message bubble ────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user';
  const isError = msg.role === 'error';

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm bg-hover
                        text-primary text-[13px] leading-relaxed font-sans border border-border-subtle">
          {msg.text}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="animate-fade-in">
        <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-danger/10 border border-danger/20
                        text-danger text-[13px] leading-relaxed font-sans flex items-start gap-2">
          <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
          <Icons.Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-medium text-primary">Assistant</span>

        {/* Badge: which file was edited */}
        {msg.didEdit && msg.targetFile && (
          <span className="text-[10px] font-mono text-muted flex items-center gap-1 ml-auto">
            <Icons.Check className="w-3 h-3 text-success" />
            {msg.targetFile.split('/').pop()}
          </span>
        )}

        {/* Badge: how many files were generated */}
        {msg.generatedCount != null && (
          <span className="text-[10px] font-mono text-muted flex items-center gap-1 ml-auto">
            <Icons.Check className="w-3 h-3 text-success" />
            {msg.generatedCount} file{msg.generatedCount !== 1 ? 's' : ''} created
          </span>
        )}
      </div>

      <div className="text-primary text-[13px] leading-relaxed whitespace-pre-wrap break-words pl-7">
        {msg.text}
      </div>

      {/* List generated file paths */}
      {msg.generatedPaths?.length > 0 && (
        <div className="pl-7 mt-2 flex flex-col gap-0.5">
          {msg.generatedPaths.map(p => (
            <span key={p} className="text-[11px] font-mono text-muted">
              + {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
        <Icons.Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function EmptyState({ onSelect, textareaRef }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-4 select-none">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shadow-glow">
        <Icons.Sparkles className="w-5 h-5 text-white" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-primary mb-1">How can I help you code?</p>
        <p className="text-xs text-secondary leading-relaxed">
          Edit a file or say "create a login page".
        </p>
      </div>
      <div className="w-full flex flex-col gap-2">
        {CHAT_SUGGESTIONS.map(s => (
          <button key={s}
            onClick={() => { onSelect(s); textareaRef.current?.focus(); }}
            className="w-full text-left px-3.5 py-2.5 rounded-lg border border-border-subtle
                       bg-transparent text-secondary text-xs cursor-pointer
                       transition-all hover:bg-hover hover:text-primary">
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────
export function ChatPanel({
  allFiles, fileNames, pendingChange,
  onApplyChanges, onApplyGeneratedFiles,
  onClose,
}) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const { sendMessage, isLoading: isChatLoading } = useGemini();
  const { generate, isGenerating } = useGenerate();

  const isLoading = isChatLoading || isGenerating;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function clearMessages() { setMessages([]); }

  async function handleSend() {
    const prompt = input.trim();
    if (!prompt || isLoading || pendingChange) return;
    setInput('');

    if (isGenerationRequest(prompt)) {
      // ── Generation: create / update multiple files ─────────────────────────
      setMessages(prev => [...prev, { role: 'user', text: prompt }]);

      const result = await generate({ prompt, existingFiles: allFiles });

      if (result.error) {
        setMessages(prev => [...prev, { role: 'error', text: result.error }]);
        return;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.message,
        generatedCount: result.files.length,
        generatedPaths: result.files.map(f => f.path),
      }]);

      onApplyGeneratedFiles?.(result.files);

    } else {
      // ── Edit: modify a single existing file ────────────────────────────────
      setMessages(prev => [...prev, { role: 'user', text: prompt }]);

      const result = await sendMessage({ userMessage: prompt, allFiles });
      if (!result) return;

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: result.message,
        targetFile: result.targetFile,
        didEdit: result.newContent != null,
      }]);

      if (result.newContent != null && result.targetFile) {
        onApplyChanges(result.targetFile, result.newContent, result.changedLines ?? []);
      }
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const canSend = input.trim() && !isLoading && !pendingChange;

  return (
    <div className="flex flex-col h-full bg-sidebar text-primary font-sans">

      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border-subtle flex-shrink-0">
        <span className="text-xs font-semibold text-secondary uppercase tracking-widest">Chat</span>
        <div className="flex items-center gap-1">
          {messages.length > 0 && !pendingChange && (
            <button onClick={clearMessages} title="Clear"
              className="flex items-center justify-center w-6 h-6 rounded cursor-pointer
                         text-muted transition-colors hover:bg-hover hover:text-primary
                         border-none bg-transparent">
              <Icons.Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={onClose} title="Close"
            className="flex items-center justify-center w-6 h-6 rounded cursor-pointer
                       text-muted transition-colors hover:bg-hover hover:text-primary
                       border-none bg-transparent">
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* File pills */}
      {fileNames.length > 0 && (
        <div className="px-4 py-2 border-b border-border-subtle flex-shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {fileNames.map(name => (
              <button key={name}
                onClick={() => { setInput(p => p ? `${p} ${name}` : name); textareaRef.current?.focus(); }}
                className="text-[11px] font-mono bg-hover text-secondary px-2 py-0.5 rounded
                           border border-border-subtle cursor-pointer transition-colors
                           hover:border-accent hover:text-primary">
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 min-h-0 no-scrollbar">
        {messages.length === 0 && (
          <EmptyState onSelect={setInput} textareaRef={textareaRef} />
        )}
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {isLoading && <Typing />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 bg-sidebar">
        {pendingChange && (
          <p className="text-center text-[11px] text-warning mb-2 opacity-80">
            Review changes in the editor first
          </p>
        )}
        <div className={`flex flex-col bg-background border rounded-lg overflow-hidden
                         transition-colors focus-within:border-accent
                         ${pendingChange ? 'border-warning/30' : 'border-border-default'}`}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isGenerating ? 'Generating files…' : 'Ask anything or say "create a login page"…'}
            disabled={isLoading || !!pendingChange}
            rows={3}
            className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-[13px]
                       font-sans text-primary leading-relaxed resize-none
                       disabled:opacity-40 disabled:cursor-not-allowed placeholder-muted"
          />
          <div className="flex items-center justify-between px-3 py-2 bg-hover border-t border-border-subtle">
            <span className="text-[10px] text-muted">↵ Send · ⇧↵ Newline</span>
            <button onClick={handleSend} disabled={!canSend}
              className={`flex items-center justify-center w-6 h-6 rounded-md border-none transition-colors
                ${canSend
                  ? 'cursor-pointer text-white bg-accent hover:bg-accent-hover'
                  : 'cursor-not-allowed text-muted bg-transparent'}`}>
              {isLoading
                ? <Icons.Sparkles className="w-3.5 h-3.5 animate-pulse" />
                : <Icons.Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}