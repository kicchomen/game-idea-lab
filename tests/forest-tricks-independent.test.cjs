const test=require('node:test'),A=require('node:assert/strict'),E=require('../games/forest-tricks/engine');
const winner=(a,b,lead,trump)=>{const rank=c=>c.value+ (c.suit===trump?200:c.suit===lead?100:0);return rank(a)>rank(b)?0:1;};
test('independent exhaustive 100 deals: legal response, oracle winner, accounting, result, immutability',()=>{
 let leaves=0;for(let seed=0;seed<100;seed++){
 const visit=s=>{const snapshot=JSON.stringify(s);const allowed=s.lead&&s.hands[0].some(c=>c.suit===s.lead.suit)?s.hands[0].filter(c=>c.suit===s.lead.suit):s.hands[0];
 for(const c of allowed){let t=E.play(s,c.id);A.equal(JSON.stringify(s),snapshot);const last=t.last;A.equal(last.winner,winner(last.player,last.opponent,s.lead?s.lead.suit:c.suit,s.trump));
 if(!s.lead&&s.hands[1].some(o=>o.suit===c.suit))A.equal(last.opponent.suit,c.suit);
 A.equal(new Set(t.history.flatMap(h=>[h.player.id,h.opponent.id])).size,t.trick*2);A.equal(t.wins,t.history.filter(h=>h.winner===0).length);
 for(const id of [undefined,null,3,'bad',c.id])A.strictEqual(E.play(t,id),t);
 t=E.next(t);if(t.phase==='result'){leaves++;A.equal(t.trick,5);A.equal(t.hands.flat().length,0);A.equal(t.result,t.wins===t.bid?'success':'failure');A.strictEqual(E.next(t),t);}else visit(t);
 }};visit(E.bid(E.create(seed),seed%6));}console.log('independent terminal routes',leaves);
});
test('all pairs of actual cards with both trumps match independent winner oracle',()=>{const cs=['leaf','water'].flatMap(s=>Array.from({length:7},(_,i)=>({suit:s,value:i+1})));for(const a of cs)for(const b of cs)if(a.suit!==b.suit||a.value!==b.value)for(const t of ['leaf','water'])for(const l of [a.suit,b.suit])A.equal(E.beats(a,b,l,t),winner(a,b,l,t)===0);});
