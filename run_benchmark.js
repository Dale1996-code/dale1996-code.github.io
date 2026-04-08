const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto('file://' + process.cwd() + '/run_benchmark.html');
    await page.waitForSelector('#results');
    await new Promise(r => setTimeout(r, 1000));
    const results = await page.evaluate(() => document.getElementById('results').innerText);
    console.log(results);
    await browser.close();
})();
