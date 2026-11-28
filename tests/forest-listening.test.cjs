'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../games/forest-listening/engine.js');
const start=()=>E.activate(E.start());
test('bearing wraps and shortest compass distance is circular',()=>{
 assert.equal(E.wrap(-1),359);assert.equal(E.wrap(361),1);assert.equal(E.error(359,1),2);assert.equal(E.error(0,180),180);
});
test('live strength peaks only at the audible bearing, with twelve steps after rounding',()=>{
 const s=start(), p=E.aim(s,34);
 assert.equal(p.heading,93);assert.equal(Math.round(E.strength(p)),12);
 assert.ok(E.strength(E.aim(p,1))>E.strength(E.aim(p,8)));
 assert.ok(E.strength(E.aim(p,8))>E.strength(E.aim(p,64)));
 assert.equal(E.strength(E.aim(p,99)),0);
});
test('two exact observations win 200/200, updating one history record each',()=>{
 let s=E.commit(E.aim(start(),34));
 assert.equal(s.mode,'between'); assert.equal(s.records.length,1);assert.equal(s.total,100);
 s=E.activate(s);assert.equal(s.round,1);assert.equal(s.time,20);
 s=E.commit(E.aim(s,206));assert.equal(s.mode,'win');assert.equal(s.records.length,2);assert.equal(s.total,200);
 assert.equal(E.commit(s),s);assert.equal(E.elapse(s,10),s);
});
test('timeout never silently scores accidental aim',()=>{
 let s=E.elapse(E.aim(start(),34),20);
 assert.equal(s.mode,'between');assert.equal(s.total,0);assert.equal(s.records[0].timeout,true);
 s=E.elapse(E.activate(s),20.2);assert.equal(s.mode,'loss');assert.equal(s.total,0);
});
test('two inaccurate bearings lose and report error & score',()=>{
 let s=E.commit(start());assert.equal(s.records[0].e,34);assert.equal(s.total,41);
 s=E.commit(E.activate(s));assert.equal(s.mode,'loss');assert.equal(s.records[1].e,120);
});
test('pause preserves time and direction, timeout happens only when active',()=>{
 const inFlight=E.elapse(E.aim(start(),-12),4.25),paused=E.pause(inFlight);
 assert.equal(paused.time,15.75);assert.equal(E.elapse(paused,400),paused);
 assert.equal(E.aim(paused,4),paused);assert.deepEqual(E.activate(paused),inFlight);
});
test('input validation and retry do not mutate a prior game',()=>{
 let old=E.commit(start()),prior=JSON.stringify(old);
 const s=E.start([17,221]);assert.equal(s.mode,'ready');assert.equal(s.time,20);assert.equal(s.records.length,0);
 assert.equal(E.aim(s,4),s);assert.equal(E.elapse(s,Infinity),s); assert.equal(JSON.stringify(old),prior);
});
test('input within roughly ten degrees can win without a perfect signal',()=>{
 let s=E.commit(E.aim(start(),24));assert.equal(s.total,83);
 s=E.commit(E.aim(E.activate(s),226));assert.equal(s.mode,'win');assert.equal(s.total,166);
});
