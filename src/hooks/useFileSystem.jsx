import { useCallback, useState } from 'react';
import { genId, buildTreeFromFlat } from '../lib/fileUtils';

// ── Pure tree helpers ─────────────────────────────────────────────────────────

function findById(node, id) {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
        const found = findById(child, id);
        if (found) return found;
    }
    return null;
}

function updateNode(tree, id, updater) {
    if (tree.id === id) return { ...tree, ...updater(tree) };
    if (!tree.children) return tree;
    return { ...tree, children: tree.children.map(c => updateNode(c, id, updater)) };
}

function removeNode(tree, id) {
    if (!tree.children) return tree;
    return {
        ...tree,
        children: tree.children
            .filter(c => c.id !== id)
            .map(c => removeNode(c, id)),
    };
}

function insertNode(tree, parentId, newNode) {
    if (tree.id === parentId) {
        const children = tree.children ?? [];
        const insertAt = newNode.type === 'folder'
            ? 0
            : children.filter(c => c.type === 'folder').length;
        const next = [...children];
        next.splice(insertAt, 0, newNode);
        return { ...tree, expanded: true, children: next };
    }
    if (!tree.children) return tree;
    return { ...tree, children: tree.children.map(c => insertNode(c, parentId, newNode)) };
}

function collectFileIds(node) {
    if (node.type === 'file') return [node.id];
    return (node.children ?? []).flatMap(collectFileIds);
}

// ── Path-based helpers (used by applyGeneratedFiles) ─────────────────────────

// Find a node by navigating a path array e.g. ['src', 'App.jsx']
function findByPathParts(node, parts) {
    if (parts.length === 0) return node;
    const [head, ...rest] = parts;
    const child = (node.children ?? []).find(c => c.name === head);
    if (!child) return null;
    return findByPathParts(child, rest);
}

// Returns { tree, id } where id is the file's id (new or existing).
function insertFileAtPath(root, pathStr, content) {
    const parts = pathStr.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    const folderParts = parts.slice(0, -1);

    // File already exists → just update its content
    const existing = findByPathParts(root, parts);
    if (existing && existing.type === 'file') {
        return {
            tree: updateNode(root, existing.id, () => ({ content })),
            id: existing.id,
        };
    }

    const fileId = genId();
    const newFile = { id: fileId, name: fileName, type: 'file', content };

    return { tree: ensureFolderAndInsert(root, folderParts, newFile), id: fileId };
}

function ensureFolderAndInsert(node, folderParts, fileNode) {
    if (folderParts.length === 0) {
        // We're at the right level — insert the file
        const children = node.children ?? [];
        const insertAt = children.filter(c => c.type === 'folder').length;
        const next = [...children];
        next.splice(insertAt, 0, fileNode);
        return { ...node, expanded: true, children: next };
    }

    const [head, ...rest] = folderParts;
    const existingIdx = (node.children ?? []).findIndex(
        c => c.type === 'folder' && c.name === head
    );

    if (existingIdx >= 0) {
        // Folder exists — recurse into it
        const children = [...node.children];
        children[existingIdx] = ensureFolderAndInsert(children[existingIdx], rest, fileNode);
        return { ...node, children, expanded: true };
    } else {
        // Folder doesn't exist — create it, recurse into it, append to children
        const newFolder = { id: genId(), name: head, type: 'folder', expanded: true, children: [] };
        const filled = ensureFolderAndInsert(newFolder, rest, fileNode);
        return {
            ...node,
            expanded: true,
            children: [...(node.children ?? []), filled],
        };
    }
}

// ── Initial file system ───────────────────────────────────────────────────────

