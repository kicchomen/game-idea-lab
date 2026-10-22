'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Engine = require('../games/roadside-bargain/engine.js');

function mount() {
  let state;
  let html = '';
  let buttons = [];
  let focused = null;
  const rootListeners = {};
  const documentListeners = {};
  const liveMessage = { textContent: '' };
  const root = {};

  function makeButton(attributes) {
    const read = (name) => new RegExp(`${name}="([^"]*)"`).exec(attributes)?.[1];
    const button = {
      dataset: {
        action: read('data-action'),
        side: read('data-side'),
        delta: read('data-delta')
      },
      disabled: /\sdisabled(?:\s|$)/.test(attributes),
      focus() { focused = button; },
      closest() { return button; }
    };
    return button;
  }

  root.innerHTML = '';
  Object.defineProperty(root, 'innerHTML', {
    get() { return html; },
    set(value) {
      html = value;
      buttons = [...value.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)]
        .map((match) => makeButton(match[1]));
    }
  });
  root.addEventListener = (type, listener) => { rootListeners[type] = listener; };
  root.contains = (button) => buttons.includes(button);
  root.querySelector = (selector) => {
    const action = /data-action="([^"]*)"/.exec(selector)?.[1];
    const side = /data-side="([^"]*)"/.exec(selector)?.[1];
    const delta = /data-delta="([^"]*)"/.exec(selector)?.[1];
    return buttons.find((button) => (!action || button.dataset.action === action)
      && (!side || button.dataset.side === side)
      && (delta === undefined || button.dataset.delta === delta)) || null;
  };
  root.querySelectorAll = (selector) => {
    const action = /data-action="([^"]*)"/.exec(selector)?.[1];
    const side = /data-side="([^"]*)"/.exec(selector)?.[1];
    const delta = /data-delta="([^"]*)"/.exec(selector)?.[1];
    return buttons.filter((button) => (!action || button.dataset.action === action)
      && (!side || button.dataset.side === side)
      && (delta === undefined || button.dataset.delta === delta));
  };

  const document = {
    querySelector(selector) { return selector === '#game' ? root : liveMessage; },
    addEventListener(type, listener) { documentListeners[type] = listener; }
  };
  const window = { RoadsideBargainEngine: Engine };
  vm.runInNewContext(fs.readFileSync(require.resolve('../games/roadside-bargain/app.js'), 'utf8'), { window, document });
  state = window.RoadsideBargainController?.getState?.() || null;

  function button(action, side, delta) {
    return buttons.find((item) => item.dataset.action === action
      && (side === undefined || item.dataset.side === side)
      && (delta === undefined || Number(item.dataset.delta) === delta)) || null;
  }

  return {
    get html() { return html; },
    get focused() { return focused; },
    get state() { return state; },
    get buttons() { return buttons; },
    get liveMessage() { return liveMessage.textContent; },
    rootListeners,
    documentListeners,
    button,
    click(action, side, delta, detail = 1) {
      const target = button(action, side, delta);
      assert.ok(target, `missing ${action}${side ? ` ${side}` : ''}${delta !== undefined ? ` ${delta}` : ''}`);
      assert.equal(target.disabled, false, `disabled ${action}`);
      rootListeners.click({ target, detail, preventDefault() {}, stopPropagation() {} });
      state = window.RoadsideBargainController?.getState?.() || state;
      return target;
    },
    staleClick(target, detail = 1) {
      rootListeners.click({ target, detail, preventDefault() {}, stopPropagation() {} });
    },
    keydown(event) { documentListeners.keydown(event); }
  };
}

test('controller renders readable two-sided priorities, quantities and patience', () => {
  const ui = mount();
  assert.match(ui.html, /旅人たちの取り引き/);
  assert.match(ui.html, /ミナ/);
  assert.match(ui.html, /タロウ/);
  assert.match(ui.html, /必要/);
  assert.match(ui.html, /しんぼう 4\/4/);
  assert.match(ui.html, /data-action="submit"/);
  assert.match(ui.html, /収支予測/);
  assert.equal(ui.liveMessage, '二人の話を聞き、数量を決めて提案しよう。');
});

test('quantity controls update the visible preview and keep keyboard focus', () => {
  const ui = mount();
  ui.click('adjust', 'left', -1);
  assert.match(ui.html, /1つの道の地図/);
  assert.equal(ui.focused.dataset.action, 'adjust');
  assert.equal(ui.focused.dataset.side, 'left');
  assert.equal(ui.focused.dataset.delta, '1');
  assert.match(ui.html, /ミナの収支/);
  assert.match(ui.html, /タロウの収支/);
});

