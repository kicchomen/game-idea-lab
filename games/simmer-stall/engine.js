(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SimmerStall=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const EPS=1e-7;
const FOODS=[{name:'大根',symbol:'◉'},{name:'じゃがいも',symbol:'🥔'},{name:'葉物',symbol:'❧'}];
const ORDERS=[{name:'一皿目・いつもの煮込み',targets:[30,18,4],window:5,warm:10,limit:46},{name:'二皿目・葉物はしっかり',targets:[28,16,5],window:4,warm:9,limit:42},{name:'三皿目・厚切り大根',targets:[32,20,6],window:4,warm:8,limit:44}];
const copy=s=>JSON.parse(JSON.stringify(s));
function dish(round){return{round,phase:'ready',elapsed:0,fire:1,items:FOODS.map(()=>({stage:'raw',heat:0,age:0,quality:null})),result:null};}
function create(){return{...dish(0),history:[],message:'必要な火入れを見て、投入の順番を考えよう。'};}
function quality(s,i){const f=s.items[i],o=ORDERS[s.round];if(f.heat+EPS<o.targets[i])return'raw';if(f.heat-EPS>o.targets[i]+o.window)return'burnt';return'good';}
function finish(s,timeout=false){const o=ORDERS[s.round],parts=s.items.map((f,i)=>({name:FOODS[i].name,reason:f.stage!=='plate'?'未盛付':f.quality==='raw'?'火入れ不足':f.quality==='burnt'?'煮すぎ':f.age-o.warm>EPS?'冷めた':'ちょうどよい'}));const good=!timeout&&parts.every(p=>p.reason==='ちょうどよい');s.result={good,timeout,parts};s.history.push(s.result);s.phase='review';s.message=timeout?'時間切れ。この皿は仕上がらなかった。':good?'できた！ 3品を温かいまま、一皿で。':'この皿はもう一歩。仕上がりを見返そう。';return s;}
function act(state,action,arg){if(!state)return state;const s=copy(state);
if(action==='start'&&s.phase==='ready'){s.phase='cooking';s.message='大根・じゃがいも・葉物。必要な火入れの長いものから。';return s;}
if(action==='pause'&&s.phase==='cooking'){s.phase='paused';s.message='一時停止中。鍋もお皿も時間が止まっています。';return s;}
if(action==='resume'&&s.phase==='paused'){s.phase='cooking';s.message='調理を再開。火加減と盛付を見よう。';return s;}
if(action==='next'&&s.phase==='review'){if(s.round===2){s.phase='ended';s.message=s.history.filter(r=>r.good).length>=2?'屋台の仕事、完了！':'今回はあと一歩。もう一度、順番を試そう。';return s;}return{...dish(s.round+1),history:s.history,message:'次の注文。必要な火入れが変わっています。'};}
if(s.phase!=='cooking')return state;
if(action==='fire'&&[0,1,2].includes(arg)){if(s.fire===arg)return state;s.fire=arg;s.message=arg===0?'火を止めた。盛付けた食材は冷め続けます。':arg===1?'弱火。鍋の中の全食材が、毎秒1ずつ進みます。':'強火。鍋の中の全食材が、毎秒2ずつ進みます。';return s;}
if(action==='item'&&Number.isInteger(arg)&&arg>=0&&arg<3){const f=s.items[arg];if(f.stage==='raw'){f.stage='pot';s.message=`${FOODS[arg].name}を鍋へ入れた。`;}else if(f.stage==='pot'){f.stage='plate';f.quality=quality(s,arg);s.message=`${FOODS[arg].name}を取り出した。${f.quality==='good'?'よい火入れ。温かいうちにまとめて提供！':f.quality==='raw'?'まだ火入れ不足。取り出しは戻せません。':'煮すぎ。取り出しは戻せません。'}`;}else return state;return s;}
if(action==='serve'&&s.items.every(f=>f.stage==='plate'))return finish(s);return state;}
function step(state,dt){if(state.phase!=='cooking'||!Number.isFinite(dt)||dt<=0)return state;const s=copy(state),o=ORDERS[s.round],d=Math.min(dt,Math.max(0,o.limit-s.elapsed));s.elapsed+=d;for(const f of s.items){if(f.stage==='pot')f.heat+=d*s.fire;else if(f.stage==='plate')f.age+=d;}if(s.elapsed+EPS>=o.limit){s.elapsed=o.limit;return finish(s,true);}return s;}
function won(s){return s.phase==='ended'&&s.history.filter(r=>r.good).length>=2;}
return{FOODS,ORDERS,create,act,step,quality,won};});
