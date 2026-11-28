(() => {
  'use strict';
  const E=ForestEar,$=id=>document.getElementById(id);
  const canvas=$('radar'),g=canvas.getContext('2d'),arena=$('arena');
  const left=$('left'),right=$('right'),action=$('action'),notice=$('notice'),time=$('time');
  const controls={left:-1,right:1}, keys=new Set(), pointers=new Map();
  const dots=[];
  for(let i=0;i<12;i++){const d=document.createElement('span');d.className='dot';d.setAttribute('aria-hidden','true');$('signal').appendChild(d);dots.push(d);}
  const missions=[[93,299],[17,221],[142,341],[269,81]];
  let mission=0,s=E.start(missions[0]),last=null,holdTime=0,turnWas=0,oldMode='';
  const W=864,H=790, CX=432,CY=388,R=303;
  const colors={sky:'#081226',mint:'#78f8bb',inner:'#061020'};
  const backdrop=document.createElement('canvas');
  backdrop.width=216;backdrop.height=198;
  const bg=backdrop.getContext('2d');
  let seed=403;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const mist=bg.createLinearGradient(0,0,0,198);
  mist.addColorStop(0,'#091328');mist.addColorStop(.45,'#071120');mist.addColorStop(1,'#081527');
  bg.fillStyle=mist;bg.fillRect(0,0,216,198);
  function poly(c,pts,fill){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=fill;c.fill();}
  function tree(c,x,bottom,h,dark=false){
    const shades=dark?['#0b2948','#0a213c','#0b2038']:['#15446c','#103557','#0b2948'];
    const y=bottom-h; c.fillStyle=shades[2];c.fillRect(Math.round(x-1),Math.round(y),3,Math.round(h));
    for(let i=0;i<4;i++){
      const branch=h*(.18+i*.115),top=y+h*(.08+i*.17),leftEdge=x-branch+random()*3,rightEdge=x+branch-random()*2;
      const shape=[[x,top],[x-4,top+7],[leftEdge,top+h*.26],[x-branch*.49,top+h*.25],[leftEdge-1,top+h*.34],[x,top+h*.28],[rightEdge+1,top+h*.35],[x+branch*.52,top+h*.27],[rightEdge,top+h*.25],[x+3,top+5]];
      poly(c,shape,shades[i===0?0:1]);poly(c,[[x,top],[x,top+h*.29],[rightEdge+1,top+h*.35],[x+branch*.52,top+h*.27],[rightEdge,top+h*.25],[x+3,top+5]],shades[2]);
    }
  }
  for(let i=0;i<58;i++){const x=4+random()*208,y=4+random()*184;bg.fillStyle=i%3?'#496d96':'#79a6ca';bg.fillRect(Math.floor(x),Math.floor(y),i%8===0?2:1,1);if(i%11===0)bg.fillRect(Math.floor(x)+1,Math.floor(y)-1,1,3);}
  for(const [x,y,h] of [[12,63,59],[35,65,44],[46,63,25],[190,63,33],[183,63,48],[206,63,59],[8,186,59],[28,194,48],[54,196,31],[73,200,20],[181,197,34],[196,197,46],[209,181,55]])tree(bg,x,y,h);
  for(const [x,y,h] of [[-5,62,45],[26,69,35],[48,65,28],[166,66,24],[177,68,26],[217,68,50],[36,203,21],[58,203,21],[74,204,15],[96,206,10],[125,205,9],[151,205,24],[167,202,27],[218,203,39]])tree(bg,x,y,h,true);
  function xy(deg,r){const a=(deg-90)*Math.PI/180;return [CX+Math.cos(a)*r,CY+Math.sin(a)*r];}
  function stroke(points,c,w){g.beginPath();g.moveTo(...points[0]);for(const pt of points.slice(1))g.lineTo(...pt);g.strokeStyle=c;g.lineWidth=w;g.stroke();}
  function arc(deg0,deg1,r,c,w){g.beginPath();g.arc(CX,CY,r,(deg0-90)*Math.PI/180,(deg1-90)*Math.PI/180);g.strokeStyle=c;g.lineWidth=w;g.stroke();}
  function paint(){
    g.setTransform(1,0,0,1,0,0);
    g.imageSmoothingEnabled=false;g.drawImage(backdrop,0,0,W,H);g.imageSmoothingEnabled=true;
    const fill=g.createRadialGradient(CX,CY,1,CX,CY,R+12);
    fill.addColorStop(0,'#061020');fill.addColorStop(.9,'#061020f8');fill.addColorStop(1,'#061020b0');
    g.beginPath();g.arc(CX,CY,R+2,0,2*Math.PI);g.fillStyle=fill;g.fill();
    const hs=s.heading, a1=(hs-17-90)*Math.PI/180,a2=(hs+17-90)*Math.PI/180;
    const beam=g.createRadialGradient(CX,CY,10,CX,CY,R);
    beam.addColorStop(0,'#6af7bb99');beam.addColorStop(.6,'#63d3a696');beam.addColorStop(1,'#65c89c60');
    g.beginPath();g.moveTo(CX,CY);g.arc(CX,CY,R-4,a1,a2);g.closePath();g.fillStyle=beam;g.fill();g.strokeStyle='#83fbc4';g.lineWidth=1.4;g.stroke();
    for(let k=0;k<12;k++)arc(k*30+2.2,(k+1)*30-2.2,R,colors.mint,13);
    for(let k=0;k<60;k++){
      const d=k*6,primary=k%15===0,major=k%5===0;
      stroke([xy(d,primary?R-45:major?R-37:R-29),xy(d,primary?R+7:R-17)],colors.mint,primary?7:major?3:2);
    }
    g.fillStyle=colors.mint;g.textAlign='center';g.textBaseline='middle';g.font='800 53px system-ui,sans-serif';
    for(const [deg,key] of [[0,'N'],[90,'E'],[180,'S'],[270,'W']]){const [x,y]=xy(deg,R+45);g.fillText(key,x,y+3);}
    g.beginPath();g.arc(CX,CY,50,0,Math.PI*2);g.fillStyle='#071425';g.fill();g.strokeStyle=colors.mint;g.lineWidth=4;g.stroke();
    g.beginPath();g.roundRect(CX-11,CY-32,22,43,12);g.fillStyle=colors.mint;g.fill();
    g.beginPath();g.arc(CX,CY-1,20,0,Math.PI);g.strokeStyle=colors.mint;g.lineWidth=4;g.stroke();
    stroke([[CX-20,CY-1],[CX-20,CY-5]],colors.mint,4);
    stroke([[CX+20,CY-1],[CX+20,CY-5]],colors.mint,4);
    stroke([[CX,CY+18],[CX,CY+33]],colors.mint,4);
    stroke([[CX-11,CY+33],[CX+11,CY+33]],colors.mint,4);
    canvas.setAttribute('aria-label','方位 '+(Math.round(E.wrap(s.heading))%360)+' 度');
  }
  function text(el,value){value=String(value);if(el.textContent!==value)el.textContent=value;}
  function heading(d){return Math.round(E.wrap(d))%360+'°';}
  const rec=r=>r.timeout?'時間切れ：0点':r.points+'点（ずれ '+Math.round(r.e)+'°、鳴き声 '+heading(r.target)+'）';
  function clear(){keys.clear();pointers.clear();holdTime=0;turnWas=0;}
  function ui(){
    const mode=s.mode;
    text($('round'),(s.round+1)+' / 2');
    text(time,Math.ceil(s.time));time.parentElement.classList.toggle('urgent',mode==='observe'&&s.time<5);
    const n=Math.round(E.strength(s));$('signal').setAttribute('aria-valuenow',n);
    for(let i=0;i<dots.length;i++)dots[i].classList.toggle('on',i<n);
    const enabled=mode==='observe';
    left.disabled=!enabled;right.disabled=!enabled;
    const held=heldDirection();left.classList.toggle('held',held<0);right.classList.toggle('held',held>0);
    notice.hidden=mode==='ready'||mode==='observe';
    if(mode===oldMode)return;
    oldMode=mode;
    const title=$('notice-title'),copy=$('notice-copy'),status=$('status');
    if(mode==='ready'){text(action,'はじめる');text(status,'中央ボタンで開始。左右キーとEnterでも操作できます。');return;}
    if(mode==='observe'){text(action,'記録');text(status,'観測 '+(s.round+1)+'。マイクを左右に回し、鳴き声が強い方角を記録。');return;}
    if(mode==='paused'){text(action,'再開');text(title,'観測を一時停止');text(copy,'残り時間と向きを保存しています。');}
    if(mode==='between'){text(action,'次の観測');text(title,'1回目の記録');text(copy,rec(s.records[0]));}
    if(mode==='win'||mode==='loss'){
      text(action,'もう一度');text(title,mode==='win'?'観測成功！':'もう少し！');
      text(copy,'合計 '+s.total+' / 200点。 '+s.records.map((r,i)=>(i+1)+'回目 '+rec(r)).join('。 ')+(mode==='loss'?'。強度が最大になる方角を探そう。':'。'));
    }
    text(status,title.textContent+'。'+copy.textContent);
  }
  function update(){paint();ui();}
  function invoke(){
    clear();last=null;
    if(s.mode==='win'||s.mode==='loss'){mission=(mission+1)%missions.length;s=E.start(missions[mission]);}
    else{s=E.activate(s);}
    update();
  }
  action.addEventListener('click',invoke);
  function heldDirection(){
    const all=[...keys,...pointers.values()];
    return Number(all.includes(1))-Number(all.includes(-1));
  }
  for(const [key,el] of [['left',left],['right',right]]){
    const dir=controls[key];
    el.addEventListener('pointerdown',e=>{
      if(s.mode!=='observe'||(e.pointerType==='mouse'&&e.button!==0))return;
      e.preventDefault();pointers.set(e.pointerId,dir);s=E.aim(s,dir*3);turnWas=dir;holdTime=0;
      try{el.setPointerCapture(e.pointerId);}catch(_){}
      update();
    });
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,e=>pointers.delete(e.pointerId));
    el.addEventListener('click',e=>{if(e.detail===0&&s.mode==='observe'){s=E.aim(s,dir*3);update();}});
  }
  const dirs={ArrowLeft:-1,ArrowRight:1};
  document.addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey||e.isComposing)return;
    if(e.code==='Enter'){e.preventDefault();if(!e.repeat)invoke();return;}
    if(e.code==='Escape'&&s.mode==='observe'){e.preventDefault();pause();return;}
    const dir=dirs[e.code];if(!dir||s.mode!=='observe')return;
    e.preventDefault();
    if(!keys.has(dir)){keys.add(dir);s=E.aim(s,dir*3);turnWas=dir;holdTime=0;update();}
  });
  document.addEventListener('keyup',e=>{if(dirs[e.code])keys.delete(dirs[e.code]);});
  function pause(){clear();last=null;s=E.pause(s);update();}
  window.addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  function frame(now){
    if(s.mode==='observe'){
      const dt=last===null?0:Math.max(0,(now-last)/1000);
      last=now;
      const dir=heldDirection(),moveDt=Math.min(.08,dt);
      if(dir!==turnWas){turnWas=dir;holdTime=0;}
      if(dir){holdTime+=moveDt;if(holdTime>.18)s=E.aim(s,dir*95*moveDt);}
      const mode=s.mode;s=E.elapse(s,dt);
      if(s.mode!==mode){clear();last=null;}
      update();
    }else last=null;
    requestAnimationFrame(frame);
  }
  update();requestAnimationFrame(frame);
})();
