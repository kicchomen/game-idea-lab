'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../games/tiny-tug/engine.js');
const { LEVEL: L } = E;
const ready = () => E.start(E.createGame());
function drive(game, x, y, budget = 12) {
  let spent = 0;
  while (E.distance(game.tug, { x, y }) > 3 && game.status === 'playing' && spent < budget) {
    const dx = x - game.tug.x, dy = y - game.tug.y;
    // Actual steering input, not teleportation: slow down as we approach a waypoint.
    const d = Math.max(20, Math.hypot(dx, dy));
    E.advance(game, { x: dx / d, y: dy / d }, 1 / 60); spent += 1 / 60;
  }
  assert.ok(E.distance(game.tug, { x, y }) <= 3 || game.status === 'won', `Could not reach (${x}, ${y}); ${game.status}`);
}
function route(game, waypoints) { for (const [x, y] of waypoints) drive(game, x, y); }

test('ready state and level have six safely placed boats, five hull, and a 90-second mission', () => {
  const game = E.createGame();
  assert.equal(game.status, 'ready'); assert.equal(game.hull, 5); assert.equal(game.time, 90);
  assert.equal(game.boats.length, 6); assert.equal(game.rescued, 0);
  for (const body of [...game.boats, game.tug]) {
    for (const reef of L.reefs) assert.ok(E.distance(body, reef) > body.radius + reef.radius + 12);
    assert.ok(body.x > body.radius && body.y > body.radius);
    assert.ok(body.x < L.width - body.radius && body.y < L.height - body.radius);
  }
});

test('ready does not advance; start is idempotent', () => {
  const game = E.createGame(); E.advance(game, { x: 1 }, 2);
  assert.equal(game.elapsed, 0); E.start(game); E.advance(game, { x: 1 }, .2);
  const elapsed = game.elapsed; E.start(game); assert.equal(game.elapsed, elapsed);
});

test('steering has inertia and releasing controls brakes the tug', () => {
  const game = ready(), startX = game.tug.x;
  E.advance(game, { x: 1 }, .1);
  assert.ok(game.tug.x > startX); assert.ok(game.tug.vx > 0 && game.tug.vx < 100);
  E.advance(game, {}, 1); assert.ok(Math.abs(game.tug.vx) < .1);
});

test('diagonal inputs are normalized; malformed values cannot corrupt state', () => {
  const a = ready(), b = ready(); a.tug.x = b.tug.x = 60; a.tug.y = b.tug.y = 150;
  E.advance(a, { x: 1 }, .3); E.advance(b, { x: 1, y: 1 }, .3);
  assert.ok(Math.abs(Math.hypot(a.tug.vx, a.tug.vy) - Math.hypot(b.tug.vx, b.tug.vy)) < 1e-8);
  E.advance(a, { x: Infinity, y: NaN }, .1); E.advance(a, {}, NaN);
  assert.ok(Number.isFinite(a.tug.x)); assert.ok(Number.isFinite(a.time));
});

test('same steering duration is deterministic at 30, 60 and 144 render frames per second', () => {
  function simulate(fps) {
    const game = ready();
    for (const vector of [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 0 }]) {
      for (let i = 0; i < fps; i++) E.advance(game, vector, 1 / fps);
    }
    return game;
  }
  const states = [30, 60, 144].map(simulate);
  for (const game of states.slice(1)) {
    for (const key of ['x', 'y', 'vx', 'vy']) assert.ok(Math.abs(game.tug[key] - states[0].tug[key]) < 1e-8, key);
    assert.ok(Math.abs(game.time - states[0].time) < 1e-8);
    assert.deepEqual(game.tow, states[0].tow); assert.equal(game.hull, states[0].hull);
  }
});

test('nearby stranded boats attach automatically, up to three', () => {
  const game = ready(); game.tug.x = 90; game.tug.y = 340;
  for (let i = 0; i < 4; i++) Object.assign(game.boats[i], { x: 95 + i, y: 340 });
  E.advance(game, {}, E.STEP);
  assert.deepEqual(game.tow, [0, 1, 2]); assert.equal(game.boats[3].status, 'waiting');
  assert.equal(game.maxTow, 3);
});

test('boats follow at rope length and a full convoy slows the tug', () => {
  const game = ready(); game.tug.x = 75; game.tug.y = 290;
  Object.assign(game.boats[0], { x: 75, y: 302 }); E.advance(game, {}, E.STEP);
  E.advance(game, { y: -1 }, .6);
  const boat = game.boats[0];
  assert.equal(boat.status, 'towed'); assert.ok(E.distance(boat, game.tug) <= 29.001);
  assert.ok(boat.y > game.tug.y); assert.ok(game.tug.vy > -94);
});

