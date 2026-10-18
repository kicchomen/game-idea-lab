(function () {
  'use strict';
  const E = PotteryWorkshop;
  const $ = id => document.getElementById(id);
  const canvas = $('clay'), ctx = canvas.getContext('2d');
  const orderButtons = Array.from(document.querySelectorAll('[data-order]'));
  let state = E.create(), drag = null;
  const CENTER = 180, TOP = 42, STEP = 28;
  const names = ['口', '口の下', '上の胴', '真ん中', '下の胴', '底の上', '底'];
  function potPath(profile) {
    const right = profile.map((width, i) => [CENTER + width, TOP + STEP * i]);
    const left = profile.map((width, i) => [CENTER - width, TOP + STEP * i]).reverse();
    ctx.beginPath(); ctx.moveTo(...right[0]);
    function side(points) {
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[Math.max(0, i - 1)], b = points[i], c = points[i + 1], d = points[Math.min(points.length - 1, i + 2)];
        ctx.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, ...c);
      }
    }
    side(right); ctx.lineTo(...left[0]); side(left); ctx.closePath();
  }

  function draw() {
    ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, 360, 290);
    const order = E.ORDERS[state.order], m = E.measure(state);
    ctx.fillStyle = '#eee3d0'; ctx.beginPath(); ctx.ellipse(CENTER, 244, 122, 21, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b59d7c'; ctx.fillRect(66, 238, 228, 11);
    ctx.fillStyle = '#d6c1a0'; ctx.beginPath(); ctx.ellipse(CENTER, 237, 114, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b6a080'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(CENTER, 237, 94, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#00000013'; ctx.beginPath(); ctx.ellipse(CENTER, 226, 78, 11, 0, 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createLinearGradient(90, 0, 265, 0);
    if (state.status === 'won') { grad.addColorStop(0, '#5f887b'); grad.addColorStop(.4, '#b0d2bd'); grad.addColorStop(1, '#668d7d'); }
    else { grad.addColorStop(0, '#935139'); grad.addColorStop(.38, '#d99a70'); grad.addColorStop(.7, '#c88b64'); grad.addColorStop(1, '#a65d42'); }
    potPath(state.profile); ctx.fillStyle = grad; ctx.fill(); ctx.strokeStyle = '#92593e'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.save(); potPath(state.profile); ctx.clip();
    ctx.strokeStyle = '#8d4e3021'; ctx.lineWidth = 1;
    for (let y = TOP + 8; y < TOP + 6 * STEP; y += 8) { ctx.beginPath(); ctx.ellipse(CENTER, y, 100, 8, 0, 0, Math.PI); ctx.stroke(); }
    if (state.status === 'shaping') { ctx.fillStyle = '#fff7d936'; ctx.fillRect(80, TOP + state.selected * STEP - 8, 200, 16); }
    ctx.restore();
    ctx.fillStyle = state.status === 'won' ? '#456859' : '#75452f'; ctx.beginPath(); ctx.ellipse(CENTER, TOP, state.profile[0], 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = state.status === 'won' ? '#bfd9c6' : '#e6ae82'; ctx.lineWidth = 3; ctx.stroke();
    if (state.status !== 'won') { potPath(order.target); ctx.setLineDash([5, 4]); ctx.strokeStyle = '#376b57'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
    for (let i = 0; i < 7; i++) {
      const y = TOP + STEP * i;
      ctx.fillStyle = i === state.selected && state.status === 'shaping' ? '#3c6150' : '#897e6b';
      ctx.font = i === state.selected ? 'bold 11px sans-serif' : '10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), 42, y + 4);
      ctx.fillStyle = m.errors[i] <= E.TOLERANCE ? '#4e7e5f' : '#b7ab97'; ctx.beginPath(); ctx.arc(319, y, 3.5, 0, Math.PI * 2); ctx.fill();
      if (state.status === 'shaping' && i === state.selected) {
        const x = CENTER + state.profile[i]; ctx.strokeStyle = '#fff4d4'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#4f6250'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↔', 292, y + 4);
      }
    }
    ctx.fillStyle = '#756854'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(state.status === 'won' ? '焼きあがり' : state.status === 'lost' ? 'この形でもう一度見比べよう' : '触れる高さを選んで、横にのばす', CENTER, 277);
  }
  function render() {
    const order = E.ORDERS[state.order], m = E.measure(state), shaping = state.status === 'shaping';
    $('customer').textContent = order.customer + 'より'; $('order-name').textContent = order.name; $('request').textContent = order.request;
    $('effort').textContent = String(state.remaining); $('matched').textContent = m.matched + ' / 7'; $('height').value = String(state.selected);
    $('height').disabled = !shaping;
    $('narrow').disabled = $('widen').disabled = !shaping || state.remaining === 0; $('fire').disabled = !shaping;
    $('fire').classList.toggle('ready', shaping && m.ready);
    $('feedback').classList.toggle('warning', shaping && state.remaining <= 3 && !m.ready);
    $('feedback').textContent = !shaping ? (state.status === 'won' ? '完成。7つの帯が注文に合いました。' : `注文の形まであと少し。合った帯は${m.matched} / 7。`) : m.ready ? '7つとも注文の形に合いました。焼いて渡せます。' : state.remaining === 0 ? '手数を使い切りました。焼くか、最初から。' : state.last && state.last.index === state.selected ? `${state.selected + 1}番を${state.last.direction > 0 ? '広げました' : 'すぼめました'}。残り${state.remaining}手。` : `${state.selected + 1}番・${names[state.selected]}：${m.errors[state.selected] <= E.TOLERANCE ? 'この帯は合っています' : state.profile[state.selected] < order.target[state.selected] ? 'もう少し広げたい' : 'もう少しすぼめたい'}`;
    $('current-shape').textContent = state.profile.map((value, i) => `${i + 1}番の太さ${value}、注文${order.target[i]}、${m.errors[i] <= E.TOLERANCE ? '一致' : '調整が必要'}`).join('。');
    orderButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === state.order)));
    $('result').hidden = shaping; $('next').hidden = state.status !== 'won' || state.order === E.ORDERS.length - 1;
    if (!shaping) {
      $('result-title').textContent = state.status === 'won' ? '気持ちのこもった器ができました' : '今回は、注文の形まであと少し';
      $('result-text').textContent = state.status === 'won' ? `${order.name}をお渡しできました。${state.used}手で完成、残り${state.remaining}手。${state.order === 2 ? '3つの注文がこの試遊の範囲です。気になる形を、もう一度。' : '次は少し違う形に挑戦しましょう。'}` : `合った帯は${m.matched} / 7。点線と重ならない高さを見直そう。手数は${order.budget}手に戻してやり直せます。`;
    }
    draw();
  }
  function apply(index, direction) { state = E.stroke(state, index, direction); render(); }
  function restart(order = state.order) { drag = null; state = E.create(order); render(); }
  $('narrow').addEventListener('click', () => apply(state.selected, -1));
  $('widen').addEventListener('click', () => apply(state.selected, 1));
  $('height').addEventListener('change', () => { state = E.select(state, Number($('height').value)); render(); });
  $('fire').addEventListener('click', () => { const next = E.fire(state); if (next === state) return; drag = null; state = next; render(); });
  $('retry').addEventListener('click', () => restart());
  $('next').addEventListener('click', () => { if (state.status === 'won' && state.order < 2) restart(state.order + 1); });
  orderButtons.forEach((button, i) => button.addEventListener('click', () => restart(i)));
  function point(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * 360 / rect.width, y: (event.clientY - rect.top) * 290 / rect.height }; }
  function heightAt(y) { return Math.max(0, Math.min(6, Math.round((y - TOP) / STEP))); }
  canvas.addEventListener('pointerdown', event => {
    if (state.status !== 'shaping' || drag || (event.button !== undefined && event.button !== 0)) return;
    event.preventDefault(); const p = point(event), index = heightAt(p.y);
    state = E.select(state, index); drag = { id: event.pointerId, x: p.x, index, side: p.x < CENTER ? -1 : 1, distance: 0 };
    canvas.setPointerCapture?.(event.pointerId); canvas.focus?.({ preventScroll: true }); render();
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId || state.status !== 'shaping') return;
    event.preventDefault(); const p = point(event), index = heightAt(p.y);
    if (index !== drag.index) { drag.index = index; drag.distance = 0; state = E.select(state, index); }
    else drag.distance += (p.x - drag.x) * drag.side;
    drag.x = p.x;
    while (Math.abs(drag.distance) >= 12 && state.remaining > 0) { const direction = Math.sign(drag.distance); state = E.stroke(state, index, direction); drag.distance -= direction * 12; }
    render();
  });
  function release(event) { if (drag && (!event || event.pointerId === undefined || drag.id === event.pointerId)) drag = null; }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => canvas.addEventListener(type, release));
  window.addEventListener('blur', () => release());
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });
  document.addEventListener('keydown', event => {
    const key = event.key, native = ['BUTTON', 'SELECT', 'SUMMARY', 'INPUT', 'TEXTAREA'].includes(event.target?.tagName);
    if (event.repeat) { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(key) || /^[1-7]$/.test(key)) event.preventDefault(); return; }
    if (native || event.ctrlKey || event.metaKey || event.altKey || state.status !== 'shaping') return;
    if (/^[1-7]$/.test(key)) { event.preventDefault(); state = E.select(state, Number(key) - 1); render(); }
    else if (key === 'ArrowUp' || key === 'ArrowDown') { event.preventDefault(); state = E.select(state, Math.max(0, Math.min(6, state.selected + (key === 'ArrowUp' ? -1 : 1)))); render(); }
    else if (key === 'ArrowLeft' || key === 'ArrowRight') { event.preventDefault(); apply(state.selected, key === 'ArrowLeft' ? -1 : 1); }
  });
  render();
})();
