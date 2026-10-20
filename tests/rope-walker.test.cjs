const{test}=require('node:test'),a=require('node:assert/strict'),E=require('../games/rope-walker/engine.js');
function run(policy,dt=.1){let s=E.start();for(let i=0;i<100000&&s.phase==='playing';i++)s=E.tick(s,policy(s),dt);return s;}
const control=s=>({steer:Math.abs(s.lean*3+s.velocity*2)>.07?-Math.sign(s.lean*3+s.velocity*2):0});
test('start and reset are independent clean states',()=>{a.equal(E.initial().phase,'ready');a.deepEqual(E.start(),{...E.initial(),phase:'playing'});});
test('zero input reaches genuine balance failure',()=>{const s=run(()=>({}));a.equal(s.phase,'lost');a.equal(s.reason,'balance');a.ok(Math.abs(s.lean)>=1);});
test('holding wrong counterweight loses',()=>{const s=run(()=>({steer:-1}));a.equal(s.reason,'balance');a.ok(s.t<3);});
test('bracing forever never advances and times out',()=>{const s=run(()=>({brace:true}));a.equal(s.distance,0);a.equal(s.reason,'time');a.equal(s.t,55);a.equal(s.braced,55);});
test('feedback-only steering wins without state manipulation',()=>{const s=run(control);a.equal(s.phase,'won');a.equal(s.distance,60);a.ok(s.t>24&&s.t<30);});
test('strategic bracing then steering also wins',()=>{const s=run(s=>s.t<4?{brace:true}:control(s));a.equal(s.phase,'won');a.ok(s.braced>=4);a.ok(s.t>28);});
test('two stable crossings are deterministic',()=>a.deepEqual(run(control),run(control)));
test('wind changes and next forecast are exact',()=>{a.equal(E.wind(4.999).value,.25);a.equal(E.wind(5).value,-.65);a.equal(E.wind(11).next.at,17);a.equal(E.wind(50).next,null);});
test('steer direction changes momentum before position',()=>{const s=E.tick(E.start(),{steer:-1},E.DT);a.ok(s.velocity<0);a.ok(s.lean<0);});
test('release preserves inertia; brace damps it',()=>{let s=E.tick(E.start(),{steer:1},.3);const released=E.tick(s,{},.1),braced=E.tick(s,{brace:true},.1);a.ok(released.lean>s.lean);a.ok(Math.abs(braced.velocity)<Math.abs(released.velocity));a.equal(braced.distance,s.distance);});
test('tick does not mutate prior state',()=>{const s=E.start(),before={...s};E.tick(s,{steer:1},.3);a.deepEqual(s,before);});
test('pause freezes and resume restores only active state',()=>{const s=E.tick(E.start(),{},.2),p=E.pause(s);a.equal(E.tick(p,{steer:1},1),p);a.deepEqual(E.resume(p),s);a.equal(E.resume(E.initial()).phase,'ready');});
test('terminal inputs never alter result',()=>{const s=run(control);a.equal(E.tick(s,{steer:1},1),s);a.equal(E.pause(s),s);});
test('invalid dt rejected',()=>{for(const dt of[-1,NaN,Infinity,2])a.throws(()=>E.tick(E.start(),{},dt));});
test('clamped steer and opposing inputs neutral',()=>{a.deepEqual(E.tick(E.start(),{steer:2},.1),E.tick(E.start(),{steer:1},.1));a.deepEqual(E.tick(E.start(),{steer:0},.1),E.tick(E.start(),{},.1));});
test('same fixed-step input is independent of grouping',()=>{let s=E.start(),v=E.start();for(let i=0;i<120;i++)s=E.tick(s,{brace:true},E.DT);v=E.tick(v,{brace:true},1);a.ok(Math.abs(s.lean-v.lean)<1e-12);});
