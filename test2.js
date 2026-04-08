const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('README.md', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });

setTimeout(() => {
    console.log(dom.window.lucide.createIcons.toString());
}, 2000);
