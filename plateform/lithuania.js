// require('dotenv').config({ path: `../.env` });
//https://blog.nashtechglobal.com/mastering-cloudflare-captcha-bypass-in-automation/
//https://www.npmjs.com/package/2captcha-ts#cloudflare-turnstile
//https://github.com/2captcha/2captcha-php/blob/master/examples/turnstile_options.php
//https://2captcha.com/api-docs/get-task-result

require('events').EventEmitter.defaultMaxListeners = 15;
const fs = require('fs');
const puppeteer = require("puppeteer");
const Captcha = require("@2captcha/captcha-solver")
const { Solver } = require('2captcha-ts');
const { readFileSync } = require('fs');
const XLSX = require('xlsx');
const workbook = XLSX.readFile('VFS.xlsx');
const sheet_name_list = workbook.SheetNames;
const excellData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])[0];


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

const checkIpBlock = async (page) => {
    try {
        await page.waitForSelector('.fw-700.mt-3')
        const innerText = await page.evaluate(() => {
            const element = document.querySelector('.fw-700.mt-3');
            return element.innerText;
        });

        if (innerText.trim() === "Registracija naujam vizitui negalima") {
            browser.close();
            lithuania()
        }
    } catch (error) {

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
        await page.locator('#date').wait();
        await page.locator('#date').click();

        await page.locator('.xdate-day-number:not(.disabled-day):not(.day-reserved)').wait();
        await page.locator('.xdate-day-number:not(.disabled-day):not(.day-reserved)').click();

        await page.locator('.xtime-circle').wait();
        await page.locator('.xtime-circle').click();

        await page.locator('button[data-submit-url="/en/actions/legalisation/insert"]').wait();
        await page.locator('button[data-submit-url="/en/actions/legalisation/insert"]').click();

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
        await page.$eval('input.form-control[is="number-phone"]', (input, value) => input.value = value, `+${excellData.Phone}`);
        await page.$eval('input.form-control[name="User[1][Name]"]', (input, value) => input.value = value, excellData.First_Name);
        await page.$eval('input.form-control[name="User[1][Surname]"]', (input, value) => input.value = value, excellData.Last_Name);
        await page.$eval('input.form-control[name="User[1][Email]"]', (input, value) => input.value = value, excellData.Email);
        await page.$eval('input.form-control[name="User[1][Phone]"]', (input, value) => input.value = value, `+${excellData.User_Phone}`);
        await page.$eval('textarea.form-control[name="User[1][Purpose]"]', (input, value) => input.value = value, excellData.Representation);

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
        checkIpBlock(page);

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
            await page.waitForSelector('button[data-submit-url="/en/actions/user/login/login"]')
            await page.click('button[data-submit-url="/en/actions/user/login/login"]')

            await page.waitForSelector('button[data-url="/en/legalisation/wizard/1/-1"]')
            console.log("Captcha Finished");

            await registerNewVisitPage(page)
        } catch (error) {
            await page.click('a.reset-captcha-btn');
            await sleep(10000);
            await login(page);
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
        await page.goto(url);
        await

            await page.locator('button[data-url="/en/user/login"]').wait();
        await page.locator('button[data-url="/en/user/login"]').click();

        await login(page)
    } catch (error) {
        console.log("legalisationLoginPage Error: ", error.message);
        await sleep(60000);
        await page.reload();
        await legalisationLoginPage(page, url)
    }
}

async function lunchBrowser(url) {
    console.log("Lunch browser...")
    browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        // userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36', // User agent string
        viewportWidth: 1920,
        viewportHeight: 1080,
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
    let page = pages[0];

    const preloadFile = readFileSync('./plateform/inject.js', 'utf8');
    await page.evaluateOnNewDocument(preloadFile);

    const tunelSolver = new Solver(process.env.CAPTCHA_API_KEY);



    page.on('console', async (msg) => {
        const txt = msg.text();
        if (txt.includes('intercepted-params:')) {
            const params = JSON.parse(txt.replace('intercepted-params:', ''));

            try {
                console.log(`Solving the captcha...`);
                const res = await tunelSolver.cloudflareTurnstile(params);
                console.log(`Solved the captcha ${res.id}`);
                console.log(res);

                await page.evaluate((token) => {
                    cfCallback(token);
                }, res.data);

                await page.setExtraHTTPHeaders({ 'Accept-Language': 'en' });

                console.log("Finish");

                await legalisationLoginPage(page, url)
            } catch (e) {
                console.log(e.err);
            }
        }
    });

    await legalisationLoginPage(page, url)

    // await page.goto(url);

}


const lithuania = async () => {
    console.log('calling API ----- ')
    const url = "https://keliauk.urm.lt/en/legalisation"
    await lunchBrowser(url)

}

module.exports = lithuania