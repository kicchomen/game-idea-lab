'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const E=require('../games/hush-courier/engine.js');
function boot(){
 let state,frame,clock=1;
 class Element{constructor(control){this.dataset={control};this.handlers={};this.disabled=false;this.hidden=false;this.textContent='';this.tagName='BUTTON';this.classList={add(){},remove(){}};}addEventListener(type,cb){(this.handlers[type]??=[]).push(cb);}setAttribute(){}setPointerCapture(){}fire(type,extra={}){const event={key:'',pointerId:1,preventDefault(){this.prevented=true;},target:this,...extra};for(const f of this.handlers[type]||[])f(event);return event;}}
 const ids={};for(const id of ['world','pause','overlay','heading','primary','overline','description','restart','parcels','time','suspicion','breath','phase','hint'])ids[id]=new Element();
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});ids.world.getContext=()=>ctx;
 const controls=['left','right','sprint','hide'].map(x=>new Element(x)),win=new Element(),doc=new Element();doc.getElementById=id=>ids[id];doc.querySelectorAll=()=>controls;doc.hidden=false;
 const engine={...E,create(){state=E.create();return state;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/hush-courier/game.js'),'utf8'),{HushCourier:engine,document:doc,window:win,requestAnimationFrame:cb=>frame=cb,Set,Map,Math});
 function tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;frame(clock);}}
 tick();return{ids,controls,win,doc,tick,get state(){return state;}};
}
test('controller starts, repeated keydown does not multiply speed, keyup stops',()=>{const b=boot();b.ids.primary.fire('click');for(let i=0;i<60;i++){b.win.fire('keydown',{key:'ArrowRight',repeat:i>0});b.tick();}assert.ok(b.state.x>45&&b.state.x<47);b.win.fire('keyup',{key:'ArrowRight'});const x=b.state.x;b.tick(20);assert.equal(b.state.x,x);});
test('Space prevents page scroll and hide pointer cancel/leave release',()=>{const b=boot();b.ids.primary.fire('click');assert.equal(b.win.fire('keydown',{key:' '}).prevented,true);b.win.fire('keyup',{key:' '});b.controls[2].fire('pointerdown');b.tick(10);const x=b.state.x;b.controls[2].fire('pointercancel');b.tick(10);assert.equal(b.state.x,x);b.controls[2].fire('pointerdown');b.tick(10);b.controls[2].fire('pointerleave');const y=b.state.x;b.tick(10);assert.equal(b.state.x,y);});
test('blur pauses, explicit resume clears held keys and pointer input',()=>{const b=boot();b.ids.primary.fire('click');b.win.fire('keydown',{key:'ArrowRight'});b.controls[2].fire('pointerdown');b.tick(30);b.win.fire('blur');const time=b.state.time,x=b.state.x;b.tick(100);assert.equal(b.state.status,'paused');assert.equal(b.state.time,time);b.ids.primary.fire('click');b.tick(30);assert.equal(b.state.status,'playing');assert.equal(b.state.x,x);});
test('hidden page pauses, repeated pause key does not toggle, restart clears',()=>{const b=boot();b.ids.primary.fire('click');b.tick(10);b.doc.hidden=true;b.doc.fire('visibilitychange');assert.equal(b.state.status,'paused');b.win.fire('keydown',{key:'p',repeat:true});assert.equal(b.state.status,'paused');b.ids.restart.fire('click');assert.equal(b.state.tick,0);assert.equal(b.state.x,28);assert.deepEqual(b.state.delivered,[false,false,false]);});
test('actual controller keys complete a full run and retry',()=>{const b=boot();b.ids.primary.fire('click');let held='';for(let i=0;i<3400&&b.state.status==='playing';i++){
 const s=b.state,target=Math.min(Math.floor(s.time/E.CYCLE),2);const mode=E.phase(s)==='watch'||(s.time%E.CYCLE>=5.25&&E.cover(s)>=0)?'hide':!s.delivered[target]&&s.x<E.HOMES[target]?'run':'';
 if(mode!==held){for(const key of ['ArrowRight','Shift',' '])b.win.fire('keyup',{key});if(mode==='hide')b.win.fire('keydown',{key:' '});if(mode==='run'){b.win.fire('keydown',{key:'ArrowRight'});b.win.fire('keydown',{key:'Shift'});}held=mode;}b.tick();}
 assert.equal(b.state.status,'won');assert.equal(b.ids.overlay.hidden,false);assert.match(b.ids.heading.textContent,/お届け完了/);assert.ok(b.controls.every(c=>c.disabled));b.ids.primary.fire('click');assert.equal(b.state.status,'playing');assert.equal(b.state.tick,0);assert.deepEqual(b.state.delivered,[false,false,false]);b.tick(20);assert.equal(b.state.x,28);
});
test('pointer running reaches visible loss, retry works and old input is cleared',()=>{const b=boot();b.ids.primary.fire('click');b.controls[2].fire('pointerdown');b.tick(500);assert.equal(b.state.status,'lost');assert.equal(b.ids.overlay.hidden,false);b.ids.primary.fire('click');b.tick(30);assert.equal(b.state.status,'playing');assert.equal(b.state.x,28);});
