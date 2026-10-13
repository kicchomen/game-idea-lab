'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('../games/lost-property/engine.js');
const assignments = [];
for (let a=0;a<5;a++) for(let b=0;b<5;b++) for(let c=0;c<5;c++) if(a!==b&&a!==c&&b!==c) assignments.push([a,b,c]);
// Deliberately independent predicates: these encode the displayed witness claims,
// rather than calling production matches() or interpreting its rules array.
const witnesses = [
 (a,b,c)=>a.color==='赤'&&a.mark==='星'&&b.color==='赤'&&c.color==='青'&&c.material==='布',
 (a,b,c)=>a.color==='白'&&a.mark==='星'&&b.color==='白'&&c.material==='革'&&c.mark==='月',
 (a,b,c)=>a.color==='白'&&a.mark==='星'&&b.material===a.material&&c.color==='黒'&&c.mark===b.mark
];
function independentSolutions(id, items=E.cases[id].items) { return assignments.filter(p=>witnesses[id](...p.map(i=>items[i]))); }
function knowledgeSolutions(id, observed) {
 const items=E.cases[id].items.map(x=>({...x})), unseen=items.map((_,i)=>i).filter(i=>!observed.includes(i)), possible=new Set();
 function visit(k) {
  if(k===unseen.length){for(const p of independentSolutions(id,items))possible.add(p.join(','));return;}
  for(const mark of ['星','月','葉']){items[unseen[k]].mark=mark;visit(k+1);}
 }
 visit(0);return [...possible].sort();
}
const assignAll=(s,values)=>values.reduce((s,item,person)=>E.act(s,{type:'assign',person,item}),s);
function boot(){
 const nodes=new Map(), docEvents={}, document={activeElement:null,getElementById:get,addEventListener:(k,v)=>docEvents[k]=v};
 function node(id,dataset={}){
  return {id,dataset,tagName:id==='case'?'SELECT':'BUTTON',events:{},children:[],value:'',disabled:false,hidden:false,textContent:'',className:'',
   addEventListener(k,v){this.events[k]=v;},focus(){document.activeElement=this;},
   closest(s){return s==='[data-inspect]'&&this.dataset.inspect!==undefined?this:null;},
   querySelector(s){const m=s.match(/^\[data-person="(\d+)"\]$/);return m?this.children.find(x=>x.dataset.person===m[1]):null;},
   set innerHTML(value){this._html=value;if(this.children.includes(document.activeElement))document.activeElement=null;
    if(id==='shelf')this.children=[...value.matchAll(/<button\b([^>]*)>/g)].map(m=>{const x=node('inspect',{inspect:m[1].match(/data-inspect="(\d+)"/)[1]});x.disabled=/\bdisabled\b/.test(m[1]);return x;});
    if(id==='people')this.children=[...value.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)].map(m=>{const x=node('person',{person:m[1].match(/data-person="(\d+)"/)[1]});x.tagName='SELECT';x.disabled=/\bdisabled\b/.test(m[1]);x.value=m[2].match(/<option value="([^"]*)" selected>/)?.[1]||'';return x;});
   },get innerHTML(){return this._html||'';}
  };
 }
 function get(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id);}
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/lost-property/app.js'),'utf8'),{LostProperty:E,document});
 return {get,document,
  click(id){const el=get(id);if(!el.disabled&&!el.hidden)el.events.click({target:el});},
  inspect(i){const el=get('shelf').children[i];get('shelf').events.click({target:el});},
  assign(p,value){const el=get('people').children[p];if(el.disabled)return;el.value=value===null?'':String(value);get('people').events.change({target:el});},
  choose(id){get('case').events.change({target:{value:String(id)}});},
  key(key,props={}){let prevented=false;docEvents.keydown({key,repeat:false,target:{tagName:'BODY'},preventDefault(){prevented=true;},...props});return prevented;}
 };
}

