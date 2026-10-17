(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RailDispatch=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DT=1/60, CROSS=3, TRAVEL=5, LIMIT=48;
const DESTINATIONS=[{name:'港',symbol:'⚓',color:'#52d3e8'},{name:'町',symbol:'⌂',color:'#ffc565'},{name:'山',symbol:'△',color:'#8cdea5'}];
const SCHEDULE=Array.from({length:12},(_,i)=>({id:i+1,lane:i%3,arrival:Math.floor(i/3)*11+i%3,dest:(i+Math.floor(i/3))%3,deadline:Math.floor(i/3)*11+i%3+12}));
const TRACK_Y=[62,160,258];
function position(t,now){
const a=TRACK_Y[t.lane],b=TRACK_Y[t.dest],elapsed=Math.max(0,Math.min(TRAVEL,now-t.depart));
const points=[[0,144,a],[.75,200,a],[2.3,300,160],[3,340,160+(b-160)*.4],[3.8,400,b],[5,510,b]];
for(let i=1;i<points.length;i++){const next=points[i],prev=points[i-1];if(elapsed<=next[0]){const f=(elapsed-prev[0])/(next[0]-prev[0]);return {x:prev[1]+(next[1]-prev[1])*f,y:prev[2]+(next[2]-prev[2])*f};}}
return {x:510,y:b};
}
function create(){return {status:'ready',t:0,tick:0,route:0,trains:[],delivered:0,message:'行先を選び、交差点が空いたら発車。',reason:'',events:[]};}
function spawn(s){for(const spec of SCHEDULE)if(spec.arrival<=s.t+1e-8&&!s.trains.some(t=>t.id===spec.id))s.trains.push({...spec,phase:'waiting',depart:null});}
function start(s){if(s.status!=='ready')return false;s.status='playing';spawn(s);return true;}
function select(s,d){if(s.status!=='playing'||!Number.isInteger(d)||d<0||d>2)return false;s.route=d;return true;}
function occupied(s){return s.trains.find(t=>t.phase==='moving'&&s.t-t.depart<CROSS-1e-8);}
function waiting(s,lane){return s.trains.find(t=>t.lane===lane&&t.phase==='waiting');}
function fail(s,reason,message){s.status='lost';s.reason=reason;s.message=message;}
function dispatch(s,lane){if(s.status!=='playing'||!Number.isInteger(lane)||lane<0||lane>2)return false;const t=waiting(s,lane);if(!t)return false;if(occupied(s)){fail(s,'conflict','交差点に列車がいるため安全停止。空きを待って発車しよう。');return false;}if(s.route!==t.dest){fail(s,'wrong-route',`行先が違うため安全停止。${t.id}号は「${DESTINATIONS[t.dest].name}」行き。`);return false;}t.phase='moving';t.depart=s.t;s.events.push({at:s.t,id:t.id,route:s.route});s.message=`${t.id}号、${DESTINATIONS[t.dest].name}へ出発！`;return true;}
function step(s){if(s.status!=='playing')return;s.tick++;s.t=s.tick*DT;spawn(s);for(const t of s.trains){if(t.phase==='moving'&&s.t-t.depart>=TRAVEL-1e-8){t.phase='arrived';s.delivered++;s.message=`${t.id}号が到着。${s.delivered}/12便`;}}
if(s.delivered===12){s.status='won';s.message='全12便、定刻到着！ おつかれさまでした。';return;}
const late=s.trains.find(t=>t.phase!=='arrived'&&s.t>=t.deadline-1e-8);if(late)fail(s,'late',`${late.id}号が到着期限切れ。到着まで5秒かかるので、早めに発車しよう。`);else if(s.t>=LIMIT)fail(s,'timeout','勤務時間が終了しました。');}
function pause(s){if(s.status==='playing'){s.status='paused';return true;}return false;}
function resume(s){if(s.status==='paused'){s.status='playing';return true;}return false;}
return {DT,CROSS,TRAVEL,LIMIT,TRACK_Y,position,DESTINATIONS,SCHEDULE,create,start,select,dispatch,step,occupied,waiting,pause,resume};
});