test('minimum quantity fallback skips a disabled DOM match and focuses the enabled opposite control', () => {
  const ui = mount();
  ui.click('adjust', 'left', -1);
  assert.equal(ui.button('adjust', 'left', -1).disabled, true);
  assert.equal(ui.focused.dataset.side, 'left');
  assert.equal(ui.focused.dataset.delta, '1');
  assert.equal(ui.focused.disabled, false);
});

test('reopening a sealed offer focuses an enabled quantity control while submit is disabled', () => {
  const ui = mount();
  ui.click('adjust', 'left', -1);
  ui.click('submit');
  assert.match(ui.html, /二人とも同意した/);
  ui.click('push');
  assert.equal(ui.button('submit').disabled, true);
  assert.equal(ui.focused.dataset.action, 'adjust');
  assert.equal(ui.focused.disabled, false);
  assert.equal(ui.focused.dataset.side, 'left');
  assert.equal(ui.focused.dataset.delta, '1');
});

test('failed meeting describes the terms as last proposed rather than agreed', () => {
  const ui = mount();
  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  for (let attempt = 0; attempt < Engine.MAX_PATIENCE; attempt += 1) ui.click('submit');
  assert.match(ui.html, /旅人たちは別々の道へ/);
  assert.match(ui.html, /最後に提示した条件です。/);
  assert.doesNotMatch(ui.html, /同意した条件を確認しています。/);
});

test('stale click and double-click event cannot spend patience twice; held keyboard repeats are suppressed', () => {
  const ui = mount();
  const oldButton = ui.click('submit');
  assert.match(ui.html, /3\/4/);
  ui.staleClick(oldButton);
  assert.match(ui.html, /3\/4/);
  const beforeDoubleClick = ui.html;
  ui.click('submit', undefined, undefined, 2);
  assert.equal(ui.html, beforeDoubleClick);

  let prevented = false;
  let stopped = false;
  ui.keydown({ repeat: true, key: 'Enter', preventDefault() { prevented = true; }, stopPropagation() { stopped = true; } });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

test('controller brokers two deals, can risk another concession, then supports failure and retry', () => {
  const ui = mount();
  ui.click('submit');
  assert.match(ui.html, /ミナからの再提案/);
  ui.click('counter');
  assert.match(ui.html, /二人とも同意した/);
  ui.click('seal');
  assert.match(ui.html, /道中の取り引きがまとまった/);
  ui.click('advance');
  assert.match(ui.html, /立ち寄り 02/);

  ui.click('submit');
  assert.match(ui.html, /二人とも同意した/);
  ui.click('push');
  assert.match(ui.html, /二人のしんぼうが一つ減った/);
  ui.click('adjust', 'right', -1);
  ui.click('submit');
  assert.match(ui.html, /条件が足りない|二人とも同意した/);
  ui.click('seal');
  ui.click('advance');
  assert.match(ui.html, /立ち寄り 03/);

  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  ui.click('submit');
  for (let attempt = 1; attempt < Engine.MAX_PATIENCE; attempt += 1) ui.click('submit');
  assert.match(ui.html, /しんぼうが尽きて/);
  ui.click('advance');
  assert.match(ui.html, /道が先へつながった/);
  assert.match(ui.html, /2 \/ 3/);
  ui.click('retry');
  assert.match(ui.html, /立ち寄り 01/);

  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  ui.click('submit');
  for (let attempt = 1; attempt < Engine.MAX_PATIENCE; attempt += 1) ui.click('submit');
  ui.click('advance');
  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'right', -1);
  ui.click('submit');
  for (let attempt = 1; attempt < Engine.MAX_PATIENCE; attempt += 1) ui.click('submit');
  ui.click('advance');
  ui.click('adjust', 'left', 1);
  ui.click('adjust', 'left', 1);
  ui.click('submit');
  for (let attempt = 1; attempt < Engine.MAX_PATIENCE; attempt += 1) ui.click('submit');
  ui.click('advance');
  assert.match(ui.html, /それぞれの道へ/);
  ui.click('retry');
  assert.match(ui.html, /立ち寄り 01/);
  assert.match(ui.html, /しんぼう 4\/4/);
});
