import { useEffect, useRef } from 'react';
import { diffLines } from '../lib/diff';

const EDITOR_FONT_FAMILY = "'JetBrains Mono','Fira Code',Consolas,monospace";
const EDITOR_FONT_SIZE = 13.5;
const EDITOR_LINE_HEIGHT = 22;

export function useMonacoDiff(editorRef, monacoRef, pendingChange, currentCode, onStats) {
    const decorationIds = useRef([]);
    const zoneIds = useRef([]);

    useEffect(() => {
        const editor = editorRef.current;
        const monaco = monacoRef.current;
        if (!editor || !monaco) return;

        clearVisuals(editor, decorationIds, zoneIds);

        if (!pendingChange) {
            onStats?.(null);
            return;
        }

        const diff = diffLines(pendingChange.originalContent, currentCode);
        onStats?.({ additions: diff.additions, deletions: diff.deletions });

        applyGreenDecorations(editor, monaco, diff.added, decorationIds);
        applyRedZones(editor, diff.removed, zoneIds);

    }, [pendingChange, currentCode]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => {
            if (editorRef.current) clearVisuals(editorRef.current, decorationIds, zoneIds);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function clearVisuals(editor, decorationIds, zoneIds) {
    decorationIds.current = editor.deltaDecorations(decorationIds.current, []);

    editor.changeViewZones(acc => {
        zoneIds.current.forEach(id => acc.removeZone(id));
        zoneIds.current = [];
    });
}

function applyGreenDecorations(editor, monaco, addedLineNumbers, decorationIds) {
    decorationIds.current = editor.deltaDecorations(
        decorationIds.current,
        addedLineNumbers.map(line => ({
            range: new monaco.Range(line, 1, line, 1),
            options: {
                isWholeLine: true,
                className: 'ai-changed-line',
                linesDecorationsClassName: 'ai-changed-gutter',
            },
        })),
    );
}

function applyRedZones(editor, removedGroups, zoneIds) {
    editor.changeViewZones(acc => {
        zoneIds.current.forEach(id => acc.removeZone(id));
        zoneIds.current = [];

        removedGroups.forEach(group => {
            const id = acc.addZone({
                afterLineNumber: group.afterLine,
                heightInLines: group.lines.length,
                domNode: buildZoneDomNode(group.lines),
                suppressMouseDown: true,
            });
            zoneIds.current.push(id);
        });
    });
}

function buildZoneDomNode(lines) {
    const container = document.createElement('div');
    container.style.cssText = [
        `font-family: ${EDITOR_FONT_FAMILY}`,
        `font-size: ${EDITOR_FONT_SIZE}px`,
        `background: rgba(239,68,68,0.08)`,
        `border-left: 2px solid rgba(239,68,68,0.45)`,
        `box-sizing: border-box`,
        `width: 100%`,
        `overflow: hidden`,
    ].join(';');

    lines.forEach(text => {
        const row = document.createElement('div');
        row.style.cssText = [
            `height: ${EDITOR_LINE_HEIGHT}px`,
            `line-height: ${EDITOR_LINE_HEIGHT}px`,
            `color: rgba(239,68,68,0.6)`,
            `text-decoration: line-through`,
            `white-space: pre`,
            `overflow: hidden`,
        ].join(';');
        row.textContent = text;
        container.appendChild(row);
    });

    return container;
}