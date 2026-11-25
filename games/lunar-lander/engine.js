(function (root) {
  'use strict';
  const C = Object.freeze({width:260,height:152,ground:139,pad0:197,pad1:230,leg:8,dt:1/120,gravity:16,thrust:43,tilt:.49,tiltRate:2.5,maxDown:16,maxSide:10,maxTilt:.13,maxTime:24});
  const fresh = () => ({x:34,y:25,vx:21,vy:1,angle:0,fuel:6,t:0,status:'flight',reason:'',burn:false});
  const limit = (n,a,b)=>Math.min(b,Math.max(a,n));
  function step(s,i={}) {
    if(s.status!=='flight') return s;
    const {dt,gravity,thrust,tilt,tiltRate}=C;
    const turn=Number(Boolean(i.right))-Number(Boolean(i.left));
    const angle=s.angle+limit(turn*tilt-s.angle,-tiltRate*dt,tiltRate*dt);
    const fire=i.thrust?Math.min(1,s.fuel/dt):0;
    const vx=s.vx+Math.sin(angle)*thrust*fire*dt;
    const vy=s.vy+(gravity-Math.cos(angle)*thrust*fire)*dt;
    const n={...s,angle,vx,vy,x:s.x+vx*dt,y:s.y+vy*dt,fuel:Math.max(0,s.fuel-fire*dt),t:s.t+dt,burn:fire>0};
    if(n.x<C.leg || n.x>C.width-C.leg) return {...n,x:limit(n.x,C.leg,C.width-C.leg),status:'loss',reason:'boundary',burn:false};
    if(n.y<10){n.y=10;n.vy=Math.max(0,n.vy);}
    if(n.y+C.leg>=C.ground){
      const inPad=n.x-C.leg>=C.pad0 && n.x+C.leg<=C.pad1;
      const reason=!inPad?'pad':(n.vy>C.maxDown||Math.abs(n.vx)>C.maxSide)?'speed':Math.abs(n.angle)>C.maxTilt?'angle':'';
      return {...n,y:C.ground-C.leg,status:reason?'loss':'win',reason,burn:false};
    }
    if(n.t>=C.maxTime) return {...n,status:'loss',reason:'time',burn:false};
    return n;
  }
  const api={C,fresh,step};
  if(typeof module==='object'&&module.exports) module.exports=api; else root.LunarLander=api;
})(globalThis);
