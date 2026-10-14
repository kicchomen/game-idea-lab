'use strict';
// Independent production-engine/input checks. Controller uses a mocked DOM,
// not a browser, physical touch device or first-time human playtest.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const E=require('../games/windbird/engine.js');

function simulate(course,policy){
  const s=E.fresh(course);E.start(s);
  let minimumEnergy=100,steps=0;
  while(s.status==='playing'&&steps++<12000){
    E.step(s,policy(s));minimumEnergy=Math.min(minimumEnergy,s.energy);
    assert.ok(Number.isFinite(s.x)&&Number.isFinite(s.y)&&Number.isFinite(s.energy));
    assert.ok(s.energy>=0&&s.energy<=100);
  }
  assert.notEqual(s.status,'playing','input run must reach a terminal state');
  return {s,minimumEnergy};
}
function route(course,highFirst=false){return s=>{
  let target;
  if(course===0)target=s.x<605?220:s.x<1050?95:280;
  if(course===1)target=s.x<650?235:s.x<1160?75:280;
  if(course===2)target=s.x<690?(highFirst?40:283):s.x<1270?230:s.x<1710?70:280;
  const wait=course===2&&highFirst&&s.x>=1040&&s.x<1100&&s.y<205;
  return {right:!wait,flap:s.y+s.vy*.55>target&&s.energy>.5};
};}
function playing(patch={}){return Object.assign(E.start(E.fresh()),patch);}
function near(actual,expected,tolerance=1e-9){assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);}