test('one, two or three attached boats are all delivered on entering the harbor', () => {
  for (const count of [1, 2, 3]) {
    const game = ready(); game.tug.x = 56; game.tug.y = 291;
    for (let i = 0; i < count; i++) Object.assign(game.boats[i], { x: 58 + i, y: 290 });
    E.advance(game, {}, E.STEP); assert.equal(game.tow.length, count);
    drive(game, L.harbor.x, L.harbor.y);
    assert.equal(game.rescued, count); assert.equal(game.tow.length, 0); assert.equal(game.trips, 1);
    assert.ok(game.boats.slice(0, count).every(boat => boat.status === 'rescued'));
  }
});

test('reef collision costs hull and gives short protection from repeated damage', () => {
  const game = ready(), reef = L.reefs[0];
  Object.assign(game.tug, { x: reef.x, y: reef.y }); E.advance(game, {}, E.STEP);
  assert.equal(game.hull, 4); assert.equal(game.hits, 1);
  assert.ok(E.distance(game.tug, reef) >= reef.radius + game.tug.radius);
  Object.assign(game.tug, { x: reef.x, y: reef.y }); E.advance(game, {}, E.STEP);
  assert.equal(game.hull, 4); assert.ok(game.invulnerable > 0);
});

test('a tail collision detaches only the struck ship and ships behind it', () => {
  const game = ready(), reef = L.reefs[0];
  Object.assign(game.tug, { x: reef.x + 70, y: reef.y });
  Object.assign(game.boats[0], { x: reef.x + 49, y: reef.y, status: 'towed' });
  Object.assign(game.boats[1], { x: reef.x + 30, y: reef.y, status: 'towed' });
  Object.assign(game.boats[2], { x: reef.x + 5, y: reef.y, status: 'towed' });
  game.tow = [0, 1, 2]; E.advance(game, {}, E.STEP);
  assert.deepEqual(game.tow, [0]); assert.equal(game.hull, 4);
  assert.equal(game.boats[1].status, 'waiting'); assert.equal(game.boats[2].status, 'waiting');
  assert.ok(game.boats[1].cooldown > 0);
});

test('dropped cargo can be picked up again after its short cooldown', () => {
  const game = ready(), reef = L.reefs[0];
  Object.assign(game.tug, { x: reef.x + 55, y: reef.y });
  Object.assign(game.boats[0], { x: reef.x + 30, y: reef.y, status: 'towed' });
  game.tow = [0]; E.advance(game, {}, E.STEP);
  assert.equal(game.tow.length, 0); E.advance(game, {}, 1);
  assert.equal(game.tow.length, 0); E.advance(game, {}, .7);
  assert.deepEqual(game.tow, [0]); assert.equal(game.hull, 4);
});

test('map boundaries are safe and hold all hulls inside the sea', () => {
  const game = ready(); E.advance(game, { x: -1 }, 2);
  assert.ok(game.tug.x >= game.tug.radius + 4); assert.equal(game.hull, 5);
  E.advance(game, { y: 1 }, 2); assert.ok(game.tug.y <= L.height - game.tug.radius - 4);
});

test('pause freezes time, motion and pickups, and resume preserves the voyage', () => {
  const game = ready(); E.advance(game, { y: -1 }, .5); E.pause(game);
  const snapshot = JSON.stringify(game); E.advance(game, { x: 1 }, 50);
  assert.equal(JSON.stringify(game), snapshot); E.resume(game); E.advance(game, {}, .2);
  assert.equal(game.status, 'playing'); assert.ok(game.elapsed > .5);
});

test('time expires after ninety simulated seconds and finished games cannot move', () => {
  const game = ready(); E.advance(game, {}, 91);
  assert.equal(game.status, 'lost'); assert.equal(game.reason, 'time'); assert.equal(game.time, 0);
  const snapshot = JSON.stringify(game); E.advance(game, { x: 1 }, 1); assert.equal(JSON.stringify(game), snapshot);
});

test('zero hull ends the mission, and retry restores every gameplay field', () => {
  const game = ready(); game.hull = 1;
  Object.assign(game.tug, { x: L.reefs[0].x, y: L.reefs[0].y }); E.advance(game, {}, E.STEP);
  assert.equal(game.status, 'lost'); assert.equal(game.reason, 'hull'); assert.equal(game.hull, 0);
  E.restart(game); const fresh = ready(); assert.deepEqual(game, fresh);
});

