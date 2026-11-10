'use strict';
// Independent review: all match results below come from ordinary inputs, never edited game state.
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const E=require('../games/courtyard-rally/engine.js'), C=E.C;
const active=s=>s.phase==='rally'||s.phase==='between';
function run(policy,{fps=60,limit=180,onStep}={}){const s=E.create();E.start(s);while(active(s)&&s.time<limit){const before=onStep?JSON.parse(JSON.stringify(s)):null;E.advance(s,1/fps,policy(s));if(onStep)onStep(s,before);}return s;}
function farEdgeAim(s){const x=E.landing(s.ball,299),goal=s.opponent.x<150?294:6;return{target:x-Math.atan2(goal-x,258)/C.maxAngle*32};}
function reflectOracle(x){while(x<6||x>294){if(x<6)x=12-x;if(x>294)x=588-x;}return x;}
function harness(){
 const els=new Map(), listeners={}, winListeners={}, frames=new Map(); let now=0,id=0;
 const source=fs.readFileSync(require.resolve('../games/courtyard-rally/index.html'),'utf8');
 const el=name=>{if(!els.has(name))els.set(name,{id:name,tagName:'DIV',hidden:false,disabled:false,open:false,style:{},textContent:'',events:{},clientLeft:5,clientWidth:270,
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);},
  fire(type,detail={}){const e={target:this,pointerId:1,button:0,preventDefault(){},...detail};for(const fn of this.events[type]||[])fn(e);},
  click(){if(!this.disabled)this.fire('click');},setPointerCapture(){},getBoundingClientRect(){return{left:23,top:0,width:280,height:316};},showModal(){this.open=true;},close(){this.open=false;this.fire('close');}});return els.get(name);};
 for(const match of source.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=el(match[2]);e.tagName=match[1].toUpperCase();e.disabled=/\bdisabled\b/.test(match[0]);e.hidden=/\bhidden\b/.test(match[0]);}
 const document={hidden:false,getElementById:el,addEventListener:(type,fn)=>(listeners[type]??=[]).push(fn)};
 const window={CourtyardRally:E,addEventListener:(type,fn)=>(winListeners[type]??=[]).push(fn)};
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/courtyard-rally/app.js'),'utf8'),{document,window,requestAnimationFrame(fn){frames.set(++id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},Map,Set,Math});
 return{el,document,frames,fire(type,e={}){for(const fn of listeners[type]||[])fn({target:{tagName:'BODY'},repeat:false,preventDefault(){},...e});},win(type,e={}){for(const fn of winListeners[type]||[])fn(e);},frame(ms){now+=ms;const queue=[...frames.values()];frames.clear();for(const fn of queue)fn(now);},begin(){el('start').click();this.frame(0);},x(name='playerPaddle'){return parseFloat(el(name).style.left)*3;},finished(){return ['あなたの勝ち！','相手の勝ち'].includes(el('phase').textContent);}};
}

