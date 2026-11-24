"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const E=require("../games/ceiling-runner/engine.js");
const run=(times,maxTicks=E.GOAL/E.SPEED/E.DT+2)=>{
  let s=E.create("running"), moves=times.map(x=>Math.round(x/E.DT));
  for(let i=0;i<maxTicks&&s.mode==="running";i++){
    if(moves.includes(i))s=E.command(s,"flip");
    s=E.step(s);
  }
  return s;
};
test("A new point check starts at the floor with nothing saved",()=>{
  assert.deepEqual(E.create(),{mode:"ready",x:0,y:E.BOTTOM,target:E.BOTTOM,marks:0,ticks:0,cause:null});
  assert.equal(E.command(E.create(),"go").mode,"running");
});
test("At rest control and physics preserve ready state",()=>{
  const s=E.create(); assert.equal(E.command(s,"flip"),s); assert.equal(E.step(s),s);
});
test("A physical tap changes destination, does not teleport, and progresses horizontally",()=>{
  const a=E.create("running"), b=E.command(a,"flip"), c=E.step(b);
  assert.equal(b.target,E.TOP);assert.equal(b.y,E.BOTTOM);
  assert.equal(c.y,E.BOTTOM-E.LIFT*E.DT);assert.equal(c.x,E.SPEED*E.DT);
});
test("Cannot reverse again until the current destination has been reached",()=>{
  let s=E.command(E.create("running"),"flip");
  assert.equal(E.command(s,"flip"),s);
  for(let i=0;i<69;i++){s=E.step(s);assert.notEqual(s.y,E.TOP);}
  s=E.step(s);assert.equal(s.y,E.TOP);
  assert.equal(E.command(s,"flip").target,E.BOTTOM);
});
test("Pause preserves position, velocity direction and score; resume changes none of those",()=>{
  const a=run([1.3],180), b=E.command(a,"pause");
  assert.equal(b.mode,"paused");assert.equal(E.step(b),b);assert.equal(E.command(b,"flip"),b);
  assert.deepEqual(E.command(b,"resume"),a);
});
test("A circle touching a rectangular corner is not inside the hazard",()=>{
  assert.equal(E.hits(9,9,[0,1,0,1]),false);
  assert.equal(E.hits(7,7,[0,1,0,1]),true);
});
test("No inputs hits the first floor hazard and locks simulation",()=>{
  const s=run([]);
  assert.equal(s.mode,"failed");assert.equal(s.cause,"collision");
  assert.ok(s.x>142 && s.x<151);assert.equal(E.count(s.marks),1);
  assert.equal(E.step(s),s);assert.equal(E.command(s,"flip"),s);
});
test("Hazards are encountered in sorted order and markers lie outside their hit radii",()=>{
  E.hazards.forEach(([a,b,y,z],i)=>{
    assert.ok(0<a&&a<b&&b<E.GOAL&&0<y&&y<z&&z<E.H);
    if(i)assert.ok(E.hazards[i-1][1]<a);
  });
  E.points.forEach(([x,y])=>assert.ok(!E.hazards.some(h=>E.hits(x,y,h))));
});
const FULL=[1.30,3.10,4.80,6.90,8.60,10.30], PASS=[1.30,3.10,4.80,6.90,8.20,9.80];
test("Timed route clears all six markers without clipping an obstacle",()=>{
  const s=run(FULL);
  assert.equal(s.mode,"won");assert.equal(s.x,E.GOAL);assert.equal(E.count(s.marks),6);
});
test("Different route that skips the last two markers remains eligible for success",()=>{
  const s=run(PASS);
  assert.equal(s.mode,"won");assert.equal(E.count(s.marks),4);
});
test("The documented full and threshold routes tolerate independent ±0.1s timing error",()=>{
  for(const [route,n] of [[FULL,6],[PASS,4]])
    for(let bits=0;bits<64;bits++){
      const s=run(route.map((x,i)=>x+((bits>>i)&1?.1:-.1)));
      assert.equal(s.mode,"won", "timing mask "+bits);
      assert.equal(E.count(s.marks),n,"timing mask "+bits);
    }
});
test("Retry erases elapsed ticks, position, target, cause and all prior points",()=>{
  for(const a of [run(FULL),run([]),E.command(run([1.3],180),"pause")])
    assert.deepEqual(E.command(a,"restart"),E.create("running"));
});
test("A physically clear run can still fail for having too few markers",()=>{
  const s=run([.70,3.10,4.80,6.90,8.20,9.80]);
  assert.equal(s.x,E.GOAL);assert.equal(s.mode,"failed");
  assert.equal(s.cause,"missed");assert.equal(E.count(s.marks),3);
});
