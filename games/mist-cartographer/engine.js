(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MistCartographer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SIZE=6, GOAL=2;
const MAPS=[
{name:'白波の島',budget:22,rows:['..L#..','.#..L.','..F#..','L.F...','..#F..','C.....']},
{name:'杉影の島',budget:24,rows:['......','F##.L.','L.F#..','..F.F.','.#.LF.','C.....']},
{name:'双岬の島',budget:24,rows:['L..#L.','.#....','..F#..','.#..L.','...F..','C.....']}
];
const DIRS={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
const clone=s=>JSON.parse(JSON.stringify(s));
function pos(x,y){return y*SIZE+x;}
function xy(i){return[i%SIZE,Math.floor(i/SIZE)];}
function cells(m){return MAPS[m].rows.join('').split('');}
function neighbors(i){const[x,y]=xy(i);return Object.entries(DIRS).map(([dir,[dx,dy]])=>({dir,x:x+dx,y:y+dy})).filter(p=>p.x>=0&&p.x<SIZE&&p.y>=0&&p.y<SIZE).map(p=>({dir:p.dir,id:pos(p.x,p.y)}));}
function reveal(s,radius){const[x,y]=xy(s.at);for(let i=0;i<36;i++){const[a,b]=xy(i);if(Math.abs(x-a)+Math.abs(y-b)<=radius)s.known[i]=true;}}
function create(map=0){map=Number.isInteger(map)&&map>=0&&map<MAPS.length?map:0;const s={map,at:30,left:MAPS[map].budget,known:Array(36).fill(false),visited:Array(36).fill(false),landmarks:[],status:'playing',turn:0,message:'霧の向こうを調べて、名所を2つ訪ねよう。'};s.visited[30]=true;reveal(s,1);return s;}
function moveCost(s,id){return cells(s.map)[id]==='F'?2:1;}
function knownReturn(s){const terrain=cells(s.map),dist=Array(36).fill(Infinity);dist[s.at]=0;const open=[s.at];while(open.length){open.sort((a,b)=>dist[a]-dist[b]);const i=open.shift();if(i===30)return dist[i];for(const {id} of neighbors(i)){if(!s.known[id]||terrain[id]==='#')continue;const n=dist[i]+moveCost(s,id);if(n<dist[id]){dist[id]=n;if(!open.includes(id))open.push(id);}}}return Infinity;}
function act(state,action){if(!state||state.status!=='playing')return state;const s=clone(state),terrain=cells(s.map);if(action==='survey'){const before=s.known.filter(Boolean).length;if(s.left<2)return state;reveal(s,3);if(s.known.filter(Boolean).length===before)return state;s.left-=2;s.message='見渡して、遠くの地形を地図に記した。';}
else if(action==='finish'){if(s.at!==30)return state;s.status=s.landmarks.length>=GOAL?'won':'lost';s.message=s.status==='won'?'調査完了！ 名所を記した地図を持ち帰った。':'今日は調査終了。名所が2つに届かなかった。';s.turn++;return s;}
else if(DIRS[action]){const n=neighbors(s.at).find(n=>n.dir===action);if(!n||!s.known[n.id]||terrain[n.id]==='#')return state;const cost=moveCost(s,n.id);if(s.left<cost)return state;s.at=n.id;s.left-=cost;s.visited[s.at]=true;reveal(s,1);if(terrain[s.at]==='L'&&!s.landmarks.includes(s.at)){s.landmarks.push(s.at);s.message=`名所を記録！ ${s.landmarks.length} / 2か所。`;}else s.message=terrain[s.at]==='F'?'森を抜けた。昼を2使った。':'一歩進んで、周囲の霧が晴れた。';}
else return state;
s.turn++;if(s.left===0){s.status=s.at===30&&s.landmarks.length>=GOAL?'won':'lost';s.message=s.status==='won'?'日暮れちょうどに帰還。調査完了！':'日が暮れた。調査はここまで。もう一度、道を選ぼう。';}return s;}
function view(s){const t=cells(s.map);return t.map((kind,id)=>({id,kind:s.known[id]?kind:'?',visited:s.visited[id],at:id===s.at,recorded:s.landmarks.includes(id)}));}
function canSurvey(s){if(s.status!=='playing'||s.left<2)return false;const n=clone(s);reveal(n,3);return n.known.some((v,i)=>v&&!s.known[i]);}
return {SIZE,GOAL,MAPS,DIRS,create,act,view,neighbors,knownReturn,canSurvey,moveCost};
});
