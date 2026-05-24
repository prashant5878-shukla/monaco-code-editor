import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useFileSystem } from '../hooks/useFileSystem';
import { useSandbox } from '../hooks/useSandBox';
import { useTimer } from '../hooks/useTimer';
import { useTestRunner } from '../hooks/useTestRunner';

// ── Redux actions ─────────────────────────────────────────────────────────────
import {
    setViewMode,
    setLeftPanel,
    toggleChat,
    setPendingChange,
    clearPendingChange,
    setDiffStats,
    clearDiffStats,
} from '../store/editorSlice';
import {
    startInterview,
    setShowSubmitModal,
} from '../store/interviewSlice';

// ── Feature components ────────────────────────────────────────────────────────
import { Sidebar } from '../features/editor/Sidebar';
import { TabBar } from '../features/editor/TabBar';
import { CodeView } from '../features/editor/CodeView';
import { DiffBar } from '../features/editor/DiffBar';
import { ChatPanel } from '../features/chat/ChatPanel';
import { PreviewPanel } from '../features/sandbox/PreviewPanel';
import { SubmitModal } from '../features/interview/SubmitModal';
import { TemplateSelectModal } from '../features/interview/TemplateSelectModal';
import { ProblemPanel } from '../features/interview/ProblemPanel';
import { TimerBar } from '../features/interview/TimeBar';
import { ApiClient } from '../features/interview/api-client';

import { Icons } from '../lib/icons';
import { TEMPLATES } from '../lib/templates';
import {
    getNodePath, flattenTree,
    findNodeByPath, findNodeByName,
} from '../lib/fileUtils';


function detectRunConfig(files) {
    try {
        const pkg = JSON.parse(files['package.json'] ?? '{}');
        const isVite = !!pkg.scripts?.dev;
        return {
            installCommand: 'npm install',
            runCommand: isVite ? 'npm run dev -- --host' : 'npm start',
            port: isVite ? 5173 : 3001,
            readyPattern: isVite ? 'local:' : 'running on port',
        };
    } catch {
        return {
            installCommand: null,
            runCommand: 'node index.js',
            port: 3001,
            readyPattern: 'running on port',
        };
    }
}

function ActivityIcon({ active, title, children, onClick, hasNotification }) {
    return (
        <button
            title={title}
            onClick={onClick}
            className={`relative flex items-center justify-center w-12 h-12 border-none
                        cursor-pointer transition-colors
                        ${active ? 'text-primary' : 'text-muted hover:text-primary'}`}
        >
            {active && <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-accent" />}
            {children}
            {hasNotification && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
            )}
        </button>
    );
}

