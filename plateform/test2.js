const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const page = await browser.newPage();

    // Inject JavaScript to intercept Turnstile widget
    await page.evaluate(() => {
        const i = setInterval(() => {
            if (window.turnstile) {
                clearInterval(i);
                window.turnstile.render = (a, b) => {
                    let p = {
                        type: "TurnstileTaskProxyless",
                        websiteKey: b.sitekey,
                        websiteURL: window.location.href,
                        data: b.cData,
                        pagedata: b.chlPageData,
                        action: b.action,
                        userAgent: navigator.userAgent
                    };
                    console.log(JSON.stringify(p));
                    window.tsCallback = b.callback;
                    return 'foo';
                };
            }
        }, 10);
    });

    await page.goto('https://keliauk.urm.lt/en/user/login');

    // Wait for the Turnstile challenge to load
    await page.waitForSelector('#cf-chl-widget-frndd');

    // Get the parameters from the intercepted callback
    const parameters = await page.evaluate(() => {
        return {
            cData: window.tsCallback.cData,
            chlPageData: window.tsCallback.chlPageData,
            action: window.tsCallback.action
        };
    });

    console.log(parameters);

    // Now, you can use parameters to solve the challenge
    // For example, you can send these parameters to your solving service (e.g., 2captcha) and get the solution

    // Once you have the solution, execute the callback with the token
    const token = process.env.CAPTCHA_API_KEY; // Replace with the actual token
    await page.evaluate((token) => {
        window.tsCallback(token);
    }, token);

    // Close the browser
    // await browser.close();
})();

