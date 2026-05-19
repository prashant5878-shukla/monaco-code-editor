const VITE_BASE_FILES = {
  'package.json': JSON.stringify({
    name: 'react-todo',
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.2.1', vite: '^5.2.0' },
  }, null, 2),

  'vite.config.js': "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { host: true, allowedHosts: true },\n})\n",

  'index.html': "<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>Todo App</title>\n  </head>\n  <body>\n    <div id=\"root\"></div>\n    <script type=\"module\" src=\"/src/main.jsx\"></script>\n  </body>\n</html>\n",

  'src/main.jsx': "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './App.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n",

  'src/App.css': "* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f0f; color: #ececec; min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n.app { width: 100%; max-width: 480px; padding: 2rem; }\nh1 { font-size: 1.6rem; margin-bottom: 1.5rem; text-align: center; color: #e6edf3; }\n.form { display: flex; gap: 8px; margin-bottom: 1.5rem; }\n.form input { flex: 1; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 10px 14px; color: #ececec; font-size: 14px; }\n.form input:focus { outline: none; border-color: #3b82f6; }\n.form button, .add-btn { background: #3b82f6; color: white; border: none; border-radius: 8px; padding: 10px 16px; cursor: pointer; font-size: 14px; font-weight: 500; }\n.form button:hover, .add-btn:hover { background: #2563eb; }\n.todo-list { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-bottom: 1rem; }\n.todo-item { display: flex; align-items: center; gap: 10px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 12px 14px; transition: border-color 0.15s; }\n.todo-item.done .todo-title { text-decoration: line-through; color: #555; }\n.todo-title { flex: 1; font-size: 14px; cursor: pointer; user-select: none; color: #ececec; }\n.toggle-btn { background: none; border: 1px solid #444; border-radius: 4px; color: #666; cursor: pointer; font-size: 13px; padding: 2px 8px; transition: all 0.15s; }\n.todo-item.done .toggle-btn { border-color: #22c55e; color: #22c55e; }\n.toggle-btn:hover { border-color: #3b82f6; color: #3b82f6; }\n.delete-btn { background: none; border: none; color: #555; cursor: pointer; font-size: 18px; padding: 0 4px; line-height: 1; transition: color 0.15s; }\n.delete-btn:hover { color: #f87171; }\n.empty-state { text-align: center; color: #555; font-size: 14px; padding: 2rem 0; }\n.todo-count { text-align: center; font-size: 12px; color: #555; margin-top: 0.75rem; }\n"
};

