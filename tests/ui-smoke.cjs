const { chromium } = require(
  'C:/Users/jinse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);
const { pathToFileURL } = require('url');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto(pathToFileURL(path.join(process.cwd(), 'login.html')).href);
  await page.waitForTimeout(500);

  const result = {
    title: await page.title(),
    heading: await page.locator('h1').innerText(),
    loginForm: await page.locator('#authForm').count(),
    configWarning: await page.locator('#configWarning').isVisible(),
  };
  console.log(JSON.stringify(result));

  if (result.loginForm !== 1 || result.configWarning) {
    throw new Error('로그인 화면 또는 Supabase 연결 상태가 정상적이지 않습니다.');
  }

  await page.screenshot({
    path: 'C:/Users/jinse/.codex/visualizations/2026/08/12/019ff696-d2ad-7382-bca2-3a6902fd60e3/flagship-login.png',
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  if (!(await page.locator('#authForm').isVisible())) throw new Error('모바일 로그인 폼이 보이지 않습니다.');

  console.log(`errors=${JSON.stringify(errors)}`);
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
