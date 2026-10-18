'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const E = require('../games/pottery-workshop/engine.js');
const routes = [
  [[3,1],[3,1],[2,1],[4,1],[2,1],[4,1],[1,1]],
  [[4,1],[4,1],[1,-1],[1,-1],[4,1],[5,1],[1,-1],[4,1],[0,-1],[0,-1],[1,-1],[3,1],[2,-1]],
  [[1,1],[1,1],[0,1],[0,1],[0,1],[1,1],[6,-1],[0,1],[6,-1],[1,1],[6,-1]]
];
const route = i => routes[i].reduce((s,[band,direction]) => E.stroke(s,band,direction), E.create(i));
test('all orders begin as fresh unmatched clay with independent arrays', () => {
  for(let i=0;i<3;i++){const a=E.create(i),b=E.create(i);assert.equal(a.order,i);assert.equal(a.remaining,E.ORDERS[i].budget);assert.notEqual(a.profile,b.profile);assert.equal(E.measure(a).ready,false);}
  for(const invalid of [-1,3,NaN,'1',null])assert.equal(E.create(invalid).order,0);
});
test('stroke changes center, neighbors and second neighbors exactly', () => {
  const s=E.create(); assert.deepEqual(E.stroke(s,3,1).profile,[52,53,54,56,54,53,48]);
  assert.deepEqual(E.stroke(s,0,-1).profile,[48,50,51,52,52,52,48]);
});
test('every accepted stroke costs exactly one effort and leaves its input unchanged', () => {
  const s=E.create(), before=JSON.stringify(s),n=E.stroke(s,3,1);
  assert.equal(JSON.stringify(s),before);assert.equal(n.remaining,s.remaining-1);assert.equal(n.used,1);assert.equal(n.selected,3);assert.notEqual(n.profile,s.profile);
});
test('height selection is free, immutable and bounded', () => {
  const s=E.create(),n=E.select(s,0);assert.equal(n.selected,0);assert.equal(s.selected,3);assert.equal(n.remaining,s.remaining);
  for(const index of [-1,7,2.5,NaN,'2'])assert.equal(E.select(s,index),s);
});
test('invalid actions neither mutate nor consume effort', () => {
  const s=E.create();for(const index of [-1,7,2.5,NaN,'2'])assert.equal(E.stroke(s,index,1),s);
  for(const direction of [0,2,-2,NaN,'1',null])assert.equal(E.stroke(s,3,direction),s);
});
test('width clamps at both physical limits', () => {
  let s={...E.create(),profile:Array(7).fill(E.MAX-1)};s=E.stroke(s,3,1);assert.ok(s.profile.every(v=>v<=E.MAX));assert.equal(s.profile[3],E.MAX);
  s={...E.create(),profile:Array(7).fill(E.MIN+1)};s=E.stroke(s,3,-1);assert.ok(s.profile.every(v=>v>=E.MIN));assert.equal(s.profile[3],E.MIN);
});
test('fully saturated gestures do not waste effort', () => {
  for(const d of [-1,1]){const s={...E.create(),profile:Array(7).fill(d<0?E.MIN:E.MAX)};assert.equal(E.stroke(s,3,d),s);}
});
test('reversing a stroke restores the shape but does not restore effort', () => {
  const s=E.create(),n=E.stroke(E.stroke(s,2,1),2,-1);assert.deepEqual(n.profile,s.profile);assert.equal(n.remaining,s.remaining-2);
});
test('neighbor effects may disturb an already matching band', () => {
  const s={...E.create(),profile:E.ORDERS[0].target.slice()};
  const n=E.stroke(E.stroke(E.stroke(s,2,1),2,1),2,1);assert.equal(E.measure(s).ready,true);assert.equal(E.measure(n).ready,false);assert.ok(E.measure(n).errors[1]>E.TOLERANCE);
});
test('zero effort stops further shaping while leaving kiln evaluation available', () => {
  let s=E.create();for(let i=0;i<100;i++)s=E.stroke(s,3,i%2?1:-1);
  assert.equal(s.remaining,0);assert.equal(s.used,14);assert.equal(E.stroke(s,3,1),s);assert.equal(E.fire(s).status,'lost');
});
test('a matching last-effort vessel can still succeed', () => {
  const s={...route(0),remaining:0};assert.equal(E.fire(s).status,'won');
});
test('kiln does not declare unworked clay a success', () => { const s=E.create(),n=E.fire(s);assert.equal(n.status,'lost');assert.equal(s.status,'shaping'); });
test('tolerance is inclusive and every band must match', () => {
  const s={...E.create(),profile:E.ORDERS[0].target.map(v=>v+4)};assert.equal(E.measure(s).ready,true);assert.equal(E.fire(s).status,'won');
  const n={...s,profile:s.profile.slice()};n.profile[6]++;assert.equal(E.measure(n).matched,6);assert.equal(E.fire(n).status,'lost');
});
for(let i=0;i<3;i++)test(`input-only route wins order ${i+1} within its effort budget`,()=>{const s=route(i);assert.equal(E.measure(s).matched,7);assert.equal(E.fire(s).status,'won');assert.equal(s.used,routes[i].length);assert.ok(s.remaining>=5);});
test('identical input routes reproduce identical state', () => {for(let i=0;i<3;i++)assert.deepEqual(route(i),route(i));});
test('measuring does not mutate state or target and reports actual errors', () => {
  const s=route(1),snapshot=JSON.stringify(s),order=JSON.stringify(E.ORDERS[1]);const m=E.measure(s);
  assert.equal(JSON.stringify(s),snapshot);assert.equal(JSON.stringify(E.ORDERS[1]),order);assert.deepEqual(m.errors,s.profile.map((v,i)=>Math.abs(v-E.ORDERS[1].target[i])));
});
test('both terminal outcomes lock further changes and duplicate firing', () => {
  for(const s of [E.fire(E.create()),E.fire(route(0))]){assert.equal(E.stroke(s,2,1),s);assert.equal(E.select(s,0),s);assert.equal(E.fire(s),s);}
});
test('retry is a clean identical order, not a remembered victory', () => {
  for(let i=0;i<3;i++){const won=E.fire(route(i)),restart=E.create(won.order);assert.deepEqual(restart,E.create(i));assert.equal(restart.used,0);assert.equal(restart.status,'shaping');}
});
