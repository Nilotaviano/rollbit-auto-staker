import puppeteer, { Page, PuppeteerLaunchOptions } from 'puppeteer';
import fs from "fs";

const ONE_SECOND = 1000;

const DEFAULT_OPTIONS: PuppeteerLaunchOptions = {
  headless: true,
  slowMo: 250,
  userDataDir: "./user_data",
  defaultViewport: {
    width: 1920,
    height: 1080,
    isLandscape: true,
    hasTouch: false,
    isMobile: false
  }
};

(async () => {
  let { page, browser } = await launchPuppeteer();

  // Wait for the "Account" button to appear, which means that the user has logged in
  await page.waitForXPath(`//div[text()="Account"]`, { timeout: 120 * ONE_SECOND });

  console.info("Logged in!");

  const rlbLotteryButton = await page.$x(`//a[contains(text(), 'RLB Lottery')]`).then(elements => elements[0]);
  await rlbLotteryButton.click();

  await page.waitForNetworkIdle();

  const rlbAmount: string = await page.waitForSelector(".css-vft0h7")
    .then(element => element?.evaluate(x => x.textContent));

  console.log(`You have ${rlbAmount} currently staked`);

  await delay(120 * ONE_SECOND);

  await page.close();
  await browser.close();
})();

async function launchPuppeteer(options?: PuppeteerLaunchOptions) {
  const browser = await puppeteer.launch(Object.assign({}, DEFAULT_OPTIONS, options));
  const page = await browser.pages()
    .then(pages => pages[0]);

  await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36");

  await page.goto('https://rollbit.com/');

  await page.waitForNetworkIdle();

  return { page, browser };
}

function delay(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}