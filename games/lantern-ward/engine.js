(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.LanternWard=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PATH=[[0,42],[302,42],[302,132],[58,132],[58,222],[360,222]];
const SITES=[[90,82],[208,82],[330,88],[28,173],[149,178],[270,178]];
const COST={sun:25,moon:25,upgrade:30};
const WAVES=[['mist','mist','mist','mist','mist'],['swift','mist','swift','mist','swift','mist'],['heavy','mist','heavy','swift','mist','heavy'],['swift','swift','heavy','swift','heavy','swift','heavy'],['heavy','swift','heavy','heavy','swift','heavy','swift','heavy']];
const TYPES={mist:{hp:45,speed:35},swift:{hp:35,speed:58},heavy:{hp:140,speed:25}};
const LENGTH=PATH.slice(1).reduce((a,p,i)=>a+Math.hypot(p[0]-PATH[i][0],p[1]-PATH[i][1]),0);
function position(d){for(let i=1;i<PATH.length;i++){const a=PATH[i-1],b=PATH[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=len)return {x:a[0]+(b[0]-a[0])*d/len,y:a[1]+(b[1]-a[1])*d/len};d-=len;}return{x:360,y:222};}
function create(){return{status:'ready',wave:0,light:75,lives:5,lamps:SITES.map(()=>null),enemies:[],spawned:0,spawnClock:0,kills:0,time:0,shots:[],nextId:1};}
function canEdit(s){return ['ready','build','running'].includes(s.status);}
function build(s,index,type){if(!canEdit(s)||!Number.isInteger(index)||!SITES[index]||s.lamps[index]||!['sun','moon'].includes(type)||s.light<COST[type])return false;s.light-=COST[type];s.lamps[index]={type,level:1};return true;}
function upgrade(s,index){const l=s.lamps[index];if(!canEdit(s)||!l||l.level>=2||s.light<COST.upgrade)return false;s.light-=COST.upgrade;l.level=2;return true;}
function start(s){if(!['ready','build'].includes(s.status))return false;s.wave++;s.status='running';s.spawned=0;s.spawnClock=0;return true;}
function pause(s){if(s.status==='running'){s.status='paused';return true;}if(s.status==='paused'){s.status='running';return true;}return false;}
function step(s,dt){if(s.status!=='running'||!Number.isFinite(dt)||dt<=0)return;let remaining=dt;while(remaining>1e-9&&s.status==='running'){const h=Math.min(remaining,1/60);tick(s,h);remaining-=h;}}
function tick(s,dt){s.time+=dt;s.shots=[];s.spawnClock-=dt;const wave=WAVES[s.wave-1];if(s.spawned<wave.length&&s.spawnClock<=0){const type=wave[s.spawned++],t=TYPES[type];s.enemies.push({id:s.nextId++,type,hp:t.hp*(1+.3*(s.wave-1)),maxHp:t.hp*(1+.3*(s.wave-1)),d:0,slow:false});s.spawnClock+=1.65;}
for(const e of s.enemies)e.slow=false;
// Moon lamps slow every shadow in their circle. Sun lamps focus the foremost shadow.
for(let i=0;i<SITES.length;i++){const l=s.lamps[i];if(!l)continue;const [x,y]=SITES[i],r=l.type==='moon'?76+(l.level-1)*14:82+(l.level-1)*12;const inRange=s.enemies.filter(e=>{const p=position(e.d);return e.hp>0&&Math.hypot(p.x-x,p.y-y)<=r;});if(l.type==='moon'){for(const e of inRange){e.slow=true;e.hp-=(l.level===1?.15:.3)*dt;}if(inRange.length)s.shots.push({site:i,id:inRange[0].id});}else{inRange.sort((a,b)=>b.d-a.d);if(inRange.length){inRange[0].hp-=(l.level===1?13:24)*dt;s.shots.push({site:i,id:inRange[0].id});}}}
const alive=[];for(const e of s.enemies){if(e.hp<=0){s.light+=3;s.kills++;continue;}e.d+=TYPES[e.type].speed*(e.slow?.48:1)*dt;if(e.d>=LENGTH){s.lives--;if(s.lives<=0){s.status='lost';s.lives=0;}}else alive.push(e);}s.enemies=alive;if(s.status==='lost')return;if(s.spawned===wave.length&&!s.enemies.length){if(s.wave===WAVES.length)s.status='won';else{s.status='build';s.light+=18;}}}
return{PATH,SITES,COST,WAVES,TYPES,LENGTH,create,position,build,upgrade,start,pause,step};
});
