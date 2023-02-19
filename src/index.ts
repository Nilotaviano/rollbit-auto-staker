import puppeteer, { Page, PuppeteerLaunchOptions } from 'puppeteer';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;

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

  while (true) {
    await stakeRLB(page);

    // a new lottery happens every 16 hours and 40 minutes, roughly
    await delay(ONE_HOUR * 16 + ONE_MINUTE * 40);
  }
})();

async function stakeRLB(page: Page) {
  const maxButton = await page.waitForXPath("//button[text()='Max']", { timeout: ONE_HOUR });
  await maxButton?.click();

  const stakeButton = await page.$x(`//button[contains(text(), 'Set Stake To')]`).then(elements => elements[0]);
  await stakeButton.click();

  const rollbotMultiplyButton = await page.$x(`//button[contains(text(), 'rollbot')]`).then(elements => elements[0]);
  await rollbotMultiplyButton.click();

  const applyRollbotMultiplyButton = await page.waitForXPath(`//button[text()='Apply']`);
  await applyRollbotMultiplyButton?.click();

  const totalStakeAmount: string = await page.waitForXPath(`//div[contains(text(), 'Total stake:')]`)
    .then(element => element?.evaluate(x => x.parentElement.textContent));

  console.log(totalStakeAmount);
}

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