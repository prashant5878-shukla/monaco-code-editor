import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { useFileSystem } from "../hooks/useFileSystem";
import { useSandbox } from "../hooks/useSandBox";
import { useTimer } from "../hooks/useTimer";
import { useTestRunner } from "../hooks/useTestRunner";

import {
  setPendingChange,
  clearPendingChange,
  setDiffStats,
  clearDiffStats,
} from "../store/editorSlice";
import { startInterview, setShowSubmitModal } from "../store/interviewSlice";

import { Sidebar } from "../features/editor/Sidebar";
import { TabBar } from "../features/editor/TabBar";
import { CodeView } from "../features/editor/CodeView";
import { DiffBar } from "../features/editor/DiffBar";
import { Terminal } from "../features/editor/Terminal";
import { ChatPanel } from "../features/chat/ChatPanel";
import { PreviewPanel } from "../features/sandbox/PreviewPanel";
import { SubmitModal } from "../features/interview/SubmitModal";
import { TemplateSelectModal } from "../features/interview/TemplateSelectModal";
import { ProblemPanel } from "../features/interview/ProblemPanel";
import { TimerBar } from "../features/interview/TimeBar";
import { ApiClient } from "../features/interview/api-client";

import { Icons } from "../lib/icons";
import { TEMPLATES } from "../lib/templates";
import {
  getNodePath,
  flattenTree,
  findNodeByPath,
  findNodeByName,
} from "../lib/fileUtils";

// ── Helpers ───────────────────────────────────────────────────────────────────
function detectRunConfig(files) {
  try {
    const pkg = JSON.parse(files["package.json"] ?? "{}");
    const isVite = !!pkg.scripts?.dev;
    return {
      installCommand: "npm install",
      runCommand: isVite ? "npm run dev -- --host" : "npm start",
      port: isVite ? 5173 : 3001,
      readyPattern: isVite ? "local:" : "running on port",
    };
  } catch {
    return {
      installCommand: null,
      runCommand: "node index.js",
      port: 3001,
      readyPattern: "running on port",
    };
  }
}

