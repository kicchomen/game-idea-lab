(function(root){'use strict';
const W=600,H=420,STEP=1/120,LIMIT=70,PEN={x:500,top:105,bottom:315};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function create(){return {status:'ready',time:0,dog:{x:90,y:210},target:{x:90,y:210},sheep:[{x:280,y:185},{x:300,y:215},{x:275,y:245},{x:325,y:245}].map((p,i)=>({...p,id:i,safe:false})),saved:0};}
function start(s){if(s.status==='ready')s.status='playing';return s;}
function aim(s,x,y){if(s.status==='playing'&&Number.isFinite(x)&&Number.isFinite(y))s.target={x:clamp(x,18,582),y:clamp(y,18,402)};return s;}
function stop(s){s.target={...s.dog};return s;}
function pause(s){if(s.status==='playing'){s.status='paused';stop(s);}else if(s.status==='paused')s.status='playing';return s;}
function tick(s,dt,input={}){if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return s;dt=Math.min(dt,STEP);s.time=Math.min(LIMIT,s.time+dt);
let ix=Number(input.x)||0,iy=Number(input.y)||0;if(ix||iy){let n=Math.hypot(ix,iy);s.target={x:clamp(s.dog.x+ix/n*40,18,582),y:clamp(s.dog.y+iy/n*40,18,402)};}
let dx=s.target.x-s.dog.x,dy=s.target.y-s.dog.y,d=Math.hypot(dx,dy),move=Math.min(d,145*dt);if(d){s.dog.x+=dx/d*move;s.dog.y+=dy/d*move;}
const old=s.sheep.map(p=>({...p})),active=old.filter(p=>!p.safe);const center=active.length?{x:active.reduce((a,p)=>a+p.x,0)/active.length,y:active.reduce((a,p)=>a+p.y,0)/active.length}:null;
s.sheep.forEach((p,i)=>{if(p.safe)return;let o=old[i],vx=0,vy=0;const dx=o.x-s.dog.x,dy=o.y-s.dog.y,d=Math.hypot(dx,dy);if(d<155){let f=36*(1-d/155)+9;vx+=dx/Math.max(d,1)*f;vy+=dy/Math.max(d,1)*f;}
// Cohesion is local flock behavior, never a goal-attraction force.
vx+=(center.x-o.x)*.34;vy+=(center.y-o.y)*.34;
old.forEach(q=>{if(q.id===o.id||q.safe)return;let x=o.x-q.x,y=o.y-q.y,n=Math.hypot(x,y);if(n<30&&n>0){vx+=x/n*(30-n)*.8;vy+=y/n*(30-n)*.8;}});
const speed=Math.hypot(vx,vy);if(speed>48){vx*=48/speed;vy*=48/speed;}
p.x=clamp(o.x+vx*dt,14,586);p.y=clamp(o.y+vy*dt,14,406);
// Fence blocks crossing except at the visible wide gate.
if(o.x<500&&p.x>=488&&(p.y<117||p.y>303))p.x=488;
if(p.x>=512&&p.y>=117&&p.y<=303){p.safe=true;s.saved++;}
});
if(s.saved===4)s.status='won';else if(s.time>=LIMIT)s.status='lost';return s;}
const api={W,H,STEP,LIMIT,PEN,create,start,aim,stop,pause,tick};if(typeof module!=='undefined')module.exports=api;else root.Shepherd=api;
})(typeof globalThis!=='undefined'?globalThis:this);
