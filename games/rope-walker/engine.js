(function(root){'use strict';
const LENGTH=60,LIMIT=55,DT=1/120;
const gusts=[{at:0,v:.25},{at:5,v:-.65},{at:11,v:.8},{at:17,v:-.9},{at:23,v:.55},{at:30,v:-.75},{at:37,v:.85},{at:44,v:-.6}];
function wind(t){let i=0;while(i+1<gusts.length&&gusts[i+1].at<=t)i++;return{value:gusts[i].v,next:gusts[i+1]||null};}
function initial(){return{phase:'ready',t:0,distance:0,lean:0,velocity:0,braced:0,reason:'',steps:0};}
function start(){return{...initial(),phase:'playing'};}
function tick(s,input={},dt=DT){if(s.phase!=='playing')return s;if(!Number.isFinite(dt)||dt<0||dt>1)throw Error('invalid dt');const n={...s};const steer=Math.max(-1,Math.min(1,Number(input.steer)||0));const brace=!!input.brace;let left=dt;while(left>1e-9&&n.phase==='playing'){const h=Math.min(DT,left,LIMIT-n.t);left-=h;const w=wind(n.t).value;const accel=(brace?-.5:.45)*n.lean+w*(brace?.22:.65)+steer*1.8-n.velocity*(brace?3:1.2);n.velocity+=accel*h;n.lean+=n.velocity*h;n.t+=h;if(brace)n.braced+=h;else{n.distance+=2.5*Math.max(.3,1-Math.abs(n.lean)*.45)*h;n.steps=n.distance/1.2;}if(Math.abs(n.lean)>=1){n.phase='lost';n.reason='balance';}else if(n.distance>=LENGTH){n.distance=LENGTH;n.phase='won';}else if(n.t>=LIMIT){n.t=LIMIT;n.phase='lost';n.reason='time';}}
return n;}
function pause(s){return s.phase==='playing'?{...s,phase:'paused'}:s;}function resume(s){return s.phase==='paused'?{...s,phase:'playing'}:s;}
const api={LENGTH,LIMIT,DT,gusts,wind,initial,start,tick,pause,resume};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RopeEngine=api;
})(typeof window!=='undefined'?window:globalThis);
