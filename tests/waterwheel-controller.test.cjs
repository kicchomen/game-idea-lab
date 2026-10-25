'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../games/waterwheel-week/engine.js');
const routes = require('./waterwheel-routes.cjs');
// This minimal DOM substitute exercises the real controller. It is NOT a browser/layout test.
function setup() {
  let now = 0, currentState, focused;
  const handlers = {}, nodes = {};
  function element(id) { return nodes[id] || (nodes[id] = { id, tagName: 'DIV', innerHTML: '', textContent: '', focus() { focused = id; }, addEventListener(type, fn) { handlers[id + ':' + type] = fn; } }); }
  const app = element('app');
  function buttons() {
    return [...app.innerHTML.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].map(match => {
      const attrs = Object.fromEntries([...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]]));
      const dataset = Object.fromEntries(Object.entries(attrs).filter(([k]) => k.startsWith('data-')).map(([k,v]) => [k.slice(5), v]));
      const node = { tagName: 'BUTTON', dataset, disabled: /\sdisabled(?:\s|$)/.test(match[1]), textContent: match[2].replace(/<[^>]*>/g,''), focus() { focused = dataset.card || dataset.action; }, closest() { return this; } };
      return node;
    });
  }
  app.querySelector = selector => { const query = /\[data-(\w+)="([^"]+)"\]/.exec(selector); return query ? buttons().find(b => b.dataset[query[1]] === query[2]) : null; };
  const tracked = { ...E };
  for (const name of ['createGame', 'retry']) tracked[name] = (...args) => currentState = E[name](...args);
  for (const name of ['select', 'commit', 'nextDay']) tracked[name] = (...args) => { const result = E[name](...args); if (result.ok) currentState = result.state; return result; };
  const document = { getElementById: element, addEventListener(type, fn) { handlers['document:' + type] = fn; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../games/waterwheel-week/app.js'), 'utf8'), { window: { WaterwheelEngine: tracked }, document, performance: { now: () => now } });
  function clickNode(node, extra = {}) { if (!node) throw new Error('Expected a rendered button'); handlers['app:click']({ target: node, detail: 1, ...extra }); }
  return {
    get state() { return currentState; }, get html() { return app.innerHTML; }, get focused() { return focused; }, get announcement() { return element('announcer').textContent; },
    button(action, card) { return buttons().find(b => b.dataset.action === action && (!card || b.dataset.card === card)); },
    click(action, card, extra) { clickNode(this.button(action, card), extra); }, clickNode,
    tick(ms = 500) { now += ms; },
    key(key, extra = {}) { const event = { key, repeat: false, target: element('app'), preventDefault() { this.prevented = true; }, ...extra }; handlers['document:keydown'](event); return event; },
    play(route) { for (const id of route) { this.click('select', id); this.tick(); this.click('commit'); if (this.state.phase === 'report') { this.tick(); this.click('next'); } } }
  };
}
test('initial controller renders one day, disabled confirmation, target and workshop chain', () => { const a = setup(); assert.equal(a.state.day, 1); assert.match(a.html, /パン21個/); assert.match(a.html, /カードを選んで予測を確認/); assert.match(a.html, /麦畑/); assert.match(a.html, /水車/); assert.match(a.html, /パン窯/); });
test('clicking a card displays preview without spending resources', () => { const a = setup(); a.click('select', 'mill'); assert.equal(a.state.day, 1); assert.equal(a.state.resources.coin, 6); assert.match(a.html, /PREVIEW · まだ未確定/); assert.match(a.announcement, /まだ確定していません/); assert.equal(a.focused, 'mill'); });
test('confirm creates a report, not an automatic next day', () => { const a = setup(); a.click('select', 'mill'); a.click('commit'); assert.equal(a.state.phase, 'report'); assert.equal(a.state.day, 1); assert.match(a.html, /1日目の夕方/); assert.equal(a.focused, 'report-title'); });
test('immediate repeated tap cannot skip report into next day', () => { const a = setup(); a.click('select', 'mill'); a.click('commit'); a.click('next'); assert.equal(a.state.phase, 'report'); assert.equal(a.state.day, 1); a.tick(399); a.click('next'); assert.equal(a.state.day, 1); a.tick(1); a.click('next'); assert.equal(a.state.day, 2); });
test('double-click detail is ignored and no second production occurs', () => { const a = setup(); a.click('select', 'mill'); const old = a.button('commit'); a.clickNode(old); a.tick(); a.click('next', undefined, { detail: 2 }); assert.equal(a.state.day, 1); a.clickNode(old); assert.equal(a.state.resources.flour, 2); assert.equal(a.state.history.length, 1); });
test('captured stale confirm cannot commit a different, newly selected card', () => { const a = setup(); a.click('select', 'mill'); const old = a.button('commit'); a.click('select', 'supplies'); a.clickNode(old); assert.equal(a.state.phase, 'choose'); assert.equal(a.state.history.length, 0); a.click('commit'); assert.equal(a.state.buildings.mill, 0); assert.equal(a.state.resources.wood, 10); });
test('digit shortcut selects a card and ignores key repeat', () => { const a = setup(); assert.equal(a.key('1').prevented, true); assert.equal(a.state.selected, 'mill'); const rev = a.state.revision; a.key('2', { repeat: true }); assert.equal(a.state.selected, 'mill'); assert.equal(a.state.revision, rev); a.key('2'); assert.equal(a.state.selected, 'woodcutter'); });
test('Enter and Space repeats are prevented; normal native activation is preserved', () => { const a = setup(); assert.equal(a.key('Enter', { repeat: true }).prevented, true); assert.equal(a.key(' ', { repeat: true }).prevented, true); assert.equal(a.key('Enter').prevented, undefined); });
test('modifier and editable-field shortcuts are ignored', () => { const a = setup(); a.key('1', { ctrlKey: true }); a.key('1', { altKey: true }); a.key('1', { target: { tagName: 'INPUT' } }); assert.equal(a.state.selected, null); });
test('unaffordable offers cannot change selection through click or shortcut', () => { const a = setup(); a.click('select','mill'); a.click('commit'); a.tick(); a.click('next'); a.click('select','oven'); a.tick(); a.click('commit'); a.tick(); a.click('next'); a.click('select','field'); a.tick(); a.click('commit'); a.tick(); a.click('next'); assert.equal(a.state.resources.wood, 0); assert.equal(a.button('select','mill').disabled, true); a.click('select','mill'); assert.equal(a.state.selected, null); a.key('1'); assert.equal(a.state.selected,null); assert.match(a.announcement, /不足/); });
test('full controller route reaches 21-bread success and retry is clean', () => { const a = setup(); a.play(routes.success21); assert.equal(a.state.result.won,true); assert.match(a.html,/町のお祭り、開幕/); assert.equal(a.focused,'end-title'); a.tick(); a.click('retry'); assert.equal(a.state.phase,'choose'); assert.equal(a.state.day,1); assert.equal(a.state.resources.bread,0); assert.equal(a.state.history.length,0); });
test('full controller route reaches real 18-bread failure and can retry into success', () => { const a = setup(); a.play(routes.failure18); assert.equal(a.state.result.won,false); assert.match(a.html,/パンが3個足りません/); a.tick(); a.click('retry'); a.play(routes.success27); assert.equal(a.state.result.won,true); assert.equal(a.state.resources.bread,27); });
test('mid-game restart asks confirmation; cancel preserves progress', () => { const a = setup(); a.click('select','mill'); a.click('commit'); a.click('ask-retry'); assert.match(a.html,/一週間の記録を消してやり直す/); assert.equal(a.focused,'cancel-retry'); a.click('cancel-retry'); assert.equal(a.focused,'ask-retry'); assert.equal(a.state.phase,'report'); assert.equal(a.state.history.length,1); a.click('ask-retry'); a.tick(); a.click('retry'); assert.equal(a.state.phase,'choose'); assert.equal(a.state.history.length,0); });

test('future offer schedule expands, marks current/past days, and stays open while selecting', () => { const a = setup(); assert.match(a.html,/id="offer-schedule" hidden/); a.click('toggle-schedule'); assert.doesNotMatch(a.html,/id="offer-schedule" hidden/); assert.equal(a.focused,'toggle-schedule'); assert.equal((a.html.match(/data-day=/g)||[]).length,7); assert.match(a.html,/1日目・今日/); a.click('select','mill'); assert.doesNotMatch(a.html,/id="offer-schedule" hidden/); a.click('commit'); a.tick(); a.click('next'); assert.match(a.html,/1日目・済/); assert.match(a.html,/2日目・今日/); a.click('toggle-schedule'); assert.match(a.html,/id="offer-schedule" hidden/); });
