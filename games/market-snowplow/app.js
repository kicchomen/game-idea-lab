(() => {
  'use strict';
  const G=window.Snowplow, $=id=>document.getElementById(id);
  const canvas=$('board'), ctx=canvas.getContext('2d'), C=60, keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
  const buttons=[...document.querySelectorAll('[data-dir]')];
  let state=G.start(), held=null, frameLast=performance.now(), phaseLast, boardLast;
  function setText(node,text){if(node.textContent!==text)node.textContent=text;}
  function draw(){
    for(let i=0;i<G.cells.length;i++){
      const x=i%G.W*C,y=Math.floor(i/G.W)*C,c=G.cells[i],d=state.snow[i];
      ctx.fillStyle=(i+Math.floor(i/G.W))%2?'#315e68':'#2b535e'; ctx.fillRect(x+1,y+1,C-2,C-2);
      if(c==='#'){
        ctx.fillStyle='#74513d';ctx.fillRect(x+4,y+9,52,44);
        ctx.fillStyle='#d29a62';ctx.fillRect(x+7,y+8,46,31);
        ctx.fillStyle='#f9d3a2'; for(let v=0;v<4;v++)ctx.fillRect(x+9+v*12,y+8,5,31);
        ctx.fillStyle='#93522a';ctx.fillRect(x+12,y+44,36,5);
        ctx.fillStyle='#ffd78a';ctx.beginPath();ctx.arc(x+49,y+47,4,0,Math.PI*2);ctx.fill();
      }else if(c==='g'){
        ctx.fillStyle='#132d40';ctx.fillRect(x+10,y+10,40,40);
        ctx.strokeStyle='#83dcec';ctx.lineWidth=3;ctx.strokeRect(x+10,y+10,40,40);
        ctx.fillStyle='#83dcec'; for(let v=0;v<5;v++)ctx.fillRect(x+17,y+17+6*v,26,3);
      }else if(d){
        ctx.fillStyle=d===2?'#c2e7f7':'#e5f6ff';
        ctx.beginPath();ctx.roundRect(x+5,y+5,50,50,10);ctx.fill();
        ctx.fillStyle='#426a83';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.fillText(d===2?'◆':'●',x+30,y+36);
      }
    }
    const x=state.at%G.W*C+30,y=Math.floor(state.at/G.W)*C+30;
    ctx.save();ctx.translate(x,y);
    ctx.rotate(({up:0,right:1,down:2,left:3})[state.facing]*Math.PI/2);
    ctx.fillStyle='#082737';for(const a of [-17,10])ctx.fillRect(a,-11,7,27);
    ctx.fillStyle='#dc873c'; ctx.fillRect(-12,-17,24,34);
    ctx.fillStyle='#ffcf80';ctx.fillRect(-11,-13,22,15);
    ctx.fillStyle='#25545c';ctx.fillRect(-8,-9,16,6);
    ctx.fillStyle='#ffde9f';ctx.fillRect(-21,-24,42,8);
    ctx.fillStyle='#1c3e44';ctx.fillRect(-9,4,18,13);
    ctx.fillStyle='#e2f6fd'; for(let a=0;a<state.cargo;a++)ctx.fillRect(-7+(a%2)*8,5+Math.floor(a/2)*6,5,5);
    ctx.restore();
  }
  const label={
    ready:['開店前の38秒','雪を積んで、捨てる。','矢印で走ると雪が荷台に。青い排雪口で「排雪」。全部拾い、最後の荷台も空にしよう。','スタート'],
    paused:['ひと休み','一時停止中','再開するまで、開店までの時間は減らない。','再開'],
    won:['朝市オープン','準備完了！','','もう一度'],
    lost:['開店時間','時間切れ','','再挑戦'],
  };
  function render(){
    const remaining=Math.ceil(G.limit-state.elapsed);
    const time=$('time'); if(time.dataset.value!==String(remaining)){time.dataset.value=remaining;time.firstChild.textContent=remaining;}
    setText($('remaining'),String(state.remaining)+' / '+G.snowCells);
    setText($('cargo'),String(state.cargo)+' / '+G.maxCargo);
    $('pause').disabled=state.phase!=='running';
    $('dump').disabled=state.phase!=='running';
    buttons.forEach(b=>{b.disabled=state.phase!=='running';b.classList.toggle('held',held?.dir===b.dataset.dir);});
    const status=$('feedback'), message=state.feedback||'PC：矢印 / WASD、排雪：E';
    if(status.textContent!==message) status.textContent=message;
    if(boardLast!==[state.at,state.facing,state.snow.join(''),state.cargo].join(':')){
      boardLast=[state.at,state.facing,state.snow.join(''),state.cargo].join(':');draw();
    }
    if(state.phase===phaseLast)return;
    const previously=phaseLast; phaseLast=state.phase;
    const box=$('overlay');box.hidden=state.phase==='running';
    if(box.hidden){if(document.activeElement===$('primary')||document.activeElement===$('secondary')) canvas.focus({preventScroll:true});return;}
    const [eyebrow,title,body,primary]=label[state.phase];
    $('label').textContent=eyebrow;$('heading').textContent=title;
    $('description').textContent=body|| (state.phase==='won' ? `${state.moves}歩・排雪${state.dumps}回・残り${remaining}秒` : `雪があと${state.remaining}か所、荷台に${state.cargo}枠。排雪口に近い道から試そう。`);
    $('primary').textContent=primary;$('secondary').hidden=state.phase!=='paused';
    if(previously)$('primary').focus({preventScroll:true});
  }
  const sync=(t)=>{if(t>frameLast){state=G.advance(state,(t-frameLast)/1000);frameLast=t;}};
  function stop(){held=null;}
  function press(dir,source){
    sync(performance.now());
    if(state.phase!=='running'){render();return;}
    held={dir,source,next:performance.now()+G.repeatMs};
    state=G.move(state,dir);render();
  }
  function pause(){
    sync(performance.now());stop();
    if(state.phase==='running')state=G.togglePause(state);
    render();
  }
  function dump(){sync(performance.now());state=G.dump(state);if(state.phase!=='running')stop();render();}
  function beginOrRetry(){
    sync(performance.now());stop();
    state=state.phase==='paused'?G.togglePause(state):G.begin(G.start());render();
  }
  $('primary').addEventListener('click',beginOrRetry);
  $('secondary').addEventListener('click',()=>{stop();state=G.start();render();});
  $('pause').addEventListener('click',pause);$('dump').addEventListener('click',dump);
  buttons.forEach(b=>{
    b.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;e.preventDefault();b.setPointerCapture(e.pointerId);press(b.dataset.dir,'p'+e.pointerId);});
    const release=e=>{if(held?.source==='p'+e.pointerId){stop();render();}};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(name,release);
    b.addEventListener('click',e=>{if(e.detail===0){press(b.dataset.dir,'click');stop();render();}});
  });
  addEventListener('keydown',e=>{
    if(e.altKey||e.ctrlKey||e.metaKey)return;
    const key=e.key.length===1?e.key.toLowerCase():e.key, dir=Object.hasOwn(keys,key)?keys[key]:null;
    if(dir){if(state.phase==='running'){e.preventDefault();if(!e.repeat)press(dir,'k'+key);}return;}
    if(key==='Escape'||key==='p'){
      if(state.phase==='running'){e.preventDefault();pause();}
      else if(state.phase==='paused'&&!e.repeat){e.preventDefault();beginOrRetry();}
    }
    if(key==='e'&&state.phase==='running'){e.preventDefault();if(!e.repeat)dump();return;}
    if(key===' '&&state.phase==='running'&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)dump();}
  });
  addEventListener('keyup',e=>{if(held?.source==='k'+e.key.toLowerCase()||held?.source==='k'+e.key){stop();render();}});
  addEventListener('blur',pause);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  function frame(t){
    const running=state.phase==='running';sync(t);
    if(state.phase==='running'&&held&&t>=held.next){state=G.move(state,held.dir);held.next=t+G.repeatMs;}
    if(state.phase!=='running')stop();
    if(running||state.phase!==phaseLast)render();
    requestAnimationFrame(frame);
  }
  render();requestAnimationFrame(frame);
})();
