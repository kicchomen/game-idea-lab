const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.LOOM_PLAYWRIGHT || 'playwright');

const root = path.join(__dirname, '..');
const host = 'https://kicchomen.github.io/game-idea-lab';
const gamePath = '/games/loom-workshop/';
const articlePath = '/assets/loom-workshop/article.html';
const gameUrl = host + gamePath;
const coverAlt = '青緑と生成りの布を織りかけた卓上織り機と、糸を巻いた木の杼';
const diagramAlt = '青緑が縦に3段続いた列で、次の段を生成りにして連続を止める例';
const frameTitle = 'からくり織り工房を試遊';
const order = [2, 0, 3, 1, 0, 3, 2, 0];
const formats = { '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.html': 'text/html' };

async function localRoutes(context, articleFile) {
  await context.route(host + '/**', async (route) => {
    let relative = new URL(route.request().url()).pathname.slice('/game-idea-lab/'.length);
    if (relative.endsWith('/')) relative += 'index.html';
    const file = path.join(root, relative);
    const extension = path.extname(file);
    if ('/' + relative === articlePath) {
      const body = await fs.readFile(articleFile || file, 'utf8');
      return route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0;padding:0 16px">' + body + '</body></html>',
      });
    }
    await route.fulfill({ path: file, contentType: (formats[extension] ?? 'text/plain') + (extension === '.jpg' ? '' : '; charset=utf-8') });
  });
}

async function assertFits(scope, phase) {
  const dims = await scope.locator('main').evaluate((main) => {
    const box = main.getBoundingClientRect();
    const bottomButton = [...main.querySelectorAll('button')].filter((button) => button.offsetHeight)
      .map((button) => button.getBoundingClientRect().bottom);
    return {
      docWidth: document.documentElement.scrollWidth,
      docHeight: document.documentElement.scrollHeight,
      width: innerWidth,
      height: innerHeight,
      pageScroll: scrollY,
      bottom: box.bottom,
      lastControl: Math.max(...bottomButton),
    };
  });
  assert.ok(dims.docWidth <= dims.width, JSON.stringify(dims));
  assert.ok(dims.docHeight <= dims.height, JSON.stringify(dims));
  assert.ok(dims.bottom <= dims.height && dims.lastControl <= dims.height, JSON.stringify(dims));
  assert.equal(dims.pageScroll, 0);
  console.log(phase, dims.width + '×' + dims.height, 'UI', dims.bottom + 'px');
}

async function runGame(page, scope, mobile, name) {
  const press = async (locator) => mobile ? locator.tap() : locator.click();
  const pick = async (number) => mobile
    ? press(scope.locator('[data-choice="' + number + '"]'))
    : page.keyboard.press(String(number + 1));
  const status = scope.locator('#status');
  const start = scope.locator('#start');
  await assertFits(scope, name + ' ready');
  await press(start);
  await assertFits(scope, name + ' playing');
  if (!mobile) {
    await press(scope.getByRole('button', { name: '遊び方', exact: true }));
    assert.equal(await scope.locator('dialog').isVisible(), true);
    assert.equal(await scope.locator('dialog button').evaluate((button) => button === document.activeElement), true);
    await page.keyboard.press('3');
    assert.match(await scope.locator('#row-count').innerText(), /^0 /);
    await page.keyboard.press('Escape');
    assert.equal(await scope.locator('dialog').isVisible(), false);
    await scope.locator('[data-choice="2"]').focus();
  }
  await pick(0);
  assert.match(await status.innerText(), /見本と違います/);
  assert.equal(await scope.locator('#cloth-board .error.light').count(), 1);
  assert.equal(await scope.locator('#sample-board .error.dark').count(), 1);
  await assertFits(scope, name + ' sample failure');
  await press(start);
  for (const item of [2, 0, 0]) await pick(item);
  assert.match(await status.innerText(), /次の見本を確認/);
  assert.equal(await scope.locator('#cloth-board .danger').count(), 3);
  if (process.env.LOOM_QA_DIR && name === 'direct 320') {
    await page.screenshot({ path: path.join(process.env.LOOM_QA_DIR, 'weave-320-playing.png') });
  }
  for (const item of [3, 0]) await pick(item);
  assert.match(await status.innerText(), /糸が浮きました/);
  await assertFits(scope, name + ' float failure');
  await press(start);
  for (const item of order) await pick(item);
  assert.match(await status.innerText(), /織り上がり/);
  assert.match(await scope.locator('#row-count').innerText(), /^8 /);
  await assertFits(scope, name + ' won');
  await press(start);
  await pick(2);
  await press(scope.locator('#reset'));
  assert.match(await scope.locator('#row-count').innerText(), /^0 /);
  await pick(2);
  assert.match(await scope.locator('#row-count').innerText(), /^1 /);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.LOOM_CHROME });
  const errors = [];
  try {
    const cases = [[320, 640, true], [360, 720, true], [390, 760, true], [1280, 720, false]];
    for (const [width, height, mobile] of cases) {
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
      if (!process.env.LOOM_LIVE) await localRoutes(context, process.env.LOOM_ARTICLE_FILE);
      const page = await context.newPage();
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(gameUrl);
      await runGame(page, page, mobile, 'direct ' + width);
      const articleURL = process.env.LOOM_ARTICLE_URL || host + articlePath;
      if (!process.env.LOOM_LIVE || process.env.LOOM_ARTICLE_URL) {
        await page.goto(articleURL);
        const embedded = page.locator('iframe[title="' + frameTitle + '"]');
        await embedded.scrollIntoViewIfNeeded();
        await runGame(page, embedded.contentFrame(), mobile, 'embed ' + width);
        assert.equal(await page.getByRole('link', { name: '試遊を別画面で開く' }).getAttribute('href'), gameUrl);
        for (const alt of [coverAlt, diagramAlt]) {
          const image = page.getByAltText(alt);
          await image.scrollIntoViewIfNeeded();
          await image.evaluate((element) => element.decode());
          assert.ok(await image.evaluate((element) => element.naturalWidth > 0 && element.getBoundingClientRect().right <= innerWidth));
          if (process.env.LOOM_ARTICLE_URL) assert.match(await image.getAttribute('src'), /^https:\/\/blogger\.googleusercontent\.com\//);
        }
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        console.log('article', width + '×' + height, 'both images and link verified');
      }
      await context.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
