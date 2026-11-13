(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.StarGarden=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const N=9, TARGET=36, LIMIT=80;
const dirs={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
const key=(x,y)=>y*N+x;
function create(){return {safe:Array.from({length:N*N},(_,i)=>i%N===0||i%N===N-1||i<N||i>=N*(N-1)),trail:[],player:4,anchor:4,bug:{x:4,y:4,d:3},lives:3,steps:0,area:0,status:'playing',message:'縁から線を伸ばし、縁へ帰ろう。',lastGain:0};}
function clone(s){return {...s,safe:s.safe.slice(),trail:s.trail.slice(),bug:{...s.bug}};}
function strike(s){s.trail=[];s.player=s.anchor;s.lives--;s.message='虫が線に接触！ 安全な出発点へ戻った。';if(!s.lives)s.status='lost';}
function close(s){const barrier=s.safe.slice();s.trail.forEach(i=>barrier[i]=true);const start=key(s.bug.x,s.bug.y),open=new Set([start]),q=[start];for(let j=0;j<q.length;j++){let i=q[j],x=i%N,y=Math.floor(i/N);for(const [dx,dy] of Object.values(dirs)){let nx=x+dx,ny=y+dy,k=key(nx,ny);if(nx>=0&&nx<N&&ny>=0&&ny<N&&!barrier[k]&&!open.has(k)){open.add(k);q.push(k);}}}const before=s.area;for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){let i=key(x,y);if(!open.has(i))s.safe[i]=true;}s.trail=[];s.area=s.safe.reduce((a,v,i)=>a+(v&&i%N>0&&i%N<N-1&&i>=N&&i<N*(N-1)?1:0),0);s.lastGain=s.area-before;s.anchor=s.player;s.message=`${s.lastGain} マスを花壇にした！`;if(s.area>=TARGET){s.status='won';s.message='目標達成！ 星の花壇が広がった。';}}
function bugStep(s){const d=[[1,0],[0,1],[-1,0],[0,-1]];for(let n=0;n<4;n++){let dir=(s.bug.d+n)%4,[dx,dy]=d[dir],x=s.bug.x+dx,y=s.bug.y+dy;if(x>0&&x<N-1&&y>0&&y<N-1&&!s.safe[key(x,y)]){s.bug={x,y,d:dir};break;}}if(s.trail.includes(key(s.bug.x,s.bug.y)))strike(s);}
function move(state,dir){if(state.status!=='playing'||!Object.prototype.hasOwnProperty.call(dirs,dir))return clone(state);const s=clone(state),[dx,dy]=dirs[dir],x=s.player%N+dx,y=Math.floor(s.player/N)+dy,i=key(x,y);if(x<0||x>=N||y<0||y>=N)return s;
const retreat=s.trail.length>0&&(i===(s.trail.length>1?s.trail[s.trail.length-2]:s.anchor));
if(s.trail.includes(i)&&!retreat){s.message='自分の線は横切れない。別の方向へ。';return s;}
s.steps++;s.lastGain=0;s.player=i;if(retreat){s.trail.pop();s.message='線を1歩戻した。虫も動くので注意。';}else if(s.safe[i]){if(s.trail.length)close(s);else s.anchor=i;}else {s.trail.push(i);if(i===key(s.bug.x,s.bug.y))strike(s);}
if(s.status==='playing')bugStep(s);if(s.status==='playing'&&s.steps>=LIMIT){s.status='lost';s.message='80 手で閉園。もう一度、囲い方を変えてみよう。';}return s;}
return {N,TARGET,LIMIT,dirs,create,move};});
