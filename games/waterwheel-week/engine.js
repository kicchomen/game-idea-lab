(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WaterwheelEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAYS = 7;
  const GOAL = 21;
  const RESOURCE_KEYS = ['coin', 'wood', 'grain', 'flour', 'bread'];
  const RESOURCE_NAMES = { coin: 'コイン', wood: '木材', grain: '麦', flour: '粉', bread: 'パン' };
  const WORKSHOPS = ['field', 'mill', 'oven', 'woodcutter'];
  const CARDS = {
    field: { id: 'field', name: '麦畑', icon: '🌾', kind: 'workshop', tag: '原料を増やす', cost: { coin: 2, wood: 2 }, description: '毎夕、麦を2つ収穫する。', effect: '麦 +2 / 日' },
    mill: { id: 'mill', name: '水車小屋', icon: '⚙', kind: 'workshop', tag: '粉に変える', cost: { coin: 3, wood: 2 }, description: '毎夕、麦2つまでを同じ数の粉にする。', effect: '麦 2 → 粉 2 / 日' },
    oven: { id: 'oven', name: 'パン窯', icon: '🥖', kind: 'workshop', tag: 'パンを焼く', cost: { coin: 4, wood: 2 }, description: '毎夕、粉2つでパン3つを焼く。', effect: '粉 2 → パン 3 / 日' },
    woodcutter: { id: 'woodcutter', name: 'きこり小屋', icon: '🪵', kind: 'workshop', tag: '先の資材を育てる', cost: { coin: 1, wood: 1 }, description: '毎夕、木材を2つ集める。', effect: '木材 +2 / 日' },
    supplies: { id: 'supplies', name: '資材の手伝い', icon: '🧺', kind: 'oneoff', tag: '今すぐ受け取る', cost: {}, gain: { coin: 1, wood: 4 }, description: 'コイン1枚と木材4つを受け取る。工房は増えない。', effect: '今だけ コイン +1・木材 +4' }
  };
  const OFFERS = [
    ['mill', 'woodcutter', 'supplies'],
    ['oven', 'mill', 'supplies'],
    ['field', 'woodcutter', 'supplies'],
    ['mill', 'oven', 'supplies'],
    ['oven', 'field', 'supplies'],
    ['mill', 'oven', 'supplies'],
    ['oven', 'field', 'supplies']
  ];
  Object.values(CARDS).forEach(card => { Object.freeze(card.cost); if (card.gain) Object.freeze(card.gain); Object.freeze(card); });
  Object.freeze(CARDS); OFFERS.forEach(Object.freeze); Object.freeze(OFFERS);
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function createGame() {
    return { day: 1, phase: 'choose', revision: 0, resources: { coin: 6, wood: 6, grain: 0, flour: 0, bread: 0 }, buildings: { field: 1, mill: 0, oven: 0, woodcutter: 0 }, selected: null, lastReport: null, history: [], result: null };
  }
  function offers(state) { return state.phase === 'ended' ? [] : OFFERS[state.day - 1].map(id => CARDS[id]); }
  function affordability(state, cardId) {
    const card = CARDS[cardId];
    if (!card) return { ok: false, reason: 'このカードはありません。' };
    const missing = Object.entries(card.cost).filter(([key, value]) => state.resources[key] < value).map(([key, value]) => `${RESOURCE_NAMES[key]}が${value - state.resources[key]}不足`);
    return { ok: missing.length === 0, reason: missing.join('、') };
  }
  function validateChoice(state, cardId) {
    if (state.phase !== 'choose') return { ok: false, reason: 'まず夕方の結果を確認してください。' };
    if (!OFFERS[state.day - 1].includes(cardId)) return { ok: false, reason: '今日は選べないカードです。' };
    return affordability(state, cardId);
  }
  function produce(state) {
    const s = clone(state);
    const before = { ...s.resources };
    const harvested = s.buildings.field * 2;
    const wood = s.buildings.woodcutter * 2;
    s.resources.grain += harvested;
    s.resources.wood += wood;
    const milled = Math.min(s.resources.grain, s.buildings.mill * 2);
    s.resources.grain -= milled;
    s.resources.flour += milled;
    const batches = Math.min(Math.floor(s.resources.flour / 2), s.buildings.oven);
    s.resources.flour -= batches * 2;
    s.resources.bread += batches * 3;
    s.resources.coin += 2;
    const idleMill = s.buildings.mill * 2 - milled;
    const idleOven = s.buildings.oven - batches;
    return { state: s, production: { harvested, wood, milled, baked: batches * 3, income: 2, idleMill, idleOven, delta: Object.fromEntries(RESOURCE_KEYS.map(key => [key, s.resources[key] - before[key]])) } };
  }
  function applyCard(state, cardId) {
    const s = clone(state);
    const card = CARDS[cardId];
    for (const [key, amount] of Object.entries(card.cost)) s.resources[key] -= amount;
    if (card.kind === 'workshop') s.buildings[cardId] += 1;
    else for (const [key, amount] of Object.entries(card.gain)) s.resources[key] += amount;
    return s;
  }
  function preview(state, cardId) {
    const check = validateChoice(state, cardId);
    if (!check.ok) return check;
    const applied = applyCard(state, cardId);
    const result = produce(applied);
    return { ok: true, resources: result.state.resources, buildings: result.state.buildings, production: result.production, cost: CARDS[cardId].cost, gain: CARDS[cardId].gain || {}, remainingDays: DAYS - state.day };
  }
  function select(state, cardId) {
    const check = validateChoice(state, cardId);
    if (!check.ok) return { ...check, state };
    if (state.selected === cardId) return { ok: true, state };
    const s = clone(state); s.selected = cardId; s.revision += 1;
    return { ok: true, state: s };
  }
  function commit(state, expectedRevision) {
    if (state.phase !== 'choose') return { ok: false, reason: 'この日はすでに確定しています。', state };
    if (expectedRevision !== state.revision) return { ok: false, reason: '画面が更新されました。もう一度選んでください。', state };
    if (!state.selected) return { ok: false, reason: 'まずカードを選んで、予測を確認してください。', state };
    const check = validateChoice(state, state.selected);
    if (!check.ok) return { ...check, state };
    const before = { ...state.resources };
    const result = produce(applyCard(state, state.selected));
    const s = result.state;
    s.lastReport = { day: state.day, cardId: state.selected, before, after: { ...s.resources }, production: result.production };
    s.history.push(clone(s.lastReport));
    s.revision += 1;
    s.selected = null;
    if (state.day === DAYS) {
      s.phase = 'ended';
      s.result = { won: s.resources.bread >= GOAL, bread: s.resources.bread, goal: GOAL, shortfall: Math.max(0, GOAL - s.resources.bread) };
    } else s.phase = 'report';
    return { ok: true, state: s };
  }
  function nextDay(state, expectedRevision) {
    if (state.phase !== 'report' || expectedRevision !== state.revision) return { ok: false, reason: 'この操作では日を進められません。', state };
    const s = clone(state); s.day += 1; s.phase = 'choose'; s.selected = null; s.revision += 1;
    return { ok: true, state: s };
  }
  function retry(state) { const s = createGame(); s.revision = state ? state.revision + 1 : 0; return s; }
  function capacity(state) {
    return { grain: state.buildings.field * 2, flour: state.buildings.mill * 2, bread: state.buildings.oven * 3 };
  }
  function hint(state) {
    if (state.phase === 'ended') return state.result.won ? '工房の連鎖が、町の食卓を支えました。' : '建てる順番を変えて、もう一度。予測で「材料不足」の設備を見つけよう。';
    if (!state.buildings.mill) return '麦はある。水車小屋を建てると、今日から粉にできる。';
    if (!state.buildings.oven) return '粉がたまってきた。パン窯を建てれば、今日から焼ける。';
    const cap = capacity(state);
    if (state.resources.wood < 2) return '木材が少ない。資材を補充する1日と、建設する1日の配分を考えよう。';
    if (cap.flour < cap.bread / 3 * 2) return '窯に対して粉づくりが少なめ。水車と畑の数を見比べよう。';
    if (cap.grain < cap.flour) return '水車に対して麦が少なめ。畑を増やすと流れが太くなる。';
    return '1基ずつの畑・水車・窯ならパンは1日3つ。21個には、どこかで増産が必要。';
  }
  return Object.freeze({ DAYS, GOAL, CARDS, OFFERS, RESOURCE_KEYS, RESOURCE_NAMES, WORKSHOPS, createGame, offers, affordability, produce, preview, select, commit, nextDay, retry, capacity, hint });
});
