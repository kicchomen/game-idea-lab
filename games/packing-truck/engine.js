(function(root){'use strict';
const JOBS=[{w:4,h:4,pieces:[[2,2],[2,2],[3,1],[1,3]]},{w:6,h:4,pieces:[[3,2],[3,2],[2,2],[2,1],[1,2],[1,3]]},{w:6,h:5,pieces:[[3,2],[3,2],[2,2],[2,2],[3,1],[2,1],[2,1],[1,2]]}];
const LIMIT=90;
function create(job=0){if(!Number.isInteger(job)||job<0||job>=JOBS.length)job=0;let j=JOBS[job];return{job,w:j.w,h:j.h,pieces:j.pieces.map(([w,h],id)=>({id,w,h,x:null,y:null})),status:'ready',time:0,moves:0};}
function start(s){if(s.status==='ready')s.status='playing';return s;}
function pause(s){if(s.status==='playing')s.status='paused';else if(s.status==='paused')s.status='playing';return s;}
function fits(s,id,x,y,rot=false){let p=s.pieces[id];if(!p||!Number.isInteger(x)||!Number.isInteger(y))return false;let w=rot?p.h:p.w,h=rot?p.w:p.h;if(x<0||y<0||x+w>s.w||y+h>s.h)return false;return !s.pieces.some(q=>q.id!==id&&q.x!==null&&x<q.x+q.w&&x+w>q.x&&y<q.y+q.h&&y+h>q.y);}
function place(s,id,x,y,rot=false){if(s.status!=='playing'||!fits(s,id,x,y,rot))return false;let p=s.pieces[id];if(rot)[p.w,p.h]=[p.h,p.w];p.x=x;p.y=y;s.moves++;if(s.pieces.every(q=>q.x!==null))s.status='won';return true;}
function remove(s,id){let p=s.pieces[id];if(s.status!=='playing'||!p||p.x===null)return false;p.x=p.y=null;return true;}
function tick(s,dt){if(s.status!=='playing'||!Number.isFinite(dt)||dt<=0)return s;s.time=Math.min(LIMIT,s.time+dt);if(s.time>=LIMIT)s.status='lost';return s;}
const api={JOBS,LIMIT,create,start,pause,fits,place,remove,tick};if(typeof module!=='undefined')module.exports=api;else root.Packing=api;
})(typeof globalThis!=='undefined'?globalThis:this);
