export function diffLines(original, modified) {
    const a = original.split('\n');
    const b = modified.split('\n');

    // Guard: O(m*n) — skip for huge files
    if (a.length * b.length > 80_000) {
        return { added: [], removed: [], additions: 0, deletions: 0 };
    }

    const lcs = buildLCSTable(a, b);
    const ops = backtrack(lcs, a, b);
    return extractChanges(ops);
}


function buildLCSTable(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1] + 1
                : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    return dp;
}


function backtrack(dp, a, b) {
    const ops = [];
    let i = a.length;
    let j = b.length;

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
            ops.unshift({ t: 'eq' });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            ops.unshift({ t: 'add', content: b[j - 1] });
            j--;
        } else {
            ops.unshift({ t: 'del', content: a[i - 1] });
            i--;
        }
    }

    return ops;
}


function extractChanges(ops) {
    const added = [];
    const removed = [];

    let newLineNum = 0;
    let pendingDeleted = [];

    function flushDeleted() {
        if (pendingDeleted.length === 0) return;
        removed.push({ afterLine: newLineNum, lines: pendingDeleted });
        pendingDeleted = [];
    }

    for (const op of ops) {
        if (op.t === 'eq') {
            flushDeleted();
            newLineNum++;
        }
        if (op.t === 'add') {
            flushDeleted();
            newLineNum++;
            added.push(newLineNum);
        }
        if (op.t === 'del') {
            pendingDeleted.push(op.content);
        }
    }

    flushDeleted();

    return {
        added,
        removed,
        additions: added.length,
        deletions: removed.reduce((sum, g) => sum + g.lines.length, 0),
    };
}