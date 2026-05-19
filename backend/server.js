import express from 'express';
import cors from 'cors';
import testsRouter from './routes/tests.js';

const app = express();
const PORT = 4000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', testsRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Interview backend running on http://localhost:${PORT}`);
});
