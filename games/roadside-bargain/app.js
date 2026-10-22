(function mountRoadsideBargain(window, document) {
  'use strict';

  const Engine = window.RoadsideBargainEngine;
  const root = document.querySelector('#game');
  const liveMessage = document.querySelector('#live-message');
  if (!Engine || !root) return;

  let state = Engine.create();
  let handlingClick = false;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

  function signed(value) {
    return value > 0 ? `+${value}` : String(value).replace('-', '−');
  }

  function patienceMarkup(person, amount, side) {
    const pips = Array.from({ length: Engine.MAX_PATIENCE }, (_, index) =>
      `<span class="patience-pip${index < amount ? ' is-full' : ''}" aria-hidden="true"></span>`).join('');
    return `<div class="patience" role="meter" aria-valuemin="0" aria-valuemax="${Engine.MAX_PATIENCE}" aria-valuenow="${amount}" aria-label="${escapeHtml(person.name)}のしんぼう ${amount}/${Engine.MAX_PATIENCE}">
      <span>しんぼう ${amount}/${Engine.MAX_PATIENCE}</span><span class="patience-track">${pips}</span>
    </div>`;
  }

  function valueDetails(person) {
    const incoming = person.receiveValues.map((value) => `+${value}`).join(' · ');
    const giving = person.giveCosts.map((value) => `−${value}`).join(' · ');
    return `<details class="value-details">
      <summary>${escapeHtml(person.name)}の品ごとの価値を見る</summary>
      <p>${escapeHtml(person.needItem)}を受け取る価値（1つ目から4つ目）：${incoming}。${escapeHtml(person.item)}を渡す費用（1つ目から4つ目）：${giving}。収支が0以上なら同意できます。</p>
    </details>`;
  }

  function travelerMarkup(person, side, patience, previewScore, lastResponse, phase) {
    const name = escapeHtml(person.name);
    const scoreClass = previewScore < 0 ? 'is-unhappy' : 'is-happy';
    const statusText = phase === 'accepted' ? '同意' : (previewScore < 0 ? 'この条件では難しい' : '同意できそう');
    return `<article class="traveler-card" data-side="${side}">
      <div class="traveler-top">
        <div class="portrait" aria-hidden="true">${escapeHtml(person.mark)}</div>
        <div><p class="role-label">${escapeHtml(person.role)}</p><h2>${name}</h2></div>
      </div>
      <p class="travel-quote">“${escapeHtml(person.says)}”</p>
      <div class="priority-list">
        <div class="priority-line"><b>必要</b><span>${escapeHtml(person.needLine)}</span></div>
        <div class="priority-line"><b>大切</b><span>${escapeHtml(person.keepLine)}</span></div>
      </div>
      ${valueDetails(person)}
      <p class="response-line ${scoreClass}" data-response-side="${side}"><strong>${statusText}</strong><br>${escapeHtml(lastResponse)}</p>
      ${patienceMarkup(person, patience, side)}
    </article>`;
  }

  function routeMarkup(state) {
    return `<nav class="route-strip" aria-label="旅の3つの話し合い">${Engine.MEETINGS.map((meeting, index) => {
      let status = '';
      if (state.phase === 'result' || index < state.meetingIndex || (index === state.meetingIndex && state.phase === 'meeting-end')) status = 'is-done';
      else if (index === state.meetingIndex && state.phase !== 'result') status = 'is-current';
      return `${index > 0 ? '<span class="route-link" aria-hidden="true"></span>' : ''}
        <span class="route-stop ${status}"><span class="route-dot">${status === 'is-done' ? '✓' : String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(meeting.name)}</span></span>`;
    }).join('')}</nav>`;
  }

  function lanternMarkup() {
    return `<div class="lantern-seal" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 11h14l3 7v17H14V18l3-7Z" stroke="currentColor" stroke-width="2"/>
      <path d="M18 11V7h12v4M14 18h20M19 22v9m10-9v9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M24 15c3 4 3 8 0 11-3-3-3-7 0-11Z" fill="currentColor" opacity=".62"/>
    </svg></div>`;
  }

  function quantityRow(meeting, state, side) {
    const otherSide = side === 'left' ? 'right' : 'left';
    const giver = meeting[side];
    const receiver = meeting[otherSide];
    const quantity = state.meeting.amounts[side];
    const canEdit = ['offer', 'counter'].includes(state.phase);
    return `<div class="quantity-row">
      <div class="quantity-copy">
        <span class="quantity-caption">${escapeHtml(giver.name)} → ${escapeHtml(receiver.name)}へ</span>
        <span class="quantity-title">${escapeHtml(giver.item)} <small>${escapeHtml(giver.name)}の持ち物</small></span>
      </div>
      <div class="stepper" aria-label="${escapeHtml(giver.item)}の数量">
        <button class="step-button" type="button" data-action="adjust" data-side="${side}" data-delta="-1" aria-label="${escapeHtml(giver.item)}を一つ減らす" ${!canEdit || quantity <= 1 ? 'disabled' : ''}>−</button>
        <output class="quantity-output" aria-live="polite" aria-label="${quantity}つの${escapeHtml(giver.item)}">${quantity}</output>
        <button class="step-button" type="button" data-action="adjust" data-side="${side}" data-delta="1" aria-label="${escapeHtml(giver.item)}を一つ増やす" ${!canEdit || quantity >= Engine.MAX_QUANTITY ? 'disabled' : ''}>+</button>
      </div>
    </div>`;
  }

  function scoreChip(person, score) {
    return `<div class="score-chip${score < 0 ? ' is-negative' : ''}"><span>${escapeHtml(person.name)}の収支</span><strong>${signed(score)}</strong></div>`;
  }

  function counterMarkup(meeting, state) {
    const counter = state.meeting.counterOffer;
    if (!counter || state.phase !== 'counter') return '';
    const old = state.meeting.lastOffer.amounts;
    const changes = [];
    if (counter.amounts.left !== old.left) {
      const delta = counter.amounts.left - old.left;
      changes.push(`${escapeHtml(meeting.left.item)}を${Math.abs(delta)}つ${delta > 0 ? '追加' : '減らす'}`);
    }
    if (counter.amounts.right !== old.right) {
      const delta = counter.amounts.right - old.right;
      changes.push(`${escapeHtml(meeting.right.item)}を${Math.abs(delta)}つ${delta > 0 ? '追加' : '減らす'}`);
    }
    const scores = counter.scores;
    return `<section class="counter-panel" aria-labelledby="counter-heading">
      <h3 id="counter-heading">${escapeHtml(meeting[counter.fromSide].name)}からの再提案</h3>
      <p>${changes.join(' · ')}。あなたが出した条件をもとにした提案です。</p>
      <p class="counter-terms">${counter.amounts.left}つの${escapeHtml(meeting.left.item)} ↔ ${counter.amounts.right}つの${escapeHtml(meeting.right.item)} · 収支 ${signed(scores.left)} / ${signed(scores.right)}</p>
    </section>`;
  }

  function acceptedSummary(meeting, state) {
    if (state.phase !== 'accepted') return '';
    const offer = state.meeting.lastOffer;
    const shared = Math.min(offer.scores.left, offer.scores.right);
    return `<section class="negotiation-result is-accepted" aria-live="polite">
      <p><strong>二人とも同意した。</strong> ${offer.amounts.left}つの${escapeHtml(meeting.left.item)}と${offer.amounts.right}つの${escapeHtml(meeting.right.item)}。収支は${escapeHtml(meeting.left.name)}が${signed(offer.scores.left)}、${escapeHtml(meeting.right.name)}が${signed(offer.scores.right)}。</p>
      <p>今まとめれば二人の手応え+${shared}。もう一度交渉すると、二人のしんぼうを一つずつ使います。</p>
    </section>`;
  }

  function negotiationMessage(state) {
    if (state.phase === 'meeting-end' || state.phase === 'result') return '';
    if (state.phase === 'offer' && state.meeting.attempts === 0) return '';
    if (state.phase === 'accepted') return '';
    return `<section class="negotiation-result" aria-live="polite"><p>${escapeHtml(state.message)}</p></section>`;
  }

  function actionMarkup(state) {
    if (state.phase === 'offer' || state.phase === 'counter') {
      const sameAfterPush = state.meeting.reopenedFrom
        && state.meeting.amounts.left === state.meeting.reopenedFrom.left
        && state.meeting.amounts.right === state.meeting.reopenedFrom.right;
      const disabled = sameAfterPush ? 'disabled' : '';
      const label = state.meeting.attempts === 0 ? 'この条件を提案する' : '数量を変えて再提案する';
      const counter = state.phase === 'counter' && state.meeting.counterOffer
        ? '<button class="action-button secondary" type="button" data-action="counter">再提案を試す</button>'
        : '';
      const changeHint = sameAfterPush ? '<p class="decision-copy">よりよい条件を出すには、どちらかの数量を変えてください。</p>' : '';
      return `${changeHint}<div class="action-row">${counter}<button class="action-button wide" type="button" data-action="submit" ${disabled}>${label}</button></div>`;
    }
    if (state.phase === 'accepted') {
      const canPush = state.meeting.patience.left > 1 && state.meeting.patience.right > 1;
      return `<div class="action-row">
        <button class="action-button wide" type="button" data-action="seal">この取り引きをまとめる</button>
        <button class="action-button secondary wide" type="button" data-action="push" ${canPush ? '' : 'disabled'}>もう一度だけ条件を聞く · 二人のしんぼうを1消費</button>
      </div>`;
    }
    if (state.phase === 'meeting-end') {
      const last = state.meetingIndex === Engine.MEETINGS.length - 1;
      return `<div class="meeting-end">
        <div class="stamp${state.meeting.status === 'walked' ? ' is-walked' : ''}" aria-hidden="true">${state.meeting.status === 'sealed' ? '成立' : '決裂'}</div>
        <h2>${state.meeting.status === 'sealed' ? '道中の取り引きがまとまった' : '旅人たちは別々の道へ'}</h2>
        <p>${escapeHtml(state.message)}</p>
        <div class="action-row"><button class="action-button wide" type="button" data-action="advance">${last ? '旅の結果を見る' : '次の旅人に会う'}</button></div>
      </div>`;
    }
    if (state.phase === 'result') {
      const success = state.history.length >= Engine.TARGET_DEALS;
      const perfect = state.history.length === Engine.MEETINGS.length;
      const log = state.history.length
        ? `<div class="deal-log" aria-label="成立した取り引き">${state.history.map((entry) => `<div class="deal-log-item"><strong>${escapeHtml(entry.meetingName)} · ${escapeHtml(entry.leftName)}と${escapeHtml(entry.rightName)}</strong>${entry.amounts.left}つの${escapeHtml(entry.leftItem)}と${entry.amounts.right}つの${escapeHtml(entry.rightItem)} · 二人の手応え +${entry.sharedWarmth}</div>`).join('')}</div>`
        : '';
      return `<div class="route-result">
        <div class="stamp${success ? '' : ' is-walked'}" aria-hidden="true">${perfect ? '3 / 3' : `${state.history.length} / 3`}</div>
        <p class="eyebrow">旅の記録 · ${success ? '取り引き成立' : '合意に届かず'}</p>
        <h2>${success ? (perfect ? '三組の旅がつながった' : '道が先へつながった') : 'それぞれの道へ'}</h2>
        <p>${escapeHtml(state.message)} ${success ? `二人の手応え合計：+${state.sharedWarmth}。` : `旅を終えるには${Engine.TARGET_DEALS}件の取り引きが必要です。`}</p>
        ${log}
        <div class="action-row"><button class="action-button wide" type="button" data-action="retry">もう一度、旅に出る</button></div>
      </div>`;
    }
    return '';
  }

  function currentGame(state) {
    const meeting = Engine.getMeeting(state);
    const preview = Engine.preview(state);
    const atEnd = state.phase === 'meeting-end' || state.phase === 'result';
    const editable = state.phase === 'offer' || state.phase === 'counter';
    const leftResponse = state.meeting.lastResponses.left;
    const rightResponse = state.meeting.lastResponses.right;
    const lastOffer = state.meeting.lastOffer;
    const displayedOffer = state.phase === 'accepted' && lastOffer ? lastOffer.amounts : state.meeting.amounts;
    const h = state.meetingIndex + 1;

    return `<section class="game-card" aria-labelledby="game-title">
      <div class="game-heading">
        <p class="eyebrow">立ち寄り ${String(h).padStart(2, '0')} · ${escapeHtml(meeting.name)}</p>
        <div class="title-line">
          <div><h1 id="game-title">旅人たちの取り引き</h1><p class="english-title">Roadside Bargain · a game of listening and terms</p></div>
          ${lanternMarkup()}
        </div>
        ${routeMarkup(state)}
      </div>
      <div class="instructions"><span class="instructions-mark" aria-hidden="true">↔</span><p><strong>あなたは道中の仲立ち役。</strong> 二人の話を聞いて数量を決めよう。受け取る価値から手放す価値を引き、収支が0以上ならその旅人は同意します。断られたら、相手の返答や具体的な再提案を見て条件を変えよう。</p></div>
      <div class="conversation">
        ${travelerMarkup(meeting.left, 'left', state.meeting.patience.left, preview.left, leftResponse, state.phase)}
        <div class="meeting-mark" aria-hidden="true"><span>↔</span></div>
        ${travelerMarkup(meeting.right, 'right', state.meeting.patience.right, preview.right, rightResponse, state.phase)}
      </div>
      <section class="offer-panel" aria-labelledby="offer-title">
        <div class="offer-heading"><h3 id="offer-title">取り引きの条件</h3><p>${editable ? '− / +で数量を調整。TabとEnterでも操作できます。' : '同意した条件を確認しています。'}</p></div>
        ${quantityRow(meeting, state, 'left')}
        <div class="offer-summary" aria-label="現在の条件"><strong>${displayedOffer.left}つの${escapeHtml(meeting.left.item)}</strong><span class="arrow">↔</span><strong>${displayedOffer.right}つの${escapeHtml(meeting.right.item)}</strong></div>
        ${quantityRow(meeting, state, 'right')}
        <div class="score-preview" aria-label="現在の収支予測">${scoreChip(meeting.left, preview.left)}${scoreChip(meeting.right, preview.right)}</div>
        <p class="score-rule">二人は別々に条件を判断します。収支と最新の返事を見ながら交渉できます。受諾は運で決まりません。</p>
      </section>
      ${negotiationMessage(state)}
      ${counterMarkup(meeting, state)}
      ${acceptedSummary(meeting, state)}
      ${atEnd ? '' : `<p class="decision-copy">${Engine.MEETINGS.length}組のうち${Engine.TARGET_DEALS}組の取り引き成立が目標。共通の手応えは、収支の小さい側の値で決まります。</p>`}
      ${actionMarkup(state)}
      <p class="game-footnote">制限時間や隠れた抽選、唯一の正解はありません。旅人は表示された優先事項に沿って判断します。断られるか、もう一度交渉を頼むとしんぼうを使います。</p>
    </section>`;
  }

  function render(focusAction, focusSide, focusDelta) {
    root.innerHTML = currentGame(state);
    if (liveMessage) liveMessage.textContent = state.message;
    if (focusAction) {
      const selector = focusAction === 'adjust'
        ? `button[data-action="adjust"][data-side="${focusSide}"][data-delta="${focusDelta}"]`
        : `button[data-action="${focusAction}"]`;
      let focusTarget = root.querySelector(selector);
      if (!focusTarget && focusAction === 'adjust') {
        const reverseDelta = focusDelta === '-1' ? '1' : '-1';
        focusTarget = root.querySelector(`button[data-action="adjust"][data-side="${focusSide}"][data-delta="${reverseDelta}"]`);
      }
      if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
    }
  }

  function onClick(event) {
    const button = event.target && typeof event.target.closest === 'function'
      ? event.target.closest('button[data-action]')
      : null;
    if (!button || !root.contains(button) || button.disabled || handlingClick) return;
    if (event.detail > 1) {
      event.preventDefault();
      return;
    }

    handlingClick = true;
    try {
      const action = button.dataset.action;
      if (action === 'adjust') {
        const side = button.dataset.side;
        const delta = Number(button.dataset.delta);
        state = Engine.adjust(state, side, delta);
        render('adjust', side, String(delta));
      } else if (action === 'submit') {
        state = Engine.submitOffer(state);
        render(state.phase === 'accepted' ? 'seal' : (state.meeting.counterOffer ? 'counter' : 'submit'));
      } else if (action === 'counter') {
        state = Engine.acceptCounter(state);
        render(state.phase === 'accepted' ? 'seal' : (state.meeting.counterOffer ? 'counter' : 'submit'));
      } else if (action === 'push') {
        state = Engine.requestBetterSplit(state);
        render('submit');
      } else if (action === 'seal') {
        state = Engine.sealDeal(state);
        render('advance');
      } else if (action === 'advance') {
        state = Engine.advanceMeeting(state);
        render(state.phase === 'result' ? 'retry' : 'submit');
      } else if (action === 'retry') {
        state = Engine.retry(state);
        render('submit');
      }
    } catch (error) {
      if (liveMessage) liveMessage.textContent = error.message;
    } finally {
      handlingClick = false;
    }
  }

  root.addEventListener('click', onClick);
  document.addEventListener('keydown', (event) => {
    if (event.repeat && ['Enter', ' ', 'Spacebar'].includes(event.key)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  render();
})(window, document);
