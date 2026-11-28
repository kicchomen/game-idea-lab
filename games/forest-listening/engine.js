(function (root) {
  'use strict';
  const LIMIT=20, MIN_ROUND=70, MIN_TOTAL=154;
  const wrap=a=>((a%360)+360)%360;
  const error=(a,b)=>Math.abs(wrap(a-b+180)-180);
  const norm=(a,f)=>Number.isFinite(a)?wrap(a):f;
  const start=(bearings=[93,299])=>({targets:[norm(bearings[0],93),norm(bearings[1],299)],round:0,heading:59,time:LIMIT,mode:'ready',records:[]});
  const strength=(state)=>{
    if(state.mode!=='ready'&&state.mode!=='observe')return 0;
    const e=error(state.heading,state.targets[state.round]);
    return 12*Math.max(0,1-e/95)**1.1;
  };
  function commit(state,timeout=false){
    if(state.mode!=='observe')return state;
    const e=error(state.heading,state.targets[state.round]);
    const record={points:timeout?0:Math.max(0,Math.round(100-e*1.75)),e:timeout?null:e,heading:timeout?null:state.heading,target:state.targets[state.round],timeout};
    const records=[...state.records,record];
    const total=records.reduce((sum,r)=>sum+r.points,0);
    const mode=records.length===1?'between':total>=MIN_TOTAL&&records.every(r=>r.points>=MIN_ROUND)?'win':'loss';
    return {...state,records,total,mode,time:timeout?0:state.time};
  }
  function activate(state){
    if(state.mode==='ready'||state.mode==='paused')return {...state,mode:'observe'};
    if(state.mode==='between')return {...state,round:1,time:LIMIT,mode:'observe'};
    if(state.mode==='observe')return commit(state);
    return state;
  }
  function aim(state,degrees){
    if(state.mode!=='observe'||!Number.isFinite(degrees))return state;
    return {...state,heading:wrap(state.heading+degrees)};
  }
  function elapse(state,seconds){
    if((state.mode!=='observe')||!Number.isFinite(seconds)||seconds<=0)return state;
    const time=Math.max(0,state.time-seconds);
    return time===0?commit({...state,time},true):{...state,time};
  }
  const pause=s=>s.mode==='observe'?{...s,mode:'paused'}:s;
  const api={LIMIT,MIN_ROUND,MIN_TOTAL,wrap,error,start,strength,commit,activate,aim,elapse,pause};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.ForestEar=api;
})(globalThis);
