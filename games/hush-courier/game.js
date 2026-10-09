(function(){
'use strict';
const E=HushCourier, $=id=>document.getElementById(id), canvas=$('world'), ctx=canvas.getContext('2d');
let state=E.create(), accumulator=0,last=0, displayed='';
const keys=new Set(), pointers=new Map(), controls=Array.from(document.querySelectorAll('[data-control]'));
const keyMap={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',Shift:'run',' ':'hide'};
function clearInput(){keys.clear();pointers.clear();controls.forEach(b=>b.classList.remove('active'));}
function inputs(){const all=new Set([...keys,...pointers.values()]);return {left:all.has('left'),right:all.has('right')||all.has('sprint'),run:all.has('run')||all.has('sprint'),hide:all.has('hide')};}
function reset(){state=E.create();E.start(state);accumulator=0;clearInput();sync();}
function pause(){E.pause(state);clearInput();accumulator=0;sync();}
function sync(){
 const status=state.status;
 $('pause').disabled=status!=='playing'&&status!=='paused';$('pause').textContent=status==='paused'?'▶':'Ⅱ';$('pause').setAttribute('aria-label',status==='paused'?'再開':'一時停止');
 controls.forEach(b=>b.disabled=status!=='playing');
 $('overlay').hidden=status==='playing';
 if(status==='ready'){ $('heading').textContent='巨人の寝息が、道しるべ。';$('primary').textContent='配達をはじめる'; }
 if(status==='paused'){ $('overline').textContent='配達便はひと休み';$('heading').textContent='谷の時間を止めています';$('description').textContent='再開したら、押していた操作をもう一度。';$('primary').textContent='配達をつづける'; }
 if(status==='won'||status==='lost'){ $('overline').textContent=status==='won'?'DELIVERED · おつかれさま':'もう一度、そっと。';$('heading').textContent=state.reason;$('description').textContent=status==='won'?`${state.time.toFixed(1)}秒で配達。谷には、やさしい灯りだけ。`:'寝息の青い時間に進み、金色になったら茂みへ。目が開く直前に隠れよう。';$('primary').textContent='もう一度届ける'; }
 $('restart').hidden=status!=='paused';
}
$('primary').addEventListener('click',()=>{clearInput();if(state.status==='paused')E.resume(state);else if(state.status==='ready')E.start(state);else reset();accumulator=0;sync();});
$('restart').addEventListener('click',reset);
$('pause').addEventListener('click',()=>{if(state.status==='paused'){E.resume(state);sync();}else pause();});
for(const b of controls){b.addEventListener('pointerdown',event=>{event.preventDefault();if(state.status!=='playing')return;b.setPointerCapture(event.pointerId);pointers.set(event.pointerId,b.dataset.control);b.classList.add('active');});const release=event=>{pointers.delete(event.pointerId);if(![...pointers.values()].includes(b.dataset.control))b.classList.remove('active');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('pointerleave',release);b.addEventListener('lostpointercapture',release);b.addEventListener('contextmenu',e=>e.preventDefault());}
window.addEventListener('keydown',event=>{if(event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;const control=keyMap[event.key];if(control){if(event.key===' '&&event.target&&event.target.tagName==='BUTTON'&&state.status!=='playing')return;event.preventDefault();if(state.status==='playing')keys.add(control);}if((event.key==='p'||event.key==='P'||event.key==='Escape')&&!event.repeat){event.preventDefault();if(state.status==='paused'){E.resume(state);sync();}else pause();}});
window.addEventListener('keyup',event=>{if(keyMap[event.key])keys.delete(keyMap[event.key]);});
window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke();}
function text(str,x,y,size,color,align='center'){ctx.font=`${size}px system-ui,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(str,x,y);}
function draw(){
 const p=E.phase(state), time=state.time, awake=p==='watch', warning=p==='warning';
 const sky=ctx.createLinearGradient(0,0,0,340);sky.addColorStop(0,'#17313e');sky.addColorStop(1,'#426466');ctx.fillStyle=sky;ctx.fillRect(0,0,480,340);
 for(let i=0;i<29;i++){const x=(i*137+21)%480,y=(i*31+13)%112;ellipse(x,y,i%5===0?1.3:.7,i%5===0?1.3:.7,'#c7dac487');}
 ellipse(410,40,19,19,'#ead8a6');ellipse(418,35,18,18,'#17313e');
 // A mossy sleeping giant is the distant mountain, not a hostile chase sprite.
 const breath=Math.sin(time*1.35)*2;
 ellipse(217,173+breath,191,88,'#476968');ellipse(151,142+breath,87,58,'#5d7b70');
 ellipse(97,162+breath,33,27,'#668777');ellipse(196,106+breath,65,31,'#587b68');
 ellipse(250,122+breath,43,21,'#3c6056');ellipse(278,134+breath,42,18,'#3c6056');
 // Brow, nose, and visible eyelid mirror the exact engine phase.
 line([[101,136+breath],[125,133+breath]],warning?'#e8c37b':'#2c4c4a',3);
 if(awake){ellipse(113,145+breath,13,8,'#f1d29a');ellipse(111,145+breath,4,7,'#254340');}else line([[101,146+breath],[112,149+breath],[126,145+breath]],'#284b47',3);
 line([[81,158+breath],[88,165+breath],[98,164+breath]],'#355b51',2);
 if(!awake)text(warning?'…':'z z',62,113-breath,16,warning?'#f4d392':'#9fbcb4');
 if(awake){ctx.fillStyle='#e6bd6630';ctx.beginPath();ctx.moveTo(112,150);ctx.lineTo(10,292);ctx.lineTo(475,292);ctx.closePath();ctx.fill();}
 // Foreground trail and three postal homes.
 ctx.fillStyle='#294c4b';ctx.beginPath();ctx.moveTo(0,239);ctx.quadraticCurveTo(140,205,260,239);ctx.quadraticCurveTo(370,215,480,235);ctx.lineTo(480,340);ctx.lineTo(0,340);ctx.fill();
 line([[0,280],[90,274],[180,279],[280,273],[375,278],[480,270]],'#b0a17b',19);line([[0,284],[90,278],[180,283],[280,277],[375,282],[480,274]],'#d0bc8b',2);
 E.HOMES.forEach((x,i)=>{
  ctx.fillStyle='#254741';ctx.fillRect(x-15,223,30,40);ctx.fillStyle='#8b7360';ctx.beginPath();ctx.moveTo(x-23,226);ctx.lineTo(x,203);ctx.lineTo(x+23,226);ctx.closePath();ctx.fill();
  ctx.fillStyle=state.delivered[i]?'#ffe0a0':'#708e79';ctx.fillRect(x-5,234,10,13);if(state.delivered[i])ellipse(x,240,19,22,'#ffce6e16');
  text(state.delivered[i]?'✓':String(i+1),x,198,13,state.delivered[i]?'#f6d78d':'#bfd3bf');
  line([[x-24,285],[x+24,285]],'#86b492',3);
  for(let j=-2;j<=2;j++)ellipse(x+j*10,285,11,12-j%2*3,'#3e725b');
 });
 const x=state.x, bob=state.moving?Math.sin(time*(state.running?23:12))*2:0, y=268+bob;
 ellipse(x,288,11,3,'#172f3555');
 if(!state.hidden){
  line([[x-4,y+7],[x-6+(state.moving?Math.sin(time*16)*3:0),y+15]],'#203f43',3);line([[x+3,y+7],[x+6,y+15]],'#203f43',3);
  ctx.fillStyle='#daa875';ctx.fillRect(x-11,y-6,8,12);ctx.strokeStyle='#745443';ctx.strokeRect(x-11,y-6,8,12);
  ellipse(x,y,7,11,'#e4d7b6');ellipse(x,y-12,6,6,'#dfad84');ellipse(x,y-16,9,3,'#d57854');ctx.fillStyle='#d57854';ctx.fillRect(x-5,y-21,10,6);
  if(state.running){line([[x-18,y+2],[x-25,y+2]],'#d9c89a',1);line([[x-16,y+8],[x-21,y+8]],'#d9c89a',1);}
 }else{text('••',x,281,12,'#f6dca2');text('かくれ中',x,312,10,'#b8d8bd');}
 if(state.delivery>0){ctx.fillStyle='#efd399';ctx.fillRect(x-14,244,28*(state.delivery/.65),3);}
 // Cycle ribbon explicitly shows the coming observation window.
 const bx=105,by=327,bw=270;ctx.fillStyle='#769eae';ctx.fillRect(bx,by,bw*4.5/8.5,3);ctx.fillStyle='#d4b379';ctx.fillRect(bx+bw*4.5/8.5,by,bw/8.5,3);ctx.fillStyle='#cf896c';ctx.fillRect(bx+bw*5.5/8.5,by,bw*3/8.5,3);ellipse(bx+bw*(time%8.5)/8.5,by+1,4,4,'#f7e6bd');
 text('寝息',78,332,9,'#a5c2bc');text('視線',400,332,9,'#d9b796');
 $('parcels').textContent=`お届け ${state.delivered.filter(Boolean).length} / 3`;$('time').textContent=`夜明けまで ${Math.max(0,Math.ceil(E.LIMIT-time))}秒`;
 $('suspicion').value=state.suspicion;$('breath').value=state.breath;
 $('phase').textContent=state.status==='paused'?'一時停止':awake?'目が開いた！':warning?'寝息が止まりそう…':'すう、すう… 眠っている';
 $('hint').textContent=state.hidden?'息が続く間だけ、視線をかわせる':state.breath<.1?'息切れ！ 隠れるを離して回復':awake?'茂みで隠れて、視線をやりすごそう':E.cover(state)>=0?'ここで止まると配達・隠れられる':'走ると速いけれど、足音が響く';
}
function frame(now){if(!last)last=now;const elapsed=Math.min(.1,(now-last)/1000);last=now;if(state.status==='playing'){accumulator+=elapsed;while(accumulator>=E.DT&&state.status==='playing'){E.step(state,inputs());accumulator-=E.DT;}}if(displayed!==state.status){displayed=state.status;if(state.status==='won'||state.status==='lost')clearInput();sync();}draw();requestAnimationFrame(frame);}
sync();requestAnimationFrame(frame);
})();
