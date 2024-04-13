const puppeteer = require('puppeteer');
const axios = require('axios');

// 2captcha API key
const API_KEY = process.env.CAPTCHA_API_KEY;

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navigate to the Cloudflare-protected website
    await page.goto('https://keliauk.urm.lt/en/user/login');

    // Wait for the Cloudflare challenge to appear
    await page.waitForSelector('#turnstile-wrapper', { visible: true });

    // Extract the CAPTCHA iframe URL
    const captchaFrameUrl = await page.$eval('#turnstile-wrapper div > iframe', iframe => iframe.src);
    console.log("🚀 ~ captchaFrameUrl:", captchaFrameUrl)

    // Close the Cloudflare interstitial page
    // await page.close();

    // Solve CAPTCHA using 2captcha API
    const response = await axios.post('http://2captcha.com/in.php', {
        method: 'turnstile',
        sitekey: '0x4AAAAAAADnPIDROrmt1Wwj',
        key: API_KEY,
        pageurl: captchaFrameUrl,
        json: 1,
    });
    console.log("🚀 ~ response:", response.data)

    const captchaId = response.data.request;

    // Wait for 2captcha to solve the CAPTCHA
    let captchaResponse = '';
    while (!captchaResponse) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        const result = await axios.get(`http://2captcha.com/res.php?key=${API_KEY}&action=get&id=${captchaId}&json=1`);
        if (result.data.status === 1) {
            captchaResponse = result.data.request;
        }
    }

    // Solve the CAPTCHA in the Cloudflare page
    const challengeFrame = await browser.newPage();
    await challengeFrame.goto(captchaFrameUrl);
    await challengeFrame.type('#g-recaptcha-response', captchaResponse);
    await challengeFrame.click('#submit-button'); // Assuming this is the submit button

    // Wait for Cloudflare to verify the CAPTCHA
    await challengeFrame.waitForNavigation();

    // Continue with your automation tasks after Cloudflare bypassed
    console.log('Cloudflare bypassed successfully');

    // Close the browser
    // await browser.close();
})();
