const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = 'D:/tmp/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const APP_PAGES = [
  ['A01', '/pages/login/index'],
  ['A14', '/pages/home/index'],
  ['A02', '/pages/confirm/index'],
  ['A03', '/pages/redflag/index'],
  ['A04', '/pages/confusion/index'],
  ['A05', '/pages/report/index'],
  ['A06', '/pages/verify/index'],
  ['A07', '/pages/analysis/index'],
  ['A08', '/pages/report-compare/index'],
  ['A09', '/pages/qa/index'],
  ['A10', '/pages/timeline/index'],
  ['A11', '/pages/record/index'],
  ['A12', '/pages/summary/index'],
  ['A13', '/pages/contents/index'],
  ['A15', '/pages/content-detail/index'],
  ['A16', '/pages/feedback/index'],
  ['A17', '/pages/mine/index'],
  ['A18', '/pages/fallback/index'],
];

const WEB_PAGES = [
  ['W01', '/login'],
  ['W02', '/dashboard'],
  ['W03', '/analysis'],
  ['W04', '/qa'],
  ['W05', '/timeline'],
  ['W06', '/followup'],
  ['W07', '/contents'],
  ['W08', '/account'],
];

const ADMIN_PAGES = [
  ['B01', '/login'],
  ['B02', '/dashboard'],
  ['B03', '/contents'],
  ['B04', '/contents/content-1'],
  ['B05', '/evidence'],
  ['B06', '/feedback'],
  ['B07', '/safety'],
  ['B08', '/models'],
  ['B09', '/models/eval'],
  ['B10', '/users'],
  ['B11', '/audit'],
  ['B12', '/cases'],
];

async function loginApp(page) {
  await page.goto('http://localhost:5401/pages/login/index', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[type="number"]');
    const codeInput = document.querySelector('input[placeholder*="验证码"]');
    if (phoneInput) {
      phoneInput.value = '13800000001';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (codeInput) {
      codeInput.value = '123456';
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelectorAll('.login__checkbox').forEach((cb) => cb.click());
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.querySelector('.login__submit')?.click();
  });
  await page.waitForTimeout(2000);
}

async function loginWeb(page) {
  await page.goto('http://localhost:5402/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[type="tel"]');
    const codeInput = document.querySelector('input[placeholder*="验证码"]');
    if (phoneInput) {
      phoneInput.value = '13800000001';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (codeInput) {
      codeInput.value = '123456';
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelectorAll('.login__agree, .login__consent-row').forEach((el) => el.click());
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.querySelector('.login__submit')?.click();
  });
  await page.waitForTimeout(2000);
}

async function loginAdmin(page) {
  await page.goto('http://localhost:5403/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder*="邮箱"]');
    const pwdInput = document.querySelector('input[type="password"]');
    const totpInput = document.querySelector('input[placeholder*="验证码"]');
    if (nameInput) { nameInput.value = '赵总'; nameInput.dispatchEvent(new Event('input', { bubbles: true })); }
    if (pwdInput) { pwdInput.value = 'Admin@123456'; pwdInput.dispatchEvent(new Event('input', { bubbles: true })); }
    if (totpInput) { totpInput.value = '123456'; totpInput.dispatchEvent(new Event('input', { bubbles: true })); }
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document.querySelector('.login__submit')?.click();
  });
  await page.waitForTimeout(2000);
}

async function screenshotPages(browser, pages, baseUrl, width, loginFn, prefix) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  if (loginFn) {
    try {
      await loginFn(page);
    } catch (e) {
      console.error(`登录失败 (${prefix}):`, e.message);
    }
  }
  for (const [name, pathname] of pages) {
    try {
      await page.goto(`${baseUrl}${pathname}`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, `${prefix}${name}.png`), fullPage: true });
      console.log(`  ✓ ${prefix}${name}`);
    } catch (e) {
      console.error(`  ✗ ${prefix}${name}: ${e.message}`);
    }
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  console.log('截取 App 端（375）...');
  await screenshotPages(browser, APP_PAGES, 'http://localhost:5401', 375, loginApp, 'app-');
  console.log('截取 Web 端（1440）...');
  await screenshotPages(browser, WEB_PAGES, 'http://localhost:5402', 1440, loginWeb, 'web-');
  console.log('截取 Admin 端（1440）...');
  await screenshotPages(browser, ADMIN_PAGES, 'http://localhost:5403', 1440, loginAdmin, 'admin-');
  await browser.close();
  console.log(`\n截图完成，保存在 ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
