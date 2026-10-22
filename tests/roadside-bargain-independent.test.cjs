'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Engine = require('../games/roadside-bargain/engine.js');

// Deliberately duplicated as a hand-checkable oracle instead of deriving expected
// values from Engine.MEETINGS or Engine.scoreOffer.
const ORACLE = [
  { id: 'ridge-water', leftReceives: [2, 3, 1, 0], leftGives: [2, 1, 3, 4], rightReceives: [4, 1, 0, 0], rightGives: [2, 1, 3, 4] },
  { id: 'mill-bread', leftReceives: [4, 1, 0, 0], leftGives: [1, 3, 4, 6], rightReceives: [3, 2, 0, 0], rightGives: [1, 2, 4, 6] },
  { id: 'pass-lantern', leftReceives: [4, 3, 1, 0], leftGives: [2, 4, 5, 7], rightReceives: [3, 2, 1, 0], rightGives: [1, 2, 4, 6] }
];

function value(table, quantity) {
  let total = 0;
  for (let i = 0; i < quantity; i += 1) total += table[i];
  return total;
}

function oracleScore(entry, offer) {
  return {
    left: value(entry.leftReceives, offer.right) - value(entry.leftGives, offer.left),
    right: value(entry.rightReceives, offer.left) - value(entry.rightGives, offer.right)
  };
}

test('all 48 bounded quantity outcomes match an independently calculated marginal-value oracle', () => {
  assert.deepEqual(Engine.MEETINGS.map((meeting) => meeting.id), ORACLE.map((entry) => entry.id));
  for (let meetingIndex = 0; meetingIndex < ORACLE.length; meetingIndex += 1) {
    const entry = ORACLE[meetingIndex];
    const meeting = Engine.MEETINGS[meetingIndex];
    for (let left = 1; left <= 4; left += 1) {
      for (let right = 1; right <= 4; right += 1) {
        const offer = { left, right };
        assert.deepEqual(Engine.scoreOffer(meeting, offer), oracleScore(entry, offer), `${entry.id}: ${left}:${right}`);
      }
    }
  }
});

test('each meeting offers several acceptable deals and every suggested counter improves the dissatisfied side', () => {
  for (let index = 0; index < ORACLE.length; index += 1) {
    const oracle = ORACLE[index];
    const meeting = Engine.MEETINGS[index];
    let viablePairs = 0;
    for (let left = 1; left <= 4; left += 1) {
      for (let right = 1; right <= 4; right += 1) {
        const score = oracleScore(oracle, { left, right });
        if (score.left >= 0 && score.right >= 0) viablePairs += 1;
      }
    }
    assert.ok(viablePairs >= 3, `${oracle.id} offers multiple genuinely different settlements`);

    for (let left = 1; left <= 4; left += 1) {
      for (let right = 1; right <= 4; right += 1) {
        const offer = { left, right };
        const current = oracleScore(oracle, offer);
        if (current.left >= 0 && current.right >= 0) continue;
        let state = Engine.create();
        for (let step = 0; step < index; step += 1) {
          state = Engine.submitOffer(state);
          if (state.phase === 'counter') state = Engine.acceptCounter(state);
          state = Engine.advanceMeeting(Engine.sealDeal(state));
        }
        while (state.meeting.amounts.left !== left) state = Engine.adjust(state, 'left', Math.sign(left - state.meeting.amounts.left));
        while (state.meeting.amounts.right !== right) state = Engine.adjust(state, 'right', Math.sign(right - state.meeting.amounts.right));
        state = Engine.submitOffer(state);
        if (state.phase !== 'counter' || !state.meeting.counterOffer) continue;
        const counter = state.meeting.counterOffer;
        const counterScore = oracleScore(oracle, counter.amounts);
        assert.ok(counterScore.left >= 0 && counterScore.right >= 0, `${oracle.id} counter must be feasible for both`);
        assert.ok(counterScore[counter.fromSide] > current[counter.fromSide], `${oracle.id} counter must answer ${counter.fromSide}'s refusal`);
      }
    }
  }
});
