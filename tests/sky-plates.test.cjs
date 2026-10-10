const {test}=require('node:test'),A=require('node:assert/strict'),E=require('../games/sky-plates/engine.js');
function play(){let s=E.create();E.start(s);return s;}function run(s,t,h=false){for(let i=0;i<Math.round(t/E.DT);i++)E.step(s,h);}
test('ready cannot move or advance',()=>{let s=E.create();E.step(s,true);A.equal(s.tick,0);A.equal(E.target(s,3),false);});
test('valid selection movement is finite and distance based',()=>{let s=play();E.target(s,3);run(s,1);A.ok(Math.abs(s.x-209)<.01);run(s,1);A.equal(s.x,306);});
test('invalid targets rejected',()=>{let s=play();for(const i of [-1,4,NaN,1.5])A.equal(E.target(s,i),false);A.equal(s.target,0);});
test('charge is required and release discards partial progress',()=>{let s=play();run(s,.5,true);A.equal(s.refills,0);run(s,.1,false);A.equal(s.charge,0);run(s,.75,true);A.equal(s.refills,1);A.equal(s.spin[0],100);});
test('holding cannot repeatedly refill; explicit release rearms',()=>{let s=play();run(s,5,true);A.equal(s.refills,1);run(s,E.DT,false);run(s,.75,true);A.equal(s.refills,2);});
test('travel does not charge before arrival',()=>{let s=play();E.target(s,3);run(s,1,true);A.equal(s.charge,0);A.equal(s.refills,0);});
test('changing station resets charge',()=>{let s=play();run(s,.5,true);E.target(s,1);A.equal(s.charge,0);});
test('idle play genuinely fails',()=>{let s=play();run(s,20);A.equal(s.status,'lost');A.equal(s.lostPlate,1);});
test('camping one plate fails',()=>{let s=play();run(s,20,true);A.equal(s.status,'lost');});
test('paused is frozen and resume works',()=>{let s=play();run(s,.4,true);E.pause(s);let snap=JSON.stringify(s);run(s,5,true);A.equal(JSON.stringify(s),snap);E.pause(s);run(s,.1);A.equal(s.status,'playing');});
test('gust rotates in six second sections only in interval',()=>{let s=play();for(const [t,g]of [[0,-1],[11.99,-1],[12,0],[18,1],[24,2],[30,3],[36,-1]]){s.time=t;A.equal(E.gust(s),g);}});
test('perfect score requires depleted spin at actual completion',()=>{let s=play();s.spin[0]=39;run(s,.75,true);A.equal(s.score,3);});
test('input-only lowest-rotation route wins',()=>{let s=play();while(s.status==='playing'){if(s.latched){E.step(s,false);E.target(s,s.spin.indexOf(Math.min(...s.spin)));}else E.step(s,true);}A.equal(s.status,'won');A.equal(s.time,45);A.ok(s.refills>10);});
test('round-robin route also wins; no single required solution',()=>{let s=play();while(s.status==='playing'){if(s.latched){E.step(s,false);E.target(s,(s.target+1)%4);}else E.step(s,true);}A.equal(s.status,'won');});
test('terminal state cannot mutate',()=>{let s=play();run(s,20);let snap=JSON.stringify(s);run(s,10,true);E.target(s,0);E.pause(s);A.equal(JSON.stringify(s),snap);});
test('retry creates clean independent state',()=>{let a=play();run(a,20);let b=play();A.equal(b.tick,0);A.equal(b.refills,0);A.deepEqual(b.spin,[83,68,92,79]);});
test('deterministic fixed step produces exact repeat',()=>{function f(){let s=play();for(let i=0;i<700;i++){if(i===100)E.target(s,2);E.step(s,i%150<100);}return s;}A.deepEqual(f(),f());});
