const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const E = require('../games/fossil-museum/engine.js'), routes = require('./fossil-routes.cjs');
function boot() {
  const nodes = new Map(), docEvents = {}, document = { activeElement: null, addEventListener(name, fn) { docEvents[name] = fn; }, getElementById: id => get(id) };
  function node(id, dataset = {}) {
    return { id, dataset, events: {}, children: [], textContent: '', hidden: false, disabled: false, value: '', className: '', attributes: {}, tagName: 'BUTTON',
      addEventListener(name, fn) { this.events[name] = fn; }, setAttribute(name, value) { this.attributes[name] = value; },
      focus() { document.activeElement = this; },
      closest(selector) { return selector === '[data-cell]' && this.dataset.cell !== undefined || selector === '[data-tool]' && this.dataset.tool !== undefined ? this : null; },
      querySelectorAll(selector) { return this.children.filter(el => el.closest(selector)); },
      querySelector(selector) { const match = selector.match(/^\[data-cell="(\d+)"\]$/); return match ? this.children.find(el => el.dataset.cell === match[1]) || null : null; },
      set innerHTML(value) {
        this._html = value;
        if (id === 'board') {
          if (this.children.includes(document.activeElement)) document.activeElement = null;
          this.children = [...value.matchAll(/<button\b([^>]*)>/g)].map(match => {
            const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
            const el = node('cell', { cell: attrs['data-cell'] }); el.attributes = attrs; return el;
          });
        }
      }, get innerHTML() { return this._html || ''; }
    };
  }
  function get(id) { if (!nodes.has(id)) nodes.set(id, node(id)); return nodes.get(id); }
  get('tools').children = [node('brush', { tool: 'brush' }), node('pick', { tool: 'pick' })];
  vm.runInNewContext(fs.readFileSync(require.resolve('../games/fossil-museum/app.js'), 'utf8'), { FossilMuseum: E, document });
  const click = id => { const n = get(id); if (!n.disabled) n.events.click({ target: n }); };
  const cell = index => get('board').querySelector(`[data-cell="${index}"]`);
  const tap = index => get('board').events.click({ target: cell(index) });
  const tool = value => get('tools').events.click({ target: get('tools').children.find(el => el.dataset.tool === value) });
  function key(key, index, props = {}) {
    let prevented = false; const target = index === undefined ? document.activeElement || node('body') : cell(index);
    docEvents.keydown({ key, repeat: false, target, preventDefault() { prevented = true; }, ...props }); return prevented;
  }
  const site = value => get('site').events.change({ target: { value: String(value) } });
  return { get, click, cell, tap, tool, key, site, document };
}
function win(b, id = 0) { for (const tool of ['brush', 'pick']) { b.tool(tool); for (const i of routes[id][tool]) b.tap(i); } }
test('controller initial view contains 36 labels, one roving tabindex, hidden-cell secrecy and tool state', () => {
  const b = boot(); assert.equal(b.get('board').children.length, 36); assert.equal(b.get('board').children.filter(n => n.attributes.tabindex === '0').length, 1);
  assert.equal(b.get('energy').textContent, '34'); assert.equal(b.get('collected').textContent, '0 / 2'); assert.equal(b.get('undo').disabled, true);
  assert.match(b.cell(7).attributes['aria-label'], /まだ砂/); assert.doesNotMatch(b.cell(7).attributes['aria-label'], /魚|骨の続き/);
  assert.match(b.cell(8).attributes['aria-label'], /骨の続きは上・右・下・左/); assert.equal(b.get('tools').children[0].attributes['aria-pressed'], 'true');
});
test('tap tools and cells call production engine; repeat taps are free', () => {
  const b = boot(); b.tap(7); assert.equal(b.get('energy').textContent, '32'); b.tap(7); assert.equal(b.get('energy').textContent, '32');
  b.tool('pick'); b.tap(9); assert.equal(b.get('energy').textContent, '31'); assert.equal(b.get('chips').textContent, '1 / 2'); assert.match(b.cell(9).attributes['aria-label'], /欠けあり/);
});
test('all three fixed command routes produce actual controller victories and scores', () => {
  for (let id = 0; id < 3; id++) { const b = boot(); b.site(id); win(b, id); assert.equal(b.get('result').hidden, false); assert.equal(b.get('result-title').textContent, '砂の下から、展示室へ'); assert.equal(b.get('result-mark').textContent, '★★★'); assert.equal(b.get('energy').textContent, String([4,2,0][id])); assert.equal(b.get('collected').textContent, '2 / 2'); }
});
test('success freezes board and tool inputs; undo returns to active excavation', () => {
  const b = boot(); win(b); const html = b.get('board').innerHTML, message = b.get('message').textContent;
  b.tap(4); b.tool('brush'); assert.equal(b.get('board').innerHTML, html); assert.equal(b.get('message').textContent, message); assert.ok(b.get('tools').children.every(n => n.disabled));
  b.click('result-undo'); assert.equal(b.get('result').hidden, true); assert.equal(b.get('collected').textContent, '1 / 2'); b.tap(33); assert.equal(b.get('result').hidden, false);
});
test('chip failure supports undo, retry and clean resource restoration', () => {
  const b = boot(); b.tool('pick'); for (const i of [7,9,2]) b.tap(i);
  assert.equal(b.get('result-title').textContent, '調査をやり直そう'); assert.equal(b.get('chips').textContent, '3 / 2'); assert.equal(b.get('next').hidden, true);
  b.click('result-undo'); assert.equal(b.get('result').hidden, true); assert.equal(b.get('chips').textContent, '2 / 2'); assert.match(b.cell(2).attributes['aria-label'], /まだ砂/);
  b.tap(2); b.click('retry'); assert.equal(b.get('energy').textContent, '34'); assert.equal(b.get('chips').textContent, '0 / 2'); assert.equal(b.get('undo').disabled, true); assert.equal(b.get('result').hidden, true);
});
test('budget loss and one-work auto-switch cannot leave an unaffordable tool selected', () => {
  const b = boot(); b.tool('pick'); b.tap(1); b.tool('brush');
  for (let i = 0; i < 36 && b.get('energy').textContent !== '1'; i++) b.tap(i);
  assert.equal(b.get('energy').textContent, '1'); assert.equal(b.get('tools').children[0].disabled, true); assert.equal(b.get('tools').children[1].attributes['aria-pressed'], 'true');
  const covered = b.get('board').children.find(n => /まだ砂/.test(n.attributes['aria-label'])); b.tap(Number(covered.dataset.cell));
  assert.equal(b.get('energy').textContent, '0'); assert.equal(b.get('result-title').textContent, '調査をやり直そう');
});
test('next site, last-site wrap, selector and restart reset stale UI and history', () => {
  const b = boot(); win(b); b.click('next'); assert.equal(b.get('site').value, '1'); assert.equal(b.get('energy').textContent, '32'); assert.equal(b.get('undo').disabled, true); assert.equal(b.get('result').hidden, true);
  b.site(2); win(b, 2); assert.equal(b.get('next').textContent, '最初の地点へ'); b.click('next'); assert.equal(b.get('site').value, '0');
  b.tap(7); b.click('restart'); assert.equal(b.get('energy').textContent, '34'); assert.equal(b.get('undo').disabled, true); assert.equal(b.get('tools').children[0].attributes['aria-pressed'], 'true');
});
test('keyboard cell navigation stays bounded and Enter/Space activate once', () => {
  const b = boot(); assert.equal(b.key('ArrowLeft', 0), true); assert.equal(b.document.activeElement.dataset.cell, '0');
  b.key('ArrowRight', 0); assert.equal(b.document.activeElement.dataset.cell, '1'); b.key('ArrowDown'); assert.equal(b.document.activeElement.dataset.cell, '7');
  b.key('Enter'); assert.equal(b.get('energy').textContent, '32'); b.key(' '); assert.equal(b.get('energy').textContent, '32');
  b.key('ArrowRight'); b.key('ArrowRight'); b.key(' '); assert.equal(b.get('energy').textContent, '30');
});
test('keyboard tool change preserves board focus after DOM replacement', () => {
  const b = boot(); b.cell(1).focus(); b.key('1', 1); assert.equal(b.document.activeElement.dataset.cell, '1');
  b.key('Enter'); assert.equal(b.get('energy').textContent, '33'); b.key('ArrowRight'); assert.equal(b.document.activeElement.dataset.cell, '2'); b.key('2'); assert.equal(b.document.activeElement.dataset.cell, '2'); b.key('Enter'); assert.equal(b.get('energy').textContent, '31');
});
test('held key defaults and shortcuts are gated while native result buttons stay activatable', () => {
  const b = boot(); assert.equal(b.key('Enter', 7, { repeat: true }), true); assert.equal(b.get('energy').textContent, '34');
  assert.equal(b.key('2', undefined, { target: { tagName: 'SELECT' } }), false); assert.equal(b.key('z', undefined, { ctrlKey: true }), false);
  b.tap(7); b.key('z', undefined, { repeat: true }); assert.equal(b.get('energy').textContent, '32'); b.key('z'); assert.equal(b.get('energy').textContent, '34');
  win(b); assert.equal(b.key(' ', undefined, { target: b.get('retry') }), false); assert.equal(b.key('Enter', undefined, { target: b.get('next') }), false);
});
test('non-cell page arrows and space retain normal scrolling/activation semantics', () => {
  const b = boot(); assert.equal(b.key('ArrowDown'), false); assert.equal(b.key(' '), false); assert.equal(b.key('Enter'), false);
});
test('static UI has responsive six-column sizing, no gameplay network/storage and matching script references', () => {
  const html = fs.readFileSync(require.resolve('../games/fossil-museum/index.html'), 'utf8'), css = fs.readFileSync(require.resolve('../games/fossil-museum/style.css'), 'utf8');
  assert.match(html, /lang="ja"/); assert.match(html, /width=device-width,initial-scale=1/); assert.match(css, /repeat\(6,minmax\(0,1fr\)\)/); assert.match(css, /min-height:44px/); assert.match(css, /prefers-reduced-motion/);
  for (const name of ['engine.js','app.js']) { assert.ok(html.includes(`${name}?v=1`)); assert.doesNotMatch(fs.readFileSync(require.resolve(`../games/fossil-museum/${name}`), 'utf8'), /fetch\(|XMLHttpRequest|localStorage|sessionStorage|https?:\/\//); }
});
