(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HarborCrane=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const JOBS=[{name:'広い荷台',start:100,target:350,width:100},{name:'反対側へ',start:370,target:140,width:82},{name:'ぴったり納品',start:110,target:340,width:68}];
const G=260,L=105,GROUND=312,BOX=28,LIMIT=40,MAX_SPEED=32;
function create(job=0){job=Math.max(0,Math.min(2,job|0));return{job,phase:'ready',time:0,x:JOBS[job].start,v:0,angle:0,omega:0,drop:null,reason:'',pausePhase:null};}
function cargo(s){return{x:s.x+L*Math.sin(s.angle),y:80+L*Math.cos(s.angle),vx:s.v+L*Math.cos(s.angle)*s.omega};}
function forecast(s){const p=cargo(s),t=Math.sqrt(Math.max(0,2*(GROUND-BOX/2-p.y)/G));return{x:p.x+p.vx*t,vx:p.vx,time:t};}
function start(s){if(s.phase==='ready')s.phase='playing';}
function pause(s){if(['playing','falling'].includes(s.phase)){s.pausePhase=s.phase;s.phase='paused';}else if(s.phase==='paused'){s.phase=s.pausePhase;s.pausePhase=null;}}
function release(s){if(s.phase!=='playing')return false;const p=cargo(s);s.drop={x:p.x,y:p.y,vx:p.vx,vy:0};s.phase='falling';return true;}
function step(s,axis,dt){
 if(!['playing','falling'].includes(s.phase)||!Number.isFinite(dt)||dt<=0)return s;
 axis=Math.sign(Number.isFinite(axis)?axis:0);let n=Math.ceil(dt/(1/120)),h=dt/n;
 for(let i=0;i<n;i++){
  if(!['playing','falling'].includes(s.phase))break;
  let used=Math.min(h,Math.max(0,LIMIT-s.time));
  if(s.phase==='falling'){
   let p=s.drop,remain=GROUND-BOX/2-p.y,landT=(-p.vy+Math.sqrt(p.vy*p.vy+2*G*Math.max(0,remain)))/G;
   let advance=Math.min(used,landT);p.x+=p.vx*advance;p.y+=p.vy*advance+.5*G*advance*advance;p.vy+=G*advance;s.time+=advance;
   if(landT<=used+1e-12){p.y=GROUND-BOX/2;let job=JOBS[s.job],on=Math.abs(p.x-job.target)<=job.width/2-BOX/2+1e-9,calm=Math.abs(p.vx)<=MAX_SPEED+1e-9;
    s.phase=on&&calm?'won':'lost';s.reason=!on?'荷台から外れた。下の着地点を目安に。':!calm?'横の勢いが強すぎた。揺れを落ち着かせよう。':'荷台に置けた！';
   }
  }else{
   let oldv=s.v,target=axis*90,delta=Math.max(-180*used,Math.min(180*used,target-s.v));s.v+=delta;s.x+=s.v*used;
   if(s.x<45||s.x>475){s.x=Math.max(45,Math.min(475,s.x));s.v=0;}
   if(used>0){let a=(s.v-oldv)/used;s.omega+=(-G/L*Math.sin(s.angle)-a/L*Math.cos(s.angle)-.34*s.omega)*used;s.angle+=s.omega*used;}
   if(Math.abs(s.angle)>1.2){s.angle=Math.sign(s.angle)*1.2;s.omega*=.3;}s.time+=used;
  }
  if(['playing','falling'].includes(s.phase)&&s.time>=LIMIT-1e-12){s.time=LIMIT;s.phase='lost';s.reason='時間切れ。運び方を変えて、もう一度。';}
 }
 return s;
}

return{JOBS,G,L,GROUND,BOX,LIMIT,MAX_SPEED,create,cargo,forecast,start,pause,release,step};});
