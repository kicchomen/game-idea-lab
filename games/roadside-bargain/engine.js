(function attachRoadsideBargainEngine(root, factory) {
  const engine = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  if (root) root.RoadsideBargainEngine = engine;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createEngine() {
  'use strict';

  const MAX_QUANTITY = 4;
  const MAX_PATIENCE = 4;
  const TARGET_DEALS = 2;

  const MEETINGS = [
    {
      id: 'ridge-water',
      name: '尾根道',
      left: {
        name: 'ミナ',
        role: '地図職人',
        mark: 'M',
        item: '道の地図',
        needItem: '水筒',
        says: '尾根を越える水が必要なの。書き込みのある地図は手放せないけれど、予備なら譲れるわ。',
        needLine: '尾根越えの水が必要',
        keepLine: '書き込みのある地図は大切。予備なら手放しやすい',
        receiveValues: [2, 3, 1, 0],
        giveCosts: [2, 1, 3, 4]
      },
      right: {
        name: 'タロウ',
        role: '峠越えの旅人',
        mark: 'T',
        item: '水筒',
        needItem: '道の地図',
        says: '安全な道が知りたいんだ。水なら分けられるけれど、最後の一本は急な峠で使うよ。',
        needLine: '安全な道の地図が必要',
        keepLine: '水は分けられるが、最後の一本は峠に残したい',
        receiveValues: [4, 1, 0, 0],
        giveCosts: [2, 1, 3, 4]
      },
      opening: { left: 2, right: 1 },
      counterIntro: 'ミナは予備の地図を譲るかわりに、水筒をもう一本求める。'
    },
    {
      id: 'mill-bread',
      name: '古い水車小屋',
      left: {
        name: 'スミ',
        role: '布の繕い屋',
        mark: 'S',
        item: '麻布',
        needItem: 'パン',
        says: '今夜の食べ物が必要なの。仕事に使う麻布は残したいけれど、修繕用の予備ならあるわ。',
        needLine: '今夜のパンが必要',
        keepLine: '仕事用の一枚は残したい。予備の麻布なら譲りやすい',
        receiveValues: [4, 1, 0, 0],
        giveCosts: [1, 3, 4, 6]
      },
      right: {
        name: 'エイト',
        role: '水車小屋のパン職人',
        mark: 'E',
        item: 'パン',
        needItem: '麻布',
        says: '雨から粉袋を守る布がほしいんだ。パンは一つなら譲れるよ。残りは仲間の分なんだ。',
        needLine: '粉袋を守る麻布が必要',
        keepLine: 'パンは一つなら譲れる。二つ目からは仲間の分',
        receiveValues: [3, 2, 0, 0],
        giveCosts: [1, 2, 4, 6]
      },
      opening: { left: 1, right: 2 },
      counterIntro: 'スミは麻布一枚とパン二つを提案。両者とも同意できるが、収支には差がある。'
    },
    {
      id: 'pass-lantern',
      name: '杉の峠',
      left: {
        name: 'ニマ',
        role: '道灯りの番人',
        mark: 'N',
        item: '灯油瓶',
        needItem: '毛布',
        says: '日が暮れると峠は冷えるの。毛布が必要だけれど、道を照らす灯油なら少し分けられるわ。',
        needLine: '夜の峠で使う毛布が必要',
        keepLine: '道を照らす灯油は必要。二瓶目からは少しずつ譲れる',
        receiveValues: [4, 3, 1, 0],
        giveCosts: [2, 4, 5, 7]
      },
      right: {
        name: 'パベル',
        role: '毛布織り',
        mark: 'P',
        item: '毛布',
        needItem: '灯油瓶',
        says: '毛布は暖かいよ。でも帰り道の灯りがほしい。一枚なら譲れる。',
        needLine: '帰り道を照らす灯油が必要',
        keepLine: '毛布は一枚なら譲れる。二枚目からは手放しにくい',
        receiveValues: [3, 2, 1, 0],
        giveCosts: [1, 2, 4, 6]
      },
      opening: { left: 2, right: 1 },
      counterIntro: 'ニマは、灯油を一瓶に減らして毛布を受け取る条件を提案する。'
    }
  ];

  function copy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function freshMeeting(index) {
    return {
      status: 'negotiating',
      amounts: { left: MEETINGS[index].opening.left, right: MEETINGS[index].opening.right },
      patience: { left: MAX_PATIENCE, right: MAX_PATIENCE },
      attempts: 0,
      lastOffer: null,
      lastResponses: { left: '最初の提案を待っています。', right: '最初の提案を待っています。' },
      counterOffer: null,
      reopenedFrom: null
    };
  }

  function create() {
    return {
      phase: 'offer',
      meetingIndex: 0,
      meeting: freshMeeting(0),
      history: [],
      sharedWarmth: 0,
      message: '二人の話を聞き、数量を決めて提案しよう。'
    };
  }

  function getMeeting(state) {
    if (!state || !Number.isInteger(state.meetingIndex) || state.meetingIndex < 0 || state.meetingIndex >= MEETINGS.length) {
      throw new Error('No active meeting');
    }
    return MEETINGS[state.meetingIndex];
  }

  function sumMarginals(values, quantity) {
    return values.slice(0, quantity).reduce((total, value) => total + value, 0);
  }

  function scoreOffer(meeting, amounts) {
    const left = sumMarginals(meeting.left.receiveValues, amounts.right)
      - sumMarginals(meeting.left.giveCosts, amounts.left);
    const right = sumMarginals(meeting.right.receiveValues, amounts.left)
      - sumMarginals(meeting.right.giveCosts, amounts.right);
    return { left, right };
  }

  function preview(state) {
    return scoreOffer(getMeeting(state), state.meeting.amounts);
  }

  function validateQuantity(quantity) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
      throw new Error(`Quantity must be between 1 and ${MAX_QUANTITY}`);
    }
  }

  function adjust(state, side, delta) {
    if (!['offer', 'counter'].includes(state.phase)) throw new Error('Terms can only change during negotiation');
    if (!['left', 'right'].includes(side) || ![-1, 1].includes(delta)) throw new Error('Unknown quantity adjustment');
    const nextQuantity = state.meeting.amounts[side] + delta;
    validateQuantity(nextQuantity);
    const next = copy(state);
    next.meeting.amounts[side] = nextQuantity;
    next.phase = 'offer';
    next.meeting.counterOffer = null;
    next.message = '数量を変えた。提案を送って二人の返事を聞こう。';
    return next;
  }

  function counterCandidates(meeting, amounts, rejectedSides) {
    const target = rejectedSides.slice().sort((a, b) => {
      const scores = scoreOffer(meeting, amounts);
      return scores[a] - scores[b];
    })[0];
    const candidates = [];
    for (const side of ['left', 'right']) {
      for (const delta of [-1, 1]) {
        const quantity = amounts[side] + delta;
        if (quantity < 1 || quantity > MAX_QUANTITY) continue;
        const proposed = { left: amounts.left, right: amounts.right, [side]: quantity };
        const scores = scoreOffer(meeting, proposed);
        if (scores.left < 0 || scores.right < 0 || scores[target] <= scoreOffer(meeting, amounts)[target]) continue;
        candidates.push({ amounts: proposed, scores, fromSide: target });
      }
    }
    candidates.sort((a, b) => {
      const aFloor = Math.min(a.scores.left, a.scores.right);
      const bFloor = Math.min(b.scores.left, b.scores.right);
      if (aFloor !== bFloor) return bFloor - aFloor;
      const aGap = Math.abs(a.scores.left - a.scores.right);
      const bGap = Math.abs(b.scores.left - b.scores.right);
      if (aGap !== bGap) return aGap - bGap;
      if (a.scores[target] !== b.scores[target]) return b.scores[target] - a.scores[target];
      return 0;
    });
    return candidates[0] ? { ...candidates[0], fromSide: target } : null;
  }

  function responseFor(side, net, meeting, amounts) {
    const person = meeting[side];
    if (net >= 0) return `${person.name}「収支は${net >= 0 ? '+' : ''}${net}。この条件なら同意できるよ。」`;
    return `${person.name}「${person.item}${amounts[side]}つを${person.needItem}${amounts[side === 'left' ? 'right' : 'left']}つと交換する条件では、収支が${net}。もう少し調整したい。」`;
  }

  function submitOffer(state) {
    if (!['offer', 'counter'].includes(state.phase)) throw new Error('There is no offer to send now');
    const meeting = getMeeting(state);
    const amounts = copy(state.meeting.amounts);
    if (state.meeting.reopenedFrom
      && amounts.left === state.meeting.reopenedFrom.left
      && amounts.right === state.meeting.reopenedFrom.right) {
      throw new Error('Change at least one quantity before asking for a better split');
    }
    const scores = scoreOffer(meeting, amounts);
    const rejected = ['left', 'right'].filter((side) => scores[side] < 0);
    const next = copy(state);
    next.meeting.attempts += 1;
    next.meeting.lastOffer = { amounts, scores };
    next.meeting.counterOffer = null;
    next.meeting.reopenedFrom = null;
    next.meeting.lastResponses = {
      left: responseFor('left', scores.left, meeting, amounts),
      right: responseFor('right', scores.right, meeting, amounts)
    };

    if (rejected.length === 0) {
      next.phase = 'accepted';
      next.message = `二人とも同意した。${meeting.left.name}は${scores.left >= 0 ? '+' : ''}${scores.left}、${meeting.right.name}は${scores.right >= 0 ? '+' : ''}${scores.right}。このまま決めるか、しんぼうを使ってもう一度交渉できる。`;
      return next;
    }

    for (const side of rejected) next.meeting.patience[side] -= 1;
    const leftLeft = next.meeting.patience.left;
    const rightLeft = next.meeting.patience.right;
    const counterOffer = counterCandidates(meeting, amounts, rejected);
    next.meeting.counterOffer = counterOffer;

    const walkers = rejected.filter((side) => next.meeting.patience[side] <= 0);
    if (walkers.length > 0) {
      next.phase = 'meeting-end';
      next.meeting.status = 'walked';
      next.message = `${walkers.map((side) => meeting[side].name).join('と')}はしんぼうが尽きて立ち去った。取り引きは成立しない。`;
      return next;
    }

    next.phase = 'counter';
    if (counterOffer) {
      const leftItem = meeting.left.item;
      const rightItem = meeting.right.item;
      next.message = `${meeting[counterOffer.fromSide].name}からの再提案：${leftItem}${counterOffer.amounts.left}つと${rightItem}${counterOffer.amounts.right}つ。二人の収支がともに0以上になる条件だ。`;
    } else {
      next.message = `${rejected.map((side) => meeting[side].name).join('と')}には条件が足りない。すぐに両者が同意できる再提案は見つからないので、数量を自分で調整しよう。`;
    }
    next.message += ` しんぼう：${meeting.left.name} ${leftLeft}/${MAX_PATIENCE}、${meeting.right.name} ${rightLeft}/${MAX_PATIENCE}。`;
    return next;
  }

  function acceptCounter(state) {
    if (state.phase !== 'counter' || !state.meeting.counterOffer) throw new Error('There is no workable counteroffer');
    const next = copy(state);
    next.meeting.amounts = copy(state.meeting.counterOffer.amounts);
    next.phase = 'offer';
    next.message = '相手の再提案を試す。二人はこの条件に返事をする。';
    return submitOffer(next);
  }

  function requestBetterSplit(state) {
    if (state.phase !== 'accepted') throw new Error('A better split can only be requested after an agreement');
    if (state.meeting.patience.left < 2 || state.meeting.patience.right < 2) {
      throw new Error('二人とも、もう一度話すためのしんぼうが必要です');
    }
    const meeting = getMeeting(state);
    const next = copy(state);
    next.meeting.patience.left -= 1;
    next.meeting.patience.right -= 1;
    next.phase = 'offer';
    next.meeting.reopenedFrom = copy(next.meeting.amounts);
    next.message = 'もう一度、条件の調整を頼んだ。二人のしんぼうが一つ減った。数量を変えて次の提案をしよう。';
    next.meeting.lastResponses = {
      left: `${meeting.left.name}はもう一度聞くが、しんぼうは少なくなった。`,
      right: `${meeting.right.name}はもう一度聞くが、しんぼうは少なくなった。`
    };
    return next;
  }

  function sealDeal(state) {
    if (state.phase !== 'accepted') throw new Error('Both travelers must accept before sealing a deal');
    const meeting = getMeeting(state);
    const offer = state.meeting.lastOffer;
    const shared = Math.min(offer.scores.left, offer.scores.right);
    const next = copy(state);
    next.history.push({
      meetingId: meeting.id,
      meetingName: meeting.name,
      leftName: meeting.left.name,
      rightName: meeting.right.name,
      leftItem: meeting.left.item,
      rightItem: meeting.right.item,
      amounts: copy(offer.amounts),
      scores: copy(offer.scores),
      sharedWarmth: shared
    });
    next.sharedWarmth += shared;
    next.meeting.status = 'sealed';
    next.phase = 'meeting-end';
    next.message = `${meeting.left.name}と${meeting.right.name}の取り引きがまとまった。二人の共通の手応えは+${shared}。`;
    return next;
  }

  function advanceMeeting(state) {
    if (state.phase !== 'meeting-end') throw new Error('Finish the current meeting first');
    const nextIndex = state.meetingIndex + 1;
    if (nextIndex >= MEETINGS.length) {
      const next = copy(state);
      next.phase = 'result';
      next.message = next.history.length >= TARGET_DEALS
        ? `取り引きが${next.history.length}件まとまり、道が開けた。`
        : `成立した取り引きは${next.history.length}件。道を開くには${TARGET_DEALS}件必要だ。`;
      return next;
    }
    return {
      ...copy(state),
      phase: 'offer',
      meetingIndex: nextIndex,
      meeting: freshMeeting(nextIndex),
      message: '次の二人の話を聞き、数量を決めて提案しよう。'
    };
  }

  function retry(state) {
    if (state.phase !== 'result') throw new Error('Retry is available after the route ends');
    return create();
  }

  return {
    MAX_QUANTITY,
    MAX_PATIENCE,
    TARGET_DEALS,
    MEETINGS,
    create,
    getMeeting,
    preview,
    scoreOffer,
    adjust,
    submitOffer,
    acceptCounter,
    requestBetterSplit,
    sealDeal,
    advanceMeeting,
    retry
  };
});
