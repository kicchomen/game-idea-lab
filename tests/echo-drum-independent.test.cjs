'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('../games/echo-drum/engine.js');
const reply=()=>E.advance(E.start(E.create()),E.COUNT+E.LENGTH);
function at(s,time){return E.advance(s,time-s.time);}
function perform(offset=0,skip=new Set()) {let s=E.start(E.create()),global=0;for(let p=0;p<3;p++){s=E.advance(s,E.COUNT+E.LENGTH);for(const t of E.PHRASES[p].notes){s=at(s,t+offset);if(!skip.has(global))s=E.hit(s);global++;}s=at(s,E.LENGTH);if(p<2)s=E.next(s);}return s;}
test('independent: exactly fifteen authored notes, three distinct phrases',()=>{assert.equal(E.PHRASES.reduce((a,p)=>a+p.notes.length,0),15);assert.equal(new Set(E.PHRASES.map(p=>JSON.stringify(p.notes))).size,3);});
test('independent: center and both timing boundaries win all fifteen',()=>{for(const offset of [-.16,0,.16]){const s=perform(offset);assert.equal(s.status,'won');assert.equal(s.hits,15);assert.equal(s.errors,0);}});
test('independent: ±161ms is not accepted as the first note',()=>{for(const offset of [-.161,.161]){const s=E.hit(at(reply(),offset));assert.equal(s.hits,0);assert(s.errors>=1);}});
test('independent: three missed notes still allow a twelve-note win',()=>{const s=perform(0,new Set([0,4,9]));assert.equal(s.status,'won');assert.equal(s.hits,12);assert.equal(s.errors,3);});
test('independent: four missed notes terminate early',()=>{const s=at(reply(),3);assert.equal(s.status,'lost');assert.equal(s.hits,0);assert.equal(s.errors,4);});
test('independent: four distinct spam strikes cannot manufacture hits',()=>{let s=at(reply(),-.24);for(let i=0;i<4;i++)s=E.hit(s);assert.equal(s.status,'lost');assert.equal(s.hits,0);assert.equal(s.errors,4);});
test('independent: same note cannot be scored twice',()=>{let s=E.hit(at(reply(),0));s=E.hit(s);assert.equal(s.hits,1);assert.equal(s.errors,1);});
test('independent: paused state rejects time and hits then resumes identically',()=>{const live=at(reply(),-.1),paused=E.pause(live);assert.equal(E.advance(paused,100),paused);assert.equal(E.hit(paused),paused);assert.deepEqual(E.resume(paused),live);assert.equal(E.hit(E.resume(paused)).hits,1);});
test('independent: listening and early countdown never penalize input',()=>{for(const s of [E.create(),E.start(E.create()),reply()])assert.equal(E.hit(s),s);});
test('independent: ended run is immutable and fresh retry resets all counters',()=>{for(const s of [perform(),at(reply(),3)]){assert.equal(E.advance(s,100),s);assert.equal(E.hit(s),s);assert.equal(E.next(s),s);}const r=E.start(E.create());assert.equal(r.hits,0);assert.equal(r.errors,0);assert.equal(r.phrase,0);assert.equal(r.best,0);});
test('independent: frame partitions agree across call/reply boundary',()=>{const s=E.start(E.create());let small=s;for(let i=0;i<480;i++)small=E.advance(small,1/60);const large=E.advance(s,8);assert.equal(small.phase,large.phase);assert.equal(small.status,large.status);assert(Math.abs(small.time-large.time)<1e-9);assert.deepEqual(small.judged,large.judged);});
test('independent: input functions never mutate their original state',()=>{const s=at(reply(),0),before=JSON.stringify(s);E.hit(s);E.advance(s,.3);E.pause(s);assert.equal(JSON.stringify(s),before);});
