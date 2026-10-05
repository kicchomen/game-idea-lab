(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EchoGame=factory()})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DELAY=4;
const levels=[
 {name:'待ち合わせ',hint:'丸いスイッチを踏んだら右へ。残像が追いつくまで「待つ」を使おう。',map:['#######','#...#G#','#...#.#','#.S.D.#','#...#.#','#P..#.#','#######']},
 {name:'ひと回りの約束',hint:'スイッチから扉の手前までは4歩。青い残像がスイッチに着いたら、次の1歩で扉へ。',map:['########','#....#G#','#.S..#.#','#..#.#.#','#....D.#','#P...#.#','########']}
];
const same=(a,b)=>a.x===b.x&&a.y===b.y;
function load(n=0){const level=levels[n],grid=level.map.map(r=>r.split(''));let player,switchPos,door,goal;grid.forEach((row,y)=>row.forEach((v,x)=>{const p={x,y};if(v==='P')player=p;if(v==='S')switchPos=p;if(v==='D')door=p;if(v==='G')goal=p;}));return {level:n,grid,player,echo:{...player},trail:Array.from({length:DELAY},()=>({...player})),switchPos,door,goal,turns:0,won:false};}
function open(s){return same(s.echo,s.switchPos)||same(s.player,s.door);}
function step(s,dx,dy){if(s.won||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)+Math.abs(dy)>1)return {state:s,reason:'invalid'};const p={x:s.player.x+dx,y:s.player.y+dy};const cell=s.grid[p.y]?.[p.x];if(!cell||cell==='#')return {state:s,reason:'wall'};if(same(p,s.door)&&!open(s))return {state:s,reason:'closed'};
const next={...s,player:p,echo:{...s.trail[0]},trail:[...s.trail.slice(1),p],turns:s.turns+1,won:same(p,s.goal)};return {state:next,reason:next.won?'won':'moved'};}
return {DELAY,levels,same,load,open,step};});
