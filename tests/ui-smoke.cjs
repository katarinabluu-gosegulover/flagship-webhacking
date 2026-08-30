const { chromium } = require(
  'C:/Users/jinse/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
);
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

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

  const studentHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  const studentScript = fs.readFileSync(path.join(process.cwd(), 'app-v2.js'), 'utf8');
  const notificationScript = fs.readFileSync(path.join(process.cwd(), 'notification-state.js'), 'utf8');
  const studentStyles = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf8');
  const pagesWorkflow = fs.readFileSync(path.join(process.cwd(), '.github/workflows/pages.yml'), 'utf8');
  if (!studentHtml.includes('id="notificationButton"') || !studentHtml.includes('class="action-icon"')) {
    throw new Error('상단 관리자·알림 아이콘 마크업이 없습니다.');
  }
  if (!studentScript.includes("notificationButton.addEventListener('click', notificationModal)")) {
    throw new Error('알림 버튼 클릭 동작이 연결되지 않았습니다.');
  }
  if (!studentHtml.includes('notification-state.js') || !studentScript.includes('notificationState.markRead') || !notificationScript.includes('storagePrefix')) {
    throw new Error('사용자별 알림 읽음 처리 기능이 연결되지 않았습니다.');
  }
  if (!studentScript.includes('data-read-notification') || !studentScript.includes('data-read-all') || !studentScript.includes('bindNotificationActions')) {
    throw new Error('개별 읽음 또는 모두 읽음 동작이 연결되지 않았습니다.');
  }
  if (!pagesWorkflow.includes('notification-state.js')) {
    throw new Error('GitHub Pages 배포 파일에 알림 읽음 처리 모듈이 포함되지 않았습니다.');
  }
  if (!studentScript.includes('https://dreamhack.io/lecture/paths/web-hacking-advanced')) {
    throw new Error('지정된 Dreamhack Web Hacking Advanced Path 링크가 없습니다.');
  }
  if (!studentStyles.includes('.action-icon') || !studentStyles.includes('place-items: center')) {
    throw new Error('상단 아이콘 중앙 정렬 스타일이 없습니다.');
  }

  const staticShell = studentHtml
    .replace(/<script[^>]*><\/script>/g, '')
    .replace('<link rel="stylesheet" href="styles.css" />', '');
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.setContent(staticShell);
  await page.addStyleTag({ content: studentStyles });
  await page.locator('#adminShortcut').evaluate((element) => { element.hidden = false; });
  const adminBox = await page.locator('#adminShortcut').boundingBox();
  const notificationBox = await page.locator('#notificationButton').boundingBox();
  if (!adminBox || !notificationBox || adminBox.width !== 34 || notificationBox.width !== 34 || Math.abs(adminBox.y - notificationBox.y) > 1) {
    throw new Error('관리자·알림 아이콘의 크기 또는 세로 정렬이 일치하지 않습니다.');
  }
  await page.screenshot({
    path: 'C:/Users/jinse/.codex/visualizations/2026/08/12/019ff696-d2ad-7382-bca2-3a6902fd60e3/flagship-header-actions.png',
  });

  console.log(`errors=${JSON.stringify(errors)}`);
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
