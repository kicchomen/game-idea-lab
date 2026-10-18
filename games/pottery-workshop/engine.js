(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PotteryWorkshop = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MIN = 24, MAX = 88, TOLERANCE = 4;
  const START = [52, 52, 52, 52, 52, 52, 48];
  const KERNEL = [4, 2, 1];
  const ORDERS = [
    { name: '朝のお茶碗', customer: '喫茶店の店主', request: 'ふっくらした胴と、少しすぼまる口。手におさまる器を。', target: [60, 64, 68, 70, 70, 62, 48], budget: 14, color: '#96bfb1' },
    { name: '一輪の花びん', customer: '花屋のおばあさん', request: '細い首の下に、丸くふくらむ胴。花を一本飾りたい。', target: [39, 35, 43, 62, 74, 68, 50], budget: 18, color: '#c5afd1' },
    { name: 'ひらく菓子鉢', customer: '焼き菓子の職人', request: '上は大きく開き、下はきゅっと。お菓子が見える鉢を。', target: [80, 76, 68, 59, 50, 43, 38], budget: 16, color: '#d4b176' }
  ];
  function create(order = 0) {
    const id = Number.isInteger(order) && order >= 0 && order < ORDERS.length ? order : 0;
    return { order: id, profile: START.slice(), remaining: ORDERS[id].budget, used: 0, selected: 3, status: 'shaping', last: null };
  }
  function measure(state) {
    const target = ORDERS[state.order].target;
    const errors = state.profile.map((value, i) => Math.abs(value - target[i]));
    const matched = errors.filter(value => value <= TOLERANCE).length;
    return { errors, matched, ready: matched === target.length, meanError: errors.reduce((a, b) => a + b, 0) / target.length };
  }
  function select(state, index) {
    if (state.status !== 'shaping' || !Number.isInteger(index) || index < 0 || index > 6 || index === state.selected) return state;
    return { ...state, selected: index };
  }
  function stroke(state, index, direction) {
    if (state.status !== 'shaping' || state.remaining <= 0 || !Number.isInteger(index) || index < 0 || index > 6 || ![-1, 1].includes(direction)) return state;
    const profile = state.profile.map((value, i) => Math.max(MIN, Math.min(MAX, value + (KERNEL[Math.abs(i - index)] || 0) * direction)));
    if (profile.every((value, i) => value === state.profile[i])) return state;
    return { ...state, profile, remaining: state.remaining - 1, used: state.used + 1, selected: index, last: { index, direction } };
  }
  function fire(state) {
    if (state.status !== 'shaping') return state;
    return { ...state, status: measure(state).ready ? 'won' : 'lost' };
  }
  return { MIN, MAX, TOLERANCE, START, KERNEL, ORDERS, create, select, stroke, measure, fire };
});
