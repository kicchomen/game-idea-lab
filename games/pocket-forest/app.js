(() => {
  'use strict';
  const Engine = window.PocketForestEngine;
  const GLYPHS = { forest: '♣', flower: '✿', pond: '≈' };
  const NAMES = { forest: '森', flower: '花', pond: '池' };
  const SPECIES = [
    { key: 'fox', icon: '狐', name: 'キツネ', label: 'ねぐら' },
    { key: 'frog', icon: '蛙', name: 'カエル', label: '浅瀬' },
    { key: 'bee', icon: '蜂', name: 'ハチ', label: '花畑' },
    { key: 'owl', icon: '梟', name: 'フクロウ', label: '巣' }
  ];
  const $ = id => document.getElementById(id);
  let state = Engine.createGame('MORI-01');
  let selectedType = state.offers[0][0];
  let selectedCell = 12;
  let justUndone = false;

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function rememberFocus() {
    const target = document.activeElement && document.activeElement.dataset.focusTarget;
    return target || '';
  }
  function restoreFocus(target) {
    if (!target) return;
    const node = document.querySelector(`[data-focus-target="${CSS.escape(target)}"]`);
    if (node) node.focus({ preventScroll: true });
  }
  function paintSelectedCell() {
    const board = $('board');
    const cells = board.querySelectorAll('.cell');
    cells.forEach((button, i) => {
      const tile = state.board[i];
      const selected = i === selectedCell;
      const ghost = selected && !tile && !state.ended && !!selectedType;
      button.classList.toggle('selected', selected);
      button.classList.toggle('preview', ghost);
      button.classList.toggle('ghost', ghost);
      button.tabIndex = selected ? 0 : -1;
      button.setAttribute('aria-selected', String(selected));
      const row = Math.floor(i / 5) + 1, col = i % 5 + 1;
      if (tile) {
        button.setAttribute('aria-label', `${row}行${col}列 ${NAMES[tile.type]}`);
      } else if (ghost) {
        const forecast = Engine.preview(state, selectedType, i);
        button.setAttribute('aria-label', `${row}行${col}列 空き地。${NAMES[selectedType]}を置くと${forecast.gained > 0 ? `プラス${forecast.gained}点` : forecast.gained < 0 ? `マイナス${Math.abs(forecast.gained)}点` : '点数変化なし'}`);
        button.innerHTML = `<span class="tile-glyph" aria-hidden="true">${GLYPHS[selectedType]}</span><span class="tile-name">${NAMES[selectedType]}?</span>`;
      } else {
        button.setAttribute('aria-label', `${row}行${col}列 空き地`);
        button.innerHTML = '<span class="empty-mark" aria-hidden="true">＋</span>';
      }
    });
    $('place-button').disabled = state.ended || !selectedType || !state.board[selectedCell];
    // An empty selected cell is a valid placement target; the button is enabled after selection.
    if (!state.ended && selectedType && !state.board[selectedCell]) $('place-button').disabled = false;
    updateForecast();
  }
  function selectCell(index) {
    if (index < 0 || index >= Engine.SIZE * Engine.SIZE) return;
    selectedCell = index;
    paintSelectedCell();
  }
  function renderBoard() {
    const board = $('board');
    board.innerHTML = '';
    for (let i = 0; i < Engine.SIZE * Engine.SIZE; i += 1) {
      const tile = state.board[i];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `cell${tile ? ` occupied ${tile.type}` : ''}${i === selectedCell ? ' selected' : ''}`;
      button.setAttribute('role', 'gridcell');
      button.setAttribute('aria-selected', String(i === selectedCell));
      button.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Enter');
      button.tabIndex = i === selectedCell ? 0 : -1;
      button.dataset.focusTarget = `cell:${i}`;
      const row = Math.floor(i / Engine.SIZE) + 1, col = (i % Engine.SIZE) + 1;
      if (tile) {
        button.setAttribute('aria-label', `${row}行${col}列 ${NAMES[tile.type]}`);
        button.innerHTML = `<span class="tile-glyph" aria-hidden="true">${GLYPHS[tile.type]}</span><span class="tile-name">${NAMES[tile.type]}</span>`;
      } else {
        button.setAttribute('aria-label', `${row}行${col}列 空き地`);
        button.innerHTML = '<span class="empty-mark" aria-hidden="true">＋</span>';
      }
      button.addEventListener('focus', () => { if (selectedCell !== i) selectCell(i); });
      button.addEventListener('click', () => selectCell(i));
      board.appendChild(button);
    }
    paintSelectedCell();
  }
  function renderChoices() {
    const wrap = $('tile-options');
    wrap.innerHTML = '';
    const offers = state.offers[Math.min(state.turn, Engine.MAX_TURNS - 1)] || [];
    offers.forEach((type, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tile-option';
      button.setAttribute('aria-pressed', String(type === selectedType && !state.ended));
      button.setAttribute('aria-label', `候補${idx + 1}: ${NAMES[type]}${type === selectedType ? '、選択中' : ''}`);
      button.dataset.focusTarget = `tile:${type}`;
      button.disabled = state.ended;
      button.innerHTML = `<span class="option-glyph ${type}" aria-hidden="true">${GLYPHS[type]}</span><span class="option-name">${NAMES[type]}<small>${type === 'forest' ? '木陰をつくる' : type === 'flower' ? '花を咲かせる' : '水辺をつくる'}</small></span><span class="option-key"><kbd>${idx + 1}</kbd></span>`;
      button.addEventListener('click', () => { selectedType = type; justUndone = false; renderAll(); });
      wrap.appendChild(button);
    });
  }
  function renderCreatures() {
    const wrap = $('creature-row');
    wrap.innerHTML = '';
    const current = Engine.activeHabitats(state);
    for (const species of SPECIES) {
      const count = current[species.key];
      const chip = document.createElement('span');
      chip.className = `creature-chip${count ? ' active' : ''}`;
      chip.setAttribute('aria-label', `${species.name} ${count ? `${count}か所がいま活動中` : 'いまはいない'}`);
      chip.innerHTML = `<span aria-hidden="true">${species.icon}</span><span>${species.name}</span><span class="count">${count}</span>`;
      wrap.appendChild(chip);
    }
  }
  function currentForecast() {
    if (state.ended) return null;
    if (!selectedType) return null;
    return Engine.preview(state, selectedType, selectedCell);
  }
  function updateForecast() {
    const box = $('forecast');
    const preview = currentForecast();
    if (!preview) {
      box.classList.remove('good', 'bad');
      $('place-button').disabled = true;
      box.innerHTML = state.ended
        ? '<span class="forecast-icon" aria-hidden="true">✿</span><div><strong>12手の庭が完成</strong><p>同じタネで、別の配置を試してみよう。</p></div>'
        : '<span class="forecast-icon" aria-hidden="true">◌</span><div><strong>配置予告</strong><p>地形とマスを選ぶと、増える生きものと点数がここに出ます。</p></div>';
      $('preview-ribbon').textContent = state.ended ? 'この庭は完成。もう一度なら同じタネで。' : '地形を選んで、空き地を選択';
      return;
    }
    const tile = state.board[selectedCell];
    if (tile) {
      box.classList.remove('good', 'bad');
      $('place-button').disabled = true;
      box.innerHTML = `<span class="forecast-icon" aria-hidden="true">⊘</span><div><strong>ここは使用中</strong><p>別の空き地を選ぶか、最後の1手を戻せます。</p></div>`;
      $('preview-ribbon').textContent = `選択中 ${Math.floor(selectedCell / 5) + 1}行${selectedCell % 5 + 1}列 · 使用中`;
      return;
    }
    const names = preview.events.map(event => {
      const disappears = preview.beforeHabitats[event.kind] > 0 && preview.habitats[event.kind] === 0;
      if (event.count < 0) return `${event.label}${disappears ? 'がいなくなる' : ` −${Math.abs(event.count)}か所`}（−${Math.abs(event.points)}点）`;
      return `${event.label} +${event.count}か所（+${event.points}点）`;
    });
    $('place-button').disabled = false;
    box.classList.toggle('good', preview.gained > 0);
    box.classList.toggle('bad', preview.gained < 0);
    const scoreLabel = preview.gained > 0 ? `+${preview.gained} pt` : preview.gained < 0 ? `−${Math.abs(preview.gained)} pt` : '点数変化なし';
    box.innerHTML = `<span class="forecast-icon" aria-hidden="true">${preview.gained > 0 ? '✦' : preview.gained < 0 ? '↘' : '◌'}</span><div><strong>予想 ${scoreLabel}</strong><p>${names.length ? names.map(escapeHTML).join(' / ') : 'まだ新しいすみかはできません。隣の地形との組み合わせを考えてみよう。'}</p></div>`;
    const beforeSpecies = Object.values(preview.beforeHabitats).filter(n => n > 0).length;
    const location = `${Math.floor(selectedCell / 5) + 1}行${selectedCell % 5 + 1}列`;
    $('preview-ribbon').textContent = `${location}に${NAMES[selectedType]} · ${state.score} → ${state.score + preview.gained} pt · 生きもの ${beforeSpecies} → ${preview.species}種`;
  }

  function renderResult() {
    const banner = $('result-banner');
    if (!state.ended) { banner.hidden = true; banner.classList.remove('fail'); banner.textContent = ''; return; }
    banner.hidden = false;
    banner.classList.toggle('fail', !state.won);
    banner.textContent = state.won
      ? `庭に生きものが集まった！ ${state.score}点・${Engine.getStatus(state).species}種。${$('seed-label').textContent}でもう一度試してみよう。`
      : `あと一歩。${state.score}点・${Engine.getStatus(state).species}種。別の置き方で、この庭のつづきを見つけよう。`;
  }
  function renderAll(options = {}) {
    const focused = options.preserveFocus === false ? '' : rememberFocus();
    $('seed-label').textContent = state.seed;
    $('turn-count').textContent = state.turn;
    $('round-number').textContent = String(Math.min(state.turn + 1, Engine.MAX_TURNS)).padStart(2, '0');
    $('progress-bar').style.width = `${(state.turn / Engine.MAX_TURNS) * 100}%`;
    $('score').textContent = Engine.getStatus(state).score;
    $('undo-button').disabled = state.history.length === 0;
    $('retry-button').disabled = false;
    renderBoard();
    renderChoices();
    renderCreatures();
    renderResult();
    updateForecast();
    restoreFocus(focused);
  }
  function announce(text, good) {
    const ribbon = $('preview-ribbon');
    ribbon.textContent = text;
    ribbon.classList.toggle('good', good);
  }
  function commitPlacement(index) {
    const result = Engine.place(state, selectedType, index);
    if (!result.ok) {
      const messages = { occupied: 'そこはもう使っているよ。', offer: '今手にない地形だよ。', ended: 'この庭は完成しているよ。' };
      announce(messages[result.reason] || 'そこには置けないよ。', false);
      return;
    }
    state = result.state;
    justUndone = false;
    const placedName = NAMES[selectedType];
    if (state.turn < Engine.MAX_TURNS) selectedType = state.offers[state.turn][0];
    else selectedType = null;
    selectedCell = state.board.findIndex(tile => !tile);
    if (selectedCell < 0) selectedCell = 12;
    renderAll({ preserveFocus: false });
    if (result.events.length) {
      const changes = result.events.map(e => e.points > 0 ? `${e.label} +${e.points}` : `${e.label} −${Math.abs(e.points)}`).join(' · ');
      announce(`${placedName}を置いた。${changes} pt`, result.gained > 0);
    } else {
      announce(`${placedName}を置いた。庭に変化が生まれたよ。`, false);
    }
  }
  function undoMove() {
    const result = Engine.undo(state);
    if (!result.ok) return;
    state = result.state;
    selectedType = state.offers[state.turn][0];
    justUndone = true;
    renderAll({ preserveFocus: false });
    announce('1手戻したよ。候補を選び直して、違う配置を試せます。', false);
  }
  function retry() {
    state = Engine.retry(state.seed);
    selectedType = state.offers[0][0];
    selectedCell = 12;
    justUndone = false;
    renderAll({ preserveFocus: false });
    $('board').querySelector('[data-focus-target="cell:12"]')?.focus({ preventScroll: true });
    announce('同じタネ、同じ地形の並び。新しい庭で再挑戦！', false);
  }
  function nextCell(direction) {
    let row = Math.floor(selectedCell / 5);
    let col = selectedCell % 5;
    if (direction === 'ArrowUp') row = (row + 4) % 5;
    if (direction === 'ArrowDown') row = (row + 1) % 5;
    if (direction === 'ArrowLeft') col = (col + 4) % 5;
    if (direction === 'ArrowRight') col = (col + 1) % 5;
    selectedCell = row * 5 + col;
    renderAll({ preserveFocus: false });
    $('board').querySelector(`[data-focus-target="cell:${selectedCell}"]`)?.focus({ preventScroll: true });
  }
  $('place-button').addEventListener('click', () => { if (!state.ended && selectedType && !state.board[selectedCell]) commitPlacement(selectedCell); });
  $('undo-button').addEventListener('click', undoMove);
  $('retry-button').addEventListener('click', retry);
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if (isTyping) return;
    if (event.key === '1' || event.key === '2') {
      const offered = state.offers[Math.min(state.turn, Engine.MAX_TURNS - 1)] || [];
      const chosen = offered[Number(event.key) - 1];
      if (chosen && !state.ended) { event.preventDefault(); selectedType = chosen; renderAll(); }
      return;
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (event.target.closest && event.target.closest('.cell')) { event.preventDefault(); nextCell(event.key); }
      return;
    }
    if (event.key === 'Enter' && event.target.closest && event.target.closest('.cell')) {
      event.preventDefault();
      if (!state.ended && selectedType && !state.board[selectedCell]) commitPlacement(selectedCell);
      return;
    }
    if (event.key.toLowerCase() === 'u' && !event.repeat) { event.preventDefault(); undoMove(); }
    if (event.key.toLowerCase() === 'r' && !event.repeat) { event.preventDefault(); retry(); }
  });

  renderAll();
})();
