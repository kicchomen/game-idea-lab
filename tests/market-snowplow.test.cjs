'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const G=require('../games/market-snowplow/engine.js');
const actions=['up','down','left','right','dump'];
// Independent BFS treats snow as a bitset rather than calling production actions.
function solve(){
 const snow=[...G.cells].flatMap((c,i)=>Number(c)?[{i,d:+c}]:[]), all=(1<<snow.length)-1;
 const snowAt=new Map(snow.map(({i,d},j)=>[i,[1<<j,d]]));
 const queue=[[G.cells.indexOf('S'),all,0,-1,'']]; const keys=new Set();
 const displacements=[[-7,0],[7,0],[-1,-1],[1,1]];
 for(let pos=0;pos<queue.length;pos++){
  const [at,left,load]=queue[pos];
  const offer=(a,b,c,action)=>{
   const k=((a*(all+1)+b)*5)+c;
   if(!keys.has(k)){keys.add(k);queue.push([a,b,c,pos,action]);}
  };
  if(!left&&!load){
   const result=[];let j=pos;
   while(queue[j][3]>=0){result.unshift(queue[j][4]);j=queue[j][3];}
   return result;
  }
  if(G.cells[at]==='g'&&load)offer(at,left,0,'dump');
  displacements.forEach(([delta,x],i)=>{
   const n=at+delta;if(n<0||n>=G.cells.length||at%7+x<0||at%7+x>=7||G.cells[n]==='#')return;
   const [flag,d]=snowAt.get(n)||[0,0];
   if((left&flag)&&load+d<=4)offer(n,left^flag,load+d,actions[i]);
   else offer(n,left,load,actions[i]);
  });
 }
 throw new Error('No solution');
}
function play(path, sec=.225){
 return path.reduce((s,action)=>{const t=G.advance(s,sec);return action==='dump'?G.dump(t):G.move(t,action);},G.begin(G.start()));
}
test('stable setup and separate independent reset arrays',()=>{
 const a=G.start(), b=G.start();
 assert.equal(a.phase,'ready'); assert.equal(a.cargo,0); assert.equal(a.snow.reduce((a,b)=>a+b,0),G.snowTotal);
 assert.equal(a.remaining,G.snowCells); assert.notEqual(a.snow,b.snow); assert.equal(G.move(a,'up'),a);
});
test('thin and deep collection, full traversal without accidental snow disappearance',()=>{
 const s=G.begin(G.start());
 const thin=G.move({...s,at:42},'down');
 assert.equal(thin.at,42);
 const d=G.move({...s,at:8},'left');
 assert.equal(d.cargo,2); assert.equal(d.snow[7],0); assert.equal(s.snow[7],2);
 const full=G.move({...s,at:8,cargo:3},'left');
 assert.equal(full.at,7); assert.equal(full.cargo,3); assert.equal(full.snow[7],2); assert.equal(full.remaining,s.remaining);
 const t=G.move({...s,at:43},'left');assert.equal(t.cargo,1);assert.equal(t.snow[42],0);
});
test('walls and edges do not wrap, original snow retained',()=>{
 const s=G.begin(G.start());
 assert.equal(G.move({...s,at:7},'left').at,7);
 assert.equal(G.move({...s,at:8},'right').at,8);
 assert.equal(G.move({...s,at:6},'right').at,6);
 assert.equal(G.move(s,'constructor'),s);
});
test('dump only at designated grate, final action required even at zero snow',()=>{
 const s={...G.begin(G.start()),cargo:2,remaining:0};
 assert.equal(G.dump(s).cargo,2);
 const won=G.dump({...s,at:1});
 assert.equal(won.cargo,0);assert.equal(won.dumps,1);assert.equal(won.phase,'won');
 assert.equal(G.dump({...s,at:1,cargo:0}).dumps,0);
 assert.equal(G.move(won,'down'),won);
});
test('clock advances only while live, no movement or dumping after deadline',()=>{
 let s=G.begin(G.start());
 s=G.advance(s,G.limit-.25);assert.equal(s.phase,'running');
 const p=G.togglePause(s);assert.equal(G.advance(p,200),p);
 s=G.advance(G.togglePause(p),.25);assert.equal(s.phase,'lost');
 assert.equal(G.move(s,'up'),s); assert.equal(G.dump(s),s); assert.equal(G.advance(s,20),s);
 const retry=G.begin(G.start());assert.equal(retry.elapsed,0);assert.equal(retry.remaining,G.snowCells);
});
test('independent shortest route wins under production rules, full snow accounting every move',()=>{
 const path=solve();
 assert.ok(path.length>=25);assert.ok(path.length*G.repeatMs/1000<G.limit);
 let s=G.begin(G.start()),unloaded=0;
 for(const direction of path){
  if(direction==='dump'){unloaded+=s.cargo;s=G.dump(s);}else s=G.move(s,direction);
  assert.ok(s.cargo>=0&&s.cargo<=4);
  assert.equal(s.snow.reduce((a,b)=>a+b,0)+s.cargo+unloaded,G.snowTotal);
 }
 assert.equal(s.phase,'won');assert.equal(unloaded,G.snowTotal);
 assert.equal(play(path).phase,'won');
 assert.equal(play(path,2).phase,'lost');
});
module.exports=solve;
