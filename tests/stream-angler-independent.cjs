const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path').resolve(__dirname, '..');
const E = require(path + '/games/stream-angler/engine.js');
function simulate(name, policy) {
  let s = E.start(), peak = s.tension, switches = 0, previous;
  while (s.phase === 'playing') {
    const held = !!policy(s);
    switches += previous !== undefined && previous !== held ? 1 : 0;
    previous = held;
    const before = structuredClone(s);
    const next = E.tick(s, held);
    assert.deepEqual(s, before);
    s = next;
    peak = Math.max(peak, s.tension);
    assert.ok(s.distance >= 0 && s.distance <= 100);
    assert.ok(s.tension >= 0 && s.tension <= 100);
    assert.ok(s.frame <= 2400);
  }
  return { name, phase:s.phase, reason:s.reason, time:s.time, peak, finalTension:s.tension, switches };
}
function threshold(hi, lo, cues) {
  let held = true;
  return s => {
    if ((cues && s.cue !== 'calm') || s.tension >= hi) held = false;
    else if (s.tension <= lo) held = true;
    return held;
  };
}
const policies = [
  simulate('always-reel', () => true),
  simulate('always-ease', () => false),
  simulate('blind-1s-period-50%-duty', s => s.time % 1 < 0.5),
  simulate('blind-2s-period-50%-duty', s => s.time % 2 < 1),
  simulate('blind-6s-period-50%-duty', s => s.time % 6 < 3),
  simulate('tension-only-62/26', threshold(62,26,false)),
  simulate('cue-only-calm', s => s.cue === 'calm'),
  simulate('cue-only-avoid-running', s => s.cue !== 'running'),
  simulate('cue-and-tension-62/26', threshold(62,26,true))
];
assert.equal(E.tick({...E.start(),tension:100-14/60,distance:0.01},true).reason,'line');
assert.equal(E.tick({...E.start(),frame:2399,time:2399/60,tension:20,distance:0.01},true).phase,'won');
assert.equal(E.tick({...E.start(),frame:2399,time:2399/60,tension:100-14/60,distance:0.01},true).reason,'line');
assert.equal(E.tick({...E.start(),frame:2399,time:2399/60,tension:20,distance:1},false).reason,'time');
const shared = E.start();
assert.deepEqual(E.resume(E.pause(shared)), shared);
assert.equal(E.pause({...shared,phase:'won'}).phase,'won');
function harness() {
  const handlers = {}, ids = new Map(), frames = [];
  function element(id) {
    const listeners = {}, classes = new Set();
    return {id, listeners, textContent:'', innerHTML:'', hidden:false, disabled:false, style:{}, attrs:{}, open:false,
      classList:{add(c){classes.add(c)},remove(c){classes.delete(c)},contains(c){return classes.has(c)},toggle(c,on){on?classes.add(c):classes.delete(c)}},
      setAttribute(k,v){this.attrs[k]=v}, setPointerCapture(){}, addEventListener(t,f){(listeners[t]??=[]).push(f)},
      showModal(){this.open=true},close(){this.open=false},
      fire(type,extra={}){const ev={prevented:false,preventDefault(){this.prevented=true},...extra};for(const f of listeners[type]??[])f(ev);return ev;}
    };
  }
  const document = {hidden:false,getElementById(id){if(!ids.has(id))ids.set(id,element(id));return ids.get(id)},querySelector(){return element('river')},addEventListener(t,f){(handlers[t]??=[]).push(f)}};
  const windows = {};
  const context = vm.createContext({StreamAngler:E,document,window:{addEventListener(t,f){(windows[t]??=[]).push(f)}},requestAnimationFrame(f){frames.push(f)}});
  vm.runInContext(fs.readFileSync(path+'/games/stream-angler/app.js','utf8'),context);
  return {ids, fire(type,extra={}){const ev={repeat:false,prevented:false,preventDefault(){this.prevented=true},...extra};for(const f of handlers[type]??[])f(ev);return ev}, blur(){for(const f of windows.blur??[])f()}, advance(now){assert.ok(frames.length);frames.shift()(now)}};
}
const ready = harness();
const spaceReady = ready.fire('keydown',{code:'Space',target:ready.ids.get('start')});
const aliases = harness();aliases.ids.get('start').fire('click');aliases.fire('keydown',{code:'Space'});aliases.fire('keydown',{code:'KeyR'});aliases.fire('keyup',{code:'Space'});
const mixed = harness();mixed.ids.get('start').fire('click');mixed.ids.get('reel').fire('pointerdown',{pointerId:4,button:0});mixed.fire('keydown',{code:'KeyR'});mixed.fire('keyup',{code:'KeyR'});
const timing=harness();timing.ids.get('start').fire('click');timing.fire('keydown',{code:'KeyR'});timing.advance(1000);timing.advance(1300);const timeAfter300ms=timing.ids.get('time').textContent;const distanceAfter300ms=timing.ids.get('distance').textContent;
const blurred=harness();blurred.ids.get('start').fire('click');blurred.fire('keydown',{code:'KeyR'});blurred.blur();
assert.equal(blurred.ids.get('reel').classList.contains('held'),false);assert.equal(blurred.ids.get('start').textContent,'再開する');
assert.equal(spaceReady.prevented,false);
assert.equal(aliases.ids.get('reel').classList.contains('held'),true);
assert.equal(mixed.ids.get('reel').classList.contains('held'),true);
assert.equal(distanceAfter300ms,62);
const stalled=harness();stalled.ids.get('start').fire('click');stalled.fire('keydown',{code:'KeyR'});stalled.advance(1000);stalled.advance(1600);
assert.equal(stalled.ids.get('start').textContent,'再開する');
assert.equal(stalled.ids.get('reel').classList.contains('held'),false);
assert.equal(stalled.ids.get('distance').textContent,65);
assert.equal(blurred.fire('keydown',{code:'Space',target:blurred.ids.get('start')}).prevented,false);
const pointerup=harness();pointerup.ids.get('start').fire('click');pointerup.fire('keydown',{code:'KeyR'});pointerup.ids.get('reel').fire('pointerdown',{pointerId:7,button:0});pointerup.ids.get('reel').fire('pointerup',{pointerId:7});
assert.equal(pointerup.ids.get('reel').classList.contains('held'),true);
const cancelled=harness();cancelled.ids.get('start').fire('click');cancelled.ids.get('reel').fire('pointerdown',{pointerId:9,button:0});cancelled.ids.get('reel').fire('pointercancel',{pointerId:9});
assert.equal(cancelled.ids.get('reel').classList.contains('held'),false);
const floor=harness();floor.ids.get('start').fire('click');floor.advance(1000);let down=false;
for(let i=1;i<=2400&&floor.ids.get('overlay').hidden;i++){
  const desired=floor.ids.get('cue').textContent==='おだやか';
  if(desired!==down){floor.fire(desired?'keydown':'keyup',{code:'KeyR'});down=desired;}
  floor.advance(1000+i*1000/60);
}
assert.equal(floor.ids.get('result-title').textContent,'魚を引き寄せた！');
assert.equal(floor.ids.get('tension').textContent,'99%');
assert.equal(floor.ids.get('reel').classList.contains('held'),false);
console.log(JSON.stringify({policies,boundaries:'pass: line>landing>deadline, terminal freeze, state immutability',controller:{spaceReadyDefaultPrevented:spaceReady.prevented,remainingAliasStillHeld:aliases.ids.get('reel').classList.contains('held'),remainingPointerStillHeld:mixed.ids.get('reel').classList.contains('held'),after300ms:{time:timeAfter300ms,distance:distanceAfter300ms},blurPauseClearsHeld:true,longGapPauses:true,successTensionDisplay:floor.ids.get('tension').textContent}},null,2));
