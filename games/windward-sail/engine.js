(function(root){'use strict';
const DT=1/120,LIMIT=60,TURN=75,NO_GO=35;
const marks=[{x:200,y:95,r:25,label:'1'},{x:310,y:265,r:25,label:'2'},{x:200,y:435,r:30,label:'港'}];
const wrap=a=>((a+180)%360+360)%360-180;
function polar(a){a=Math.abs(wrap(a));if(a<=NO_GO)return 0;if(a<55)return 38*(a-NO_GO)/20;if(a<90)return 38+(a-55)*6/35;return 44-(a-90)*18/90;}
function initial(){return{phase:'ready',x:200,y:420,heading:0,speed:0,t:0,mark:0,reason:'',tacks:0,lastSide:0};}
function start(){return{...initial(),phase:'playing'};}
function tick(s,input={},dt=DT){if(s.phase!=='playing')return s;if(!Number.isFinite(dt)||dt<0||dt>1)throw Error('invalid dt');const n={...s};let left=dt;const turn=Math.max(-1,Math.min(1,Number(input.turn)||0));while(left>1e-9&&n.phase==='playing'){const h=Math.min(DT,left,LIMIT-n.t);left-=h;n.heading=wrap(n.heading+turn*TURN*h);const side=Math.sign(n.heading);if(Math.abs(n.heading)>=90)n.lastSide=0;if(Math.abs(n.heading)>NO_GO&&Math.abs(n.heading)<90){if(n.lastSide&&side!==n.lastSide)n.tacks++;n.lastSide=side;}const target=polar(n.heading);n.speed+=(target-n.speed)*(1-Math.exp(-h*2.2));n.x+=Math.sin(n.heading*Math.PI/180)*n.speed*h;n.y-=Math.cos(n.heading*Math.PI/180)*n.speed*h;n.t+=h;if(n.x<18||n.x>382||n.y<18||n.y>482){n.phase='lost';n.reason='shore';}else{const m=marks[n.mark];if(Math.hypot(n.x-m.x,n.y-m.y)<=m.r){n.mark++;if(n.mark===marks.length)n.phase='won';}if(n.phase==='playing'&&n.t>=LIMIT-1e-9){n.t=LIMIT;n.phase='lost';n.reason='time';}}}return n;}
const pause=s=>s.phase==='playing'?{...s,phase:'paused'}:s;
const resume=s=>s.phase==='paused'?{...s,phase:'playing'}:s;
const api={DT,LIMIT,TURN,NO_GO,marks,wrap,polar,initial,start,tick,pause,resume};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SailEngine=api;
})(typeof window!=='undefined'?window:globalThis);
