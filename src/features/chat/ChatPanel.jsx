import { useEffect, useRef, useState } from "react";
import { useGemini } from "../../hooks/useGemini";
import { Icons } from "../../lib/icons";
import { CHAT_SUGGESTIONS } from "../../lib/constants";

// ── Label + color map for tool calls ─────────────────────────────────────────
const TOOL_LABEL = {
  read_file: "Read",
  edit_file: "Edit",
  create_file: "Create",
  list_files: "List",
};

const TOOL_LABEL_COLOR = {
  Read: "text-muted",
  Edit: "text-[#dcdcaa]",
  Create: "text-[#4ec9b0]",
  List: "text-[#569cd6]",
};

// ── Tool call row ─────────────────────────────────────────────────────────────
function ToolCallRow({ tc }) {
  const [open, setOpen] = useState(false);

  const label = TOOL_LABEL[tc.name] ?? tc.name;
  const labelColor = TOOL_LABEL_COLOR[label] ?? "text-secondary";

  const statusDot =
    tc.status === "running" ? (
      <span className="tool-spinner flex-shrink-0" />
    ) : tc.status === "error" ? (
      <span className="w-1.5 h-1.5 rounded-full bg-[#f48771] flex-shrink-0" />
    ) : (
      <span className="w-1.5 h-1.5 rounded-full bg-[#4ec9b0] flex-shrink-0" />
    );

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-1.5 text-left
                   bg-transparent border-none cursor-pointer
                   hover:bg-hover/30 transition-colors group
                   border-b border-border-subtle/10"
      >
        {statusDot}

        <span className={`font-mono text-[11px] flex-shrink-0 ${labelColor}`}>
          {label}
        </span>

        {tc.path && (
          <span className="font-mono text-[11px] text-muted group-hover:text-secondary truncate flex-1 transition-colors">
            {tc.path}
          </span>
        )}

        {tc.duration && (
          <span className="font-mono text-[10px] text-muted/50 flex-shrink-0">
            {tc.duration}
          </span>
        )}

        <Icons.ChevronRight
          className={`w-3 h-3 text-muted/30 group-hover:text-muted/60 flex-shrink-0 transition-all duration-150 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open && tc.detail && (
        <div className="mx-4 mb-1 pl-3 border-l border-border-subtle/50 bg-background/40">
          <pre className="text-[10px] font-mono text-muted/70 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto no-scrollbar py-1.5">
            {tc.detail}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Inline code renderer (backtick spans) ─────────────────────────────────────
function RenderText({ text }) {
  // Split on backtick-delimited inline code
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            className="font-mono text-[12px] text-[#ce9178] bg-background px-1 rounded"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

// ── Message ───────────────────────────────────────────────────────────────────
function Message({ msg }) {
  // ── User message ──────────────────────────────────────────────────────────
  if (msg.role === "user") {
    return (
      <div
        className="flex items-start gap-3 px-4 py-3
                   border-b border-border-subtle/20 bg-accent/[0.03]
                   animate-fade-in"
      >
        <div
          className="w-5 h-5 rounded-md bg-accent/20 border border-accent/30
                     flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <span className="text-[10px] font-bold text-accent leading-none">
            U
          </span>
        </div>
        <p className="text-[13px] text-primary leading-relaxed font-sans whitespace-pre-wrap break-words flex-1 min-w-0">
          {msg.text}
        </p>
      </div>
    );
  }

  // ── Error message ─────────────────────────────────────────────────────────
  if (msg.role === "error") {
    return (
      <div
        className="px-4 py-3 border-b border-border-subtle/20
                   flex items-start gap-2.5 bg-danger/[0.04] animate-fade-in"
      >
        <Icons.AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
        <span className="text-[13px] text-danger/80 leading-relaxed">
          {msg.text}
        </span>
      </div>
    );
  }

  // ── Assistant message ─────────────────────────────────────────────────────
  const hasToolCalls = msg.toolCalls?.length > 0;
  const editedFiles = (msg.toolCalls ?? [])
    .filter((tc) => tc.name === "edit_file" && tc.status === "done")
    .map((tc) => tc.path);
  const createdFiles = (msg.toolCalls ?? [])
    .filter((tc) => tc.name === "create_file" && tc.status === "done")
    .map((tc) => tc.path);

  return (
    <div className="animate-fade-in">
      {/* Part A: Tool call rows */}
      {hasToolCalls && (
        <div className="border-b border-border-subtle/20">
          {msg.toolCalls.map((tc, i) => (
            <ToolCallRow key={i} tc={tc} />
          ))}
        </div>
      )}

      {/* Part B: Streaming typing indicator (no text yet) */}
      {msg.streaming && !msg.text && (
        <div
          className="px-4 py-3 flex items-center gap-3
                     border-b border-border-subtle/20"
        >
          <div
            className="w-5 h-5 rounded-md bg-[#569cd6]/20 border border-[#569cd6]/30
                       flex items-center justify-center flex-shrink-0"
          >
            <Icons.Sparkles className="w-3 h-3 text-[#569cd6] animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[12px] text-muted font-mono">Thinking</span>
            <span className="animate-pulse text-accent font-mono">▊</span>
          </div>
        </div>
      )}

      {/* Part B: Text response */}
      {msg.text && (
        <div className="px-4 py-3 border-b border-border-subtle/20">
          {/* Header row — only if tool calls preceded */}
          {hasToolCalls && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-5 h-5 rounded-md bg-[#569cd6]/20 border border-[#569cd6]/30
                           flex items-center justify-center flex-shrink-0"
                >
                  <Icons.Sparkles className="w-3 h-3 text-[#569cd6]" />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-secondary flex-1">
                    Assistant
                  </span>
                </div>
              </div>

              {/* File-edited badges */}
              <div className="flex items-center gap-1 flex-wrap">
                {editedFiles.map((fp) => (
                  <span
                    key={fp}
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded
                               bg-[#4ec9b0]/10 text-[#4ec9b0] border border-[#4ec9b0]/20
                               flex items-center gap-1"
                  >
                    <Icons.Check className="w-3 h-3" />
                    {fp?.split("/").pop()}
                  </span>
                ))}
                {createdFiles.length > 0 && (
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded
                               bg-[#569cd6]/10 text-[#569cd6] border border-[#569cd6]/20
                               flex items-center gap-1"
                  >
                    <Icons.FilePlus className="w-3 h-3" />
                    {createdFiles.length === 1
                      ? createdFiles[0]?.split("/").pop()
                      : `${createdFiles.length} files`}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="text-[13px] text-secondary leading-relaxed whitespace-pre-wrap break-words">
            <RenderText text={msg.text} />
            {msg.streaming && (
              <span className="animate-pulse text-accent">▍</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ onSelect, textareaRef }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 select-none">
      <div className="text-[32px] font-mono text-accent/20 leading-none">
        {">"}
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-secondary mb-1">
          Ask anything about your code.
        </p>
        <p className="text-[11px] text-muted leading-relaxed">
          Or say &apos;create a login page&apos; to generate files.
        </p>
      </div>
      <div className="w-full flex flex-col gap-1.5 mt-2">
        {CHAT_SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              onSelect(s);
              textareaRef.current?.focus();
            }}
            className="w-full text-left px-3 py-2 rounded-md
                       bg-transparent border border-border-subtle/50
                       text-[11px] font-mono text-muted cursor-pointer
                       hover:border-accent/30 hover:text-secondary hover:bg-hover/30
                       transition-all"
          >
            <span className="text-accent/50">{"> "}</span>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ChatPanel ─────────────────────────────────────────────────────────────────
export function ChatPanel({
  allFiles,
  fileNames,
  pendingChange,
  onApplyChanges,
  onApplyGeneratedFiles,
  onClose,
}) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const pendingIdRef = useRef(null);

  const { sendMessage, isLoading } = useGemini();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const prompt = input.trim();
    if (!prompt || isLoading || pendingChange) return;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);

    // Create a live assistant message we'll mutate in place
    const pid = Date.now();
    pendingIdRef.current = pid;
    setMessages((prev) => [
      ...prev,
      { id: pid, role: "assistant", text: "", toolCalls: [], streaming: true },
    ]);

    const startTimes = {};
    const toolCalls = [];

    const result = await sendMessage({
      userMessage: prompt,
      allFiles,
      onEdit: (path, content) => onApplyChanges(path, content, []),
      onCreate: (path, content) => onApplyGeneratedFiles([{ path, content }]),

      onToolCall: (name, args, phase, resultData) => {
        if (phase === "start") {
          startTimes[name + (args.path || "")] = Date.now();
          toolCalls.push({
            name,
            path: args.path,
            status: "running",
            detail: null,
          });
        } else {
          const key = name + (args.path || "");
          const ms = Date.now() - (startTimes[key] ?? Date.now());
          const tc = toolCalls.findLast(
            (t) =>
              t.name === name && t.path === args.path && t.status === "running",
          );
          if (tc) {
            tc.status = "done";
            tc.duration = ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
            if (name === "read_file" && resultData?.content) {
              tc.detail = resultData.content.slice(0, 500);
            } else if (resultData?.error) {
              tc.detail = `Error: ${resultData.error}`;
            } else {
              tc.detail = null;
            }
          }
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pid ? { ...m, toolCalls: [...toolCalls] } : m,
          ),
        );
      },

      onStream: (text) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === pid ? { ...m, text } : m)),
        );
      },
    });

    // Finalize
    if (result?.error) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== pid),
        { role: "error", text: result.error },
      ]);
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pid
            ? {
                ...m,
                text: result?.message ?? m.text,
                toolCalls: [...toolCalls],
                streaming: false,
              }
            : m,
        ),
      );
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const canSend = input.trim() && !isLoading && !pendingChange;

  return (
    <div className="flex flex-col h-full bg-sidebar text-primary font-sans">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="h-10 bg-sidebar border-b border-border-subtle flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
          <span className="text-[11px] font-semibold text-secondary uppercase tracking-[0.1em]">
            Assistant
          </span>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && !pendingChange && (
            <button
              onClick={() => setMessages([])}
              title="Clear"
              className="flex items-center justify-center w-6 h-6 rounded cursor-pointer
                         text-muted transition-colors hover:bg-hover hover:text-primary border-none bg-transparent"
            >
              <Icons.Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close"
            className="flex items-center justify-center w-6 h-6 rounded cursor-pointer
                       text-muted transition-colors hover:bg-hover hover:text-primary border-none bg-transparent"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 no-scrollbar flex flex-col">
        {messages.length === 0 && (
          <EmptyState onSelect={setInput} textareaRef={textareaRef} />
        )}
        {messages.map((msg, i) => (
          <Message key={msg.id ?? i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 pb-3 bg-sidebar">
        {pendingChange && (
          <p className="text-[11px] text-warning/80 font-mono mb-1.5 px-1 flex items-center gap-1.5">
            <Icons.AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Review diff in editor first
          </p>
        )}

        <div
          className={`flex flex-col bg-background border rounded-lg overflow-hidden
                      transition-colors focus-within:border-accent/60
                      ${pendingChange ? "border-warning/30" : "border-border-subtle"}`}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder='Ask anything or say "create a login page"…'
            disabled={isLoading || !!pendingChange}
            rows={3}
            className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-[13px]
                       font-mono text-primary leading-relaxed resize-none
                       disabled:opacity-40 disabled:cursor-not-allowed placeholder-muted"
          />

          <div
            className="h-8 flex items-center justify-between px-3
                          bg-sidebar/50 border-t border-border-subtle/50"
          >
            <span className="font-mono text-[10px] text-muted/50">
              ↵ send&nbsp;&nbsp;⇧↵ newline
            </span>

            <button
              onClick={handleSend}
              disabled={!canSend && !isLoading}
              className={`flex items-center justify-center w-7 h-7 rounded-md border-none transition-colors
                ${
                  isLoading
                    ? "bg-accent/20 cursor-default"
                    : canSend
                      ? "bg-accent hover:bg-accent-hover cursor-pointer"
                      : "bg-transparent cursor-not-allowed"
                }`}
            >
              {isLoading ? (
                <Icons.Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
              ) : (
                <Icons.Send
                  className={`w-3.5 h-3.5 ${canSend ? "text-white" : "text-muted/30"}`}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
