export const targets = [
  {shape:'△', x:87, y:131},
  {shape:'○', x:177, y:77},
  {shape:'◇', x:268, y:136},
];
export const routes = [
  {target:0, enter:32, end:86, from:[-15,187], fork:[71,158], exit:[86,16], rock:[102,161]},
  {target:1, enter:59, end:113, from:[116,-12], fork:[163,63], exit:[319,35], rock:[191,56]},
  {target:2, enter:78, end:132, from:[375,187], fork:[292,162], exit:[265,17], rock:[258,165]},
];
export const required = 17; // 1.7 seconds with exclusive beam control
const tides=[[32,59,78],[79,32,57],[57,79,32]];
export function reset(tide=0){
  const starts=tides[tide%tides.length];
  return {tick:0, focus:null, result:'running', routes:routes.map((r,i)=>({...r,enter:starts[i],end:starts[i]+43})), boats:routes.map(()=>({lit:0, turned:null, status:'inbound'}))};
}
export function tick(s) {
  if(s.result!=='running') return;
  s.tick++;
  s.boats.forEach((b,i)=>{
    const r=s.routes[i];
    if(b.status==='safe'||b.status==='missed') return;
    if(b.status==='turning'){
      if(s.tick>=b.turned+30) b.status='safe';
      return;
    }
    if(s.tick>=r.enter&&s.tick<r.end){
      b.status='needs';
      if(s.focus===r.target) b.lit++;
      else b.lit=0;
      if(b.lit>=required){b.status='turning';b.turned=s.tick;}
    }else if(s.tick>=r.end){b.status='missed';b.lit=0;}
  });
  if(s.boats.every(b=>b.status==='safe'||b.status==='missed')) s.result=s.boats.every(b=>b.status==='safe')?'win':'loss';
}
export function position(b,r,t){
  const lerp=(a,z,p)=>a.map((n,i)=>n+(z[i]-n)*Math.max(0,Math.min(1,p)));
  if(b.status==='missed') return r.rock;
  if(b.status==='safe') return r.exit;
  if(b.turned!==null){
    const start=position({turned:null,status:'needs'},r,b.turned);
    const p=(t-b.turned)/30, m=[targets[r.target].x,targets[r.target].y];
    return p<.38?lerp(start,m,p/.38):lerp(m,r.exit,(p-.38)/.62);
  }
  return t<r.enter?lerp(r.from,r.fork,t/r.enter):lerp(r.fork,r.rock,(t-r.enter)/(r.end-r.enter));
}
