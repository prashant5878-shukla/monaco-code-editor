/**
 * Scenario 1 — React Todo App: Basic CRUD
 *
 * Browser-action format. Each step is interpreted by runner/testRunner.js
 * using Playwright's page object.
 *
 * Step types:
 *   fill          → page.fill(selector, value)
 *   click         → page.click(selector)
 *   press         → page.press(selector, key)
 *   expect        → toHaveCount(n) | toContainText(text) | toHaveValue(v)
 *   expectVisible → toBeVisible()
 *   expectHidden  → toHaveCount(0)
 */

export const scenario1Tests = [
    {
        id: 'tc-s1-1',
        name: 'Page loads with empty state visible',
        action: {
            type: 'browser',
            steps: [
                { do: 'expectVisible', selector: '[data-testid="empty-state"]' },
            ],
        },
    },
    {
        id: 'tc-s1-2',
        name: 'Input field accepts text',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'expect', selector: '[data-testid="todo-input"]', value: 'Buy milk' },
            ],
        },
    },
    {
        id: 'tc-s1-3',
        name: 'Add button creates a todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 1 },
            ],
        },
    },
    {
        id: 'tc-s1-4',
        name: 'Created todo shows correct title',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-title"]', text: 'Buy milk' },
            ],
        },
    },
    {
        id: 'tc-s1-5',
        name: 'Empty state hides after adding todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',         selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',        selector: '[data-testid="add-btn"]' },
                { do: 'expectHidden', selector: '[data-testid="empty-state"]' },
            ],
        },
    },
    {
        id: 'tc-s1-6',
        name: 'Input clears after adding todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-input"]', value: '' },
            ],
        },
    },
    {
        id: 'tc-s1-7',
        name: 'Can add multiple todos',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Walk dog' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Read book' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 3 },
            ],
        },
    },
    {
        id: 'tc-s1-8',
        name: 'Todo count updates correctly',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'First' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Second' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-count"]', text: '2' },
            ],
        },
    },
    {
        id: 'tc-s1-9',
        name: 'Can mark a todo as done',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'click',  selector: '[data-testid="toggle-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', hasClass: 'done' },
            ],
        },
    },
    {
        id: 'tc-s1-10',
        name: 'Can delete a todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',          selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',         selector: '[data-testid="add-btn"]' },
                { do: 'click',         selector: '[data-testid="delete-btn"]' },
                { do: 'expect',        selector: '[data-testid="todo-item"]', count: 0 },
                { do: 'expectVisible', selector: '[data-testid="empty-state"]' },
            ],
        },
    },
];
