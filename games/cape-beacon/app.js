import {targets,routes,required,reset,tick,position} from './engine.js';
const by=id=>document.getElementById(id);
const ns='http://www.w3.org/2000/svg';
const svg=(name,attrs)=>{const el=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
let state=reset(), timer=null, phase='ready', tide=0;
const markers=[], readings=[], vessels=[];
const labels={inbound:'接近中',needs:'合図待ち',turning:'回避中',safe:'通過',missed:'誘導失敗'};
function aim(i){if(phase!=='play')return;state.focus=i;render();}
targets.forEach(({shape,x,y},i)=>{
  const m=document.createElement('button');m.type='button';m.className='marker';m.textContent=shape;m.style.left=x/360*100+'%';m.style.top=y/242*100+'%';m.setAttribute('aria-label',shape+'の浮標を照らす');m.onclick=()=>aim(i);by('markers').append(m);markers.push(m);
  const d=document.createElement('div');const b=document.createElement('b');b.textContent=shape+' の船';const l=document.createElement('span');const p=document.createElement('progress');p.max=required;p.setAttribute('aria-label',shape+'の合図の進み具合');d.append(b,l,p);by('readouts').append(d);readings.push({d,l,p});
  const r=routes[i];by('routeLines').append(svg('path',{d:'M'+r.from+' L'+r.fork+' L'+r.rock,stroke:'#a3c5cd','stroke-opacity':'.4','stroke-dasharray':'4 5',fill:'none'}));
  const [rx,ry]=r.rock;by('routeLines').append(svg('path',{d:'M'+(rx-12)+','+(ry+7)+' l7,-12 5,3 6,-9 7,18 z',fill:'#8c6653',stroke:'#cf9871'}));
  const boat=svg('g',{}), hull=svg('path',{d:'M-11,-4 H8 L12,0 8,4 H-11 Z',fill:'#fcf1d6',stroke:'#0e2533','stroke-width':'1'});const sign=svg('text',{x:0,y:3,'font-size':10,'text-anchor':'middle',fill:'#0c2530','font-weight':'bold'});sign.textContent=shape;boat.append(hull,sign);by('boats').append(boat);vessels.push(hull);
});
function render(){
  const t=targets[state.focus];let path='';
  if(t){const x=180,y=188,dx=t.x-x,dy=t.y-y,n=Math.hypot(dx,dy),ex=x+dx/n*(n+41),ey=y+dy/n*(n+41);path='M'+x+','+y+' L'+(ex-dy/n*29)+','+(ey+dx/n*29)+' L'+(ex+dy/n*29)+','+(ey-dx/n*29)+' Z';}
  by('light').setAttribute('d',path);
  state.boats.forEach((b,i)=>{
    const r=state.routes[i], m=markers[i], {l,p,d}=readings[i];
    m.setAttribute('aria-pressed',String(state.focus===i));
    m.dataset.wait=String(b.status==='needs');
    d.dataset.state=b.status;const msg=b.status==='needs'?'合図待ち '+((r.end-state.tick)/10).toFixed(1)+'秒':labels[b.status];if(l.textContent!==msg)l.textContent=msg;
    p.value=b.status==='turning'||b.status==='safe'?required:b.lit;
    const [x,y]=position(b,r,state.tick), [nx,ny]=position(b,r,state.tick+1);
    const rotation=nx===x&&ny===y?0:Math.atan2(ny-y,nx-x)*180/Math.PI;
    vessels[i].parentNode.setAttribute('transform','translate('+x+' '+y+') rotate('+rotation+')');
    vessels[i].setAttribute('fill',b.status==='missed'?'#fe9c89':b.status==='needs'?'#ffe286':'#fcf1d6');
  });
}
function run(){timer=setInterval(()=>{tick(state);render();if(state.result!=='running'){clearInterval(timer);phase='end';const n=state.boats.filter(b=>b.status==='safe').length;by('status').textContent=n===3?'成功！ 3隻とも浅瀬を回避。':'誘導失敗。'+n+' / 3隻が通過。先に浅瀬へ近づく船を照らそう。';by('pause').disabled=true;by('start').textContent=n===3?'次の航路':'もう一度';}},100);}
by('start').onclick=()=>{clearInterval(timer);if(phase==='end'&&state.result==='win')tide=(tide+1)%3;state=reset(tide);phase='play';by('start').textContent='最初から';by('pause').textContent='一時停止';by('pause').disabled=false;by('status').textContent='浮標に1.7秒照射。PCは 1・2・3。';render();run();};
by('pause').onclick=()=>{if(phase==='play'){clearInterval(timer);phase='pause';by('pause').textContent='再開';by('status').textContent='一時停止中';}else if(phase==='pause'){phase='play';by('pause').textContent='一時停止';by('status').textContent='浮標に1.7秒照射。PCは 1・2・3。';run();}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='play')by('pause').click();});
document.addEventListener('keydown',e=>{if(!e.repeat&&/^[123]$/.test(e.key))aim(Number(e.key)-1);});
render();
