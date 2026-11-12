const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/parcel-switch/engine.js');
function create(){let s=E.create();E.start(s);return s;}
// Independent simulated operator: only public controls, no direct state writes.
function operator(s,wrongIds=[]){
  for(const p of s.parcels){
    let target=wrongIds.includes(p.id)?(p.target+1)%3:p.target;
    if(p.branch===null&&p.age>=2.8&&s.switches[0] !== (target!==0))E.flip(s,0);
    if(p.branch==='onward'&&p.exit===null&&p.age>=4.8&&s.switches[1] !== (target===2))E.flip(s,1);
  }
  E.advance(s,1/60);
}
function finish(s,wrongIds=[]){for(let i=0;i<10000&&s.phase==='playing';i++)operator(s,wrongIds);return s;}
test('review: public-control operator reaches perfect delivery',()=>{
 const s=finish(create());assert.equal(s.phase,'won');assert.equal(s.correct,18);assert.equal(s.mistakes,0);
});
test('review: two errors still complete wave; third ends it',()=>{
 const s=finish(create(),[0,1]);assert.equal(s.phase,'won');assert.equal(s.correct,16);assert.equal(s.mistakes,2);
 const t=finish(create(),[0,1,2]);assert.equal(t.phase,'lost');assert.equal(t.mistakes,3);assert.ok(t.delivered<18);
});
test('review: right routing of a red parcel is counted wrong even if subsequent switch changes',()=>{
 const s=create();E.flip(s,0);E.advance(s,3.2);E.flip(s,0);E.advance(s,2.2);E.flip(s,1);E.advance(s,1.7);assert.equal(s.mistakes,1);assert.equal(s.correct,0);
});
test('review: crossing first fork just before versus after toggle',()=>{
 const a=create(),b=create();E.advance(a,2.99);E.flip(a,0);E.advance(a,.02);
 E.advance(b,3.01);E.flip(b,0);assert.equal(a.parcels[0].branch,'onward');assert.equal(b.parcels[0].branch,'red');
});
test('review: finite huge delta terminates without unbounded spawning',()=>{
 const s=create();E.advance(s,Number.MAX_VALUE);assert.equal(s.phase,'lost');assert.equal(s.mistakes,3);assert.ok(s.spawned<=18);
});
test('review: reset preserves object identity and prevents old parcels surviving',()=>{
 const s=finish(create());const old=s.parcels;assert.equal(E.reset(s),s);assert.notEqual(s.parcels,old);assert.deepEqual(s,E.create());assert.equal(E.start(s),true);finish(s);assert.equal(s.correct,18);
});
test('review: source target list cannot be changed and invalid controls are inert',()=>{
 assert.ok(Object.isFrozen(E.targets));const s=create();for(const bad of ['0',null,undefined,NaN,1.1,{},[]])assert.equal(E.flip(s,bad),false);assert.deepEqual(s.switches,[false,false]);
});
test('review: repeated pause/resume does not cause skipped deliveries',()=>{
 const s=create();for(let i=0;i<10000&&s.phase==='playing';i++){if(i%23===0){E.pause(s);const before=JSON.stringify(s);E.advance(s,30);assert.equal(JSON.stringify(s),before);E.pause(s,false);}operator(s);}assert.equal(s.phase,'won');assert.equal(s.correct,18);
});
const vm=require('node:vm'),fs=require('node:fs');
function ui(){const elements={},events={},windowEvents={};let raf,now=1000;
 const el=id=>elements[id]||(elements[id]={dataset:{},attributes:{},setAttribute(k,v){this.attributes[k]=v;}});
 const document={hidden:false,getElementById:el,addEventListener(k,cb){events[k]=cb;}};
 const window={ParcelSwitch:E,addEventListener(k,cb){windowEvents[k]=cb;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/parcel-switch/app.js'),'utf8'),{window,document,performance:{now:()=>now},requestAnimationFrame:cb=>raf=cb});
 return{el,events,windowEvents,document,tick(dt){now+=dt*1000;raf(now);},key(key,repeat=false){events.keydown({key,repeat,preventDefault(){}});}};
}
test('review UI simulation: explanation stays still, start opens board, repeat key inert',()=>{
 const u=ui();u.tick(50);assert.equal(u.el('score').textContent,'お届け 0 / 18');assert.equal(u.el('overlay').hidden,false);u.el('start').onclick();assert.equal(u.el('overlay').hidden,true);const before=u.el('direction1').textContent;u.key('1',true);assert.equal(u.el('direction1').textContent,before);u.key('1');assert.notEqual(u.el('direction1').textContent,before);
});
test('review UI simulation: blur pauses, explicit resume, restart resets score and route',()=>{
 const u=ui();u.el('start').onclick();u.key('1');u.tick(1);u.windowEvents.blur();const before=u.el('parcels').innerHTML;u.tick(20);assert.equal(u.el('parcels').innerHTML,before);assert.equal(u.el('overlay').hidden,false);u.el('start').onclick();u.tick(1);assert.notEqual(u.el('parcels').innerHTML,before);u.el('restart').onclick();assert.equal(u.el('score').textContent,'お届け 0 / 18');assert.equal(u.el('direction1').textContent,'↙ ★ へ');assert.equal(u.el('overlay').hidden,false);
});
test('review UI simulation: no-input defeat and repeat play restore usable start',()=>{
 const u=ui();u.el('start').onclick();u.tick(40);assert.equal(u.el('overlayTitle').textContent,'仕分けを立て直そう');assert.equal(u.el('mistakes').textContent,'ミス 3 / 3');u.el('start').onclick();assert.equal(u.el('overlay').hidden,true);assert.equal(u.el('score').textContent,'お届け 0 / 18');u.tick(40);assert.equal(u.el('mistakes').textContent,'ミス 3 / 3');
});
test('review UI simulation: red parcel follows bend rather than diagonal shortcut',()=>{
 const u=ui();u.el('start').onclick();u.tick(4.5);const m=u.el('parcels').innerHTML.match(/translate\(([^,]+),([^)]*)\)/);assert.ok(m);assert.equal(Number(m[1]),45);assert.ok(Math.abs(Number(m[2])-238.5)<.1);
});
test('review UI simulation: accessible switch label follows actual route',()=>{
 const u=ui();u.el('start').onclick();assert.match(u.el('switch1').attributes['aria-label'],/現在は左の星/);u.key('1');assert.match(u.el('switch1').attributes['aria-label'],/現在は右の分岐2/);
});
