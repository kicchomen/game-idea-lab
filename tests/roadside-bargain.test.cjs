'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../games/roadside-bargain/engine.js');

function sendOpeningOffer(state) {
  return E.submitOffer(state);
}

function exhaustMeeting(state, leftQty = 4, rightQty = 1) {
  let next = state;
  while (next.phase !== 'meeting-end') {
    while (next.meeting.amounts.left < leftQty) next = E.adjust(next, 'left', 1);
    while (next.meeting.amounts.left > leftQty) next = E.adjust(next, 'left', -1);
    while (next.meeting.amounts.right < rightQty) next = E.adjust(next, 'right', 1);
    while (next.meeting.amounts.right > rightQty) next = E.adjust(next, 'right', -1);
    next = E.submitOffer(next);
  }
  return next;
}

test('route starts deterministically with three distinct conversations and visible priorities', () => {
  const first = E.create();
  const second = E.create();
  assert.deepEqual(first, second);
  assert.equal(first.phase, 'offer');
  assert.equal(first.meetingIndex, 0);
  assert.equal(first.meeting.amounts.left, 2);
  assert.equal(first.meeting.amounts.right, 1);
  assert.equal(E.MEETINGS.length, 3);
  assert.deepEqual(E.MEETINGS.map((meeting) => meeting.id), ['ridge-water', 'mill-bread', 'pass-lantern']);
  for (const meeting of E.MEETINGS) {
    assert.ok(meeting.left.says.length > 10);
    assert.ok(meeting.right.says.length > 10);
    assert.equal(meeting.left.receiveValues.length, E.MAX_QUANTITY);
    assert.equal(meeting.right.giveCosts.length, E.MAX_QUANTITY);
  }
});

test('each meeting has at least three different mutually acceptable quantity pairs', () => {
  for (const meeting of E.MEETINGS) {
    const workable = [];
    for (let left = 1; left <= E.MAX_QUANTITY; left += 1) {
      for (let right = 1; right <= E.MAX_QUANTITY; right += 1) {
        const score = E.scoreOffer(meeting, { left, right });
        if (score.left >= 0 && score.right >= 0) workable.push([left, right]);
      }
    }
    assert.ok(workable.length >= 3, `${meeting.id} has ${workable.length} acceptable pairs`);
  }
});

test('first traveler counters against the exact opening offer and can be accepted', () => {
  const state = E.create();
  const original = structuredClone(state);
  const rejected = sendOpeningOffer(state);
  assert.deepEqual(state, original, 'proposing an offer leaves the previous state untouched');
  assert.equal(rejected.phase, 'counter');
  assert.deepEqual(rejected.meeting.lastOffer.amounts, { left: 2, right: 1 });
  assert.deepEqual(rejected.meeting.lastOffer.scores, { left: -1, right: 3 });
  assert.deepEqual(rejected.meeting.patience, { left: 3, right: 4 });
  assert.deepEqual(rejected.meeting.counterOffer.amounts, { left: 2, right: 2 });
  assert.equal(rejected.meeting.counterOffer.fromSide, 'left');
  assert.match(rejected.message, /道の地図2つと水筒2つ/);

  const accepted = E.acceptCounter(rejected);
  assert.equal(accepted.phase, 'accepted');
  assert.deepEqual(accepted.meeting.lastOffer.amounts, { left: 2, right: 2 });
  assert.deepEqual(accepted.meeting.lastOffer.scores, { left: 2, right: 2 });
  assert.equal(accepted.meeting.attempts, 2);
  assert.equal(accepted.history.length, 0, 'acceptance is not sealed until the mediator chooses it');

  const sealed = E.sealDeal(accepted);
  assert.equal(sealed.phase, 'meeting-end');
  assert.equal(sealed.history.length, 1);
  assert.equal(sealed.sharedWarmth, 2);
  assert.equal(sealed.meeting.status, 'sealed');
});

