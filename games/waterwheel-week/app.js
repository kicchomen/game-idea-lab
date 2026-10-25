(function () {
  'use strict';
  const E = window.WaterwheelEngine;
  const app = document.getElementById('app');
  const announcer = document.getElementById('announcer');
  let state = E.createGame();
  let lastActionAt = -Infinity;
  let restartArmed = false;
  let scheduleOpen = false;
  const icons = { coin: '◉', wood: '🪵', grain: '🌾', flour: '◒', bread: '🥖' };
  const resourceText = data => Object.entries(data).filter(([, value]) => value).map(([key, value]) => `${E.RESOURCE_NAMES[key]} ${value}`).join('・') || 'コストなし';
  const badge = (key, value) => `<span class="resource-bit"><span aria-hidden="true">${icons[key]}</span> ${E.RESOURCE_NAMES[key]} <b>${value}</b></span>`;
  function townArt() {
    const b = state.buildings;
    return `<svg class="town-art" viewBox="0 0 720 192" role="img" aria-label="川沿いに育つ町。麦畑${b.field}、水車小屋${b.mill}、パン窯${b.oven}、きこり小屋${b.woodcutter}。">
      <defs><pattern id="field-lines" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M2 12V0M7 12V0" stroke="#d1a653" stroke-width="1.5"/></pattern></defs>
      <path d="M0 160Q70 96 148 120T320 102T500 122T720 106V192H0Z" fill="#e7ddba"/>
      <path d="M0 174Q100 145 188 166T345 151T526 161T720 141V192H0Z" fill="#88aa91"/>
      <path d="M315 192C348 149 380 126 405 106C440 76 462 90 492 65L524 65C478 105 468 109 444 129C412 159 419 178 414 192Z" fill="#80b9b1"/>
      <path d="M358 190Q390 151 439 116M391 190Q404 160 461 119" stroke="#b8dbce" stroke-width="3" fill="none"/>
      <path d="M75 142l118-14 43 27-126 18Z" fill="#e4bb67"/><path d="M75 142l118-14 43 27-126 18Z" fill="url(#field-lines)"/>
      <g stroke="#a58238" stroke-width="2"><path d="M115 137v-24m0 15-7-7m7 3 7-8m-7 3-6-7m25 23v-22m0 13-7-7m7 3 6-7m14 18v-22m0 13-6-6m6 2 7-7"/></g>
      <g opacity="${b.mill ? 1 : .27}"><path d="M278 132V81h64v61Z" fill="#f0e5c9"/><path d="M267 83l43-34 43 34Z" fill="#b56f4c"/><path d="M302 133v-28h17v30" fill="#656d58"/><path d="M283 89h13v13h-13Z" fill="#709d97"/><circle cx="349" cy="132" r="26" fill="#e7ca91" stroke="#76583f" stroke-width="5"/><g stroke="#76583f" stroke-width="4"><path d="M349 106v52m-26-26h52m-44-18 36 36m0-36-36 36"/></g><circle cx="349" cy="132" r="6" fill="#76583f"/></g>
      <g opacity="${b.oven ? 1 : .27}"><path d="M510 141V94h79v52Z" fill="#eacb9c"/><path d="M498 97l51-34 52 34Z" fill="#ab6645"/><path d="M566 76V49h14v36" fill="#b88056"/><path d="M535 144v-21a16 16 0 0 1 32 0v22Z" fill="#6b493b"/><path d="M544 139q-5-10 3-17 3 7 6 6 8 8 5 13Z" fill="#e5a448"/><path d="M575 39q-9-11 2-16m-3-9q-4-7 0-11" stroke="#d8c9a7" stroke-width="5" fill="none" stroke-linecap="round"/></g>
      <g opacity="${b.woodcutter ? 1 : .4}"><path d="M638 135V99h32v39Z" fill="#a98959"/><path d="M630 101l24-19 24 19Z" fill="#526e53"/><path d="M645 138v-19h11v20" fill="#685b43"/></g>
      <g fill="#567963"><path d="M30 140V82l-22 37h14l-18 25h51l-19-25h14L30 82Z"/><path d="M670 90V27l-25 43h17l-22 30h60l-22-30h17L670 27Z"/></g>
      <path d="M219 151Q272 136 304 149M453 154Q480 146 520 157" stroke="#f3ead4" stroke-width="6" fill="none"/>
      <g fill="#f8f2df"><circle cx="76" cy="58" r="4"/><circle cx="91" cy="57" r="3"/></g>
    </svg>`;
  }
  function chainNode(id, title, rate) {
    return `<div class="chain-node ${state.buildings[id] ? 'built' : 'empty'}"><span class="chain-icon" aria-hidden="true">${E.CARDS[id].icon}</span><span class="chain-title">${title} <b>×${state.buildings[id]}</b></span><span class="chain-rate">${rate}</span></div>`;
  }
  function shellTop() {
    const percent = Math.min(100, Math.round(state.resources.bread / E.GOAL * 100));
    return `<section class="town" aria-label="町と目標">
      <div class="town-heading"><span class="day-pill">${state.phase === 'ended' ? '一週間の終わり' : `${state.day}日目`}<small> / 7 DAYS</small></span><span class="goal-copy">町のお祭りに <b>パン21個</b></span></div>
      ${townArt()}
      <div class="goal-line"><span>お祭りへのお届け</span><strong>${state.resources.bread}<span> / ${E.GOAL} 個</span></strong></div>
      <div class="progress-track" role="progressbar" aria-label="パンの目標達成率" aria-valuemin="0" aria-valuemax="21" aria-valuenow="${Math.min(E.GOAL, state.resources.bread)}"><span style="width:${percent}%"></span></div>
      <div class="resources" aria-label="現在の在庫">${['coin', 'wood', 'grain', 'flour'].map(key => `<div><span class="resource-label"><span aria-hidden="true">${icons[key]}</span> ${E.RESOURCE_NAMES[key]}</span><b>${state.resources[key]}</b></div>`).join('')}</div>
      <div class="chain" aria-label="毎夕の生産順序">${chainNode('field', '麦畑', `麦 +${state.buildings.field * 2}`)}<span class="chain-arrow" aria-hidden="true">→</span>${chainNode('mill', '水車', `麦→粉 ${state.buildings.mill * 2}まで`)}<span class="chain-arrow" aria-hidden="true">→</span>${chainNode('oven', 'パン窯', `粉→パン ${state.buildings.oven * 3}まで`)}</div>
      <div class="town-foot">きこり小屋 ×${state.buildings.woodcutter}：木材 +${state.buildings.woodcutter * 2} / 日 <span>町の収入：コイン +2 / 日</span></div>
    </section>`;
  }
  function cardHTML(card, index) {
    const affordability = E.affordability(state, card.id);
    const selected = state.selected === card.id;
    return `<article class="offer ${selected ? 'selected' : ''} ${affordability.ok ? '' : 'unaffordable'}"><div class="offer-top"><span class="card-number">0${index + 1}</span><span class="card-kind">${card.kind === 'workshop' ? 'ずっと残る工房' : '一度だけの補給'}</span><span class="offer-icon" aria-hidden="true">${card.icon}</span></div>
      <h3>${card.name}</h3><p class="card-effect">${card.effect}</p><p class="card-description">${card.description}</p><p class="cost">${Object.keys(card.cost).length ? `建設：${resourceText(card.cost)}` : '建設コストなし'}</p>
      <button class="select-card ${selected ? 'is-selected' : ''}" data-action="select" data-card="${card.id}" data-revision="${state.revision}" aria-pressed="${selected}" ${affordability.ok ? '' : 'disabled'}>${selected ? '選択中・まだ未確定' : affordability.ok ? 'このカードの予測を見る' : affordability.reason}</button></article>`;
  }
  function bottleneck(production) {
    const messages = [];
    if (production.idleMill) messages.push(`麦不足で水車の加工枠が${production.idleMill}つ余ります`);
    if (production.idleOven) messages.push(`粉不足でパン窯${production.idleOven}基がお休み`);
    return messages.length ? `<p class="warning">${messages.join('。')}。</p>` : '<p class="forecast-note">すべての加工設備に材料が届きます。</p>';
  }
  function forecast() {
    if (!state.selected) return `<section class="forecast empty-forecast" aria-label="夕方の予測"><div class="eyebrow">EVENING PREVIEW</div><h3>今日、何を育てる？</h3><p>カードを選ぶと、夕方の在庫が見えます。選ぶだけでは、日も資材も進みません。</p><button class="primary" disabled>カードを選んで予測を確認</button></section>`;
    const f = E.preview(state, state.selected);
    return `<section class="forecast" aria-label="夕方の予測"><div class="eyebrow">PREVIEW · まだ未確定</div><h3>${E.CARDS[state.selected].name}を${E.CARDS[state.selected].kind === 'workshop' ? '建てたら' : '選んだら'}</h3>
      <p class="forecast-bread">今夕のパン <b>+${f.production.baked}</b><span>合計 ${f.resources.bread} 個</span></p>
      <p class="production-flow">麦 +${f.production.harvested} → 粉 ${f.production.milled} 加工 → パン ${f.production.baked} 個</p>
      <div class="forecast-stock"><span>夕方の在庫（建設費・収入込み）</span><div>${['coin', 'wood', 'grain', 'flour'].map(key => badge(key, f.resources[key])).join('')}</div></div>
      ${bottleneck(f.production)}
      <button class="primary" data-action="commit" data-revision="${state.revision}">このカードで今日を終える <span aria-hidden="true">→</span></button>
      <p class="action-note">今日の選択は1枚だけ。確定後は取り消せません。</p></section>`;
  }
  function scheduleView() {
    return `<div class="schedule"><button class="schedule-toggle" data-action="toggle-schedule" aria-expanded="${scheduleOpen}" aria-controls="offer-schedule">${scheduleOpen ? '−' : '＋'} これから届くカード <span>7日間の予定</span></button><div id="offer-schedule" ${scheduleOpen ? '' : 'hidden'}><p>候補は毎回同じ。先の建設に必要な資材も考えてみよう。</p><ol>${E.OFFERS.map((cards, i) => `<li data-day="${i + 1}" class="${i + 1 === state.day ? 'today' : i + 1 < state.day ? 'past' : ''}"><b>${i + 1}日目${i + 1 === state.day ? '・今日' : i + 1 < state.day ? '・済' : ''}</b><span>${cards.map(id => E.CARDS[id].name).join(' / ')}</span></li>`).join('')}</ol></div></div>`;
  }
  function chooseView() {
    return `<section class="choices" id="choices" aria-labelledby="choose-title"><div class="section-heading"><div><div class="eyebrow">ONE CHOICE, EVERY DAY</div><h2 id="choose-title" tabindex="-1">${state.day}日目の選択</h2></div><span class="remaining">あと ${8 - state.day} 回</span></div><p class="hint">${E.hint(state)}</p>${scheduleView()}<div class="choice-layout"><div class="offer-grid">${E.offers(state).map(cardHTML).join('')}</div>${forecast()}</div></section>`;
  }
  function dailyReport() {
    const r = state.lastReport;
    const p = r.production;
    return `<div class="report-summary"><p class="report-card">${E.CARDS[r.cardId].name}${E.CARDS[r.cardId].kind === 'workshop' ? 'が町に加わりました' : 'で資材を受け取りました'}。</p><div class="day-production"><span>麦を収穫 <b>+${p.harvested}</b></span><span>粉に加工 <b>${p.milled}</b></span><span>パンを焼いた <b>+${p.baked}</b></span></div>${bottleneck(p)}<p class="small">コイン +2${p.wood ? `・きこりの木材 +${p.wood}` : ''}。${state.phase === 'ended' ? '7日間の生産はここで終了です。' : '残った材料は明日に持ち越します。'}</p></div>`;
  }
  function reportView() {
    return `<section class="evening" id="choices"><div class="eyebrow">DAY ${state.day} · EVENING</div><h2 id="report-title" tabindex="-1">${state.day}日目の夕方</h2>${dailyReport()}<button class="primary next-day" data-action="next" data-revision="${state.revision}">${state.day + 1}日目のカードへ <span aria-hidden="true">→</span></button><p class="action-note">ここでは日が止まっています。自分のペースでどうぞ。</p></section>`;
  }
  function historyHTML() {
    return `<details class="history"><summary>7日間の記録をふり返る</summary><ol>${state.history.map(r => `<li><span>${r.day}日目</span><b>${E.CARDS[r.cardId].name}</b><span>パン +${r.production.baked} / 計${r.after.bread}</span></li>`).join('')}</ol></details>`;
  }
  function endView() {
    const won = state.result.won;
    const title = won ? '町のお祭り、開幕！' : '今週は、目標に届かず。';
    return `<section class="ending ${won ? 'won' : 'lost'}" id="choices"><div class="eyebrow">${won ? 'THE TOWN IS READY' : 'TRY A DIFFERENT ORDER'}</div><h2 id="end-title" tabindex="-1">${title}</h2><p class="final-score"><b>${state.resources.bread}</b> / 21 個</p><p>${won ? `パン${state.resources.bread}個を届けて成功。${state.resources.bread >= 24 ? '原料から焼き上げまで、増産がつながりました。' : '今度は24個を目指して、工房の順番を変えてみよう。'}` : `パンが${state.result.shortfall}個足りませんでした。工房を建てるのが遅いと、働ける夕方も少なくなります。`}</p>${dailyReport()}${historyHTML()}<button class="primary" data-action="retry" data-revision="${state.revision}">もう一週間、町をつくる</button><p class="action-note">同じカード・同じ初期資材でやり直します。</p></section>`;
  }
  function revealHeading(target) {
    // Avoid competing focus/CSS smooth-scroll animations after the DOM shrinks.
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' });
    // A tall same-origin iframe may contain the heading without its outer page
    // showing it. Align each accessible ancestor viewport to the actual heading,
    // not to the iframe's top. Never cross an origin/sandbox boundary.
    let owner = window;
    let top = target.getBoundingClientRect().top;
    while (owner.parent && owner.parent !== owner) {
      try {
        const frame = owner.frameElement;
        if (!frame) break;
        const parent = owner.parent;
        top += frame.getBoundingClientRect().top + (frame.clientTop || 0);
        const before = parent.scrollY;
        parent.scrollTo({ top: Math.max(0, before + top - 16), left: parent.scrollX, behavior: 'instant' });
        top -= parent.scrollY - before;
        owner = parent;
      } catch (_) {
        // Cross-origin/sandboxed parents remain controlled by their own page.
        break;
      }
    }
  }
  function render(focusId) {
    app.innerHTML = shellTop() + (state.phase === 'choose' ? chooseView() : state.phase === 'report' ? reportView() : endView()) + (state.phase !== 'ended' ? `<div class="restart-area">${restartArmed ? `<span>一週間の記録を消してやり直す？</span><button class="quiet" data-action="retry" data-revision="${state.revision}">はい、最初から</button><button class="quiet" data-action="cancel-retry">戻る</button>` : '<button class="text-button" data-action="ask-retry">最初からやり直す</button>'}</div>` : '');
    if (focusId) {
      const target = document.getElementById(focusId);
      if (target) revealHeading(target);
    }
  }
  function announce(message) { announcer.textContent = message; }
  function chooseCard(cardId) {
    const result = E.select(state, cardId);
    if (!result.ok) { announce(result.reason); return; }
    state = result.state; restartArmed = false; render();
    const button = app.querySelector(`[data-card="${cardId}"]`); if (button) button.focus({ preventScroll: true });
    const p = E.preview(state, cardId); announce(`${E.CARDS[cardId].name}の予測。今夕のパンは${p.production.baked}個、合計${p.resources.bread}個。まだ確定していません。`);
  }
  app.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-action]');
    if (!button || button.disabled || event.detail > 1) return;
    const action = button.dataset.action;
    const revision = Number(button.dataset.revision);
    if (action === 'select') { if (revision === state.revision) chooseCard(button.dataset.card); return; }
    if (action === 'ask-retry') { restartArmed = true; render(); app.querySelector('[data-action="cancel-retry"]').focus({ preventScroll: true }); return; }
    if (action === 'cancel-retry') { restartArmed = false; render(); app.querySelector('[data-action="ask-retry"]').focus({ preventScroll: true }); return; }
    if (action === 'toggle-schedule') { scheduleOpen = !scheduleOpen; render(); app.querySelector('[data-action="toggle-schedule"]').focus({ preventScroll: true }); return; }
    const now = performance.now();
    if (now - lastActionAt < 400) return;
    let result;
    if (action === 'commit') result = E.commit(state, revision);
    else if (action === 'next') result = E.nextDay(state, revision);
    else if (action === 'retry' && revision === state.revision) result = { ok: true, state: E.retry(state) };
    if (!result) return;
    if (!result.ok) { announce(result.reason); return; }
    lastActionAt = now;
    state = result.state; restartArmed = false;
    if (action === 'retry') scheduleOpen = false;
    render(state.phase === 'choose' ? 'choose-title' : state.phase === 'report' ? 'report-title' : 'end-title');
    announce(state.phase === 'choose' ? `${state.day}日目。カードを1枚選んでください。` : state.phase === 'report' ? `${state.day}日目が終わり、パンは${state.resources.bread}個です。` : `${state.result.won ? '成功' : '失敗'}。パンは${state.resources.bread}個、目標は21個です。`);
  });
  document.addEventListener('keydown', function (event) {
    if (event.repeat && ['Enter', ' ', '1', '2', '3'].includes(event.key)) { event.preventDefault(); return; }
    if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (state.phase === 'choose' && /^[123]$/.test(event.key)) { event.preventDefault(); const card = E.offers(state)[Number(event.key) - 1]; if (card) chooseCard(card.id); }
  });
  render();
})();