test('independent passive controls genuinely lose, including every integral fixed position',()=>{
 for(const policy of [()=>({}),()=>({direction:-1}),()=>({direction:1}),...Array.from({length:237},(_,i)=>()=>({target:32+i}))]){
  const s=run(policy);assert.equal(s.phase,'lost');assert.deepEqual(s.score,{player:0,opponent:3});
 }
});
test('independent pursuit and geometric aiming both complete real matches; aiming is quicker here',()=>{
 const track=run(s=>({target:s.ball.x})),aim=run(farEdgeAim);
 for(const s of [track,aim]){assert.equal(s.phase,'won');assert.deepEqual(s.score,{player:3,opponent:0});assert.ok(s.totalReturns>3);}
 assert.ok(aim.time<track.time);assert.ok(aim.totalReturns<track.totalReturns);
 assert.ok(Math.abs(track.time-64.5)<1e-8);assert.ok(Math.abs(aim.time-27.4833333333)<1e-8);
});
test('direction-only following completes a match without target-coordinate controls',()=>{
 const s=run(s=>({direction:Math.abs(s.ball.x-s.player.x)>1?Math.sign(s.ball.x-s.player.x):0}));
 assert.equal(s.phase,'won');assert.equal(s.score.player,3);assert.ok(s.totalReturns>20);
});
test('independent wall oracle agrees over many positive and negative folds',()=>{
 for(let x=-10000;x<=10000;x+=.25)assert.ok(Math.abs(E.folded(x)-reflectOracle(x))<1e-9,`x=${x}`);
});
test('natural rallies preserve finite bounds, honest contact angles, movement speed and scoring',()=>{
 let observedHits=0,observedPoints=0,observedCap=false;
 const s=run(s=>({target:s.ball.x}),{fps:240,onStep(after,before){
  for(const object of [after.player,after.opponent,after.ball])for(const value of Object.values(object))if(typeof value==='number')assert.ok(Number.isFinite(value));
  assert.ok(after.player.x>=32&&after.player.x<=268);assert.ok(after.opponent.x>=28&&after.opponent.x<=272);assert.ok(after.ball.x>=6-1e-9&&after.ball.x<=294+1e-9);
  assert.ok(Math.abs(after.player.x-before.player.x)<=300/240+1e-9);assert.ok(Math.abs(after.opponent.x-before.opponent.x)<=90/240+1e-9);
  const pd=after.score.player-before.score.player,od=after.score.opponent-before.score.opponent;assert.ok(pd===0||pd===1);assert.ok(od===0||od===1);assert.ok(pd+od<=1);
  if(pd+od){observedPoints++;assert.ok(pd?after.ball.y<-6:after.ball.y>346);assert.equal(after.ball.vx,0);assert.equal(after.ball.vy,0);}
  if(after.eventId!==before.eventId&&['player-hit','opponent-hit'].includes(after.lastEvent)){
   observedHits++;const down=after.lastEvent==='player-hit',face=down?299:41,contact=(face-before.ball.y)/before.ball.vy,x=reflectOracle(before.ball.x+before.ball.vx*contact),paddle=down?after.player:after.opponent,width=down?64:56;
   assert.ok(Math.abs(x-paddle.x)<=width/2+6+1e-8);
   const offset=Math.max(-1,Math.min(1,(x-paddle.x)/(width/2))),angle=offset*55*Math.PI/180;
   assert.ok(Math.abs(Math.abs(after.ball.vx)-Math.abs(Math.sin(angle)*after.ball.speed))<1e-7);
   assert.ok(Math.abs(after.ball.vy-(down?-1:1)*Math.cos(angle)*after.ball.speed)<1e-7);
   assert.equal(after.ball.speed,Math.min(270,before.ball.speed+8));if(after.ball.speed===270)observedCap=true;
  }
 }});
 assert.equal(s.phase,'won');assert.equal(observedPoints,3);assert.ok(observedHits>20);assert.ok(observedCap);
});
test('full idle loss is identical under 30, 60, 144 fps or a large elapsed interval',()=>{
 const results=[30,60,144].map(fps=>run(()=>({}),{fps})),big=E.create();E.start(big);E.advance(big,60);
 for(const s of results)assert.deepEqual(s,big);
});
test('completed winning and losing matches freeze; clean creation does not preserve prior input or score',()=>{
 for(const s of [run(farEdgeAim),run(()=>({}))]){const before=JSON.stringify(s);E.advance(s,500,{direction:-1,target:0});E.start(s);E.pause(s,false);assert.equal(JSON.stringify(s),before);}
 assert.deepEqual(E.create(),E.create());assert.equal(E.create().phase,'ready');
});
test('controller completes genuine keyboard and held-button victories using displayed shuttle only',()=>{
 for(const mode of ['keys','buttons']){const h=harness();h.begin();let direction=0;
  for(let frame=0;frame<12000&&!h.finished();frame++){
   const delta=h.x('shuttle')-h.x(),next=Math.abs(delta)>1?Math.sign(delta):0;
   if(next!==direction){
    if(direction){if(mode==='keys')h.fire('keyup',{key:direction<0?'ArrowLeft':'ArrowRight'});else h.el(direction<0?'left':'right').fire('pointerup',{pointerId:9});}
    if(next){if(mode==='keys')h.fire('keydown',{key:next<0?'ArrowLeft':'ArrowRight'});else h.el(next<0?'left':'right').fire('pointerdown',{pointerId:9});}
    direction=next;
   }h.frame(1000/60);
  }
  assert.equal(h.el('phase').textContent,'あなたの勝ち！',mode);assert.equal(h.el('playerScore').textContent,'3');assert.equal(h.frames.size,0);
  h.el('start').click();assert.equal(h.el('phase').textContent,'開始前');assert.equal(h.el('playerScore').textContent,'0');assert.equal(h.x(),150);h.begin();h.frame(100);assert.equal(h.x(),150);
 }
});
test('controller drag correctly subtracts court border and stops on global release',()=>{
 const h=harness();h.begin();h.el('court').fire('pointerdown',{pointerId:12,clientX:23+5+270*.75});h.frame(300);assert.ok(Math.abs(h.x()-225)<1e-7);
 h.el('court').fire('pointermove',{pointerId:13,clientX:28});h.frame(100);assert.ok(Math.abs(h.x()-225)<1e-7);
 h.win('pointerup',{pointerId:12});h.el('court').fire('pointermove',{pointerId:12,clientX:28});h.frame(100);assert.ok(Math.abs(h.x()-225)<1e-7);
});
test('interruption discards drag and both key aliases; help remains explicitly paused',()=>{
 const h=harness();h.begin();h.el('court').fire('pointerdown',{pointerId:12,clientX:290});h.fire('keydown',{key:'a'});h.fire('keydown',{key:'ArrowLeft'});h.frame(100);const x=h.x();
 h.el('help').click();assert.equal(h.frames.size,0);h.el('instructions').fire('cancel');h.el('instructions').close();h.frame(30000);assert.equal(h.x(),x);assert.equal(h.frames.size,0);
 h.el('start').click();h.frame(0);h.frame(100);assert.equal(h.x(),x);assert.equal(h.el('opponentScore').textContent,'0');
});
test('natural controller failure and restart keep ready state motionless after stale releases',()=>{
 const h=harness();h.begin();h.frame(10000);assert.equal(h.el('phase').textContent,'相手の勝ち');assert.equal(h.el('opponentScore').textContent,'3');
 h.el('start').click();h.win('pointerup',{pointerId:1});h.fire('keyup',{key:'d'});h.frame(60000);assert.equal(h.el('phase').textContent,'開始前');assert.equal(h.frames.size,0);assert.equal(h.x(),150);
});
