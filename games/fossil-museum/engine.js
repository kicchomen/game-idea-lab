(function (root) {
  'use strict';
  const SIZE = 6;
  const directions = [{ dx: 0, dy: -1, name: '上', key: 'n' }, { dx: 1, dy: 0, name: '右', key: 'e' }, { dx: 0, dy: 1, name: '下', key: 's' }, { dx: -1, dy: 0, name: '左', key: 'w' }];
  const sites = [
    { name: '01 はじまりの砂丘', note: '白い骨の続きから。まわりの砂も取り除こう', budget: 34, specimens: [
      { name: '小さな魚', kind: 'fish', cells: [7, 8, 9, 2, 14], start: 8 },
      { name: '巻き貝', kind: 'shell', cells: [22, 23, 29, 35, 34, 28], start: 29 }
    ], openSoil: [0, 5, 30] },
    { name: '02 かつての川岸', note: '分かれた形を追おう。寄り道は作業力を使う', budget: 32, specimens: [
      { name: '川の魚', kind: 'fish', cells: [18, 19, 20, 13, 25], start: 18 },
      { name: 'シダの葉', kind: 'fern', cells: [3, 9, 15, 10, 11, 16], start: 3 }
    ], openSoil: [0, 5, 35] },
    { name: '03 夕暮れの地層', note: '余力は少なめ。骨とその縁を見分けよう', budget: 32, specimens: [
      { name: '古い巻き貝', kind: 'shell', cells: [0, 1, 7, 13, 12, 6], start: 0 },
      { name: '大きなシダ', kind: 'fern', cells: [16, 22, 28, 34, 21, 29], start: 34 }
    ], openSoil: [5, 30, 35] }
  ];
  const clone = value => JSON.parse(JSON.stringify(value));
  function neighbors(index, diagonal = false) {
    if (!Number.isInteger(index) || index < 0 || index >= SIZE * SIZE) return [];
    const x = index % SIZE, y = Math.floor(index / SIZE), result = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || (!diagonal && Math.abs(dx) + Math.abs(dy) !== 1)) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) result.push(ny * SIZE + nx);
    }
    return result;
  }
  function create(site = 0) {
    if (!Number.isInteger(site) || site < 0 || site >= sites.length) site = 0;
    const config = sites[site];
    const state = { site, status: 'playing', remaining: config.budget, chips: 0, actions: 0, last: -1, message: '白い骨の続きはブラシで。骨のまわりの砂も掘ると、標本を取り出せます。', cells: Array.from({ length: 36 }, () => ({ open: false, fossil: -1, chipped: false })), history: [] };
    config.specimens.forEach((specimen, id) => specimen.cells.forEach(index => { state.cells[index].fossil = id; }));
    [...config.openSoil, ...config.specimens.map(specimen => specimen.start)].forEach(index => { state.cells[index].open = true; });
    return state;
  }
  function clue(state, index) { return neighbors(index, true).filter(i => state.cells[i].fossil >= 0).length; }
  function connections(state, index) {
    const cell = state.cells[index];
    if (!cell || !cell.open || cell.fossil < 0) return [];
    return directions.filter(d => {
      const x = index % SIZE + d.dx, y = Math.floor(index / SIZE) + d.dy;
      return x >= 0 && x < SIZE && y >= 0 && y < SIZE && state.cells[y * SIZE + x].fossil === cell.fossil;
    }).map(d => d.key);
  }
  function specimens(state) {
    return sites[state.site].specimens.map((specimen, id) => {
      const border = [...new Set(specimen.cells.flatMap(index => neighbors(index)).filter(index => state.cells[index].fossil < 0))];
      const exposed = specimen.cells.filter(index => state.cells[index].open).length;
      const cleared = border.filter(index => state.cells[index].open).length;
      const chips = specimen.cells.filter(index => state.cells[index].chipped).length;
      return { ...specimen, id, border, exposed, cleared, chips, complete: exposed === specimen.cells.length && cleared === border.length };
    });
  }
  // Only information exposed by the current plot, never a hidden cell's contents.
  function visible(state, index) {
    const cell = state.cells[index];
    if (!cell) return null;
    if (!cell.open) return { open: false };
    if (cell.fossil < 0) return { open: true, kind: 'soil', count: clue(state, index) };
    const specimen = sites[state.site].specimens[cell.fossil];
    return { open: true, kind: specimen.kind, specimen: cell.fossil, name: specimen.name, chipped: cell.chipped, connections: connections(state, index) };
  }
  function dig(state, index, tool) {
    if (state.status !== 'playing' || !Number.isInteger(index) || index < 0 || index >= 36 || !['pick', 'brush'].includes(tool) || state.cells[index].open) return false;
    const cost = tool === 'brush' ? 2 : 1;
    if (state.remaining < cost) return false;
    const snapshot = clone({ ...state, history: undefined });
    state.history.push(snapshot);
    const before = specimens(state).filter(s => s.complete).length;
    const cell = state.cells[index];
    cell.open = true; state.remaining -= cost; state.actions++; state.last = index;
    if (cell.fossil >= 0 && tool === 'pick') {
      cell.chipped = true; state.chips++;
      state.message = 'カチッ…骨が欠けました。小づるはしは砂に、骨の続きにはブラシを。';
    } else if (cell.fossil >= 0) {
      state.message = '骨がきれいに見えました。白い線が端まで伸びる方向に、続きがあります。';
    } else {
      const count = clue(state, index);
      state.message = `砂を取り除きました。「${count}」は周囲8マスにある骨の数です。`;
    }
    const found = specimens(state).filter(s => s.complete).length;
    if (state.chips > 2) {
      state.status = 'lost'; state.message = '欠けが3か所になりました。標本を守れず、今日の調査はここまで。';
    } else if (found === sites[state.site].specimens.length) {
      state.status = 'won'; state.message = state.chips === 0 ? '欠けのない2つの標本を取り出しました。小さな博物館へ届けよう。' : '2つの標本を取り出しました。欠けた部分は修復して展示します。';
    } else if (state.remaining === 0) {
      state.status = 'lost'; state.message = '作業力を使い切りました。骨はブラシ、まわりの砂は小づるはしで。';
    } else if (found > before) {
      state.message = '標本を1つ取り出しました！ 残りの骨と、そのまわりの砂を探そう。';
    }
    return true;
  }
  function undo(state) {
    if (!state.history.length) return false;
    const snapshot = state.history.pop(), history = state.history;
    Object.assign(state, clone(snapshot), { history });
    return true;
  }
  const api = { SIZE, sites, directions, create, neighbors, clue, connections, specimens, visible, dig, undo };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FossilMuseum = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
