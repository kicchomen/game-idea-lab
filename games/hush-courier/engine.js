(function (root, factory) {
  const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.HushCourier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DT = 1 / 60, LIMIT = 55, CYCLE = 8.5;
  const HOMES = Object.freeze([145, 280, 425]);
  function create() { return {tick:0, time:0, x:28, suspicion:0, breath:3.5, delivered:[false,false,false], delivery:0, status:'ready', reason:'', hidden:false, moving:false, running:false, lastDelivery:-1}; }
  function phase(s) { const t = s.time % CYCLE; return t < 4.5 ? 'sleep' : t < 5.5 ? 'warning' : 'watch'; }
  function cover(s) { return HOMES.findIndex(x => Math.abs(s.x-x) <= 23); }
  function start(s) { if(s.status === 'ready') s.status='playing'; return s; }
  function pause(s) { if(s.status === 'playing') {s.status='paused';s.moving=false;s.running=false;} return s; }
  function resume(s) { if(s.status === 'paused') s.status='playing'; return s; }
  function step(s, input={}) {
    if(s.status !== 'playing') return s;
    s.tick++; s.time=s.tick*DT;
    const direction = input.left === input.right ? 0 : input.left ? -1 : input.right ? 1 : 0;
    const canHide=!!input.hide && cover(s)>=0 && s.breath>DT;
    s.hidden=canHide; s.running=!!input.run && direction!==0 && !input.hide;
    const speed = input.hide ? 0 : s.running ? 45 : 18;
    const old=s.x; s.x=Math.max(28,Math.min(452,s.x+direction*speed*DT));
    s.moving=Math.abs(s.x-old)>0.00001; if(!s.moving) s.running=false;
    s.breath=Math.max(0,Math.min(3.5,s.breath+(canHide ? -1 : input.hide ? 0 : 1.3)*DT));
    const p=phase(s); let rate;
    if(canHide) rate=-20;
    else if(p==='watch') rate= s.running ? 65 : s.moving ? 42 : 36;
    else rate=s.running ? (p==='warning' ? 24 : 12) : -14;
    s.suspicion=Math.max(0,Math.min(100,s.suspicion+rate*DT));
    const home=HOMES.findIndex((x,i)=>!s.delivered[i] && Math.abs(s.x-x)<=18);
    if(home>=0 && !s.moving) {
      s.delivery+=DT;
      if(s.delivery>=0.65) {s.delivered[home]=true;s.lastDelivery=home;s.delivery=0;}
    } else s.delivery=0;
    if(s.suspicion>=100) {s.status='lost';s.reason='巨人が目を覚ました';}
    else if(s.delivered.every(Boolean)) {s.status='won';s.reason='3つの灯りに、お届け完了';}
    else if(s.time>=LIMIT) {s.status='lost';s.reason='夜明けの鐘が鳴った';}
    return s;
  }
  return {DT,LIMIT,CYCLE,HOMES,create,phase,cover,start,pause,resume,step};
});
