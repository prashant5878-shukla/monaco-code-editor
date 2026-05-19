import { useEffect, useRef } from 'react';
import { getFileIcon, Icons } from '../../lib/icons';

export function TabBar({ openFileIds, activeFileId, getNode, onActivate, onClose }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !activeFileId) return;
    const activeTab = containerRef.current.querySelector('[data-active="true"]');
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeFileId]);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 overflow-x-auto overflow-y-hidden min-w-0 no-scrollbar h-full bg-background"
    >
      {openFileIds.map(id => {
        const node = getNode(id);
        if (!node) return null;
        const active = id === activeFileId;

        return (
          <div
            key={id}
            onClick={() => onActivate(id)}
            title={node.name}
            data-active={active ? "true" : "false"}
            className={`group relative flex items-center gap-2.5 px-4 h-full cursor-pointer select-none whitespace-nowrap flex-shrink-0 text-sm font-sans transition-colors border-r border-border-subtle
                       
              ${active
                ? 'bg-editor text-primary font-medium'
                : 'bg-background text-secondary hover:bg-hover'
              }`}
          >
            {/* Active indicator top bar */}
            {active && (
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            )}

            {/* File type icon */}
            <span className={`flex items-center justify-center flex-shrink-0 transition-opacity ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
              {getFileIcon(node.name, false)}
            </span>

            <span className="overflow-hidden text-ellipsis max-w-[150px]">
              {node.name}
            </span>

            {/* Close btn */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(id); }}
              className={`flex items-center justify-center w-[18px] h-[18px] rounded transition-colors
                ${active ? 'opacity-100 text-muted hover:bg-hover hover:text-primary' : 'opacity-0 group-hover:opacity-100 text-muted hover:bg-hover hover:text-primary'}
              `}
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}