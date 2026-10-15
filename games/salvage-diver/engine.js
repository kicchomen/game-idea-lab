(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SalvageDiver=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ROOMS=Object.freeze([{id:'S',name:'母船',x:50,y:9},{id:'A',name:'珊瑚棚',x:24,y:34},{id:'B',name:'沈没艇',x:76,y:34},{id:'C',name:'石の門',x:16,y:61},{id:'D',name:'海底庭園',x:76,y:61},{id:'E',name:'深海金庫',x:46,y:87}].map(Object.freeze));
const EDGES=Object.freeze([['S','A'],['S','B'],['A','C'],['A','D'],['B','D'],['C','E'],['D','E']].map(Object.freeze));
const STAGES=Object.freeze([
 {name:'珊瑚の入り江',quota:14,air:22,items:[['A','真珠',3,1],['B','銀貨',4,2],['C','古代の壺',8,3],['D','星の羅針盤',6,2],['E','黄金の鐘',12,4]]},
 {name:'沈没船の回廊',quota:22,air:24,items:[['A','銀の杯',4,2],['B','水晶',5,1],['C','王冠',10,4],['D','航海日誌',8,2],['E','宝石箱',14,4]]},
 {name:'深淵の宝物庫',quota:38,air:26,items:[['A','月の欠片',5,1],['B','銀の鍵',6,2],['C','儀式の仮面',12,3],['D','星図',10,2],['E','海の心臓',18,5]]}
].map(s=>Object.freeze({...s,items:Object.freeze(s.items.map(Object.freeze))})));
const MAX_DIVES=3,CAPACITY=6;
function create(stage=0){if(!Number.isInteger(stage)||stage<0||stage>=STAGES.length)stage=0;return {stage,phase:'dock',room:'S',air:STAGES[stage].air,dives:0,bank:0,cargo:[],remaining:STAGES[stage].items.map((i,n)=>({id:n,room:i[0],name:i[1],value:i[2],weight:i[3]})),turn:0,message:'宝は母船へ届けて初めて得点。3回以内の潜水で目標を達成しよう。'};}
function weight(s){return s.cargo.reduce((a,i)=>a+i.weight,0);}
function value(s){return s.cargo.reduce((a,i)=>a+i.value,0);}
function moveCost(s){return 2+Math.ceil(weight(s)/3);}
function adjacent(room){return EDGES.filter(e=>e.includes(room)).map(e=>e[0]===room?e[1]:e[0]);}
function returnCost(s){let q=[[s.room,0]],seen=new Set();while(q.length){let [id,d]=q.shift();if(id==='S')return d*moveCost(s);if(seen.has(id))continue;seen.add(id);for(const n of adjacent(id))q.push([n,d+1]);}return Infinity;}
function act(state,action){if(!action||typeof action.type!=='string')return state;
 if(action.type==='retry')return create(state.stage);
 if(action.type==='select')return Number.isInteger(action.stage)&&action.stage>=0&&action.stage<STAGES.length?create(action.stage):state;
 if(action.type==='next')return state.phase==='won'&&state.stage<STAGES.length-1?create(state.stage+1):state;
 if(state.phase==='won'||state.phase==='lost')return state;
 let s={...state,cargo:state.cargo.slice(),remaining:state.remaining.slice()};const cfg=STAGES[s.stage];
 if(action.type==='dive'){if(s.phase!=='dock'||s.dives>=MAX_DIVES)return state;s.dives++;s.phase='diving';s.air=cfg.air;s.message='隣接する地点へ。手ぶらなら移動は酸素2。';return s;}
 if(s.phase!=='diving')return state;
 if(action.type==='move'){if(!adjacent(s.room).includes(action.to))return state;s.air-=moveCost(s);s.room=action.to;s.turn++;if(s.air<0)return lose(s);if(s.room==='S'){s.bank+=value(s);s.cargo=[];s.phase=s.bank>=cfg.quota?'won':s.dives>=MAX_DIVES?'lost':'dock';s.message=s.phase==='won'?'回収目標達成！ 宝物を母船へ届けた。':s.phase==='lost'?'3回の潜水が終了。目標には届かなかった。':'無事帰還！ 宝を預け、次のボンベで出発できる。';return s;}s.message=ROOMS.find(r=>r.id===s.room).name+'へ移動。';}
 else if(action.type==='collect'){const item=s.remaining.find(i=>i.room===s.room);if(!item||weight(s)+item.weight>CAPACITY)return state;s.air-=2;s.turn++;s.remaining=s.remaining.filter(i=>i.id!==item.id);s.cargo.push(item);s.message=item.name+'を回収。帰りの酸素を確認しよう。';}
 else if(action.type==='drop'){if(!s.cargo.length)return state;s.cargo=[];s.turn++;s.message='積み荷を全て放棄。宝は失うが、身軽に戻れる。';}
 else return state;
 if(s.air<=0)return lose(s);return s;
}
function lose(s){s.phase='lost';s.room='S';s.air=Math.max(0,s.air);s.cargo=[];s.message='酸素切れ。緊急救助で母船へ。今回の遠征は終了。';return s;}
return {ROOMS,EDGES,STAGES,MAX_DIVES,CAPACITY,create,act,weight,value,moveCost,adjacent,returnCost};
});
