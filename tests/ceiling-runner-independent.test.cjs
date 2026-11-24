const test=require('node:test'), a=require('node:assert/strict'), fs=require('node:fs'), vm=require('node:vm');
const E=require('../games/ceiling-runner/engine');
const src=fs.readFileSync(require.resolve('../games/ceiling-runner/app'),'utf8');
const bitCount=n=>n.toString(2).replace(/0/g,'').length;
const suite=[
 {r:[1.3,3.1,4.8,6.9,8.6,10.3],mode:'won',points:6,cause:null},
 {r:[1.3,3.1,4.8,6.9,8.2,9.8],mode:'won',points:4,cause:null},
 {r:[.7,3.1,4.8,6.9,8.2,9.8],mode:'failed',points:3,cause:'missed'},
];
function path(times){
 const flips=new Set(times.map(n=>Math.round(n*120)));
 let s=E.create('running'), min=Infinity, maxTick=1700;
 while(s.mode==='running' && maxTick--){
  if(flips.has(s.ticks)){
   const from=s;
   s=E.command(s,'flip');
   a.notEqual(s,from);
  }
  const next=E.step(s);
  a.equal(next.ticks,s.ticks+1);
  a.ok(Math.abs(next.x-Math.min(E.GOAL,next.ticks*.675))<1e-7);
  a.ok(next.y>=21&&next.y<=121);
  a.equal(s.marks & next.marks,s.marks,'never gains a marker twice');
  a.ok(Math.abs(next.y-s.y)<=172/120+1e-8);
  for (const [l,r,t,b] of E.hazards){
   const m=Math.sqrt(Math.max(l-next.x,0,next.x-r)**2+Math.max(t-next.y,0,next.y-b)**2)-9;
   min=Math.min(min,m);
  }
  s=next;
 }
 a.ok(maxTick>0);
 const {mode,cause,ticks}=s;
 return {mode,cause,ticks,min,points:bitCount(s.marks)};
}
for(const {r,mode,points,cause} of suite){
 test('route '+r+': '+mode+' '+points+'/6 and collision margin, plus 64 latency corner cases',()=>{
  const p=path(r); a.deepEqual([p.mode,p.points,p.cause,p.ticks],[mode,points,cause,1541]);
  a.ok(p.min>10);
  for(let i=0;i<64;i++){
   const p=path(r.map((n,j)=>n+((i>>j)&1?.10:-.10)));
   a.deepEqual([p.mode,p.points,p.cause,p.ticks],[mode,points,cause,1541]); a.ok(p.min>0);
  }
 });
}
test('collision without action occurs at first radius overlap; no spurious mark gain',()=>{
 const p=path([]);
 a.deepEqual([p.mode,p.points,p.cause,p.ticks],['failed',1,'collision',211]);
 a.ok(p.min<0);
});
function fakeApp(fps=60){
 const elements={},winEvents={},docEvents={}; let active,raf,clock=1000;
 const make=(name,tagName='DIV')=>{
  let listeners={};
  const node={surface:name,tagName,textContent:'',innerHTML:'',value:0,disabled:false,hidden:false,getBoundingClientRect:()=>({width:320,height:220}),
   closest:s=>tagName.toLowerCase()===s?node:null,
   addEventListener:(name,fn)=>listeners[name]=fn,
   fire:(name,e)=>listeners[name]?.(e),
   focus(){active=node;}
  }; return node;
 };
 for(const name of ['rail','overlay','state','marks','distance','gravity','primary','secondary'])elements[name]=make(name,['primary','secondary'].includes(name)?'BUTTON':'DIV');
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(t,k)=>t[k]||(()=>{})});
 elements.rail.getContext=()=>ctx;
 active=make('body','BODY');
 const document={getElementById:k=>elements[k],addEventListener:(e,f)=>docEvents[e]=f,hidden:false,get activeElement(){return active;}};
 const window={CeilingRunner:E,devicePixelRatio:2,addEventListener:(e,f)=>winEvents[e]=f};
 vm.runInNewContext(src,{window,document,ResizeObserver:class{observe(){}},requestAnimationFrame:f=>{raf=f;}});
 const run=ms=>{const stop=clock+ms;const frame=1000/fps;while(clock+.000001<stop){clock=Math.min(clock+frame,stop);raf(clock);}};
 const click=name=>{const el=elements[name];if(!el.disabled){el.focus();el.fire('click');}};
 const input=(code, opts={})=>{
  let prevented=false;
  winEvents.keydown({code,target:active,preventDefault(){prevented=true;},...opts});
  if(!prevented&&code==='Space'&&active.tagName==='BUTTON'&&!opts.repeat&&!opts.isComposing&&!opts.ctrlKey&&!opts.altKey&&!opts.metaKey){
   if(!active.disabled)active.fire('click');
  }
 };
 return {e:elements,run,click,input,blur:()=>winEvents.blur(),hide:()=>{document.hidden=true;docEvents.visibilitychange();},pointer:(primary,button)=>elements.rail.fire('pointerup',{isPrimary:primary,button})};
}
test('mock browser input, visibility pauses, no catch-up, clears on retry',()=>{
 const {e,run,click,input,blur,hide,pointer}=fakeApp();
 a.match(e.primary.textContent,/点検を始める/);
 run(500);a.equal(e.distance.value,0);
 input('Space');a.match(e.primary.textContent,/重力/);
 run(300);a.ok(e.distance.value>15&&e.distance.value<32);
 pointer(false,0);pointer(true,1);
 a.match(e.gravity.innerHTML,/床へ/);
 pointer(true,0);
 a.match(e.gravity.innerHTML,/天井へ/);
 input('Space',{repeat:true});
 a.match(e.gravity.innerHTML,/天井へ/);
 run(150);const pause=e.distance.value;blur();run(400);
 a.match(e.state.innerHTML,/一時停止中/);
 a.equal(e.distance.value,pause);
 click('primary');run(150);a.ok(e.distance.value>pause&&e.distance.value<pause+23);
 const stop=e.distance.value;hide();run(800);
 a.equal(e.distance.value,stop);
 click('secondary');
 a.match(e.primary.textContent,/重力/);
 a.equal(e.distance.value,0);
 a.match(e.gravity.innerHTML,/床へ/);
 run(2000);a.match(e.state.innerHTML,/障害物にぶつかった/);
 click('primary');a.equal(e.distance.value,0);
 a.equal(e.overlay.hidden,true);
});
test('keyboard retains global flip after Pause button + Escape resume',()=>{
 const {e,run,click,input}=fakeApp();
 click('primary');run(300);
 click('secondary');a.match(e.state.innerHTML,/一時停止中/);
 input('Escape');a.match(e.primary.textContent,/重力/);
 input('Space');a.match(e.gravity.innerHTML,/天井へ/);
});
for(const fps of [30,60,144])test('mock rAF '+fps+'Hz: mixed touch Space route, win and restart',()=>{
 const {e,run,click,input,pointer}=fakeApp(fps);click('primary');
 let elapsed=0;
 for(const [i,t] of suite[0].r.entries()){
  run(t*1000-elapsed);elapsed=t*1000;
  if(i%2)input('Space');else pointer(true,0);
 }
 run(3200);
 a.match(e.state.innerHTML,/点検成功/);
 a.equal(e.distance.value,1040);a.match(e.marks.innerHTML,/^6 /);
 input('Space');a.equal(e.distance.value,0);a.match(e.marks.innerHTML,/^0 /);
});
