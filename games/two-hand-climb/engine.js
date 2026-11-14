(function(r,f){if(typeof module==='object')module.exports=f();else r.Climb=f();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const W=5,H=7,MAX=8;const holds=[];for(let y=0;y<7;y++)for(let x=1;x<=3;x++)if(x!==2||[0,2,3,5,6].includes(y))holds.push(y*W+x);
const dist=(a,b)=>Math.abs(a%W-b%W)+Math.abs(Math.floor(a/W)-Math.floor(b/W));
function create(){return {hands:[31,33],selected:0,energy:MAX,moves:0,rested:false,status:'playing',message:'手を選び、明るい突起をつかもう。'};}
function reachable(s,i){return holds.includes(i)&&i!==s.hands[0]&&i!==s.hands[1]&&dist(i,s.hands[1-s.selected])<=3&&Math.abs(Math.floor(i/W)-Math.floor(s.hands[1-s.selected]/W))<=1;}
function select(s,h){return {...s,hands:s.hands.slice(),selected:h===0||h===1?h:s.selected};}
function canRest(s){return s.status==='playing'&&!s.rested&&s.hands.every(i=>Math.floor(i/W)===3);}
function rest(s){if(!canRest(s))return {...s,hands:s.hands.slice()};return {...s,hands:s.hands.slice(),energy:MAX,rested:true,message:'棚でひと休み。握力が8に回復した。'};}
function move(s,i){const n={...s,hands:s.hands.slice()};if(s.status!=='playing'||!reachable(s,i))return n;const cost=dist(i,s.hands[1-s.selected])===3?3:2;n.energy-=cost;n.moves++;n.hands[n.selected]=i;if(n.energy<0){n.energy=0;n.status='lost';n.message='握力が足りず落下。棚で休む順番を考えよう。';}else if(n.hands.every(v=>Math.floor(v/W)===0)){n.status='won';n.message='ふたつの手が頂上へ！ 登攀成功。';}else if(n.energy===0&&!canRest(n)){n.status='lost';n.message='握力が尽きて落下。もう一度。';}else n.message=`${cost}消費。${canRest(n)?'両手が棚へ。休憩できる。':'次の支点を選ぼう。'}`;return n;}
return {W,H,MAX,holds,dist,create,reachable,select,canRest,rest,move};});
