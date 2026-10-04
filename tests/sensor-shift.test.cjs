const assert=require('node:assert/strict');
const E=require('../games/sensor-shift/engine.js');
assert.equal(E.simulate(0).state,'collision');
for(const a of [-40,-35,35,40])assert.equal(E.simulate(a).state,'success');
for(let a=-45;a<=45;a++){
 const s=E.create(a);let steps=0;
 while(s.state==='running'){
  const old={x:s.x,y:s.y,turns:s.turns,heading:s.heading,armed:s.armed};const q=E.sense(s);E.step(s);steps++;
  assert.ok(Math.abs(Math.hypot(s.x-old.x,s.y-old.y)-.75)<1e-7,'constant speed / no goal snapping');
  if(s.turns>old.turns){assert.ok(q.hit&&old.armed);assert.ok(Math.abs(s.heading-old.heading-Math.PI/2)<1e-7)}
  assert.ok(steps<=1442);
 }
 assert.deepEqual(E.simulate(a),s,'deterministic replay');
}
assert.equal(E.ray(65,205,0),265);
assert.equal(E.ray(230,205,0),100);
const successes=[];for(let a=-45;a<=45;a++)if(E.simulate(a).state==='success')successes.push(a);
console.log('PASS: 91 angles; constant speed; right-turn trigger; deterministic replay; collision/goal/timeout.');
console.log('Success angles:',JSON.stringify(successes));
