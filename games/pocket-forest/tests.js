'use strict';
const assert = require('node:assert/strict');
const E = require('./engine.js');

function boardWith(entries, seed = 'rules') {
  const s = E.createGame(seed);
  for (const [i, type] of entries) s.board[i] = { type, id: i };
  s.score = E.scoreForBoard(s.board);
  return s;
}
function runRoute(seed, route) {
  let state = E.createGame(seed);
  for (const [type, index] of route) {
    const result = E.place(state, type, index);
    assert.equal(result.ok, true, `route move ${state.turn + 1} (${type}@${index}) must be legal; offered=${state.offers[state.turn]}`);
    state = result.state;
  }
  return state;
}

// Seeded and fair supplies.
const a = E.createGame('same-seed'), b = E.retry('same-seed');
assert.deepEqual(a.offers, b.offers, 'retry regenerates the exact same supply');
assert.notDeepEqual(E.createGame('same-seed').offers, E.createGame('other-seed').offers, 'different seeds usually vary their supply');
for (const seed of ['same-seed', 'MORI-01', 'seed-7']) {
  const offers = E.createGame(seed).offers;
  assert.equal(offers.length, E.MAX_TURNS);
  for (const pair of offers) { assert.equal(pair.length, 2); assert.notEqual(pair[0], pair[1]); }
  for (const type of E.TYPES) assert.equal(offers.flat().filter(t => t === type).length, 8);
}

// Invalid input is rejected without replacing or mutating the current state.
let game = E.createGame('rules');
for (const [type, cell, reason] of [['stone', 0, 'type'], ['forest', -1, 'cell'], ['forest', 25, 'cell'], [E.TYPES.find(t => !game.offers[0].includes(t)), 4, 'offer']]) {
  const bad = E.place(game, type, cell);
  assert.equal(bad.ok, false); assert.equal(bad.reason, reason); assert.equal(bad.state, game);
}
const firstType = game.offers[0][0];
const preview = E.preview(game, firstType, 12);
const placed = E.place(game, firstType, 12);
assert.equal(placed.ok, true); assert.equal(placed.state.turn, 1); assert.equal(placed.state.board[12].type, firstType);
assert.equal(preview.gained, placed.gained); assert.deepEqual(preview.events, placed.events);
assert.equal(E.place(placed.state, placed.state.offers[1][0], 12).reason, 'occupied');

// Each current-board habitat rule and score.
let fox = boardWith([[0, 'forest'], [1, 'forest']], 'MORI-01'); fox.turn = 4;
let foxResult = E.place(fox, 'forest', 2);
assert.deepEqual(foxResult.events.map(e => e.kind), ['fox']); assert.equal(foxResult.gained, 3);
assert.equal(E.place(foxResult.state, 'forest', 3).gained, 0, 'adding to the same qualifying group keeps its one den score');
let frog = boardWith([[6, 'pond'], [1, 'flower']], 'MORI-01');
assert.equal(E.getStatus(frog).score, 2); assert.equal(E.getStatus(frog).species, 1);
let bee = boardWith([[8, 'forest'], [6, 'pond'], [11, 'pond'], [16, 'pond']], 'MORI-01');
let beeResult = E.place(bee, 'flower', 7);
assert.deepEqual(beeResult.events.map(e => e.kind), ['bee']); assert.equal(beeResult.gained, 1);
let owl = boardWith([[0, 'forest'], [1, 'forest'], [5, 'forest'], [6, 'pond']]);
assert.equal(E.getStatus(owl).score, 3, 'a three-tree forest is a fox den but not an owl nest');
let owlResult = E.place(owl, 'forest', 2);
assert(owlResult.events.some(e => e.kind === 'owl')); assert.equal(owlResult.gained, 3);
let oversizedPond = boardWith([[5, 'pond'], [6, 'pond'], [7, 'pond'], [0, 'flower']]);
assert.equal(E.getStatus(oversizedPond).habitats.frog, 0, 'three connected ponds cannot host a frog');

