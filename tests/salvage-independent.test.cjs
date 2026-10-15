'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const E=require('../games/salvage-diver/engine.js');
function play(stage,route){return route.split(' ').reduce((s,a)=>E.act(s,a==='+'?{type:'collect'}:a==='>'?{type:'dive'}:a==='x'?{type:'drop'}:{type:'move',to:a}),E.create(stage));}
function returns(stage){const queue=[[E.act(E.create(stage),{type:'dive'}),' >']],seen=new Set(),found=[];for(let i=0;i<queue.length;i++){const [s,path]=queue[i];const key=[s.room,s.air,s.remaining.map(x=>x.id).join(''),s.cargo.map(x=>x.id).sort().join('')].join('|');if(seen.has(key))continue;seen.add(key);for(const a of [{type:'collect'},...E.adjacent(s.room).map(to=>({type:'move',to}))]){const n=E.act(s,a);if(n===s||n.phase==='lost')continue;const p=path+' '+(a.type==='collect'?'+':a.to);if(n.room==='S')found.push({bank:n.bank,air:n.air,path:p});else queue.push([n,p]);}}return found;}
for(let stage=0;stage<3;stage++){
 test('independent exhaustive single-dive search '+stage,()=>{const all=returns(stage);assert(all.length>0);assert(all.some(x=>x.bank===E.STAGES[stage].items[4][2]),'deep item safely recoverable');assert.equal(Math.max(...all.map(x=>x.bank)),[18,22,27][stage]);});
 test('independent safe individual-item strategy '+stage,()=>{const s=play(stage,'> A C + A S > B D + B S > A C E + C A S');assert.equal(s.phase,'won');assert(s.bank>=E.STAGES[stage].quota);});
 test('independent shallow strategy only suffices in first two seas '+stage,()=>{const s=play(stage,'> A + C + A S > B + D + B S');assert.equal(s.phase,stage===2?'dock':'won');assert.equal(s.dives,2);});
}
test('first sea exact-air gamble succeeds only upon banking',()=>{const pending=play(0,'> A C E + C A +');assert.equal(pending.phase,'diving');assert.equal(pending.bank,0);assert.equal(pending.air,4);const s=E.act(pending,{type:'move',to:'S'});assert.equal(s.phase,'won');assert.equal(s.bank,15);assert.equal(s.air,0);});
test('extra detour after collecting deep item really loses',()=>{const s=play(0,'> A C E + C A D B S');assert.equal(s.phase,'lost');assert.equal(s.bank,0);});
test('lightening cargo changes a failing return into a safe empty return',()=>{const stuck=play(1,'> A C E + D + E');assert.equal(stuck.phase,'diving');assert(stuck.air<E.returnCost(stuck));const safe=play(1,'> A C E + D + E x C A S');assert.equal(safe.phase,'dock');assert.equal(safe.bank,0);assert.equal(safe.air,0);assert(!safe.remaining.some(i=>i.room==='E'));});
test('retry after actual failure clears all expedition changes',()=>{const s=play(2,'> A S > A S > A S');assert.equal(s.phase,'lost');assert.deepEqual(E.act(s,{type:'retry'}),E.create(2));});
if(require.main===module)for(let i=0;i<3;i++){const all=returns(i);const max=Math.max(...all.map(r=>r.bank));console.log('Stage',i+1,'maximum one-dive return',max,'example',all.find(r=>r.bank===max));}

test('advanced quota requires deep retrieval and different grouping',()=>{assert(E.STAGES[2].items.filter(i=>i[0]!=='E').reduce((a,i)=>a+i[2],0)<E.STAGES[2].quota);const s=play(2,'> A C + A D + A S > A C E + C A S');assert.equal(s.phase,'won');assert.equal(s.bank,40);assert.equal(s.dives,2);assert.equal(s.air,6);});
