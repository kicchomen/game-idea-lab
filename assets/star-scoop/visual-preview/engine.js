(function(root){
'use strict';
const BAG=[1,1,2,2,3,3,0,0,0], TARGET=22, NIGHTS=5;
function random(seed){let x=seed>>>0; return ()=>{x=(x+0x6D2B79F5)>>>0;let t=Math.imul(x^(x>>>15),1|x);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function bags(seed){const rng=random(seed);return Array.from({length:NIGHTS},()=>{const a=BAG.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});}
function create(seed=20261108){return {seed:seed>>>0,bags:bags(seed),night:0,index:0,catch:0,clouds:0,bank:0,phase:'ready',history:[],last:'5夜で星の光を22点、持ち帰ろう。'};}
function remaining(s){return s.bags[s.night].slice(s.index);}
function finishNight(s,bust){const amount=bust?0:s.catch;s.bank+=amount;s.catch=0;s.history.push({night:s.night+1,amount,bust});s.phase=s.night===NIGHTS-1?(s.bank>=TARGET?'won':'lost'):'between';s.last=bust?'雨雲2個！ 今夜の光は0点。':`${amount}点を持ち帰った！`;return s;}
function act(state,action){const s=JSON.parse(JSON.stringify(state));
if(action==='start'&&s.phase==='ready'){s.phase='playing';s.last='まずは1個。引いたものは戻さない。';return s;}
if(action==='next'&&s.phase==='between'){s.night++;s.index=0;s.catch=0;s.clouds=0;s.phase='playing';s.last='新しい袋。星6個と雨雲3個。';return s;}
if(s.phase!=='playing')return state;
if(action==='bank'){if(s.index===0)return state;return finishNight(s,false);}
if(action!=='draw')return state;
const v=s.bags[s.night][s.index++];if(v===0){s.clouds++;s.last='雨雲を1個。もう1個で今夜の光を失う。';if(s.clouds===2)return finishNight(s,true);}else{s.catch+=v;s.last=`星の光 +${v}。帰れば${s.catch}点。`;}
if(!remaining(s).some(v=>v>0)){s.last='星を全部すくった！';return finishNight(s,false);}return s;
}
function risk(s){const a=remaining(s);return {clouds:a.filter(v=>v===0).length,total:a.length,bust:s.clouds===1?a.filter(v=>v===0).length:0};}
const api={BAG,TARGET,NIGHTS,create,act,remaining,risk,bags};if(typeof module!=='undefined')module.exports=api;else root.StarScoop=api;
})(typeof window!=='undefined'?window:globalThis);
