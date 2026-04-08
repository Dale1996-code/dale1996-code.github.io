const fs = require('fs');
const test = require('node:test');
const assert = require('node:assert');
const vm = require('node:vm');

const html = fs.readFileSync('README.md', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

test('toggleTheme', () => {
    const dummyApp = { innerHTML: '' };

    // Create execution context mimicking browser environment needed for initial load
    const context = vm.createContext({
        localStorage: {
            getItem: () => null,
            setItem: () => {}
        },
        document: {
            body: { className: '' },
            getElementById: (id) => {
                if (id === 'app') return dummyApp;
                return { value: '' };
            }
        },
        lucide: { createIcons: () => {} },
        console: console,
        Date: Date,
        Number: Number,
        JSON: JSON,
        Math: Math,
        Object: Object,
        Array: Array,
        navigator: { clipboard: { writeText: () => Promise.resolve() } },
        window: { print: () => {} }
    });

    // Load main script
    vm.runInContext(script, context);

    // Verify initial theme state
    assert.strictEqual(vm.runInContext('theme', context), "dark");

    // Setup mocks to track side effects
    context.persistThemeCalled = false;
    context.applyThemeCalled = false;
    context.renderCalled = false;

    vm.runInContext('persistTheme = () => { persistThemeCalled = true; };', context);
    vm.runInContext('applyTheme = () => { applyThemeCalled = true; };', context);
    vm.runInContext('render = () => { renderCalled = true; };', context);

    // Call function
    vm.runInContext('toggleTheme()', context);

    // Assert theme changed and all side effects occurred
    assert.strictEqual(vm.runInContext('theme', context), "light");
    assert.strictEqual(context.persistThemeCalled, true);
    assert.strictEqual(context.applyThemeCalled, true);
    assert.strictEqual(context.renderCalled, true);

    // Reset mocks
    context.persistThemeCalled = false;
    context.applyThemeCalled = false;
    context.renderCalled = false;

    // Call again to test reverse toggle
    vm.runInContext('toggleTheme()', context);

    // Assert theme changed back
    assert.strictEqual(vm.runInContext('theme', context), "dark");
    assert.strictEqual(context.persistThemeCalled, true);
    assert.strictEqual(context.applyThemeCalled, true);
    assert.strictEqual(context.renderCalled, true);
});
