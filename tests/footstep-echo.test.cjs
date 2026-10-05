// Pure Node engine + mocked DOM/controller regression tests. Not a browser/visual test.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const E = require('../games/footstep-echo/engine.js');
const moves = { U: [0, -1], R: [1, 0], D: [0, 1], L: [-1, 0], W: [0, 0] };

function route(s, letters) {
  for (const letter of letters) {
    const result = E.step(s, ...moves[letter]);
    assert.notEqual(result.state, s, `Route action ${letter} blocked at turn ${s.turns}: ${result.reason}`);
    s = result.state;
  }
  return s;
}
function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
function stateKey(s) {
  return [s.player, s.echo, ...s.trail].map(p => `${p.x},${p.y}`).join('|');
}
function shortestSolution(level) {
  const s = E.load(level), queue = [{ s, path: '' }], seen = new Set([stateKey(s)]);
  for (let i = 0; i < queue.length; i++) {
    const { s, path } = queue[i];
    if (s.won) return path;
    for (const [letter, delta] of Object.entries(moves)) {
      const next = E.step(s, ...delta).state;
      if (next === s) continue;
      const key = stateKey(next);
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ s: next, path: path + letter });
      }
    }
  }
  return null;
}
function makeController() {
  const els = {}, listeners = {};
  function element(tagName = 'DIV') {
    const result = {
      tagName, style: {}, textContent: '', hidden: false, disabled: false,
      children: [], attrs: {}, events: {}, dataset: {},
      classList: { values: new Set(), add(...names) { names.forEach(n => this.values.add(n)); } },
      append(...children) { this.children.push(...children); },
      setAttribute(name, value) { this.attrs[name] = value; },
      addEventListener(name, handler) { this.events[name] = handler; }
    };
    Object.defineProperty(result, 'innerHTML', {
      get() { return this._html || ''; },
      set(value) { this._html = value; this.children = []; }
    });
    return result;
  }
  const buttons = Object.entries(moves).map(([letter, delta]) => {
    const button = element('BUTTON'); button.letter = letter; button.dataset.move = delta.join(','); return button;
  });
  const context = vm.createContext({ EchoGame: E, document: {
    getElementById(id) {
      if (!els[id]) { els[id] = element(); els[id].hidden = ['hintText', 'next'].includes(id); }
      return els[id];
    },
    createElement: element,
    querySelectorAll(selector) { assert.equal(selector, '[data-move]'); return buttons; },
    addEventListener(event, callback) { listeners[event] = callback; }
  } });
  vm.runInContext(fs.readFileSync(require.resolve('../games/footstep-echo/game.js'), 'utf8'), context);
  return {
    els, buttons,
    get state() { return vm.runInContext('state', context); },
    get history() { return vm.runInContext('history', context); },
    move(letter) { const b = buttons.find(b => b.letter === letter); if (!b.disabled) b.events.click(); },
    route(letters) { for (const letter of letters) this.move(letter); },
    click(id) { if (!els[id].disabled) els[id].onclick(); },
    key(key, extra = {}) {
      const event = { key, repeat: false, altKey: false, ctrlKey: false, metaKey: false,
        target: { tagName: 'BODY' }, preventDefault() { this.prevented = true; }, ...extra };
      listeners.keydown(event); return event;
    }
  };
}

test('each level has one start, switch, door and reachable goal', () => {
  for (let i = 0; i < E.levels.length; i++) {
    const s = E.load(i);
    assert.equal(s.turns, 0); assert.equal(s.won, false); assert.equal(E.open(s), false);
    assert.equal(s.trail.length, E.DELAY);
    assert.deepEqual(s.echo, s.player);
    assert.ok(s.trail.every(p => E.same(p, s.player)));
    for (const token of ['P', 'S', 'D', 'G']) assert.equal(s.grid.flat().filter(v => v === token).length, 1);
    assert.ok(s.grid.every(row => row.length === s.grid[0].length));
  }
});

