(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.IceStones=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=360,H=500,R=12,DT=1/120,FRICTION=60,TARGET={x:180,y:120,r:50};
const LEVELS=[{name:'1 / 寄せる',hint:'弱い石は手前に止まる。まずは中心の近くへ。',targetX:180,stones:[[215,120]]},{name:'2 / 道をつくる',hint:'正面の橙石が道をふさぐ。横を通すか、押し動かすか。',targetX:120,stones:[[180,225],[120,120]]},{name:'3 / 押すか、寄せるか',hint:'中心は橙石のもの。先に動かす？ 空いた側へ寄せる？',targetX:240,stones:[[240,120],[205,230],[160,285]]}];
function stone(x,y,team,id){return {x,y,vx:0,vy:0,team,id};}
function create(level=0){level=Number.isInteger(level)?Math.max(0,Math.min(2,level)):0;return {level,stones:LEVELS[level].stones.map((a,i)=>stone(a[0],a[1],'orange','o'+i)),shots:0,phase:'aim',ticks:0,accumulator:0,collisions:0,result:null};}
function target(s){return {...TARGET,x:LEVELS[s.level].targetX};}
function distances(s){const t0=target(s);const nearest=t=>{const a=s.stones.filter(x=>x.team===t);return a.length?Math.min(...a.map(x=>Math.hypot(x.x-t0.x,x.y-t0.y))):null;};return {blue:nearest('blue'),orange:nearest('orange')};}
function judge(s){const d=distances(s);return d.blue!==null&&d.blue<=TARGET.r&&(d.orange===null||d.blue<d.orange);}
function shoot(s,angle,power){if(s.phase!=='aim'||s.shots>=3||!Number.isFinite(angle)||!Number.isFinite(power)||angle< -25||angle>25||power<20||power>100)return false;const a=angle*Math.PI/180;const p=stone(180,450,'blue','b'+s.shots);p.vx=Math.sin(a)*power*3;p.vy=-Math.cos(a)*power*3;s.stones.push(p);s.shots++;s.phase='moving';s.accumulator=0;return true;}
function tick(s){s.ticks++;
for(const p of s.stones){p.x+=p.vx*DT;p.y+=p.vy*DT;const speed=Math.hypot(p.vx,p.vy),next=Math.max(0,speed-FRICTION*DT),ratio=speed?next/speed:0;p.vx*=ratio;p.vy*=ratio;
for(const [coord,vel,max] of [['x','vx',W],['y','vy',H]]){if(p[coord]<R){p[coord]=R;p[vel]=Math.abs(p[vel])*.75;}if(p[coord]>max-R){p[coord]=max-R;p[vel]=-Math.abs(p[vel])*.75;}}}
for(let i=0;i<s.stones.length;i++)for(let j=i+1;j<s.stones.length;j++){const a=s.stones[i],b=s.stones[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=R*2)continue;const nx=d?dx/d:1,ny=d?dy/d:0;const overlap=R*2-d;a.x-=nx*overlap/2;a.y-=ny*overlap/2;b.x+=nx*overlap/2;b.y+=ny*overlap/2;const closing=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(closing>0){const impulse=closing*.94;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;s.collisions++;}}
if(s.stones.every(p=>Math.hypot(p.vx,p.vy)<.7)){for(const p of s.stones){p.vx=0;p.vy=0;}s.phase=s.shots===3?'result':'aim';if(s.phase==='result')s.result=judge(s)?'win':'loss';s.accumulator=0;}}
function step(s,seconds){if(s.phase!=='moving'||!Number.isFinite(seconds)||seconds<=0)return s; s.accumulator+=Math.min(seconds,.1);while(s.accumulator+1e-10>=DT&&s.phase==='moving'){s.accumulator-=DT;tick(s);}return s;}
function pause(s){if(s.phase==='moving'){s.phase='paused';return true;}return false;}
function resume(s){if(s.phase==='paused'){s.phase='moving';s.accumulator=0;return true;}return false;}
return {W,H,R,DT,FRICTION,TARGET,LEVELS,target,create,shoot,step,pause,resume,distances,judge};});
