import { useEffect, useRef, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { getFileIcon } from '../lib/icons';

export function TreeNode({
  node, depth, activeFileId, renamingId,
  onOpen, onToggle, onCreate, onDelete, onStartRename, onRename, onCancelRename,
}) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const inputRef = useRef(null);
  
  const isRenaming = renamingId === node.id;
  const isActive = activeFileId === node.id;
  const isFolder = node.type === 'folder';

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      const dot = inputRef.current.value.lastIndexOf('.');
      inputRef.current.setSelectionRange(0, dot > 0 ? dot : inputRef.current.value.length);
    }
  }, [isRenaming]);

  return (
    <div className="w-full">
      <div
        className={`group flex items-center gap-2 h-7 pr-2 cursor-pointer select-none whitespace-nowrap rounded-sm mx-2 transition-colors relative
          ${isActive ? 'bg-active text-primary' : 'text-secondary hover:bg-hover hover:text-primary'}
        `}
        style={{ paddingLeft: `${depth * 14 + 4}px` }}
        onClick={(e) => {
          e.stopPropagation();
          isFolder ? onToggle(node.id) : onOpen(node.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onStartRename(node.id);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        title={node.name}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" />
        )}

        {/* Chevron for folders */}
        <span className="w-[18px] flex items-center justify-center flex-shrink-0">
          {isFolder && (
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`text-muted transition-transform duration-150 ${node.expanded ? 'rotate-90' : 'rotate-0'}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </span>

        {/* File/Folder Icon */}
        <span className="flex-shrink-0 flex items-center justify-center">
          {getFileIcon(node.name, isFolder, node.expanded)}
        </span>

        {/* Name or Rename Input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            className="flex-1 bg-active border border-accent text-primary text-[13px] font-sans px-1.5 py-0.5 rounded outline-none"
            defaultValue={node.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onRename(node.id, e.target.value);
              if (e.key === 'Escape') onCancelRename();
            }}
            onBlur={(e) => onRename(node.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-[13px] truncate font-sans tracking-wide">
            {node.name}
          </span>
        )}
      </div>

      {/* Children */}
      {isFolder && node.expanded && (
        <div className="relative">
          {/* Indent Guide Line */}
          <div
            className="absolute top-0 bottom-1 w-[1px] bg-border-subtle"
            style={{ left: `${depth * 14 + 13}px` }}
          />
          {(node.children ?? []).map((child) => (
            <TreeNode
              key={child.id} node={child} depth={depth + 1}
              activeFileId={activeFileId} renamingId={renamingId}
              onOpen={onOpen} onToggle={onToggle} onCreate={onCreate}
              onDelete={onDelete} onStartRename={onStartRename}
              onRename={onRename} onCancelRename={onCancelRename}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x} y={ctxMenu.y} nodeType={node.type}
          onNewFile={() => onCreate(node.id, 'file')}
          onNewFolder={() => onCreate(node.id, 'folder')}
          onRename={() => onStartRename(node.id)}
          onDelete={() => onDelete(node.id)}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}