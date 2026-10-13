const test=require('node:test'),assert=require('node:assert/strict'),E=require('../games/lost-property/engine.js');
const assign=(s,a)=>a.reduce((s,item,person)=>E.act(s,{type:'assign',person,item}),s);
for(let n=0;n<3;n++){
 test(`case ${n} unique and win`,()=>{let c=E.cases[n];assert.equal(E.solutions(c).length,1);let s=assign(E.create(n),E.solutions(c)[0]);assert.equal(E.act(s,{type:'submit'}).status,'won')});
 test(`case ${n} invalid return loses and undo works`,()=>{let s=assign(E.create(n),[4,3,2]);let before=JSON.parse(JSON.stringify(s));s=E.act(s,{type:'submit'});assert.equal(s.status,'lost');assert.deepEqual(E.act(s,{type:'undo'}),before)});
 test(`case ${n} budget stops no auto failure`,()=>{let s=E.create(n);for(let i=0;i<5;i++)s=E.act(s,{type:'inspect',item:i});assert.equal(s.remaining,0);assert.equal(s.revealed.length,E.cases[n].budget);assert.equal(s.status,'playing');s=assign(s,E.solutions(E.cases[n])[0]);assert.equal(E.act(s,{type:'submit'}).status,'won')});
}
test('input immutability and repeat inspection',()=>{let a=E.create(),b=E.act(a,{type:'inspect',item:0});assert.equal(a.remaining,2);assert.equal(b.remaining,1);assert.deepEqual(E.act(b,{type:'inspect',item:0}),b)});
test('duplicate assignments move rather than duplicate',()=>{let s=assign(E.create(),[1,1,null]);assert.deepEqual(s.assigned,[null,1,null]);});
test('unassign and undo',()=>{let s=assign(E.create(),[0,null,null]);s=E.act(s,{type:'assign',person:0,item:null});assert.equal(s.assigned[0],null);assert.equal(E.act(s,{type:'undo'}).assigned[0],0)});
test('inspection cannot be undone for free information',()=>{let s=E.create();s=E.act(s,{type:'assign',person:0,item:0});s=E.act(s,{type:'inspect',item:0});s=E.act(s,{type:'undo'});assert.deepEqual(s.assigned,[null,null,null]);assert.deepEqual(s.revealed,[0]);assert.equal(s.remaining,1)});
test('incomplete submit and malformed input no op',()=>{let s=E.create();for(let a of [{type:'submit'},{type:'inspect',item:-1},{type:'inspect',item:NaN},{type:'assign',person:3,item:0},{type:'assign',person:0,item:99},{type:'case',value:50},{type:'undo'}])assert.deepEqual(E.act(s,a),s)});
test('terminal mutations suppressed except undo/reset/case',()=>{let s=E.act(assign(E.create(),[0,1,2]),{type:'submit'});for(let a of [{type:'inspect',item:0},{type:'assign',person:0,item:4},{type:'submit'}])assert.deepEqual(E.act(s,a),s);assert.deepEqual(E.act(s,{type:'reset'}),E.create());assert.deepEqual(E.act(s,{type:'case',value:2}),E.create(2))});
test('repeated cycles have clean resets',()=>{let s=E.create();for(let i=0;i<20;i++){s=E.act(s,{type:'inspect',item:0});s=E.act(assign(s,[0,1,2]),{type:'submit'});assert.equal(s.status,'won');s=E.act(s,{type:'reset'});assert.deepEqual(s,E.create());}});
