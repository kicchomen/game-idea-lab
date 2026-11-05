(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Repair=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PARTS=['ギア','電池','モーター','センサー','電球','ばね'];
const LABELS=['A','B','C','D','E','F'];
const pop=n=>{let c=0;for(let i=0;i<6;i++)if(n&(1<<i))c++;return c;};
const PAIRS=[];for(let a=0;a<6;a++)for(let b=a+1;b<6;b++)PAIRS.push((1<<a)|(1<<b));
const valid=m=>Number.isInteger(m)&&m>0&&m<64;
function masks(seed){let x=(Number.isInteger(seed)?seed:20261105)>>>0;const a=PAIRS.slice();for(let i=a.length-1;i>0;i--){x=(Math.imul(x,1664525)+1013904223)>>>0;const j=x%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,3);}
function create(seed=20261105){seed=Number.isInteger(seed)?seed>>>0:20261105;return {seed,jobs:masks(seed),job:0,phase:'ready',selection:0,logs:[],spare:0,repaired:0,message:'部品を選んで、故障を見つけよう。'};}
function candidates(logs){return PAIRS.filter(p=>logs.every(l=>pop(p&l.mask)===l.count));}
function names(mask){return LABELS.filter((_,i)=>mask&(1<<i)).join('＋');}
function act(s,type,value){
 if(type==='restart')return create(s.seed);
 if(type==='fresh')return create((s.seed+1)>>>0);
 if(type==='start'&&s.phase==='ready')return {...s,phase:'play',message:'故障は2個。1〜3個を選んで検査。'};
 if(type==='next'&&s.phase==='repaired')return {...s,job:s.job+1,phase:'play',selection:0,logs:[],message:'次のロボットも、故障はちょうど2個。'};
 if(s.phase!=='play')return s;
 if(type==='select'){
  if(!Number.isInteger(value)||value<0||value>5)return s;
  const m=s.selection^(1<<value);if(pop(m)>3)return {...s,message:'一度に選べるのは3個まで。'};
  return {...s,selection:m,message:m?names(m)+' を選択中':'部品を選んでください。'};
 }
 if(type==='test'){
  if(!valid(s.selection)||pop(s.selection)>3)return {...s,message:'検査する部品を1〜3個選んでください。'};
  if(s.logs.length>=4)return {...s,message:'検査は終了。故障2個を選んで交換しよう。'};
  if(s.logs.some(l=>l.mask===s.selection))return {...s,message:'同じ組み合わせは検査済み。回数は減りません。'};
  const count=pop(s.selection&s.jobs[s.job]);
  return {...s,logs:[...s.logs,{mask:s.selection,count}],message:names(s.selection)+' に故障 '+count+' 個。'};
 }
 if(type==='repair'){
  if(!valid(s.selection)||pop(s.selection)!==2)return {...s,message:'交換する部品をちょうど2個選んでください。'};
  if(s.selection!==s.jobs[s.job])return {...s,phase:'lost',message:'故障部品が残っていました。'};
  const repaired=s.repaired+1;return {...s,repaired,spare:s.spare+4-s.logs.length,phase:repaired===3?'won':'repaired',message:'修理成功！'};
 }
 return s;
}
return {PARTS,LABELS,PAIRS,pop,masks,create,candidates,names,act};
});
