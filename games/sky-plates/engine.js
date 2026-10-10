(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.SkyPlates=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const X=[54,138,222,306],DT=1/120,DURATION=45,SPEED=155,CHARGE=0.75;
function create(){return{status:'ready',tick:0,time:0,x:X[0],target:0,spin:[83,68,92,79],charge:0,latched:false,score:0,refills:0,last:'',lostPlate:-1};}
function start(s){if(s.status==='ready')s.status='playing';}
function target(s,i){if(s.status!=='playing'||!Number.isInteger(i)||i<0||i>3)return false;if(s.target!==i){s.target=i;s.charge=0;}return true;}
function gust(s){return s.time>=12&&s.time<36?Math.floor((s.time-12)/6)%4:-1;}
function pause(s){if(s.status==='playing'){s.status='paused';s.charge=0;s.latched=false;}else if(s.status==='paused')s.status='playing';}
function step(s,holding){if(s.status!=='playing')return;s.tick++;s.time=s.tick*DT;const g=gust(s);
for(let i=0;i<4;i++){s.spin[i]-=(6.2+i*.2+(g===i?2.5:0))*DT;if(s.spin[i]<=0){s.spin[i]=0;s.status='lost';s.lostPlate=i;s.charge=0;return;}}
const dx=X[s.target]-s.x;s.x+=Math.sign(dx)*Math.min(Math.abs(dx),SPEED*DT);
if(!holding){s.charge=0;s.latched=false;}
if(holding&&!s.latched&&Math.abs(s.x-X[s.target])<.01){s.charge+=DT;if(s.charge+1e-8>=CHARGE){const low=s.spin[s.target]<35;s.spin[s.target]=100;s.refills++;s.score+=low?3:1;s.last=low?'ぎりぎり救出！ +3':'回転アップ +1';s.charge=0;s.latched=true;}}
if(s.time>=DURATION){s.status='won';s.charge=0;}}
return{X,DT,DURATION,SPEED,CHARGE,create,start,target,gust,pause,step};
});
