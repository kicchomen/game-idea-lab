(function(root){'use strict';
const rocks=[7,12,17], dirs=[-5,1,5,-1];
const copy=s=>JSON.parse(JSON.stringify(s));
function create(){return {round:1,ap:2,pos:[20,24,0,4],score:[0,0],status:'playing',log:[]};}
function adjacent(a,b){return Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5))===1;}
function values(r){return rocks.map((_,i)=>1+(i+r-1)%3);}
function legal(s,id,to){if(s.status!=='playing'||!Number.isInteger(id)||!Number.isInteger(to)||id<0||id>3||to<0||to>24||!adjacent(s.pos[id],to))return false;let other=s.pos.indexOf(to);if(other<0)return true;if(Math.floor(other/2)===Math.floor(id/2))return false;let beyond=to+to-s.pos[id];return beyond>=0&&beyond<25&&adjacent(to,beyond)&&!s.pos.includes(beyond);}
function move(s,id,to){let n=copy(s),other=n.pos.indexOf(to);if(other>=0)n.pos[other]=to+to-n.pos[id];n.pos[id]=to;return n;}
function actions(s,team){let a=[];for(let id=team*2;id<team*2+2;id++)for(let to=0;to<25;to++)if(legal(s,id,to))a.push({id,to});return a;}
function scoreFor(s,team){let v=values(s.round);return rocks.reduce((sum,p,i)=>sum+(s.pos.slice(team*2,team*2+2).includes(p)?v[i]:0),0);}
function value(s){let v=values(s.round),sum=(scoreFor(s,1)-scoreFor(s,0))*20;for(let id=2;id<4;id++){let best=-100;for(let i=0;i<rocks.length;i++){let d=Math.abs(s.pos[id]%5-rocks[i]%5)+Math.abs(Math.floor(s.pos[id]/5)-Math.floor(rocks[i]/5));best=Math.max(best,v[i]*2-d*3);}sum+=best;}return sum;}
function rival(s){let best=null,bestValue=-Infinity;let first=[null,...actions(s,1)];for(let a of first){let n=a?move(s,a.id,a.to):copy(s);for(let b of [null,...actions(n,1)]){let q=b?move(n,b.id,b.to):copy(n),v=value(q);if(v>bestValue){bestValue=v;best={q,a,b};}}}let n=best.q;n.log=[];for(let a of [best.a,best.b])if(a)n.log.push('橙'+(a.id-1)+' → '+(Math.floor(a.to/5)+1)+'行'+(a.to%5+1)+'列');if(!n.log.length)n.log=['橙は岩を守った'];return n;}
function endRound(s){let n=rival(s);let gain=[scoreFor(n,0),scoreFor(n,1)];n.score=n.score.map((x,i)=>x+gain[i]);n.log.push('この潮：青 +'+gain[0]+' / 橙 +'+gain[1]);if(n.round===8)n.status=n.score[0]>n.score[1]?'won':'lost';else{n.round++;n.ap=2;}return n;}
function act(s,id,to){if(s.status!=='playing'||s.ap<=0||id>1||!legal(s,id,to))return s;let n=move(s,id,to);n.ap--;n.log=['青'+(id+1)+'を移動'];return n.ap===0?endRound(n):n;}
function pass(s){return s.status==='playing'?endRound(s):s;}
const api={create,legal,actions,act,pass,values,scoreFor,rocks};if(typeof module!=='undefined')module.exports=api;else root.TideCrabs=api;
})(typeof globalThis!=='undefined'?globalThis:this);
