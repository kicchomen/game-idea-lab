// Independent reviewer checks: no browser, external service, or production changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('../games/fossil-museum/engine.js');
const json = x => JSON.parse(JSON.stringify(x));
function adjacent(i, j, diagonal = false) {
  const dx = Math.abs(i % 6 - j % 6), dy = Math.abs(Math.floor(i / 6) - Math.floor(j / 6));
  return diagonal ? Math.max(dx, dy) === 1 : dx + dy === 1;
}
function expectedBorder(config, specimen) {
  const occupied = new Set(config.specimens.flatMap(p => p.cells));
  return Array.from({length:36}, (_, i) => i).filter(i => !occupied.has(i) && specimen.cells.some(j => adjacent(i,j)));
}
function assertState(s) {
  const cfg = E.sites[s.site], fossil = new Set(cfg.specimens.flatMap(p => p.cells));
  assert.ok(s.remaining >= 0);
  assert.equal(s.chips, s.cells.filter(c => c.chipped).length);
  assert.equal(s.actions, s.cells.filter(c=>c.open).length - cfg.openSoil.length - cfg.specimens.length);
  for(let i=0;i<36;i++) {
    const clue = [...fossil].filter(j=>adjacent(i,j,true)).length;
    assert.equal(E.clue(s,i),clue);
    const visible=E.visible(s,i);
    if(!s.cells[i].open) assert.deepEqual(visible,{open:false});
    else if(!fossil.has(i)) assert.equal(visible.count,clue);
  }
  const specimens=E.specimens(s);
  for(let id=0;id<specimens.length;id++) {
    const border=expectedBorder(cfg,cfg.specimens[id]);
    assert.deepEqual([...specimens[id].border].sort((a,b)=>a-b),border);
    assert.equal(specimens[id].complete,[...cfg.specimens[id].cells,...border].every(i=>s.cells[i].open));
  }
  const found=specimens.filter(p=>p.complete).length;
  const expected=s.chips>=3?'lost':found===2?'won':s.remaining===0?'lost':'playing';
  assert.equal(s.status,expected);
}
let seed=0x6673736c;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32};

test('independent random command/undo invariants across 600 runs',()=>{
  for(let run=0;run<600;run++) {
    const s=E.create(run%3), stack=[];
    for(let step=0;step<80;step++) {
      const before=json(s);
      if(random()<0.22) {
        const changed=E.undo(s);
        assert.equal(changed,stack.length>0);
        assert.deepEqual(s,changed?stack.pop():before);
      } else {
        const index=Math.floor(random()*42)-3,tool=random()<0.52?'brush':'pick';
        const changed=E.dig(s,index,tool);
        if(changed) {
          stack.push(before);
          assert.equal(s.remaining,before.remaining-(tool==='brush'?2:1));
          assert.equal(s.history.length,before.history.length+1);
        } else assert.deepEqual(s,before);
      }
      assertState(s);
    }
  }
});

test('independently derived border: omitting any required soil prevents that extraction',()=>{
  for(let site=0;site<3;site++) for(let id=0;id<2;id++) {
    const cfg=E.sites[site],spec=cfg.specimens[id],border=expectedBorder(cfg,spec);
    for(const omitted of border) {
      const s=E.create(site);
      // Isolate collection geometry independently of finite-resource solvability.
      s.cells.forEach((c,i)=>c.open=(spec.cells.includes(i)||border.includes(i))&&i!==omitted);
      assert.equal(E.specimens(s)[id].complete,false);
      s.cells[omitted].open=true;
      assert.equal(E.specimens(s)[id].complete,true);
    }
  }
});

test('300 varied visible-information-only routes win, with no hidden-map decisions',()=>{
  for(let run=0;run<300;run++) {
    const s=E.create(run%3);
    let moves=0;
    while(s.status==='playing') {
      const visible=Array.from({length:36},(_,i)=>E.visible(s,i));
      const candidates=[];
      for(let i=0;i<36;i++) {
        const v=visible[i];
        if(!v.open||v.kind==='soil') continue;
        for(const d of v.connections) {
          const j=i+({n:-6,e:1,s:6,w:-1}[d]);
          if(!visible[j].open)candidates.push([j,'brush']);
        }
      }
      if(!candidates.length) for(let i=0;i<36;i++) {
        const v=visible[i];if(!v.open||v.kind==='soil')continue;
        for(let j=0;j<36;j++)if(adjacent(i,j)&&!visible[j].open)candidates.push([j,'pick']);
      }
      assert.ok(candidates.length,'Visible information always supplies the next move');
      const move=candidates[Math.floor(random()*candidates.length)];
      assert.equal(E.dig(s,...move),true);assert.ok(++moves<=31);
    }
    assert.equal(s.status,'won');assert.equal(s.chips,0);assert.equal(s.remaining,[4,2,0][run%3]);
  }
});

