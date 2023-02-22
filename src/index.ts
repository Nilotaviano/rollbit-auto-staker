import { executablePath, Page, PuppeteerLaunchOptions } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import TOTP from "totp-generator";
import { CAPTCHA_SOLVER, CAPTCHA_SOLVER_API_KEY, CREDENTIALS, HEADLESS } from './config';
import { delay, typeWithRandomDelay } from './helpers';

puppeteer
  .use(AdblockerPlugin())
  .use(StealthPlugin())
  .use(
    RecaptchaPlugin({
      provider: {
        id: CAPTCHA_SOLVER,
        token: CAPTCHA_SOLVER_API_KEY
      },
      visualFeedback: true
    })
  )

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

const DEFAULT_OPTIONS: PuppeteerLaunchOptions = {
  headless: HEADLESS,
  defaultViewport: {
    width: 1920,
    height: 1080,
    isLandscape: true,
    hasTouch: false,
    isMobile: false
  },
  executablePath: executablePath(),
  args: ['--start-maximized'],
};

(async () => {
  let { page, browser } = await launchPuppeteer();

  await signIn(page);

  console.info("Logged in!");

  const rlbLotteryButton = await page.$x(`//a[contains(text(), 'RLB Lottery')]`).then(elements => elements[0]);
  await rlbLotteryButton.click();

  while (true) {
    await stakeRLB(page);

    // a new lottery happens every 16 hours and 40 minutes, roughly
    await delay(ONE_HOUR * 16 + ONE_MINUTE * 40);
  }
})();

async function stakeRLB(page: Page) {
  const maxButton = await page.waitForXPath("//button[text()='Max']", { timeout: ONE_HOUR * 2 });
  await maxButton?.click();

  const stakeButton = await page.$x(`//button[contains(text(), 'Set Stake To')]`).then(elements => elements[0]);
  await stakeButton.click();

  const rollbotMultiplyButton = await page.$x(`//button[contains(text(), 'rollbot')]`).then(elements => elements[0]);
  await rollbotMultiplyButton.click();

  const applyRollbotMultiplyButton = await page.waitForSelector(`xpath///button[text()='Apply']`);
  await applyRollbotMultiplyButton?.click();

  const totalStakeAmount: string = await page.waitForSelector(`xpath///div[contains(text(), 'Total stake:')]`)
    .then(element => element?.evaluate(x => x.parentElement.textContent));

  console.log(totalStakeAmount);
}

async function launchPuppeteer(options?: PuppeteerLaunchOptions) {
  const browser = await puppeteer.launch(Object.assign({}, DEFAULT_OPTIONS, options));
  const page = await browser.pages()
    .then(pages => pages[0]);

  await page.goto('https://rollbit.com/', {
    waitUntil: 'load',
    timeout: 0
  });

  await page.waitForSelector('#rb-loader', { hidden: true });

  return { page, browser };
}

async function signIn(page: Page): Promise<void> {
  const isAlreadySignedIn = await page.$x(`//div[text()="Account"]`).then(elements => elements.length === 1);

  if (isAlreadySignedIn)
    return;

  // Click "Login" button
  const openLoginModalButton = await page.waitForSelector(`xpath///div[text()="Login"]`);
  await openLoginModalButton?.click();

  const [
    usernameInputField,
    passwordInputField,
    passcodeInputField,
    submitLoginButton
  ] = await Promise.all([
    page.waitForSelector(`xpath///input[@name="email"]`),
    page.waitForSelector(`xpath///input[@name="password"]`),
    page.waitForSelector(`xpath///div[contains(text(), "2FA Code")]`)
      .then(x => x?.click())
      .then(_ => page.waitForSelector(`xpath///input[@name="passcode"]`)),
    page.waitForSelector(`xpath///button[text()="Login" and @type="submit"]`)
  ]);

  if (!usernameInputField || !passwordInputField || !passcodeInputField || !submitLoginButton) {
    throw new Error("Couldn't find login modal inputs");
  }

  await typeWithRandomDelay(CREDENTIALS.username, usernameInputField);
  await typeWithRandomDelay(CREDENTIALS.password, passwordInputField);

  let signedIn = false;

  while (!signedIn) {
    await passcodeInputField.evaluate((element) => element.value = "")
    await typeWithRandomDelay(TOTP(CREDENTIALS.otpToken), passcodeInputField);

    await submitLoginButton.click();

    await page.solveRecaptchas();

    // Wait for the "Account" button to appear, which means that the user has logged in
    signedIn = await page.waitForSelector(`xpath///div[text()="Account"]`).then(el => !!el).catch(() => false);
  }
}
