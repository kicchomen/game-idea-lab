(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SparkShield=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ACTIONS={strike:{label:'たたく',cost:1},guard:{label:'盾で受ける',cost:1},dodge:{label:'かわす',cost:2},burst:{label:'火花を返す',cost:2},rest:{label:'息を整える',cost:0}};
const FOES=[
{id:'copper',name:'銅の番兵',hp:14,pattern:[3,3,0,7,0],caption:'軽い攻撃を受けて、火花を返そう。'},
{id:'iron',name:'鉄の双角',hp:20,pattern:[7,3,0,3,7,0],caption:'大振りを避ける気力も残せる？'},
{id:'obsidian',name:'黒曜の王',hp:23,pattern:[3,7,3,0,7,3,0],caption:'攻めるために、どこで休む？'}
];
const clone=x=>JSON.parse(JSON.stringify(x));
function create(index=0){if(!Number.isInteger(index)||index<0||index>=FOES.length)index=0;return {foe:index,hp:12,stamina:4,sparks:0,enemyHP:FOES[index].hp,turn:0,maxTurns:14,status:'playing',log:['相手の「今」と「次」を見て、一手を選ぼう。'],last:null,history:[]};}
function intent(s,offset=0){let p=FOES[s.foe].pattern;return p[(s.turn+offset)%p.length];}
function can(s,a){return s.status==='playing'&&!!ACTIONS[a]&&s.stamina>=ACTIONS[a].cost&&(a!=='burst'||s.sparks>0);}
function act(s,a){if(!can(s,a))return false;const before=clone({...s,history:[]});s.history.push(before);const incoming=intent(s),cost=ACTIONS[a].cost;s.stamina-=cost;let dealt=0,taken=0,gained=0,blocked=0,spent=0;
if(a==='strike')dealt=3;
if(a==='burst'){spent=s.sparks;dealt=4+3*spent;s.sparks=0;}
if(a==='rest')s.stamina=Math.min(4,s.stamina+3);
s.enemyHP=Math.max(0,s.enemyHP-dealt);
if(s.enemyHP>0){blocked=a==='dodge'?incoming:a==='guard'?Math.min(4,incoming):0;taken=incoming-blocked;s.hp=Math.max(0,s.hp-taken);if(a==='guard'&&incoming>0){gained=s.sparks<3?1:0;s.sparks=Math.min(3,s.sparks+1);}}
s.turn++;s.last={action:a,incoming,dealt,taken,gained,blocked,spent};
let text=`${s.turn}手目：${ACTIONS[a].label}。`;if(dealt)text+=`相手に${dealt}。`;if(s.enemyHP===0)text+='撃破！';else if(taken)text+=`自分に${taken}。`;else text+=incoming?'被害なし。':'相手は休み。';if(gained)text+='火花＋1。';if(a==='rest')text+='気力＋3（上限4）。';s.log=[text,...s.log].slice(0,4);
if(s.enemyHP===0)s.status='won';else if(s.hp===0)s.status='lost';else if(s.turn>=s.maxTurns)s.status='timeout';return true;}
function undo(s){if(!s.history.length)return false;const history=s.history;const prev=history.pop();Object.assign(s,prev,{history});return true;}
return {ACTIONS,FOES,create,intent,can,act,undo};
});
