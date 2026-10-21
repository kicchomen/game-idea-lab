(function(root){'use strict';
const missions=[{title:'一枚目：キツネのさんぽ',targets:['fox']},{title:'二枚目：キツネと青い鳥',targets:['fox','bird']},{title:'三枚目：野原の集合写真',targets:['fox','rabbit','bird']}];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function create(mission=0,total=0){return {mission:clamp(Math.trunc(mission)||0,0,2),total,time:0,x:300,width:240,film:6,status:'ready',photos:[],message:'動物が枠に入る瞬間を待とう。',lastShot:-1};}
function subjects(s){let t=s.time+s.mission*4.7;return [{id:'fox',name:'キツネ',x:300+210*Math.sin(.45*t-1),y:218,left:48,right:29},{id:'rabbit',name:'ウサギ',x:300+180*Math.sin(.6*t+1.8),y:246,left:24,right:21},{id:'bird',name:'青い鳥',x:300+220*Math.sin(.32*t+2.2),y:124+18*Math.sin(t*.8),left:23,right:24}].map(o=>({...o,hidden:o.id!=='bird'&&o.x+o.right>403&&o.x-o.left<481}));}
function view(s){return subjects(s).map(o=>({...o,wanted:missions[s.mission].targets.includes(o.id),inside:o.x-o.left>=s.x-s.width/2&&o.x+o.right<=s.x+s.width/2}));}
function start(s){return s.status==='ready'?{...s,status:'playing',message:'枠を動かして、シャッター！'}:s;}
function tick(s,dt){if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return s;let time=Math.min(50,s.time+dt);return {...s,time,status:time>=50?'lost':s.status,message:time>=50?'日が暮れました。もう一度、観察してみよう。':s.message};}
function move(s,x){return s.status==='playing'&&Number.isFinite(x)?{...s,x:clamp(x,s.width/2,600-s.width/2)}:s;}
function zoom(s){if(s.status!=='playing')return s;let width=s.width===240?150:240;return {...s,width,x:clamp(s.x,width/2,600-width/2)};}
function shoot(s){if(s.status!=='playing'||s.time-s.lastShot<.35)return s;const targets=view(s).filter(o=>o.wanted),missing=targets.filter(o=>!o.inside||o.hidden);const ok=!missing.length,points=ok?(s.width===150?2:1):0;const photo={time:s.time,x:s.x,width:s.width,subjects:subjects(s),ok,points};const film=s.film-1;return {...s,film,lastShot:s.time,total:s.total+points,photos:[...s.photos,photo],status:ok?'won':film===0?'lost':'playing',message:ok?(points===2?'アップで撮れた！ ★★':'みんな枠の中！ ★'):(missing.map(o=>o.hidden?o.name+'が草かげ':o.name+'が枠の外').join('、')+(film===0?'。フィルムがなくなりました。':'。次の瞬間を待とう。'))};}
function pause(s){return s.status==='playing'?{...s,status:'paused'}:s.status==='paused'?{...s,status:'playing'}:s;}
function retry(s){return create(s.mission,s.total-(s.photos.at(-1)?.ok?s.photos.at(-1).points:0));}
function next(s){return s.status==='won'&&s.mission<2?create(s.mission+1,s.total):s;}
const api={missions,create,subjects,view,start,tick,move,zoom,shoot,pause,retry,next};if(typeof module!=='undefined')module.exports=api;else root.Meadow=api;
})(typeof globalThis!=='undefined'?globalThis:this);
