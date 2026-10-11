(function () {
  'use strict';
  const E = FossilMuseum, $ = id => document.getElementById(id);
  let state = E.create(), tool = 'brush', focus = 0;
  $('site').innerHTML = E.sites.map((site, i) => `<option value="${i}">${site.name}</option>`).join('');
  function boneArt(view) {
    const endpoints = { n: [25, -3], e: [53, 25], s: [25, 53], w: [-3, 25] };
    const stems = view.connections.map(direction => `<line class="stem" x1="25" y1="25" x2="${endpoints[direction][0]}" y2="${endpoints[direction][1]}"/>`).join('');
    const center = view.kind === 'shell' ? '<circle class="core" cx="25" cy="25" r="12"/><path class="detail" d="M18 28c-5-14 17-18 16-3-1 10-16 9-14 1 2-6 10-4 9 1-1 3-5 3-5 0"/>' : view.kind === 'fern' ? '<path class="core" d="M25 14q-16-4-13 5l13 7q-17 1-13 8l13-3 13 4q5-7-13-9l14-7q-1-8-14-4z"/>' : '<ellipse class="core" cx="25" cy="25" rx="10" ry="9"/><path class="stem" d="M20 20l-4-5m4 15-4 5m14-15 4-5m-4 15 4 5"/><path class="detail" d="M24 18v14"/>';
    const crack = view.chipped ? '<path class="crack" d="M18 7l8 10-7 7 11 7-3 12"/>' : '';
    return `<svg class="bone-art" viewBox="0 0 50 50" aria-hidden="true">${stems}${center}${crack}</svg>`;
  }
  function render() {
    const specs = E.specimens(state), found = specs.filter(s => s.complete).length, live = state.status === 'playing';
    $('site').value = String(state.site); $('site-note').textContent = E.sites[state.site].note;
    $('energy').textContent = String(state.remaining); $('energy').className = state.remaining <= 5 ? 'warning' : '';
    $('collected').textContent = `${found} / 2`; $('chips').textContent = `${state.chips} / 2`; $('chips').className = state.chips ? 'warning' : '';
    $('board').innerHTML = state.cells.map((cell, index) => {
      const view = E.visible(state, index), coord = `${'ABCDEF'[index % 6]}${Math.floor(index / 6) + 1}`;
      const description = !view.open ? 'まだ砂に覆われています' : view.kind === 'soil' ? `砂、周囲8マスの骨${view.count}` : `${view.name}${view.chipped ? '、欠けあり' : ''}、骨の続きは${view.connections.map(key => E.directions.find(d => d.key === key).name).join('・') || 'なし'}`;
      const cls = !view.open ? 'covered' : view.kind === 'soil' ? `open soil ${view.count === 0 ? 'zero' : ''}` : `open bone ${view.chipped ? 'chipped' : ''} ${specs[view.specimen].complete ? 'collected' : ''}`;
      const content = !view.open ? '' : view.kind === 'soil' ? `<span class="count" aria-hidden="true">${view.count}</span>` : boneArt(view);
      return `<button type="button" class="cell ${cls}${index === state.last ? ' last' : ''}" data-cell="${index}" tabindex="${index === focus ? '0' : '-1'}" aria-label="${coord}、${description}" aria-disabled="${!live || cell.open}" title="${coord} ${description}"><span class="coord" aria-hidden="true">${coord}</span>${content}</button>`;
    }).join('');
    for (const element of $('tools').querySelectorAll('[data-tool]')) {
      element.setAttribute('aria-pressed', String(element.dataset.tool === tool));
      element.disabled = !live || (element.dataset.tool === 'brush' && state.remaining < 2);
    }
    $('specimens').innerHTML = specs.map(spec => `<div class="specimen ${spec.complete ? 'saved' : ''}"><div class="specimen-title">${spec.complete ? '✓ ' : ''}${spec.name}</div><p>骨 ${spec.exposed} / ${spec.cells.length}　縁の砂 ${spec.cleared} / ${spec.border.length}</p><p>${spec.complete ? '取り出しました' : spec.exposed === spec.cells.length ? 'まわりの砂を掘ろう' : '骨の続きを探そう'}${spec.chips ? ` · 欠け${spec.chips}` : ''}</p><div class="progress"><span style="width:${100 * (spec.exposed + spec.cleared) / (spec.cells.length + spec.border.length)}%"></span></div></div>`).join('');
    $('message').textContent = state.message;
    $('undo').disabled = !state.history.length; $('result-undo').disabled = !state.history.length;
    $('result').hidden = live; $('result').className = `result ${state.status === 'lost' ? 'lost' : ''}`;
    if (!live) {
      $('result-title').textContent = state.status === 'won' ? '砂の下から、展示室へ' : '調査をやり直そう';
      $('result-mark').textContent = state.status === 'won' ? '★'.repeat(3 - state.chips) + '☆'.repeat(state.chips) : '↶';
      $('result-detail').textContent = state.status === 'won' ? `標本2つ / 欠け${state.chips}か所 / 残り作業力${state.remaining}。${state.chips === 0 ? 'すべてきれいなまま取り出せました！' : '欠けを減らす発掘にも挑戦できます。'}` : state.message;
    }
    $('next').hidden = state.status !== 'won'; $('next').textContent = state.site === E.sites.length - 1 ? '最初の地点へ' : '次の地点へ';
  }
  function focusCell() { const element = $('board').querySelector(`[data-cell="${focus}"]`); if (element) element.focus({ preventScroll: true }); }
  function reset(site) { state = E.create(site); tool = 'brush'; focus = 0; render(); }
  function selectTool(next) {
    if (state.status !== 'playing' || !['pick', 'brush'].includes(next) || (next === 'brush' && state.remaining < 2)) return;
    tool = next; render();
  }
  function dig(index) {
    if (state.status !== 'playing') return;
    focus = index;
    if (E.dig(state, index, tool)) {
      if (state.status === 'playing' && state.remaining === 1) tool = 'pick';
      render(); focusCell();
    }
  }
  function undo() { if (E.undo(state)) { render(); focusCell(); } }
  $('board').addEventListener('click', event => { const button = event.target.closest('[data-cell]'); if (button) dig(Number(button.dataset.cell)); });
  $('tools').addEventListener('click', event => { const button = event.target.closest('[data-tool]'); if (button) selectTool(button.dataset.tool); });
  $('site').addEventListener('change', event => reset(Number(event.target.value)));
  $('undo').addEventListener('click', undo); $('result-undo').addEventListener('click', undo);
  $('restart').addEventListener('click', () => reset(state.site)); $('retry').addEventListener('click', () => reset(state.site));
  $('next').addEventListener('click', () => { if (state.status === 'won') reset((state.site + 1) % E.sites.length); });
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
    if (event.repeat) {
      if (['Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) && event.target.closest && event.target.closest('[data-cell]')) event.preventDefault();
      return;
    }
    if (event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); return; }
    if (state.status !== 'playing') return;
    if (event.key === '1' || event.key === '2') { event.preventDefault(); const onBoard = event.target.closest && event.target.closest('[data-cell]'); if (onBoard) focus = Number(onBoard.dataset.cell); selectTool(event.key === '1' ? 'pick' : 'brush'); if (onBoard) focusCell(); return; }
    const cell = event.target.closest && event.target.closest('[data-cell]');
    if (!cell) return;
    const index = Number(cell.dataset.cell), x = index % 6, y = Math.floor(index / 6);
    const moves = { ArrowLeft: [Math.max(0, x - 1), y], ArrowRight: [Math.min(5, x + 1), y], ArrowUp: [x, Math.max(0, y - 1)], ArrowDown: [x, Math.min(5, y + 1)] };
    if (moves[event.key]) { event.preventDefault(); focus = moves[event.key][1] * 6 + moves[event.key][0]; render(); focusCell(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); dig(index); }
  });
  render();
})();
