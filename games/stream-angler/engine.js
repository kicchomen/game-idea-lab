(function(root) {
  'use strict';
  const HZ = 60, LIMIT = 40;
  const runs = Object.freeze([3.7, 9.9, 14.6, 20.4, 26.7, 31.9, 37.6]);
  function activity(time) {
    for (const run of runs) {
      if (time >= run && time < run + 1.5 - 1e-9) return 'running';
      if (time >= run - 0.9 - 1e-9 && time < run) return 'warning';
    }
    return 'calm';
  }
  function initial() { return {phase:'ready',frame:0,time:0,distance:65,tension:20,cue:'calm',reason:null}; }
  function start() { return {...initial(),phase:'playing'}; }
  function tick(state, reeling) {
    if (state.phase !== 'playing') return state;
    const running = activity(state.time) === 'running';
    const frame = state.frame + 1, time = frame / HZ;
    const tensionRate = reeling ? (running ? 48 : 14) : (running ? 7 : -24);
    const distanceRate = reeling ? (running ? -2 : -12) : (running ? 7 : 2.5);
    const tension = Math.min(100, Math.max(0, state.tension + tensionRate / HZ));
    const distance = Math.min(100, Math.max(0, state.distance + distanceRate / HZ));
    let phase = 'playing', reason = null;
    if (tension >= 100) { phase = 'lost'; reason = 'line'; }
    else if (distance <= 0) phase = 'won';
    else if (frame >= HZ * LIMIT) { phase = 'lost'; reason = 'time'; }
    return {phase,frame,time,distance,tension,cue:activity(time),reason};
  }
  function pause(state) { return state.phase === 'playing' ? {...state,phase:'paused'} : state; }
  function resume(state) { return state.phase === 'paused' ? {...state,phase:'playing'} : state; }
  const api = {HZ,LIMIT,runs,activity,initial,start,tick,pause,resume};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.StreamAngler = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
