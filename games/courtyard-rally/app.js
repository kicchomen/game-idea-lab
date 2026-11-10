(function(){
'use strict';
const E=window.CourtyardRally,$=id=>document.getElementById(id);
function text(id,value){const el=$(id),next=String(value);if(el.textContent!==next)el.textContent=next;}
let state=E.create(),raf=null,lastTime=null,dragId=null,target=null,lastEvent=-1;
const heldKeys=new Set(),heldPointers=new Map();
const moving=()=>['rally','between'].includes(state.phase)&&!state.paused&&!$('instructions').open;
function clearInput(){heldKeys.clear();heldPointers.clear();dragId=null;target=null;}
function input(){let left=heldKeys.has('arrowleft')||heldKeys.has('a'),right=heldKeys.has('arrowright')||heldKeys.has('d');for(const d of heldPointers.values()){if(d<0)left=true;else right=true;}return{direction:Number(right)-Number(left),target};}
function cancelLoop(){if(raf!==null)cancelAnimationFrame(raf);raf=null;lastTime=null;}
function schedule(){if(moving()&&raf===null)raf=requestAnimationFrame(frame);}
function frame(now){raf=null;if(!moving()){lastTime=null;return;}if(lastTime!==null)E.advance(state,(now-lastTime)/1000,input());lastTime=now;render();if(moving())schedule();else lastTime=null;}
function stop(){if(E.pause(state,true)){clearInput();cancelLoop();render();}}
function resume(){if($('instructions').open)return;if(E.pause(state,false)){clearInput();lastTime=null;render();schedule();}}
function reset(){cancelLoop();clearInput();state=E.create();lastEvent=-1;render();}
function togglePause(){if(state.paused)resume();else stop();}
function primary(){if($('instructions').open)return;if(state.phase==='ready'){E.start(state);clearInput();render();schedule();}else if(state.paused)resume();else if(['won','lost'].includes(state.phase))reset();}
function setPosition(el,x,y){el.style.left=(x/E.C.width*100)+'%';el.style.top=(y/E.C.height*100)+'%';}
const eventText={ready:'左右に動いて、羽根を返そう。',serve:'中央なら直進、端なら斜めに返る。','player-hit':'返した！ 次は空いた方へ。','opponent-hit':'相手の返球。落ちる先へ移動！','player-point':'奥へ通した！ 次の羽根が来る。','opponent-point':'次は落ちる先に先回りしよう。',won:'空いた場所へ、気持ちよく一本。',lost:'当てる位置を変えて、もう一勝負。'};
function render(){
text('playerScore',String(state.score.player));text('opponentScore',String(state.score.opponent));
setPosition($('playerPaddle'),state.player.x,E.C.playerY);setPosition($('opponentPaddle'),state.opponent.x,E.C.opponentY);setPosition($('shuttle'),state.ball.x,state.ball.y);
$('shuttle').hidden=state.phase==='between'||['won','lost'].includes(state.phase);
const labels={ready:'開始前',rally:'ラリー中 · '+state.returns+'回返球',between:state.lastEvent==='player-point'?'あなたの得点！':'相手の得点',won:'あなたの勝ち！',lost:'相手の勝ち'};
text('phase',state.paused?'一時停止中':labels[state.phase]);
if(lastEvent!==state.eventId){text('feedback',eventText[state.lastEvent]);lastEvent=state.eventId;}
$('pause').disabled=!['rally','between'].includes(state.phase);text('pause',state.paused?'再開':'一時停止');$('left').disabled=!moving();$('right').disabled=!moving();
const show=state.phase==='ready'||state.paused||['won','lost'].includes(state.phase);$('overlay').hidden=!show;$('restart').hidden=!state.paused;
if(show){
if(state.paused){text('overlayEyebrow','ひと休み');text('result','一時停止中');text('resultNote','再開を押すまで、羽根は動きません。');text('start','再開する');}
else if(state.phase==='ready'){text('overlayEyebrow','庭先で、一勝負。');text('result','当てる位置で、返す向きが変わる');text('resultNote','羽子板の端で、相手のいない方へ。');text('start','ラリーを始める');}
else{text('overlayEyebrow',state.score.player+' − '+state.score.opponent);text('result',state.phase==='won'?'あなたの勝ち！':'相手の勝ち');text('resultNote',state.phase==='won'?'今度は違う角度で、もう一勝負。':'早めに動き、羽子板の端を使ってみよう。');text('start','もう一度遊ぶ');}
}
}
$('start').addEventListener('click',primary);$('restart').addEventListener('click',reset);$('pause').addEventListener('click',togglePause);
$('help').addEventListener('click',()=>{stop();clearInput();$('instructions').showModal();render();});
$('closeHelp').addEventListener('click',()=>$('instructions').close());
$('instructions').addEventListener('close',()=>{clearInput();render();});
$('instructions').addEventListener('cancel',()=>{clearInput();});
function endPointer(e){heldPointers.delete(e.pointerId);if(dragId===e.pointerId){dragId=null;target=null;}}
for(const [id,direction] of [['left',-1],['right',1]]){const b=$(id);b.addEventListener('pointerdown',e=>{if(!moving()||e.button>0)return;e.preventDefault();heldPointers.set(e.pointerId,direction);if(b.setPointerCapture)b.setPointerCapture(e.pointerId);});for(const name of ['pointerup','pointercancel','lostpointercapture','pointerleave'])b.addEventListener(name,endPointer);}
function drag(e){const r=$('court').getBoundingClientRect(),border=$('court').clientLeft||0,width=$('court').clientWidth||r.width;target=(e.clientX-r.left-border)/width*E.C.width;}
$('court').addEventListener('pointerdown',e=>{if(!moving()||e.button>0||dragId!==null)return;e.preventDefault();dragId=e.pointerId;drag(e);if($('court').setPointerCapture)$('court').setPointerCapture(e.pointerId);});
$('court').addEventListener('pointermove',e=>{if(dragId===e.pointerId&&moving()){e.preventDefault();drag(e);}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])$('court').addEventListener(name,endPointer);
window.addEventListener('pointerup',endPointer);window.addEventListener('pointercancel',endPointer);
document.addEventListener('keydown',e=>{const key=e.key.toLowerCase(),tag=e.target&&e.target.tagName;if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(e.target&&e.target.isContentEditable))return;if($('instructions').open)return;if(['arrowleft','arrowright','a','d'].includes(key)){e.preventDefault();if(moving())heldKeys.add(key);return;}if(['p','escape','enter',' '].includes(key)&&e.repeat){e.preventDefault();return;}if(key==='p'||key==='escape'){e.preventDefault();togglePause();}else if(key==='enter'&&tag!=='BUTTON'){e.preventDefault();primary();}});
document.addEventListener('keyup',e=>heldKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();stop();}});
render();
})();
