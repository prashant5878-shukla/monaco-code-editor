import { Router } from 'express';
import { runTests } from '../runner/testRunner.js';
import { scenario1Tests } from '../testCases/scenario1.js';
import { scenario2Tests } from '../testCases/scenario2.js';

const router = Router();

const SCENARIO_MAP = {
    '1': scenario1Tests,
    '2': scenario2Tests,
};

/**
 * GET /api/run-tests?scenarioId=1&sandboxUrl=https://xxx.e2b.app
 *
 * SSE stream — each test result is sent as a JSON line.
 * Final event carries the summary.
 */
router.get('/run-tests', async (req, res) => {
    const { scenarioId, sandboxUrl } = req.query;

    // ── Validate params ───────────────────────────────────────────────────────
    if (!scenarioId || !sandboxUrl) {
        return res.status(400).json({ error: 'scenarioId and sandboxUrl are required' });
    }
    const testCases = SCENARIO_MAP[scenarioId];
    if (!testCases) {
        return res.status(400).json({ error: `Unknown scenarioId: ${scenarioId}` });
    }

    // ── SSE headers ───────────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Helper to send a single SSE event
    function send(data) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    // ── Stream results ────────────────────────────────────────────────────────
    let total  = 0;
    let passed = 0;
    let failed = 0;

    try {
        for await (const result of runTests(testCases, sandboxUrl)) {
            send(result);
            total  += 1;
            if (result.status === 'pass') passed += 1;
            else                          failed += 1;
        }
    } catch (err) {
        send({ type: 'error', message: err.message });
    }

    // ── Send completion summary ───────────────────────────────────────────────
    send({ type: 'complete', total, passed, failed });
    res.end();
});

export default router;
