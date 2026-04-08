const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const vm = require('vm');

test('loadState handles invalid JSON from localStorage', () => {
    const html = fs.readFileSync('README.md', 'utf8');
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    const scriptContent = scriptMatch[1];

    let warningLogged = false;
    let loggedError = null;

    const sandbox = {
        localStorage: {
            getItem: (key) => {
                if (key === "shiftControlDataV5") {
                    return "INVALID JSON {";
                }
                return null;
            },
            setItem: () => {}
        },
        console: {
            warn: (msg, err) => {
                if (msg === "Error loading state") {
                    warningLogged = true;
                    loggedError = err;
                }
            }
        },
        document: {
            getElementById: () => ({ innerHTML: '' }),
            body: { className: '' }
        },
        lucide: {
            createIcons: () => {}
        },
        window: {},
        Date: Date,
        JSON: JSON,
        Object: Object,
        Number: Number,
        Math: Math,
        setInterval: setInterval,
        clearInterval: clearInterval
    };

    vm.createContext(sandbox);

    assert.doesNotThrow(() => {
        vm.runInContext(scriptContent, sandbox);
    });

    assert.strictEqual(warningLogged, true, "console.warn should have been called with 'Error loading state'");
    assert.ok(loggedError instanceof SyntaxError, "The logged error should be a JSON parsing SyntaxError");
});
