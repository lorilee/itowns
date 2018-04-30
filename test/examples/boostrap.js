/* global process, Promise, before, after */
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const net = require('net');

function _waitServerReady(resolve) {
    const client = net.createConnection({ port: 8080 }, () => {
        resolve(true);
    });
    client.on('error', () => {
        setTimeout(() => {
            _waitServerReady(resolve);
        }, 100);
    });
}

function waitServerReady() {
    return new Promise((resolve) => {
        _waitServerReady(resolve);
    });
}

before(async () => {
    if (!process.env.USE_DEV_SERVER) {
        // start itowns
        console.log('Starting itowns...');
        global.itownsProcess = spawn('npm', ['start'], { detached: true });
    }

    // wait for port 8080 to be ready
    await waitServerReady();

    // Helper function: returns true when all layers are
    // ready and rendering has been done
    global.exampleCanRenderTest = async (page) => {
        const result = await page.evaluate(() => new Promise((resolve) => {
            function getView() {
                if (typeof (view) === 'object') {
                    return Promise.resolve(view);
                }
                if (typeof (globeView) === 'object') {
                    return Promise.resolve(globeView);
                }
                resolve(false);
                return Promise.reject();
            }

            getView().then((v) => {
                function resolveWhenReady() {
                    if (v.mainLoop.renderingState === 0) {
                        resolve(true);
                        v.mainLoop.removeEventListener('command-queue-empty', resolveWhenReady);
                    }
                }
                v.mainLoop.addEventListener('command-queue-empty', resolveWhenReady);
            });
        }));

        if (process.env.SCREENSHOT_FOLDER) {
            const url = page.url();
            let path = url.substr(url.lastIndexOf('/') + 1);
            path = path.toLowerCase().replace('.html', '.png');
            const file = `${process.env.SCREENSHOT_FOLDER}/${path}`;
            await page.screenshot({ path: file });
            console.log('wrote ', file);
        }

        return result;
    };
    global.browser = await puppeteer.launch({
        executablePath: process.env.CHROME,
        headless: !process.env.DEBUG,
        devtools: process.env.DEBUG,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] });
});

// close browser and reset global variables
after(() => {
    global.browser.close();
    if (global.itownsProcess) {
        // stop itowns
        process.kill(-global.itownsProcess.pid);
    }
});