// Score and residents are current, not a permanent discovery ledger.
let growingPond = boardWith([[6, 'pond'], [1, 'flower']]);
growingPond.turn = 1; // the next offer also includes a pond for this authored state
const twoPonds = E.place(growingPond, 'pond', 11);
assert.equal(twoPonds.gained, 0); assert.equal(twoPonds.state.score, 2);
const disappears = E.preview(twoPonds.state, 'pond', 16);
assert.equal(disappears.gained, -2); assert.equal(disappears.beforeHabitats.frog, 1); assert.equal(disappears.habitats.frog, 0);
assert.equal(disappears.species, 0);
const threePonds = E.place(twoPonds.state, 'pond', 16);
assert.equal(threePonds.state.score, 0); assert.equal(threePonds.gained, -2);
let mergingForest = boardWith([[0, 'forest'], [1, 'forest'], [2, 'forest'], [10, 'forest'], [11, 'forest'], [12, 'forest']]);
assert.equal(E.getStatus(mergingForest).score, 6);
const mergePreview = E.preview(mergingForest, 'forest', 6);
assert.equal(mergePreview.gained, -3); assert.equal(mergePreview.beforeHabitats.fox, 2); assert.equal(mergePreview.habitats.fox, 1);
assert.equal(E.place(mergingForest, 'forest', 6).state.score, 3);

// Undo/replay restores board, current score and the supply cursor exactly.
const beforeUndo = placed.state;
const second = E.place(beforeUndo, beforeUndo.offers[1][0], 0);
const undone = E.undo(second.state);
assert.equal(undone.ok, true);
assert.deepEqual({ board:undone.state.board, turn:undone.state.turn, score:undone.state.score }, { board:beforeUndo.board, turn:beforeUndo.turn, score:beforeUndo.score });
assert.deepEqual(E.place(undone.state, undone.state.offers[1][0], 0).state.board, second.state.board);
assert.equal(E.undo(E.createGame()).reason, 'no-undo');
assert.equal(E.undo(threePonds.state).state.score, 2, 'undo restores a creature and its current points');

// Explicit winning and losing input routes with the same default supply.
const winningRoute = [
  ['pond',7], ['forest',0], ['flower',6], ['flower',8],
  ['forest',1], ['forest',2], ['forest',3], ['forest',24],
  ['flower',22], ['flower',20], ['pond',18], ['forest',16]
];
const winning = runRoute('MORI-01', winningRoute);
assert.equal(winning.ended, true); assert.equal(winning.won, true);
assert.equal(E.getStatus(winning).score, 10); assert.equal(E.getStatus(winning).species, 4);
const losingRoute = [];
const isolated = [0,2,4,6,8,10,12,14,16,18,20,22];
let losingSupply = E.createGame('MORI-01');
for (let turn=0; turn<E.MAX_TURNS; turn += 1) losingRoute.push([losingSupply.offers[turn][0], isolated[turn]]);
const losing = runRoute('MORI-01', losingRoute);
assert.equal(losing.ended, true); assert.equal(losing.won, false); assert.equal(E.getStatus(losing).score, 0); assert.equal(E.getStatus(losing).species, 0);
assert.equal(E.place(losing, losing.offers[0][0], 23).reason, 'ended');
assert.equal(E.undo(winning).state.ended, false, 'undo from a finished board returns to a playable turn');
assert.deepEqual(E.retry(winning.seed).offers, winning.offers);

console.log('PASS: deterministic/fair offers, legal & invalid inputs, four habitat rules, live score loss, undo/replay, winning/losing routes, end freeze');
console.log('WIN route:', winningRoute.map(([t,i],n)=>`${n+1}:${t}@${i}`).join(' | '));
console.log('LOSS route:', losingRoute.map(([t,i])=>`${t}@${i}`).join(' | '));
