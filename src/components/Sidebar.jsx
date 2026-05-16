import { useState } from 'react';
import { TreeView } from './TreeView';
import { Icons } from '../lib/icons';

function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex items-center justify-center w-6 h-6 rounded bg-transparent text-muted hover:bg-hover hover:text-primary transition-colors flex-shrink-0"
    >
      {children}
    </button>
  );
}

export function Sidebar({ tree, activeFileId, renamingId, onOpen, onToggle, onCreate, onDelete, onStartRename, onRename, onCancelRename }) {
  return (
    <div className="flex flex-col h-full bg-sidebar overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle flex-shrink-0 h-10">
        <span className="text-xs font-semibold text-secondary uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap font-sans">
          {tree.name}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <IconBtn title="New File" onClick={() => onCreate(tree.id, 'file')}>
            <Icons.FilePlus className="w-[15px] h-[15px]" strokeWidth={2} />
          </IconBtn>
          <IconBtn title="New Folder" onClick={() => onCreate(tree.id, 'folder')}>
            <Icons.FolderPlus className="w-[15px] h-[15px]" strokeWidth={2} />
          </IconBtn>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2 no-scrollbar">
        <TreeView
          tree={tree} activeFileId={activeFileId} renamingId={renamingId}
          onOpen={onOpen} onToggle={onToggle} onCreate={onCreate}
          onDelete={onDelete} onStartRename={onStartRename}
          onRename={onRename} onCancelRename={onCancelRename}
        />
      </div>
    </div>
  );
}