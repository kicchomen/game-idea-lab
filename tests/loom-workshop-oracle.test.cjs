const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../games/loom-workshop/engine.js');

// Enumerate the entire choice space using literal masks and transposed cloth columns.
const cards = ['010101', '101010', '001100', '110011'];
const anchors = [
  [2, '1', 3, '1'], [1, '1', 3, '1'], [1, '1', 2, '0'], [0, '1', 3, '0'],
  [2, '0', 3, '1'], [1, '1', 2, '0'], [0, '0', 4, '0'], [0, '0', 2, '0'],
];

function judge(order) {
  const columns = ['', '', '', '', '', ''];
  for (let row = 0; row < anchors.length; row++) {
    const drawn = cards[order[row]];
    const [a, aColor, b, bColor] = anchors[row];
    if (drawn[a] !== aColor || drawn[b] !== bColor) return ['lost', row + 1, 'sample'];
    for (const [col, tone] of [...drawn].entries()) columns[col] += tone;
    if (columns.some((strip) => /(?:0000|1111)$/.test(strip))) return ['lost', row + 1, 'float'];
  }
  return ['won', anchors.length, null];
}

test('all 65,536 button sequences agree with a transposed-cloth oracle', () => {
  const winning = [];
  const counts = { sample: 0, float: 0 };
  for (let number = 0; number < 4 ** anchors.length; number++) {
    const order = [...number.toString(4).padStart(anchors.length, '0')].map(Number);
    const result = order.reduce(engine.weave, engine.start());
    const [phase, rows, reason] = judge(order);
    assert.equal(result.phase, phase, order.join(''));
    assert.equal(result.cloth.length, rows, order.join(''));
    assert.equal(result.reason, reason, order.join(''));
    if (phase === 'won') winning.push(order.join(''));
    else counts[reason]++;
  }
  assert.deepEqual(winning, ['20010320', '20310320']);
  assert.equal(counts.float > 0, true);
  assert.equal(counts.sample + counts.float, 65534);
});

test('picking the first safe matching card can reach a future dead end', () => {
  const order = [2, 0, 0, 1, 0, 0, 0];
  const state = order.reduce(engine.weave, engine.start());
  assert.equal(state.phase, 'playing');
  assert.equal(engine.weave(state, 0).reason, 'float');
  for (const card of [1, 2, 3]) assert.equal(engine.weave(state, card).reason, 'sample');
});
