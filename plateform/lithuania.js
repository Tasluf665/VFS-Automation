// require('dotenv').config({ path: `../.env` });
require('events').EventEmitter.defaultMaxListeners = 15;
const fs = require('fs');
const useProxy = require('puppeteer-page-proxy');
const puppeteer = require("puppeteer");
var userAgent = require('user-agents');
const axios = require('axios');
var FormData = require('form-data');
const Captcha = require("@2captcha/captcha-solver")
const solver = new Captcha.Solver(process.env.CAPTCHA_API_KEY)

const captchaSolver = async (page) => {
    try {
        console.log('resolving captcha ----- ')
        await page.waitForSelector('#captcha_img');

        const src = await page.evaluate(() => {
            const imgElement = document.querySelector('#captcha_img');
            return imgElement.src;
        });
        console.log('Image src:', src);

        console.log('Downloading captcha image...');
        const captchaImage = await page.evaluate(async (src) => {
            const response = await fetch(src);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        }, src);
        console.log(captchaImage.substring(1, 30), "....captchaData");

        solver.imageCaptcha({
            body: captchaImage,
        })
            .then(async (res) => {
                console.log(res);
                await page.$eval('.captcha-container .form-control', (input, value) => input.value = value, res.data);
                await page.click('.col-12.text-center.mt-3.pb-3 button:nth-child(2)');

                await page.waitForTimeout(15000);
                appointment(page)

            })


        console.log("Captcha Finished");

    } catch (error) {
        console.log("Captcha Error: ", error.message)
    }
}

const appointment = async (page) => {
    console.log("Redirect into legalisation page")
    await page.goto('https://keliauk.urm.lt/en/legalisation');
    await page.waitForTimeout(15000);

    console.log("Click into Register new visit")
    await page.click('button.btn.outline-primary');
    await page.waitForTimeout(15000);

    console.log("Click into next btn")
    await page.click('#be1c2070729538c4196e7274ed27309d7');
    await page.waitForTimeout(15000);

    console.log("Select Participate")
    // await page.click('input.xradio-card-control[value="WithFiz"]');
    const [element] = await page.$x('//*[@id="content"]/div/form/div[1]/div[1]/div[2]/label');
    await element.click();
    await page.waitForTimeout(10000);

    console.log("Click into next btn2")
    await page.click('button.btn.btn-primary.rounded-pill');
    await page.waitForTimeout(10000);

    const [element2] = await page.$x('//*[@id="content"]/div/form/div[1]/div/div/div/div[1]/label/div[1]/div/div');
    await element2.click();
    await page.waitForTimeout(10000);

    console.log("Click into next btn3")
    await page.click('button.btn.btn-primary.rounded-pill');
    await page.waitForTimeout(10000);


}

async function login(url) {
    console.log("Loging...")
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        timeout: 0,
        ignoreHTTPSErrors: true,
        defaultViewport: null,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-dev-shm-usage'
        ]
    });
    let pages = await browser.pages()
    let page = pages[0]

    try {
        page.setDefaultNavigationTimeout(0);
        await page.goto(url, {
            waitUntil: 'load', timeout: 0
        });

        await page.waitForTimeout(25000);

        await page.$eval('.url-input-wrap .form-control', (input, value) => input.value = value, process.env.VFS_EMAIL);
        await page.$eval('input[type="password"]', (input, value) => input.value = value, process.env.VFS_PASSWORD);


        console.log("Entering captcha solving...")
        await captchaSolver(page);


    } catch (error) {
        console.log("Loging Error: ", error.message);
    }
}


const lithuania = async () => {
    console.log('calling API ----- ')
    const url = "https://keliauk.urm.lt/en/user/login"
    await login(url)
}

module.exports = lithuania