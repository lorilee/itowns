/* global describe, it, browser, exampleCanRenderTest */
const assert = require('assert');

describe('globe example', () => {
    it('should run...', async () => {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/globe.html');
        await page.waitFor('#viewerDiv > canvas');

        const result = await exampleCanRenderTest(page);

        assert.ok(result);
        page.close();
        await page.close();
    });

    it('should return the correct tile', async () => {
        const page = await browser.newPage();

        await page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/globe.html');
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page);

        const level = await page.evaluate(() =>
            globeView.pickObjectsAt(
                { x: 221, y: 119 })[0].object.level);

        assert.equal(2, level);
        page.close();
        await page.close();
    });
});
