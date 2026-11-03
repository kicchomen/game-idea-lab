(function(root){'use strict';
const ports=['灯台港','市場港','丘の港'];
const timetable=[
[0,0,1,3],[0,0,2,5],[1,1,0,5],[2,1,2,5],
[3,2,0,8],[4,2,1,7],[5,0,1,9],[6,1,2,10],
[7,0,2,12],[8,2,0,13],[9,1,0,13],[10,0,1,14]];
const people=timetable.map((p,i)=>({id:i,release:p[0],from:p[1],to:p[2],deadline:p[3],name:String.fromCharCode(65+i)}));
function initial(){return {time:0,port:0,fuel:8,status:'playing',passengers:people.map(p=>({...p,state:'waiting'})),log:['定員2人。乗せる人を選んで出港しよう。']};}
function distance(a,b){return Math.abs(a-b);}
function waiting(s){return s.passengers.filter(p=>p.state==='waiting'&&p.from===s.port&&p.release<=s.time);}
function aboard(s){return s.passengers.filter(p=>p.state==='aboard');}
function score(s){return s.passengers.filter(p=>p.state==='delivered').length;}
function advance(s,n){s.time+=n;for(const p of s.passengers){if(p.state==='aboard'&&p.to===s.port&&s.time<=p.deadline){p.state='delivered';s.log.push(`${p.name}さんを${ports[s.port]}へ届けた。`);}else if(['waiting','aboard'].includes(p.state)&&s.time>=p.deadline){p.state='missed';s.log.push(`${p.name}さんの締切に間に合わなかった。`);}}if(s.time>=14){s.status=score(s)>=9?'won':'lost';s.log.push(`営業終了：${score(s)}/12人。目標9人。`);}s.log=s.log.slice(-6);}
function act(state,a){const s=JSON.parse(JSON.stringify(state));if(s.status!=='playing')return s;
if(a.type==='wait'){s.log.push('1刻待った。');advance(s,1);return s;}
if(a.type==='refuel'){if(s.port!==0||s.fuel===8)return s;s.fuel=Math.min(8,s.fuel+4);s.log.push('灯台港で給油 +4（1刻）。');advance(s,1);return s;}
if(a.type!=='sail'||!Number.isInteger(a.to)||a.to<0||a.to>2||a.to===s.port)return s;
const d=distance(s.port,a.to),ids=a.ids||[];if(d>s.fuel||s.time+d>14||!Array.isArray(ids)||new Set(ids).size!==ids.length||aboard(s).length+ids.length>2)return s;
if(ids.some(id=>!waiting(s).some(p=>p.id===id)))return s;
for(const id of ids)s.passengers[id].state='aboard';s.fuel-=d;s.port=a.to;s.log.push(`${ports[a.to]}へ航行（${d}刻 / 燃料${d}）。`);advance(s,d);return s;}
const api={ports,people,initial,distance,waiting,aboard,score,act};if(typeof module!=='undefined')module.exports=api;else root.DuskFerry=api;
})(typeof window!=='undefined'?window:globalThis);
