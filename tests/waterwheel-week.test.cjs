'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../games/waterwheel-week/engine.js');
const R = require('./waterwheel-routes.cjs');
function play(route) {
  let state = E.createGame();
  for (const id of route) {
    const selected = E.select(state, id); assert.equal(selected.ok, true, `Day ${state.day}: ${id} available`);
    const committed = E.commit(selected.state, selected.state.revision); assert.equal(committed.ok, true);
    state = committed.state;
    if (state.phase === 'report') state = E.nextDay(state, state.revision).state;
  }
  return state;
}
function freeze(value) { Object.values(value).forEach(v => { if (v && typeof v === 'object') freeze(v); }); return Object.freeze(value); }
test('fresh game has 7 days, 21 bread target, visible starting farm and fixed inventory', () => {
  assert.equal(E.DAYS, 7); assert.equal(E.GOAL, 21);
  const s = E.createGame(); assert.deepEqual(s.resources, { coin: 6, wood: 6, grain: 0, flour: 0, bread: 0 });
  assert.deepEqual(s.buildings, { field: 1, mill: 0, oven: 0, woodcutter: 0 }); assert.equal(s.day, 1); assert.equal(s.phase, 'choose');
});
test('fresh games do not share nested mutable state', () => { const a = E.createGame(), b = E.createGame(); a.resources.wood = 99; a.buildings.mill = 9; a.history.push({}); assert.equal(b.resources.wood, 6); assert.equal(b.buildings.mill, 0); assert.equal(b.history.length, 0); });
test('seven deterministic offers always include a no-cost recovery card', () => { const s = E.createGame(); for (let day = 1; day <= 7; day++) { s.day = day; assert.equal(E.offers(s).length, 3); assert.ok(E.offers(s).some(c => c.id === 'supplies')); } });
test('selecting a card does not spend resources, add a workshop or advance the day', () => { const s = E.createGame(); const result = E.select(freeze(s), 'mill'); assert.equal(result.ok, true); assert.equal(result.state.day, 1); assert.deepEqual(result.state.resources, s.resources); assert.deepEqual(result.state.buildings, s.buildings); assert.equal(s.selected, null); assert.equal(result.state.selected, 'mill'); });
test('repeated selection is idempotent', () => { const s = E.select(E.createGame(), 'mill').state; assert.equal(E.select(s, 'mill').state, s); });
test('selection changes invalidate stale commit revisions', () => { const a = E.select(E.createGame(), 'mill').state; const b = E.select(a, 'supplies').state; assert.equal(E.commit(b, a.revision).ok, false); assert.equal(b.day, 1); });
test('preview is non-mutating and deterministic', () => { const s = freeze(E.createGame()); const first = E.preview(s, 'mill'); assert.deepEqual(first, E.preview(s, 'mill')); assert.equal(first.ok, true); assert.equal(s.resources.coin, 6); assert.equal(s.buildings.mill, 0); assert.equal(s.history.length, 0); });
test('preview includes construction, same-day production and daily income', () => { const p = E.preview(E.createGame(), 'mill'); assert.deepEqual(p.resources, { coin: 5, wood: 4, grain: 0, flour: 2, bread: 0 }); assert.equal(p.buildings.mill, 1); assert.equal(p.production.milled, 2); });
test('actual committed stock exactly matches the chosen forecast', () => { let s = E.createGame(); for (const id of R.success27) { const forecast = E.preview(s, id); s = E.select(s, id).state; s = E.commit(s, s.revision).state; assert.deepEqual(s.resources, forecast.resources); assert.deepEqual(s.buildings, forecast.buildings); if (s.phase === 'report') s = E.nextDay(s, s.revision).state; } });
test('workshops persist and produce on following days without repurchasing', () => { let s = E.select(E.createGame(), 'mill').state; s = E.commit(s, s.revision).state; s = E.nextDay(s, s.revision).state; s = E.select(s, 'supplies').state; s = E.commit(s, s.revision).state; assert.equal(s.buildings.mill, 1); assert.equal(s.resources.flour, 4); assert.equal(s.lastReport.production.milled, 2); });
test('processing order uses freshly harvested grain and freshly milled flour', () => { const s = E.createGame(); s.buildings.mill = 1; s.buildings.oven = 1; const p = E.produce(s); assert.equal(p.production.baked, 3); assert.equal(p.state.resources.grain, 0); assert.equal(p.state.resources.flour, 0); });
test('mill can process only one grain when that is all that exists', () => { const s = E.createGame(); s.buildings.field = 0; s.buildings.mill = 1; s.resources.grain = 1; const p = E.produce(s); assert.equal(p.production.milled, 1); assert.equal(p.state.resources.flour, 1); assert.equal(p.production.idleMill, 1); });
test('oven cannot bake half a batch and preserves one flour', () => { const s = E.createGame(); s.buildings.field = 0; s.buildings.oven = 1; s.resources.flour = 1; const p = E.produce(s); assert.equal(p.production.baked, 0); assert.equal(p.state.resources.flour, 1); assert.equal(p.production.idleOven, 1); });
test('surplus carries over and more capacity consumes old inventory', () => { const s = E.createGame(); s.buildings.mill = 2; s.buildings.oven = 2; s.resources.grain = 3; s.resources.flour = 1; const p = E.produce(s); assert.equal(p.production.milled, 4); assert.equal(p.production.baked, 6); assert.equal(p.state.resources.grain, 1); assert.equal(p.state.resources.flour, 1); });
test('woodcutter is a lasting producer, supplies are one-off income', () => { const wood = E.preview(E.createGame(), 'woodcutter'); assert.equal(wood.resources.wood, 7); assert.equal(wood.buildings.woodcutter, 1); assert.equal(wood.production.wood, 2); const supplies = E.preview(E.createGame(), 'supplies'); assert.equal(supplies.resources.wood, 10); assert.equal(supplies.resources.coin, 9); assert.equal(supplies.buildings.woodcutter, 0); });
test('affordability reports exact resource shortages and blocks purchase', () => { const s = E.createGame(); s.resources.coin = 0; s.resources.wood = 1; const r = E.select(s, 'mill'); assert.equal(r.ok, false); assert.match(r.reason, /コインが3不足/); assert.match(r.reason, /木材が1不足/); assert.equal(r.state, s); });
test('unoffered and unknown cards cannot be selected or previewed', () => { const s = E.createGame(); assert.equal(E.select(s, 'oven').ok, false); assert.equal(E.select(s, 'fake').ok, false); assert.equal(E.preview(s, 'fake').ok, false); });
test('commit requires a selection and matching revision', () => { const s = E.createGame(); assert.equal(E.commit(s, s.revision).ok, false); const selected = E.select(s, 'mill').state; assert.equal(E.commit(selected).ok, false); assert.equal(E.commit(selected, -1).ok, false); });
test('same-day commit cannot be repeated or applied after a report', () => { const s = E.select(E.createGame(), 'mill').state; const after = E.commit(s, s.revision).state; const second = E.commit(after, after.revision); assert.equal(second.ok, false); assert.equal(second.state, after); assert.equal(after.history.length, 1); assert.equal(after.resources.coin, 5); });
test('report is a separate gate; next day needs correct phase and revision', () => { const s = E.createGame(); assert.equal(E.nextDay(s, s.revision).ok, false); const a = E.select(s, 'mill').state; const b = E.commit(a, a.revision).state; assert.equal(E.select(b, 'supplies').ok, false); assert.equal(E.nextDay(b, a.revision).ok, false); const c = E.nextDay(b, b.revision).state; assert.equal(c.day, 2); assert.equal(E.nextDay(c, c.revision).ok, false); });
test('21-bread attainable success route finishes exactly on day seven', () => { const s = play(R.success21); assert.equal(s.phase, 'ended'); assert.equal(s.day, 7); assert.equal(s.resources.bread, 21); assert.equal(s.result.won, true); assert.equal(s.history.length, 7); });
test('full chain expansion yields 27 bread, not just the minimum', () => { const s = play(R.success27); assert.equal(s.resources.bread, 27); assert.equal(s.result.won, true); assert.equal(s.buildings.field, 2); assert.equal(s.buildings.mill, 2); assert.equal(s.buildings.oven, 2); });
test('one basic chain without growth yields 18 and genuine failure', () => { const s = play(R.failure18); assert.equal(s.resources.bread, 18); assert.equal(s.result.won, false); assert.equal(s.result.shortfall, 3); });
test('taking only supplies yields zero and genuine failure', () => { const s = play(R.failure0); assert.equal(s.resources.bread, 0); assert.equal(s.result.won, false); assert.equal(s.result.shortfall, 21); });
test('ended games reject any further action, preserving final inventory', () => { for (const route of [R.success21, R.failure0]) { const s = play(route); assert.deepEqual(E.offers(s), []); assert.equal(E.select(s, 'supplies').ok, false); assert.equal(E.preview(s, 'supplies').ok, false); assert.equal(E.commit(s, s.revision).ok, false); assert.equal(E.nextDay(s, s.revision).ok, false); } });
test('retry resets all state, preserves no stock, and invalidates old revisions', () => { const s = play(R.success27); const fresh = E.retry(s); assert.deepEqual({ ...fresh, revision: 0 }, E.createGame()); assert.ok(fresh.revision > s.revision); assert.equal(E.commit(E.select(fresh, 'mill').state, s.revision).ok, false); assert.equal(play(R.success21).result.won, true); });
test('history is an immutable snapshot, not a live reference to stock', () => { const s = play(R.success27); const last = s.history[6].after.bread; s.resources.bread = 100; assert.equal(s.history[6].after.bread, last); });
test('all affordable routes preserve nonnegative integer resources, terminate in 7 turns, and have honest forecasts', () => {
  let leaves = 0, successes = 0, maximum = 0;
  function visit(s) {
    if (s.phase === 'ended') { leaves++; if (s.result.won) successes++; maximum = Math.max(maximum, s.resources.bread); assert.equal(s.day, 7); assert.equal(s.history.length, 7); return; }
    for (const card of E.offers(s)) {
      if (!E.affordability(s, card.id).ok) continue;
      const p = E.preview(s, card.id); let next = E.select(s, card.id).state; next = E.commit(next, next.revision).state;
      assert.deepEqual(next.resources, p.resources);
      for (const amount of Object.values(next.resources)) assert.ok(Number.isInteger(amount) && amount >= 0);
      if (next.phase === 'report') next = E.nextDay(next, next.revision).state;
      visit(next);
    }
  }
  visit(E.createGame()); assert.equal(leaves, 1864); assert.equal(successes, 139); assert.equal(maximum, 27);
});
