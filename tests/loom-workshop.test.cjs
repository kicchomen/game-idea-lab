const test = require('node:test');
const assert = require('node:assert/strict');
const { initial, start, weave, patterns, sample } = require('../games/loom-workshop/engine.js');

const winningOrder = [2, 0, 3, 1, 0, 3, 2, 0];
const play = (order) => order.reduce(weave, start());

test('ready, invalid choices and retry preserve the turn contract', () => {
  const ready = initial();
  assert.equal(ready.phase, 'ready');
  assert.equal(weave(ready, 2), ready);
  const active = start();
  assert.equal(weave(active, -1), active);
  assert.equal(weave(active, '2'), active);
  assert.deepEqual(start(), active);
  assert.notEqual(start().cloth, active.cloth);
});

test('a matching choice permanently adds one row without changing the earlier state', () => {
  const previous = play([2, 0]);
  const stage = weave(previous, 3);
  assert.deepEqual(stage.cloth, [patterns[2].cells, patterns[0].cells, patterns[3].cells]);
  assert.equal(stage.phase, 'playing');
  assert.equal(previous.cloth.length, 2);
});

test('a wrong anchor is a terminal sample mismatch and the chosen row stays visible', () => {
  const state = play([0]);
  assert.equal(state.phase, 'lost');
  assert.equal(state.reason, 'sample');
  assert.deepEqual(state.columns, [2]);
  assert.equal(state.cloth.length, 1);
  assert.equal(weave(state, 2), state);
});

test('the fourth matching color in a column loses even when the sample anchors match', () => {
  const state = play([2, 0, 0, 3, 0]);
  assert.equal(state.phase, 'lost');
  assert.equal(state.reason, 'float');
  assert.ok(state.columns.length > 0);
  assert.equal(state.cloth.length, 5);
});

test('both valid prefixes can finish and victory occurs on the eighth row only', () => {
  assert.equal(play(winningOrder.slice(0, -1)).phase, 'playing');
  const won = play(winningOrder);
  assert.equal(won.phase, 'won');
  assert.equal(won.cloth.length, sample.length);
  assert.equal(weave(won, 0), won);
  assert.equal(play([2, 0, 0, 1, 0, 3, 2, 0]).phase, 'won');
});

test('the float meter rises at three rows and clears when both colors switch', () => {
  const state = play([2, 0, 0]);
  assert.equal(state.maxFloat, 3);
  assert.deepEqual(state.streaks, [3, 2, 2, 3, 3, 2]);
  assert.equal(weave(state, 1).maxFloat, 1);
});
