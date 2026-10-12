const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../games/spark-shield/engine.js');

const actions = ['strike', 'guard', 'dodge', 'burst', 'rest'];
const copy = s => JSON.parse(JSON.stringify(s));
const signature = s => [s.foe, s.hp, s.stamina, s.sparks, s.enemyHP, s.turn, s.status].join(',');
const core = s => ({hp:s.hp, stamina:s.stamina, sparks:s.sparks, enemyHP:s.enemyHP, turn:s.turn, status:s.status, last:s.last});

// Deliberately separate arithmetic from the production transition implementation.
function oracle(s, action) {
  const cost = {strike:1, guard:1, dodge:2, burst:2, rest:0}[action];
  if (s.status !== 'playing' || cost === undefined || s.stamina < cost || (action === 'burst' && s.sparks === 0)) return null;
  const p = E.FOES[s.foe].pattern;
  const incoming = p[s.turn % p.length];
  const spent = action === 'burst' ? s.sparks : 0;
  const dealt = action === 'strike' ? 3 : action === 'burst' ? 4 + 3 * spent : 0;
  const enemyHP = Math.max(0, s.enemyHP - dealt);
  const blocked = enemyHP === 0 ? 0 : action === 'dodge' ? incoming : action === 'guard' ? Math.min(incoming, 4) : 0;
  const taken = enemyHP === 0 ? 0 : incoming - blocked;
  const gained = enemyHP > 0 && action === 'guard' && incoming > 0 && s.sparks < 3 ? 1 : 0;
  const hp = Math.max(0, s.hp - taken);
  const turn = s.turn + 1;
  return {hp, stamina:Math.min(4, s.stamina - cost + (action === 'rest' ? 3 : 0)), sparks:s.sparks - spent + gained,
    enemyHP, turn, status:enemyHP === 0 ? 'won' : hp === 0 ? 'lost' : turn >= s.maxTurns ? 'timeout' : 'playing',
    last:{action, incoming, dealt, taken, gained, blocked, spent}};
}

function child(s, action) {
  const next = {...s, history:[], log:[]};
  if (!E.act(next, action)) return null;
  next.history = [];
  return next;
}

// Full-pattern search gives an existence/upper-bound result, not a forecast-only
// player model, human success rate, or evidence of fun.
function solve(foe, forbidden) {
  const memo = new Map();
  function visit(s) {
    if (s.status === 'won') return {hp:s.hp, turn:s.turn, route:[]};
    if (s.status !== 'playing') return null;
    const key = signature(s);
    if (memo.has(key)) return memo.get(key);
    let best = null;
    for (const a of actions) {
      if (a === forbidden) continue;
      const next = child(s,a);
      if (!next) continue;
      const result = visit(next);
      if (result && (!best || result.hp > best.hp || result.hp === best.hp && result.turn < best.turn)) best = {...result,route:[a,...result.route]};
    }
    memo.set(key,best);
    return best;
  }
  return visit(E.create(foe));
}

function run(foe, policy) {
  const s = E.create(foe);
  while (s.status === 'playing') {
    let a = policy(s);
    // These baselines are blind to forecasts except where explicitly stated.
    // An unaffordable attempted action becomes a normal, vulnerable rest.
    if (!E.can(s,a)) a = 'rest';
    E.act(s,a);
  }
  return s;
}

test('independent arithmetic matches every action from every reachable playing state', () => {
  const queue = E.FOES.map((_,i)=>E.create(i));
  const seen = new Set(queue.map(signature));
  for (let i=0;i<queue.length;i++) {
    const s = queue[i];
    if (s.status !== 'playing') continue;
    for (const a of [...actions,'invalid']) {
      const expected = oracle(s,a);
      const next = copy(s);
      assert.equal(E.act(next,a), expected !== null);
      if (!expected) { assert.deepEqual(next,s); continue; }
      assert.deepEqual(core(next),expected,`${signature(s)} / ${a}`);
      assert.equal(next.history.length,s.history.length+1);
      next.history=[];
      next.log=[];
      const key=signature(next);
      if (!seen.has(key)) {seen.add(key);queue.push(next);}
    }
  }
  assert.ok(seen.size > 1000);
});

test('all foes have production-input victories; later foes require the spark mechanic', () => {
  for (let i=0;i<E.FOES.length;i++) {
    const best=solve(i);
    assert.ok(best,`foe ${i} must be winnable`);
    assert.ok(best.turn <= 14);
    const state=E.create(i);
    for (const a of best.route) assert.ok(E.act(state,a));
    assert.equal(state.status,'won');
    if (i>0) {
      assert.equal(solve(i,'guard'),null);
      assert.equal(solve(i,'burst'),null);
    }
  }
  assert.equal(solve(1,'dodge'),null,'iron must reward reserving stamina to dodge');
  assert.ok(solve(2,'dodge'),'obsidian must also permit accepting guarded damage');
});

test('complete winning history undoes exactly, including terminal state and logs', () => {
  for(let i=0;i<E.FOES.length;i++) {
    const state=E.create(i),snapshots=[];
    for(const a of solve(i).route) {snapshots.push(copy(state));assert.ok(E.act(state,a));}
    const terminal=copy(state);
    for(const a of actions) {assert.equal(E.act(state,a),false);assert.deepEqual(state,terminal);}
    while(snapshots.length) {assert.ok(E.undo(state));assert.deepEqual(state,snapshots.pop());}
    assert.equal(E.undo(state),false);
    assert.deepEqual(state,E.create(i));
  }
});

test('ordinary strikes can appear in a winning route for every foe', () => {
  const routes = [
    ['strike','strike','strike','guard','rest','burst'],
    ['strike','guard','burst','rest','dodge','rest','dodge','guard','rest','guard','burst'],
    ['guard','guard','guard','rest','dodge','burst','rest','guard','dodge','rest','strike','burst']
  ];
  routes.forEach((route,i)=>{
    const s=E.create(i);
    for(const a of route) assert.ok(E.act(s,a),`foe ${i}: ${a}`);
    assert.equal(s.status,'won',`foe ${i}: strike must not be an irreversible trap`);
  });
});

test('passivity, attack spam and two short reactive shield loops cannot clear all foes', () => {
  const policies = {
    passive:()=> 'rest',
    strikeSpam:()=> 'strike',
    twoSparks:s=>s.sparks>=2&&E.can(s,'burst')?'burst':E.intent(s)>0&&E.can(s,'guard')?'guard':'rest',
    safeOpening:s=>s.sparks>0&&E.can(s,'burst')&&(4+3*s.sparks>=s.enemyHP||E.intent(s)===0)?'burst':E.intent(s)>0&&E.can(s,'guard')?'guard':'rest'
  };
  for(const [name,policy]of Object.entries(policies)) {
    const results=E.FOES.map((_,i)=>run(i,policy));
    assert.ok(results.some(s=>s.status!=='won'),name);
    if(name==='passive'||name==='strikeSpam') assert.ok(results.every(s=>s.status!=='won'),name);
  }
});

test('no blind action cycle of length one through six wins against all three foes', () => {
  for(let length=1;length<=6;length++) {
    for(let code=0;code<actions.length**length;code++) {
      let n=code;
      const sequence=Array.from({length},()=>{const a=actions[n%actions.length];n=Math.floor(n/actions.length);return a;});
      let allWon=true;
      for(let i=0;i<E.FOES.length;i++) {
        if(run(i,s=>sequence[s.turn%length]).status!=='won') {allWon=false;break;}
      }
      assert.equal(allWon,false,sequence.join(','));
    }
  }
});

module.exports = {solve};
