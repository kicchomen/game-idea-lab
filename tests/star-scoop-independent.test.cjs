'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../games/star-scoop/engine');

function permutations(counts=[3,2,2,2],prefix=[],out=[]){
 if(prefix.length===9){out.push(prefix);return out;}
 counts.forEach((count,value)=>{if(count){counts[value]--;permutations(counts,prefix.concat(value),out);counts[value]++;}});
 return out;
}
const allBags=permutations();
// Independent score oracle. Policy observes only already drawn values, never future order.
function oracle(seed,policy){let bank=0;const amounts=[];
 for(const bag of E.bags(seed)){let pending=0,clouds=0,index=0;
  while(index<bag.length){const value=bag[index++];if(value===0)clouds++;else pending+=value;
   if(clouds===2){pending=0;break;}
   if(pending===12||policy({pending,clouds,index,bank}))break;
  }
  amounts.push(pending);bank+=pending;
 }
 return {bank,amounts};
}
const adaptive=({pending,clouds})=>clouds===1&&pending>0&&12-pending<=(3-clouds)*pending;
function engineRun(seed,policy){let s=E.act(E.create(seed),'start');for(let i=0;i<60;i++){
 if(s.phase==='won'||s.phase==='lost')return s;
 s=E.act(s,s.phase==='between'?'next':s.index&&policy({pending:s.catch,clouds:s.clouds,index:s.index,bank:s.bank})?'bank':'draw');
 }throw Error('nonterminating game');}

test('independent: exhaust all 7560 distinct bags, every reachable return decision and bust boundary',()=>{
 assert.equal(allBags.length,7560);
 for(const bag of allBags){let s=E.act(E.create(0),'start');s.bags[0]=bag;let pending=0,clouds=0;
  for(let i=0;i<9&&s.phase==='playing';i++){
   const old=JSON.stringify(s);const value=bag[i];if(value===0)clouds++;else pending+=value;
   const before=s;s=E.act(s,'draw');assert.equal(JSON.stringify(before),old);
   assert.equal(s.index,i+1);assert.equal(s.clouds,clouds);
   if(clouds===2){assert.equal(s.phase,'between');assert.equal(s.bank,0);assert.equal(s.history[0].bust,true);}
   else if(pending===12){assert.equal(s.phase,'between');assert.equal(s.bank,12);}
   else {assert.equal(s.phase,'playing');assert.equal(s.catch,pending);
    const saved=E.act(s,'bank');assert.equal(saved.bank,pending);assert.equal(saved.catch,0);assert.equal(saved.history.length,1);
    assert.equal(E.act(saved,'bank'),saved);assert.equal(E.act(saved,'draw'),saved);
    const risk=E.risk(s);assert.equal(risk.total,8-i);assert.equal(risk.bust,clouds===1?2:0);
   }
  }
  assert.equal(s.phase,'between');assert.equal(s.catch,0);
 }
});

test('independent: observable policies match independent oracle for 1000 seeds',()=>{
 for(let seed=0;seed<1000;seed++)for(const policy of [()=>false,adaptive,({pending})=>pending>=6]){
  const expected=oracle(seed,policy),actual=engineRun(seed,policy);
  assert.equal(actual.bank,expected.bank);assert.deepEqual(actual.history.map(x=>x.amount),expected.amounts);
  assert.equal(actual.phase,expected.bank>=22?'won':'lost');assert.equal(actual.history.length,5);
 }
});

test('independent: 10000-seed strategy rates, oracle upper bound and default seed',t=>{
 const policies={alwaysDraw:()=>false,firstDraw:()=>true,sixPoints:({pending})=>pending>=6,adaptive};
 const stats={};for(const [name,policy]of Object.entries(policies)){
  let wins=0,sum=0;for(let seed=0;seed<10000;seed++){const {bank}=oracle(seed,policy);wins+=bank>=22;sum+=bank;}
  stats[name]={wins,percent:wins/100,mean:sum/10000};
 }
 let impossible=0;for(let seed=0;seed<10000;seed++){
  const hindsightMax=E.bags(seed).reduce((total,bag)=>{let clouds=0,points=0;for(const value of bag){if(!value&&++clouds===2)break;points+=value;}return total+points;},0);
  impossible+=hindsightMax<22;
 }
 t.diagnostic(JSON.stringify({seeds:'0..9999',stats,impossibleEvenWithHindsight:impossible,default:oracle(20261108,adaptive)}));
 assert.equal(stats.adaptive.wins,4281);assert.equal(stats.sixPoints.wins,2870);
 assert.equal(stats.firstDraw.wins,0);assert.ok(stats.adaptive.wins>stats.sixPoints.wins);
 assert.equal(oracle(20261108,adaptive).bank,26);assert.equal(oracle(20261108,()=>false).bank,0);
});

