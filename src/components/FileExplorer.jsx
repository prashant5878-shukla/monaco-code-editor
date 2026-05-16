import { useEffect, useState, useRef, useCallback } from 'react';
import { useFileSystem } from '../hooks/useFileSystem';
import { useSandbox } from '../hooks/useSandBox';
import { TEMPLATES } from '../lib/templates';
import {
    getNodePath, flattenTree,
    findNodeByPath, findNodeByName,
} from '../lib/fileUtils';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { CodeView } from './CodeView';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { DiffBar } from './DiffBar';
import { Icons } from '../lib/icons';

// ── Template modal ────────────────────────────────────────────────────────────
function TemplateModal({ onSelect, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-sidebar border border-border-subtle rounded-xl p-6 w-[460px] shadow-2xl">
                <h2 className="text-sm font-semibold text-primary mb-1">Load template</h2>
                <p className="text-xs text-muted mb-5">Replaces the current file tree.</p>
                <div className="flex flex-col gap-2">
                    {Object.entries(TEMPLATES).map(([key, tpl]) => (
                        <button key={key}
                            onClick={() => { onSelect(key); onClose(); }}
                            className="flex flex-col gap-0.5 text-left px-4 py-3 rounded-lg border border-border-subtle hover:border-accent hover:bg-hover transition-colors cursor-pointer bg-transparent">
                            <span className="text-sm font-medium text-primary">{tpl.label}</span>
                            <span className="text-xs text-muted">{tpl.description}</span>
                        </button>
                    ))}
                </div>
                <button onClick={onClose}
                    className="mt-4 w-full py-2 text-xs text-muted hover:text-primary transition-colors cursor-pointer bg-transparent border-none">
                    Cancel
                </button>
            </div>
        </div>
    );
}

function ActivityIcon({ active, title, children, onClick, hasNotification }) {
    return (
        <button title={title} onClick={onClick}
            className={`relative flex items-center justify-center w-12 h-12 border-none cursor-pointer transition-colors
                ${active ? 'text-primary' : 'text-muted hover:text-primary'}`}>
            {active && <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-accent" />}
            {children}
            {hasNotification && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />}
        </button>
    );
}

function EmptyEditor() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 select-none bg-editor">
            <Icons.Code2 className="w-16 h-16 text-muted/20" />
            <div className="text-center">
                <p className="text-sm font-medium text-secondary mb-1">No file open</p>
                <p className="text-xs text-muted">Select a file from the explorer or create a new one</p>
            </div>
        </div>
    );
}

function detectRunConfig(files) {
    try {
        const pkg = JSON.parse(files['package.json'] ?? '{}');
        const hasDev = pkg.scripts?.dev;
        return {
            installCommand: 'npm install',
            runCommand: hasDev ? 'npm run dev -- --host' : 'npm start',
            port: hasDev ? 5173 : 3000,
        };
    } catch {
        return { installCommand: null, runCommand: 'node index.js', port: 3000 };
    }
}

