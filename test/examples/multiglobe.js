/* global describe, it, browser, exampleCanRenderTest */
const assert = require('assert');

describe('multiglobe example', () => {
    it('should run...', async () => {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/multiglobe.html');
        await page.waitFor('#viewerDiv > canvas');

        const result = await exampleCanRenderTest(page);

        assert.ok(result);
        await page.close();
    });
});
