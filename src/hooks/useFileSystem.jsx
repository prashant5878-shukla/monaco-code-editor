import { useCallback, useState } from 'react';
import { genId } from '../lib/fileUtils';

// ── Pure tree helpers (no mutation) ──────────────────────────────────────────

function findById(node, id) {
    if (node.id === id) return node;
    for (const child of node.children ?? []) {
        const found = findById(child, id);
        if (found) return found;
    }
    return null;
}

// Returns a new tree with the matching node replaced by updater(node)
function updateNode(tree, id, updater) {
    if (tree.id === id) return { ...tree, ...updater(tree) };
    if (!tree.children) return tree;
    return { ...tree, children: tree.children.map(c => updateNode(c, id, updater)) };
}

// Returns a new tree with the node removed
function removeNode(tree, id) {
    if (!tree.children) return tree;
    return {
        ...tree,
        children: tree.children
            .filter(c => c.id !== id)
            .map(c => removeNode(c, id)),
    };
}

// Returns a new tree with newNode inserted into parentId's children
function insertNode(tree, parentId, newNode) {
    if (tree.id === parentId) {
        const children = tree.children ?? [];
        // Keep folders before files
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

// Collect every file id in a subtree (used when deleting a folder)
function collectFileIds(node) {
    if (node.type === 'file') return [node.id];
    return (node.children ?? []).flatMap(collectFileIds);
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
                    content:
                        `import './App.css'

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
                    content:
                        `.app {
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
                    content:
                        `import React from 'react'
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
                    content:
                        `export function Button({ children, onClick, variant = 'primary' }) {
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
            content:
                `{
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

    // Open a file tab and make it active
    const openFile = useCallback(id => {
        const node = findById(tree, id);
        if (!node || node.type !== 'file') return;
        setOpenFileIds(prev => (prev.includes(id) ? prev : [...prev, id]));
        setActiveFileId(id);
    }, [tree]);

    // Close a tab. If it was active, activate the nearest remaining tab
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

    // Update file content (called by Monaco onChange)
    const updateContent = useCallback((id, content) => {
        setTree(prev => updateNode(prev, id, () => ({ content })));
    }, []);

    // Expand / collapse a folder
    const toggleFolder = useCallback(id => {
        setTree(prev => updateNode(prev, id, node => ({ expanded: !node.expanded })));
    }, []);

    // Create a new file inside parentId
    const createFile = useCallback((parentId, name) => {
        const id = genId();
        setTree(prev => insertNode(prev, parentId, { id, name, type: 'file', content: '' }));
        // Open the new file after state flushes
        setTimeout(() => {
            setOpenFileIds(prev => [...prev, id]);
            setActiveFileId(id);
        }, 0);
        return id;
    }, []);

    // Create a new folder inside parentId
    const createFolder = useCallback((parentId, name) => {
        const id = genId();
        setTree(prev => insertNode(prev, parentId, { id, name, type: 'folder', expanded: true, children: [] }));
        return id;
    }, []);

    // Delete a node (and close any open tabs for files inside it)
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

    // Commit a rename
    const renameNode = useCallback((id, newName) => {
        if (newName.trim()) {
            setTree(prev => updateNode(prev, id, () => ({ name: newName.trim() })));
        }
        setRenamingId(null);
    }, []);

    const startRename = useCallback(id => setRenamingId(id), []);
    const cancelRename = useCallback(() => setRenamingId(null), []);

    return {
        tree,
        openFileIds,
        activeFileId,
        renamingId,
        getNode,
        openFile,
        closeFile,
        updateContent,
        toggleFolder,
        createFile,
        createFolder,
        deleteNode,
        renameNode,
        startRename,
        cancelRename,
    };
}