test('blocked wall and closed-door attempts do not consume a turn or change history', () => {
  const s = freeze(E.load());
  assert.deepEqual(E.step(s, -1, 0), { state: s, reason: 'wall' });
  const nearDoor = freeze(route(E.load(), 'UURR'));
  assert.deepEqual(E.step(nearDoor, 1, 0), { state: nearDoor, reason: 'closed' });
  assert.equal(nearDoor.turns, 4);
});

test('invalid movement inputs never advance', () => {
  const s = freeze(E.load());
  for (const [dx, dy] of [[1, 1], [2, 0], [0.5, 0], [NaN, 0], [Infinity, 0], ['1', 0], [undefined, 0]]) {
    assert.deepEqual(E.step(s, dx, dy), { state: s, reason: 'invalid' });
  }
});

test('echo and timeline follow an independent four-turn oracle including waits', () => {
  let s = freeze(E.load());
  const positions = [{ ...s.player }], actions = 'UURRWWWRRUU';
  for (const letter of actions) {
    const old = s;
    s = E.step(s, ...moves[letter]).state;
    assert.notEqual(s, old);
    positions.push({ ...s.player });
    assert.equal(s.turns, positions.length - 1);
    assert.deepEqual(s.echo, positions[Math.max(0, s.turns - E.DELAY)]);
    for (let i = 0; i < E.DELAY; i++) {
      assert.deepEqual(s.trail[i], positions[Math.max(0, s.turns - E.DELAY + i + 1)]);
    }
    freeze(s); // Ensures later steps cannot mutate previous states needed by Undo.
  }
  assert.ok(s.won);
});

test('wait advances one turn while leaving the player at the same coordinates', () => {
  const s = freeze(route(E.load(), 'UURRWW'));
  const result = E.step(s, 0, 0);
  assert.equal(result.reason, 'moved');
  assert.deepEqual(result.state.player, s.player);
  assert.equal(result.state.turns, s.turns + 1);
  assert.deepEqual(result.state.echo, s.switchPos);
  assert.equal(E.open(result.state), true);
});

test('door opens on echo occupancy and stays open while player occupies it', () => {
  let s = route(E.load(), 'UURRWWW');
  assert.equal(E.open(s), true); assert.deepEqual(s.echo, s.switchPos);
  s = route(s, 'R');
  assert.deepEqual(s.player, s.door); assert.notDeepEqual(s.echo, s.switchPos); assert.equal(E.open(s), true);
  s = route(s, 'WW');
  assert.equal(E.open(s), true); // Waiting in the door cannot trap the player.
  s = route(s, 'R');
  assert.equal(E.open(s), false); assert.equal(s.player.x, s.door.x + 1);
});

test('room 2 timing is four moves to front of door, then a fifth into door', () => {
  let s = route(E.load(1), 'UUUR');
  assert.deepEqual(s.player, s.switchPos);
  s = route(s, 'RRDD');
  assert.equal(Math.abs(s.player.x - s.door.x) + Math.abs(s.player.y - s.door.y), 1);
  assert.deepEqual(s.echo, s.switchPos); assert.equal(E.open(s), true);
  s = route(s, 'R'); assert.deepEqual(s.player, s.door);
});

test('both rooms have minimal solutions and deterministic replays', () => {
  const minimum = [11, 13];
  for (let i = 0; i < E.levels.length; i++) {
    const path = shortestSolution(i);
    assert.ok(path); assert.equal(path.length, minimum[i]);
    const result = route(E.load(i), path);
    assert.ok(result.won); assert.deepEqual(result, route(E.load(i), path));
  }
});

test('winning is terminal until controller Undo or reset', () => {
  const s = freeze(route(E.load(), 'UURRWWWRRUU'));
  for (const delta of Object.values(moves)) assert.deepEqual(E.step(s, ...delta), { state: s, reason: 'invalid' });
});

