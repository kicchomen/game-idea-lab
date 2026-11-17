(function(root){
'use strict';
const walls=Object.freeze([0,3,6,15]);
const path=Object.freeze([7,8,9,14,19,18,17,12]);
const limit=8;
const deltas=Object.freeze({U:-5,D:5,L:-1,R:1});
function initial(phase=0){
 if(!Number.isInteger(phase))phase=0;
 return {p:22,phase:((phase%path.length)+path.length)%path.length,turn:0,status:'playing',clue:'まだ聞いていません',message:'移動・聞く・探すで1手。足音は聞いた時点の情報です。'};
}
function distance(a,b){return Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5));}
function direction(p,q){const dy=Math.sign(Math.floor(q/5)-Math.floor(p/5)),dx=Math.sign(q%5-p%5);return [['北西','北','北東'],['西','同じ場所','東'],['南西','南','南東']][dy+1][dx+1];}
function act(s,action){
 if(!s||s.status!=='playing')return s;
 if(!['U','D','L','R','listen','search'].includes(action))return s;
 let p=s.p;
 if(Object.prototype.hasOwnProperty.call(deltas,action)){
  p+=deltas[action];
  if(p<0||p>24||walls.includes(p)||(action==='L'&&s.p%5===0)||(action==='R'&&s.p%5===4))return {...s,message:'壁や外には進めません。手数は減りません。'};
 }
 const turn=s.turn+1;
 let n={...s,p,turn,message:'相手も1歩進みました。'};
 // Search/listen inspect the current phase BEFORE the opponent advances.
 if(action==='search'&&distance(p,path[s.phase])===0){return {...n,status:'won',message:turn+'手目に見つけました！'};}
 if(action==='listen'){
  const d=direction(p,path[s.phase]);
  n.clue=turn+'手目・場所'+(Math.floor(p/5)+1)+'-'+(p%5+1)+'から：'+d;
  n.message='その時の足音は'+d+'。その後、相手は1歩進みました。';
 }else if(action==='search')n.message='この場所にはいませんでした。その後、相手は1歩進みました。';
 n.phase=(s.phase+1)%path.length;
 if(turn>=limit){n.status='lost';n.message=limit+'手になりました。もう一度探してみましょう。';}
 return n;
}
const api={initial,act,walls,path,limit};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.AlleyHide=api;
})(typeof globalThis!=='undefined'?globalThis:this);
