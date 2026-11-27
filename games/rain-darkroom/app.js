(function(){
'use strict';
const E=Darkroom, $=id=>document.getElementById(id), A=['A','B','C'], S=['a','b','c'];
const ex=$('expose'), fix=$('fix'), help=$('help'), meters=$('meters'), shades=document.querySelectorAll('.shade');
const defaultHelp=help.textContent;
const barMax=11, display=(n)=>Math.min(100,100*n/barMax);
meters.innerHTML=A.map((label,i)=>'<div class="meter"><b>'+label+'</b><output id="read'+i+'"></output><div class="bar" aria-hidden="true"><div class="fill" id="fill'+i+'"></div><div class="target" style="left:'+display(E.TARGET[i])+'%"></div></div></div>').join('');
let s=E.fresh(), then=performance.now(), hidden=false;
function update(now){if(!hidden)E.tick(s,(now-then)/1000);then=now;}
function render(){
 const end=s.phase==='win'||s.phase==='loss';
 const time=(E.LIMIT-s.time).toFixed(1), result=s.phase==='win'?'成功':s.phase==='loss'?'要再挑戦':'--';
 if($('time').textContent!==time)$('time').textContent=time;
 if($('result').textContent!==result)$('result').textContent=result;
 ex.disabled=end;ex.textContent=s.light?'照射中':'照射';ex.setAttribute('aria-pressed',String(s.light));
 fix.textContent=end?'再挑戦':'焼き止め';fix.disabled=s.phase==='ready';
 S.forEach((letter,i)=>{
  const read=$('read'+i);const t=end?s.result[i]:Math.abs(E.TARGET[i]-s.dose[i])<=E.TOL?'適正':s.dose[i]>E.TARGET[i]?'過多':'';
  if(read.textContent!==t)read.textContent=t;
  $('fill'+i).style.width=display(s.dose[i])+'%';
  shades[i].classList.toggle('masked',s.mask[i]);
  shades[i].style.opacity=Math.min(.72,Math.max(0,.30*(s.dose[i]/E.TARGET[i]-.75))+(s.mask[i]&&!end?.08:0));
  const btn=$('mask-'+letter);btn.setAttribute('aria-pressed',String(s.mask[i]));btn.disabled=end;
 });
 const msg=end?(s.phase==='win'?'焼き上がり。3区画とも適正です。':'濃さが揃いませんでした。各区画の結果を見て、もう一度。'):defaultHelp;
 if(help.textContent!==msg)help.textContent=msg;
}
function act(f){update(performance.now());f();render();}
ex.addEventListener('click',()=>act(()=>E.light(s)));
fix.addEventListener('click',()=>act(()=>{if(s.phase==='win'||s.phase==='loss'){s=E.fresh();requestAnimationFrame(()=>ex.focus());}else E.finish(s);}));
S.forEach((l,i)=>$('mask-'+l).addEventListener('click',()=>act(()=>E.mask(s,i))));
document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const l=e.key.toLowerCase();if(S.includes(l))$('mask-'+l).click();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){update(performance.now());hidden=true;}else{hidden=false;then=performance.now();}});
function frame(now){update(now);render();requestAnimationFrame(frame);}
render();requestAnimationFrame(frame);
})();