test('controller Undo restores player, echo, queue and turns; failed input does not add Undo', () => {
  const c = makeController();
  assert.equal(c.els.undo.disabled, true);
  c.move('L'); assert.equal(c.history.length, 0);
  c.route('UURRWW'); const prior = c.state;
  c.move('W'); assert.equal(E.open(c.state), true);
  assert.equal(c.history.length, 7);
  c.click('undo'); assert.equal(c.state, prior); assert.equal(E.open(c.state), false);
  c.move('R'); assert.equal(c.state, prior); assert.equal(c.history.length, 6);
  for (let i = 0; i < 6; i++) c.click('undo');
  assert.equal(c.state.turns, 0); assert.equal(c.els.undo.disabled, true);
});

test('timeline reports repeated locations and upcoming switch arrival consistently', () => {
  const c = makeController();
  assert.equal(c.els.board.children.length, 49);
  for (let i = 1; i <= E.DELAY; i++) assert.match(c.els.timeline.innerHTML, new RegExp(`${i}歩後 足あと`));
  c.route('UUR'); assert.match(c.els.timeline.innerHTML, /4歩後 ◎/);
  c.move('R'); assert.match(c.els.timeline.innerHTML, /3歩後 ◎/);
  c.route('WW'); assert.match(c.els.timeline.innerHTML, /1歩後 ◎/);
  c.move('W'); assert.doesNotMatch(c.els.timeline.innerHTML, /◎/);
});

test('keyboard arrows and Space advance once; repeated keydown and modifier shortcuts do not', () => {
  const c = makeController();
  assert.equal(c.key('ArrowUp').prevented, true); assert.equal(c.state.turns, 1);
  c.key('ArrowUp', { repeat: true }); assert.equal(c.state.turns, 1);
  for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) c.key('ArrowUp', { [modifier]: true });
  c.key('ArrowUp', { target: { tagName: 'INPUT' } }); assert.equal(c.state.turns, 1);
  const oldPlayer = c.state.player;
  c.key(' '); assert.equal(c.state.turns, 2); assert.deepEqual(c.state.player, oldPlayer);
  c.key(' ', { repeat: true }); assert.equal(c.state.turns, 2);
});

test('repeated button moves each count once and reset clears the queue and Undo', () => {
  const c = makeController();
  c.route('WWWWW'); assert.equal(c.state.turns, 5); assert.equal(c.history.length, 5);
  c.click('reset'); assert.deepEqual(c.state, E.load()); assert.equal(c.history.length, 0);
  assert.equal(c.els.undo.disabled, true); assert.equal(c.els.next.hidden, true);
  c.click('reset'); assert.deepEqual(c.state, E.load());
});

test('win disables movement, Undo reopens play, next level and replay clear history', () => {
  const c = makeController(); c.route('UURRWWWRRUU');
  assert.ok(c.state.won); assert.equal(c.els.next.hidden, false);
  assert.ok(c.buttons.every(b => b.disabled));
  const won = c.state; c.key('ArrowDown'); assert.equal(c.state, won);
  c.click('undo'); assert.equal(c.state.won, false); assert.equal(c.state.turns, 10);
  assert.ok(c.buttons.every(b => !b.disabled)); assert.equal(c.els.next.hidden, true);
  c.move('U'); c.click('hint'); assert.equal(c.els.hintText.hidden, false);
  c.click('next'); assert.equal(c.state.level, 1); assert.equal(c.state.turns, 0);
  assert.equal(c.history.length, 0); assert.equal(c.els.hintText.hidden, true);
  c.click('hint'); assert.equal(c.els.hintText.textContent, E.levels[1].hint);
  c.route('UUURRRDDRRUUU'); assert.ok(c.state.won);
  c.click('next'); assert.equal(c.state.level, 0); assert.equal(c.history.length, 0);
  assert.deepEqual(c.state, E.load());
});
