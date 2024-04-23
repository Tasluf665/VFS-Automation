// require('dotenv').config({ path: `../.env` });
require('events').EventEmitter.defaultMaxListeners = 15;
const fs = require('fs');
const puppeteer = require("puppeteer");
const axios = require('axios');
var FormData = require('form-data');
const Captcha = require("@2captcha/captcha-solver")
const solver = new Captcha.Solver(process.env.CAPTCHA_API_KEY)

let browser;

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

        try {
            const res = await solver.imageCaptcha({ body: captchaImage });
            console.log(res);
            await page.$eval('input[name="captcha"]', (input, value) => input.value = value, res.data);
        } catch (error) {
            console.log("Captcha Error: ", error.message);
            captchaSolver(page);
        }

    } catch (error) {
        console.log("Captcha Error: ", error.message);
        captchaSolver(page)
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const appointmentConfirm = async (page) => {
    try {
        await page.waitForSelector('input[name="AgreeToTermsOfRegistration"]');
        await page.click('input[name="AgreeToTermsOfRegistration"]');
    } catch (error) {
        console.log("appointmentConfirm Error: ", error.message);
        await page.reload();
        await appointmentConfirm(page)
    }

    await captchaSolver(page)

    try {
        await page.click('button[data-submit-url="/en/actions/legalisation/finalInsert"]');
    } catch (error) {
        console.log("appointmentConfirm Error: ", error.message);
        await page.reload();
        await appointmentConfirm(page)
    }

    try {
        await page.waitForSelector('.alert-body');
        const innerText = await page.$eval('.alert-body-content', element => element.innerText.trim());

        if (innerText === "Incorrect security code") {
            await page.$eval('a.reset-captcha-btn', element => element.click());
            await page.waitForTimeout(10000);
            await appointmentConfirm(page)
        }
    } catch (error) {
        console.log("appointmentConfirm Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await appointmentConfirm(page)
    }
}

const selectAppointmentDate = async (page) => {
    try {
        await page.waitForSelector('#date')
        await page.click('#date');

        await page.waitForSelector('.xdate-day-number:not(.disabled-day):not(.day-reserved)')
        await page.click('.xdate-day-number:not(.disabled-day):not(.day-reserved)');

        await page.waitForSelector('.xtime-circle')
        await page.click('.xtime-circle');

        await page.waitForSelector('button[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button[data-submit-url="/en/actions/legalisation/insert"]');

        await appointmentConfirm(page)
    } catch (error) {
        console.log("selectAppointmentDate Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await selectAppointmentDate(page)
    }

}

async function formFillUpPage(page) {
    try {
        await page.waitForSelector('input.form-control[is="number-phone"]')
        await page.$eval('input.form-control[is="number-phone"]', (input, value) => input.value = value, process.env.FORM_PHONE);
        await page.$eval('input.form-control[name="User[1][Name]"]', (input, value) => input.value = value, process.env.FORM_FIRST_NAME);
        await page.$eval('input.form-control[name="User[1][Surname]"]', (input, value) => input.value = value, process.env.FORM_LAST_NAME);
        await page.$eval('input.form-control[name="User[1][Email]"]', (input, value) => input.value = value, process.env.FORM_EMAIL);
        await page.$eval('input.form-control[name="User[1][Phone]"]', (input, value) => input.value = value, process.env.FORM_USER_PHONE);
        await page.$eval('textarea.form-control[name="User[1][Purpose]"]', (input, value) => input.value = value, process.env.FORM_Representation);

        const CountrySelect1 = await page.$$('.xselect-display.form-control');
        await CountrySelect1[0].click();

        const Country1 = await page.$$('.xselect-list-item[data-value="25"]');
        await Country1[0].click();

        const CountrySelect2 = await page.$$('.xselect-display.form-control');
        await CountrySelect2[1].click();

        const Country2 = await page.$$('.xselect-list-item[data-value="182"]');
        await Country2[1].click();

        await page.click('button[data-submit-url="/en/actions/legalisation/insert"]');

        await selectAppointmentDate(page)
    } catch (error) {
        console.log("formFillUpPage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await formFillUpPage(page)
    }
}

async function visitTypePage(page) {
    try {
        await page.waitForSelector('input[value="207"]')
        await page.click('input[value="207"]');

        await page.waitForSelector('button[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button[data-submit-url="/en/actions/legalisation/insert"]');

        await formFillUpPage(page)
    } catch (error) {
        console.log("visitTypePage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await visitTypePage(page)
    }
}

async function participatePage(page) {
    try {
        await page.waitForSelector('.xradio-card-checkbox')
        const secondElement = await page.$$('.xradio-card-checkbox');
        await secondElement[1].click();

        await page.waitForSelector('button[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button[data-submit-url="/en/actions/legalisation/insert"]');

        await visitTypePage(page)
    } catch (error) {
        console.log("participatePage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await participatePage(page)
    }
}

async function consularPage(page) {
    try {
        await page.waitForSelector('button[data-submit-url="/en/actions/legalisation/insert"]')
        await page.click('button[data-submit-url="/en/actions/legalisation/insert"]');

        await participatePage(page)
    } catch (error) {
        console.log("consularPage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await consularPage(page)
    }
}

async function registerNewVisitPage(page) {
    try {
        await page.waitForSelector('button[data-url="/en/legalisation/wizard/1/-1"]')
        await page.click('button[data-url="/en/legalisation/wizard/1/-1"]');

        await consularPage(page)
    } catch (error) {
        console.log("registerNewVisitPage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await registerNewVisitPage(page)
    }
}

async function login(page) {
    try {
        await page.waitForSelector('input.form-control[is="text-mail"]')
        await page.$eval('input.form-control[is="text-mail"]', (input, value) => input.value = value, process.env.VFS_EMAIL);
        await page.$eval('input[type="password"]', (input, value) => input.value = value, process.env.VFS_PASSWORD);

        console.log("Entering captcha solving...")
        await captchaSolver(page);

        try {
            await page.waitForSelector('button.btn.primary.rounded-pill[data-submit-url="/en/actions/user/login/login"]')
            await page.$eval('button.btn.primary.rounded-pill[data-submit-url="/en/actions/user/login/login"]', element => element.click())

            await page.waitForSelector('button.btn.outline-primary.rounded-pill[data-url="/en/legalisation/wizard/1/-1"]')
            console.log("Captcha Finished");

            await registerNewVisitPage(page)
        } catch (error) {
            await page.$eval('a.reset-captcha-btn', element => element.click());
            await page.waitForTimeout(10000);
            await login(page)
        }

        return page
    } catch (error) {
        console.log("Loging Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await login(page)
    }
}

async function legalisationLoginPage(page, url) {
    try {
        page.setDefaultNavigationTimeout(0);
        await page.goto(url, {
            waitUntil: 'load', timeout: 0
        });

        await page.waitForSelector('button.btn.outline-primary.rounded-pill[is="button-url"]');
        await page.click('button.btn.outline-primary.rounded-pill[is="button-url"]');

        await login(page)
    } catch (error) {
        console.log("legalisationLoginPage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await legalisationLoginPage(page)
    }
}

async function lunchBrowser() {
    console.log("Loging...")
    browser = await puppeteer.launch({
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

    return page
}


const lithuania = async () => {
    console.log('calling API ----- ')
    const url = "https://keliauk.urm.lt/en/legalisation"
    let page = await lunchBrowser()
    await legalisationLoginPage(page, url)
}

module.exports = lithuania