'use strict';
const assert = require('node:assert/strict');
const E = require('../games/pocket-forest/engine.js');
let checks = 0;
for (let seed = 0; seed < 100; seed++) {
  let s = E.createGame(`independent-${seed}`);
  const initial = JSON.stringify(s);
  const route = [];
  for (let t = 0; t < 12; t++) {
    const empty = s.board.map((v,i)=>v ? -1:i).filter(i=>i>=0);
    const index = empty[(seed * 7 + t * 11) % empty.length];
    const type = s.offers[t][(seed+t)%2];
    const snapshot = JSON.stringify(s);
    const p = E.preview(s,type,index);
    const r = E.place(s,type,index);
    assert.equal(JSON.stringify(s),snapshot,'preview/place must not mutate input');
    assert.deepEqual(p.beforeHabitats,E.activeHabitats(s));
    assert.deepEqual(p.habitats,E.activeHabitats(r.state));
    assert.equal(p.gained,r.state.score-s.score);
    assert.equal(p.species,E.getStatus(r.state).species);
    assert.equal(r.state.turn,t+1);
    assert.equal(r.state.history.length,t+1);
    assert.equal(r.state.board.filter(Boolean).length,t+1);
    assert.equal(r.state.ended,t===11);
    assert.equal(r.state.won,t===11 && E.outcome(r.state).won);
    const u=E.undo(r.state);
    assert.deepEqual(u.state,s,'undo restores complete prior state');
    route.push([type,index]); s=r.state; checks++;
  }
  const final = JSON.stringify(s);
  assert.equal(E.place(s,'forest',24).ok,false);
  assert.equal(JSON.stringify(s),final);
  assert.equal(E.preview(s,'forest',24).ok,false);
  while(s.history.length)s=E.undo(s).state;
  assert.equal(JSON.stringify(s),initial);
  assert.deepEqual(E.retry(s.seed),s);
}
// Orthogonal boundaries: no row-wrap and no diagonal adjacency.
for(const cells of [[4,5,6],[0,6,12]]) {
  const s=E.createGame(); for(const i of cells)s.board[i]={type:'forest',id:i};
  assert.equal(E.activeHabitats(s).fox,0);
}
console.log(`PASS: ${checks} legal placements across 100 seeds; preview parity, immutability, complete undo, retry, end freeze, adjacency boundaries`);
