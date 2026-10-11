const test = require('node:test'), assert = require('node:assert/strict');
const E = require('../games/fossil-museum/engine.js'), routes = require('./fossil-routes.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
function playRoute(site, override) {
  const state = E.create(site);
  for (const tool of ['brush', 'pick']) for (const index of routes[site][tool]) E.dig(state, index, override || tool);
  return state;
}
test('three deterministic sites have disjoint connected specimens and valid starts', () => {
  assert.equal(E.sites.length, 3);
  for (let id = 0; id < 3; id++) {
    const state = E.create(id), occupied = new Set();
    for (const spec of E.specimens(state)) {
      assert.ok(spec.cells.includes(spec.start));
      const visited = new Set([spec.start]), todo = [spec.start];
      while (todo.length) for (const next of E.neighbors(todo.shift())) if (spec.cells.includes(next) && !visited.has(next)) { visited.add(next); todo.push(next); }
      assert.equal(visited.size, spec.cells.length);
      for (const index of spec.cells) { assert.ok(index >= 0 && index < 36); assert.ok(!occupied.has(index)); occupied.add(index); }
      assert.equal(spec.complete, false);
    }
    for (const spec of E.specimens(state)) for (const index of spec.cells) for (const near of E.neighbors(index)) assert.ok(state.cells[near].fossil < 0 || state.cells[near].fossil === spec.id, 'specimens never touch orthogonally');
    assert.ok(E.sites[id].openSoil.every(i => !occupied.has(i)));
    assert.deepEqual(E.create(id), state);
  }
});
test('invalid site IDs safely default; fresh states share no mutable cell or history data', () => {
  for (const id of [-1, 3, '1', 0.5, NaN]) assert.equal(E.create(id).site, 0);
  const a = E.create(), b = E.create(); E.dig(a, 7, 'brush'); assert.equal(b.cells[7].open, false); assert.equal(b.history.length, 0);
});
test('neighbor geometry has no edge wrapping, with 4 and 8 modes', () => {
  assert.deepEqual(E.neighbors(0), [1, 6]); assert.deepEqual(E.neighbors(0, true), [1, 6, 7]);
  assert.equal(E.neighbors(14).length, 4); assert.equal(E.neighbors(14, true).length, 8);
  for (const index of [-1, 36, 0.5, NaN]) assert.deepEqual(E.neighbors(index), []);
});
test('brush opens one cell safely and spends two work', () => {
  const s = E.create(); assert.equal(E.dig(s, 7, 'brush'), true);
  assert.equal(s.cells[7].open, true); assert.equal(s.cells[7].chipped, false); assert.equal(s.chips, 0); assert.equal(s.remaining, 32); assert.equal(s.actions, 1);
});
test('pick spends one work, creates one visible chip only when it hits bone', () => {
  const s = E.create(); E.dig(s, 1, 'pick'); assert.equal(s.chips, 0); assert.equal(s.remaining, 33);
  E.dig(s, 7, 'pick'); assert.equal(s.chips, 1); assert.equal(s.remaining, 32); assert.equal(E.visible(s, 7).chipped, true);
});
test('repeated, invalid and unaffordable inputs leave all simulation state unchanged', () => {
  const s = E.create(); for (const [index, tool] of [[8, 'brush'], [-1, 'brush'], [36, 'pick'], [0.5, 'brush'], [7, 'spade'], [NaN, 'pick']]) { const before = copy(s); assert.equal(E.dig(s, index, tool), false); assert.deepEqual(s, before); }
  s.remaining = 1; const before = copy(s); assert.equal(E.dig(s, 7, 'brush'), false); assert.deepEqual(s, before); assert.equal(E.dig(s, 7, 'pick'), true);
});
test('covered view does not leak bones, clues, identifiers or continuation directions', () => {
  const s = E.create(); assert.deepEqual(E.visible(s, 7), { open: false }); assert.deepEqual(E.visible(s, 1), { open: false }); assert.deepEqual(E.connections(s, 7), []);
});
test('soil numbers count diagonal, visible, concealed and chipped bone equally', () => {
  const s = E.create(); assert.equal(E.clue(s, 1), 3);
  E.dig(s, 1, 'pick'); assert.equal(E.visible(s, 1).count, 3); E.dig(s, 7, 'pick'); assert.equal(E.visible(s, 1).count, 3);
  assert.equal(E.clue(s, 30), 0);
});
test('visible bone continuations are exact and edge-safe', () => {
  const s = E.create(); assert.deepEqual(E.connections(s, 8), ['n', 'e', 's', 'w']);
  assert.deepEqual(E.connections(s, 29), ['n', 's', 'w']);
});
test('all bones exposed is insufficient: extraction needs the full orthogonal soil border', () => {
  const s = E.create(); for (const index of E.sites[0].specimens[0].cells) E.dig(s, index, 'brush');
  let fish = E.specimens(s)[0]; assert.equal(fish.exposed, 5); assert.equal(fish.complete, false);
  assert.deepEqual(fish.border.sort((a,b)=>a-b), [1,3,6,10,13,15,20]);
  for (const index of fish.border.slice(0, -1)) E.dig(s, index, 'pick'); assert.equal(E.specimens(s)[0].complete, false);
  E.dig(s, fish.border.at(-1), 'pick'); assert.equal(E.specimens(s)[0].complete, true); assert.equal(s.status, 'playing');
});
test('diagonal-only soil is not required and repeated collection cannot duplicate rewards', () => {
  const s = playRoute(0); assert.equal(s.cells[4].open, false); assert.equal(s.status, 'won');
  const before = copy(s); assert.equal(E.dig(s, 4, 'pick'), false); assert.deepEqual(s, before);
});
test('fixed production-input routes win all three sites, third site at exact zero budget', () => {
  for (let id = 0; id < 3; id++) { const s = playRoute(id); assert.equal(s.status, 'won'); assert.equal(s.chips, 0); assert.equal(E.specimens(s).filter(p => p.complete).length, 2); assert.equal(s.remaining, [4,2,0][id]); assert.deepEqual(s, playRoute(id)); }
});
test('every site is solvable using only already-visible bone directions, no hidden map guesses', () => {
  for (let id = 0; id < 3; id++) {
    const s = E.create(id); let guard = 0;
    while (s.status === 'playing' && guard++ < 36) {
      let move = null;
      for (let i = 0; i < 36 && !move; i++) {
        const v = E.visible(s, i); if (!v.open || v.kind === 'soil') continue;
        for (const key of v.connections) {
          const d = E.directions.find(d => d.key === key), j = i + d.dy * 6 + d.dx;
          if (!E.visible(s, j).open) { move = [j, 'brush']; break; }
        }
      }
      if (!move) for (let i = 0; i < 36 && !move; i++) {
        const v = E.visible(s, i); if (!v.open || v.kind === 'soil') continue;
        for (const j of E.neighbors(i)) if (!E.visible(s, j).open) { move = [j, 'pick']; break; }
      }
      assert.ok(move, 'a visible clue supplies a legal next action'); assert.equal(E.dig(s, ...move), true);
    }
    assert.equal(s.status, 'won'); assert.equal(s.chips, 0);
  }
});
test('using only brush exhausts the budget on all sites before extraction', () => {
  for (let id = 0; id < 3; id++) { const s = playRoute(id, 'brush'); assert.equal(s.status, 'lost'); assert.equal(s.remaining, 0); assert.equal(s.chips, 0); }
});
test('using only pick on covered bones loses on exactly the third chip', () => {
  const s = E.create(); E.dig(s, 7, 'pick'); E.dig(s, 9, 'pick'); assert.equal(s.status, 'playing'); E.dig(s, 2, 'pick'); assert.equal(s.status, 'lost'); assert.equal(s.chips, 3); assert.equal(s.actions, 3);
});
test('one or two chips can still succeed, preserving the stated quality tradeoff', () => {
  for (const chips of [1, 2]) { const s = E.create(); let count = 0; for (const index of routes[0].brush) E.dig(s, index, count++ < chips ? 'pick' : 'brush'); for (const index of routes[0].pick) E.dig(s, index, 'pick'); assert.equal(s.status, 'won'); assert.equal(s.chips, chips); assert.equal(s.remaining, 4 + chips); }
});
test('zero work with an unfinished specimen fails even without chips', () => {
  const s = E.create(); for (let i = 0; i < 36 && s.status === 'playing'; i++) E.dig(s, i, 'brush'); assert.equal(s.status, 'lost'); assert.equal(s.chips, 0); assert.equal(s.remaining, 0);
});
test('undo restores whole state across excavation, loss, extraction and success', () => {
  for (const site of [0, 1, 2]) {
    const s = E.create(site), snapshots = [copy(s)];
    for (const tool of ['brush', 'pick']) for (const i of routes[site][tool]) { E.dig(s, i, tool); snapshots.push(copy(s)); }
    assert.equal(s.status, 'won');
    for (let i = snapshots.length - 2; i >= 0; i--) { assert.equal(E.undo(s), true); assert.deepEqual(s, snapshots[i]); }
    assert.equal(E.undo(s), false);
  }
  const s = E.create(); E.dig(s, 7, 'pick'); E.dig(s, 9, 'pick'); const before = copy(s); E.dig(s, 2, 'pick'); E.undo(s); assert.deepEqual(s, before);
});
test('terminal actions are frozen and retry is an independent clean state', () => {
  for (const s of [playRoute(0), playRoute(0, 'pick')]) { const before = copy(s); for (let i = 0; i < 36; i++) { E.dig(s, i, 'pick'); E.dig(s, i, 'brush'); } assert.deepEqual(s, before); }
  assert.equal(E.create().status, 'playing'); assert.equal(E.create().history.length, 0);
});
