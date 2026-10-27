(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShellAuction = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DEFAULT_SEED = 'shiosai-1027';
  const GOAL = 16;
  const BUDGET = 24;
  const SHAPES = Object.freeze({ fan: '扇貝', spiral: '巻き貝', moon: '月貝' });
  const COLORS = Object.freeze({ coral: '桃', blue: '青' });
  const NAMES = Object.freeze(['あなた', 'リオ', 'ナギ']);
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function random(seed) {
    let n = 2166136261;
    for (let i = 0; i < seed.length; i++) n = Math.imul(n ^ seed.charCodeAt(i), 16777619);
    return function () { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function createGame(seed) {
    seed = typeof seed === 'string' && seed.trim() ? seed.trim().slice(0, 48) : DEFAULT_SEED;
    const rng = random(seed), shapes = Object.keys(SHAPES), colors = Object.keys(COLORS);
    const lots = shapes.flatMap(shape => colors.map(color => ({ id: `${shape}-${color}`, shape, color })));
    for (let i = lots.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [lots[i], lots[j]] = [lots[j], lots[i]]; }
    const commission = colors[Math.floor(rng() * colors.length)];
    const rivals = [
      { id: 1, favorite: colors[Math.floor(rng() * colors.length)], style: 'color' },
      { id: 2, favorite: shapes[Math.floor(rng() * shapes.length)], style: 'shape' }
    ];
    const moods = lots.map(() => [Math.floor(rng() * 3), Math.floor(rng() * 3)]);
    return { seed, lots, commission, rivals, moods, turn: 0, revision: 0, phase: 'bid', wallets: [BUDGET, 18, 18], collections: [[], [], []], selected: 0, history: [], result: null };
  }
  function score(collection, commission) {
    const shapes = Object.keys(SHAPES).map(shape => collection.filter(lot => lot.shape === shape).length);
    const colorCount = collection.filter(lot => lot.color === commission).length;
    const pairs = shapes.filter(count => count >= 2).length;
    const variety = shapes.every(count => count >= 1);
    const order = colorCount >= 2;
    return { base: collection.length * 2, pairs: pairs * 4, variety: variety ? 5 : 0, commission: order ? 5 : 0, total: collection.length * 2 + pairs * 4 + (variety ? 5 : 0) + (order ? 5 : 0), pairCount: pairs, shapeCount: shapes.filter(Boolean).length, colorCount, order };
  }
  function priority(state) { return [state.turn % 3, (state.turn + 1) % 3, (state.turn + 2) % 3]; }
  function rivalBid(state, id) {
    const rival = state.rivals[id - 1], lot = state.lots[state.turn], held = state.collections[id];
    if (!rival || !lot) return 0;
    const favorite = rival.style === 'color' ? lot.color === rival.favorite : lot.shape === rival.favorite;
    const pair = held.some(shell => shell.shape === lot.shape) ? 2 : 0;
    const value = 2 + (favorite ? (rival.style === 'color' ? 4 : 5) : 0) + pair + state.moods[state.turn][id - 1];
    return Math.min(state.wallets[id], value);
  }
  function validateBid(state, amount) {
    if (state.phase !== 'bid') return { ok: false, reason: '落札結果を確認してから次の品へ進んでください。' };
    if (!Number.isInteger(amount) || amount < 0 || amount > state.wallets[0]) return { ok: false, reason: '入札は手持ちの範囲の整数にしてください。' };
    return { ok: true, reason: '' };
  }
  function selectBid(state, amount) {
    const check = validateBid(state, amount);
    if (!check.ok) return { ...check, state };
    if (state.selected === amount) return { ok: true, state };
    const next = copy(state); next.selected = amount; next.revision++;
    return { ok: true, state: next };
  }
  function submit(state, revision) {
    if (revision !== undefined && revision !== state.revision) return { ok: false, state, reason: '古い札です。今の画面で選び直してください。' };
    const check = validateBid(state, state.selected);
    if (!check.ok) return { ...check, state };
    const next = copy(state), lot = next.lots[next.turn];
    const bids = [next.selected, rivalBid(next, 1), rivalBid(next, 2)];
    const order = priority(next), max = Math.max(...bids);
    const winner = max > 0 ? order.find(id => bids[id] === max) : null;
    const before = score(next.collections[0], next.commission).total;
    if (winner !== null) { next.wallets[winner] -= bids[winner]; next.collections[winner].push(lot); }
    next.history.push({ turn: next.turn, lot, bids, priority: order, winner, price: winner === null ? 0 : bids[winner], wallets: [...next.wallets], scoreGain: score(next.collections[0], next.commission).total - before });
    next.phase = 'reveal'; next.revision++;
    return { ok: true, state: next };
  }
  function nextLot(state, revision) {
    if (state.phase !== 'reveal' || (revision !== undefined && revision !== state.revision)) return { ok: false, state, reason: 'まだ札を開いていません。' };
    const next = copy(state); next.revision++;
    if (next.turn === next.lots.length - 1) {
      next.phase = 'ended'; const breakdown = score(next.collections[0], next.commission);
      next.result = { won: breakdown.total >= GOAL, score: breakdown.total, breakdown };
    } else { next.turn++; next.selected = 0; next.phase = 'bid'; }
    return { ok: true, state: next };
  }
  return Object.freeze({ DEFAULT_SEED, GOAL, BUDGET, SHAPES, COLORS, NAMES, createGame, score, priority, rivalBid, validateBid, selectBid, submit, nextLot });
});
