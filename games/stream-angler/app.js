(function() {
  'use strict';
  const E=StreamAngler, el=id=>document.getElementById(id);
  const view=Object.fromEntries(['distance','time','tension','meter','needle','cue','ripples','overlay','result-title','result-text','start','retry','reel','pause','message','instructions','help','close-help'].map(id=>[id,el(id)]));
  const river=document.querySelector('.river');
  let state=E.initial(), held=false, pointer=null, last=0, accumulator=0;
  const keys=new Set();
  function refreshHeld() { held=pointer!==null||keys.size>0;view.reel.classList.toggle('held',held); }
  function release() { pointer=null;keys.clear();refreshHeld(); }
  function stop() { release();state=E.pause(state);accumulator=0;last=0;render(); }
  function reset() { release();state=E.start();accumulator=0;last=0;render(); }
  function render() {
    const playing=state.phase==='playing';
    view.distance.textContent=Math.ceil(state.distance);view.time.textContent=Math.ceil(E.LIMIT-state.time);
    view.tension.textContent=Math.floor(state.tension)+'%';view.meter.setAttribute('aria-valuenow',Math.floor(state.tension));
    view.needle.style.left=state.tension+'%';
    const cues={calm:'おだやか',warning:'走りそう…',running:'走っている！'};
    view.cue.textContent=cues[state.cue];river.className='river '+state.cue;
    view.overlay.hidden=playing;view.reel.disabled=!playing;view.pause.disabled=!playing;
    view.reel.classList.toggle('held',held);view.retry.hidden=state.phase!=='paused';
    if(playing){view.message.textContent=state.cue==='running'?'いまは緩めどき。巻くと張りが急上昇。':state.cue==='warning'?'水面がざわつく。もうすぐ魚が走る。':state.tension>=75?'張りが高い。いったん離そう。':held?'巻いている。距離も張りも見てみよう。':'緩めている。少し戻るけれど、糸を守れる。';}
    else if(state.phase==='ready'){view['result-title'].textContent='魚の走りに、手をゆるめる。';view['result-text'].innerHTML='長押しで巻く、離して緩める。<br>糸の張り100%で切断。40秒で距離0へ。';view.start.textContent='釣りをはじめる';}
    else if(state.phase==='paused'){view['result-title'].textContent='ひと休み';view['result-text'].textContent='時間は止まっています。再開してから巻き直そう。';view.start.textContent='再開する';view.message.textContent='停止中。';}
    else {view['result-title'].textContent=state.phase==='won'?'魚を引き寄せた！':state.reason==='line'?'糸が切れてしまった':'魚は流れの奥へ';view['result-text'].textContent=state.phase==='won'?state.time.toFixed(1)+'秒。手を緩めた時間が、最後の一巻きへ。':state.reason==='line'?'張り100%で終了。次は走る前に手を離してみよう。':'40秒で終了。おだやかな間に、少しずつ巻こう。';view.start.textContent='同じ魚で再挑戦';view.message.textContent=state.phase==='won'?'成功 · 今回は1匹の手加減を試す小さな試作です。':'巻く／緩めるの切替を変えて、もう一度。';}
  }
  view.start.addEventListener('click',()=>{if(state.phase==='paused'){release();state=E.resume(state);last=0;accumulator=0;render();}else reset();});
  view.retry.addEventListener('click',reset);view.pause.addEventListener('click',stop);
  view.reel.addEventListener('pointerdown',event=>{if(state.phase!=='playing'||pointer!==null||event.button!==0)return;event.preventDefault();pointer=event.pointerId;view.reel.setPointerCapture(pointer);refreshHeld();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])view.reel.addEventListener(type,event=>{if(pointer===event.pointerId){pointer=null;refreshHeld();}});
  view.reel.addEventListener('contextmenu',event=>event.preventDefault());
  document.addEventListener('keydown',event=>{if(view.instructions.open)return;if(['Space','KeyR'].includes(event.code)&&state.phase==='playing'){event.preventDefault();if(!event.repeat){keys.add(event.code);refreshHeld();}}else if(['KeyP','Escape'].includes(event.code)&&!event.repeat&&state.phase==='playing'){event.preventDefault();stop();}});
  document.addEventListener('keyup',event=>{if(keys.has(event.code)){event.preventDefault();keys.delete(event.code);refreshHeld();}});
  window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  view.help.addEventListener('click',()=>{stop();view.instructions.showModal();});
  view['close-help'].addEventListener('click',()=>view.instructions.close());
  function frame(now){if(state.phase==='playing'){const elapsed=last?(now-last)/1000:0;if(elapsed>.5){stop();}else{accumulator+=elapsed;let count=0;while(accumulator>=1/E.HZ&&state.phase==='playing'&&count<30){state=E.tick(state,held);accumulator-=1/E.HZ;count++;}if(state.phase!=='playing')release();render();}}last=now;requestAnimationFrame(frame);}
  render();requestAnimationFrame(frame);
})();
