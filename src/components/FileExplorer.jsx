import { useEffect, useState, useRef, useCallback } from 'react';
import { useFileSystem } from '../hooks/useFileSystem';
import {
    getNodePath, flattenTree,
    findNodeByPath, findNodeByName,
} from '../lib/fileUtils';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { CodeView } from './CodeView';
import { ChatPanel } from './ChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { Icons } from '../lib/icons';

function ActivityIcon({ active, title, children, onClick, hasNotification }) {
    return (
        <button
            title={title}
            onClick={onClick}
            className={`relative flex items-center justify-center w-12 h-12 border-none cursor-pointer transition-colors
        ${active
                    ? 'text-primary'
                    : 'text-muted hover:text-primary'
                }`}
        >
            {active && (
                <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-accent" />
            )}
            {children}
            {hasNotification && (
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent" />
            )}
        </button>
    );
}

function EmptyEditor() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 select-none bg-editor">
            <Icons.Code2 className="w-16 h-16 text-muted/20" />
            <div className="text-center">
                <p className="text-sm font-medium text-secondary mb-1">
                    No file open
                </p>
                <p className="text-xs text-muted">
                    Select a file from the explorer or create a new one
                </p>
            </div>
        </div>
    );
}

export function FileExplorer() {
    const {
        tree, openFileIds, activeFileId, renamingId,
        getNode, openFile, closeFile, updateContent,
        toggleFolder, createFile, createFolder,
        deleteNode, renameNode, startRename, cancelRename,
    } = useFileSystem();

    const [showChat, setShowChat] = useState(true);
    const [showSidebar, setShowSidebar] = useState(true);
    const [viewMode, setViewMode] = useState('code'); // 'code' | 'preview' | 'split'
    const [changedLines, setChangedLines] = useState([]);
    const [pendingChange, setPendingChange] = useState(null);

    // Custom Sidebar Resizing Logic
    const [sidebarWidth, setSidebarWidth] = useState(260);
    const isDragging = useRef(false);

    const activeNode = activeFileId ? getNode(activeFileId) : null;
    const activePath = activeFileId
        ? (getNodePath(tree, activeFileId) ?? activeNode?.name)
        : null;

    useEffect(() => {
        if (!pendingChange) setChangedLines([]);
    }, [activeFileId]); // eslint-disable-line

    function handleCreate(parentId, type) {
        const name = window.prompt(`${type === 'file' ? 'File' : 'Folder'} name:`);
        if (!name?.trim()) return;
        type === 'file' ? createFile(parentId, name.trim()) : createFolder(parentId, name.trim());
    }

    function handleApplyChanges(targetFilePath, newContent, lines) {
        let node = findNodeByPath(tree, targetFilePath);
        if (!node) {
            const fileName = targetFilePath.split('/').pop();
            node = findNodeByName(tree, fileName);
        }
        if (!node || node.type !== 'file') return;

        const originalContent = node.content ?? '';

        openFile(node.id);
        updateContent(node.id, newContent);
        setChangedLines(lines);

        setPendingChange({
            nodeId: node.id,
            filePath: targetFilePath,
            originalContent,
            changedLines: lines,
        });
    }

    function handleAccept() {
        setChangedLines([]);
        setPendingChange(null);
    }

    function handleReject() {
        if (!pendingChange) return;
        updateContent(pendingChange.nodeId, pendingChange.originalContent);
        setChangedLines([]);
        setPendingChange(null);
    }

    // --- Resize logic ---
    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleMouseMove = (moveEvent) => {
            if (!isDragging.current) return;

            // Calculate delta correctly.
            // Dragging left (smaller X) -> reduce sidebar width -> increase editor width
            // Dragging right (larger X) -> increase sidebar width -> reduce editor width
            let newWidth = moveEvent.clientX - 48; // 48 is Activity Bar width

            // Clamp min/max widths
            if (newWidth < 150) newWidth = 150;
            if (newWidth > 600) newWidth = 600;

            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            document.body.style.cursor = 'default';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }, []);

    const allFiles = flattenTree(tree);
    const fileNames = [...new Set(Object.keys(allFiles).map(p => p.split('/').pop()))];

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-primary font-sans">

            {/* ── Activity Bar ───────────────────────────────────────────────────── */}
            <div className="w-12 flex-shrink-0 flex flex-col items-center py-2 gap-1 bg-background border-r border-border-subtle z-10">
                <ActivityIcon title="Explorer" active={showSidebar} onClick={() => setShowSidebar(s => !s)}>
                    <Icons.FileBox className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </ActivityIcon>

                <div className="flex-1" />

                <ActivityIcon title="AI Chat" active={showChat} onClick={() => setShowChat(s => !s)} hasNotification={!!pendingChange}>
                    <Icons.Sparkles className="w-[22px] h-[22px]" strokeWidth={1.5} />
                </ActivityIcon>
            </div>

            {/* ── Sidebar + Editor Area ──────────────────────────────────────────── */}
            <div className="flex flex-1 min-w-0">

                {/* Sidebar */}
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

                        {/* Resize Handle */}
                        <div
                            onMouseDown={handleMouseDown}
                            className="w-[1px] bg-border-subtle hover:bg-accent cursor-col-resize flex-shrink-0 relative z-10 after:content-[''] after:absolute after:inset-y-0 after:-left-1 after:w-3 after:cursor-col-resize transition-colors"
                        />
                    </>
                )}

                {/* Editor */}
                <div className="flex-1 flex flex-col overflow-hidden bg-editor min-w-0">

                    {/* ── Tab bar ─────────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between bg-background border-b border-border-subtle h-10 flex-shrink-0 overflow-hidden">
                        <div className="flex items-center h-full overflow-hidden flex-1">
                            <TabBar
                                openFileIds={openFileIds} activeFileId={activeFileId}
                                getNode={getNode} onActivate={openFile} onClose={closeFile}
                            />
                            {/* Breadcrumb path */}

                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-0.5 px-3 h-full border-l border-border-subtle bg-sidebar">
                            <button
                                onClick={() => setViewMode('code')}
                                title="Code"
                                className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${viewMode === 'code' ? 'bg-active text-primary' : 'text-muted hover:text-primary hover:bg-hover'}`}
                            >
                                <Icons.Code2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('preview')}
                                title="Preview"
                                className={`flex items-center justify-center p-1.5 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-active text-primary' : 'text-muted hover:text-primary hover:bg-hover'}`}
                            >
                                <Icons.AppWindow className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Editor & Preview Area ───────────────────────────────────── */}
                    <div className="flex-1 flex min-h-0 relative">
                        {/* Editor Container */}
                        {(viewMode === 'code') && (
                            <div className="flex-1 flex flex-col min-w-0 bg-editor">
                                {activeNode ? (
                                    <CodeView
                                        key={activeNode.id}
                                        code={activeNode.content ?? ''}
                                        filePath={activePath}
                                        onChange={v => updateContent(activeNode.id, v)}
                                        changedLines={changedLines}
                                    />
                                ) : (
                                    <EmptyEditor />
                                )}
                            </div>
                        )}

                        {/* Preview Container */}
                        {(viewMode === 'preview') && (
                            <div className={`flex flex-col min-w-0 flex-1`}>
                                <PreviewPanel onClose={viewMode === 'preview' ? () => setViewMode('code') : null} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Chat panel ─────────────────────────────────────────────────────── */}
            {showChat && (
                <div className="w-[360px] flex-shrink-0 border-l border-border-subtle flex flex-col bg-sidebar">
                    <ChatPanel
                        allFiles={allFiles}
                        fileNames={fileNames}
                        pendingChange={pendingChange}
                        onApplyChanges={handleApplyChanges}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onClose={() => setShowChat(false)}
                    />
                </div>
            )}
        </div>
    );
}