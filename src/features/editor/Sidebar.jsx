import { useState } from 'react';
import { TreeView } from './TreeView';
import { Icons } from '../../lib/icons';

function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent
                 text-muted border border-transparent
                 hover:bg-accent/10 hover:text-accent hover:border-accent/25
                 active:scale-95 transition-all duration-150 cursor-pointer flex-shrink-0"
    >
      {children}
    </button>
  );
}

export function Sidebar({ tree, activeFileId, renamingId, onOpen, onToggle, onCreate, onDelete, onStartRename, onRename, onCancelRename }) {
  return (
    <div className="flex flex-col h-full bg-sidebar overflow-hidden border-t-2 border-t-accent">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle flex-shrink-0 h-10">
        <span className="text-[11px] font-bold text-secondary uppercase tracking-widest overflow-hidden text-ellipsis whitespace-nowrap font-sans">
          {tree.name}
        </span>

        <div className="flex items-center gap-1 flex-shrink-0">
          <IconBtn title="New File" onClick={() => onCreate(tree.id, 'file')}>
            <Icons.FilePlus className="w-[14px] h-[14px]" strokeWidth={2} />
          </IconBtn>
          <IconBtn title="New Folder" onClick={() => onCreate(tree.id, 'folder')}>
            <Icons.FolderPlus className="w-[14px] h-[14px]" strokeWidth={2} />
          </IconBtn>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-1 no-scrollbar">
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