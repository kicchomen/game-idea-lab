(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Windbird=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DT=1/120;
const COURSES=[
 {name:'風の道',goal:1380,limit:42,thermals:[{x:220,w:180},{x:650,w:170},{x:1060,w:140}],storms:[{x:480,y:45,w:105,h:112},{x:900,y:175,w:105,h:112}]},
 {name:'低い雲',goal:1580,limit:44,thermals:[{x:240,w:145},{x:730,w:130},{x:1240,w:135}],storms:[{x:520,y:15,w:110,h:175},{x:1020,y:130,w:110,h:174}]},
 {name:'遠い岸',goal:1800,limit:47,thermals:[{x:270,w:125},{x:820,w:125},{x:1380,w:115}],storms:[{x:570,y:70,w:110,h:185},{x:1130,y:0,w:120,h:175},{x:1580,y:155,w:100,h:155}]}
];
function fresh(course=0){return {course:Math.max(0,Math.min(2,Math.floor(course)||0)),x:45,y:165,vx:0,vy:0,energy:100,time:0,status:'ready',reason:'',flapping:false,inThermal:false,used:0,nearMiss:0};}
function start(s){if(s.status==='ready'||s.status==='paused')s.status='playing';return s;}
function pause(s){if(s.status==='playing'){s.status='paused';s.flapping=false;}return s;}
function fail(s,reason){s.status='lost';s.reason=reason;s.flapping=false;}
function step(s,input={},dt=DT){if(s.status!=='playing')return s;if(!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(dt,DT);const c=COURSES[s.course];
 const oldY=s.y;const dir=(input.right?1:0)-(input.left?1:0);const target=dir*100;s.vx+=(target-s.vx)*Math.min(1,dt*6);s.x=Math.max(14,Math.min(c.goal+80,s.x+s.vx*dt));
 s.inThermal=c.thermals.some(t=>s.x>=t.x&&s.x<=t.x+t.w);s.flapping=!!input.flap&&s.energy>0.5;
 const accel=52-(s.flapping?143:0)-(s.inThermal?92:0);s.vy+=(accel-s.vy*0.95)*dt;s.vy=Math.max(-90,Math.min(75,s.vy));s.y+=s.vy*dt;
 if(s.y<18){s.y=18;s.vy=Math.max(0,s.vy);}
 if(s.flapping){s.energy=Math.max(0,s.energy-32*dt);s.used+=dt;}else s.energy=Math.min(100,s.energy+(s.inThermal?18:9)*dt);
 s.time+=dt;
 for(const o of c.storms){if(s.x+9>o.x&&s.x-9<o.x+o.w&&s.y+7>o.y&&s.y-7<o.y+o.h){fail(s,'嵐の雲に入りました');return s;}}
 if(s.x>=c.goal&&s.y>=272){if(oldY<272&&s.vy>0){s.y=272;s.vx=0;s.vy=0;s.status='won';s.reason='島へ無事に着地！';s.flapping=false;}else fail(s,'島の崖にぶつかりました');return s;}
 if(s.y>=329){fail(s,'海まで降りてしまいました');return s;}
 if(s.time>=c.limit){fail(s,'日暮れに間に合いませんでした');return s;}return s;
}
return {DT,COURSES,fresh,start,pause,step};});