test('all three displayed claim sets have exactly one distinct-item solution, independently enumerated',()=>{
 for(let id=0;id<3;id++){assert.deepEqual(independentSolutions(id),[[[0,1,2],[2,4,0],[3,1,4]][id]]);assert.deepEqual(E.solutions(E.cases[id]),independentSolutions(id));}
});
test('observation-only deduction reaches the unique answer within every advertised budget',()=>{
 const routes=[[1],[1,4],[1,2,4]], answers=['0,1,2','2,4,0','3,1,4'];
 for(let id=0;id<3;id++){assert.ok(routes[id].length<=E.cases[id].budget);assert.deepEqual(knowledgeSolutions(id,routes[id]),[answers[id]]);assert.ok(knowledgeSolutions(id,[]).length>1);}
});
test('third case is genuinely relational: minimum three observations; only B,C,E works at that size',()=>{
 for(let mask=0;mask<32;mask++){const seen=[0,1,2,3,4].filter(i=>mask&(1<<i));if(seen.length<3)assert.ok(knowledgeSolutions(2,seen).length>1);if(seen.length===3)assert.equal(knowledgeSolutions(2,seen).length===1,seen.join(',')==='1,2,4');}
});
test('third-case poor investigation choices can retain ambiguity at budget four',()=>{
 assert.equal(knowledgeSolutions(2,[0,1,2,3]).length,2);
 assert.equal(knowledgeSolutions(2,[0,1,3,4]).length,3);
 assert.equal(knowledgeSolutions(2,[0,2,3,4]).length,2);
 assert.deepEqual(knowledgeSolutions(2,[0,1,2,4]),['3,1,4']);
 assert.deepEqual(knowledgeSolutions(2,[1,2,3,4]),['3,1,4']);
});
test('invalid/repeated investigation and incomplete submission consume neither history nor budget',()=>{
 let s=E.act(E.create(),{type:'inspect',item:1});
 for(const item of [-1,5,1.5,'1',null,undefined,NaN,Infinity,1])assert.deepEqual(E.act(s,{type:'inspect',item}),s);
 assert.deepEqual(E.act(s,{type:'submit'}),s);assert.deepEqual(E.act(s,{type:'unknown'}),s);
});
test('assignment transfers ownership atomically and clearing/invalid actions remain safe',()=>{
 let s=E.act(E.create(),{type:'assign',person:0,item:2});s=E.act(s,{type:'assign',person:1,item:2});assert.deepEqual(s.assigned,[null,2,null]);
 for(const person of [-1,3,1.5,'1',undefined])assert.deepEqual(E.act(s,{type:'assign',person,item:1}),s);
 for(const item of [-1,5,1.5,'1',undefined])assert.deepEqual(E.act(s,{type:'assign',person:2,item}),s);
 const before=s;s=E.act(s,{type:'assign',person:1,item:null});assert.deepEqual(s.assigned,[null,null,null]);assert.deepEqual(E.act(s,{type:'undo'}),before);
});
test('zero investigation budget does not block tentative assignments or successful return',()=>{
 let s=E.create();for(const item of [3,4])s=E.act(s,{type:'inspect',item});assert.equal(s.remaining,0);assert.equal(s.status,'playing');assert.deepEqual(E.act(s,{type:'inspect',item:0}),s);
 s=assignAll(s,[0,1,2]);s=E.act(s,{type:'submit'});assert.equal(s.status,'won');assert.deepEqual(s.revealed,[3,4]);
});
test('won and lost states freeze gameplay; undo restores the exact pre-return state',()=>{
 for(const values of [[0,1,2],[0,1,3]]){const before=assignAll(E.create(),values);const terminal=E.act(before,{type:'submit'});assert.equal(terminal.status,values[2]===2?'won':'lost');
  for(const action of [{type:'inspect',item:0},{type:'assign',person:0,item:4},{type:'submit'}])assert.deepEqual(E.act(terminal,action),terminal);
  assert.deepEqual(E.act(terminal,{type:'undo'}),before);assert.deepEqual(E.act(terminal,{type:'reset'}),E.create());
 }
});
test('reset and case switch clear observations, allocations, status and history',()=>{
 let s=E.act(E.create(1),{type:'inspect',item:1});s=assignAll(s,[0,1,3]);s=E.act(s,{type:'submit'});
 assert.deepEqual(E.act(s,{type:'reset'}),E.create(1));assert.deepEqual(E.act(s,{type:'case',value:2}),E.create(2));
 for(const value of [-1,3,1.2,'1',undefined])assert.deepEqual(E.act(s,{type:'case',value}),s);
 assert.deepEqual(E.act(E.create(),{type:'undo'}),E.create());
});
test('undo cannot refund investigations or hide observations, including across earlier assignment history',()=>{
 const before=E.create();const after=E.act(before,{type:'inspect',item:0});assert.equal(after.remaining,before.remaining-1);assert.deepEqual(E.act(after,{type:'undo'}),after);
 let s=E.act(E.create(),{type:'assign',person:0,item:0});s=E.act(s,{type:'inspect',item:1});s=E.act(s,{type:'undo'});assert.deepEqual(s.assigned,[null,null,null]);assert.deepEqual(s.revealed,[1]);assert.equal(s.remaining,1);assert.deepEqual(E.act(s,{type:'undo'}),s);
});
test('engine action sequences preserve uniqueness, budget bounds, and immutable inputs',()=>{
 let seed=137,s=E.create();const rnd=n=>{seed=(1664525*seed+1013904223)>>>0;return seed%n;};
 for(let i=0;i<1200;i++){const actions=[{type:'inspect',item:rnd(8)-1},{type:'assign',person:rnd(5)-1,item:rnd(7)-1},{type:'submit'},{type:'undo'},{type:'reset'},{type:'case',value:rnd(4)}];const action=actions[rnd(actions.length)],before=JSON.stringify(s);const next=E.act(s,action);assert.equal(JSON.stringify(s),before);s=next;
  const values=s.assigned.filter(x=>x!==null);assert.equal(new Set(values).size,values.length);assert.ok(s.remaining>=0&&s.remaining<=E.cases[s.caseId].budget);assert.equal(s.remaining+s.revealed.length,E.cases[s.caseId].budget);assert.equal(new Set(s.revealed).size,s.revealed.length);
 }
});
test('mock DOM initial state conceals every inner mark and disables premature return',()=>{
 const b=boot();assert.equal(b.get('shelf').children.length,5);assert.equal((b.get('shelf').innerHTML.match(/内側：未調査/g)||[]).length,5);assert.equal(b.get('people').children.length,3);assert.equal(b.get('submit').disabled,true);assert.equal(b.get('undo').disabled,true);assert.equal(b.get('next').hidden,true);
});
test('mock DOM investigation, transfer, clearing, and select focus use production controller',()=>{
 const b=boot();b.inspect(1);assert.equal(b.get('budget').textContent,'調査 あと1回');assert.match(b.get('shelf').innerHTML,/内側：月印/);b.inspect(1);assert.equal(b.get('budget').textContent,'調査 あと1回');
 b.assign(0,0);b.assign(1,0);assert.equal(b.get('people').children[0].value,'');assert.equal(b.get('people').children[1].value,'0');assert.equal(b.document.activeElement,b.get('people').children[1]);b.assign(1,null);assert.equal(b.get('people').children[1].value,'');
});
test('mock DOM failure undo, victory, next case and last-case ending work end to end',()=>{
 const b=boot();[0,1,3].forEach((v,p)=>b.assign(p,v));b.click('submit');assert.equal(b.get('status').className,'lost');assert.ok(b.get('people').children.every(x=>x.disabled));assert.ok(b.get('shelf').children.every(x=>x.disabled));b.click('undo');assert.equal(b.get('status').className,'playing');b.assign(2,2);b.click('submit');assert.equal(b.get('status').className,'won');assert.equal(b.get('next').hidden,false);b.click('next');assert.equal(b.get('case').value,1);assert.equal(b.get('undo').disabled,true);
 b.choose(2);[3,1,4].forEach((v,p)=>b.assign(p,v));b.click('submit');assert.equal(b.get('status').className,'won');assert.equal(b.get('next').hidden,true);b.click('reset');assert.equal(b.get('status').className,'playing');assert.equal(b.get('budget').textContent,'調査 あと4回');
});
test('mock DOM budget exhaustion leaves return available and keyboard undo respects selects/repeats',()=>{
 const b=boot();b.inspect(3);b.inspect(4);assert.equal(b.get('budget').textContent,'調査 あと0回');assert.ok(b.get('shelf').children.every(x=>x.disabled));[0,1,2].forEach((v,p)=>b.assign(p,v));assert.equal(b.get('submit').disabled,false);
 assert.equal(b.key('z',{target:{tagName:'SELECT'}}),false);assert.equal(b.key('z',{repeat:true}),false);assert.equal(b.key('Enter',{repeat:true}),true);assert.equal(b.key(' '),false);assert.equal(b.key('z'),true);assert.equal(b.get('submit').disabled,true);
});
test('static interface states existence and exclusivity rules and contains no runtime network/storage dependency',()=>{
 const html=fs.readFileSync(require.resolve('../games/lost-property/index.html'),'utf8'),css=fs.readFileSync(require.resolve('../games/lost-property/style.css'),'utf8');assert.match(html,/必ずここにあります/);assert.match(html,/同じ袋は2人に渡せません/);assert.match(html,/aria-live="polite"/);assert.match(html,/width=device-width/);assert.match(css,/min-height:44px/);assert.match(css,/prefers-reduced-motion/);
 for(const file of ['engine.js','app.js'])assert.doesNotMatch(fs.readFileSync(require.resolve('../games/lost-property/'+file),'utf8'),/fetch\(|XMLHttpRequest|localStorage|sessionStorage|https?:\/\//);
});