function EmptyEditor() {
    return (
        <div className="flex items-center justify-center h-full select-none bg-editor">
            <div className="flex flex-col items-center gap-3 rounded-xl p-8 max-w-sm text-center">
                <div className="flex-1 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0">
                    <Icons.Code2 className="w-20 h-20 text-accent/60" />
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary mb-1">No file open</p>
                    <p className="text-xs text-muted leading-relaxed">
                        Select a file or generate code with AI →
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── EditorPage ────────────────────────────────────────────────────────────────
export function EditorPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    // Candidate info + template pre-selection passed from StartPage
    const { candidateName, templateKey: preselectedTemplateKey } = location.state ?? {};

    // ── Redux state ───────────────────────────────────────────────────────────
    const { viewMode, leftPanel, showChat, pendingChange, diffStats } =
        useSelector(s => s.editor);
    const { started, runConfig, showSubmitModal } =
        useSelector(s => s.interview);
    // ── Hooks ─────────────────────────────────────────────────────────────────
    const {
        tree, openFileIds, activeFileId, renamingId,
        getNode, openFile, closeFile, updateContent,
        toggleFolder, createFile, createFolder,
        deleteNode, renameNode, startRename, cancelRename,
        resetTree, applyGeneratedFiles,
    } = useFileSystem();

    const sandbox = useSandbox();
    const timer = useTimer(45, () => dispatch(setShowSubmitModal(true)));

    const {
        results: testResults,
        isRunning: testsRunning,
        summary: testSummary,
        runTests,
    } = useTestRunner();

    // ── Local UI state ────────────────────────────────────────────────────────
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [runTestsActive, setRunTestsActive] = useState(false);
    const isDragging = useRef(false);

    const scenario1Complete =
        testSummary?.passed === 10 && testSummary?.total === 10;

    const activeNode = activeFileId ? getNode(activeFileId) : null;
    const activePath = activeFileId
        ? (getNodePath(tree, activeFileId) ?? activeNode?.name)
        : null;

    // ── Template select + auto-start ──────────────────────────────────────────
    // Build full config from template (includes port, readyPattern, waitMs)
    // so sandbox.start() gets everything it needs from templates.js directly.
    function handleStart(templateKey) {
        const tpl = TEMPLATES[templateKey];
        if (!tpl) return;

        const config = {
            installCommand: tpl.installCommand,
            runCommand: tpl.runCommand,
            port: tpl.port,
            readyPattern: tpl.readyPattern,
            waitMs: tpl.waitMs,     // undefined for most templates, 45000 for fullstack
        };

        resetTree(tpl.files);
        dispatch(startInterview({ runConfig: config }));
        timer.start();
        // sandbox.start({ files: tpl.files, ...config });
    }

    // ── View mode ─────────────────────────────────────────────────────────────
    function switchViewMode(next) {
        if (next === viewMode) return;
        if (viewMode === 'preview' && sandbox.isRunning) sandbox.pause();
        if (next === 'preview' && sandbox.canResume) sandbox.resume();
        dispatch(setViewMode(next));
    }

    // ── File management ───────────────────────────────────────────────────────
    function handleCreate(parentId, type) {
        const name = window.prompt(`${type === 'file' ? 'File' : 'Folder'} name:`);
        if (!name?.trim()) return;
        type === 'file'
            ? createFile(parentId, name.trim())
            : createFolder(parentId, name.trim());
    }

    // ── AI single-file edit ───────────────────────────────────────────────────
    function handleApplyChanges(targetFilePath, newContent, changedLines) {
        let node = findNodeByPath(tree, targetFilePath);
        if (!node) node = findNodeByName(tree, targetFilePath.split('/').pop());
        if (!node || node.type !== 'file') return;

        openFile(node.id);
        updateContent(node.id, newContent);
        dispatch(setPendingChange({
            nodeId: node.id,
            filePath: targetFilePath,
            originalContent: node.content ?? '',
            changedLines,
        }));
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

    // ── AI multi-file generation ──────────────────────────────────────────────
    function handleApplyGeneratedFiles(files) {
        applyGeneratedFiles(files);
    }

    // ── Submit → navigate to viva ─────────────────────────────────────────────
    function handleSubmitConfirm() {
        dispatch(setShowSubmitModal(false));
        timer.stop();
        sandbox.stop();
        navigate('/viva', { state: { runConfig } });
    }

    // ── Run tests ─────────────────────────────────────────────────────────────
    function handleRunTests() {
        dispatch(setLeftPanel('problem'));
        setRunTestsActive(true);
        setTimeout(() => setRunTestsActive(false), 100);
        if (sandbox.previewUrl) {
            runTests({ scenarioId: 1, sandboxUrl: sandbox.previewUrl });
        }
    }

    // ── Activity bar toggles ──────────────────────────────────────────────────
    function toggleExplorer() {
        dispatch(setLeftPanel(leftPanel === 'explorer' ? null : 'explorer'));
    }
    function toggleProblem() {
        dispatch(setLeftPanel(leftPanel === 'problem' ? null : 'problem'));
    }

    // ── Sidebar resize ────────────────────────────────────────────────────────
    const handleMouseDown = useCallback(e => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = ev => {
            if (!isDragging.current) return;
            setSidebarWidth(Math.min(600, Math.max(150, ev.clientX - 48)));
        };
        const onUp = () => {
            isDragging.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, []);

    const allFiles = flattenTree(tree);
    const fileNames = [...new Set(Object.keys(allFiles).map(p => p.split('/').pop()))];
    const activePending = pendingChange && activeFileId === pendingChange.nodeId
        ? pendingChange : null;

    // ── Auto-start from StartPage ─────────────────────────────────────────
    useEffect(() => {
        if (preselectedTemplateKey && !started) {
            handleStart(preselectedTemplateKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preselectedTemplateKey]);

    // ── Template select screen (fallback when no preselection) ────────────
    if (!started) {
        return <TemplateSelectModal onStart={handleStart} />;
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden
                        bg-background text-primary font-sans">

            {/* Timer bar */}
            <TimerBar
                display={timer.display}
                isWarning={timer.isWarning}
                isDanger={timer.isDanger}
                onSubmit={() => dispatch(setShowSubmitModal(true))}
                onRunTests={handleRunTests}
            />

            {/* Submit modal */}
            {showSubmitModal && (
                <SubmitModal
                    timeRemaining={timer.display}
                    onConfirm={handleSubmitConfirm}
                    onCancel={() => dispatch(setShowSubmitModal(false))}
                />
            )}

            {/* Main workspace */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* ── Activity bar ──────────────────────────────────────────── */}
                <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-1
                                bg-background border-r border-border-subtle z-10">

                    <ActivityIcon
                        title="Explorer"
                        active={leftPanel === 'explorer'}
                        onClick={toggleExplorer}
                    >
                        <Icons.FileBox className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </ActivityIcon>

                    <ActivityIcon
                        title="Problem"
                        active={leftPanel === 'problem'}
                        onClick={toggleProblem}
                    >
                        <Icons.BookOpen className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </ActivityIcon>

                    <ActivityIcon
                        title="API Client"
                        active={leftPanel === 'api'}
                        onClick={() => dispatch(setLeftPanel(leftPanel === 'api' ? null : 'api'))}
                    >
                        <Icons.Wifi className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </ActivityIcon>

                    <div className="flex-1" />

                    <ActivityIcon
                        title={sandbox.isRunning || sandbox.isBusy ? 'Stop' : 'Run project'}
                        active={sandbox.isRunning}
                        onClick={sandbox.isRunning || sandbox.isBusy
                            ? sandbox.stop
                            : () => {
                                // Use saved runConfig from template, fall back to auto-detect
                                const config = runConfig ?? detectRunConfig(allFiles);
                                sandbox.start({ files: allFiles, ...config });
                            }
                        }
                    >
                        {sandbox.isRunning || sandbox.isBusy
                            ? <Icons.Square className="w-[20px] h-[20px]" strokeWidth={1.5} />
                            : <Icons.Play className="w-[20px] h-[20px]" strokeWidth={1.5} />
                        }
                    </ActivityIcon>

                    <ActivityIcon
                        title="AI Chat"
                        active={showChat}
                        onClick={() => dispatch(toggleChat())}
                        hasNotification={!!pendingChange}
                    >
                        <Icons.Sparkles className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </ActivityIcon>
                </div>

                {/* ── Left panel: Explorer OR Problem OR API Client ─────────── */}
                {leftPanel && (
                    <>
                        <div style={{ width: sidebarWidth }} className="flex-shrink-0 flex flex-col min-w-0">
                            {leftPanel === 'explorer' && (
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
                            {leftPanel === 'problem' && (
                                <ProblemPanel
                                    activeTestTab={runTestsActive}
                                    onRunTests={handleRunTests}
                                    testResults={testResults}
                                    isRunning={testsRunning}
                                    summary={testSummary}
                                    scenario1Complete={scenario1Complete}
                                />
                            )}
                            {leftPanel === 'api' && (
                                <ApiClient previewUrl={sandbox.previewUrl} />
                            )}
                        </div>
                        <div
                            onMouseDown={handleMouseDown}
                            className="w-[1px] bg-border-subtle hover:bg-accent cursor-col-resize
                                       flex-shrink-0 relative z-10 transition-colors
                                       after:content-[''] after:absolute after:inset-y-0
                                       after:-left-1 after:w-3 after:cursor-col-resize"
                        />
                    </>
                )}

                {/* ── Editor area ───────────────────────────────────────────── */}
                <div className="flex-1 flex flex-col overflow-hidden bg-editor min-w-0">

                    {/* Tab bar + view toggle */}
                    <div className="flex items-center bg-background border-b border-border-subtle
                                    h-10 flex-shrink-0">
                        <div className="flex items-center h-full overflow-hidden flex-1 min-w-0">
                            <TabBar
                                openFileIds={openFileIds}
                                activeFileId={activeFileId}
                                getNode={getNode}
                                onActivate={openFile}
                                onClose={closeFile}
                            />
                        </div>

                        <div className="flex items-center gap-0.5 px-3 h-full flex-shrink-0
                                        border-l border-border-subtle bg-sidebar">
                            {[
                                { mode: 'code', icon: <Icons.Code2 className="w-4 h-4" />, title: 'Code' },
                                { mode: 'preview', icon: <Icons.AppWindow className="w-4 h-4" />, title: 'Preview' },
                            ].map(({ mode, icon, title }) => (
                                <button
                                    key={mode}
                                    onClick={() => switchViewMode(mode)}
                                    title={title}
                                    className={`flex items-center justify-center p-1.5 rounded-md transition-colors
                                        ${viewMode === mode
                                            ? 'bg-active text-primary'
                                            : 'text-muted hover:text-primary hover:bg-hover'
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
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

                    {/* Content */}
                    <div className="flex-1 min-h-0">
                        {viewMode === 'code' && (
                            activeNode ? (
                                <CodeView
                                    key={activeNode.id}
                                    code={activeNode.content ?? ''}
                                    filePath={activePath}
                                    onChange={v => updateContent(activeNode.id, v)}
                                    pendingChange={activePending
                                        ? { originalContent: activePending.originalContent }
                                        : null
                                    }
                                    onDiffStats={stats => dispatch(setDiffStats(stats))}
                                />
                            ) : (
                                <EmptyEditor />
                            )
                        )}

                        {viewMode === 'preview' && (
                            <PreviewPanel
                                phase={sandbox.phase}
                                previewUrl={sandbox.previewUrl}
                                logs={sandbox.logs}
                                isRunning={sandbox.isRunning}
                                isBusy={sandbox.isBusy}
                                canResume={sandbox.canResume}
                                onRun={() => {
                                    const config = runConfig ?? detectRunConfig(allFiles);
                                    sandbox.start({ files: allFiles, ...config });
                                }}
                                onStop={sandbox.stop}
                                onResume={sandbox.resume}
                                onClose={() => dispatch(setViewMode('code'))}
                                onClearLogs={sandbox.clearLogs}
                            />
                        )}
                    </div>
                </div>

                {/* ── Chat panel ────────────────────────────────────────────── */}
                {showChat && (
                    <>
                        {/* <div
                            onMouseDown={handleMouseDown}
                            className="w-[1px] bg-border-subtle hover:bg-accent cursor-col-resize
                                       flex-shrink-0 relative z-10 transition-colors
                                       after:content-[''] after:absolute after:inset-y-0
                                       after:-left-1 after:w-3 after:cursor-col-resize"
                        /> */}
                        <div className="w-[360px] flex-shrink-0 border-l border-border-subtle
                                    flex flex-col bg-sidebar">
                            <ChatPanel
                                allFiles={allFiles}
                                fileNames={fileNames}
                                pendingChange={pendingChange}
                                onApplyChanges={handleApplyChanges}
                                onApplyGeneratedFiles={handleApplyGeneratedFiles}
                                onClose={() => dispatch(toggleChat())}
                            />
                        </div>

                    </>
                )}
            </div>
        </div>
    );
}