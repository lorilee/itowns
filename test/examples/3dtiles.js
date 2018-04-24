/* global describe, it, browser, exampleCanRenderTest */
const assert = require('assert');

describe('3dtiles example', () => {
    it('should run...', async () => {
        const page = await browser.newPage();

        page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/3dtiles.html');
        await page.waitFor('#viewerDiv > canvas');

        const result = await exampleCanRenderTest(page);

        assert.ok(result);
        await page.close();
    });


    it('should return the dragon and the globe', async () => {
        const page = await browser.newPage();

        page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/3dtiles.html');
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page);

        const layers = await page.evaluate(
            () => view.pickObjectsAt({ x: 195, y: 146 }).map(p => p.layer));

        assert.ok(layers.indexOf('globe') >= 0);
        assert.ok(layers.indexOf('3d-tiles-discrete-lod') >= 0);
        assert.equal(layers.indexOf('3d-tiles-request-volume'), -1);
        await page.close();
    });

    it('should return points', async () => {
        const page = await browser.newPage();

        page.setViewport({ width: 400, height: 300 });
        await page.goto('http://localhost:8080/examples/3dtiles.html');
        await page.waitFor('#viewerDiv > canvas');

        await exampleCanRenderTest(page);

        await page.evaluate(() => d.zoom());

        const pickingCount = await page.evaluate(() =>
            new Promise((resolve) => {
                view.mainLoop.addEventListener('command-queue-empty', () => {
                    if (view.mainLoop.renderingState === 0) {
                        resolve(view.pickObjectsAt(
                            { x: 200, y: 150 },
                            '3d-tiles-request-volume').length);
                    }
                });
                view.notifyChange(false);
            }));
        assert.ok(pickingCount > 0);
        await page.close();
    });
});