test('an actual steering-only two-trip route rescues all six without hull loss', () => {
  const game = ready();
  route(game, [[67,245],[65,79],[218,48],[142,48],[65,79],[55,270],[56,347]]);
  assert.equal(game.rescued, 3); assert.equal(game.hull, 5);
  route(game, [[242,342],[375,342],[375,235],[370,83],[350,48],[218,48],[65,79],[55,270],[56,347]]);
  assert.equal(game.status, 'won'); assert.equal(game.rescued, 6);
  assert.equal(game.hull, 5); assert.equal(game.trips, 2); assert.equal(game.maxTow, 3);
  assert.ok(game.time > 30); assert.ok(game.boats.every(boat => boat.status === 'rescued'));
  const snapshot = JSON.stringify(game); E.advance(game, { y: 1 }, 5); assert.equal(JSON.stringify(game), snapshot);
  E.restart(game); assert.deepEqual(game, ready());
  console.log(`Scripted route: ${game.status === 'playing' ? 'win → retry verified' : 'unexpected'}`);
});

test('one-boat trips are a feasible alternative to long convoys', () => {
  const game = ready(), home = [56,347];
  route(game, [[67,245],home,[65,79],[65,245],home]);
  route(game, [[65,79],[218,48],[65,79],[55,270],home]);
  route(game, [[242,342],home]);
  route(game, [[375,345],[375,235],[375,345],home]);
  route(game, [[375,345],[375,235],[370,83],[375,235],[375,345],home]);
  assert.equal(game.status, 'won'); assert.equal(game.hull, 5); assert.equal(game.trips, 6);
  assert.equal(game.maxTow, 1); assert.ok(game.time > 10);
});

// Controller coverage uses a mock DOM/canvas. It is not visual-browser evidence.
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function harness() {
  class Element {
    constructor(id) {
      this.id = id; this.listeners = {}; this.dataset = {}; this.textContent = ''; this.innerHTML = '';
      this.hidden = false; this.disabled = false; this.width = 840; this.height = 800;
      this.clientWidth = 390; this.clientHeight = 371.43;
      this.classList = { data: new Set(), add(value) { this.data.add(value); }, remove(value) { this.data.delete(value); }, toggle(value, on) { on ? this.data.add(value) : this.data.delete(value); } };
    }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    emit(type, data = {}) { const event = { preventDefault() {}, pointerId: 1, ...data }; for (const fn of this.listeners[type] || []) fn(event); }
    setAttribute(name, value) { this[name] = value; }
    getBoundingClientRect() { return { left: 0, top: 0, width: this.clientWidth, height: this.clientHeight }; }
    getContext() { return new Proxy({}, { get(target, prop) { return prop === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}; }, set() { return true; } }); }
    setPointerCapture() {}
    focus() {}
  }
  const html = fs.readFileSync(path.join(__dirname, '../games/tiny-tug/index.html'), 'utf8');
  const elements = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element(match[1])]));
  const timer = new Element('timer');
  const directions = [[0,-1],[-1,0],[1,0],[0,1]].map(([x,y]) => { const button = new Element('direction'); button.dataset = { x: String(x), y: String(y) }; return button; });
  const document = new Element('document'); document.hidden = false;
  document.getElementById = id => { assert.ok(elements[id], `Missing DOM id ${id}`); return elements[id]; };
  document.querySelectorAll = selector => { assert.equal(selector, '.direction'); return directions; };
  document.querySelector = selector => { assert.equal(selector, '.timer'); return timer; };
  const window = new Element('window'); window.TinyTug = E; window.devicePixelRatio = 1; window.matchMedia = () => ({ matches: true });
  let raf = null, now = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../games/tiny-tug/game.js'), 'utf8'), { window, document, requestAnimationFrame(fn) { raf = fn; }, console, Math, Set, JSON });
  function tick(seconds) {
    const n = Math.ceil(seconds * 60);
    for (let i = 0; i < n; i++) { now += 1000 / 60; const callback = raf; raf = null; callback(now); }
  }
  return { elements, directions, document, window, tick, snapshot: () => window.tinyTugSnapshot() };
}

test('controller starts, steers with keyboard, brakes on key-up, and toggles pause', () => {
  const h = harness(); assert.equal(h.snapshot().status, 'ready');
  h.elements.primary.emit('click'); assert.equal(h.snapshot().status, 'playing'); assert.equal(h.elements.overlay.hidden, true);
  const initialY = h.snapshot().tug.y;
  h.window.emit('keydown', { key: 'ArrowUp' }); h.tick(.6);
  assert.ok(h.snapshot().tug.y < initialY - 25);
  h.window.emit('keyup', { key: 'ArrowUp' }); h.tick(1);
  assert.ok(Math.abs(h.snapshot().tug.vy) < .1);
  h.window.emit('keydown', { key: 'p' }); const paused = h.snapshot(); h.tick(2);
  assert.equal(h.snapshot().elapsed, paused.elapsed); assert.equal(h.elements.overlay.hidden, false);
  h.window.emit('keydown', { key: 'p' }); assert.equal(h.snapshot().status, 'playing');
});

