'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs'), vm=require('node:vm');
const G=require('../games/market-snowplow/engine.js');
const source=fs.readFileSync(require.resolve('../games/market-snowplow/app.js'),'utf8');
function mount(){
 let now=0, next;
 const events={}, nodes={};
 const ctx=new Proxy({}, {get:(o,k)=>o[k]||(()=>{})});
 const doc={activeElement:null,hidden:false,
  querySelectorAll:()=>dirs,
  getElementById:id=>nodes[id]??=(node(id,id==='board'?'CANVAS':'BUTTON')),
  addEventListener:(k,f)=>events['doc:'+k]=f};
 const node=(id,tagName='BUTTON')=>({id,tagName,dataset:{},hidden:false,disabled:false,textContent:'',firstChild:{textContent:''}, classList:{toggle(){}},
  getContext:()=>ctx, setPointerCapture(){},focus(){doc.activeElement=this;},handlers:{},
  addEventListener(k,f){this.handlers[k]=f;},
  fire(k,details={}){this.handlers[k]?.({detail:1,isPrimary:true,button:0,pointerId:1,preventDefault(){},...details})}});
 const dirs=Object.keys(G.dirs).map(d=>{const b=node(d);b.dataset.dir=d;return b});
 vm.runInNewContext(source,{
  window:{Snowplow:G},document:doc,performance:{now:()=>now},
  addEventListener:(k,f)=>events[k]=f,requestAnimationFrame:f=>{next=f;}
 });
 return {nodes,dirs,doc, tick(ms){now+=ms;next(now);},
  event(k,args={}){events[k]({target:doc.activeElement||nodes.board,preventDefault(){},...args})}};
}
test('keyboard wins via real controller event sequence and retry resets counters',()=>{
 const h=mount(),{nodes}=h;nodes.primary.focus();nodes.primary.fire('click');
 assert.equal(h.doc.activeElement,nodes.board);assert.equal(nodes.overlay.hidden,true);
 const keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',dump:' '};
 const seq='up up up up up up left left dump down down left down down down down up up right right right down down right right dump up up right down down left dump up up right up up up left up left left left left dump down left up right dump'.split(' ');
 for(const d of seq){const key=keys[d];h.event('keydown',{key});h.event('keyup',{key});h.tick(225);}
 assert.equal(nodes.heading.textContent,'準備完了！');assert.equal(nodes.overlay.hidden,false);
 assert.match(nodes.description.textContent,/46歩・排雪5回/);
 nodes.primary.fire('click');assert.equal(nodes.remaining.textContent,'13 / 13');assert.equal(nodes.cargo.textContent,'0 / 4');
 assert.equal(nodes.overlay.hidden,true);assert.equal(nodes.time.firstChild.textContent,38);
});
test('held pointer advances, blur pauses and clears capture-generated movement, deadline and retry',()=>{
 const h=mount(),{nodes,dirs}=h;nodes.primary.fire('click');
 const up=dirs.find(x=>x.dataset.dir==='up');up.fire('pointerdown');
 h.tick(225);h.tick(225);assert.equal(nodes.cargo.textContent,'2 / 4');
 h.event('blur');assert.equal(nodes.heading.textContent,'一時停止中');
 h.tick(50_000);assert.equal(nodes.time.firstChild.textContent,38);
 nodes.primary.fire('click');h.tick(450);assert.equal(nodes.cargo.textContent,'2 / 4');
 h.tick(40_000);assert.equal(nodes.heading.textContent,'時間切れ');assert.equal(nodes.dump.disabled,true);
 nodes.primary.fire('click');assert.equal(nodes.remaining.textContent,'13 / 13');assert.equal(nodes.cargo.textContent,'0 / 4');
});
test('single touch does not double move when pointerup and click arrive, and capture loss releases',()=>{
 const h=mount(),{nodes,dirs}=h;nodes.primary.fire('click');
 const up=dirs.find(x=>x.dataset.dir==='up');up.fire('pointerdown');up.fire('pointerup');up.fire('click',{detail:1});
 h.tick(1000);assert.equal(nodes.cargo.textContent,'0 / 4');
 up.fire('pointerdown');up.fire('lostpointercapture');h.tick(1000);assert.equal(nodes.cargo.textContent,'0 / 4');
 up.fire('click',{detail:0});assert.equal(nodes.cargo.textContent,'2 / 4');
});

test('E dumps with a direction button focused; Space remains native to focused buttons',()=>{
 const h=mount(),{nodes,dirs}=h;nodes.primary.focus();nodes.primary.fire('click');
 for(const key of ['ArrowUp','ArrowUp','ArrowUp','ArrowUp','ArrowUp','ArrowUp','ArrowLeft','ArrowLeft']){
  h.event('keydown',{key});h.event('keyup',{key});h.tick(225);
 }
 assert.equal(nodes.cargo.textContent,'4 / 4');
 dirs.find(x=>x.dataset.dir==='left').focus();
 h.event('keydown',{key:' '});assert.equal(nodes.cargo.textContent,'4 / 4');
 h.event('keydown',{key:'e',repeat:true});assert.equal(nodes.cargo.textContent,'4 / 4');
 h.event('keydown',{key:'e'});assert.equal(nodes.cargo.textContent,'0 / 4');
 assert.match(nodes.feedback.textContent,/排雪完了/);
});
