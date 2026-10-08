(function(root){
'use strict';
const SIZE=7;
const missions=[
 {name:'01 風下の集落',subtitle:'まずは3軒へ。火の先回りを覚える',fires:[[2,0],[4,0]],water:3,winds:['S','S','E','S','W','S'],limit:10,burnLimit:8},
 {name:'02 横風の尾根',subtitle:'左右から来る火。防火帯で時間をつくる',fires:[[0,1],[6,1],[3,0]],water:2,winds:['S','E','W','S','S','E'],limit:10,burnLimit:8},
 {name:'03 水の少ない朝',subtitle:'水は各隊員1回分。井戸への帰路も考える',fires:[[1,0],[5,0],[3,1]],water:1,winds:['S','S','W','E','S','S'],limit:12,burnLimit:8}
];
const dirs={S:[0,1],E:[1,0],W:[-1,0]};
const key=(x,y)=>`${x},${y}`; const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
function create(id=0){id=Math.max(0,Math.min(missions.length-1,Number.isInteger(id)?id:0));const m=missions[id];const s={mission:id,round:1,status:'playing',selected:0,mode:'move',message:'隊員を選び、光るマスを押してください。2人とも2行動ずつ使えます。',crews:[{x:1,y:6,water:m.water,ap:2},{x:5,y:6,water:m.water,ap:2}],cells:Array.from({length:49},(_,i)=>({x:i%7,y:Math.floor(i/7),kind:Math.floor(i/7)===6?'road':'forest',fire:0,wet:0})),rescued:0,burned:0,actions:0};
 [[1,3],[5,3],[3,5]].forEach(([x,y])=>Object.assign(cell(s,x,y),{kind:'house',saved:false}));[[0,6],[6,6]].forEach(([x,y])=>cell(s,x,y).kind='well');m.fires.forEach(([x,y])=>cell(s,x,y).fire=1);return s;}
function cell(s,x,y){return x>=0&&x<7&&y>=0&&y<7?s.cells[y*7+x]:null;}
function wind(s){return missions[s.mission].winds[(s.round-1)%missions[s.mission].winds.length];}
function forecast(s){const d=dirs[wind(s)],seen=new Set(),out=[];for(const c of s.cells.filter(c=>c.fire)){const offsets=[d];if(s.round%2===0) offsets.push(d[0]===0?[-1,0]:[0,-1],d[0]===0?[1,0]:[0,1]);for(const [dx,dy]of offsets){const t=cell(s,c.x+dx,c.y+dy);if(t&&!t.fire&&!t.wet&&['forest','house'].includes(t.kind)&&!seen.has(key(t.x,t.y))){seen.add(key(t.x,t.y));out.push(t);}}}return out;}
function reachable(s,crew){const q=[{x:crew.x,y:crew.y,n:0}],seen=new Set([key(crew.x,crew.y)]),out=[];while(q.length){const p=q.shift();if(p.n===2)continue;for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const t=cell(s,p.x+dx,p.y+dy);if(!t||t.fire||seen.has(key(t.x,t.y)))continue;seen.add(key(t.x,t.y));out.push(t);q.push({x:t.x,y:t.y,n:p.n+1});}}return out;}
function targets(s,mode=s.mode){if(s.status!=='playing')return[];const p=s.crews[s.selected];if(!p.ap)return[];if(mode==='move')return reachable(s,p);const hazards=mode==='water'?[...s.cells.filter(c=>c.fire),...forecast(s)]:[];return s.cells.filter(t=>{const d=dist(p,t);if(mode==='water')return p.water>0&&d<=2&&hazards.some(f=>Math.abs(f.x-t.x)<=1&&Math.abs(f.y-t.y)<=1);if(mode==='cut')return d<=1&&t.kind==='forest'&&!t.fire;if(mode==='rescue')return d<=1&&t.kind==='house'&&!t.saved&&!t.fire;if(mode==='refill')return d<=1&&t.kind==='well'&&p.water<3;return false;});}
function check(s){if(s.burned>missions[s.mission].burnLimit){s.status='lost';s.message='森の焼失が上限を超えました。放水と防火帯で、燃え広がる前に止めよう。';return;}if(s.cells.some(c=>c.kind==='ruin'&&!c.saved)){s.status='lost';s.message='救助前の家まで火が届きました。ひと手戻して、風下への先回りを試そう。';return;}if(s.rescued===3&&!s.cells.some(c=>c.fire)){s.status='won';s.message='3組の住民を救助し、火をすべて止めました！';}}
function act(s,x,y){if(s.status!=='playing')return false;const t=targets(s).find(t=>t.x===x&&t.y===y);if(!t){s.message=!s.crews[s.selected].ap?'この隊員の行動は終了。もう1人を選ぶか、風を進めてください。':s.mode==='water'&&!s.crews[s.selected].water?'水がありません。道の両端の井戸へ戻って補給しよう。':'光るマスが行動できる範囲です。隊員・行動を切り替えてみよう。';return false;}const p=s.crews[s.selected],mode=s.mode;p.ap--;s.actions++;if(mode==='move'){p.x=x;p.y=y;s.message='移動しました。1行動で道のり2マスまで。';}if(mode==='cut'){t.kind='break';s.message='防火帯を作りました。このマスへ火は移りません。';}if(mode==='water'){p.water--;for(const c of s.cells)if(Math.abs(c.x-x)<=1&&Math.abs(c.y-y)<=1){c.fire=0;if(c.kind==='forest'||c.kind==='house')c.wet=2;}s.message='3×3マスへ放水。火を消し、次の2回の延焼を防ぎます。';}if(mode==='rescue'){t.saved=true;s.rescued++;s.message='住民を救助！ 残る火もすべて止めよう。';}if(mode==='refill'){p.water=3;s.message='井戸で水を3回分まで補給しました。';}check(s);return true;}
function advance(s){if(s.status!=='playing')return false;const incoming=forecast(s).map(c=>[c.x,c.y]);for(const c of s.cells){if(c.fire){c.fire++;if(c.fire>3){c.fire=0;if(c.kind==='forest'){c.kind='ash';s.burned++;}}}if(c.wet)c.wet--;}
for(const [x,y] of incoming){const c=cell(s,x,y);if(c.kind==='house'){c.kind='ruin';c.fire=1;}else c.fire=1;}
let retreated=false;for(const p of s.crews){if(cell(s,p.x,p.y).fire){retreated=true;p.x=p===s.crews[0]?1:5;p.y=6;p.water=Math.max(0,p.water-1);s.message='隊員は安全な道へ退避。水を1回分失いました。';}p.ap=2;}
check(s);if(s.status==='playing'&&s.round>=missions[s.mission].limit){s.status='lost';s.message='交代時刻です。救助と鎮火の両方を終えられませんでした。';}else if(s.status==='playing'){s.round++;s.message=retreated?'隊員は安全な道へ退避し、水を1回分失いました。次の延焼予告を確認しよう。':'風が進みました。赤い点線のマスが次の延焼予告です。';}return true;}
const api={SIZE,missions,create,cell,wind,forecast,reachable,targets,act,advance};if(typeof module!=='undefined')module.exports=api;else root.Firebreak=api;
})(typeof globalThis!=='undefined'?globalThis:this);
