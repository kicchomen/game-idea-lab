const test=require('node:test'), a=require('node:assert/strict');
const eng=import('../games/cape-beacon/engine.js');
function simulate(e, choose){const s=e.reset();for(let i=0;i<200&&s.result==='running';i++){s.focus=choose(s,i);e.tick(s);}return s;}
test('inaction fails all ships; fixed beam rescues exactly the matching one',async()=>{
 const e=await eng;
 a.equal(simulate(e,()=>null).boats.filter(b=>b.status==='missed').length,3);
 for(let j=0;j<3;j++)a.equal(simulate(e,()=>j).boats.filter(b=>b.status==='safe').length,1);
});
test('switch in order and all three turn before rocks',async()=>{
 const e=await eng;const s=simulate(e,(_,t)=>t<59?0:t<80?1:2);
 a.equal(s.result,'win');a.deepEqual(s.boats.map(b=>b.turned),[48,76,97]);
});
test('each wrong tick resets the signal; rapidly cycling cannot win',async()=>{
 const e=await eng;
 const s=e.reset();s.focus=0;for(let t=0;t<47;t++)e.tick(s);a.equal(s.boats[0].lit,16);
 s.focus=1;e.tick(s);a.equal(s.boats[0].lit,0);
 a.equal(simulate(e,(_,t)=>t%3).result,'loss');
});
test('deadlines are exact, irreversible, and terminal simulation freezes',async()=>{
 const e=await eng,s=e.reset();
 for(let i=0;i<58;i++)e.tick(s);s.focus=0;
 for(let i=0;i<17;i++)e.tick(s);a.equal(s.tick,75);a.equal(s.boats[0].status,'missed');
 const f=simulate(e,()=>null),t=f.tick;e.tick(f);a.equal(f.tick,t);a.equal(e.reset().tick,0);
});
test('matching marker hit is continuous and all rescue paths leave the rock',async()=>{
 const e=await eng,s=simulate(e,(_,t)=>t<59?0:t<80?1:2);
 s.boats.forEach((b,i)=>{
  const r=s.routes[i], at=e.position({...b,turned:null,status:'needs'},r,b.turned);
  a.deepEqual(e.position({...b,status:'turning'},r,b.turned),at);
  a.deepEqual(e.position(b,r,b.turned+30),r.exit);
  a.notDeepEqual(r.rock,r.exit);
 });
});

test('readable windows work across all tides; no one fixed periodic pattern wins all three',async()=>{
 const e=await eng;
 function tideRun(tide,pick){const s=e.reset(tide);for(let i=0;i<200&&s.result==='running';i++){s.focus=pick(s,i);e.tick(s);}return s.result;}
 function judge(s){if(s.focus!==null&&s.boats[s.focus].status==='needs')return s.focus;
  const waiting=s.boats.map((b,i)=>b.status==='needs'?i:null).filter(x=>x!==null).sort((a,b)=>s.routes[a].end-s.routes[b].end);return waiting[0]??null;}
 for(let t=0;t<3;t++)a.equal(tideRun(t,judge),'win');
 const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 for(const order of orders)for(let d=1;d<=45;d++)for(let offset=0;offset<d;offset++){
  const wins=[0,1,2].filter(t=>tideRun(t,(_,n)=>order[Math.floor((n+offset)/d)%3])==='win');
  a(wins.length<3,JSON.stringify({order,d,offset}));
 }
});
