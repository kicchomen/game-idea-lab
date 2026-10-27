'use strict';
// Independent production-engine tests. The DOM section below uses a stub, not a browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const E = require('../games/shell-auction/engine.js');
const clone = x => JSON.parse(JSON.stringify(x));
function deepFreeze(x) { Object.freeze(x); Object.values(x).forEach(v => { if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v); }); return x; }
function oracleScore(items, color) {
  let pairBonus = 0;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (items[i].shape === items[j].shape) pairBonus += 4;
  return items.length * 2 + pairBonus + (new Set(items.map(x => x.shape)).size === 3 ? 5 : 0) + (items.reduce((n, x) => n + (x.color === color), 0) >= 2 ? 5 : 0);
}
function oracleRivalBid(s, id) {
  const r = s.rivals[id - 1], lot = s.lots[s.turn];
  const favorite = r.style === 'color' ? lot.color === r.favorite : lot.shape === r.favorite;
  const pair = s.collections[id].find(x => x.shape === lot.shape) ? 2 : 0;
  return Math.min(s.wallets[id], 2 + Number(favorite) * (r.style === 'color' ? 4 : 5) + pair + s.moods[s.turn][id - 1]);
}
function settle(s, amount) { const selected = E.selectBid(s, amount); assert.equal(selected.ok, true); const reveal = E.submit(selected.state); assert.equal(reveal.ok, true); return reveal.state; }
function play(seed, policy) { let s = E.createGame(seed), route = []; while (s.phase !== 'ended') { const amount = Math.min(s.wallets[0], policy(s)); route.push(amount); s = E.nextLot(settle(s, amount)).state; } return { state: s, route }; }
function optimal(seed) {
  let best = { score: -1, route: [] };
  function visit(s, route) {
    if (s.phase === 'ended') { if (s.result.score > best.score) best = { score: s.result.score, route }; return; }
    // Losing positive bids have the same outcome as passing. Overpaying cannot improve
    // any later auction: rivals do not inspect the player's past bid or wallet.
    const rivalBids = [0, oracleRivalBid(s, 1), oracleRivalBid(s, 2)];
    const max = Math.max(...rivalBids), priority = [s.turn % 3, (s.turn + 1) % 3, (s.turn + 2) % 3];
    const losesTie = priority.slice(0, priority.indexOf(0)).some(id => rivalBids[id] === max);
    const win = Math.max(1, max + Number(losesTie));
    for (const amount of [0, win]) if (amount <= s.wallets[0]) visit(E.nextLot(settle(s, amount)).state, [...route, amount]);
  }
  visit(E.createGame(seed), []); return best;
}

