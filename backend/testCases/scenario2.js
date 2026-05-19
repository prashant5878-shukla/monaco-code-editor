/**
 * Scenario 2 — React Todo App: Edge Cases & Interactions
 *
 * Requires Scenario 1 passing. Same browser-action step format.
 */

export const scenario2Tests = [
    {
        id: 'tc-s2-1',
        name: 'Can add todo by pressing Enter key',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Enter todo' },
                { do: 'press',  selector: '[data-testid="todo-input"]', key: 'Enter' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 1 },
            ],
        },
    },
    {
        id: 'tc-s2-2',
        name: 'Cannot add empty todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 0 },
            ],
        },
    },
    {
        id: 'tc-s2-3',
        name: 'Cannot add whitespace-only todo',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: '   ' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 0 },
            ],
        },
    },
    {
        id: 'tc-s2-4',
        name: 'Toggling done twice restores undone state',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',   selector: '[data-testid="todo-input"]', value: 'Buy milk' },
                { do: 'click',  selector: '[data-testid="add-btn"]' },
                { do: 'click',  selector: '[data-testid="toggle-btn"]' },
                { do: 'click',  selector: '[data-testid="toggle-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', notHasClass: 'done' },
            ],
        },
    },
    {
        id: 'tc-s2-5',
        name: 'Deleting one of multiple todos keeps others',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'A' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'B' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'C' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'click', selector: '[data-testid="delete-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-item"]', count: 2 },
            ],
        },
    },
    {
        id: 'tc-s2-6',
        name: 'Deleted todo title is gone from list',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'DeleteMe' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'KeepMe' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'click', selector: '[data-testid="delete-btn"]' },
                { do: 'expectNotText', selector: '[data-testid="todo-title"]', text: 'DeleteMe' },
            ],
        },
    },
    {
        id: 'tc-s2-7',
        name: 'Multiple todos can be marked done independently',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'A' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'B' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'clickNth',           selector: '[data-testid="toggle-btn"]', nth: 0 },
                { do: 'expectNthHasClass',    selector: '[data-testid="todo-item"]', nth: 0, hasClass: 'done' },
                { do: 'expectNthNotHasClass', selector: '[data-testid="todo-item"]', nth: 1, hasClass: 'done' },
            ],
        },
    },
    {
        id: 'tc-s2-8',
        name: 'Todo count decrements on delete',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'A' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'B' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'C' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'click', selector: '[data-testid="delete-btn"]' },
                { do: 'expect', selector: '[data-testid="todo-count"]', text: '2' },
            ],
        },
    },
    {
        id: 'tc-s2-9',
        name: 'All todos can be deleted one by one',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'A' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'B' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'click', selector: '[data-testid="delete-btn"]' },
                { do: 'click', selector: '[data-testid="delete-btn"]' },
                { do: 'expect',        selector: '[data-testid="todo-item"]', count: 0 },
                { do: 'expectVisible', selector: '[data-testid="empty-state"]' },
            ],
        },
    },
    {
        id: 'tc-s2-10',
        name: 'Todos preserve insertion order',
        action: {
            type: 'browser',
            steps: [
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'First' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Second' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'fill',  selector: '[data-testid="todo-input"]', value: 'Third' },
                { do: 'click', selector: '[data-testid="add-btn"]' },
                { do: 'expectNthText', selector: '[data-testid="todo-title"]', nth: 0, text: 'First' },
                { do: 'expect',        selector: '[data-testid="todo-item"]', count: 3 },
            ],
        },
    },
];
