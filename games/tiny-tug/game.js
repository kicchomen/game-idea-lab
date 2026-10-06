/* Presentation and input for Tiny Tug. All game rules live in engine.js. */
(function () {
  'use strict';
  const E = window.TinyTug, L = E.LEVEL, game = E.createGame();
  const canvas = document.getElementById('sea'), ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const keys = new Set(), pads = new Set();
  let drag = null, previousTime = null, shownStatus = '', shownNotice = -1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The public snapshot is read-only; useful for accessibility tools and reproducible QA.
  window.tinyTugSnapshot = () => JSON.parse(JSON.stringify(game));
  function resetInput() {
    keys.clear(); pads.clear(); drag = null;
    document.querySelectorAll('.direction').forEach(button => button.classList.remove('active'));
  }
  function circle(x, y, radius, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function text(value, x, y, size, color, align = 'center', weight = 650) {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y);
  }
  function drawBoat(boat, tug) {
    const angle = boat.angle + Math.PI / 2;
    ctx.save(); ctx.translate(boat.x, boat.y); ctx.rotate(angle);
    // A soft shadow, a cream deck, and an orange wheelhouse identify the tug.
    ctx.fillStyle = '#0a415459'; ctx.beginPath(); ctx.ellipse(2, 5, 11, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.bezierCurveTo(11, -10, 12, 4, 8, 12); ctx.lineTo(-8, 12); ctx.bezierCurveTo(-12, 4, -11, -10, 0, -14);
    ctx.fillStyle = tug ? '#fff4da' : '#efcb86'; ctx.fill(); ctx.strokeStyle = '#173f50'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = tug ? '#f0a262' : '#f8e7bc'; ctx.fillRect(-6, -4, 12, 11);
    ctx.fillStyle = '#285565'; ctx.fillRect(-4, -3, 8, 4);
    ctx.fillStyle = tug ? '#a65040' : '#5b8f94'; ctx.fillRect(-3, 3, 6, 4);
    if (tug) { ctx.fillStyle = '#163c4b'; ctx.fillRect(-2, -10, 4, 5); circle(-9, 6, 2.5, '#183c49'); circle(9, 6, 2.5, '#183c49'); }
    ctx.restore();
  }
  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), width = canvas.clientWidth, height = canvas.clientHeight;
    const targetW = Math.round(width * dpr), targetH = Math.round(height * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) { canvas.width = targetW; canvas.height = targetH; }
    ctx.setTransform(canvas.width / L.width, 0, 0, canvas.height / L.height, 0, 0);
    const water = ctx.createLinearGradient(0, 0, L.width, L.height);
    water.addColorStop(0, '#367f87'); water.addColorStop(0.55, '#226c7c'); water.addColorStop(1, '#195a70');
    ctx.fillStyle = water; ctx.fillRect(0, 0, L.width, L.height);
    const t = reducedMotion ? 0 : game.elapsed;
    // Static coordinates avoid random frames and keep the board visually quiet.
    ctx.lineWidth = 1.4; ctx.strokeStyle = '#a5d9c91e';
    for (let i = 0; i < 39; i += 1) {
      const x = (i * 83 + 19) % 416, y = (i * 59 + 24) % 390;
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.quadraticCurveTo(x, y + 2 + Math.sin(t * .7 + i), x + 7, y); ctx.stroke();
    }
    // The harbor is a roomy, always-safe destination.
    circle(L.harbor.x, L.harbor.y, 47, '#7ccebd17');
    circle(L.harbor.x, L.harbor.y, L.harbor.radius, '#8ed6be25');
    ctx.setLineDash([4, 5]); circle(L.harbor.x, L.harbor.y, L.harbor.dockRadius, null, '#b4e4cba0', 1.5); ctx.setLineDash([]);
    ctx.fillStyle = '#c9b286'; ctx.fillRect(0, 385, 106, 15); ctx.fillRect(0, 313, 11, 87);
    ctx.fillStyle = '#e0c798'; ctx.fillRect(10, 370, 65, 8); ctx.fillRect(10, 314, 25, 7);
    ctx.strokeStyle = '#a38c6e'; ctx.lineWidth = 1;
    for (let x = 14; x < 75; x += 10) { ctx.beginPath(); ctx.moveTo(x, 370); ctx.lineTo(x, 378); ctx.stroke(); }
    circle(33, 318, 3, '#fae6bb'); circle(72, 374, 3, '#fae6bb');
    text('H O M E', 56, 399 - 7, 8, '#435b5b', 'center', 850);
    text('港', 56, 304, 12, '#e4f8d9');
    for (const reef of L.reefs) {
      circle(reef.x, reef.y, reef.radius + 9, '#85c8aa24');
      circle(reef.x, reef.y, reef.radius + 2, '#c7be8170');
      circle(reef.x, reef.y, reef.radius, '#aa9f74');
      ctx.save(); ctx.translate(reef.x, reef.y);
      ctx.beginPath(); ctx.moveTo(-23, 7); ctx.lineTo(-21, -10); ctx.lineTo(-9, -24); ctx.lineTo(8, -25); ctx.lineTo(23, -10); ctx.lineTo(25, 8); ctx.lineTo(10, 22); ctx.lineTo(-8, 24); ctx.closePath(); ctx.fillStyle = '#c7c099'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-17, 3); ctx.lineTo(-14, -12); ctx.lineTo(0, -20); ctx.lineTo(15, -10); ctx.lineTo(16, 6); ctx.lineTo(3, 12); ctx.closePath(); ctx.fillStyle = '#789984'; ctx.fill();
      circle(-6, -4, 8, '#86ad90'); circle(7, -7, 8, '#8eb393');
      ctx.strokeStyle = '#eef0c442'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-19, 13); ctx.lineTo(-10, 18); ctx.lineTo(-1, 17); ctx.stroke();
      ctx.restore();
    }
    let leader = game.tug;
    ctx.strokeStyle = '#f8e2a4'; ctx.lineWidth = 2.1; ctx.lineCap = 'round';
    for (const id of game.tow) {
      const boat = game.boats[id]; ctx.beginPath(); ctx.moveTo(leader.x, leader.y); ctx.lineTo(boat.x, boat.y); ctx.stroke(); leader = boat;
    }
    for (const boat of game.boats) {
      if (boat.status === 'rescued') continue;
      if (boat.status === 'waiting') {
        circle(boat.x, boat.y, 20 + (reducedMotion ? 0 : Math.sin(t * 2 + boat.id) * 1.5), null, boat.cooldown > 0 ? '#f2ab79' : '#c9e9c261', 1.3);
        if (game.status === 'playing' || game.status === 'ready') {
          ctx.fillStyle = '#174756d9'; ctx.fillRect(boat.x - 11, boat.y - 31, 22, 12);
          text('SOS', boat.x, boat.y - 24.5, 7, '#f5e2b0');
        }
      }
      drawBoat(boat, false);
    }
    const speed = Math.hypot(game.tug.vx, game.tug.vy);
    if (speed > 7) {
      ctx.save(); ctx.translate(game.tug.x, game.tug.y); ctx.rotate(game.tug.angle);
      ctx.strokeStyle = '#d1f0df66'; ctx.lineWidth = 1.5;
      [-1, 1].forEach(side => { ctx.beginPath(); ctx.moveTo(-13, side * 6); ctx.lineTo(-21, side * 10); ctx.stroke(); }); ctx.restore();
    }
    if (game.invulnerable > 0) circle(game.tug.x, game.tug.y, 18, null, '#ffbd8a', 2.2);
    drawBoat(game.tug, true);
    if (game.elapsed < 4 && game.status === 'playing') text('あなた', game.tug.x, game.tug.y + 27, 9, '#fff4da');
    if (game.tow.length && E.distance(game.tug, L.harbor) > 90) {
      const a = Math.atan2(L.harbor.y - game.tug.y, L.harbor.x - game.tug.x);
      ctx.save(); ctx.translate(game.tug.x + Math.cos(a) * 31, game.tug.y + Math.sin(a) * 31); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -4); ctx.lineTo(-3, 4); ctx.closePath(); ctx.fillStyle = '#b8efbf'; ctx.fill(); ctx.restore();
    }
    if (drag && game.status === 'playing') {
      const sx = L.width / canvas.clientWidth, sy = L.height / canvas.clientHeight;
      circle(drag.x * sx, drag.y * sy, 28, '#dcf0df15', '#dcf0df66');
      circle((drag.x + drag.dx) * sx, (drag.y + drag.dy) * sy, 9, '#e6f4df99');
    }
  }
  function updateOverlay() {
    if (shownStatus === game.status) return;
    shownStatus = game.status;
    $('overlay').dataset.state = game.status;
    $('restart').hidden = game.status !== 'paused';
    $('overlay').hidden = game.status === 'playing';
    $('pause').disabled = game.status === 'ready' || game.status === 'won' || game.status === 'lost';
    $('pause').innerHTML = game.status === 'paused' ? '再開 <span>▶</span>' : '一時停止 <span>Ⅱ</span>';
    if (game.status === 'playing') return;
    resetInput();
    $('starter-tips').hidden = game.status !== 'ready';
    if (game.status === 'paused') {
      $('overlay-kicker').textContent = 'ひと息つこう'; $('overlay-title').textContent = '一時停止中';
      $('overlay-text').textContent = `${game.rescued}隻を救助・${game.tow.length}隻を曳航中`;
      $('overlay-note').textContent = '時間は止まっています。準備ができたら、続きから。';
      $('primary').textContent = '航海を再開 →';
    } else if (game.status === 'won') {
      $('overlay-kicker').textContent = 'MISSION COMPLETE'; $('overlay-title').textContent = 'みんな、おかえり。';
      $('overlay-text').textContent = `6隻すべて救助！ 残り${Math.ceil(game.time)}秒`;
      $('overlay-note').textContent = `帰港${game.trips}回 / 最大${game.maxTow}隻つなぎ / 衝突${game.hits}回。もう一度、違う帰り方を試してみよう。`;
      $('primary').textContent = 'もう一度出港 →';
    } else if (game.status === 'lost') {
      $('overlay-kicker').textContent = 'NEXT VOYAGE'; $('overlay-title').textContent = game.reason === 'hull' ? '少し、休もう。' : '日が暮れました。';
      $('overlay-text').textContent = `${game.rescued} / 6隻を救助しました`;
      $('overlay-note').textContent = game.reason === 'hull' ? '長い船列は岩の角をかすめます。大きく回るか、1隻ずつ港へ帰ってみよう。' : '早めに港へ戻るのも、立派な作戦。次の航海でもう一度。';
      $('primary').textContent = 'もう一度出港 →';
    }
    if (game.status !== 'ready') $('primary').focus({ preventScroll: true });
  }
  function syncDom() {
    $('rescued').textContent = game.rescued;
    $('time').textContent = Math.ceil(game.time);
    document.querySelector('.timer').classList.toggle('low', game.time <= 20);
    $('hull').textContent = '●'.repeat(game.hull) + '○'.repeat(L.maxHull - game.hull);
    $('hull').setAttribute('aria-label', `船体 ${game.hull} / ${L.maxHull}`);
    $('tow-badge').innerHTML = `つないだ船 <b>${game.tow.length} / 3</b>`;
    $('control-title').textContent = game.tow.length === 3 ? '港へ、大きく回ろう' : game.tow.length ? '帰る？ もう1隻？' : 'ゆっくり曲がろう';
    let n = game.notice;
    if (game.status === 'playing' && n.until < game.elapsed) {
      n = { id: `guide-${game.tow.length}`, type: 'guide', text: game.tow.length ? '緑の小さな矢印が港の方向。1隻から帰港OK' : 'SOSの船に近づくと、自動でつながる' };
    }
    if (shownNotice !== n.id) { shownNotice = n.id; $('notice').textContent = n.text; $('notice').className = `notice ${n.type}`; }
    updateOverlay();
  }
  function suspend() {
    resetInput(); E.pause(game); previousTime = null; syncDom();
  }
  function togglePause() {
    resetInput();
    if (game.status === 'playing') E.pause(game);
    else if (game.status === 'paused') E.resume(game);
    previousTime = null; syncDom();
    if (game.status === 'playing') canvas.focus({ preventScroll: true });
  }
  $('primary').addEventListener('click', () => {
    if (game.status === 'ready') E.start(game);
    else if (game.status === 'paused') E.resume(game);
    else if (game.status === 'won' || game.status === 'lost') E.restart(game);
    resetInput(); previousTime = null; syncDom(); canvas.focus({ preventScroll: true });
  });
  $('pause').addEventListener('click', togglePause);
  $('restart').addEventListener('click', () => {
    E.restart(game); resetInput(); previousTime = null; syncDom(); canvas.focus({ preventScroll: true });
  });
  const keyMap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
  window.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if ((key === 'p' || key === 'Escape') && !event.repeat && (game.status === 'playing' || game.status === 'paused')) { event.preventDefault(); togglePause(); return; }
    if (keyMap[key] && game.status === 'playing') { event.preventDefault(); keys.add(key); }
  });
  window.addEventListener('keyup', event => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); });
  window.addEventListener('blur', suspend);
  document.addEventListener('visibilitychange', () => { if (document.hidden) suspend(); });
  document.querySelectorAll('.direction').forEach(button => {
    const release = () => { pads.delete(button); button.classList.remove('active'); };
    button.addEventListener('pointerdown', event => {
      if (game.status !== 'playing') return;
      event.preventDefault(); button.setPointerCapture(event.pointerId); pads.add(button); button.classList.add('active');
    });
    button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
    button.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && game.status === 'playing') { event.preventDefault(); pads.add(button); button.classList.add('active'); }
    });
    button.addEventListener('keyup', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); release(); } });
    button.addEventListener('blur', release);
  });
  canvas.addEventListener('pointerdown', event => {
    if (game.status !== 'playing' || drag) return;
    event.preventDefault(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(event.pointerId);
    const rect = canvas.getBoundingClientRect(); drag = { id: event.pointerId, x: event.clientX - rect.left, y: event.clientY - rect.top, dx: 0, dy: 0 };
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const rect = canvas.getBoundingClientRect(); const dx = event.clientX - rect.left - drag.x, dy = event.clientY - rect.top - drag.y;
    const scale = Math.max(1, Math.hypot(dx, dy) / 42); drag.dx = dx / scale; drag.dy = dy / scale;
  });
  const releaseDrag = event => { if (drag && drag.id === event.pointerId) drag = null; };
  canvas.addEventListener('pointerup', releaseDrag); canvas.addEventListener('pointercancel', releaseDrag); canvas.addEventListener('lostpointercapture', releaseDrag);
  function input() {
    let x = 0, y = 0;
    for (const key of keys) { x += keyMap[key][0]; y += keyMap[key][1]; }
    for (const button of pads) { x += Number(button.dataset.x); y += Number(button.dataset.y); }
    if (drag) { x += drag.dx / 42; y += drag.dy / 42; }
    return { x, y };
  }
  function frame(timestamp) {
    const dt = previousTime === null ? 0 : Math.min((timestamp - previousTime) / 1000, 0.08);
    previousTime = timestamp;
    E.advance(game, input(), dt); syncDom(); draw(); requestAnimationFrame(frame);
  }
  syncDom(); draw(); requestAnimationFrame(frame);
})();
