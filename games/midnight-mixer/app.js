(function(){
'use strict';
const E=MidnightMixer, $=x=>document.getElementById(x), deck=document.querySelector('.deck');
const pads=[...document.querySelectorAll('[data-channel]')], keys=['music','talk','jingle'];
const icons=['<path d="M9 18V4l11-2v14M9 7l11-2"/><ellipse cx="6.5" cy="18.5" rx="2.5" ry="2"/><ellipse cx="17.5" cy="16.5" rx="2.5" ry="2"/>','<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0014 0v-1M12 18v4m-4 0h8"/>','<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>'];
const meters=keys.map((c,i)=>{const d=document.createElement('div');d.className='channel '+c;
 d.innerHTML='<div class="chlabel"><svg viewBox="0 0 24 24" aria-hidden="true">'+icons[i]+'</svg><span>'+E.labels[i]+'</span></div><div class="meter" aria-hidden="true">'+Array.from({length:15},()=>'<i></i>').join('')+'</div>';
 $('meters').append(d);return {d,bars:[...d.querySelectorAll('i')]};});
const tiles=E.plan.map(()=>{const t=document.createElement('i');$('timeline').append(t);return t});
const wave=Array.from({length:34},(_,i)=>{const x=document.createElement('i');x.style.setProperty('--h',String(2+Math.round((Math.sin(i*1.38)**4)*(5+16*Math.sin(i*.19)**4)))+'px');$('wave').append(x);return x});
let s=E.create(),last=0,quiet=true,sys=null,note=-1,rendered=-1,currentPhase='';
function buildSynth(){let AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;const ctx=new AC();
 const output=ctx.createGain();output.gain.value=.17;output.connect(ctx.destination);
 const voices=['sine','triangle','sine'].map(type=>{const osc=ctx.createOscillator(),gain=ctx.createGain();gain.gain.value=0;osc.type=type;osc.connect(gain);gain.connect(output);osc.start();return{osc,gain}});
 const tone=(vals,levels)=>voices.forEach((v,i)=>{v.osc.frequency.setTargetAtTime(vals[i],ctx.currentTime,.024);v.gain.gain.setTargetAtTime(levels[i],ctx.currentTime,.021);});
 return{ctx,tone};
}
function sound(){if(!sys)return;const t=s.time,i=Math.floor(t*16);if(i===note&&s.phase==='play'&&!quiet)return;note=i;
 const f=[196,246.94,293.66,246.94,220,261.63,329.63,261.63];
 const vals=[f[Math.floor(t*3)%f.length],98+37*(.5+.5*Math.sin(t*12.5)),[523.25,659.26,783.99,1046.5][Math.floor(t*6)%4]];
 const on=s.phase==='play'&&!quiet;
 const em=[.21+(.25*(1-t*3%1)),.20*Math.max(0,Math.sin(t*13))+.026,.34*Math.pow(1-(t*6)%1,1.8)];
 sys.tone(vals,on?em.map((a,i)=>a*s.gain[i]):[0,0,0]);
}
function setHint(x){if($('hint').textContent!==x)$('hint').textContent=x;}
function draw(){
 const v=E.view(s),play=s.phase==='play',halt=s.phase==='pause',end=s.phase==='won'||s.phase==='lost',ready=s.phase==='ready';
 if(deck.dataset.phase!==s.phase)deck.dataset.phase=s.phase;
 const replace=(id,t)=>{const x=$(id);if(x.textContent!==t)x.textContent=t;};
 replace('badge',play?'ON AIR':halt?'PAUSE':end?'OFF AIR':'STANDBY');
 replace('cue','キュー '+v.number+' / 6');replace('score','成功 '+v.score);replace('time','残り '+Math.ceil(v.remaining)+' 秒');
 replace('target',end?(s.phase==='won'?'放送成功':'放送終了'):(halt?'休止中':E.labels[v.target]));
 $('next').textContent=end?'6つ中 '+v.score+' キュー成功':v.next===null?'このあと放送終了':'次：'+E.labels[v.next];
 $('clock').textContent=play?'切替まで '+v.countdown.toFixed(1)+' 秒':'';
 $('clock').classList.toggle('soon',play&&v.countdown<1);
 $('start').hidden=!ready;$('restart').hidden=ready;$('restart').textContent=end?'もう一度放送':'やり直す';
 $('pause').hidden=ready||end;$('pause').textContent=halt?'再開':'休止';
 if(currentPhase!==s.phase||v.number!==rendered){
  if(ready)setHint('合図に合わせて音を切り替える。6つのうち5つで成功。');
  else if(halt)setHint('再開するまで残り時間は進みません。');
  else if(end)setHint(s.phase==='won'?'無事に番組をつなげました。':'現在のキューと同じチャンネルを選んでみよう。');
  else if(v.number>1)setHint((s.results[v.number-2]?'前のキュー：成功。':'前のキュー：音がずれた。')+' 合図に合わせて切り替えよう。');
  else setHint('「切替先」に表示された音に合わせよう。');
  currentPhase=s.phase;rendered=v.number;
 }
 meters.forEach(({d,bars},i)=>{d.classList.toggle('active',i===v.dominant&&!end);d.setAttribute('aria-label',E.labels[i]+'のレベル '+Math.round((end?0:s.gain[i])*100)+'%');
  const power=end?0:s.gain[i];
  bars.forEach((x,j)=>x.classList.toggle('lit',(j%5)<Math.round(power*(3.1+(j/5|0)*.34)+.5*(i===0&&ready))));
 });
 pads.forEach((p,i)=>{p.disabled=!play;p.setAttribute('aria-pressed',String(s.destination===i&&!end));});
 tiles.forEach((t,i)=>{t.className=i===s.i&&!end?'current':i<s.results.length?(s.results[i]?'ok':'miss'):'';t.style.setProperty('--fill',i===s.i&&!end?(100*s.offset/E.plan[s.i][1]).toFixed(1)+'%':'0%');});
}
function start(){s=E.create();E.start(s);last=performance.now();draw();pads[0].focus({preventScroll:true});}
$('start').onclick=start;$('restart').onclick=start;
$('pause').onclick=()=>{if(E.pause(s)){last=performance.now();draw();sound();}};
$('audio').onclick=async()=>{if(quiet){try{sys ||= buildSynth();if(!sys)return;await sys.ctx.resume();quiet=false;}catch{return}}else quiet=true;
 $('audio').textContent=quiet?'音：オフ':'音：オン';$('audio').setAttribute('aria-pressed',String(!quiet));note=-1;sound();
};
const choose=i=>{E.select(s,i);draw();};
pads.forEach((p,i)=>p.addEventListener('click',()=>choose(i)));
document.addEventListener('keydown',e=>{if(e.repeat||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
 if(/^[123]$/.test(e.key)&&s.phase==='play'){e.preventDefault();choose(+e.key-1);}
 if(e.key==='Escape'&&(s.phase==='pause'||s.phase==='play')){$('pause').click();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.phase==='play'){E.pause(s);draw();sound();}});
function frame(t){if(s.phase==='play'){const old=last||t;E.tick(s,Math.min(.12,Math.max(0,(t-old)/1000)));draw();sound();}
 last=t;requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
})();
