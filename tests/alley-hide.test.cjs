'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../games/alley-hide/engine.js');
const W=[0,3,6,15],P=[7,8,9,14,19,18,17,12];
const distance=(a,b)=>Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5));
const rotate=m=>((m<<1)&255)|(m>>7);
const direction=(p,q)=>Math.sign(Math.floor(q/5)-Math.floor(p/5))+','+Math.sign(q%5-p%5);
function move(p,a){const d={U:-5,D:5,L:-1,R:1},q=p+d[a];return q<0||q>24||W.includes(q)||(a==='L'&&p%5===0)||(a==='R'&&p%5===4)?p:q;}
// Independent belief-state minimax. Only public observations choose a branch;
// actual hidden phase is NEVER used to select the action.
function policy(depth,allowListen=true){const memo=new Map();function search(p,mask,left){if(!mask)return {done:true};if(!left)return null;const key=[p,mask,left].join('/');if(memo.has(key))return memo.get(key);memo.set(key,null);
for(const a of ['search',...(allowListen?['listen']:[]),'U','L','R','D']){let np=p,groups={};if(a==='search'){let fail=0;for(let i=0;i<8;i++)if((mask>>i&1)&&distance(p,P[i])>0)fail|=1<<i;if(fail)groups.fail=rotate(fail);}else if(a==='listen'){for(let i=0;i<8;i++)if(mask>>i&1){const d=direction(p,P[i]);groups[d]=(groups[d]||0)|(1<<i);}for(const d in groups)groups[d]=rotate(groups[d]);}else{np=move(p,a);if(np===p)continue;groups.move=rotate(mask);}
const children={};let works=true;for(const [observation,nextMask]of Object.entries(groups)){const c=search(np,nextMask,left-1);if(!c){works=false;break;}children[observation]=c;}if(works){const node={a,p,mask,children};memo.set(key,node);return node;}}
return null;}return search(22,255,depth);}
test('public constants, initial phase normalization and immutable state',()=>{assert.deepEqual(E.walls,W);assert.deepEqual(E.path,P);assert.equal(E.limit,8);assert.equal(E.initial(-1).phase,7);assert.equal(E.initial(NaN).phase,0);assert.equal(E.initial(9).phase,1);let s=E.initial(2),copy=JSON.stringify(s);E.act(s,'listen');assert.equal(JSON.stringify(s),copy);});
test('wall 12 is open and protagonist can reach opponent route',()=>{let s=E.initial();s=E.act(E.act(s,'U'),'U');assert.equal(s.p,12);s=E.act(s,'U');assert.equal(s.p,7);});
test('invalid movement and action consume no turn or opponent step',()=>{for(let p=0;p<25;p++){if(W.includes(p))continue;for(const a of['U','D','L','R']){const s={...E.initial(3),p};const n=E.act(s,a);if(move(p,a)===p){assert.equal(n.turn,0);assert.equal(n.phase,3);assert.equal(n.p,p);}else{assert.equal(n.p,move(p,a));assert.equal(n.turn,1);assert.equal(n.phase,4);}}}let s=E.initial();assert.equal(E.act(s,'__proto__'),s);});
test('listen records pre-move direction, turn and origin; stale clue is retained',()=>{let s=E.initial(0);s=E.act(s,'listen');assert.equal(s.clue,'1手目・場所5-3から：北');assert.equal(s.phase,1);s=E.act(s,'U');assert.equal(s.clue,'1手目・場所5-3から：北');assert.equal(s.turn,2);s=E.act(s,'listen');assert.ok(s.clue.startsWith('3手目・場所4-3から：'));});
test('all nine direction labels use observed target before advancement',()=>{const positions=[0,1,2,5,6,7,10,11,12],expected=['南東','南','南西','東','同じ場所','西','北東','北','北西']; // target mocked through phase is 7; shift origins +1
for(let i=0;i<positions.length;i++){const p=positions[i]+1;const n=E.act({...E.initial(0),p},'listen');assert.ok(n.clue.endsWith(expected[i]),n.clue+' expected '+expected[i]);}});
test('search uses current phase, requires same square, not orthogonal or diagonal neighbors',()=>{for(let p=0;p<25;p++){if(W.includes(p))continue;for(let phase=0;phase<8;phase++){const s={...E.initial(phase),p};const n=E.act(s,'search');assert.equal(n.status==='won',distance(p,P[phase])===0);assert.equal(n.turn,1);assert.equal(n.phase,n.status==='won'?phase:(phase+1)%8);}}});
test('moving onto target is not automatic capture; search required',()=>{const s={...E.initial(0),p:12};const n=E.act(s,'U');assert.equal(n.p,7);assert.equal(n.phase,1);assert.equal(n.status,'playing');});
test('last-turn successful search wins before timeout; failed search loses',()=>{const yes=E.act({...E.initial(0),p:7,turn:7},'search');assert.equal(yes.status,'won');const no=E.act({...E.initial(0),turn:7},'search');assert.equal(no.status,'lost');});
test('natural timeout, terminal input ignored and retry exactly resets',()=>{let s=E.initial(6);for(let i=0;i<8;i++)s=E.act(s,'listen');assert.equal(s.status,'lost');assert.equal(s.turn,8);for(const a of['U','listen','search'])assert.equal(E.act(s,a),s);assert.deepEqual(E.initial(6),E.initial(6));});
test('independent belief solver finds 7-turn policy for every hidden phase, not 6',()=>{assert.equal(policy(6),null);const tree=policy(7);assert.ok(tree);for(let phase=0;phase<8;phase++){let s=E.initial(phase),node=tree;for(let i=0;i<7&&s.status==='playing';i++){const a=node.a;const obs=a==='listen'?direction(s.p,P[s.phase]):a==='search'?'fail':'move';s=E.act(s,a);if(s.status==='playing')node=node.children[obs];}assert.equal(s.status,'won','phase '+phase);assert.ok(s.turn<=7);}});
test('no-listen strategy cannot guarantee win within 8 turns; needs 9',()=>{assert.equal(policy(8,false),null);assert.ok(policy(9,false));});
