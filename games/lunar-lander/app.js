(function(){
  'use strict';
  const {C,fresh,step}=LunarLander, by=id=>document.getElementById(id);
  const cvs=by('scene'), ctx=cvs.getContext('2d');
  if(!ctx){by('message').textContent='このブラウザでは試遊画面を表示できません。';by('action').hidden=true;return;}
  const buttons=[...document.querySelectorAll('[data-hold]')], keys=new Set(), pointers=new Map();
  const action=by('action'),pauseBtn=by('pause'),panel=by('panel'),mission=by('mission');
  const keyMap={ArrowLeft:'left',ArrowRight:'right',Space:'thrust'};
  const reasons={pad:'緑の台に届かなければ、早めの噴射で滞空時間を伸ばそう。',speed:'速度が高すぎました。早めに噴射して減速しよう。',angle:'機体が傾いたままでした。接地前に傾きボタンを離そう。',boundary:'着陸区域の外へ流されました。',time:'着陸時間を超えました。'};
  let s=fresh(), mode='ready',last=null,bucket=0;
  function inputs(){const a={}; for(const k of keys)a[k]=true;for(const k of pointers.values())a[k]=true;return a;}
  function clear(){keys.clear();pointers.clear();}
  function menu(m){
    mode=m;mission.dataset.mode=m;clear();last=null;bucket=0;panel.hidden=m==='flight';
    pauseBtn.disabled=m==='ready'||m==='win'||m==='loss';
    pauseBtn.textContent=m==='paused'?'再開':'一時停止';
    pauseBtn.setAttribute('aria-label',pauseBtn.textContent);
    buttons.forEach(b=>{b.disabled=m!=='flight';b.classList.remove('is-on');});
    if(m==='paused'){by('headline').textContent='一時停止';by('message').textContent='位置と燃料を保持しています。';action.textContent='飛行を再開';}
    if(m==='win'){by('headline').textContent='着陸成功！';by('message').textContent='緑の台に、ゆっくり水平に降りられました。';action.textContent='もう一度';}
    if(m==='loss'){by('headline').textContent='着陸失敗';by('message').textContent=reasons[s.reason];action.textContent='再挑戦';}
    if(m!=='ready'&&m!=='flight'){by('state').textContent=by('headline').textContent+'。'+by('message').textContent;action.focus({preventScroll:true});}
  }
  function go(){if(mode!=='paused')s=fresh();menu('flight');pauseBtn.focus({preventScroll:true});by('state').textContent='飛行中。';}
  action.addEventListener('click',go);
  pauseBtn.addEventListener('click',()=>mode==='flight'?menu('paused'):mode==='paused'&&go());
  document.addEventListener('keydown',e=>{
    if((e.code==='Escape'||e.code==='KeyP')&&mode==='flight'&&!e.repeat){e.preventDefault();menu('paused');return;}
    if(mode!=='flight'||!keyMap[e.code]||e.ctrlKey||e.altKey||e.metaKey)return;
    e.preventDefault();keys.add(keyMap[e.code]);
  });
  document.addEventListener('keyup',e=>{if(keyMap[e.code])keys.delete(keyMap[e.code]);});
  for(const b of buttons){
    b.addEventListener('pointerdown',e=>{
      if(mode!=='flight'||(e.pointerType==='mouse'&&e.button!==0))return;
      e.preventDefault();pointers.set(e.pointerId,b.dataset.hold);
      try{b.setPointerCapture(e.pointerId);}catch(_){}
    });
    for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>pointers.delete(e.pointerId));
  }
  window.addEventListener('blur',()=>{if(mode==='flight')menu('paused')});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='flight')menu('paused')});
  function set(id,val,warn=false){const n=by(id);if(n.textContent!==val)n.textContent=val;n.classList.toggle('warn',warn);}
  function facet(g,points,color){
    g.beginPath();g.moveTo(...points[0]);for (const pt of points.slice(1)) g.lineTo(...pt);
    g.closePath();g.fillStyle=color;g.fill();
  }
  const atlas=document.createElement('canvas');atlas.width=cvs.width;atlas.height=cvs.height;
  const art=atlas.getContext('2d');art.scale(3,3);
  let artSeed=14003845;
  function random(){artSeed=(Math.imul(artSeed,1664525)+1013904223)>>>0;return artSeed/4294967296;}
  function drawBackdrop(g){
    const sky=g.createLinearGradient(0,0,0,152);
    sky.addColorStop(0,'#0b1423');sky.addColorStop(.72,'#111d30');sky.addColorStop(1,'#1b2638');
    g.fillStyle=sky;g.fillRect(0,0,260,152);
    for(let i=0;i<32;i++){
      const x=4+random()*252,y=5+random()*109,r=i%7===0?.59:.29;
      g.fillStyle=i%2===0?'#e0e9fa':'#9dacc3b0';
      g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
    }
    const far=[],faceline=[],near=[];
    const ridgeShape=[[-12,113],[9,113],[25,110],[40,108],[52,112],[71,116],[91,118],[111,115],[127,112],[147,117],[176,120],[208,120],[224,117],[243,110],[255,112],[271,110]];
    let j=0;
    for(let x=-8;x<=275;){
      while(x>ridgeShape[j+1][0]&&j<ridgeShape.length-2)j++;
      const [x0,y0]=ridgeShape[j], [x1,y1]=ridgeShape[j+1];
      const peak=y0+(y1-y0)*(x-x0)/(x1-x0);
      far.push([x,peak+(random()-.5)*4]);
      faceline.push([x+(random()-.5)*12,peak+7+random()*8]);
      near.push([x+(random()-.5)*17,136+random()*5]);
      x+=4+random()*10;
    }
    far.push([280,112]);faceline.push([280,125]);near.push([280,138]);
    facet(g,[...far,[280,153],[-8,153]],'#252d3a');
    const topRock=['#303641','#39404c','#424853','#48505e','#535966','#656775'];
    const shadowRock=['#28303a','#2c3440','#313943','#3a424f','#424956'];
    for(let i=1;i<far.length;i++){
      const a=far[i-1],b=far[i],c=faceline[i],d=faceline[i-1];
      const ridge=[b[0]+(a[0]-b[0])*(.2+random()*.6),b[1]+(2+random()*3)];
      facet(g,[a,b,ridge],topRock[4+(random()<.22?1:0)]);
      facet(g,[a,ridge,d],topRock[Math.floor(random()*topRock.length)]);
      facet(g,[ridge,b,c],topRock[Math.floor(random()*5)]);
      facet(g,[ridge,c,d],shadowRock[Math.floor(random()*shadowRock.length)]);
      facet(g,[d,c,near[i]],shadowRock[1+Math.floor(random()*4)]);
      facet(g,[d,near[i],near[i-1]],shadowRock[Math.floor(random()*4)]);
    }
    const lunar=['#9e9689','#aaa093','#827b71','#8e8577','#b4aa99','#92887d','#80786b','#aaa294','#a39889'];
    let row0=[];
    for(let i=0;i<=31;i++)row0.push([-11+i*9.2,131.6+random()*3.4]);
    facet(g,[...row0,[280,160],[-12,160]],'#a29a8c');
    for(let k=1;k<=10;k++){
      let row1=[];
      let spread=2.1+k*.44,base=130+k*2.39;
      for(let i=0;i<=31;i++)row1.push([-11+i*9.2+(i>0&&i<31?(random()-.5)*(13+k*.8):0),base+random()*spread]);
      for(let i=1;i<31;i++){
        facet(g,[row0[i-1],row0[i],row1[i-1]],lunar[Math.floor(random()*lunar.length)]);
        facet(g,[row0[i],row1[i-1],row1[i]],lunar[Math.floor(random()*lunar.length)]);
      }
      row0=row1;
    }
    const grit=['#554e48','#827a6d','#c4baab','#cfc4b5','#a59b8f'];
    for(let i=0;i<242;i++){
      const x=random()*260,y=132+random()*19,r=.08+random()*.48;
      if(x>C.pad0-2&&x<C.pad1+2&&y<C.ground+1)continue;
      g.fillStyle=grit[Math.floor(random()*grit.length)];g.fillRect(x,y,r*1.9,r*.48+.1);
    }
    function boulder(x,y,r){
      const top=[x+r*(.06+random()*.38),y-r*(.35+random()*.21)],left=[x-r,y],right=[x+r*1.2,y+r*.13],c=[x+r*.11,y+r*.21];
      const skirt=[x-r*.45,y+r*.3],s=[x+r*1.35,y+r*.22];
      facet(g,[left,right,s,skirt],'#24262679');
      facet(g,[left,top,c,skirt],'#8f8a80');
      facet(g,[top,right,c],'#524e4c');
      facet(g,[top,[x-r*.45,y-r*.11],left],'#a7a095');
      facet(g,[left,c,skirt],'#76736a');
    }
    for(let i=0;i<54;i++){
      const x=random()*260,y=135+random()*19,r=.32+random()*2.75;
      if(x>C.pad0-8&&x<C.pad1+8&&y<C.ground+3)continue;
      boulder(x,y,r);
    }
    boulder(27,149,7.5);boulder(63,151.6,11.7);boulder(167,153,12.5);boulder(246,151.3,7.9);
  }
  drawBackdrop(art);
  function craft(g,burning,t){
    // Same true physical leg span as before; faceted body and landing legs from the UI reference.
    if(burning){
      const cone=g.createLinearGradient(0,4,0,16);
      cone.addColorStop(0,'#fff6c7');cone.addColorStop(.42,'#ffb846');cone.addColorStop(1,'#ff861522');
      facet(g,[[-3.4,4],[3.4,4],[0,14+(t*53%3)]],cone);
    }
    g.strokeStyle='#fbd478';g.lineWidth=.69;g.beginPath();
    g.moveTo(-3.8,2.4);g.lineTo(-8.3,7.7);g.lineTo(-9,7.7);g.lineTo(-6.9,7.7);
    g.moveTo(3.8,2.4);g.lineTo(8.3,7.7);g.lineTo(9,7.7);g.lineTo(6.9,7.7);
    g.moveTo(-5,-5.3);g.lineTo(-7.1,-8.1);g.stroke();
    facet(g,[[-6,-2.8],[-3.9,-6.2],[3.5,-6.2],[6.1,-3],[5.8,2.3],[3.7,4.3],[-4.1,4.3],[-5.7,1.2]],'#dbb466');
    facet(g,[[-6,-2.8],[-3.9,-6.2],[0,-6.2],[-.7,-2.7],[-.8,3.4],[-5.7,1.2]],'#e5dcbb');
    facet(g,[[0,-6.2],[3.5,-6.2],[6.1,-3],[3.1,-3],[-.7,-2.7]],'#faf2d5');
    facet(g,[[3.1,-3],[6.1,-3],[5.8,2.3],[3.7,4.3],[2.2,.5]],'#9c7537');
    facet(g,[[-.8,3.4],[2.2,.5],[3.7,4.3],[-4.1,4.3]],'#c78938');
    facet(g,[[-3.4,-4.6],[3.2,-4.6],[3.0,-1.6],[-2.8,-1.6]],'#40536a');
    facet(g,[[-2.95,-4.25],[.46,-4.3],[-.4,-2.1],[-2.8,-2]],'#8197ae');
  }
  function draw(){
    const a=inputs(),g=ctx;g.setTransform(1,0,0,1,0,0);g.drawImage(atlas,0,0);g.setTransform(3,0,0,3,0,0);
    const target=(C.pad0+C.pad1)/2;
    g.strokeStyle='#8ff9b8';g.lineWidth=.8;g.setLineDash([.95,2.8]);g.beginPath();
    g.moveTo(target,2);g.lineTo(target,C.ground-2);g.stroke();g.setLineDash([]);
    // Exact pad bounds, logically unchanged; glow is not a valid wider landing surface.
    const padGlow=g.createRadialGradient(target,C.ground,4,target,C.ground,38);
    padGlow.addColorStop(0,'#63ee896c');padGlow.addColorStop(1,'#63ee8900');
    g.fillStyle=padGlow;g.fillRect(C.pad0-12,C.ground-3,C.pad1-C.pad0+24,10);
    const land=[[C.pad0,C.ground],[C.pad0+2.8,C.ground-2.5],[C.pad1-2.8,C.ground-2.5],[C.pad1,C.ground]];
    facet(g,land,'#164735');g.strokeStyle='#83f9a7';g.lineWidth=.63;g.stroke();
    g.save();g.translate(s.x,s.y);g.rotate(s.angle);
    craft(g,s.burn&&mode==='flight',s.t);
    g.restore();
    set('fuel',Math.ceil(s.fuel/6*100)+'%',s.fuel<1.3);
    set('down',s.vy<-1?'↑'+Math.round(-s.vy):String(Math.max(0,Math.round(s.vy))),s.vy>C.maxDown);
    set('side',(s.vx<-1?'←':s.vx>1?'→':'')+Math.round(Math.abs(s.vx)),Math.abs(s.vx)>C.maxSide);
    buttons.forEach(b=>b.classList.toggle('is-on',mode==='flight'&&Boolean(a[b.dataset.hold])));
  }
  function frame(now){
    if(mode==='flight'){
      if(last!==null)bucket+=Math.min(.05,(now-last)/1000);last=now;
      const a=inputs();while(bucket>=C.dt&&s.status==='flight'){s=step(s,a);bucket-=C.dt;}
      if(s.status!=='flight')menu(s.status);
    }
    draw();requestAnimationFrame(frame);
  }
  menu('ready');draw();requestAnimationFrame(frame);
})();
