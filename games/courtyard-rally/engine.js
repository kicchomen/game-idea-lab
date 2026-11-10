(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CourtyardRally=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const C=Object.freeze({width:300,height:340,radius:6,paddleHeight:10,playerY:310,opponentY:30,playerWidth:64,opponentWidth:56,playerSpeed:300,opponentSpeed:90,aiInterval:.16,aiOffset:14,initialSpeed:180,speedGain:8,maxSpeed:270,maxAngle:55*Math.PI/180,step:1/240,pointWait:1});
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function folded(x){const lo=C.radius,span=C.width-2*lo,p=((x-lo)%(2*span)+2*span)%(2*span);return lo+(p>span?2*span-p:p);}
function create(){return{phase:'ready',paused:false,player:{x:150},opponent:{x:150,target:150,clock:0},ball:{x:150,y:170,vx:0,vy:0,speed:C.initialSpeed},score:{player:0,opponent:0},returns:0,totalReturns:0,point:0,time:0,wait:0,accumulator:0,lastEvent:'ready',eventId:0};}
function event(s,name){s.lastEvent=name;s.eventId++;}
function serve(s){const a=(s.point%2===0?17:-17)*Math.PI/180;s.ball={x:150,y:170,vx:Math.sin(a)*C.initialSpeed,vy:Math.cos(a)*C.initialSpeed,speed:C.initialSpeed};s.returns=0;s.opponent.clock=0;s.phase='rally';event(s,'serve');}
function start(s){if(s.phase!=='ready')return false;serve(s);return true;}
function pause(s,value=true){if(!['rally','between'].includes(s.phase))return false;s.paused=Boolean(value);return true;}
function landing(ball,y){if(!ball.vy)return ball.x;return folded(ball.x+ball.vx*(y-ball.y)/ball.vy);}
function moveToward(x,target,max){return x+clamp(target-x,-max,max);}
function moveBall(b,dt){b.x+=b.vx*dt;b.y+=b.vy*dt;while(b.x<C.radius||b.x>C.width-C.radius){if(b.x<C.radius){b.x=2*C.radius-b.x;b.vx=Math.abs(b.vx);}if(b.x>C.width-C.radius){b.x=2*(C.width-C.radius)-b.x;b.vx=-Math.abs(b.vx);}}}
function hit(s,paddle,width,up){const b=s.ball,offset=clamp((b.x-paddle.x)/(width/2),-1,1),angle=offset*C.maxAngle;b.speed=Math.min(C.maxSpeed,b.speed+C.speedGain);b.vx=Math.sin(angle)*b.speed;b.vy=(up?-1:1)*Math.cos(angle)*b.speed;s.returns++;s.totalReturns++;event(s,up?'player-hit':'opponent-hit');}
function point(s,who){s.score[who]++;s.point++;s.ball.vx=0;s.ball.vy=0;s.wait=C.pointWait;if(s.score[who]===3){s.phase=who==='player'?'won':'lost';event(s,s.phase);}else{s.phase='between';event(s,who==='player'?'player-point':'opponent-point');}}
function tick(s,dt,input){s.time+=dt;let target=s.player.x;if(Number.isFinite(input.target))target=input.target;if(input.direction)target=s.player.x+Math.sign(input.direction)*C.playerSpeed*dt;s.player.x=moveToward(s.player.x,clamp(target,C.playerWidth/2,C.width-C.playerWidth/2),C.playerSpeed*dt);
if(s.phase==='between'){s.opponent.x=moveToward(s.opponent.x,150,C.opponentSpeed*dt);s.wait-=dt;if(s.wait<=1e-9)serve(s);return;}
const b=s.ball,o=s.opponent;o.clock-=dt;if(o.clock<=1e-9){o.clock+=C.aiInterval;if(b.vy<0){const side=s.player.x===150?(s.point%2?1:-1):Math.sign(s.player.x-150);o.target=clamp(landing(b,C.opponentY+C.paddleHeight/2+C.radius)+side*C.aiOffset,C.opponentWidth/2,C.width-C.opponentWidth/2);}else o.target=150;}o.x=moveToward(o.x,o.target,C.opponentSpeed*dt);
const down=b.vy>0,face=down?C.playerY-C.paddleHeight/2-C.radius:C.opponentY+C.paddleHeight/2+C.radius;const contact=(face-b.y)/b.vy;
if(contact>=-1e-10&&contact<=dt){moveBall(b,Math.max(0,contact));const paddle=down?s.player:o,width=down?C.playerWidth:C.opponentWidth;if(Math.abs(b.x-paddle.x)<=width/2+C.radius){b.y=face;hit(s,paddle,width,down);moveBall(b,dt-Math.max(0,contact));}else moveBall(b,dt-Math.max(0,contact));}else moveBall(b,dt);
if(b.y>C.height+C.radius)point(s,'opponent');else if(b.y<-C.radius)point(s,'player');}
// Consume every elapsed second through fixed physics steps. Paused time is not added.
function advance(s,dt,input={}){if(!Number.isFinite(dt)||dt<=0||s.paused||!['rally','between'].includes(s.phase))return;s.accumulator+=dt;while(s.accumulator+1e-10>=C.step&&!s.paused&&['rally','between'].includes(s.phase)){tick(s,C.step,input);s.accumulator-=C.step;}if(!['rally','between'].includes(s.phase))s.accumulator=0;}
return{C,create,start,pause,advance,landing,folded};
});
