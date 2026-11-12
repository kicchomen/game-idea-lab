(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ParcelSwitch=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const C=Object.freeze({total:18,firstFork:3,secondFork:5,redExit:5,otherExit:7,step:1/120});
const targets=Object.freeze([0,1,2,0,2,1,2,0,1,0,2,2,1,0,1,2,0,1]);
function create(){return{phase:'ready',paused:false,time:0,accumulator:0,switches:[false,false],parcels:[],spawned:0,delivered:0,correct:0,mistakes:0,nextSpawn:0,eventId:0,lastEvent:'ready',lastTarget:null};}
function event(s,name,target){s.eventId++;s.lastEvent=name;s.lastTarget=target===undefined?null:target;}
function start(s){if(s.phase!=='ready')return false;s.phase='playing';event(s,'started');return true;}
function flip(s,index){if(![0,1].includes(index)||s.phase!=='playing'||s.paused)return false;s.switches[index]=!s.switches[index];return true;}
function pause(s,value=true){if(s.phase!=='playing')return false;s.paused=Boolean(value);return true;}
function step(s,dt){s.time+=dt;while(s.spawned<C.total&&s.time+1e-9>=s.nextSpawn){const id=s.spawned++;s.parcels.push({id,target:targets[id],age:s.time-s.nextSpawn-dt,branch:null,exit:null});s.nextSpawn+=id<3?2.4:1.35;}
for(const p of s.parcels){p.age+=dt;if(p.branch===null&&p.age+1e-9>=C.firstFork)p.branch=s.switches[0]?'onward':'red';if(p.branch==='onward'&&p.exit===null&&p.age+1e-9>=C.secondFork)p.exit=s.switches[1]?2:1;const end=p.branch==='red'?C.redExit:C.otherExit;if(p.branch!==null&&p.age+1e-9>=end){const dest=p.branch==='red'?0:p.exit;p.done=true;s.delivered++;if(dest===p.target){s.correct++;event(s,'correct',p.target);}else{s.mistakes++;event(s,'wrong',p.target);}if(s.mistakes>=3){s.phase='lost';event(s,'lost');break;}}}
s.parcels=s.parcels.filter(p=>!p.done);if(s.phase==='playing'&&s.delivered===C.total){s.phase='won';event(s,'won');}}
function advance(s,dt){if(!Number.isFinite(dt)||dt<=0||s.phase!=='playing'||s.paused)return;s.accumulator+=dt;while(s.accumulator+1e-9>=C.step&&s.phase==='playing'){s.accumulator-=C.step;step(s,C.step);}}
function reset(s){const fresh=create();for(const k of Object.keys(s))delete s[k];Object.assign(s,fresh);return s;}
return{C,targets,create,start,flip,pause,advance,reset};
});
