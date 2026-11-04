(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Followspot=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const H=1/120,LIMIT=36,GOAL=70,RATE=100/28.8,SEQUENCE=[0,1,0,1,1,0],RADII=[60,110];
function create(){return{phase:'ready',tick:0,time:0,carry:0,aim:163.2,wide:false,lamp:true,heat:0,locked:false,score:0,clean:0,spill:0,overheats:0,feedback:'合図の役者だけを照らそう'};}
function start(s){if(s.phase!=='ready')return false;s.phase='playing';return true;}
function pause(s){if(s.phase==='playing'){s.phase='paused';return true;}if(s.phase==='paused'){s.phase='playing';return true;}return false;}
function actors(time){const x=182*Math.sin(.42*time-.85);return[300+x,300-x];}
function cue(s){const i=Math.min(5,Math.floor(s.time/6)),within=s.time-i*6;return{index:i,target:within<4.8?SEQUENCE[i]:null,dark:within>=4.8,next:i<5?SEQUENCE[i+1]:null,remaining:Math.max(0,(within<4.8?4.8:6)-within)};}
function aim(s,x){if(s.phase!=='playing'||!Number.isFinite(x))return false;s.aim=Math.max(40,Math.min(560,x));return true;}
function width(s,value){if(s.phase!=='playing'||typeof value!=='boolean')return false;s.wide=value;return true;}
function lamp(s,value){if(s.phase!=='playing'||typeof value!=='boolean')return false;s.lamp=value;return true;}
function exposure(s){const c=cue(s),p=actors(s.time),r=RADII[+s.wide],on=s.lamp&&!s.locked;
const full=p.map(x=>on&&Math.abs(s.aim-x)<=r-13),touch=p.map(x=>on&&Math.abs(s.aim-x)<r+13);
const clean=c.target!==null&&full[c.target]&&!touch[1-c.target];
const spill=on&&(c.target===null||touch[1-c.target]);
return{cue:c,actors:p,radius:r,on,full,touch,clean,spill};}
function step(s,axis,dt){if(s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return s;axis=Number.isFinite(axis)?Math.max(-1,Math.min(1,axis)):0;s.carry+=Math.min(dt,LIMIT-s.time);
while(s.carry+1e-12>=H&&s.phase==='playing'){
 s.carry=Math.max(0,s.carry-H);if(s.carry<1e-12)s.carry=0;s.aim=Math.max(40,Math.min(560,s.aim+axis*240*H));
 let e=exposure(s);
 if(e.on){s.heat=Math.min(100,s.heat+(s.wide?17:10)*H);if(e.clean){s.score=Math.min(100,s.score+RATE*H);s.clean+=H;s.feedback='ぴったり！ 主役を追えている';}else if(e.spill){s.score=Math.max(0,s.score-RATE*.5*H);s.spill+=H;s.feedback=e.cue.dark?'暗転。消灯して冷やそう':'別の役者に光が漏れている';}else{s.feedback='主役の足元を光の輪に入れよう';}
 if(s.heat>=100-1e-9){s.heat=100;s.locked=true;s.overheats++;s.feedback='過熱！ 35まで自動冷却';}
 }else{s.heat=Math.max(0,s.heat-30*H);s.feedback=s.locked?'過熱！ 35まで自動冷却':e.cue.dark?'暗転中。冷却のチャンス':'消灯中。狙いを整えよう';if(s.locked&&s.heat<=35+1e-9)s.locked=false;}
 s.tick++;s.time=s.tick*H;
 if(s.tick>=LIMIT/H){s.time=LIMIT;s.carry=0;s.phase=s.score+1e-8>=GOAL?'won':'lost';s.feedback=s.phase==='won'?'カーテンコール！':'もう一度、光をつなごう';}
}
return s;}
return{H,LIMIT,GOAL,RATE,SEQUENCE:SEQUENCE.slice(),RADII:RADII.slice(),create,start,pause,actors,cue,aim,width,lamp,exposure,step};});
