import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ContextMenu({ x, y, nodeType, onNewFile, onNewFolder, onRename, onDelete, onClose }) {
    useEffect(() => {
        const close = () => onClose();
        const onKey = e => e.key === 'Escape' && onClose();
        window.addEventListener('mousedown', close);
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('mousedown', close);
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const items = [
        ...(nodeType === 'folder' ? [
            { label: 'New File', icon: '📄', action: onNewFile },
            { label: 'New Folder', icon: '📁', action: onNewFolder },
            { divider: true },
        ] : []),
        { label: 'Rename', icon: '✏️', action: onRename },
        { label: 'Delete', icon: '🗑️', action: onDelete, danger: true },
    ];

    return createPortal(
        <div
            className="fixed bg-[#252526] border border-[#454545] rounded-lg p-1 min-w-[160px] shadow-[0_6px_24px_rgba(0,0,0,0.6)] z-[9999]"
            style={{ top: y, left: x }}
            onMouseDown={e => e.stopPropagation()}
        >
            {items.map((item, i) =>
                item.divider ? (
                    <div key={i} className="h-px bg-[#3c3c3c] my-1" />
                ) : (
                    <button
                        key={i}
                        onClick={() => { item.action(); onClose(); }}
                        className={`flex items-center gap-2 w-full px-2.5 py-1.5 text-[13px] rounded text-left cursor-pointer
              ${item.danger
                                ? 'text-[#f48771] hover:bg-[rgba(244,135,113,0.12)]'
                                : 'text-[#ccc] hover:bg-white/[0.07]'
                            }`}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                )
            )}
        </div>,
        document.body,
    );
}