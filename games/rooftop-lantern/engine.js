(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.RooftopLantern=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=1840,H=400,LIMIT=90,DT=1/120;
const PLATFORMS=[{x:0,y:300,w:250},{x:330,y:280,w:210},{x:630,y:300,w:230},{x:940,y:260,w:210},{x:1240,y:300,w:240},{x:1650,y:280,w:190},
{x:240,y:355,w:210},{x:540,y:355,w:200},{x:860,y:350,w:180},{x:1150,y:355,w:190},
{x:450,y:200,w:130},{x:760,y:205,w:140},{x:1080,y:175,w:170}];
const EMBERS=[{x:490,y:252},{x:1040,y:232},{x:1720,y:252}];
function create(){return{phase:'ready',x:60,y:300,vx:0,vy:0,face:1,ground:true,airDash:true,dash:0,coyote:.09,jumpBuffer:0,time:0,embers:[false,false,false],reason:'',acc:0};}
function start(s){if(s.phase==='ready')s.phase='playing';}
function pause(s){if(s.phase==='playing')s.phase='paused';else if(s.phase==='paused')s.phase='playing';}
function jump(s){if(s.phase==='playing')s.jumpBuffer=.12;}
function dash(s,axis){if(s.phase!=='playing'||s.ground||!s.airDash||s.dash>0)return false;s.face=axis?Math.sign(axis):s.face;s.airDash=false;s.dash=.16;s.vx=s.face*430;s.vy=0;return true;}
function tick(s,axis){
 s.time+=DT;s.jumpBuffer=Math.max(0,s.jumpBuffer-DT);s.coyote=Math.max(0,s.coyote-DT);
 if(s.jumpBuffer>0&&(s.ground||s.coyote>0)){s.vy=-430;s.ground=false;s.coyote=0;s.jumpBuffer=0;}
 let oldY=s.y;
 if(s.dash>0){s.dash=Math.max(0,s.dash-DT);s.vx=s.face*430;s.vy=0;}
 else {let target=axis*180,rate=axis?1400:1800;s.vx+=Math.max(-rate*DT,Math.min(rate*DT,target-s.vx));s.vy+=900*DT;if(axis)s.face=axis;}
 s.x=Math.max(12,Math.min(W-12,s.x+s.vx*DT));s.y+=s.vy*DT;s.ground=false;
 if(s.vy>=0){for(let p of PLATFORMS){if(s.x+10>p.x&&s.x-10<p.x+p.w&&oldY<=p.y+.001&&s.y>=p.y){s.y=p.y;s.vy=0;s.ground=true;s.airDash=true;s.dash=0;s.coyote=.09;break;}}}
 EMBERS.forEach((e,i)=>{if(Math.abs(s.x-e.x)<25&&Math.abs(s.y-16-e.y)<29)s.embers[i]=true;});
 if(s.x>1780&&s.ground&&s.embers.every(Boolean)){s.phase='won';s.reason='3つの星灯りを届けた！ 夜の街に灯りが戻った。';}
 else if(s.y>H+50){s.phase='lost';s.reason='屋根の外へ落ちた。最後の広いすき間は、ジャンプ中にダッシュ！';}
 else if(s.time>=LIMIT){s.phase='lost';s.time=LIMIT;s.reason='夜明けまでに間に合わなかった。もう一度挑戦しよう。';}
}
function step(s,axis,dt){if(s.phase!=='playing'||!Number.isFinite(dt)||dt<=0)return s;axis=Number.isFinite(axis)?Math.sign(axis):0;s.acc+=dt;while(s.acc+1e-10>=DT&&s.phase==='playing'){s.acc-=DT;tick(s,axis);}return s;}
return{W,H,LIMIT,DT,PLATFORMS,EMBERS,create,start,pause,jump,dash,step};});
