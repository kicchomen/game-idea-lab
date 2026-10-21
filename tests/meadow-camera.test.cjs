const {test}=require('node:test'),A=require('node:assert/strict'),E=require('../games/meadow-camera/engine.js');
const run=(m=0)=>E.start(E.create(m));
function route(m,width){for(let t=0;t<49;t+=.02){let s=E.tick(run(m),t);if(width===150)s=E.zoom(s);let a=E.view(s).filter(o=>o.wanted),lo=Math.min(...a.map(o=>o.x-o.left)),hi=Math.max(...a.map(o=>o.x+o.right));s=E.move(s,(lo+hi)/2);if(E.shoot(s).status==='won')return {s,t,x:s.x};}throw Error('unreachable');}
for(let m=0;m<3;m++)for(let w of [150,240])test(`mission ${m+1} input-route win width ${w}`,()=>{let r=route(m,w),s=E.shoot(r.s);A.equal(s.status,'won');A.equal(s.total,w===150?2:1);A.equal(s.film,5);console.log('route',m,w,r.t.toFixed(2),r.x.toFixed(1));});
test('immutable movement and clamp',()=>{let s=run(),a=E.move(s,-100);A.equal(s.x,300);A.equal(a.x,120);A.equal(E.move(s,700).x,480);});
test('timeout and terminal locks',()=>{let s=E.tick(run(),51);A.equal(s.time,50);A.equal(s.status,'lost');A.equal(E.shoot(s),s);A.equal(E.move(s,12),s);A.equal(E.zoom(s),s);});
test('six bad shots fail, cooldown prevents duplicate',()=>{let s=run();for(let i=0;i<6;i++){s=E.tick(s,.4);s=E.move(s,480);s=E.shoot(s);A.equal(E.shoot(s),s);}A.equal(s.status,'lost');A.equal(s.film,0);});
test('pause freezes time, move, shutter; resume explicit',()=>{let s=E.pause(run());A.equal(s.status,'paused');A.equal(E.tick(s,10),s);A.equal(E.move(s,400),s);A.equal(E.shoot(s),s);A.equal(E.pause(s).status,'playing');});
test('retry resets mission and subtracts only last success',()=>{let s=E.shoot(route(0,150).s);s=E.start(E.next(s));A.equal(s.total,2);s=E.tick(s,50);let r=E.retry(s);A.equal(r.mission,1);A.equal(r.total,2);A.equal(r.time,0);A.equal(r.film,6);A.equal(r.status,'ready');});
test('winning retry resets photo score',()=>{let s=E.shoot(route(1,150).s);A.equal(E.retry(s).total,0);});
test('next only on win and stops at final mission',()=>{A.equal(E.next(run()).mission,0);let s=E.shoot(route(2,240).s);A.equal(E.next(s),s);});
test('hidden animal cannot count even when framed',()=>{let s=run();for(let t=0;t<20;t+=.05){s=E.tick(run(),t);let f=E.subjects(s)[0];if(f.hidden){s=E.move(s,f.x);A.notEqual(E.shoot(s).status,'won');return;}}throw Error('no hidden interval');});
test('full body extents determine frame membership',()=>{let s=run(),f=E.subjects(s)[0];s=E.move(s,f.x+85);A.equal(E.view(s)[0].inside,false);});
test('invalid deltas and positions do not mutate',()=>{let s=run();for(let dt of [NaN,Infinity,-1,0])A.equal(E.tick(s,dt),s);A.equal(E.move(s,NaN),s);});
test('determinism and frame partitioning',()=>{let a=run(2),b=run(2);a=E.tick(a,1);for(let i=0;i<100;i++)b=E.tick(b,.01);A.ok(Math.abs(a.time-b.time)<1e-10);A.ok(Math.abs(E.subjects(a)[0].x-E.subjects(b)[0].x)<1e-9);});