// ── Empty editor ──────────────────────────────────────────────────────────────
function EmptyEditor() {
  return (
    <div
      style={{ backgroundColor: "#1e1e1e" }}
      className="flex items-center justify-center h-full select-none"
    >
      <div className="flex flex-col items-center gap-3 p-8 max-w-sm text-center">
        <Icons.Code2
          style={{ color: "rgba(86,156,214,0.3)" }}
          className="w-16 h-16"
        />
        <div>
          <p style={{ color: "#858585" }} className="text-sm font-medium mb-1">
            No file open
          </p>
          <p style={{ color: "#5a5a5a" }} className="text-xs">
            Select a file or ask the assistant →
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Test results panel ────────────────────────────────────────────────────────
const STATUS_DOT_COLOR = {
  pass: "#4ec9b0",
  fail: "#f48771",
  pending: "rgba(133,133,133,0.3)",
  running: "#dcdcaa",
};
const STATUS_TEXT_COLOR = {
  pass: "#4ec9b0",
  fail: "#f48771",
  pending: "#858585",
  running: "#dcdcaa",
};

function TestResultsPanel({ testResults, isRunning, summary, onRunTests }) {
  const [expanded, setExpanded] = useState(null);
  const entries = Object.values(testResults);
  const hasResults = entries.length > 0;
  const allPassed = summary && summary.passed === summary.total;

  return (
    <div
      style={{ backgroundColor: "#1e1e1e" }}
      className="flex flex-col h-full"
    >
      {/* Summary bar */}
      {summary && (
        <div
          style={{
            padding: "6px 16px",
            fontSize: 11,
            fontWeight: 500,
            borderBottom: "1px solid #3c3c3c",
            flexShrink: 0,
            backgroundColor: allPassed
              ? "rgba(78,201,176,0.08)"
              : "rgba(220,220,170,0.08)",
            color: allPassed ? "#4ec9b0" : "#dcdcaa",
          }}
        >
          {allPassed
            ? `🎉 ${summary.passed}/${summary.total} passed · All tests passed!`
            : `${summary.passed}/${summary.total} passed · ${summary.failed} failing`}
        </div>
      )}

      {/* Content */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Empty state */}
        {!hasResults && !isRunning && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 select-none">
            <Icons.FlaskConical
              style={{ color: "rgba(133,133,133,0.3)", width: 40, height: 40 }}
            />
            <p style={{ color: "#858585", fontSize: 13 }}>
              Run tests to see results here.
            </p>
          </div>
        )}

        {/* Running state */}
        {isRunning && !hasResults && (
          <div className="px-4 py-4 space-y-2">
            <p
              style={{
                color: "#858585",
                fontSize: 11,
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Running tests…
            </p>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{
                    backgroundColor: "#dcdcaa",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
                <div
                  className="h-2 rounded flex-1"
                  style={{
                    backgroundColor: "rgba(60,60,60,0.5)",
                    opacity: 1 - i * 0.12,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Results list */}
        {hasResults &&
          entries.map((result) => {
            const status = result?.status ?? "pending";
            const isFail = status === "fail";
            const isOpen = expanded === result.id;
            return (
              <div key={result.id}>
                <div
                  onClick={() =>
                    isFail &&
                    setExpanded((e) => (e === result.id ? null : result.id))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 16px",
                    borderBottom: "1px solid #2a2a2a",
                    cursor: isFail ? "pointer" : "default",
                    backgroundColor: isOpen
                      ? "rgba(244,135,113,0.05)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (isFail && !isOpen)
                      e.currentTarget.style.backgroundColor = "#2a2d2e";
                  }}
                  onMouseLeave={(e) => {
                    if (isFail && !isOpen)
                      e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    className={status === "running" ? "animate-pulse" : ""}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      flexShrink: 0,
                      backgroundColor: STATUS_DOT_COLOR[status],
                    }}
                  />
                  <span style={{ color: "#cccccc", fontSize: 12, flex: 1 }}>
                    {result.name}
                  </span>
                  {result?.duration != null && (
                    <span
                      style={{
                        color: "#858585",
                        fontSize: 10,
                        fontFamily: "monospace",
                      }}
                    >
                      {result.duration}ms
                    </span>
                  )}
                  <span
                    style={{
                      color: STATUS_TEXT_COLOR[status],
                      fontSize: 11,
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                    }}
                  >
                    {status}
                  </span>
                  {isFail && (
                    <span
                      style={{
                        color: "#858585",
                        fontSize: 10,
                        transform: isOpen ? "rotate(90deg)" : "none",
                        transition: "transform 0.15s",
                      }}
                    >
                      ›
                    </span>
                  )}
                </div>
                {isOpen && result?.error && (
                  <div
                    style={{
                      backgroundColor: "rgba(244,135,113,0.05)",
                      borderLeft: "2px solid #f48771",
                      padding: "8px 16px",
                    }}
                  >
                    <pre
                      style={{
                        fontFamily: "monospace",
                        fontSize: 11,
                        color: "#f48771",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Run Tests button */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #3c3c3c",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onRunTests}
          disabled={isRunning}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #3c3c3c",
            color: "#858585",
            width: "100%",
            padding: "8px",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            cursor: isRunning ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            opacity: isRunning ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              e.currentTarget.style.borderColor = "#569cd6";
              e.currentTarget.style.color = "#569cd6";
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunning) {
              e.currentTarget.style.borderColor = "#3c3c3c";
              e.currentTarget.style.color = "#858585";
            }
          }}
        >
          <Icons.FlaskConical style={{ width: 14, height: 14 }} />
          {isRunning ? "Running…" : "Run Tests"}
        </button>
      </div>
    </div>
  );
}

// ── Right panel tab bar ───────────────────────────────────────────────────────
const RIGHT_TABS = [
  { id: "assistant", label: "Assistant" },
  { id: "preview", label: "Preview" },
  { id: "tests", label: "Tests" },
  { id: "api", label: "API" },
];

function RightTabBar({ activeTab, onChangeTab }) {
  return (
    <div
      style={{
        backgroundColor: "#252526",
        borderBottom: "1px solid #3c3c3c",
        height: 36,
        flexShrink: 0,
      }}
      className="flex items-center"
    >
      {RIGHT_TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            style={{
              position: "relative",
              padding: "0 20px",
              height: 36,
              fontSize: 12,
              fontWeight: 500,
              border: "none",
              borderBottom: isActive
                ? "2px solid #569cd6"
                : "2px solid transparent",
              backgroundColor: "transparent",
              color: isActive ? "#cccccc" : "#969696",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "#cccccc";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "#969696";
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ── EditorPage ────────────────────────────────────────────────────────────────
export function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { candidateName, templateKey: preselectedTemplateKey } =
    location.state ?? {};

  const { pendingChange, diffStats } = useSelector((s) => s.editor);
  const { started, runConfig, showSubmitModal } = useSelector(
    (s) => s.interview,
  );

  const {
    tree,
    openFileIds,
    activeFileId,
    renamingId,
    getNode,
    openFile,
    closeFile,
    updateContent,
    toggleFolder,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    startRename,
    cancelRename,
    resetTree,
    applyGeneratedFiles,
  } = useFileSystem();

  const sandbox = useSandbox();
  const timer = useTimer(45, () => dispatch(setShowSubmitModal(true)));

  const {
    results: testResults,
    isRunning: testsRunning,
    summary: testSummary,
    runTests,
  } = useTestRunner();

  // ── Local state ───────────────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [activeLeftTab, setActiveLeftTab] = useState("problem");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);
  const [rightTab, setRightTab] = useState("assistant");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(200);

  const isDragging = useRef(false);
  const isRightDragging = useRef(false);

  const activeNode = activeFileId ? getNode(activeFileId) : null;
  const activePath = activeFileId
    ? (getNodePath(tree, activeFileId) ?? activeNode?.name)
    : null;

  useEffect(() => {
    if (["installing", "starting", "running"].includes(sandbox.phase)) {
      setTerminalOpen(true);
    }
  }, [sandbox.phase]);

  useEffect(() => {
    if (preselectedTemplateKey && !started) handleStart(preselectedTemplateKey);
  }, [preselectedTemplateKey]);

  function handleStart(templateKey) {
    const tpl = TEMPLATES[templateKey];
    if (!tpl) return;
    const config = {
      installCommand: tpl.installCommand,
      runCommand: tpl.runCommand,
      port: tpl.port,
      readyPattern: tpl.readyPattern,
      waitMs: tpl.waitMs,
    };
    resetTree(tpl.files);
    dispatch(startInterview({ runConfig: config }));
    timer.start();
  }

  function handleCreate(parentId, type) {
    const name = window.prompt(`${type === "file" ? "File" : "Folder"} name:`);
    if (!name?.trim()) return;
    type === "file"
      ? createFile(parentId, name.trim())
      : createFolder(parentId, name.trim());
  }

  function handleApplyChanges(targetFilePath, newContent, changedLines) {
    let node = findNodeByPath(tree, targetFilePath);
    if (!node) node = findNodeByName(tree, targetFilePath.split("/").pop());
    if (!node || node.type !== "file") return;
    openFile(node.id);
    updateContent(node.id, newContent);
    dispatch(
      setPendingChange({
        nodeId: node.id,
        filePath: targetFilePath,
        originalContent: node.content ?? "",
        changedLines,
      }),
    );
    dispatch(clearDiffStats());
  }

  function handleAccept() {
    dispatch(clearPendingChange());
    dispatch(clearDiffStats());
  }
  function handleReject() {
    if (!pendingChange) return;
    updateContent(pendingChange.nodeId, pendingChange.originalContent);
    dispatch(clearPendingChange());
    dispatch(clearDiffStats());
  }

  function handleApplyGeneratedFiles(files) {
    applyGeneratedFiles(files);
  }

  function handleSubmitConfirm() {
    dispatch(setShowSubmitModal(false));
    timer.stop();
    sandbox.stop();
    navigate("/viva", { state: { runConfig } });
  }

  function handleRunTests() {
    setRightTab("tests");
    setTerminalOpen(true);
    if (sandbox.previewUrl)
      runTests({ scenarioId: 1, sandboxUrl: sandbox.previewUrl });
  }

  // ── Left panel drag ───────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!isDragging.current) return;
      setSidebarWidth(Math.min(600, Math.max(180, ev.clientX)));
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  // ── Right panel drag ──────────────────────────────────────────────────────
  const handleRightMouseDown = useCallback((e) => {
    e.preventDefault();
    isRightDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!isRightDragging.current) return;
      const w = window.innerWidth - ev.clientX;
      setRightPanelWidth(Math.min(600, Math.max(280, w)));
    };
    const onUp = () => {
      isRightDragging.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const allFiles = flattenTree(tree);
  const fileNames = [
    ...new Set(Object.keys(allFiles).map((p) => p.split("/").pop())),
  ];
  const activePending =
    pendingChange && activeFileId === pendingChange.nodeId
      ? pendingChange
      : null;

  if (!started) return <TemplateSelectModal onStart={handleStart} />;

  return (
    <div
      style={{ backgroundColor: "#1e1e1e", color: "#cccccc" }}
      className="flex flex-col h-screen w-screen overflow-hidden font-sans"
    >
      {/* Timer bar */}
      <TimerBar
        display={timer.display}
        isWarning={timer.isWarning}
        isDanger={timer.isDanger}
        onSubmit={() => dispatch(setShowSubmitModal(true))}
        onRunTests={handleRunTests}
        onRun={
          sandbox.isRunning || sandbox.isBusy
            ? sandbox.stop
            : () => {
                sandbox.start({
                  files: allFiles,
                  ...(runConfig ?? detectRunConfig(allFiles)),
                });
              }
        }
        sandboxPhase={sandbox.phase}
      />

      {/* Submit modal */}
      {showSubmitModal && (
        <SubmitModal
          timeRemaining={timer.display}
          onConfirm={handleSubmitConfirm}
          onCancel={() => dispatch(setShowSubmitModal(false))}
        />
      )}

      {/* ── Main workspace ───────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left panel section (always visible) ── */}
        {leftPanelOpen && (
          <>
            <div
              style={{ width: sidebarWidth }}
              className="flex-shrink-0 flex flex-col min-w-0 border-r border-border-subtle bg-sidebar"
            >
              {/* Header with tab buttons */}
              <div
                style={{ height: 36 }}
                className="flex items-center flex-shrink-0 border-b border-border-subtle bg-[#252526]"
              >
                <button
                  onClick={() => setActiveLeftTab("problem")}
                  className={`w-10 h-full flex items-center justify-center border-none border-r border-border-subtle cursor-pointer transition-colors ${
                    activeLeftTab === "problem"
                      ? "text-primary bg-active"
                      : "text-muted hover:text-primary bg-sidebar"
                  }`}
                >
                  <Icons.BookOpen className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setActiveLeftTab("explorer")}
                  className={`w-10 h-full flex items-center justify-center border-none border-r border-border-subtle cursor-pointer transition-colors ${
                    activeLeftTab === "explorer"
                      ? "text-primary bg-active"
                      : "text-muted hover:text-primary bg-sidebar"
                  }`}
                >
                  <Icons.FileBox className="w-4 h-4" strokeWidth={1.5} />
                </button>

                <button
                  title="Close panel"
                  onClick={() => setLeftPanelOpen(false)}
                  className="ml-auto w-8 h-full flex items-center justify-center border-none bg-transparent cursor-pointer text-muted hover:text-primary transition-colors"
                >
                  <Icons.PanelLeftClose className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {activeLeftTab === "problem" && (
                  <ProblemPanel
                    testResults={testResults}
                    isRunning={testsRunning}
                    summary={testSummary}
                    onRunTests={handleRunTests}
                  />
                )}
                {activeLeftTab === "explorer" && (
                  <Sidebar
                    tree={tree}
                    activeFileId={activeFileId}
                    renamingId={renamingId}
                    onOpen={openFile}
                    onToggle={toggleFolder}
                    onCreate={handleCreate}
                    onDelete={deleteNode}
                    onStartRename={startRename}
                    onRename={renameNode}
                    onCancelRename={cancelRename}
                  />
                )}
              </div>
            </div>

            {/* Left panel drag handle */}
            <div
              onMouseDown={handleMouseDown}
              style={{
                width: 1,
                flexShrink: 0,
                position: "relative",
                zIndex: 10,
                backgroundColor: "#3c3c3c",
                cursor: "col-resize",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#569cd6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#3c3c3c";
              }}
              className="after:content-[''] after:absolute after:inset-y-0 after:-right-1 after:w-3 after:cursor-col-resize"
            />
          </>
        )}

        {/* ── Editor column ── */}
        <div
          style={{ backgroundColor: "#1e1e1e" }}
          className="flex-1 flex flex-col overflow-hidden min-w-0"
        >
          {/* Tab bar containing only file tabs */}
          <div
            style={{
              backgroundColor: "#252526",
              borderBottom: "1px solid #3c3c3c",
              height: 36,
              flexShrink: 0,
            }}
            className="flex items-center"
          >
            {!leftPanelOpen && (
              <button
                title="Open panel"
                onClick={() => setLeftPanelOpen(true)}
                className="w-10 h-full flex items-center justify-center border-none border-r border-border-subtle bg-sidebar cursor-pointer text-muted hover:text-primary transition-colors"
              >
                <Icons.PanelLeftOpen className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}

            {/* File tabs */}
            <div className="flex items-center h-full overflow-hidden flex-1 min-w-0">
              <TabBar
                openFileIds={openFileIds}
                activeFileId={activeFileId}
                getNode={getNode}
                onActivate={openFile}
                onClose={closeFile}
              />
            </div>
          </div>

          {/* Diff bar */}
          <DiffBar
            pendingChange={activePending}
            additions={diffStats?.additions ?? 0}
            deletions={diffStats?.deletions ?? 0}
            onAccept={handleAccept}
            onReject={handleReject}
          />

          {/* Monaco / empty editor */}
          <div className="flex-1 min-h-0">
            {activeNode ? (
              <CodeView
                key={activeNode.id}
                code={activeNode.content ?? ""}
                filePath={activePath}
                onChange={(v) => updateContent(activeNode.id, v)}
                pendingChange={
                  activePending
                    ? { originalContent: activePending.originalContent }
                    : null
                }
                onDiffStats={(stats) => dispatch(setDiffStats(stats))}
              />
            ) : (
              <EmptyEditor />
            )}
          </div>

          {/* Terminal */}
          <Terminal
            logs={sandbox.logs}
            isOpen={terminalOpen}
            height={terminalHeight}
            onToggle={() => setTerminalOpen(false)}
            onClear={sandbox.clearLogs}
            onHeightChange={setTerminalHeight}
          />
        </div>

        {/* ── Right drag handle ── */}
        <div
          onMouseDown={handleRightMouseDown}
          style={{
            width: 1,
            flexShrink: 0,
            position: "relative",
            zIndex: 10,
            backgroundColor: "#3c3c3c",
            cursor: "col-resize",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#569cd6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#3c3c3c";
          }}
          className="after:content-[''] after:absolute after:inset-y-0 after:-right-1 after:w-3 after:cursor-col-resize"
        />

        {/* ── Right panel ── */}
        <div
          style={{ width: rightPanelWidth, backgroundColor: "#1e1e1e" }}
          className="flex-shrink-0 flex flex-col min-w-0"
        >
          <RightTabBar activeTab={rightTab} onChangeTab={setRightTab} />

          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === "preview" && (
              <PreviewPanel
                phase={sandbox.phase}
                previewUrl={sandbox.previewUrl}
                logs={sandbox.logs}
                isRunning={sandbox.isRunning}
                isBusy={sandbox.isBusy}
                canResume={sandbox.canResume}
                onRun={() => {
                  sandbox.start({
                    files: allFiles,
                    ...(runConfig ?? detectRunConfig(allFiles)),
                  });
                  setTerminalOpen(true);
                }}
                onStop={sandbox.stop}
                onResume={sandbox.resume}
                onClearLogs={sandbox.clearLogs}
              />
            )}
            {rightTab === "tests" && (
              <TestResultsPanel
                testResults={testResults}
                isRunning={testsRunning}
                summary={testSummary}
                onRunTests={handleRunTests}
              />
            )}
            {rightTab === "assistant" && (
              <ChatPanel
                allFiles={allFiles}
                fileNames={fileNames}
                pendingChange={pendingChange}
                onApplyChanges={handleApplyChanges}
                onApplyGeneratedFiles={handleApplyGeneratedFiles}
                onClose={() => {}}
              />
            )}
            {rightTab === "api" && (
              <ApiClient
                baseUrl={sandbox.previewUrl}
                previewUrl={sandbox.previewUrl}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
