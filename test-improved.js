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
    // Modify renderTimer to use { root: el }
    dom.window.renderTimer = function() {
        const el = dom.window.document.getElementById("timerDisplay");
        if (!el) return;

        if (!dom.window.timerState.label && dom.window.timerState.remainingMs === 0) {
            el.innerHTML = `
                <div class="flex items-center gap-2 justify-center opacity-50 hover:opacity-100 transition-opacity">
                    <i data-lucide="timer" class="w-4 h-4 text-slate-400"></i>
                    <button class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white border border-slate-700" onclick="startTimer(15, 'Huddle')">15m Huddle</button>
                    <button class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300 hover:text-white border border-slate-700" onclick="startTimer(45, 'Pallet Goal')">45m Goal</button>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div class="flex items-center gap-4 justify-center bg-slate-900/80 px-4 py-2 rounded-xl border border-sky-500/30 shadow-lg shadow-sky-500/10">
                    <div class="text-right">
                        <p class="text-xs text-slate-400 uppercase tracking-wider">${dom.window.timerState.label}</p>
                        <p class="text-xl font-mono font-bold ${dom.window.timerState.remainingMs < 60000 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}">
                            ${dom.window.formatTimer(dom.window.timerState.remainingMs)}
                        </p>
                    </div>
                    <button onclick="stopTimer()" class="btn p-2 rounded-full hover:bg-white/10 text-slate-400"><i data-lucide="x" class="w-4 h-4"></i></button>
                </div>
            `;
        }
        dom.window.lucide.createIcons({ root: el });
    };

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
    console.log("Improved time taken:", end - start, "ms");
}, 1000);
