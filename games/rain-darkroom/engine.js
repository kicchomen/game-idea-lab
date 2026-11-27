(function(root){
'use strict';
const TARGET=[3.6,5.8,7.8], RATE=[1.1,.94,.82], TOL=.47, LIMIT=18;
function fresh(){return {time:0, dose:[0,0,0], mask:[false,false,false], phase:'ready', light:false, result:[]};}
function mask(s,i){if((s.phase==='ready'||s.phase==='play')&&Number.isInteger(i)&&i>=0&&i<3)s.mask[i]=!s.mask[i];}
function light(s){if(s.phase==='ready')s.phase='play';if(s.phase==='play')s.light=!s.light;}
function finish(s){if(s.phase!=='play')return;s.result=s.dose.map((v,i)=>v<TARGET[i]-TOL?'不足':v>TARGET[i]+TOL?'過多':'適正');s.phase=s.result.every(x=>x==='適正')?'win':'loss';s.light=false;}
function tick(s,seconds){if(s.phase!=='play'||!Number.isFinite(seconds)||seconds<=0)return;const dt=Math.min(LIMIT-s.time,seconds);s.time+=dt;if(s.light){for(let i=0;i<3;i++){if(!s.mask[i])s.dose[i]+=RATE[i]*dt;}}if(s.time>=LIMIT-1e-9){finish(s);}}
const api={TARGET,RATE,TOL,LIMIT,fresh,mask,light,finish,tick};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.Darkroom=api;
})(typeof window==='undefined'?null:window);
