(function(){'use strict';
const E=window.EchoDrum,$=id=>document.getElementById(id),canvas=$('lane'),ctx=canvas.getContext('2d');let state=E.create(),last=null,held=false,pointer=null,pulseUntil=0,lastMessage='';
function sync(now){if(last!==null&&state.status==='playing'){const dt=(now-last)/1000;if(dt>.25)state=E.pause(state);else if(dt>0)state=E.advance(state,dt);}last=now;}
function clear(){held=false;pointer=null;}
function stop(){state=E.pause(state);clear();last=null;render();}
function strike(){sync(performance.now());const old=state;state=E.hit(state);if(state!==old){pulseUntil=performance.now()+100;render();}}
function activate(){clear();if(state.status==='ready')state=E.start(state);else if(state.status==='paused')state=E.resume(state);else if(state.status==='between')state=E.next(state);else if(state.status==='won'||state.status==='lost')state=E.start(E.create());last=performance.now();render();}
$('primary').addEventListener('click',activate);
$('pause').addEventListener('click',stop);
$('retry').addEventListener('click',()=>{clear();state=E.create();last=null;render();});
$('drum').addEventListener('pointerdown',event=>{if(pointer!==null||event.isPrimary===false||event.button!==0)return;event.preventDefault();pointer=event.pointerId;strike();});
window.addEventListener('pointerup',event=>{if(event.pointerId===pointer)pointer=null;});window.addEventListener('pointercancel',clear);
// Click is reserved for assistive/native activation; pointerdown already handles real pointers.
$('drum').addEventListener('click',event=>{if(event.detail===0)strike();});
window.addEventListener('keydown',event=>{
 if(event.repeat){if(event.code==='Space'||event.code==='Enter')event.preventDefault();return;}
 if(event.code==='KeyP'||event.code==='Escape'){event.preventDefault();if(state.status==='paused')activate();else stop();return;}
 if(event.code!=='Space')return;
 const native=event.target&&/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(event.target.tagName);if(native&&event.target!==$('drum')&&!event.target.hidden)return;
 event.preventDefault();if(!held){held=true;strike();}
});window.addEventListener('keyup',event=>{if(event.code==='Space')held=false;});window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
function draw(){const w=600,h=150,mark=168;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#45606a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(25,70);ctx.lineTo(575,70);ctx.stroke();
 const t=state.time,active=state.status!=='ready';ctx.fillStyle=state.phase==='reply'?'#8cddd1':'#ffcc85';ctx.globalAlpha=.15;ctx.fillRect(mark-18,16,36,101);ctx.globalAlpha=1;ctx.fillRect(mark-2,18,4,96);
 for(let n=0;n<7;n++){const x=mark+(n*E.BEAT-t)*140;if(x>20&&x<580){ctx.fillStyle='#58717a';ctx.beginPath();ctx.arc(x,70,3,0,Math.PI*2);ctx.fill();}}
 if(active)E.PHRASES[state.phrase].notes.forEach((time,i)=>{const x=mark+(time-t)*140;if(x<20||x>580)return;const judged=state.phase==='reply'?state.judged[i]:null;ctx.globalAlpha=judged?.35:1;ctx.fillStyle=judged==='miss'?'#ee8b7a':state.phase==='reply'?'#92e0d2':'#ffd18a';const r=Math.abs(time-t)<.09?20:15;ctx.beginPath();ctx.arc(x,70,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#153745';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText(judged==='hit'?'✓':String(i+1),x,76);ctx.globalAlpha=1;});
 if(!active){ctx.fillStyle='#adc4c7';ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText('光る玉のリズムを、あなたの太鼓で',335,76);}}
function render(){const running=state.status==='playing',reply=state.phase==='reply';$('phrase').textContent=`第${state.phrase+1}節 / 3`;$('score').textContent=`成功 ${state.hits} / 15`;$('errors').textContent=`ずれ ${state.errors} / 4`;$('title').textContent=E.PHRASES[state.phrase].name;
 $('phase').textContent=state.status==='won'?'演奏成功':state.status==='lost'?'もう一度挑戦':state.status==='paused'?'一時停止':state.status==='ready'?'祭りの太鼓番':reply?'RESPONSE · あなたの番':'CALL · お手本';
 $('cue').textContent=state.status==='ready'?'音は鳴りません':state.status==='paused'?'「つづける」で同じ位置から再開':running&&state.time<0?`準備 ${Math.min(4,Math.ceil(-state.time/E.BEAT))} · ${reply?'次はあなた':'まずは見よう'}`:running?(reply?'玉が線に来たら、ドン！':'このリズムを、次に返そう'):state.status==='between'?'次の節へ進もう':`成功 ${state.hits} 打 / 15 · 最長 ${state.best} 連続`;
 $('drum').disabled=!(running&&reply&&state.time>=-.25);$('drum').classList.toggle('pulse',performance.now()<pulseUntil);
 $('feedback').textContent=state.feedback&&state.time-state.feedbackAt<.65?state.feedback:running&&state.time>=0&&!reply&&E.PHRASES[state.phrase].notes.some(n=>Math.abs(n-state.time)<.11)?'ドン！':'• • •';
 if(lastMessage!==state.message){$('message').textContent=state.message;lastMessage=state.message;}
 $('primary').hidden=running;$('primary').textContent=state.status==='paused'?'つづける':state.status==='between'?'次のお手本へ':state.status==='won'||state.status==='lost'?'もう一度演奏する':'祭りをはじめる';$('pause').hidden=!running;$('retry').hidden=state.status!=='paused'&&state.status!=='between';draw();}
function frame(now){sync(now);render();requestAnimationFrame(frame);}render();requestAnimationFrame(frame);
})();
