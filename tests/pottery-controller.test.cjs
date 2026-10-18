'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs');
function harness(){
 const nodes={};const noop=()=>{};
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop})},{get:(o,p)=>p in o?o[p]:noop,set:(o,p,v)=>(o[p]=v,true)});
 function el(id){return nodes[id]??= {id,textContent:'',disabled:false,hidden:false,value:'3',handlers:{},attributes:{},classList:{toggle:noop},addEventListener(k,f){this.handlers[k]=f;},setAttribute(k,v){this.attributes[k]=v;},getContext:()=>ctx,getBoundingClientRect:()=>({left:0,top:0,width:360,height:290}),setPointerCapture:noop,focus:noop,click(){if(!this.disabled)this.handlers.click?.();}};}
 const orders=[0,1,2].map(i=>el('order'+i));
 const doc={hidden:false,handlers:{},getElementById:el,querySelectorAll:()=>orders,addEventListener(k,f){this.handlers[k]=f;}};
 const win={handlers:{},addEventListener(k,f){this.handlers[k]=f;}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../games/pottery-workshop/app.js','utf8'),{PotteryWorkshop:require('../games/pottery-workshop/engine.js'),document:doc,window:win});
 return {el,orders,doc,win,height(i){el('height').value=String(i);el('height').handlers.change();},key(key,options={}){let prevented=false;doc.handlers.keydown({key,target:{tagName:'CANVAS'},preventDefault(){prevented=true;},...options});return prevented;},pointer(type,x,y,id=1){el('clay').handlers[type]({clientX:x,clientY:y,pointerId:id,button:0,preventDefault:noop});}};
}
function winCup(h){for(const [band,count] of [[3,2],[2,2],[4,2],[1,1]]){h.height(band);for(let n=0;n<count;n++)h.el('widen').click();}h.el('fire').click();}
test('DOM control route reaches success, next order, failure and retry',()=>{
 const h=harness();winCup(h);assert.match(h.el('result-title').textContent,/できました/);assert.equal(h.el('matched').textContent,'7 / 7');assert.equal(h.el('effort').textContent,'7');assert.equal(h.el('widen').disabled,true);
 h.el('next').click();assert.equal(h.el('order-name').textContent,'一輪の花びん');assert.equal(h.el('effort').textContent,'18');assert.equal(h.el('result').hidden,true);
 h.el('fire').click();assert.match(h.el('result-title').textContent,/あと少し/);h.el('retry').click();assert.equal(h.el('effort').textContent,'18');assert.equal(h.el('fire').disabled,false);
});
test('keyboard chooses height and shapes, with repeated input suppressed',()=>{
 const h=harness();h.key('1');assert.equal(h.el('height').value,'0');h.key('ArrowRight');assert.equal(h.el('effort').textContent,'13');h.key('ArrowRight',{repeat:true});assert.equal(h.el('effort').textContent,'13');
 assert.equal(h.key('Enter',{repeat:true,target:{tagName:'BUTTON'}}),true);h.key('ArrowDown');assert.equal(h.el('height').value,'1');h.key('ArrowUp');assert.equal(h.el('height').value,'0');
});
test('native select and buttons retain their keyboard behavior',()=>{
 const h=harness();assert.equal(h.key('ArrowRight',{target:{tagName:'SELECT'}}),false);assert.equal(h.el('effort').textContent,'14');assert.equal(h.key('1',{target:{tagName:'BUTTON'}}),false);assert.equal(h.el('height').value,'3');
});
test('right-side pointer drag changes clay live and release stops shaping',()=>{
 const h=harness();h.pointer('pointerdown',232,126);h.pointer('pointermove',256,126);assert.equal(h.el('effort').textContent,'12');assert.match(h.el('current-shape').textContent,/4番の太さ60/);
 h.pointer('pointerup',256,126);h.pointer('pointermove',272,126);assert.equal(h.el('effort').textContent,'12');
});
test('left-side outward drag widens, not narrows',()=>{
 const h=harness();h.pointer('pointerdown',128,126);h.pointer('pointermove',116,126);assert.match(h.el('current-shape').textContent,/4番の太さ56/);assert.equal(h.el('effort').textContent,'13');
});
test('vertical pointer movement selects another band without a stroke',()=>{
 const h=harness();h.pointer('pointerdown',232,126);h.pointer('pointermove',232,42);assert.equal(h.el('height').value,'0');assert.equal(h.el('effort').textContent,'14');
});
test('pointer cancel, capture loss, blur and visibility clear in-flight gestures',()=>{
 for(const clear of ['pointercancel','lostpointercapture','blur','visibility']){const h=harness();h.pointer('pointerdown',232,126);if(clear==='blur')h.win.handlers.blur();else if(clear==='visibility'){h.doc.hidden=true;h.doc.handlers.visibilitychange();}else h.pointer(clear,232,126);h.pointer('pointermove',260,126);assert.equal(h.el('effort').textContent,'14');}
});
test('second pointer cannot replace first gesture or release it',()=>{
 const h=harness();h.pointer('pointerdown',232,126,1);h.pointer('pointerdown',232,42,2);h.pointer('pointermove',260,42,2);assert.equal(h.el('effort').textContent,'14');h.pointer('pointerup',260,42,2);h.pointer('pointermove',244,126,1);assert.equal(h.el('effort').textContent,'13');
});
test('effort exhaustion locks tools but permits kiln and retry',()=>{
 const h=harness();for(let i=0;i<14;i++)h.el(i%2?'narrow':'widen').click();assert.equal(h.el('effort').textContent,'0');assert.equal(h.el('widen').disabled,true);assert.equal(h.el('fire').disabled,false);assert.match(h.el('feedback').textContent,/使い切り/);h.el('fire').click();h.el('retry').click();assert.equal(h.el('effort').textContent,'14');assert.equal(h.el('widen').disabled,false);
});
test('order switching resets active drag and terminal next is guarded',()=>{
 const h=harness();h.pointer('pointerdown',232,126);h.orders[2].click();h.pointer('pointermove',260,126);assert.equal(h.el('effort').textContent,'16');assert.equal(h.el('order-name').textContent,'ひらく菓子鉢');h.el('next').handlers.click();assert.equal(h.el('order-name').textContent,'ひらく菓子鉢');
});
test('result provides live success/failure text and terminal gestures do nothing',()=>{
 const h=harness();winCup(h);assert.match(h.el('feedback').textContent,/完成/);h.key('ArrowRight');h.pointer('pointerdown',232,126);h.pointer('pointermove',260,126);assert.equal(h.el('effort').textContent,'7');h.el('retry').click();h.el('fire').click();assert.match(h.el('feedback').textContent,/あと少し/);
});
