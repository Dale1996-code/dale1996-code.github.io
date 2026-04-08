const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('README.md', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

dom.window.lucide = {
    createIcons: function(opts) {
        // mock to simulate scanning overhead
        const root = (opts && opts.root) || dom.window.document;
        const elements = root.querySelectorAll('[data-lucide]');
        for (let i = 0; i < elements.length; i++) {
            // just to do some work
            elements[i].setAttribute('data-mock-icon', 'true');
        }
    }
};

setTimeout(() => {
    // Fill dom with a bunch of nodes to make global search slower
    for (let i=0; i<5000; i++) {
        const div = dom.window.document.createElement('div');
        div.innerHTML = '<span data-lucide="test"></span>';
        dom.window.document.body.appendChild(div);
    }

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
        dom.window.renderTimer();
    }
    const end = performance.now();
    console.log("Baseline time taken:", end - start, "ms");
}, 1000);
