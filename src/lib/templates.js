// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL for E2B:
//   • Vite needs  "--host"  so it binds to 0.0.0.0, not just 127.0.0.1
//   • Express needs  app.listen(port, '0.0.0.0')  for the same reason
//   • Without this, getHost() returns a URL nobody outside the sandbox can reach
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATES = {

    // ── React + Vite ─────────────────────────────────────────────────────────────
    'react-vite': {
        label: 'React + Vite',
        description: 'Frontend-only React app',
        installCommand: 'npm install',
        runCommand: 'npm run dev -- --host',   // --host  ← mandatory for E2B
        port: 5173,
        files: {
            'package.json': JSON.stringify({
                name: 'react-app',
                version: '1.0.0',
                type: 'module',
                scripts: { dev: 'vite', build: 'vite build' },
                dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
                devDependencies: { '@vitejs/plugin-react': '^4.2.1', vite: '^5.2.0' },
            }, null, 2),

            'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: true, allowedHosts: true },   // same as --host flag
})
`,
            'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
            'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,
            'src/App.jsx': `export default function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1>Hello from React ⚛</h1>
      <p>Edit <code>src/App.jsx</code> and watch it update.</p>
    </div>
  )
}
`,
        },
    },

    // ── Node.js + Express ─────────────────────────────────────────────────────────
    'node-express': {
        label: 'Node.js + Express',
        description: 'REST API server',
        installCommand: 'npm install',
        runCommand: 'node server.js',
        port: 3000,
        files: {
            'package.json': JSON.stringify({
                name: 'express-app',
                version: '1.0.0',
                scripts: { start: 'node server.js' },
                dependencies: { express: '^4.19.2' },
            }, null, 2),

            'server.js': `const express = require('express')
const app = express()
const PORT = 3000

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express!', timestamp: new Date().toISOString() })
})

app.get('/api/hello', (req, res) => {
  res.json({ hello: 'world' })
})

// '0.0.0.0' is REQUIRED so E2B can expose the port externally
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`)
})
`,
        },
    },

    // ── Full-stack: React + Express ───────────────────────────────────────────────
    // Strategy: Vite proxies /api → Express on :3001
    // Only one E2B port is needed for preview (5173)
    // The React code uses relative /api paths — they always work
    'fullstack': {
        label: 'Full-stack (React + Express)',
        description: 'React frontend + Express API with proper folder structure',
        installCommand: 'cd frontend && npm install && cd ../backend && npm install',
        runCommand: 'node backend/server.js & cd frontend && npm run dev',
        port: 5173,
        files: {

            // ── Backend ───────────────────────────────────────────────────────────────
            'backend/package.json': JSON.stringify({
                name: 'backend',
                version: '1.0.0',
                type: 'module',          // ESM throughout
                scripts: { start: 'node server.js', dev: 'node --watch server.js' },
                dependencies: { express: '^4.19.2', cors: '^2.8.5' },
            }, null, 2),

            'backend/server.js': `import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express!', time: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 0.0.0.0 is required for E2B to expose the port
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`API running on http://localhost:\${PORT}\`)
})
`,

            // ── Frontend ──────────────────────────────────────────────────────────────
            'frontend/package.json': JSON.stringify({
                name: 'frontend',
                version: '1.0.0',
                type: 'module',
                scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
                dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
                devDependencies: { '@vitejs/plugin-react': '^4.2.1', vite: '^5.2.0' },
            }, null, 2),

            'frontend/vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      // All /api calls are forwarded to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
`,

            'frontend/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Full-Stack App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

            'frontend/src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`,

            'frontend/src/App.jsx': `import { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    fetch('/api/hello')
      .then(r => {
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`)
        return r.json()
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  return (
    <div className="app">
      <h1>Full-Stack App 🚀</h1>
      <div className="card">
        <h2>Backend says:</h2>
        {loading && <p className="loading">Loading…</p>}
        {error   && <p className="error">Error: {error}</p>}
        {data    && (
          <>
            <p className="message">{data.message}</p>
            <p className="time">{data.time}</p>
          </>
        )}
      </div>
    </div>
  )
}
`,

            'frontend/src/App.css': `* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0f0f0f;
  color: #ececec;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.app {
  text-align: center;
  padding: 2rem;
}

h1 { font-size: 2rem; margin-bottom: 1.5rem; }

.card {
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  min-width: 300px;
}

h2 { font-size: 0.85rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }

.message { font-size: 1.1rem; font-weight: 500; margin-bottom: 0.5rem; }
.time    { font-size: 0.8rem; color: #666; font-family: monospace; }
.loading { color: #888; }
.error   { color: #f87171; }
`,

            // ── Root level ─────────────────────────────────────────────────────────────
            'README.md': `# Full-Stack App

## Structure
\`\`\`
/
├── backend/          Express API (port 3001)
│   ├── server.js
│   └── package.json
└── frontend/         React + Vite (port 5173)
    ├── src/
    ├── vite.config.js
    └── package.json
\`\`\`

## Dev
\`\`\`bash
# Terminal 1
cd backend && npm install && node server.js

# Terminal 2
cd frontend && npm install && npm run dev
\`\`\`

Vite proxies \`/api/*\` → Express on :3001, so no CORS issues.
`,
        },
    },

};