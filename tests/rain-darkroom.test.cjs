const {test}=require('node:test'),a=require('node:assert/strict'),E=require('../games/rain-darkroom/engine');
test('timer waits for explicit start and finish has no effect beforehand',()=>{const s=E.fresh();E.tick(s,9);E.finish(s);a.equal(s.phase,'ready');a.equal(s.time,0)});
test('mask prevents exposure only for its zone and can be removed',()=>{const s=E.fresh();E.mask(s,1);E.light(s);E.tick(s,2);a.deepEqual(s.dose,[2.2,0,1.64]);E.mask(s,1);E.tick(s,1);a.equal(s.dose[1],.94)});
test('off uses clock but adds no exposure',()=>{const s=E.fresh();E.light(s);E.tick(s,1);E.light(s);E.tick(s,2);a.deepEqual(s.dose,E.RATE);a.equal(s.time,3)});
test('hold-all policy must fail: nominal timing windows are disjoint',()=>{for(let t=0;t<=18;t+=.01){const s=E.fresh();E.light(s);E.tick(s,t);E.finish(s);a.equal(s.phase,'loss')}});
test('independent schedule finds a legal win and timing margin',()=>{
 for(const speed of [.955,1,1.045]){
  const s=E.fresh();E.light(s);
  for(const [i,t] of [[0,3.3],[1,6.2],[2,9.5]]){E.tick(s,t*speed-s.time);E.mask(s,i)}
  E.finish(s);a.equal(s.phase,'win');a.deepEqual(s.result,['適正','適正','適正']);
 }
});
test('timeout settles exactly once and clamps oversize frame',()=>{const s=E.fresh();E.light(s);E.tick(s,500);E.tick(s,1);a.equal(s.time,18);a.deepEqual(s.result,['過多','過多','過多']);a.equal(s.phase,'loss');a.equal(s.light,false)});
test('retry creates independent state; invalid inputs do not corrupt results',()=>{const s=E.fresh();E.mask(s,0);E.tick(s,NaN);E.mask(s,99);a.deepEqual(E.fresh().mask,[false,false,false]);a.equal(s.mask.length,3)});