test('independent: published budget, goal, six distinct lots and finite wallets', () => {
  const s = E.createGame(); assert.equal(E.BUDGET, 24); assert.equal(E.GOAL, 16);
  assert.deepEqual(s.wallets, [24, 18, 18]); assert.equal(s.lots.length, 6);
  assert.equal(new Set(s.lots.map(x => x.id)).size, 6);
  for (const shape of ['fan', 'spiral', 'moon']) for (const color of ['coral', 'blue']) assert.equal(s.lots.filter(x => x.shape === shape && x.color === color).length, 1);
});
test('independent: every subset and both commissions match a pairwise score oracle', () => {
  const lots = E.createGame().lots;
  for (let mask = 0; mask < 64; mask++) for (const color of ['blue', 'coral']) {
    const items = lots.filter((_, i) => mask & (1 << i));
    assert.equal(E.score(items, color).total, oracleScore(items, color), `${mask}/${color}`);
  }
});
test('independent: default success route is legal, charges 22 and reaches 21', () => {
  const route = [3, 5, 0, 7, 7, 0]; const { state } = play(E.DEFAULT_SEED, s => route[s.turn]);
  assert.equal(state.result.won, true); assert.equal(state.result.score, 21); assert.equal(state.wallets[0], 2);
  assert.deepEqual(state.collections[0].map(x => x.id), ['moon-coral', 'spiral-coral', 'spiral-blue', 'moon-blue']);
});
test('independent: pass and all-in are genuine distinct failed runs; retry is clean', () => {
  for (const policy of [() => 0, s => s.wallets[0]]) {
    const { state } = play(E.DEFAULT_SEED, policy); assert.equal(state.result.won, false);
    assert.equal(state.result.score, policy(state) === 0 && state.wallets[0] === 24 ? 0 : 2);
    const retry = E.createGame(state.seed); assert.equal(retry.phase, 'bid'); assert.equal(retry.turn, 0);
    assert.equal(retry.history.length, 0); assert.deepEqual(retry.wallets, [24, 18, 18]); assert.equal(retry.selected, 0);
  }
});
test('independent: all-zero bids leave lot unclaimed; zero is not a free tie win', () => {
  const s = E.createGame(); s.wallets = [0, 0, 0]; const out = E.submit(s).state;
  assert.equal(out.history[0].winner, null); assert.equal(out.history[0].price, 0);
  assert.deepEqual(out.collections, [[], [], []]); assert.deepEqual(out.wallets, [0, 0, 0]);
});
test('independent: rotating public tie priority determines every tied winner', () => {
  for (let turn = 0; turn < 6; turn++) {
    const s = E.createGame(); s.turn = turn; s.rivals.forEach(r => { r.favorite = 'no-match'; }); s.moods[turn] = [0, 0];
    const out = settle(s, 2); assert.equal(out.history[0].winner, turn % 3); assert.equal(out.history[0].price, 2);
    assert.deepEqual(out.history[0].priority, [turn % 3, (turn + 1) % 3, (turn + 2) % 3]);
  }
});
test('independent: bids reject nonintegers, negative, overbudget and wrong types without mutation', () => {
  const s = deepFreeze(E.createGame()); const before = clone(s);
  for (const amount of [-1, 25, 1.5, NaN, Infinity, undefined, null, '3', true]) { const out = E.selectBid(s, amount); assert.equal(out.ok, false); assert.strictEqual(out.state, s); }
  assert.deepEqual(s, before);
});
test('independent: accepted select/submit/next do not mutate frozen inputs', () => {
  const s = deepFreeze(E.createGame()), selection = E.selectBid(s, 3).state;
  assert.equal(s.selected, 0); assert.equal(selection.selected, 3);
  const out = E.submit(deepFreeze(selection)).state; assert.equal(selection.phase, 'bid'); assert.equal(out.phase, 'reveal');
  const next = E.nextLot(deepFreeze(out)).state; assert.equal(out.turn, 0); assert.equal(next.turn, 1); assert.equal(next.selected, 0);
});
test('independent: stale revision, repeated reveal and next actions cannot consume two lots', () => {
  let s = E.createGame(); const stale = s.revision; s = E.selectBid(s, 3).state;
  assert.equal(E.submit(s, stale).ok, false); assert.equal(s.history.length, 0);
  s = E.submit(s, s.revision).state; const revealed = clone(s);
  for (let n = 0; n < 40; n++) { assert.equal(E.submit(s).ok, false); assert.equal(E.selectBid(s, 4).ok, false); }
  assert.deepEqual(s, revealed); const rev = s.revision;
  assert.equal(E.nextLot(s, rev - 1).ok, false); s = E.nextLot(s, rev).state;
  for (let n = 0; n < 40; n++) assert.equal(E.nextLot(s).ok, false);
  assert.equal(s.turn, 1); assert.equal(s.history.length, 1);
});
test('independent: final reveal is gated; result is computed once and terminal input is rejected', () => {
  let s = E.createGame(); for (let n = 0; n < 6; n++) { s = settle(s, 0); assert.equal(s.phase, 'reveal'); assert.equal(s.result, null); if (n < 5) s = E.nextLot(s).state; }
  s = E.nextLot(s).state; assert.equal(s.phase, 'ended'); assert.equal(s.result.score, 0);
  const before = clone(s); for (let n = 0; n < 40; n++) { assert.equal(E.nextLot(s).ok, false); assert.equal(E.submit(s).ok, false); assert.equal(E.selectBid(s, 0).ok, false); } assert.deepEqual(s, before);
});
test('independent: seeded replay, seed normalization, and preference secrecy from player amount', () => {
  for (let i = 0; i < 100; i++) assert.deepEqual(E.createGame(`replay-${i}`), E.createGame(`replay-${i}`));
  assert.deepEqual(E.createGame('  shiosai-1027 '), E.createGame()); assert.equal(E.createGame('x'.repeat(100)).seed.length, 48);
  const a = E.createGame(), b = E.selectBid(a, 24).state;
  for (const id of [1, 2]) assert.equal(E.rivalBid(a, id), E.rivalBid(b, id));
});
test('independent: 768 resolved auctions obey winner, affordability, accounting and item conservation oracles', () => {
  for (let i = 0; i < 128; i++) {
    let s = E.createGame(`account-${i}`); const paid = [0, 0, 0];
    for (let turn = 0; turn < 6; turn++) {
      const bid = (i * 11 + turn * 7) % (s.wallets[0] + 1), before = clone(s);
      const expectedBids = [bid, oracleRivalBid(s, 1), oracleRivalBid(s, 2)];
      const order = [turn % 3, (turn + 1) % 3, (turn + 2) % 3], max = Math.max(...expectedBids);
      const winner = max ? order.find(id => expectedBids[id] === max) : null;
      s = settle(s, bid); const h = s.history.at(-1); assert.deepEqual(h.bids, expectedBids); assert.equal(h.winner, winner);
      if (winner !== null) paid[winner] += max;
      for (let id = 0; id < 3; id++) { assert.ok(Number.isInteger(s.wallets[id]) && s.wallets[id] >= 0); assert.equal(s.wallets[id] + paid[id], id ? 18 : 24); assert.ok(h.bids[id] <= before.wallets[id]); }
      assert.equal(s.collections.flat().length, s.history.filter(x => x.winner !== null).length);
      assert.equal(new Set(s.collections.flat().map(x => x.id)).size, s.collections.flat().length);
      assert.equal(h.scoreGain, oracleScore(s.collections[0], s.commission) - oracleScore(before.collections[0], s.commission));
      s = E.nextLot(s).state;
    }
    assert.equal(s.result.score, oracleScore(s.collections[0], s.commission));
  }
});
test('independent: original unreachable seeds and a 500-market matrix now have a legal success path', () => {
  for (let i = 0; i < 500; i++) { const seed = `independent-${i}`, best = optimal(seed); assert.ok(best.score >= 16, `${seed}: best ${best.score}`); const r = play(seed, s => best.route[s.turn]); assert.equal(r.state.result.score, best.score); }
});
test('independent: simple pass, all-in, equal split and fixed bids do not win every tested market', () => {
  const policies = [() => 0, s => s.wallets[0], s => Math.floor(s.wallets[0] / (6 - s.turn)), ...[4, 5, 6, 7, 8].map(n => () => n)];
  for (const policy of policies) { let wins = 0; for (let i = 0; i < 100; i++) wins += Number(play(`independent-${i}`, policy).state.result.won); assert.ok(wins < 100, `policy unexpectedly wins ${wins}/100`); }
});

