/* Pocket Forest rules. Pure JavaScript; works as a browser global and in Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PocketForestEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SIZE = 5;
  const MAX_TURNS = 12;
  const TYPES = Object.freeze(['forest', 'flower', 'pond']);
  const TYPE_NAMES = Object.freeze({ forest: '森', flower: '花', pond: '池' });
  const PAIRS = Object.freeze([['forest', 'flower'], ['forest', 'pond'], ['flower', 'pond']]);
  const HABITATS = Object.freeze(['fox', 'frog', 'bee', 'owl']);
  const POINTS = Object.freeze({ fox: 3, frog: 2, bee: 1, owl: 3 });
  const LABELS = Object.freeze({ fox: 'キツネのねぐら', frog: 'カエルの浅瀬', bee: 'ハチの花畑', owl: 'フクロウの巣' });

  function hashSeed(seed) {
    const s = String(seed ?? 'pocket-forest');
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeOffers(seed) {
    const random = mulberry32(hashSeed(seed));
    const pairs = [];
    // Four copies of every pairing: each terrain appears eight times in the 12 offers.
    for (let i = 0; i < 4; i += 1) for (const pair of PAIRS) pairs.push(pair.slice());
    for (let i = pairs.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
      if (random() < 0.5) pairs[i].reverse();
    }
    return pairs;
  }
  function createGame(seed = 'MORI-01') {
    const normalizedSeed = String(seed || 'MORI-01').trim().slice(0, 24) || 'MORI-01';
    return {
      seed: normalizedSeed, board: Array(SIZE * SIZE).fill(null), offers: makeOffers(normalizedSeed),
      turn: 0, nextId: 0, score: 0, history: [], lastEvent: null, ended: false, won: false
    };
  }
  function neighbors(index) {
    const r = Math.floor(index / SIZE), c = index % SIZE, out = [];
    if (r > 0) out.push(index - SIZE);
    if (r < SIZE - 1) out.push(index + SIZE);
    if (c > 0) out.push(index - 1);
    if (c < SIZE - 1) out.push(index + 1);
    return out;
  }
  function groupsOf(board, type) {
    const seen = new Set(), groups = [];
    for (let i = 0; i < board.length; i += 1) {
      if (!board[i] || board[i].type !== type || seen.has(i)) continue;
      const group = [], stack = [i]; seen.add(i);
      while (stack.length) {
        const at = stack.pop(); group.push(at);
        for (const n of neighbors(at)) if (!seen.has(n) && board[n] && board[n].type === type) { seen.add(n); stack.push(n); }
      }
      group.sort((a, b) => a - b); groups.push(group);
    }
    return groups;
  }
  function adjacentToType(board, cells, type) {
    const set = new Set(cells);
    for (const cell of cells) for (const n of neighbors(cell)) {
      if (!set.has(n) && board[n] && board[n].type === type) return true;
    }
    return false;
  }
  function activeHabitats(state) {
    const board = state.board;
    const fox = groupsOf(board, 'forest').filter(g => g.length >= 3).length;
    const owl = groupsOf(board, 'forest').filter(g => g.length >= 4 && adjacentToType(board, g, 'pond')).length;
    const frog = groupsOf(board, 'pond').filter(g => g.length >= 1 && g.length <= 2 && adjacentToType(board, g, 'flower')).length;
    let bee = 0;
    for (let i = 0; i < board.length; i += 1) {
      if (!board[i] || board[i].type !== 'flower') continue;
      const around = neighbors(i).map(n => board[n] && board[n].type);
      if (around.includes('forest') && around.includes('pond')) bee += 1;
    }
    return { fox, frog, bee, owl };
  }
  function scoreForBoard(board) {
    const fakeState = { board };
    const habitats = activeHabitats(fakeState);
    return HABITATS.reduce((total, kind) => total + habitats[kind] * POINTS[kind], 0);
  }
  function habitatEvents(before, after) {
    const events = [];
    for (const kind of HABITATS) {
      const delta = after[kind] - before[kind];
      if (delta !== 0) events.push({ kind, label: LABELS[kind], count: delta, points: delta * POINTS[kind], cells: [] });
    }
    return events;
  }
  function outcome(state) {
    const habitats = activeHabitats(state);
    const species = HABITATS.filter(kind => habitats[kind] > 0).length;
    const score = scoreForBoard(state.board);
    return { species, score, habitats, won: score >= 10 && species >= 3 };
  }
  function fail(state, reason) { return { ok: false, reason, state }; }
  function place(state, type, index) {
    if (!state || state.ended) return fail(state, 'ended');
    if (!TYPES.includes(type)) return fail(state, 'type');
    if (!Number.isInteger(index) || index < 0 || index >= SIZE * SIZE) return fail(state, 'cell');
    if (state.turn >= MAX_TURNS) return fail(state, 'ended');
    if (!state.offers[state.turn].includes(type)) return fail(state, 'offer');
    if (state.board[index]) return fail(state, 'occupied');

    const beforeHabitats = activeHabitats(state);
    const beforeScore = scoreForBoard(state.board);
    const next = { ...state, board: state.board.slice(), history: state.history.concat([state]), lastEvent: null };
    next.board[index] = { type, id: state.nextId };
    next.nextId += 1;
    next.turn += 1;
    const afterHabitats = activeHabitats(next);
    next.score = scoreForBoard(next.board);
    const events = habitatEvents(beforeHabitats, afterHabitats);
    const delta = next.score - beforeScore;
    next.lastEvent = { placed: type, index, events, gained: delta };
    if (next.turn === MAX_TURNS) {
      const result = outcome(next);
      next.ended = true;
      next.won = result.won;
    }
    return { ok: true, state: next, events, gained: delta, beforeHabitats, habitats: afterHabitats };
  }
  function preview(state, type, index) {
    const result = place(state, type, index);
    if (!result.ok) return { ok: false, reason: result.reason, gained: 0, events: [], habitats: activeHabitats(state) };
    return { ok: true, gained: result.gained, events: result.events, beforeHabitats: result.beforeHabitats, habitats: result.habitats, species: HABITATS.filter(k => result.habitats[k] > 0).length };
  }
  function undo(state) {
    if (!state || !state.history || state.history.length === 0) return fail(state, 'no-undo');
    const prior = state.history[state.history.length - 1];
    return { ok: true, state: { ...prior, history: prior.history.slice() } };
  }
  function retry(seed) { return createGame(seed); }
  function getStatus(state) {
    const habitats = activeHabitats(state);
    const species = HABITATS.filter(kind => habitats[kind] > 0).length;
    return { turn: state.turn, remaining: Math.max(0, MAX_TURNS - state.turn), score: scoreForBoard(state.board), habitats, species, ended: state.ended, won: state.won, goal: { score: 10, species: 3 } };
  }
  return Object.freeze({
    SIZE, MAX_TURNS, TYPES, TYPE_NAMES, HABITATS, POINTS, LABELS,
    createGame, retry, place, preview, undo, groupsOf, activeHabitats, scoreForBoard,
    getStatus, outcome, hashSeed
  });
});
