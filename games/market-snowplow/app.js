(() => {
  'use strict';
  const G=window.Snowplow, $=id=>document.getElementById(id);
  const canvas=$('board'), ctx=canvas.getContext('2d'), C=60, keys={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'};
  const buttons=[...document.querySelectorAll('[data-dir]')];
  let state=G.start(), held=null, frameLast=performance.now(), phaseLast, boardLast;
  function setText(node,text){if(node.textContent!==text)node.textContent=text;}
  function draw(){
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const dot=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
    const pill=(x,y,w,h,r,color)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=color;ctx.fill();};
    for(let i=0;i<G.cells.length;i++){
      const x=i%G.W*C,y=Math.floor(i/G.W)*C,c=G.cells[i],d=state.snow[i];
      rect(x,y,C,C,'#30536e');
      const light=Boolean(d)||c==='#';
      rect(x+1,y+1,C-2,C-2,light?'#a8d5ed':i%2?'#668fb2':'#6f98ba');
      for(let v=0;v<13;v++){
        const sx=x+3+(i*17+v*37)%54,sy=y+3+(i*29+v*23)%54;
        dot(sx,sy,v%3===0?1.3:.7,light?'#d7f0fb':'#a2bfd5');
      }
      if(c==='#'){
        pill(x+5,y+11,50,45,4,'#1c293b');
        rect(x+8,y+29,44,25,'#68483b');
        rect(x+12,y+32,36,13,'#bb463b');
        for(let n=0;n<5;n++)rect(x+12+n*8,y+32,1,17,'#502f2e');
        pill(x+3,y+8,54,25,4,'#283850');
        for(let n=0;n<7;n++)rect(x+7+n*7,y+12,3,18,n%2?'#5b687b':'#6b778a');
        for(let n=0;n<7;n++)dot(x+8+n*7,y+9+(n*7)%5,5,n%2?'#d7eaf9':'#f3faff');
        dot(x+48,y+39,7,'#7c4529');dot(x+48,y+39,5.5,'#ffb94f');dot(x+47,y+38,3.5,'#fff1af');
      }else if(c==='g'){
        pill(x+7,y+7,46,46,5,'#233b4e');pill(x+9,y+8,42,42,4,'#879ba7');
        pill(x+15,y+15,30,30,3,'#244c64');
        for(let n=0;n<4;n++)rect(x+19,y+20+n*6,22,2,'#7cd8ec');
        for(const [sx,sy] of [[13,12],[47,12],[13,47],[47,47]])dot(x+sx,y+sy,4,'#eaf7fc');
      }else if(d){
        for(let n=0;n<(d===2?7:5);n++){
          const bx=x+9+n*6,by=y+31+(n*7)%11,r=n%3+5+(d===2?3:0);
          dot(bx+2,by+3,r,'#79b4d9');dot(bx,by,r,'#c8e8f9');dot(bx-1,by-3,r*.65,'#eef9ff');
        }
        ctx.fillStyle='#173953';ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.fillText(d===2?'◆':'●',x+30,y+20);
      }
    }
    const x=state.at%G.W*C+30,y=Math.floor(state.at/G.W)*C+30;
    ctx.save();ctx.translate(x,y);
    ctx.rotate(({up:0,right:1,down:2,left:3})[state.facing]*Math.PI/2);
    for(const a of [-21,12]){
      pill(a,-15,9,33,3,'#182838');for(let n=0;n<5;n++)rect(a+1,-12+n*6,7,2,'#4d5e6b');
    }
    pill(-15,-18,30,38,5,'#713909');pill(-13,-19,26,39,4,'#ef871f');
    pill(-10,-12,20,15,3,'#164360');rect(-8,-10,16,3,'#72a8c7');
    pill(-10,5,20,13,3,'#432e27');
    for(let a=0;a<state.cargo;a++)dot(-5+(a%2)*9,9+Math.floor(a/2)*6,3.2,'#e7f5ff');
    dot(-9,-17,2.5,'#fff4b6');dot(9,-17,2.5,'#fff4b6');
    ctx.beginPath();ctx.moveTo(-18,-19);ctx.lineTo(18,-19);ctx.lineTo(0,-29);ctx.closePath();ctx.fillStyle='#ef7917';ctx.fill();
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