function boot() {
 const listeners={},nodes=new Map();let active=null;
 const doc={getElementById:id=>get(id),addEventListener:(name,fn)=>listeners[name]=fn};
 function node(id,attrs={}) {
  const n={id,tagName:'BUTTON',dataset:{},attrs:{},disabled:false,hidden:false,children:[],events:{},textContent:'',value:'',
   addEventListener(name,fn){this.events[name]=fn},setAttribute(k,v){this.attrs[k]=String(v)},
   focus(){active=this},closest(sel){return sel==='[data-cell]'&&this.dataset.cell!==undefined||sel==='[data-tool]'&&this.dataset.tool!==undefined?this:null},
   querySelectorAll(sel){return this.children.filter(c=>c.closest(sel))},querySelector(sel){const m=sel.match(/data-cell="(\d+)"/);return m?this.children.find(c=>c.dataset.cell===m[1]):null}
  };
  for(const [k,v] of Object.entries(attrs)){n.attrs[k]=v;if(k.startsWith('data-'))n.dataset[k.slice(5)]=v;}
  Object.defineProperty(n,'innerHTML',{get(){return this.html||''},set(value){this.html=value;if(id==='board'){
   if(this.children.includes(active))active=null;
   this.children=[...value.matchAll(/<button\b([^>]*)>/g)].map(m=>node('cell',Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]))));
  }}});
  return n;
 }
 function get(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)}
 get('tools').children=[node('brush',{'data-tool':'brush'}),node('pick',{'data-tool':'pick'})];
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/fossil-museum/app.js'),'utf8'),{document:doc,FossilMuseum:E});
 const cell=i=>get('board').children[i];
 const clickCell=i=>{cell(i).focus();get('board').events.click({target:cell(i)})};
 const key=(key,opts={})=>{let prevented=false;listeners.keydown({key,repeat:false,ctrlKey:false,metaKey:false,altKey:false,target:active||{tagName:'BODY',closest:()=>null},preventDefault(){prevented=true},...opts});return prevented};
 return{get,cell,key,clickCell,active:()=>active,click:id=>get(id).events.click({target:get(id)}),tool:t=>get('tools').events.click({target:get('tools').children.find(x=>x.dataset.tool===t)}),site:s=>get('site').events.change({target:{value:String(s)}})};
}

test('controller covered-cell labels and titles remain generic after reveals and undos',()=>{
 for(let site=0;site<3;site++) {
  const b=boot();b.site(site);
  for(let step=0;step<20;step++) {
   b.tool(step%2?'pick':'brush');b.clickCell(Math.floor(random()*36));
   if(step%3===0)b.key('z');
   for(const cell of b.get('board').children) if(/covered/.test(cell.attrs.class)) {
    assert.match(cell.attrs['aria-label'],/^[A-F][1-6]、まだ砂に覆われています$/);
    assert.match(cell.attrs.title,/^[A-F][1-6] まだ砂に覆われています$/);
    assert.doesNotMatch(cell.attrs.class,/fish|shell|fern|bone|chipped|collected/);
   }
  }
 }
});

test('controller re-render preserves keyboard focus and rejects all held gameplay shortcuts',()=>{
 const b=boot();
 for(let i=0;i<36;i++) {
  b.cell(i).focus();b.key(i%2?'1':'2');assert.equal(b.active().dataset.cell,String(i));
  assert.equal(b.get('board').children.filter(c=>c.attrs.tabindex==='0').length,1);
  const html=b.get('board').innerHTML,energy=b.get('energy').textContent;
  for(const k of ['Enter',' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','1','2','z'])b.key(k,{repeat:true});
  assert.equal(b.get('board').innerHTML,html);assert.equal(b.get('energy').textContent,energy);
 }
 b.clickCell(7);const energy=b.get('energy').textContent;
 for(const tagName of ['INPUT','TEXTAREA','SELECT'])for(const k of ['z','1','2','Enter']){
  b.key(k,{target:{tagName}});assert.equal(b.get('energy').textContent,energy);
 }
});

test('controller retry from loss, undo, and site change clear stale result/history',()=>{
 const b=boot();b.tool('pick');[7,9,2].forEach(b.clickCell);
 assert.equal(b.get('result').hidden,false);b.key('z');assert.equal(b.get('result').hidden,true);
 b.clickCell(2);b.click('retry');assert.equal(b.get('result').hidden,true);assert.equal(b.get('chips').textContent,'0 / 2');assert.equal(b.get('energy').textContent,'34');assert.equal(b.get('undo').disabled,true);
 b.clickCell(7);b.site(2);assert.equal(b.get('energy').textContent,'32');assert.equal(b.get('collected').textContent,'0 / 2');assert.equal(b.get('undo').disabled,true);
 assert.equal(b.get('tools').children[0].attrs['aria-pressed'],'true');
});


test('third-chip failure wins precedence even on the final extraction, and undo restores it',()=>{
 const s=E.create(2), cfg=E.sites[2];
 const bones=cfg.specimens.flatMap(p=>p.cells).filter(i=>!s.cells[i].open);
 const final=bones.pop();let chips=0;
 for(const i of bones)assert.equal(E.dig(s,i,chips++<2?'pick':'brush'),true);
 const border=[...new Set(cfg.specimens.flatMap(p=>expectedBorder(cfg,p)))];
 for(const i of border)if(!s.cells[i].open)assert.equal(E.dig(s,i,'pick'),true);
 assert.equal(s.status,'playing');assert.equal(s.chips,2);const before=json(s);
 assert.equal(E.dig(s,final,'pick'),true);assert.equal(E.specimens(s).filter(p=>p.complete).length,2);assert.equal(s.status,'lost');assert.equal(s.chips,3);
 assert.equal(E.undo(s),true);assert.deepEqual(s,before);
 assert.equal(E.dig(s,final,'brush'),true);assert.equal(s.status,'won');assert.equal(s.chips,2);
});
