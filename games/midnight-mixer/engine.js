(function(root, make){ if(typeof module==='object'&&module.exports)module.exports=make();else root.MidnightMixer=make(); })(globalThis,function(){
'use strict';
const labels=['音楽','トーク','ジングル'];
const plan=Object.freeze([[0,4.5],[1,6],[2,2.5],[1,6.5],[0,5],[2,3.5]].map(Object.freeze));
const total=28, PASS=5, step=1/120, race=1e-8;
function create(){return {phase:'ready',time:0,carry:0,i:0,offset:0,clean:0,results:[],destination:0,gain:[1,0,0]};}
function start(s){if(s.phase!=='ready')return false;s.phase='play';return true;}
function select(s,i){if(s.phase!=='play'||!Number.isInteger(i)||i<0||i>2||s.destination===i)return false;s.destination=i;return true;}
function pause(s){if(s.phase==='play'){s.phase='pause';return true}if(s.phase==='pause'){s.phase='play';return true}return false;}
function tick(s,dt){if(s.phase!=='play'||!Number.isFinite(dt)||dt<=0)return s;
 s.carry+=Math.min(dt,total-s.time);
 while(s.carry+race>=step&&s.phase==='play'){
  s.carry=Math.max(0,s.carry-step);s.time+=step;s.offset+=step;
  const [target,duration]=plan[s.i], blend=1-Math.exp(-step/(target===1?.13:.24));
  for(let j=0;j<3;j++)s.gain[j]+=((s.destination===j?1:0)-s.gain[j])*blend;
  // Short transitions are allowed, but wrong source must never dominate the segment.
  if(s.offset>.40&&s.gain[target]>=.78)s.clean+=step;
  if(s.offset+race>=duration){
   const ratio=s.clean/(duration-.40);
   s.results.push(ratio>=.77);
   if(s.i+1===plan.length){s.time=total;s.phase=s.results.filter(Boolean).length>=PASS?'won':'lost';}
   else{s.i++;s.offset=0;s.clean=0;}
  }
 }
 return s;
}
function view(s){const [target,duration]=plan[s.i];return {number:s.i+1,target,next:plan[s.i+1]?.[0]??null,countdown:Math.max(0,duration-s.offset),remaining:Math.max(0,total-s.time),score:s.results.filter(Boolean).length,dominant:s.gain.indexOf(Math.max(...s.gain))};}
return Object.freeze({labels,plan,total,PASS,create,start,select,pause,tick,view});
});
