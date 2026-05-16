export function genId() {
    return Math.random().toString(36).slice(2, 10);
}

export function getLanguage(fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const map = {
        js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
        ts: 'typescript', tsx: 'typescript',
        html: 'html', htm: 'html',
        css: 'css', scss: 'scss', less: 'less',
        json: 'json',
        md: 'markdown', mdx: 'markdown',
        yml: 'yaml', yaml: 'yaml',
        py: 'python', go: 'go', rs: 'rust',
        sh: 'shell', bash: 'shell',
        sql: 'sql', xml: 'xml', svg: 'xml', toml: 'toml',
    };
    return map[ext] ?? 'plaintext';
}

export function getFileColor(name) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const colors = {
        js: '#f7df1e', jsx: '#61dafb', ts: '#3178c6', tsx: '#3178c6',
        css: '#264de4', scss: '#cc6699', html: '#e34f26',
        json: '#cbcb41', md: '#519aba', py: '#3572a5',
        go: '#00add8', rs: '#dea584', sh: '#89d051',
        yml: '#cb171e', yaml: '#cb171e',
    };
    return colors[ext] ?? '#858585';
}

// Full path of a node e.g. "src/components/App.jsx"
export function getNodePath(root, targetId) {
    function walk(node, path) {
        const current = path ? `${path}/${node.name}` : node.name;
        if (node.id === targetId) return current;
        for (const child of node.children ?? []) {
            const result = walk(child, current);
            if (result) return result;
        }
        return null;
    }
    for (const child of root.children ?? []) {
        const result = walk(child, '');
        if (result) return result;
    }
    return null;
}

// Flatten the tree into { "src/App.jsx": "content", ... }
// Sent to Gemini so it knows the full project
export function flattenTree(root) {
    const out = {};
    function walk(node, path) {
        const current = path ? `${path}/${node.name}` : node.name;
        if (node.type === 'file') {
            out[current] = node.content ?? '';
        }
        for (const child of node.children ?? []) {
            walk(child, current);
        }
    }
    for (const child of root.children ?? []) {
        walk(child, '');
    }
    return out;
}

// Find a node by its path e.g. "src/components/App.jsx"
export function findNodeByPath(root, targetPath) {
    const parts = targetPath.split('/').filter(Boolean);
    let node = root;
    for (const part of parts) {
        node = (node.children ?? []).find(c => c.name === part);
        if (!node) return null;
    }
    return node;
}

// Find the first file whose name matches (case-insensitive)
// Used when Gemini returns just a filename without path
export function findNodeByName(root, name) {
    if (root.type === 'file' && root.name.toLowerCase() === name.toLowerCase()) return root;
    for (const child of root.children ?? []) {
        const found = findNodeByName(child, name);
        if (found) return found;
    }
    return null;
}