(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EchoDrum=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const BEAT=.6, COUNT=2.4, LENGTH=3.6, WINDOW=.16, PERFECT=.08, MAX_ERRORS=4, TARGET=12;
const PHRASES=Object.freeze([
 Object.freeze({name:'ひらく祭り',notes:Object.freeze([0,.6,1.2,2.4])}),
 Object.freeze({name:'はねる提灯',notes:Object.freeze([0,.9,1.2,2.1,2.4])}),
 Object.freeze({name:'夜空の返し',notes:Object.freeze([0,.6,.9,1.8,2.4,2.7])})
]);
function create(){return {status:'ready',phase:'listen',phrase:0,time:-COUNT,judged:[],hits:0,errors:0,combo:0,best:0,message:'お手本を見て、同じリズムで太鼓を返そう。',feedback:'',feedbackAt:-99};}
function clone(s){return {...s,judged:s.judged.slice()};}
function start(s){if(s.status!=='ready')return s;return {...s,status:'playing',message:'お手本。玉が線に重なるリズムを見よう。'};}
function lose(s){s.status='lost';s.message='祭りの息が少しずれた。もう一度、お手本から。';}
function error(s,message){s.errors++;s.combo=0;s.feedback=message;s.feedbackAt=s.time;s.message=`${message}。ずれ ${s.errors} / ${MAX_ERRORS}。`;if(s.errors>=MAX_ERRORS)lose(s);}
function advance(state,dt){if(state.status!=='playing'||!Number.isFinite(dt)||dt<=0)return state;const s=clone(state);let remaining=dt;
while(remaining>1e-9&&s.status==='playing'){
 const part=Math.min(remaining,LENGTH-s.time);s.time+=part;remaining-=part;
 if(s.phase==='reply')for(let i=0;i<PHRASES[s.phrase].notes.length;i++)if(!s.judged[i]&&s.time>PHRASES[s.phrase].notes[i]+WINDOW+1e-9){s.judged[i]='miss';error(s,'見送り');if(s.status==='lost')break;}
 if(s.status!=='playing')break;
 if(s.time>=LENGTH-1e-9){if(s.phase==='listen'){s.phase='reply';s.time=-COUNT;s.feedback='';s.feedbackAt=-99;s.message='あなたの番。玉が線に来たら、ドン！';}else if(s.phrase<2){s.status='between';s.message='ひと節、おつかれさま。次のリズムへ。';}else{s.status=s.hits>=TARGET?'won':'lost';s.message=s.status==='won'?'祭りに、あなたの音が響いた！':'あと少し。お手本を見て、もう一度。';}}
}
return s;}
function hit(state){if(state.status!=='playing'||state.phase!=='reply'||state.time<-.25)return state;const s=clone(state),notes=PHRASES[s.phrase].notes;let index=-1,distance=Infinity;
for(let i=0;i<notes.length;i++){const d=Math.abs(s.time-notes[i]);if(!s.judged[i]&&d<=WINDOW+1e-9){distance=d;index=i;break;}}
if(index>=0&&distance<=WINDOW+1e-9){s.judged[index]='hit';s.hits++;s.combo++;s.best=Math.max(s.best,s.combo);s.feedback=distance<=PERFECT+1e-9?'ぴったり！':s.time<notes[index]?'少し早い · OK':'少し遅い · OK';s.feedbackAt=s.time;s.message=`${s.feedback} 成功 ${s.hits} / 15。`;}else error(s,'空打ち');return s;}
function next(s){if(s.status!=='between')return s;return {...s,status:'playing',phase:'listen',phrase:s.phrase+1,time:-COUNT,judged:[],feedback:'',feedbackAt:-99,message:'新しいお手本。間の長さも見よう。'};}
function pause(s){return s.status==='playing'?{...s,status:'paused'}:s;}
function resume(s){return s.status==='paused'?{...s,status:'playing'}:s;}
return {BEAT,COUNT,LENGTH,WINDOW,PERFECT,MAX_ERRORS,TARGET,PHRASES,create,start,advance,hit,next,pause,resume};
});
