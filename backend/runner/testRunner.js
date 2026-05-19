import { chromium, expect } from '@playwright/test';

/**
 * Async generator — runs browser-action test cases against a live URL.
 *
 * @param {Array}  testCases  — array of browser-action descriptors
 * @param {string} sandboxUrl — base URL of the candidate's running app
 * @yields {{ id, name, status, duration, error }}
 */
export async function* runTests(testCases, sandboxUrl) {
    const browser = await chromium.launch({ headless: true });

    try {
        for (const tc of testCases) {
            const start = Date.now();
            let status = 'pass';
            let error  = null;

            const page = await browser.newPage();

            try {
                await page.goto(sandboxUrl, { waitUntil: 'networkidle', timeout: 15_000 });

                for (const step of tc.action.steps) {
                    await executeStep(page, step);
                }
            } catch (err) {
                status = 'fail';
                error  = err.message;
            } finally {
                await page.close();
            }

            yield {
                id:       tc.id,
                name:     tc.name,
                status,
                duration: Date.now() - start,
                error,
            };
        }
    } finally {
        await browser.close();
    }
}

// ── Step interpreter ──────────────────────────────────────────────────────────

async function executeStep(page, step) {
    const { do: action, selector, value, key, count, text, nth, hasClass, notHasClass } = step;

    switch (action) {

        // ── Interactions ──────────────────────────────────────────────────────
        case 'fill':
            await page.fill(selector, value ?? '');
            break;

        case 'click':
            await page.click(selector);
            break;

        case 'clickNth':
            await page.locator(selector).nth(nth ?? 0).click();
            break;

        case 'press':
            await page.press(selector, key);
            break;

        // ── Assertions ────────────────────────────────────────────────────────
        case 'expectVisible':
            await expect(page.locator(selector)).toBeVisible({ timeout: 5_000 });
            break;

        case 'expectHidden':
            await expect(page.locator(selector)).toHaveCount(0, { timeout: 5_000 });
            break;

        case 'expect':
            if (count !== undefined) {
                await expect(page.locator(selector)).toHaveCount(count, { timeout: 5_000 });
            } else if (text !== undefined) {
                await expect(page.locator(selector).first()).toContainText(text, { timeout: 5_000 });
            } else if (value !== undefined) {
                await expect(page.locator(selector)).toHaveValue(value, { timeout: 5_000 });
            } else if (hasClass !== undefined) {
                await expect(page.locator(selector).first()).toHaveClass(
                    new RegExp(`(^|\\s)${hasClass}(\\s|$)`),
                    { timeout: 5_000 }
                );
            } else if (notHasClass !== undefined) {
                await expect(page.locator(selector).first()).not.toHaveClass(
                    new RegExp(`(^|\\s)${notHasClass}(\\s|$)`),
                    { timeout: 5_000 }
                );
            }
            break;

        case 'expectNthText':
            await expect(page.locator(selector).nth(nth ?? 0)).toContainText(text, { timeout: 5_000 });
            break;

        case 'expectNotText': {
            // Assert none of the matching elements contains the text
            const locator = page.locator(selector);
            const allTexts = await locator.allTextContents();
            if (allTexts.some(t => t.includes(text))) {
                throw new Error(`Expected no element matching "${selector}" to contain text "${text}", but found one`);
            }
            break;
        }

        case 'expectNthHasClass':
            await expect(page.locator(selector).nth(nth ?? 0)).toHaveClass(
                new RegExp(`(^|\\s)${hasClass}(\\s|$)`),
                { timeout: 5_000 }
            );
            break;

        case 'expectNthNotHasClass':
            await expect(page.locator(selector).nth(nth ?? 0)).not.toHaveClass(
                new RegExp(`(^|\\s)${hasClass}(\\s|$)`),
                { timeout: 5_000 }
            );
            break;

        default:
            throw new Error(`Unknown step action: "${action}"`);
    }
}