export function FileExplorer() {
    const {
        tree, openFileIds, activeFileId, renamingId,
        getNode, openFile, closeFile, updateContent,
        toggleFolder, createFile, createFolder,
        deleteNode, renameNode, startRename, cancelRename,
        resetTree,
    } = useFileSystem();

    const sandbox = useSandbox();

    const [showChat, setShowChat] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [viewMode, setViewMode] = useState('code');
    const [pendingChange, setPendingChange] = useState(null);
    const [diffStats, setDiffStats] = useState(null); // { additions, deletions }
    const [runConfig, setRunConfig] = useState(null);

    const [sidebarWidth, setSidebarWidth] = useState(260);
    const isDragging = useRef(false);

    const activeNode = activeFileId ? getNode(activeFileId) : null;
    const activePath = activeFileId
        ? (getNodePath(tree, activeFileId) ?? activeNode?.name)
        : null;

    // ── View mode: pause/resume sandbox ──────────────────────────────────────────
    function switchViewMode(next) {
        if (next === viewMode) return;
        if (viewMode === 'preview' && sandbox.isRunning) sandbox.pause();
        if (next === 'preview' && sandbox.canResume) sandbox.resume();
        setViewMode(next);
    }

    // ── File management ───────────────────────────────────────────────────────────
    function handleCreate(parentId, type) {
        const name = window.prompt(`${type === 'file' ? 'File' : 'Folder'} name:`);
        if (!name?.trim()) return;
        type === 'file' ? createFile(parentId, name.trim()) : createFolder(parentId, name.trim());
    }

    // ── AI changes ────────────────────────────────────────────────────────────────
    function handleApplyChanges(targetFilePath, newContent, changedLines) {
        let node = findNodeByPath(tree, targetFilePath);
        if (!node) node = findNodeByName(tree, targetFilePath.split('/').pop());
        if (!node || node.type !== 'file') return;

        const originalContent = node.content ?? '';
        openFile(node.id);
        updateContent(node.id, newContent);
        setPendingChange({ nodeId: node.id, filePath: targetFilePath, originalContent, changedLines });
        setDiffStats(null);
    }

    function handleAccept() {
        setPendingChange(null);
        setDiffStats(null);
    }

    function handleReject() {
        if (!pendingChange) return;
        updateContent(pendingChange.nodeId, pendingChange.originalContent);
        setPendingChange(null);
        setDiffStats(null);
    }

    // Clear diff when user manually switches file (leaves the reviewed file)
    useEffect(() => {
        if (pendingChange && activeFileId !== pendingChange.nodeId) {
            // Don't auto-clear — let them switch files and come back
            // Only clear on explicit accept/reject
        }
    }, [activeFileId]); // eslint-disable-line

    // ── Template loading ──────────────────────────────────────────────────────────
    function handleLoadTemplate(key) {
        const tpl = TEMPLATES[key];
        if (!tpl) return;
        sandbox.stop();
        setRunConfig({ installCommand: tpl.installCommand, runCommand: tpl.runCommand, port: tpl.port });
        resetTree(tpl.files);
        setPendingChange(null);
        setDiffStats(null);
    }

    // ── Sandbox run ───────────────────────────────────────────────────────────────
    function handleRun() {
        const allFiles = flattenTree(tree);
        const config = runConfig ?? detectRunConfig(allFiles);
        sandbox.start({ files: allFiles, ...config });
    }

    // ── Sidebar resize ────────────────────────────────────────────────────────────
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
            if (!isDragging.current) return;
            let w = ev.clientX - 48;
            if (w < 150) w = 150;
            if (w > 600) w = 600;
            setSidebarWidth(w);
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

    // pendingChange is only "active" when the user is on the file that was edited
    const activePending = pendingChange && activeFileId === pendingChange.nodeId
        ? pendingChange
        : null;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-primary font-sans">

            {showTemplateModal && (
                <TemplateModal onSelect={handleLoadTemplate} onClose={() => setShowTemplateModal(false)} />
            )}

            {/* ── Activity bar ─────────────────────────────────────────────────── */}
            <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-1 bg-background border-r border-border-subtle z-10">
                <ActivityIcon title="Explorer" active={showSidebar} onClick={() => setShowSidebar(s => !s)}>
                    <Icons.FileBox className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </ActivityIcon>

                <ActivityIcon title="Load template" active={false} onClick={() => setShowTemplateModal(true)}>
                    <Icons.Layers className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </ActivityIcon>

                <div className="flex-1" />

                <ActivityIcon
                    title={sandbox.isRunning || sandbox.isBusy ? 'Stop sandbox' : 'Run project'}
                    active={sandbox.isRunning}
                    onClick={sandbox.isRunning || sandbox.isBusy ? sandbox.stop : handleRun}
                >
                    {sandbox.isRunning || sandbox.isBusy
                        ? <Icons.Square className="w-[20px] h-[20px]" strokeWidth={1.5} />
                        : <Icons.Play className="w-[20px] h-[20px]" strokeWidth={1.5} />
                    }
                </ActivityIcon>

                <ActivityIcon title="AI Chat" active={showChat} onClick={() => setShowChat(s => !s)}
                    hasNotification={!!pendingChange}>
                    <Icons.Sparkles className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </ActivityIcon>
            </div>

            {/* ── Sidebar + Editor ──────────────────────────────────────────────── */}
            <div className="flex flex-1 min-w-0">

                {showSidebar && (
                    <>
                        <div style={{ width: sidebarWidth }} className="flex-shrink-0">
                            <Sidebar
                                tree={tree} activeFileId={activeFileId} renamingId={renamingId}
                                onOpen={openFile} onToggle={toggleFolder} onCreate={handleCreate}
                                onDelete={deleteNode} onStartRename={startRename}
                                onRename={renameNode} onCancelRename={cancelRename}
                            />
                        </div>
                        <div
                            onMouseDown={handleMouseDown}
                            className="w-[1px] bg-border-subtle hover:bg-accent cursor-col-resize flex-shrink-0 relative z-10 after:content-[''] after:absolute after:inset-y-0 after:-left-1 after:w-3 after:cursor-col-resize transition-colors"
                        />
                    </>
                )}

                {/* Editor area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-editor min-w-0">

                    {/* Tab bar */}
                    <div className="flex items-center justify-between bg-background border-b border-border-subtle h-10 flex-shrink-0 overflow-hidden">
                        <div className="flex items-center h-full overflow-hidden flex-1">
                            <TabBar
                                openFileIds={openFileIds} activeFileId={activeFileId}
                                getNode={getNode} onActivate={openFile} onClose={closeFile}
                            />
                        </div>

                        <div className="flex items-center gap-0.5 px-3 h-full border-l border-border-subtle bg-sidebar">
                            <button onClick={() => switchViewMode('code')} title="Code"
                                className={`flex items-center justify-center p-1.5 rounded-md transition-colors
                                    ${viewMode === 'code' ? 'bg-active text-primary' : 'text-muted hover:text-primary hover:bg-hover'}`}>
                                <Icons.Code2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => switchViewMode('preview')} title="Preview"
                                className={`flex items-center justify-center p-1.5 rounded-md transition-colors
                                    ${viewMode === 'preview' ? 'bg-active text-primary' : 'text-muted hover:text-primary hover:bg-hover'}`}>
                                <Icons.AppWindow className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Diff bar — only when viewing the file that was edited ── */}
                    <DiffBar
                        pendingChange={activePending}
                        additions={diffStats?.additions ?? 0}
                        deletions={diffStats?.deletions ?? 0}
                        onAccept={handleAccept}
                        onReject={handleReject}
                    />

                    {/* Editor / Preview */}
                    <div className="flex-1 flex min-h-0 relative">
                        {viewMode === 'code' && (
                            <div className="flex-1 flex flex-col min-w-0 bg-editor">
                                {activeNode ? (
                                    <CodeView
                                        key={activeNode.id}
                                        code={activeNode.content ?? ''}
                                        filePath={activePath}
                                        onChange={v => updateContent(activeNode.id, v)}
                                        pendingChange={activePending
                                            ? { originalContent: activePending.originalContent, changedLines: activePending.changedLines }
                                            : null
                                        }
                                        onDiffStats={setDiffStats}
                                    />
                                ) : (
                                    <EmptyEditor />
                                )}
                            </div>
                        )}

                        {viewMode === 'preview' && (
                            <div className="flex flex-col min-w-0 flex-1">
                                <PreviewPanel
                                    phase={sandbox.phase}
                                    previewUrl={sandbox.previewUrl}
                                    logs={sandbox.logs}
                                    isRunning={sandbox.isRunning}
                                    isBusy={sandbox.isBusy}
                                    canResume={sandbox.canResume}
                                    onRun={handleRun}
                                    onStop={sandbox.stop}
                                    onResume={sandbox.resume}
                                    onClose={() => switchViewMode('code')}
                                    onClearLogs={sandbox.clearLogs}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Chat panel ───────────────────────────────────────────────────── */}
            {showChat && (
                <div className="w-[360px] flex-shrink-0 border-l border-border-subtle flex flex-col bg-sidebar">
                    <ChatPanel
                        allFiles={allFiles}
                        fileNames={fileNames}
                        pendingChange={pendingChange}
                        onApplyChanges={handleApplyChanges}
                        onClose={() => setShowChat(false)}
                    />
                </div>
            )}
        </div>
    );
}