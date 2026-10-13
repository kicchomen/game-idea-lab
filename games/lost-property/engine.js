(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.LostProperty=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MARKS=['星','月','葉'];
const cases=[
 {title:'ふたつの赤い袋',budget:2,items:[['赤','布','星'],['赤','革','月'],['青','布','葉'],['青','革','星'],['緑','布','月']],claims:['赤くて、内側に星印があります。','赤い袋です。素材と印は覚えていません。','青い布の袋です。'],rules:[[['color','赤'],['mark','星']],[['color','赤']],[['color','青'],['material','布']]],hint:'赤い袋を一つ調べると、二人分の持ち主が決まります。'},
 {title:'重なる証言',budget:3,items:[['白','布','星'],['白','革','月'],['黒','革','月'],['黒','布','葉'],['緑','革','葉']],claims:['白くて、内側に星印があります。','白い袋です。ほかは覚えていません。','革の袋で、内側は月印です。'],rules:[[['color','白'],['mark','星']],[['color','白']],[['material','革'],['mark','月']]],hint:'白い革の袋は、二人の証言に関係します。返却先は一人だけです。'},
 {title:'だれかと同じ',budget:4,items:[['白','布','星'],['青','布','月'],['黒','革','月'],['白','革','葉'],['黒','布','星']],claims:['白くて、内側に星印があります。','アオさんの袋と同じ素材です。','黒い袋で、内側はレンさんの袋と同じ印です。'],rules:[[['color','白'],['mark','星']],[['same','material',0]],[['color','黒'],['same','mark',1]]],hint:'レンさんに仮置きすると、ミオさんに渡せる黒い袋が残るかを確認しましょう。'}
].map((c,i)=>({...c,id:i,items:(i===1?[c.items[2],c.items[4],c.items[0],c.items[3],c.items[1]]:i===2?[c.items[3],c.items[1],c.items[4],c.items[0],c.items[2]]:c.items).map((v,j)=>({id:j,label:'ABCDE'[j],color:v[0],material:v[1],mark:v[2]}))}));
const names=['アオ','レン','ミオ'];
const clone=x=>JSON.parse(JSON.stringify(x));
function validCase(n){return Number.isInteger(n)&&n>=0&&n<cases.length;}
function create(n=0){if(!validCase(n))n=0;return {caseId:n,revealed:[],assigned:[null,null,null],remaining:cases[n].budget,status:'playing',message:'証言を読んで、調べる袋を選びましょう。',history:[]};}
function matches(c,assigned,items=c.items){return c.rules.every((rules,p)=>{let item=items[assigned[p]];return item&&rules.every(r=>r[0]==='same'? item[r[1]]===items[assigned[r[2]]]?.[r[1]]:item[r[0]]===r[1]);});}
function act(state,action){let s=clone(state),c=cases[s.caseId];if(action.type==='reset')return create(s.caseId);if(action.type==='case')return validCase(action.value)?create(action.value):s;
 if(action.type==='undo'){if(!s.history.length)return s;let old=s.history.pop();return {...old,revealed:s.revealed,remaining:s.remaining,history:s.history};}
 if(s.status!=='playing')return s;
 const save=()=>{let snap=clone(s);delete snap.history;s.history.push(snap);};
 if(action.type==='inspect'){let i=action.item;if(!Number.isInteger(i)||!c.items[i]||s.revealed.includes(i)||s.remaining===0)return s;s.revealed.push(i);s.remaining--;s.message=`${c.items[i].label}の内側は${c.items[i].mark}印。${s.remaining?'ほかの証言とも照らし合わせましょう。':'調査は終了。仮置きと返却は続けられます。'}`;}
 if(action.type==='assign'){let p=action.person,i=action.item;if(!Number.isInteger(p)||p<0||p>2||(i!==null&&(!Number.isInteger(i)||!c.items[i]))||s.assigned[p]===i)return s;save();if(i!==null){s.assigned=s.assigned.map(v=>v===i?null:v);}s.assigned[p]=i;s.message=i===null?`${names[p]}さんの仮置きを外しました。`:`${c.items[i].label}を${names[p]}さんに仮置き。まだ返却していません。`;}
 if(action.type==='submit'){if(s.assigned.some(x=>x===null))return s;save();if(matches(c,s.assigned)){s.status='won';s.message='全員に届きました！ 3人の証言がつながりました。';}else{s.status='lost';s.message='持ち主が違う袋がありました。証言を見直し、ひと手戻すか再挑戦できます。';}}
 return s;
}
function solutions(c,items=c.items){let out=[];for(let a=0;a<5;a++)for(let b=0;b<5;b++)for(let d=0;d<5;d++)if(a!==b&&a!==d&&b!==d&&matches(c,[a,b,d],items))out.push([a,b,d]);return out;}
return {cases,names,MARKS,create,act,matches,solutions};
});
