'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const {C,fresh,step}=require('../games/lunar-lander/engine');
const eps=1e-7, near=(a,b)=>assert.ok(Math.abs(a-b)<eps,a+' != '+b);
const run=(input,s=fresh())=>{for(let f=0;f<3200&&s.status==='flight';f++)s=step(s,input(f,s));return s;};
const route=[172,610,936,1067,1131,1239];
const winInput=(f,v=route)=>{const left=f>=v[2]&&f<v[3];return {left,thrust:left||(f>=v[0]&&f<v[1])||(f>=v[4]&&f<v[5])};};
test('gravity increases descent and preserves horizontal drift without thrust',()=>{const s=fresh(),n=step(s);near(n.vy-s.vy,C.gravity*C.dt);near(n.vx,s.vx);near(n.x-s.x,s.vx*C.dt);assert.deepEqual(s,fresh());});
test('vertical thrust accelerates upward and consumes fuel',()=>{const s=fresh(),n=step(s,{thrust:true});near(n.vy-s.vy,(C.gravity-C.thrust)*C.dt);near(n.fuel,6-C.dt);near(n.vx,s.vx);assert.equal(n.burn,true);});
test('holding left and thrust brakes rightward drift, release self-levels',()=>{let s=fresh();for(let i=0;i<37;i++)s=step(s,{left:true,thrust:true});assert.ok(s.vx<21&&s.angle<0);for(let i=0;i<25;i++)s=step(s,{});near(s.angle,0);});
test('right & thrust accelerates the other way; opposing input self-levels',()=>{let s=fresh();for(let i=0;i<32;i++)s=step(s,{right:true,thrust:true});assert.ok(s.vx>21);for(let i=0;i<25;i++)s=step(s,{left:true,right:true});near(s.angle,0);});
test('gentle boundary speed is accepted; edge, excessive speed or tilt is not',()=>{const base={...fresh(),x:(C.pad0+C.pad1)/2,y:131-C.dt,vx:0,vy:1};
  assert.equal(step(base).status,'win');assert.equal(step({...base,x:C.pad0+7}).reason,'pad');
  assert.equal(step({...base,vx:11}).reason,'speed');assert.equal(step({...base,vy:17}).reason,'speed');
  assert.equal(step({...base,angle:.21},{right:true}).reason,'angle');
});
test('fuel cannot go negative; fractional final impulse is scaled',()=>{const s={...fresh(),fuel:C.dt/2},n=step(s,{thrust:true});near(n.fuel,0);near(n.vy-s.vy,(C.gravity-C.thrust/2)*C.dt);assert.equal(step(n,{thrust:true}).burn,false);});
test('no action fails; boundary and time have distinct terminal reasons',()=>{assert.equal(run(()=>({})).status,'loss');assert.equal(step({...fresh(),x:251,vx:200}).reason,'boundary');assert.equal(step({...fresh(),t:24}).reason,'time');});
test('visual start and target geometry are the true game geometry',()=>{
  assert.ok(Math.abs(fresh().x/C.width-.13)<.005);
  assert.ok(Math.abs((C.pad0+C.pad1)/2/C.width-.82)<.005);
  assert.ok(Math.abs((C.pad1-C.pad0)/C.width-.13)<.005);
  assert.equal(fresh().vx,21);
});
test('ordinary three-burn controls land from the visually matched approach; jitter passes 40/64',()=>{
  assert.equal(run(f=>winInput(f)).status,'win');
  let wins=0;
  for(let i=0;i<64;i++){
    const variation=route.map((t,j)=>t+(i>>j&1?6:-6));
    if(run(f=>winInput(f,variation)).status==='win')wins++;
  }
  assert.equal(wins,40);
});
test('loss and win freeze immutably, retry recreates the same approach',()=>{const failed=run(()=>({})), won=run(f=>winInput(f));assert.equal(step(won,{thrust:true}),won);assert.equal(step(failed,{thrust:true}),failed);assert.deepEqual(run(f=>winInput(f)),won);});
test('extreme input remains finite and fuel stays nonnegative',()=>{for(let seed=0;seed<40;seed++){let x=seed+55;const s=run(()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return {left:x%37<14,right:(x>>>10)%31<10,thrust:(x>>>19)%31<18};});assert.ok(s.fuel>=0&&s.t<=24+C.dt);assert.ok([s.x,s.y,s.vx,s.vy].every(Number.isFinite));}});