export const TEMPLATES = {
  'react-todo': {
    label: 'React Todo App',
    description: 'Frontend todo app — implement with data-testid attributes',
    installCommand: 'npm install',
    runCommand: 'npm run dev -- --host',
    port: 5173,
    readyPattern: 'local:',
    files: {
      ...VITE_BASE_FILES,
      'src/App.jsx': "import { useState } from 'react'\nimport './App.css'\n\nexport default function App() {\n  const [todos, setTodos] = useState([])\n  const [input, setInput] = useState('')\n\n  // TODO: implement addTodo\n  // TODO: implement toggleTodo\n  // TODO: implement deleteTodo\n\n  return (\n    <div className=\"app\">\n      <h1>Todo App</h1>\n      {/* TODO: add input with data-testid=\"todo-input\" */}\n      {/* TODO: add button with data-testid=\"add-btn\" */}\n      {/* TODO: render empty state with data-testid=\"empty-state\" */}\n      {/* TODO: render list with data-testid=\"todo-list\" */}\n      {/* TODO: render count with data-testid=\"todo-count\" */}\n    </div>\n  )\n}\n"
    }
  },

  'react-todo-solution': {
    label: 'React Todo App (Solution)',
    description: 'Complete solution — passes all Scenario 1 and 2 tests',
    installCommand: 'npm install',
    runCommand: 'npm run dev -- --host',
    port: 5173,
    readyPattern: 'local:',
    files: {
      ...VITE_BASE_FILES,
      'src/App.jsx': "import { useState } from 'react'\nimport './App.css'\n\nexport default function App() {\n  const [todos, setTodos] = useState([])\n  const [input, setInput] = useState('')\n\n  function addTodo() {\n    const title = input.trim()\n    if (!title) return\n    setTodos(prev => [...prev, { id: Date.now(), title, done: false }])\n    setInput('')\n  }\n\n  function handleKeyDown(e) {\n    if (e.key === 'Enter') addTodo()\n  }\n\n  function toggleTodo(id) {\n    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))\n  }\n\n  function deleteTodo(id) {\n    setTodos(prev => prev.filter(t => t.id !== id))\n  }\n\n  return (\n    <div className=\"app\">\n      <h1>Todo App</h1>\n\n      <div className=\"form\">\n        <input\n          data-testid=\"todo-input\"\n          value={input}\n          onChange={e => setInput(e.target.value)}\n          onKeyDown={handleKeyDown}\n          placeholder=\"What needs to be done?\"\n        />\n        <button\n          data-testid=\"add-btn\"\n          className=\"add-btn\"\n          onClick={addTodo}\n        >\n          Add\n        </button>\n      </div>\n\n      {todos.length === 0 ? (\n        <p data-testid=\"empty-state\" className=\"empty-state\">\n          No todos yet. Add one above!\n        </p>\n      ) : (\n        <>\n          <ul data-testid=\"todo-list\" className=\"todo-list\">\n            {todos.map(todo => (\n              <li\n                key={todo.id}\n                data-testid=\"todo-item\"\n                className={`todo-item${todo.done ? ' done' : ''}`}\n              >\n                <span data-testid=\"todo-title\" className=\"todo-title\">\n                  {todo.title}\n                </span>\n                <button\n                  data-testid=\"toggle-btn\"\n                  className=\"toggle-btn\"\n                  onClick={() => toggleTodo(todo.id)}\n                >\n                  {todo.done ? '✓' : '○'}\n                </button>\n                <button\n                  data-testid=\"delete-btn\"\n                  className=\"delete-btn\"\n                  onClick={() => deleteTodo(todo.id)}\n                >\n                  ×\n                </button>\n              </li>\n            ))}\n          </ul>\n          <p data-testid=\"todo-count\" className=\"todo-count\">\n            {todos.length} {todos.length === 1 ? 'todo' : 'todos'}\n          </p>\n        </>\n      )}\n    </div>\n  )\n}\n"
    }
  },

  'node-express': {
    label: 'Node.js + Express',
    description: 'REST API server — Todo CRUD starter',
    installCommand: 'npm install',
    runCommand: 'node server.js',
    port: 3001,
    readyPattern: 'running on port',
    files: {
      'package.json': JSON.stringify({
        name: 'todo-api',
        version: '1.0.0',
        scripts: { start: 'node server.js' },
        dependencies: { express: '^4.19.2', cors: '^2.8.5' }
      }, null, 2),

      'server.js': `const express = require('express')
const cors    = require('cors')
const { randomUUID } = require('crypto')

const app  = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

let todos = []

app.get('/api/todos', (req, res) => {
  let result = [...todos]
  if (req.query.done !== undefined)
    result = result.filter(t => t.done === (req.query.done === 'true'))
  if (req.query.search)
    result = result.filter(t => t.title.toLowerCase().includes(req.query.search.toLowerCase()))
  if (req.query.sort) {
    const order = req.query.order === 'desc' ? -1 : 1
    result.sort((a, b) => (a[req.query.sort] < b[req.query.sort] ? -1 : 1) * order)
  }
  if (req.query.page || req.query.limit) {
    const limit = parseInt(req.query.limit) || 10
    const page  = parseInt(req.query.page)  || 1
    result = result.slice((page - 1) * limit, page * limit)
  }
  res.json(result)
})

app.get('/api/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === req.params.id)
  if (!todo) return res.status(404).json({ error: 'Not found' })
  res.json(todo)
})

app.post('/api/todos', (req, res) => {
  const title = req.body?.title?.trim()
  if (!title) return res.status(400).json({ error: 'title required' })
  const todo = { id: randomUUID(), title, done: false, createdAt: new Date().toISOString() }
  todos.push(todo)
  res.status(201).json(todo)
})

app.put('/api/todos/:id', (req, res) => {
  const idx = todos.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  todos[idx] = { ...todos[idx], ...req.body, id: todos[idx].id }
  res.json(todos[idx])
})

app.delete('/api/todos/:id', (req, res) => {
  const idx = todos.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  todos.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

app.listen(PORT, '0.0.0.0', () => console.log('API running on port ' + PORT))
`
    }
  },

  'fullstack': {
    label: 'Full-stack (React + Express)',
    description: 'React frontend + Express API with proper folder structure',
    installCommand: 'cd /home/user/project/frontend && npm install && cd /home/user/project/backend && npm install',
    runCommand: 'bash start.sh',
    port: 5173,
    readyPattern: 'local:',
    waitMs: 45000,
    files: {
      'start.sh': `#!/bin/bash
cd /home/user/project/backend && node server.js &
BACKEND_PID=$!
echo "[start.sh] Backend started (PID $BACKEND_PID)"
cd /home/user/project/frontend && npm run dev -- --host
`,

      'backend/package.json': JSON.stringify({
        name: 'backend',
        version: '1.0.0',
        type: 'module',
        scripts: { start: 'node server.js' },
        dependencies: { express: '^4.19.2', cors: '^2.8.5' }
      }, null, 2),

      'backend/server.js': `import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'

const app  = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

let todos = []

app.get('/api/todos', (req, res) => {
  let result = [...todos]
  if (req.query.done !== undefined)
    result = result.filter(t => t.done === (req.query.done === 'true'))
  if (req.query.search)
    result = result.filter(t => t.title.toLowerCase().includes(req.query.search.toLowerCase()))
  if (req.query.sort) {
    const order = req.query.order === 'desc' ? -1 : 1
    result.sort((a, b) => (a[req.query.sort] < b[req.query.sort] ? -1 : 1) * order)
  }
  if (req.query.page || req.query.limit) {
    const limit = parseInt(req.query.limit) || 10
    const page  = parseInt(req.query.page)  || 1
    result = result.slice((page - 1) * limit, page * limit)
  }
  res.json(result)
})

app.get('/api/todos/:id', (req, res) => {
  const todo = todos.find(t => t.id === req.params.id)
  if (!todo) return res.status(404).json({ error: 'Not found' })
  res.json(todo)
})

app.post('/api/todos', (req, res) => {
  const title = req.body?.title?.trim()
  if (!title) return res.status(400).json({ error: 'title required' })
  const todo = { id: randomUUID(), title, done: false, createdAt: new Date().toISOString() }
  todos.push(todo)
  res.status(201).json(todo)
})

app.put('/api/todos/:id', (req, res) => {
  const idx = todos.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  todos[idx] = { ...todos[idx], ...req.body, id: todos[idx].id }
  res.json(todos[idx])
})

app.delete('/api/todos/:id', (req, res) => {
  const idx = todos.findIndex(t => t.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Not found' })
  todos.splice(idx, 1)
  res.json({ message: 'Deleted' })
})

app.listen(PORT, '0.0.0.0', () => console.log('API running on port ' + PORT))
`,

      'frontend/package.json': JSON.stringify({
        name: 'frontend',
        version: '1.0.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
        devDependencies: { '@vitejs/plugin-react': '^4.2.1', vite: '^5.2.0' }
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
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
`,

      'frontend/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fullstack Todo App</title>
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
  <React.StrictMode><App /></React.StrictMode>
)
`,

      'frontend/src/App.jsx': `import { useEffect, useState } from 'react'
import './App.css'

export default function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')

  useEffect(() => {
    fetch('/api/todos').then(r => r.json()).then(setTodos)
  }, [])

  async function addTodo(e) {
    e.preventDefault()
    if (!input.trim()) return
    const res  = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: input.trim() }),
    })
    const todo = await res.json()
    setTodos(prev => [...prev, todo])
    setInput('')
  }

  async function toggleTodo(id, done) {
    const res     = await fetch(\`/api/todos/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !done }),
    })
    const updated = await res.json()
    setTodos(prev => prev.map(t => t.id === id ? updated : t))
  }

  async function deleteTodo(id) {
    await fetch(\`/api/todos/\${id}\`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <h1>Todo App 📝</h1>
      <form onSubmit={addTodo} className="form">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="What needs to be done?" />
        <button type="submit">Add</button>
      </form>
      {todos.length === 0 && <p className="empty">No todos yet!</p>}
      <ul>
        {todos.map(t => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <span onClick={() => toggleTodo(t.id, t.done)}>{t.title}</span>
            <button onClick={() => deleteTodo(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
`,

      'frontend/src/App.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: sans-serif; background: #0f0f0f; color: #ececec; min-height: 100vh; display: flex; justify-content: center; padding: 2rem; }
.app { width: 100%; max-width: 480px; }
h1 { margin-bottom: 1.5rem; }
.form { display: flex; gap: 8px; margin-bottom: 1rem; }
.form input { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: white; font-size: 14px; }
.form input:focus { outline: none; border-color: #3b82f6; }
.form button { padding: 8px 16px; border-radius: 6px; border: none; background: #3b82f6; color: white; cursor: pointer; font-size: 14px; }
.form button:hover { background: #2563eb; }
.empty { color: #555; font-size: 14px; text-align: center; padding: 1rem 0; }
ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
li { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #1a1a1a; border: 1px solid #333; border-radius: 8px; }
li span { flex: 1; font-size: 14px; cursor: pointer; }
li.done span { text-decoration: line-through; color: #555; }
li button { background: none; border: none; color: #555; cursor: pointer; font-size: 18px; }
li button:hover { color: #f87171; }
`,

      'README.md': `# Full-Stack Todo App

## Run locally
\`\`\`bash
cd backend  && npm install && node server.js
cd frontend && npm install && npm run dev
\`\`\`

Vite proxies /api → Express on :3001.
`
    }
  }
}