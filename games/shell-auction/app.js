(function () {
  'use strict';
  const E = window.ShellAuction, root = document.getElementById('game'), announcer = document.getElementById('announcement');
  let initialSeed = E.DEFAULT_SEED;
  try { initialSeed = new URLSearchParams(window.location.search).get('seed') || initialSeed; } catch (_) { /* File embeds can omit a location object. */ }
  let state = E.createGame(initialSeed), confirming = false, lastCommit = -Infinity, seedCounter = 0;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const name = lot => `${E.COLORS[lot.color]}の${E.SHAPES[lot.shape]}`;
  function shell(lot, className) {
    const c = lot.color === 'coral' ? ['#e89c89', '#ac4d43', '#f9c8ad'] : ['#96c4c8', '#3d7785', '#d2e9de'];
    const shapes = {
      fan: `<path d="M57 88C32 80 8 53 14 33C17 20 30 21 34 23C34 8 50 7 60 18C70 7 86 8 86 23C96 18 108 25 108 37C109 57 86 81 64 88Z"/><path d="M60 86L34 24M60 86L60 18M60 86L86 24M60 86L16 36M60 86L105 37" fill="none"/><path d="M47 86Q60 81 74 86L76 95H45Z"/>`,
      spiral: `<path d="M27 81C10 66 13 36 29 21C47 3 77 9 92 29C108 49 101 74 83 85C65 96 39 94 27 81Z"/><path d="M29 73C13 46 34 20 58 23C84 27 87 59 68 70C49 81 32 62 39 47C46 33 63 39 65 49C67 59 53 62 51 54" fill="none" stroke-width="4"/><path d="M76 78L101 90L72 94"/>`,
      moon: `<path d="M20 65C11 47 20 24 41 18C61 11 94 20 103 42C113 68 95 91 68 94C45 96 28 82 20 65Z"/><path d="M26 37C35 69 65 80 98 66M33 25C45 58 75 65 104 52M22 52C37 83 62 91 85 86" fill="none"/><path d="M48 20Q43 31 48 41" fill="none"/>`
    };
    return `<svg class="${className || ''}" viewBox="0 0 120 108" aria-hidden="true" focusable="false"><g fill="${c[0]}" stroke="${c[1]}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round">${shapes[lot.shape]}</g><path d="M26 33Q35 20 46 21" fill="none" stroke="${c[2]}" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
  function button(id, label, extra) { return `<button id="${id}" data-action="${id}" data-revision="${state.revision}" ${extra || ''}>${label}</button>`; }
  function focus(id, scroll) {
    const node = document.getElementById(id);
    if (!node) return;
    node.focus({ preventScroll: true });
    if (scroll) node.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
  }
  function announce(message) { if (announcer.textContent !== message) announcer.textContent = message; }
  function summary() {
    const s = E.score(state.collections[0], state.commission);
    return `<div class="progress-row"><h3>あなたの展示棚</h3><span class="score">${s.total}<small> / ${E.GOAL}点</small></span></div>
    <div class="collection">${state.collections[0].length ? state.collections[0].map(lot => `<span class="collected-shell">${shell(lot)}${name(lot)}</span>`).join('') : '<p class="collection-empty">まだ空っぽ。どの組み合わせを集める？</p>'}</div>
    <div class="score-list"><span>貝 ${s.base}点</span><span class="${s.pairs ? 'complete' : ''}">同じ形のペア ${s.pairs}点</span><span class="${s.variety ? 'complete' : ''}">3種類 ${s.variety}点</span><span class="${s.order ? 'complete' : ''}">依頼 ${s.commission}点</span></div>`;
  }
  function details(open) {
    return `<details class="details" id="schedule" ${open.has('schedule') ? 'open' : ''}><summary>6品の出品予定を見る</summary><ol class="lot-list">${state.lots.map((lot, i) => `<li class="${i === state.turn && state.phase !== 'ended' ? 'current' : i < state.history.length ? 'past' : ''}"><span>${i + 1}品目${i === state.turn && state.phase !== 'ended' ? '・今' : ''}</span>${shell(lot)}<span>${name(lot)}</span>${i < state.history.length ? `<span>→${state.history[i].winner === null ? '不落' : E.NAMES[state.history[i].winner]}</span>` : ''}</li>`).join('')}</ol></details>
    <details class="details" id="records" ${open.has('records') ? 'open' : ''}><summary>札の記録・相手のかご（${state.history.length}品）</summary><p>リオは「色」、ナギは「形」にこだわる。どれが好みか、札の強弱から探ろう。そろいかけの形にも少し多く出す。</p>${[1, 2].map(id => `<p><strong>${E.NAMES[id]}</strong>：${state.wallets[id]}枚 ／ ${state.collections[id].map(name).join('、') || 'かごは空'}</p>`).join('')}${state.history.length ? state.history.map(h => `<div class="record"><strong>${h.turn + 1}. ${name(h.lot)} → ${h.winner === null ? '買い手なし' : `${E.NAMES[h.winner]}が${h.price}枚で落札`}</strong><p>札：あなた ${h.bids[0]} ／ リオ ${h.bids[1]} ／ ナギ ${h.bids[2]}</p><p>同額優先：${h.priority.map(id => E.NAMES[id]).join(' → ')}</p></div>`).join('') : '<p>札を開くと、3人の入札額がここに残ります。</p>'}</details>
    <details class="details" id="rules" ${open.has('rules') ? 'open' : ''}><summary>競りと得点のルール</summary><ul><li>24枚を6品に配分。3人が同時に札を開く、封印入札です。最高額の1人だけが、自分の入札額を払います。負けたら支払いなし。</li><li>0枚は見送り。同額なら、その品に表示された優先順で落札します。優先は毎品交代。</li><li>貝は1枚2点。同じ形の2枚で追加4点（形ごと）。扇・巻き・月の3種類で追加5点（1回）。指定色2枚で追加5点（1回）。ボーナスは重なります。</li><li>最後に16点以上で成功。コインの残りは点になりません。相手の点数との順位戦ではありません。</li><li>相手も資金は有限。色・形の好み、所持品、品ごとの小さな差で札を決めます。あなたの今回の札は見ていません。好みと差は同じ市場なら変わりません。</li><li>確定前は何度でも金額を変更できます。確定後は取り消せません。TabとEnter／Space、スライダーの矢印キーでも操作できます。</li></ul><p>試作範囲：6品・相手2人・セット収集。対人戦、会話AI、物語、長期成長はありません。</p></details>`;
  }
  function render(focusId, shouldScroll) {
    const open = new Set(['schedule', 'records', 'rules'].filter(id => document.getElementById(id)?.open));
    const s = E.score(state.collections[0], state.commission), lot = state.lots[state.turn];
    let center;
    if (state.phase === 'ended') {
      center = `<section class="final" aria-labelledby="end-title"><p class="eyebrow">THE MARKET IS CLOSED</p><h2 id="end-title" tabindex="-1">${state.result.won ? '展示が完成！' : 'あとひと工夫。'}</h2><p class="final-score">${state.result.score}<small>点 / 目標${E.GOAL}点</small></p><p>${state.result.won ? `競り落とした${state.collections[0].length}枚で、自分だけの棚ができました。` : `目標まであと${E.GOAL - state.result.score}点。同じ市場で、譲る品と狙う組み合わせを変えてみよう。`}</p><p>残りコイン ${state.wallets[0]}枚（点にはなりません）</p><div class="final-actions">${button('retry', '同じ市場でもう一度', 'class="primary"')}${button('new-market', '別の市場をひらく')}</div></section>`;
    } else {
      const order = E.priority(state).map(id => E.NAMES[id]).join(' → ');
      let controls;
      if (state.phase === 'bid') controls = `<p class="instruction">相手の札はまだ秘密。落札した人だけが支払います。</p><label class="sr-only" for="bid-range">入札額、コイン</label><div class="bid-picker">${button('less', '−', 'aria-label="入札を1枚減らす" disabled')}<div class="bid-number"><span id="bid-value">${state.selected}</span><small> 枚を入札</small></div>${button('more', '＋', 'aria-label="入札を1枚増やす"')}</div><input id="bid-range" class="slider" type="range" min="0" max="${state.wallets[0]}" step="1" value="${state.selected}" aria-valuetext="${state.selected}枚"><div class="bid-actions">${button('submit', state.selected ? `${state.selected}枚で札を出す` : '金額を選んで入札', 'class="primary" disabled')}${button('pass', '見送る（0枚）')}</div><p class="priority">同額の優先順：${order}</p><p class="tip">リオは色、ナギは形にこだわりあり。入札の記録が手がかり。</p>`;
      else {
        const h = state.history[state.history.length - 1];
        controls = `<h3 class="reveal-heading" id="reveal-title" tabindex="-1">${h.winner === 0 ? 'あなたが落札！' : h.winner === null ? '買い手なし' : `${E.NAMES[h.winner]}が落札`}</h3><p class="result-text">${h.winner === 0 ? `${h.price}枚を支払い、展示に＋${h.scoreGain}点。` : h.winner === null ? '全員が見送り。誰も支払いません。' : `${name(h.lot)}は${h.price}枚で${E.NAMES[h.winner]}のかごへ。あなたの支払いは0枚。`}</p><div class="bid-reveal">${h.bids.map((bid, id) => `<div class="bid-card ${h.winner === id ? 'winner' : ''}">${E.NAMES[id]}<b>${bid}</b>枚${bid === 0 ? '・見送り' : h.winner === id ? '・落札' : ''}</div>`).join('')}</div><p class="priority">同額の優先順：${order}</p>${button('next', state.turn === 5 ? '展示を仕上げる' : '次の品を見る', `class="primary wide" ${confirming ? 'disabled' : ''}`)}`;
      }
      center = `<div class="ledger-top"><span class="goal">${state.turn + 1} / 6品　目標 ${E.GOAL}点</span><span class="coins"><span class="coin-dot" aria-hidden="true">¢</span>手持ち ${state.wallets[0]}枚</span></div><section class="stall" aria-labelledby="lot-title"><div class="awning" aria-hidden="true"></div><div class="stage"><p class="round-title">潮騒の競り台 · ${state.phase === 'bid' ? '札を選ぶ' : '札を開く'}</p><div class="collectors">${[1, 2].map(id => `<div class="collector"><span class="portrait ${id === 2 ? 'nagi' : ''}" aria-hidden="true"></span><div><strong>${E.NAMES[id]}</strong>${state.wallets[id]}枚 / ${state.collections[id].length}貝<small>${id === 1 ? '色にこだわり' : '形にこだわり'}</small></div></div>`).join('')}</div><div class="lot">${shell(lot, 'shell-display')}<h2 id="lot-title" tabindex="-1">${name(lot)}</h2><p class="lot-tag">1枚 2点${lot.color === state.commission ? ' · 依頼の色' : ''}${state.collections[0].some(l => l.shape === lot.shape) ? ' · ペアになる！' : ''}</p></div></div><div class="table-edge" aria-hidden="true"></div><div class="bid-area">${controls}</div></section>`;
    }
    root.innerHTML = `${center}<aside class="order"><p><strong>今日の依頼：${E.COLORS[state.commission]}の貝を2枚</strong><br>集めると＋5点。いま ${s.colorCount} / 2枚${s.order ? '・達成！' : ''}</p></aside>${summary()}${details(open)}<p class="seed">市場番号 ${escape(state.seed)}</p>${state.phase !== 'ended' ? `<div class="utility">${button('ask-retry', '最初からやり直す', 'class="quiet"')}</div>` : ''}${confirming ? `<section class="restart-confirm" role="group" aria-label="やり直し確認"><p>この6品の記録を消し、同じ市場を最初から始めますか？</p><div>${button('cancel-retry', '続ける')}${button('retry', 'やり直す', 'class="primary"')}</div></section>` : ''}`;
    syncBidControls();
    if (focusId) focus(focusId, shouldScroll);
  }
  function syncBidControls() {
    if (state.phase !== 'bid') return;
    const amount = document.getElementById('bid-value'), range = document.getElementById('bid-range'), less = document.getElementById('less'), more = document.getElementById('more'), submit = document.getElementById('submit');
    amount.textContent = state.selected;
    range.value = state.selected; range.setAttribute('aria-valuetext', `${state.selected}枚`);
    range.disabled = confirming || state.wallets[0] === 0;
    less.disabled = confirming || state.selected <= 0; more.disabled = confirming || state.selected >= state.wallets[0];
    submit.disabled = confirming || state.selected <= 0;
    submit.textContent = state.selected ? `${state.selected}枚で札を出す` : '金額を選んで入札';
    document.getElementById('pass').disabled = confirming;
    for (const node of root.querySelectorAll('button[data-action]')) node.dataset.revision = String(state.revision);
  }
  function setAmount(amount) {
    if (confirming) return;
    const result = E.selectBid(state, amount);
    if (!result.ok) { announce(result.reason); return; }
    state = result.state; syncBidControls(); announce(`入札 ${state.selected}枚。まだ確定していません。`);
  }
  root.addEventListener('input', event => { if (event.target.id === 'bid-range' && root.contains(event.target)) setAmount(Number(event.target.value)); });
  root.addEventListener('click', event => {
    const b = event.target.closest('button[data-action]');
    if (!b || !root.contains(b) || b.disabled || event.detail > 1) return;
    const action = b.dataset.action;
    if (Number(b.dataset.revision) !== state.revision) return;
    if (action === 'less' || action === 'more') { setAmount(state.selected + (action === 'more' ? 1 : -1)); return; }
    if (action === 'ask-retry') { confirming = true; render('cancel-retry', true); return; }
    if (action === 'cancel-retry') { confirming = false; render('ask-retry', false); return; }
    if (confirming && action !== 'retry') return;
    const now = performance.now();
    if (now - lastCommit < 400) return;
    if (action === 'retry' || action === 'new-market') {
      const seed = action === 'retry' ? state.seed : `shiosai-${Date.now().toString(36)}-${++seedCounter}`;
      state = E.createGame(seed); confirming = false; lastCommit = now; render('lot-title', true); announce('新しい展示棚。1品目の入札を選んでください。'); return;
    }
    let result;
    if (action === 'submit' || action === 'pass') {
      if (action === 'pass') { const selection = E.selectBid(state, 0); if (!selection.ok) return; state = selection.state; }
      result = E.submit(state, state.revision);
    } else if (action === 'next') result = E.nextLot(state, state.revision);
    else return;
    if (!result.ok) { announce(result.reason); return; }
    state = result.state; lastCommit = now;
    const target = state.phase === 'reveal' ? 'reveal-title' : state.phase === 'ended' ? 'end-title' : 'lot-title';
    render(target, true);
    if (state.phase === 'reveal') { const h = state.history[state.history.length - 1]; announce(`${h.winner === null ? '買い手なし' : E.NAMES[h.winner] + 'が' + h.price + '枚で落札'}。あなたの展示は${E.score(state.collections[0], state.commission).total}点。`); }
    else if (state.phase === 'ended') announce(`${state.result.won ? '成功' : '目標に届きませんでした'}。${state.result.score}点。`);
    else announce(`${state.turn + 1}品目、${name(state.lots[state.turn])}。手持ち${state.wallets[0]}枚。`);
  });
  document.addEventListener('keydown', event => { if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault(); }, true);
  render();
})();
