const fs = require('fs');
const assert = require('node:assert');
const { test, describe } = require('node:test');
const vm = require('vm');

function setupContext() {
    const html = fs.readFileSync('README.md', 'utf8');
    const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

    const context = vm.createContext({
        window: {},
        document: {
            getElementById: () => ({ innerHTML: '' }),
            body: { className: '' }
        },
        localStorage: {
            getItem: () => null,
            setItem: () => {}
        },
        confirm: () => true,
        alert: () => {},
        lucide: { createIcons: () => {} },
        console: console,
    });
    vm.runInContext(scriptContent, context);
    return context;
}

describe('Shift Control Logic Tests', () => {
    test('getFreightStrategy - handles 0 associates without Division by Zero or NaN', () => {
        const context = setupContext();

        // Reset shiftData associates to empty arrays
        vm.runInContext('shiftData.associates = { grocery: [], produce: [], meat: [], frozenDairy: [], deliBakery: [] };', context);
        assert.strictEqual(context.getTotalAssociates(), 0);

        // Set pallet count to a value that would trigger moderate or heavy load
        vm.runInContext('shiftData.palletCount = 12;', context);

        const strategy = context.getFreightStrategy();

        // Verify that with 0 associates, pace calculates as "0.0/person" instead of "Infinity/person"
        assert.strictEqual(strategy.pace, "0.0/person");
        assert.strictEqual(strategy.status, "MODERATE");
    });
});