test('independent: 32-bit seed normalization and replay are stable',()=>{
 for(const seed of [0,1,4294967295,20261108]){assert.deepEqual(E.create(seed),E.create(seed));assert.deepEqual(E.bags(seed),E.bags(seed+4294967296));}
 const won=engineRun(20261108,adaptive);for(const action of ['start','next','draw','bank','bad'])assert.equal(E.act(won,action),won);
 assert.deepEqual(E.create(won.seed),E.create(20261108));
});

function controller(search=''){
 const fs=require('node:fs'),vm=require('node:vm');let clock=0;const nodes={},events={},windowEvents={};
 const node=id=>nodes[id]??=( {id,tagName:'BUTTON',parentElement:{},events:{},addEventListener(type,fn){this.events[type]=fn;},focus(){},showModal(){this.open=true;},close(){this.open=false;}});
 const document={getElementById:node,addEventListener(type,fn){events[type]=fn;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../games/star-scoop/app.js'),'utf8'),{window:{StarScoop:E,addEventListener:(type,fn)=>windowEvents[type]=fn},document,URLSearchParams,location:{search},performance:{now:()=>clock},Uint32Array,crypto:{getRandomValues:a=>a[0]=12345}});
 return {nodes,events,windowEvents,document,click(id,ms=200,detail=1){clock+=ms;node(id).events.click({detail});},key(key,repeat=false){clock+=200;events.keydown({key,repeat,target:{tagName:'BUTTON'},preventDefault(){}});}};
}
test('independent controller: exact debounce boundary, cross-button and repeat guard',()=>{
 const u=controller();u.click('advance');u.click('draw',180);assert.equal(u.nodes.catch.textContent,1);
 u.click('bankAction',179);assert.equal(u.nodes.bank.textContent,'持帰り 0 / 22 点');
 u.click('bankAction',1);assert.equal(u.nodes.bank.textContent,'持帰り 1 / 22 点');
 u.click('advance');u.key('S',true);assert.equal(u.nodes.catch.textContent,0);
 u.key('S');assert.equal(u.nodes.clouds.textContent,'1 / 2');u.key('S');assert.equal(u.nodes.catch.textContent,3);
});
test('independent controller: cancel, blur, resume and retry preserve the correct boundary',()=>{
 const u=controller();u.click('advance');u.key('s');u.key('p');u.key('b');assert.equal(u.nodes.bank.textContent,'持帰り 0 / 22 点');
 u.nodes.dialog.events.cancel();u.key('b');assert.equal(u.nodes.bank.textContent,'持帰り 1 / 22 点');
 u.click('advance');u.windowEvents.blur();u.click('draw');assert.equal(u.nodes.catch.textContent,0);
 u.click('closeDialog');u.click('draw');assert.equal(u.nodes.clouds.textContent,'1 / 2');u.click('draw');assert.equal(u.nodes.catch.textContent,3);
 u.click('pause');u.click('retry');assert.equal(u.nodes.bank.textContent,'持帰り 0 / 22 点');assert.equal(u.nodes.night.textContent,'第 1 / 5 夜');
 u.click('advance');u.key('s');assert.equal(u.nodes.catch.textContent,1);
});
test('independent controller: malformed URL seed defaults, uint32 seed is displayed honestly',()=>{
 for(const search of ['?seed=-1','?seed=oops','?seed=10000000000']){const u=controller(search);u.click('pause');assert.match(u.nodes.dialogBody.innerHTML,/20261108/);}
 const u=controller('?seed=4294967296');u.click('pause');assert.match(u.nodes.dialogBody.innerHTML,/空の番号：0<br>/);
});
