import { useRef, useEffect, useCallback, useState } from 'react';
import { Icons } from '../../lib/icons';

const TERMINAL_TABS = ['Terminal', 'Output'];

export function Terminal({ logs = [], isOpen, height, onToggle, onClear, onHeightChange }) {
    const bottomRef   = useRef(null);
    const isDragging  = useRef(false);
    const dragStartY  = useRef(0);
    const dragStartH  = useRef(0);
    const [activeTab, setActiveTab] = useState('Terminal');

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    // ── Drag-to-resize ────────────────────────────────────────────────────────
    const handleDragMouseDown = useCallback(e => {
        e.preventDefault();
        isDragging.current  = true;
        dragStartY.current  = e.clientY;
        dragStartH.current  = height;
        document.body.style.cursor    = 'row-resize';
        document.body.style.userSelect = 'none';

        const onMove = ev => {
            if (!isDragging.current) return;
            const delta = dragStartY.current - ev.clientY;
            const newH  = Math.min(500, Math.max(80, dragStartH.current + delta));
            onHeightChange(newH);
        };
        const onUp = () => {
            isDragging.current = false;
            document.body.style.cursor    = 'default';
            document.body.style.userSelect = 'auto';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    }, [height, onHeightChange]);

    return (
        <div
            style={{
                height: isOpen ? height : 0,
                overflow: 'hidden',
                transition: 'height 0.15s ease',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* 4px drag handle at very top */}
            <div
                onMouseDown={handleDragMouseDown}
                style={{ height: 4, backgroundColor: '#3c3c3c', flexShrink: 0, cursor: 'row-resize' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#569cd6'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#3c3c3c'; }}
            />

            {/* VS Code-style panel header */}
            <div
                style={{ backgroundColor: '#252526', borderTop: '1px solid #3c3c3c', height: 36, flexShrink: 0 }}
                className="flex items-center px-2"
            >
                {/* Left: tabs */}
                <div className="flex items-center flex-1 h-full">
                    {TERMINAL_TABS.map(tab => {
                        const active = tab === activeTab;
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: active ? '2px solid #569cd6' : '2px solid transparent',
                                    color: active ? '#cccccc' : '#858585',
                                    height: 36,
                                    padding: '0 12px',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                                onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#cccccc'; }}
                                onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#858585'; }}
                            >
                                {tab.toUpperCase()}
                            </button>
                        );
                    })}
                </div>

                {/* Right: icon buttons */}
                <div className="flex items-center gap-0.5">
                    {/* + new terminal (visual only) */}
                    <button
                        title="New Terminal"
                        style={{ backgroundColor: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2d2e'; e.currentTarget.style.color = '#cccccc'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
                    >
                        <Icons.Plus className="w-3.5 h-3.5" />
                    </button>
                    {/* Trash — clear logs */}
                    <button
                        onClick={onClear}
                        title="Clear"
                        style={{ backgroundColor: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2d2e'; e.currentTarget.style.color = '#cccccc'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
                    >
                        <Icons.Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* × — close panel */}
                    <button
                        onClick={onToggle}
                        title="Close Panel"
                        style={{ backgroundColor: 'transparent', border: 'none', color: '#858585', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2a2d2e'; e.currentTarget.style.color = '#cccccc'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#858585'; }}
                    >
                        <Icons.X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Terminal body */}
            <div
                style={{ backgroundColor: '#1e1e1e', flex: 1, overflowY: 'auto', padding: 12, scrollbarWidth: 'none' }}
            >
                {/* Prompt line */}
                <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: '#4ec9b0' }} className="font-mono text-[11px]">
                        user@sandbox:~$
                    </span>
                </div>

                {/* Logs */}
                {logs.length === 0 ? (
                    <span style={{ color: 'rgba(133,133,133,0.5)' }} className="font-mono text-[11px]">
                        Run a project to see output…
                    </span>
                ) : (
                    logs.map((log, i) => (
                        <div
                            key={i}
                            style={{ color: log.type === 'err' ? '#f48771' : '#cccccc' }}
                            className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                        >
                            {log.text}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