for(let course=0;course<3;course++){
  test(`independent input-only full success: course ${course+1}`,()=>{
    const {s,minimumEnergy}=simulate(course,route(course));
    assert.equal(s.status,'won');assert.equal(s.y,272);
    assert.ok(s.time<E.COURSES[course].limit);
    assert.ok(minimumEnergy>0&&minimumEnergy<80);
    assert.equal(s.flapping,false);assert.equal(s.vx,0);assert.equal(s.vy,0);
  });
  test(`independent continuous flap and glide both lose: course ${course+1}`,()=>{
    for(const flap of [false,true])assert.equal(simulate(course,()=>({right:true,flap})).s.status,'lost');
  });
}
test('independent alternate upper route also wins course 3 by waiting outside a thermal',()=>{
  const upper=simulate(2,route(2,true)),lower=simulate(2,route(2));
  assert.equal(upper.s.status,'won');assert.equal(lower.s.status,'won');
  assert.ok(upper.s.time>lower.s.time+2);assert.ok(upper.minimumEnergy>0);
});
for(const course of [1,2])test(`fixed-cycle sweep cannot win judgment course ${course+1} in the stated sample`,()=>{
  const periods=[.3,.5,.75,1,1.5,2,2.5,3,4,5,6,7,8];
  for(const period of periods)for(let index=0;index<=32;index++){
    const duty=.1+index*.025;
    const {s}=simulate(course,s=>({right:true,flap:(s.time%period)<period*duty}));
    assert.equal(s.status,'lost',`period=${period}, duty=${duty}`);
  }
});
test('fixed-cycle input can win the introduction; this is not evidence of later route depth',()=>{
  const {s}=simulate(0,s=>({right:true,flap:s.time%.3<.3*.45}));assert.equal(s.status,'won');
});
test('input-only routes replay deterministically',()=>{
  for(let c=0;c<3;c++)assert.deepEqual(simulate(c,route(c)),simulate(c,route(c)));
});
test('independent single-step oracle matches gravity, damping, movement and energy',()=>{
  for(const flap of [false,true]){
    const s=playing({x:100,y:160,vx:12,vy:8,energy:60});
    const vx=12+(100-12)*E.DT*6;
    const vy=8+(52-(flap?143:0)-8*.95)*E.DT;
    E.step(s,{right:true,flap});near(s.vx,vx);near(s.x,100+vx*E.DT);
    near(s.vy,vy);near(s.y,160+vy*E.DT);near(s.energy,60+(flap?-32:9)*E.DT);
  }
});
test('independent thermal oracle applies upward acceleration and double idle recovery',()=>{
  const s=playing({x:280,y:160,vy:8,energy:60});E.step(s,{});
  near(s.vy,8+(52-92-8*.95)*E.DT);near(s.energy,60+18*E.DT);
  assert.equal(s.inThermal,true);assert.equal(s.flapping,false);
});
test('thermal x boundaries are inclusive and an immediately outside center receives no lift',()=>{
  const t=E.COURSES[0].thermals[0];
  for(const [x,inThermal] of [[t.x,true],[t.x+t.w,true],[t.x-.001,false],[t.x+t.w+.001,false]]){
    const s=playing({x,y:160});E.step(s,{});assert.equal(s.inThermal,inThermal,`x=${x}`);
  }
});
test('zero energy still permits gliding recovery; held flap cannot spend negative energy',()=>{
  const s=playing({energy:0});E.step(s,{flap:true});
  assert.equal(s.flapping,false);near(s.energy,9*E.DT);assert.ok(s.y>165);
  for(let i=0;i<100;i++)E.step(s,{flap:true});assert.ok(s.energy>=0);
});
test('opposite horizontal inputs cancel and release brakes residual motion',()=>{
  const stationary=playing();E.step(stationary,{left:true,right:true});near(stationary.x,45);
  const moving=playing({vx:100});E.step(moving,{});near(moving.vx,95);assert.ok(moving.x>45);
});
test('left world boundary and sky ceiling clamp position without upward escape',()=>{
  const left=playing({x:14,vx:-100});E.step(left,{left:true});assert.equal(left.x,14);
  const sky=playing({y:18,vy:-80});E.step(sky,{flap:true});assert.equal(sky.y,18);assert.equal(sky.vy,0);
});
test('storm edge tangency is allowed, but minimal overlapping body width fails',()=>{
  const storm=E.COURSES[0].storms[0];
  const tangent=playing({x:storm.x-9,y:100});E.step(tangent,{});assert.equal(tangent.status,'playing');
  const overlap=playing({x:storm.x-9+.001,y:100});E.step(overlap,{});assert.equal(overlap.status,'lost');assert.match(overlap.reason,/嵐/);
});
test('sea crossing naturally fails and freezes terminal state',()=>{
  const s=playing({x:100,y:328.9,vy:54});E.step(s,{});assert.equal(s.status,'lost');assert.match(s.reason,/海/);
  const snapshot={...s};E.step(s,{right:true,flap:true});assert.deepEqual(s,snapshot);
});
test('above-island descending crossing succeeds without an unreachable speed requirement',()=>{
  const s=playing({x:E.COURSES[0].goal+20,y:271.99,vy:54});E.step(s,{});
  assert.equal(s.status,'won');assert.equal(s.y,272);
  assert.equal(s.vx,0);assert.equal(s.vy,0);
});
test('being above the island is not yet success',()=>{
  const s=playing({x:E.COURSES[0].goal+20,y:250,vy:0});E.step(s,{});assert.equal(s.status,'playing');
});
test('low side entry and upward entry fail rather than snapping to island surface',()=>{
  for(const vy of [-20,20]){
    const s=playing({x:E.COURSES[0].goal,y:280,vy});E.step(s,{});
    assert.equal(s.status,'lost');assert.match(s.reason,/崖/);assert.notEqual(s.y,272);
  }
});
test('landing collision waits until world goal x boundary',()=>{
  const s=playing({x:E.COURSES[0].goal-.001,y:300,vy:0});E.step(s,{});assert.equal(s.status,'playing');
});
test('deadline failure can occur while stationary in a thermal',()=>{
  const s=playing({x:280,y:18,time:E.COURSES[0].limit-E.DT/2});E.step(s,{});
  assert.equal(s.status,'lost');assert.match(s.reason,/日暮れ/);
});
test('pause freezes all flight state; start resumes only paused or ready',()=>{
  const s=playing({flapping:true,vx:20});E.pause(s);assert.equal(s.flapping,false);
  const snapshot={...s};for(let i=0;i<100;i++)E.step(s,{right:true,flap:true});assert.deepEqual(s,snapshot);
  E.start(s);assert.equal(s.status,'playing');
  for(const status of ['won','lost']){const terminal=playing({status});E.start(terminal);assert.equal(terminal.status,status);}
});
test('reset returns every mutable flight field to fresh state and keeps selected course',()=>{
  const result=simulate(2,route(2));result.s.nearMiss=12;
  const reset=E.fresh(result.s.course);assert.deepEqual(reset,E.fresh(2));
  assert.equal(reset.x,45);assert.equal(reset.energy,100);assert.equal(reset.time,0);assert.equal(reset.used,0);assert.equal(reset.nearMiss,0);
});
test('fresh clamps invalid course indices and does not share mutable state',()=>{
  for(const [input,expected] of [[-1,0],[99,2],[NaN,0],[1.9,1]])assert.equal(E.fresh(input).course,expected);
  const a=E.fresh(),b=E.fresh();a.x=999;assert.equal(b.x,45);
});
test('invalid dt is ignored; oversized dt cannot skip collision steps',()=>{
  for(const dt of [0,-1,NaN,Infinity]){const s=playing(),snapshot={...s};E.step(s,{right:true},dt);assert.deepEqual(s,snapshot);}
  const a=playing(),b=playing();E.step(a,{right:true},.25);E.step(b,{right:true},E.DT);assert.deepEqual(a,b);
});