test('mill opening is accepted, but a better balanced split costs both travelers patience', () => {
  let state = E.create();
  state = E.advanceMeeting(E.sealDeal(E.acceptCounter(E.submitOffer(state))));
  assert.equal(state.meetingIndex, 1);
  assert.deepEqual(state.meeting.amounts, { left: 1, right: 2 });

  state = E.submitOffer(state);
  assert.equal(state.phase, 'accepted');
  assert.deepEqual(state.meeting.lastOffer.scores, { left: 4, right: 0 });
  assert.equal(state.meeting.patience.left, 4);
  assert.equal(state.meeting.patience.right, 4);
  const reopened = E.requestBetterSplit(state);
  assert.throws(() => E.submitOffer(reopened), /Change at least one quantity/);
  assert.deepEqual(reopened.meeting.patience, { left: 3, right: 3 });
  const revised = E.adjust(reopened, 'right', -1);
  const better = E.submitOffer(revised);
  assert.equal(better.phase, 'accepted');
  assert.deepEqual(better.meeting.lastOffer.amounts, { left: 1, right: 1 });
  assert.deepEqual(better.meeting.lastOffer.scores, { left: 3, right: 2 });
  assert.equal(E.sealDeal(better).history.at(-1).sharedWarmth, 2);
});

test('counterproposals vary by conversation and manual changes can replace them', () => {
  let state = E.create();
  state = E.sealDeal(E.acceptCounter(E.submitOffer(state)));
  state = E.advanceMeeting(state);
  state = E.submitOffer(state);
  assert.equal(state.phase, 'accepted', 'the mill opening has its own viable terms');
  state = E.requestBetterSplit(state);
  state = E.adjust(state, 'right', 1);
  assert.equal(state.phase, 'offer');
  assert.equal(state.meeting.counterOffer, null);
  assert.throws(() => E.acceptCounter(state), /no workable counteroffer/);
  assert.throws(() => E.adjust(state, 'left', -1), /between 1 and 4/);
});

test('an unchanged offer cannot spend a second negotiation beat', () => {
  let state = E.create();
  state = E.sealDeal(E.acceptCounter(E.submitOffer(state)));
  state = E.advanceMeeting(state);
  state = E.submitOffer(state);
  state = E.requestBetterSplit(state);
  assert.throws(() => E.submitOffer(state), /Change at least one quantity/);
  assert.equal(state.meeting.attempts, 1);
  assert.deepEqual(state.meeting.patience, { left: 3, right: 3 });
});

test('acceptance follows visible balances with no random decision', () => {
  const meeting = E.MEETINGS[0];
  const first = E.scoreOffer(meeting, { left: 1, right: 1 });
  const alternative = E.scoreOffer(meeting, { left: 1, right: 2 });
  assert.deepEqual(first, { left: 0, right: 2 });
  assert.deepEqual(alternative, { left: 3, right: 1 });
  assert.deepEqual(E.scoreOffer(meeting, { left: 4, right: 1 }), { left: -8, right: 3 });
  assert.equal(E.MEETINGS[0].left.receiveValues[0], 2);
});

test('four refusals use patience, close a failed meeting, and route retry resets everything', () => {
  let state = exhaustMeeting(E.create(), 4, 1);
  assert.equal(state.phase, 'meeting-end');
  assert.equal(state.meeting.status, 'walked');
  assert.equal(state.meeting.patience.left, 0);
  assert.equal(state.history.length, 0);

  state = E.advanceMeeting(state);
  state = exhaustMeeting(state, 4, 1);
  state = E.advanceMeeting(state);
  state = exhaustMeeting(state, 4, 1);
  state = E.advanceMeeting(state);
  assert.equal(state.phase, 'result');
  assert.equal(state.history.length, 0);
  assert.match(state.message, /2件必要/);

  const retry = E.retry(state);
  assert.equal(retry.phase, 'offer');
  assert.equal(retry.meetingIndex, 0);
  assert.deepEqual(retry.meeting.patience, { left: 4, right: 4 });
  assert.deepEqual(retry.history, []);
  assert.deepEqual(retry.meeting.amounts, { left: 2, right: 1 });
});

test('phase and quantity guards prevent invalid or repeated terminal actions', () => {
  let state = E.create();
  assert.throws(() => E.sealDeal(state), /must accept/);
  assert.throws(() => E.acceptCounter(state), /no workable counteroffer/);
  assert.throws(() => E.adjust(state, 'middle', 1), /Unknown quantity/);
  assert.throws(() => E.adjust(state, 'left', 0), /Unknown quantity/);
  const oneLess = E.adjust(state, 'left', -1);
  assert.throws(() => E.adjust(oneLess, 'left', -1), /between 1 and 4/);

  state = E.sealDeal(E.acceptCounter(E.submitOffer(state)));
  assert.throws(() => E.sealDeal(state), /must accept/);
  assert.throws(() => E.advanceMeeting(E.create()), /Finish the current meeting/);
});
