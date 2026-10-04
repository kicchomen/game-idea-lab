(function(root){
'use strict';
const WORLD={w:420,h:480,r:9,range:100,speed:90,start:{x:65,y:205},goal:{x:244,y:340,w:42,h:35},walls:[{x:330,y:55,w:18,h:255},{x:35,y:285,w:200,h:20}],bounds:[{x:0,y:0,w:420,h:8},{x:0,y:472,w:420,h:8},{x:0,y:0,w:8,h:480},{x:412,y:0,w:8,h:480}]};
const walls=[...WORLD.walls,...WORLD.bounds];
function ray(x,y,a,max=1000){let d=max;for(const r of walls){let lo=0,hi=max;for(const [p,v,min,maxv] of [[x,Math.cos(a),r.x,r.x+r.w],[y,Math.sin(a),r.y,r.y+r.h]]){if(Math.abs(v)<1e-9){if(p<min||p>maxv){hi=-1;break}}else {let t1=(min-p)/v,t2=(maxv-p)/v;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2))}}if(hi>=lo&&hi>=0)d=Math.min(d,lo)}return d}
function create(angle){return {x:WORLD.start.x,y:WORLD.start.y,heading:0,angle,time:0,turns:0,armed:true,state:'running',path:[{...WORLD.start}],events:[]}}
function sense(s){const a=s.heading+s.angle*Math.PI/180;const distance=ray(s.x,s.y,a);return {a,distance,hit:distance<=WORLD.range,x:s.x+Math.cos(a)*Math.min(distance,WORLD.range),y:s.y+Math.sin(a)*Math.min(distance,WORLD.range)}}
function step(s,dt=1/120){if(s.state!=='running')return s; s.time+=dt;let q=sense(s); if(q.distance>WORLD.range+4)s.armed=true;
if(q.hit&&s.armed){s.heading+=Math.PI/2;s.armed=false;s.turns++;s.events.push({type:'turn',x:s.x,y:s.y,time:s.time,distance:q.distance})}
s.x+=Math.cos(s.heading)*WORLD.speed*dt;s.y+=Math.sin(s.heading)*WORLD.speed*dt;
const hit=walls.some(r=>Math.hypot(s.x-Math.max(r.x,Math.min(s.x,r.x+r.w)),s.y-Math.max(r.y,Math.min(s.y,r.y+r.h)))<=WORLD.r);
if(hit)s.state='collision';else if(s.x>=WORLD.goal.x&&s.x<=WORLD.goal.x+WORLD.goal.w&&s.y>=WORLD.goal.y&&s.y<=WORLD.goal.y+WORLD.goal.h)s.state='success';else if(s.time>=12)s.state='timeout';
if(s.path.length===1||Math.hypot(s.x-s.path.at(-1).x,s.y-s.path.at(-1).y)>3||s.state!=='running')s.path.push({x:s.x,y:s.y});return s}
function simulate(angle){const s=create(angle);while(s.state==='running')step(s);return s}
const api={WORLD,walls,ray,create,sense,step,simulate};if(typeof module!=='undefined')module.exports=api;else root.SensorShift=api;
})(typeof window!=='undefined'?window:globalThis);
