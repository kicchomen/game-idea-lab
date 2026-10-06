/* Tiny Tug: deterministic, dependency-free simulation. Browser + Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TinyTug = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STEP = 1 / 120;
  const LEVEL = Object.freeze({
    width: 420, height: 400, missionSeconds: 90, maxHull: 5, capacity: 3,
    harbor: Object.freeze({ x: 56, y: 347, radius: 39, dockRadius: 27 }),
    reefs: Object.freeze([
      Object.freeze({ x: 167, y: 219, radius: 29 }),
      Object.freeze({ x: 270, y: 112, radius: 30 }),
      Object.freeze({ x: 313, y: 269, radius: 28 })
    ]),
    boats: Object.freeze([
      Object.freeze({ x: 67, y: 245 }), Object.freeze({ x: 65, y: 79 }),
      Object.freeze({ x: 218, y: 48 }), Object.freeze({ x: 370, y: 83 }),
      Object.freeze({ x: 375, y: 235 }), Object.freeze({ x: 242, y: 342 })
    ])
  });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  function createGame() {
    return {
      status: 'ready', reason: '', time: LEVEL.missionSeconds, elapsed: 0,
      hull: LEVEL.maxHull, rescued: 0, trips: 0, maxTow: 0, hits: 0,
      tug: { x: LEVEL.harbor.x, y: LEVEL.harbor.y, vx: 0, vy: 0, angle: -Math.PI / 2, radius: 10 },
      boats: LEVEL.boats.map((boat, id) => ({ ...boat, id, radius: 9, status: 'waiting', cooldown: 0, angle: -Math.PI / 2, ropeLength: 29 })),
      tow: [], invulnerable: 0, accumulator: 0, eventId: 0,
      notice: { id: 0, type: 'guide', text: 'まずは港の上にいる1隻へ', until: 4 },
      fullNoticeCooldown: 0
    };
  }
  function notice(game, type, text, duration = 2.5) {
    game.notice = { id: ++game.eventId, type, text, until: game.elapsed + duration };
  }
  function start(game) {
    if (game.status === 'ready') { game.status = 'playing'; notice(game, 'guide', 'まずは港の上にいる1隻へ', 5); }
    return game;
  }
  function pause(game) {
    if (game.status === 'playing') { game.status = 'paused'; game.accumulator = 0; }
    return game;
  }
  function resume(game) {
    if (game.status === 'paused') { game.status = 'playing'; game.accumulator = 0; }
    return game;
  }
  function restart(game) { Object.assign(game, createGame()); return start(game); }
  function damage(game, tailHit) {
    if (game.invulnerable > 0) return;
    game.hull -= 1; game.hits += 1; game.invulnerable = 1.1;
    notice(game, 'hit', tailHit ? 'ロープが切れた！ 離れた船は拾い直せる' : '岩に注意！ 船体 −1', 3);
    if (game.hull <= 0) {
      game.status = 'lost'; game.reason = 'hull';
      notice(game, 'end', '船体が限界に。次は大きく回ろう', Infinity);
    }
  }
  function keepInside(body) {
    body.x = clamp(body.x, body.radius + 4, LEVEL.width - body.radius - 4);
    body.y = clamp(body.y, body.radius + 4, LEVEL.height - body.radius - 4);
  }
  function reefCollision(body, reef) {
    const dx = body.x - reef.x, dy = body.y - reef.y;
    const d = Math.hypot(dx, dy), minimum = body.radius + reef.radius;
    if (d >= minimum) return false;
    const nx = d > 0.001 ? dx / d : 1, ny = d > 0.001 ? dy / d : 0;
    body.x = reef.x + nx * (minimum + 0.4);
    body.y = reef.y + ny * (minimum + 0.4);
    if ('vx' in body) {
      const inward = body.vx * nx + body.vy * ny;
      if (inward < 0) { body.vx -= 1.3 * inward * nx; body.vy -= 1.3 * inward * ny; }
    }
    return true;
  }
  function tick(game, input) {
    const dt = STEP, tug = game.tug;
    game.elapsed += dt;
    game.time = Math.max(0, LEVEL.missionSeconds - game.elapsed);
    game.invulnerable = Math.max(0, game.invulnerable - dt);
    game.fullNoticeCooldown = Math.max(0, game.fullNoticeCooldown - dt);
    for (const boat of game.boats) boat.cooldown = Math.max(0, boat.cooldown - dt);

    let ix = Number.isFinite(input.x) ? input.x : 0;
    let iy = Number.isFinite(input.y) ? input.y : 0;
    const length = Math.hypot(ix, iy);
    if (length > 1) { ix /= length; iy /= length; }
    const speed = 100 * (1 - game.tow.length * 0.065);
    // Exponential easing creates gentle inertia; all integration uses the fixed step.
    const response = 1 - Math.exp(-7 * dt);
    tug.vx += (ix * speed - tug.vx) * response;
    tug.vy += (iy * speed - tug.vy) * response;
    tug.x += tug.vx * dt; tug.y += tug.vy * dt;
    if (Math.hypot(tug.vx, tug.vy) > 3) tug.angle = Math.atan2(tug.vy, tug.vx);
    keepInside(tug);
    for (const reef of LEVEL.reefs) if (reefCollision(tug, reef)) damage(game, false);
    if (game.status !== 'playing') return;

    let leader = tug;
    for (let i = 0; i < game.tow.length; i += 1) {
      const boat = game.boats[game.tow[i]];
      boat.ropeLength = Math.max(29, boat.ropeLength - 30 * dt);
      const dx = leader.x - boat.x, dy = leader.y - boat.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.01) boat.angle = Math.atan2(dy, dx);
      if (d > boat.ropeLength) {
        boat.x += dx / d * (d - boat.ropeLength);
        boat.y += dy / d * (d - boat.ropeLength);
      }
      keepInside(boat);
      const struck = LEVEL.reefs.some(reef => reefCollision(boat, reef));
      if (struck) {
        const dropped = game.tow.splice(i);
        for (const id of dropped) { game.boats[id].status = 'waiting'; game.boats[id].cooldown = 1.6; }
        damage(game, true);
        // Rope loss remains visible even during the hull's brief damage protection.
        if (game.status === 'playing') notice(game, 'hit', 'ロープが切れた！ 離れた船は拾い直せる', 3);
        break;
      }
      leader = boat;
    }
    if (game.status !== 'playing') return;

    for (const boat of game.boats) {
      if (boat.status !== 'waiting' || boat.cooldown > 0 || distance(boat, tug) > 28) continue;
      if (game.tow.length >= LEVEL.capacity) {
        if (game.fullNoticeCooldown <= 0) {
          notice(game, 'full', '3隻で満員。左下の港へ戻ろう'); game.fullNoticeCooldown = 4;
        }
        continue;
      }
      const last = game.tow.length ? game.boats[game.tow[game.tow.length - 1]] : tug;
      boat.ropeLength = Math.max(29, distance(last, boat));
      boat.status = 'towed'; game.tow.push(boat.id);
      game.maxTow = Math.max(game.maxTow, game.tow.length);
      notice(game, 'attach', game.tow.length === 3 ? '3隻つながった！ 港へ大きく回ろう' : `${game.tow.length}隻つながった！ 港へ戻ってもOK`);
    }
    if (game.tow.length && distance(tug, LEVEL.harbor) <= LEVEL.harbor.dockRadius) {
      const count = game.tow.length;
      for (const id of game.tow) game.boats[id].status = 'rescued';
      game.rescued += count; game.trips += 1; game.tow = [];
      notice(game, 'deliver', `${count}隻を救助！ あと${game.boats.length - game.rescued}隻`, 3);
      if (game.rescued === game.boats.length) {
        game.status = 'won'; notice(game, 'end', '6隻ぜんぶ、おかえりなさい！', Infinity); return;
      }
    }
    if (game.time <= STEP / 2) {
      game.time = 0; game.status = 'lost'; game.reason = 'time';
      notice(game, 'end', '日が暮れた。次は早めの帰港も試そう', Infinity);
    }
  }
  function advance(game, input = {}, seconds = 0) {
    if (game.status !== 'playing' || !Number.isFinite(seconds) || seconds <= 0) return game;
    // Real-time callers cap frame gaps; Node tests can advance any bounded duration.
    game.accumulator += Math.min(seconds, LEVEL.missionSeconds + 1);
    while (game.accumulator + 1e-10 >= STEP && game.status === 'playing') {
      game.accumulator -= STEP;
      if (game.accumulator < 0) game.accumulator = 0;
      tick(game, input);
    }
    return game;
  }
  return { LEVEL, STEP, createGame, start, restart, pause, resume, advance, distance };
});
