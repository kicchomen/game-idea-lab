const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const css = readFileSync(join(__dirname, '../games/roadside-bargain/style.css'), 'utf8');
const html = readFileSync(join(__dirname, '../games/roadside-bargain/index.html'), 'utf8');

test('embedded game supports Blogger article widths below 320px', () => {
  const htmlRule = css.match(/html\s*\{([^}]*)\}/i)?.[1] ?? '';
  const bodyRule = css.match(/body\s*\{([^}]*)\}/i)?.[1] ?? '';
  assert.doesNotMatch(htmlRule, /min-width\s*:\s*320px/i);
  assert.doesNotMatch(bodyRule, /min-width\s*:\s*320px/i);
  assert.match(html, /href="style\.css\?v=\d{8}-\d+"/);
  assert.match(html, /src="engine\.js\?v=\d{8}-\d+"/);
  assert.match(html, /src="app\.js\?v=\d{8}-\d+"/);
});