test('controller drag and large Dpad move and release without stuck input', () => {
  const h = harness(); h.elements.primary.emit('click');
  const initialX = h.snapshot().tug.x;
  h.elements.sea.emit('pointerdown', { clientX: 50, clientY: 150 });
  h.elements.sea.emit('pointermove', { clientX: 92, clientY: 150 }); h.tick(.4);
  assert.ok(h.snapshot().tug.x > initialX + 12);
  h.elements.sea.emit('pointercancel'); h.tick(1); assert.ok(Math.abs(h.snapshot().tug.vx) < .1);
  const initialY = h.snapshot().tug.y; h.directions[0].emit('pointerdown'); h.tick(.4);
  assert.ok(h.snapshot().tug.y < initialY - 12);
  h.directions[0].emit('lostpointercapture'); h.tick(1); assert.ok(Math.abs(h.snapshot().tug.vy) < .1);
  h.directions[0].emit('keydown', { key: 'Enter' }); h.tick(.3);
  assert.ok(h.snapshot().tug.vy < -10);
  h.directions[0].emit('keyup', { key: 'Enter' }); h.tick(1); assert.ok(Math.abs(h.snapshot().tug.vy) < .1);
});

test('blur and hidden-page interruption pause and clear all active controls', () => {
  const h = harness(); h.elements.primary.emit('click');
  h.window.emit('keydown', { key: 'ArrowUp' }); h.tick(.3); h.window.emit('blur');
  assert.equal(h.snapshot().status, 'paused'); const pausedTime = h.snapshot().time; h.tick(1);
  assert.equal(h.snapshot().time, pausedTime); h.elements.primary.emit('click'); h.tick(1);
  assert.ok(Math.abs(h.snapshot().tug.vy) < .1);
  h.document.hidden = true; h.document.emit('visibilitychange'); assert.equal(h.snapshot().status, 'paused');
  h.document.hidden = false; h.document.emit('visibilitychange'); assert.equal(h.snapshot().status, 'paused');
  h.elements.primary.emit('click'); assert.equal(h.snapshot().status, 'playing');
});

test('paused restart begins a fresh mission; timeout displays retry and retry restores HUD', () => {
  const h = harness(); h.elements.primary.emit('click'); h.tick(2); h.elements.pause.emit('click');
  assert.equal(h.elements.restart.hidden, false); h.elements.restart.emit('click');
  assert.equal(h.snapshot().status, 'playing'); assert.equal(h.snapshot().time, 90); assert.equal(h.snapshot().hull, 5);
  h.tick(91); assert.equal(h.snapshot().status, 'lost'); assert.equal(h.elements.overlay.hidden, false);
  assert.match(h.elements['overlay-title'].textContent, /日が暮れ/);
  h.elements.primary.emit('click'); assert.equal(h.snapshot().status, 'playing');
  assert.equal(h.snapshot().rescued, 0); assert.equal(h.elements.time.textContent, 90);
  assert.equal(h.elements.hull.textContent, '●●●●●'); assert.equal(h.elements.restart.hidden, true);
});

test('actual sharp steering can strike the trailing ship while the tug clears the reef', () => {
  function roundReef(radius) {
    const game = ready(); let collision = null;
    function go(x, y) {
      let steps = 0;
      while (E.distance(game.tug, { x, y }) > 1.5 && game.status === 'playing' && !collision && steps++ < 3000) {
        E.advance(game, { x: (x - game.tug.x) / 18, y: (y - game.tug.y) / 18 }, E.STEP);
        if (game.hits) collision = { text: game.notice.text, clearance: E.distance(game.tug, L.reefs[0]) - game.tug.radius - L.reefs[0].radius };
      }
      assert.ok(steps < 3000, 'Scripted corner route did not converge');
    }
    go(67,245); go(95,219); go(120,219);
    assert.deepEqual(game.tow, [0]);
    for (let angle = Math.PI - .08; angle >= 0 && !collision; angle -= .08) go(167 + radius * Math.cos(angle), 219 - radius * Math.sin(angle));
    return { game, collision };
  }
  const tight = roundReef(47), wide = roundReef(48);
  assert.ok(tight.collision); assert.match(tight.collision.text, /ロープが切れ/);
  assert.ok(tight.collision.clearance > 8, 'The tug itself must be clear of the reef');
  assert.equal(tight.game.hull, 4); assert.deepEqual(tight.game.tow, []);
  assert.equal(tight.game.boats[0].status, 'waiting');
  assert.equal(wide.collision, null); assert.equal(wide.game.hull, 5); assert.deepEqual(wide.game.tow, [0]);
});