function boot(){
  let currentState,frame,clock=1;
  class Element {
    constructor(input){this.dataset={input};this.handlers={};this.disabled=false;this.hidden=false;this.textContent='';this.value='0';this.tagName='BUTTON';this.active=new Set();this.classList={add:x=>this.active.add(x),remove:x=>this.active.delete(x)};}
    addEventListener(type,cb){(this.handlers[type]??=[]).push(cb);}
    setPointerCapture(id){this.captured=id;}
    fire(type,extra={}){
      const ev={key:'',repeat:false,pointerId:1,preventDefault(){this.prevented=true;},target:this,...extra};
      if(this['on'+type])this['on'+type](ev);for(const cb of this.handlers[type]||[])cb(ev);return ev;
    }
  }
  const ids={};for(const id of ['view','course','start','restart','pause','next','energy','bar','time','distance','overlay','headline','message','status'])ids[id]=new Element();
  ids.course.tagName='SELECT';
  const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
  ids.view.getContext=()=>ctx;
  const controls=['left','right','flap'].map(k=>new Element(k));
  const doc=new Element(),win=new Element();doc.hidden=false;
  doc.getElementById=id=>ids[id];doc.querySelectorAll=()=>controls;
  const engine={...E,fresh(course){currentState=E.fresh(course);return currentState;}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../games/windbird/app.js'),'utf8'),{Windbird:engine,document:doc,window:win,requestAnimationFrame:cb=>frame=cb,Math,Set,Map});
  function tick(n=1,hz=60){for(let i=0;i<n;i++){clock+=1000/hz;frame(clock);}}
  tick();return {ids,controls,doc,win,tick,get state(){return currentState;}};
}
function launch(b){b.ids.start.fire('click');assert.equal(b.state.status,'playing');}
function clearKeys(b){for(const key of ['ArrowLeft','ArrowRight',' '])b.doc.fire('keyup',{key});}

test('mock controller ready/start and simultaneous held pointer actions affect actual engine',()=>{
  const b=boot();assert.equal(b.state.status,'ready');assert.ok(b.controls.every(c=>c.disabled));launch(b);
  b.controls[1].fire('pointerdown',{pointerId:1});b.controls[2].fire('pointerdown',{pointerId:2});b.tick(20);
  assert.ok(b.state.x>45);assert.ok(b.state.y<165);assert.ok(b.state.energy<100);
  assert.equal(b.controls[1].captured,1);assert.equal(b.controls[2].captured,2);
});
for(const release of ['pointerup','pointercancel','lostpointercapture'])test(`mock controller ${release} releases both visual and simulation input`,()=>{
  const b=boot();launch(b);b.controls[2].fire('pointerdown');b.tick(10);b.controls[2].fire(release);b.tick();
  assert.equal(b.state.flapping,false);assert.equal(b.controls[2].active.has('active'),false);
});
test('mock controller key repeat does not multiply actions; keyup releases flap and prevents Space scroll',()=>{
  const b=boot();launch(b);assert.equal(b.doc.fire('keydown',{key:' '}).prevented,true);
  for(let i=0;i<20;i++){b.doc.fire('keydown',{key:' ',repeat:true});b.tick();}
  near(b.state.energy,100-b.state.time*32,1e-6);
  b.doc.fire('keyup',{key:' '});b.tick();assert.equal(b.state.flapping,false);
});
test('mock controller select/input keyboard events do not steer or flap',()=>{
  const b=boot();launch(b);
  b.doc.fire('keydown',{key:'ArrowRight',target:{tagName:'SELECT'}});
  b.doc.fire('keydown',{key:' ',target:{tagName:'INPUT'}});b.tick(10);
  assert.equal(b.state.x,45);assert.equal(b.state.flapping,false);
});
for(const interruption of ['blur','hidden'])test(`mock controller ${interruption} pauses, freezes, and clears held input on explicit resume`,()=>{
  const b=boot();launch(b);b.doc.fire('keydown',{key:'ArrowRight'});b.controls[2].fire('pointerdown');b.tick(20);
  if(interruption==='blur')b.win.fire('blur');else{b.doc.hidden=true;b.doc.fire('visibilitychange');}
  const snapshot={...b.state};b.tick(120);assert.equal(b.state.status,'paused');assert.deepEqual(b.state,snapshot);
  assert.ok(b.controls.every(c=>!c.active.has('active')));
  b.ids.start.fire('click');b.tick();assert.equal(b.state.status,'playing');assert.equal(b.state.flapping,false);
  assert.ok(b.state.vx<snapshot.vx,'held right must have been released; inertia is preserved');
});
test('mock controller pause repeat does not resume; visible page does not auto-resume',()=>{
  const b=boot();launch(b);b.doc.fire('keydown',{key:'p'});assert.equal(b.state.status,'paused');
  b.doc.fire('keydown',{key:'p',repeat:true});assert.equal(b.state.status,'paused');
  b.doc.hidden=false;b.doc.fire('visibilitychange');assert.equal(b.state.status,'paused');
});
test('mock controller natural terminal loss disables input and retry clears stale controls',()=>{
  const b=boot();launch(b);b.controls[1].fire('pointerdown');b.controls[2].fire('pointerdown');b.tick(500);
  assert.equal(b.state.status,'lost');assert.equal(b.ids.overlay.hidden,false);assert.ok(b.controls.every(c=>c.disabled));
  const terminal={...b.state};b.controls[1].fire('pointerdown');b.doc.fire('keydown',{key:'ArrowRight'});b.tick(20);assert.deepEqual(b.state,terminal);
  b.ids.start.fire('click');assert.equal(b.state.status,'playing');assert.equal(b.state.time,0);b.tick(20);
  assert.equal(b.state.x,45);assert.equal(b.state.flapping,false);assert.equal(b.state.energy,100);
});
test('mock controller keyboard route wins, next course resets, terminal replay resets',()=>{
  const b=boot();launch(b);let flap=false;b.doc.fire('keydown',{key:'ArrowRight'});
  for(let i=0;i<5000&&b.state.status==='playing';i++){
    const command=route(0)(b.state);
    if(command.flap!==flap){b.doc.fire(command.flap?'keydown':'keyup',{key:' '});flap=command.flap;}
    b.tick();
  }
  assert.equal(b.state.status,'won');assert.equal(b.ids.overlay.hidden,false);assert.equal(b.ids.next.hidden,false);assert.ok(b.controls.every(c=>c.disabled));
  b.ids.start.fire('click');assert.equal(b.state.status,'playing');assert.equal(b.state.time,0);b.tick();assert.equal(b.state.x,45);
  b.ids.next.fire('click');assert.equal(b.state.status,'ready');assert.equal(b.state.course,1);assert.equal(b.state.time,0);assert.equal(b.state.energy,100);
});
test('mock controller restart and selected-course change clear held keys/pointers and reset counters',()=>{
  const b=boot();launch(b);b.doc.fire('keydown',{key:'ArrowRight'});b.controls[2].fire('pointerdown');b.tick(20);b.ids.restart.fire('click');
  assert.equal(b.state.status,'ready');assert.deepEqual(b.state,E.fresh(0));assert.ok(b.controls.every(c=>!c.active.has('active')));
  launch(b);b.tick(20);assert.equal(b.state.x,45);assert.equal(b.state.flapping,false);
  b.ids.course.value='2';b.ids.course.fire('change');assert.deepEqual(b.state,E.fresh(2));assert.equal(b.ids.next.hidden,true);
});

test('mock controller fixed input remains consistent at 30/60/144 display fps',()=>{
  const states=[];
  for(const hz of [30,60,144]){
    const b=boot();launch(b);b.doc.fire('keydown',{key:'ArrowRight'});b.doc.fire('keydown',{key:' '});b.tick(hz,hz);
    assert.equal(b.state.status,'playing');states.push({...b.state});
  }
  for(const s of states){
    near(s.time,1,E.DT+.000001);
    near(s.x,states[0].x,1);near(s.y,states[0].y,1);near(s.energy,states[0].energy,.3);
  }
});
