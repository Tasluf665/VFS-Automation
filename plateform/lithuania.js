// require('dotenv').config({ path: `../.env` });
require('events').EventEmitter.defaultMaxListeners = 15;
const fs = require('fs');
const puppeteer = require("puppeteer");
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

                try {
                    await page.waitForSelector('button.btn.primary.rounded-pill[data-submit-url="/en/actions/user/login/login"]')
                    await page.$eval('button.btn.primary.rounded-pill[data-submit-url="/en/actions/user/login/login"]', element => element.click())

                    await page.waitForSelector('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]')
                    appointment(page)
                } catch (error) {
                    await page.$eval('a.reset-captcha-btn', element => element.click());
                    await page.waitForTimeout(10000);
                    captchaSolver(page)
                }

                // await page.click('button.btn.primary.rounded-pill[data-submit-url="/en/actions/user/login/login"]');


            })


        console.log("Captcha Finished");

    } catch (error) {
        console.log("Captcha Error: ", error.message)
    }
}

const appointment = async (page) => {
    console.log("Click into Register new visit")
    try {
        await page.waitForSelector('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]')
        await page.click('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]');
    } catch (error) {
        await page.waitForSelector('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]')
        await page.click('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]');
    }


    console.log("Click into next btn")
    try {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    } catch (error) {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    }


    console.log("Select Participate")
    try {
        await page.waitForSelector('.xradio-card-checkbox')
        const secondElement = await page.$$('.xradio-card-checkbox');
        await secondElement[1].click();
    } catch (error) {
        await page.waitForSelector('.xradio-card-checkbox')
        const secondElement = await page.$$('.xradio-card-checkbox');
        await secondElement[1].click();
    }



    console.log("Click into next btn2")
    try {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    } catch (error) {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    }

    try {
        await page.waitForSelector('input[value="206"]')
        await page.click('input[value="206"]');
    } catch (error) {
        await page.waitForSelector('input[value="206"]')
        await page.click('input[value="206"]');
    }

    console.log("Click into next btn3")
    try {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    } catch (error) {
        await page.waitForSelector('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    }

    console.log("Fill up the form")
    await page.waitForSelector('input.form-control[is="number-phone"]')
    await page.$eval('input.form-control[is="number-phone"]', (input, value) => input.value = value, process.env.FORM_PHONE);
    await page.$eval('input.form-control[name="User[1][Name]"]', (input, value) => input.value = value, process.env.FORM_FIRST_NAME);
    await page.$eval('input.form-control[name="User[1][Surname]"]', (input, value) => input.value = value, process.env.FORM_LAST_NAME);
    await page.$eval('input.form-control[name="User[1][Email]"]', (input, value) => input.value = value, process.env.FORM_EMAIL);
    await page.$eval('input.form-control[name="User[1][Phone]"]', (input, value) => input.value = value, process.env.FORM_USER_PHONE);
    await page.$eval('textarea.form-control[name="User[1][Purpose]"]', (input, value) => input.value = value, process.env.FORM_Representation);


    try {
        const CountrySelect1 = await page.$$('.xselect-display.form-control');
        await CountrySelect1[0].click();

        await page.waitForSelector('.xselect-list-item[data-value="25"]')
        await page.click('.xselect-list-item[data-value="25"]')
    } catch (error) {
        const CountrySelect1 = await page.$$('.xselect-display.form-control');
        await CountrySelect1[0].click();

        await page.waitForSelector('.xselect-list-item[data-value="25"]')
        await page.click('.xselect-list-item[data-value="25"]')
    }

    try {
        const CountrySelect2 = await page.$$('.xselect-display.form-control');
        await CountrySelect2[1].click();

        const Country = await page.$$('.xselect-list-item[data-value="182"]');
        await Country[1].click();


    } catch (error) {
        const CountrySelect2 = await page.$$('.xselect-display.form-control');
        await CountrySelect2[1].click();

        const Country = await page.$$('.xselect-list-item[data-value="182"]');
        await Country[1].click();
    }

    try {
        console.log("Click into next btn4")
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    } catch (error) {
        console.log("Click into next btn4")
        await page.click('button.btn.btn-primary.rounded-pill[data-submit-url="/en/actions/legalisation/insert"]');
    }

    try {
        await page.waitForSelector('input.form-control[is="control-picker-date-remote"]')
        console.log("Click into next btn4")
        await page.click('input.form-control[is="control-picker-date-remote"]');
    } catch (error) {
        console.log("Click into next btn4")
        await page.click('input.form-control[is="control-picker-date-remote"]');
    }

    try {
        await page.click('#date');
        await page.type('#date', '2024-04-10');
        await page.click('body');
    } catch (error) {

    }
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

        await page.waitForSelector('button.btn.outline-primary.rounded-pill[is="button-url"]');
        await page.click('button.btn.outline-primary.rounded-pill[is="button-url"]');

        await page.waitForSelector('input.form-control[is="text-mail"]')
        await page.$eval('input.form-control[is="text-mail"]', (input, value) => input.value = value, process.env.VFS_EMAIL);
        await page.$eval('input[type="password"]', (input, value) => input.value = value, process.env.VFS_PASSWORD);


        console.log("Entering captcha solving...")
        await captchaSolver(page);


    } catch (error) {
        console.log("Loging Error: ", error.message);
        login(url)
    }
}


const lithuania = async () => {
    console.log('calling API ----- ')
    const url = "https://keliauk.urm.lt/en/legalisation"
    await login(url)
}

module.exports = lithuania