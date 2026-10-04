// Controller-only test; mocked canvas/DOM is NOT a visual/browser test.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');const E=require('../games/sensor-shift/engine');
const els={},raf=new Map(),storage=new Map();let id=0,now=1;
function element(){return {value:'0',textContent:'',disabled:false,style:{},children:[],replaceChildren(){this.children=[]},append(...x){this.children.push(...x)}}}
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
const sandbox={SensorShift:E,document:{getElementById(k){if(!els[k])els[k]=element();return els[k]},createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},requestAnimationFrame:f=>{raf.set(++id,f);return id},cancelAnimationFrame:i=>raf.delete(i)};
els.board={getContext:()=>ctx};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require.resolve('../games/sensor-shift/game.js'),'utf8'),sandbox);
function click(k){els[k].onclick()}function advance(n){for(let i=0;i<n;i++){now+=1000/60;let pending=[...raf.values()];raf.clear();pending.forEach(f=>f(now))}}
click('play');advance(20);click('play');assert.equal(raf.size,0);const t=els.timer.textContent;advance(30);assert.equal(els.timer.textContent,t);click('play');advance(300);assert.equal(els.state.textContent,'× 壁に衝突');assert.equal(els.history.children.length,1);
els.angle.value='35';els.angle.oninput();click('play');advance(400);assert.equal(els.state.textContent,'✓ 出口に到達！');assert.equal(els.history.children.length,2);click('reset');assert.equal(els.timer.textContent,'0.0 s');click('minus');assert.equal(els.angleValue.textContent,'+34°');
for(let i=0;i<5;i++){click('play');click('play')}assert.equal(raf.size,0);click('play');assert.equal(raf.size,1);click('reset');assert.equal(raf.size,0);click('clear');assert.match(els.history.children[0].textContent,/まだ試行なし/);
console.log('PASS: mocked controller play/pause/resume, failure/success, reset, angle, history, rapid repeated pause/resume without duplicate animation loops. Not a browser/visual test.');