export const INITIAL_TREE = {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    expanded: false,
    children: [
        {
            id: 'src-folder',
            name: 'src',
            type: 'folder',
            expanded: true,
            children: [
                {
                    id: 'app-jsx',
                    name: 'App.jsx',
                    type: 'file',
                    content: `import './App.css'

function App() {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
      <p>Open a file from the sidebar to start editing.</p>
    </div>
  )
}

export default App`,
                },
                {
                    id: 'app-css',
                    name: 'App.css',
                    type: 'file',
                    content: `.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: sans-serif;
}

h1 {
  color: #61dafb;
}`,
                },
                {
                    id: 'main-jsx',
                    name: 'main.jsx',
                    type: 'file',
                    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
                },
            ],
        },
        {
            id: 'components-folder',
            name: 'components',
            type: 'folder',
            expanded: false,
            children: [
                {
                    id: 'button-jsx',
                    name: 'Button.jsx',
                    type: 'file',
                    content: `export function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button
      className={\`btn btn--\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
                },
            ],
        },
        {
            id: 'pkg-json',
            name: 'package.json',
            type: 'file',
            content: `{
  "name": "my-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}`,
        },
        {
            id: 'readme-md',
            name: 'README.md',
            type: 'file',
            content: `# My Project\n\nA cool project.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\``,
        },
    ],
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useFileSystem(initialTree = INITIAL_TREE) {
    const [tree, setTree] = useState(initialTree);
    const [openFileIds, setOpenFileIds] = useState(['app-jsx']);
    const [activeFileId, setActiveFileId] = useState('app-jsx');
    const [renamingId, setRenamingId] = useState(null);

    const getNode = useCallback(id => findById(tree, id), [tree]);

    const openFile = useCallback(id => {
        const node = findById(tree, id);
        if (!node || node.type !== 'file') return;
        setOpenFileIds(prev => (prev.includes(id) ? prev : [...prev, id]));
        setActiveFileId(id);
    }, [tree]);

    const closeFile = useCallback(id => {
        setOpenFileIds(prev => {
            const next = prev.filter(f => f !== id);
            setActiveFileId(curr => {
                if (curr !== id) return curr;
                const idx = prev.indexOf(id);
                return next[Math.min(idx, next.length - 1)] ?? null;
            });
            return next;
        });
    }, []);

    const updateContent = useCallback((id, content) => {
        setTree(prev => updateNode(prev, id, () => ({ content })));
    }, []);

    const toggleFolder = useCallback(id => {
        setTree(prev => updateNode(prev, id, node => ({ expanded: !node.expanded })));
    }, []);

    const createFile = useCallback((parentId, name) => {
        const id = genId();
        setTree(prev => insertNode(prev, parentId, { id, name, type: 'file', content: '' }));
        setTimeout(() => {
            setOpenFileIds(prev => [...prev, id]);
            setActiveFileId(id);
        }, 0);
        return id;
    }, []);

    const createFolder = useCallback((parentId, name) => {
        const id = genId();
        setTree(prev => insertNode(prev, parentId, { id, name, type: 'folder', expanded: true, children: [] }));
        return id;
    }, []);

    const deleteNode = useCallback(id => {
        const node = findById(tree, id);
        if (!node) return;
        const fileIds = collectFileIds(node);
        setTree(prev => removeNode(prev, id));
        setOpenFileIds(prev => {
            const next = prev.filter(f => !fileIds.includes(f));
            setActiveFileId(curr =>
                fileIds.includes(curr) ? (next[next.length - 1] ?? null) : curr,
            );
            return next;
        });
    }, [tree]);

    const renameNode = useCallback((id, newName) => {
        if (newName.trim()) {
            setTree(prev => updateNode(prev, id, () => ({ name: newName.trim() })));
        }
        setRenamingId(null);
    }, []);

    const startRename = useCallback(id => setRenamingId(id), []);
    const cancelRename = useCallback(() => setRenamingId(null), []);

    const resetTree = useCallback((flatFiles) => {
        setTree(buildTreeFromFlat(flatFiles));
        setOpenFileIds([]);
        setActiveFileId(null);
        setRenamingId(null);
    }, []);

    const applyGeneratedFiles = useCallback((files) => {
        const ids = [];

        setTree(prev => {
            let next = prev;
            for (const { path, content } of files) {
                const result = insertFileAtPath(next, path, content);
                next = result.tree;
                ids.push(result.id);
            }
            return next;
        });

        // Open all affected files after the tree update flushes, activate the first one
        setTimeout(() => {
            setOpenFileIds(prev => [...new Set([...prev, ...ids])]);
            setActiveFileId(ids[0] ?? null);
        }, 0);
    }, []);

    return {
        tree, openFileIds, activeFileId, renamingId,
        getNode, openFile, closeFile, updateContent,
        toggleFolder, createFile, createFolder,
        deleteNode, renameNode, startRename, cancelRename,
        resetTree, applyGeneratedFiles,
    };
}