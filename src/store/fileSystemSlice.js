import { createSlice } from '@reduxjs/toolkit';
import { genId, buildTreeFromFlat } from '../lib/fileUtils';

// ── Pure tree helpers (used only by reducers) ─────────────────────────────────

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

function findByPathParts(node, parts) {
    if (parts.length === 0) return node;
    const [head, ...rest] = parts;
    const child = (node.children ?? []).find(c => c.name === head);
    if (!child) return null;
    return findByPathParts(child, rest);
}

function ensureFolderAndInsert(node, folderParts, fileNode) {
    if (folderParts.length === 0) {
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
        const children = [...node.children];
        children[existingIdx] = ensureFolderAndInsert(children[existingIdx], rest, fileNode);
        return { ...node, children, expanded: true };
    } else {
        const newFolder = { id: genId(), name: head, type: 'folder', expanded: true, children: [] };
        const filled = ensureFolderAndInsert(newFolder, rest, fileNode);
        return {
            ...node,
            expanded: true,
            children: [...(node.children ?? []), filled],
        };
    }
}

function insertFileAtPath(root, pathStr, content) {
    const parts = pathStr.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    const folderParts = parts.slice(0, -1);
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

// ── Initial tree ──────────────────────────────────────────────────────────────

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

// ── Slice ─────────────────────────────────────────────────────────────────────

const initialState = {
    tree: INITIAL_TREE,
    openFileIds: ['app-jsx'],
    activeFileId: 'app-jsx',
    renamingId: null,
};

const fileSystemSlice = createSlice({
    name: 'fileSystem',
    initialState,
    reducers: {
        openFile(state, { payload: id }) {
            const node = findById(state.tree, id);
            if (!node || node.type !== 'file') return;
            if (!state.openFileIds.includes(id)) {
                state.openFileIds.push(id);
            }
            state.activeFileId = id;
        },

        closeFile(state, { payload: id }) {
            const idx = state.openFileIds.indexOf(id);
            if (idx === -1) return;
            state.openFileIds.splice(idx, 1);
            if (state.activeFileId === id) {
                const next = state.openFileIds;
                state.activeFileId = next[Math.min(idx, next.length - 1)] ?? null;
            }
        },

        updateContent(state, { payload: { id, content } }) {
            state.tree = updateNode(state.tree, id, () => ({ content }));
        },

        toggleFolder(state, { payload: id }) {
            state.tree = updateNode(state.tree, id, node => ({ expanded: !node.expanded }));
        },

        createFile(state, { payload: { parentId, name } }) {
            const id = genId();
            state.tree = insertNode(state.tree, parentId, { id, name, type: 'file', content: '' });
            if (!state.openFileIds.includes(id)) state.openFileIds.push(id);
            state.activeFileId = id;
        },

        createFolder(state, { payload: { parentId, name } }) {
            const id = genId();
            state.tree = insertNode(state.tree, parentId, {
                id, name, type: 'folder', expanded: true, children: [],
            });
        },

        deleteNode(state, { payload: id }) {
            const node = findById(state.tree, id);
            if (!node) return;
            const fileIds = collectFileIds(node);
            state.tree = removeNode(state.tree, id);
            state.openFileIds = state.openFileIds.filter(f => !fileIds.includes(f));
            if (fileIds.includes(state.activeFileId)) {
                state.activeFileId = state.openFileIds[state.openFileIds.length - 1] ?? null;
            }
        },

        renameNode(state, { payload: { id, newName } }) {
            if (newName.trim()) {
                state.tree = updateNode(state.tree, id, () => ({ name: newName.trim() }));
            }
            state.renamingId = null;
        },

        startRename(state, { payload: id }) {
            state.renamingId = id;
        },

        cancelRename(state) {
            state.renamingId = null;
        },

        resetTree(state, { payload: flatFiles }) {
            state.tree = buildTreeFromFlat(flatFiles);
            state.openFileIds = [];
            state.activeFileId = null;
            state.renamingId = null;
        },

        applyGeneratedFiles(state, { payload: files }) {
            const ids = [];
            let next = state.tree;
            for (const { path, content } of files) {
                const result = insertFileAtPath(next, path, content);
                next = result.tree;
                ids.push(result.id);
            }
            state.tree = next;
            const newOpen = [...new Set([...state.openFileIds, ...ids])];
            state.openFileIds = newOpen;
            state.activeFileId = ids[0] ?? state.activeFileId;
        },
    },
});

export const {
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
    resetTree,
    applyGeneratedFiles,
} = fileSystemSlice.actions;

export default fileSystemSlice.reducer;