// Minimal DOM substitute with element identity and detached-element checks.
// Native focus behavior, layout, range keyboard behavior and browser accessibility
// are intentionally outside this harness; those need real-browser evidence.
function controller(search = '') {
  const vm = require('node:vm'); let now = 0, state, focusId, generation = 0, html = '';
  const nodes = new Map(), handlers = {}, scrolls = [];
  const announcement = { id: 'announcement', textContent: '' };
  function node(id, tag, attributes, contents) {
    const attrs = Object.fromEntries([...attributes.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]]));
    const n = { id, tagName: tag.toUpperCase(), generation, disabled: /\bdisabled(?:\s|$)/.test(attributes), open: /\bopen(?:\s|$)/.test(attributes), value: attrs.value || '', textContent: contents || '', dataset: {}, focus() { focusId = id; }, scrollIntoView(options) { scrolls.push({ id, ...options }); }, setAttribute(k, v) { attrs[k] = v; }, getAttribute(k) { return attrs[k]; }, closest(selector) { return this.tagName === 'BUTTON' && this.dataset.action ? this : null; } };
    for (const [k, v] of Object.entries(attrs)) if (k.startsWith('data-')) n.dataset[k.slice(5)] = v;
    return n;
  }
  const root = { id: 'game', addEventListener(type, fn) { handlers[type] = fn; }, contains(n) { return nodes.get(n.id) === n; }, querySelectorAll() { return [...nodes.values()].filter(n => n.tagName === 'BUTTON' && n.dataset.action); } };
  Object.defineProperty(root, 'innerHTML', { get() { return html; }, set(value) { html = value; generation++; nodes.clear(); for (const m of value.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>([^<]*)/g)) nodes.set(m[3], node(m[3], m[1], m[2], m[4])); } });
  const tracked = { ...E, createGame(...args) { state = E.createGame(...args); return state; } };
  for (const key of ['selectBid', 'submit', 'nextLot']) tracked[key] = (...args) => { const out = E[key](...args); if (out.ok) state = out.state; return out; };
  const document = { getElementById(id) { return id === 'game' ? root : id === 'announcement' ? announcement : nodes.get(id) || null; }, addEventListener(type, fn) { handlers[`document:${type}`] = fn; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../games/shell-auction/app.js'), 'utf8'), { window: { ShellAuction: tracked, location: { search } }, document, performance: { now: () => now }, URLSearchParams, Date: { now: () => 1793063700000 } });
  const api = {
    get state() { return state; }, get html() { return html; }, get focus() { return focusId; }, get announcement() { return announcement.textContent; }, scrolls,
    get(id) { return nodes.get(id); }, tick(ms = 500) { now += ms; },
    clickNode(n, detail = 1) { assert.ok(n, 'rendered button exists'); handlers.click({ target: n, detail }); },
    click(id, detail) { this.clickNode(this.get(id), detail); },
    amount(amount) { const target = this.get('bid-range'); target.value = String(amount); handlers.input({ target }); },
    inputDetached(target) { handlers.input({ target }); },
    key(key, repeat) { const event = { key, repeat, preventDefault() { this.prevented = true; } }; handlers['document:keydown'](event); return event; },
    route(bids) { for (const amount of bids) { this.amount(amount); this.tick(); this.click(amount ? 'submit' : 'pass'); this.tick(); this.click('next'); } }
  }; return api;
}

test('independent DOM stub: initial rules disclose scoring, finite rivals, no rank contest and all six lots', () => {
  const a = controller(); assert.match(a.html, /24枚を6品に配分/); assert.match(a.html, /相手の点数との順位戦ではありません/); assert.match(a.html, /最高額の1人だけが、自分の入札額を払います/);
  for (const lot of a.state.lots) assert.ok(a.html.includes(`${E.COLORS[lot.color]}の${E.SHAPES[lot.shape]}`));
  assert.equal(a.get('submit').disabled, true); assert.equal(a.get('less').disabled, true); assert.equal(a.get('pass').disabled, false);
});
test('independent DOM stub: plus/minus/range are noncommitting and bounds lock controls', () => {
  const a = controller(); a.click('more'); assert.equal(a.state.selected, 1); assert.equal(a.get('submit').disabled, false); assert.equal(a.state.history.length, 0);
  a.amount(24); assert.equal(a.get('more').disabled, true); a.click('more'); assert.equal(a.state.selected, 24);
  a.click('less'); assert.equal(a.state.selected, 23); a.amount(0); assert.equal(a.get('less').disabled, true); assert.equal(a.get('submit').disabled, true); assert.equal(a.scrolls.length, 0);
});
test('independent DOM stub: success, final retry, real failure, retry and success repeat through production controller', () => {
  const a = controller(); a.route([3, 5, 0, 7, 7, 0]); assert.equal(a.state.result.score, 21); assert.match(a.html, /展示が完成！/); assert.equal(a.focus, 'end-title');
  a.tick(); a.click('retry'); assert.equal(a.state.history.length, 0); assert.equal(a.state.wallets[0], 24);
  a.route([0, 0, 0, 0, 0, 0]); assert.equal(a.state.result.score, 0); assert.match(a.html, /目標まであと16点/);
  a.tick(); a.click('retry'); a.route([3, 5, 0, 7, 7, 0]); assert.equal(a.state.result.won, true); assert.equal(a.state.history.length, 6);
});
test('independent DOM stub: confirmation freezes play and cancel preserves the exact bid and state', () => {
  const a = controller(); a.amount(7); const before = clone(a.state); a.click('ask-retry'); assert.equal(a.focus, 'cancel-retry'); assert.equal(a.get('submit').disabled, true); assert.equal(a.get('pass').disabled, true);
  a.amount(3); a.click('pass'); assert.deepEqual(a.state, before); a.click('cancel-retry'); assert.equal(a.focus, 'ask-retry'); assert.deepEqual(a.state, before); assert.equal(a.get('submit').disabled, false);
  a.click('ask-retry'); a.tick(); a.click('retry'); assert.equal(a.state.selected, 0); assert.equal(a.state.wallets[0], 24); assert.equal(a.focus, 'lot-title');
});
test('independent DOM stub: fast repeated action, detail=2 and detached pre-retry controls cannot alter state', () => {
  const a = controller(); a.amount(3); const oldSubmit = a.get('submit'), oldRange = a.get('bid-range'); a.click('submit');
  for (let i = 0; i < 10; i++) a.click('next'); assert.equal(a.state.turn, 0); assert.equal(a.state.history.length, 1);
  a.tick(399); a.click('next'); assert.equal(a.state.turn, 0); a.tick(1); a.click('next', 2); assert.equal(a.state.turn, 0); a.click('next'); assert.equal(a.state.turn, 1);
  a.click('ask-retry'); a.tick(); a.click('retry'); a.tick(); a.clickNode(oldSubmit); oldRange.value = '20'; a.inputDetached(oldRange); assert.equal(a.state.selected, 0); assert.equal(a.state.history.length, 0);
});
test('independent DOM stub: opened schedule and history persist across state transitions and expose past bids', () => {
  const a = controller(); a.get('schedule').open = true; a.get('records').open = true; a.amount(3); a.click('submit');
  assert.equal(a.get('schedule').open, true); assert.equal(a.get('records').open, true); assert.match(a.html, /札：あなた 3 ／ リオ 3 ／ ナギ 3/); assert.match(a.html, /あなたが3枚で落札/);
  a.tick(); a.click('next'); assert.equal(a.get('schedule').open, true); assert.equal(a.get('records').open, true);
});
test('independent DOM stub: end/new-market changes seed while same-market retry preserves scenario', () => {
  const a = controller(); const start = clone(a.state); a.route([0, 0, 0, 0, 0, 0]); a.tick(); a.click('retry'); assert.deepEqual(a.state, start);
  a.route([0, 0, 0, 0, 0, 0]); a.tick(); a.click('new-market'); assert.notEqual(a.state.seed, start.seed); assert.equal(a.state.history.length, 0); assert.equal(a.state.wallets[0], 24);
});
test('independent DOM stub: native key activation stays enabled, held activation is suppressed', () => {
  const a = controller(); assert.equal(a.key('Enter', false).prevented, undefined); assert.equal(a.key(' ', false).prevented, undefined);
  assert.equal(a.key('Enter', true).prevented, true); assert.equal(a.key(' ', true).prevented, true); assert.equal(a.key('ArrowRight', true).prevented, undefined);
});
test('independent DOM stub: state changes focus/scroll to results, never while choosing a number', () => {
  const a = controller(); a.amount(3); assert.equal(a.scrolls.length, 0); a.click('submit'); assert.equal(a.focus, 'reveal-title'); assert.equal(a.scrolls.at(-1).id, 'reveal-title');
  a.tick(); a.click('next'); assert.equal(a.focus, 'lot-title'); assert.equal(a.scrolls.at(-1).id, 'lot-title');
});
test('independent DOM stub: URL seed is decoded for engine but escaped before HTML interpolation', () => {
  const a = controller('?seed=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'); assert.equal(a.state.seed, '<img src=x onerror=alert(1)>');
  assert.ok(a.html.includes('&lt;img src=x onerror=alert(1)&gt;')); assert.ok(!a.html.includes('<img src=x onerror=alert(1)>'));
});
test('independent DOM stub regression: reveal restart confirmation visibly disables next, cancel restores it', () => {
  const a = controller(); a.click('pass'); a.click('ask-retry'); const before = clone(a.state);
  assert.equal(a.get('next').disabled, true); a.tick(); a.click('next'); assert.deepEqual(a.state, before);
  a.click('cancel-retry'); assert.equal(a.get('next').disabled, false); a.click('next'); assert.equal(a.state.turn, 1);
});
