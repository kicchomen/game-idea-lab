(function makeEngine() {
  'use strict';

  const patterns = Object.freeze([
    { name: '交互', cells: '010101' },
    { name: '逆交互', cells: '101010' },
    { name: '山', cells: '001100' },
    { name: '谷', cells: '110011' },
  ].map(Object.freeze));

  const sample = Object.freeze([
    '..11..',
    '.1.1..',
    '.10...',
    '1..0..',
    '..01..',
    '.10...',
    '0...0.',
    '0.0...',
  ]);

  const floatLimit = 4;

  function initial() {
    return {
      phase: 'ready',
      cloth: [],
      streaks: Array(6).fill(0),
      maxFloat: 0,
      reason: null,
      columns: [],
    };
  }

  function start() {
    return { ...initial(), phase: 'playing' };
  }

  function weave(state, choice) {
    if (state.phase !== 'playing' || !Number.isInteger(choice) || !patterns[choice]) return state;

    const cells = patterns[choice].cells;
    const previous = state.cloth.at(-1);
    const target = sample[state.cloth.length];
    const streaks = [...cells].map((cell, column) => previous?.[column] === cell
      ? state.streaks[column] + 1 : 1);
    const mismatch = [];
    const floats = [];
    for (let column = 0; column < cells.length; column += 1) {
      if (target[column] !== '.' && target[column] !== cells[column]) mismatch.push(column);
      if (streaks[column] >= floatLimit) floats.push(column);
    }

    const cloth = [...state.cloth, cells];
    const reason = mismatch.length ? 'sample' : floats.length ? 'float' : null;
    let phase = 'playing';
    if (reason) phase = 'lost';
    else if (cloth.length === sample.length) phase = 'won';

    return {
      phase,
      cloth,
      streaks,
      maxFloat: Math.max(...streaks),
      reason,
      columns: mismatch.length ? mismatch : floats,
    };
  }

  const engine = Object.freeze({ initial, start, weave, patterns, sample, floatLimit });
  if (typeof module === 'object' && module.exports) module.exports = engine;
  else window.LoomWorkshop = engine;
}());
