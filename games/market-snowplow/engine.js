(function (root, make) {
  const api = make();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Snowplow = api;
})(globalThis, function () {
  'use strict';
  const layout = Object.freeze([
    '.g.1.2.',
    '2.#.#1.',
    '...1..1',
    '1##2##.',
    '.11...2',
    '..#.#..',
    '1..S.g1',
  ]);
  const W = 7, H = layout.length, maxCargo = 4, limit = 38, repeatMs = 225;
  const dirs = Object.freeze({ up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] });
  const cells = layout.join('');
  const snowTotal = [...cells].reduce((n,c)=>n+(+c||0),0);
  const snowCells = [...cells].filter(c=>c==='1'||c==='2').length;
  const start = () => ({
    phase:'ready', at:cells.indexOf('S'), facing:'up',
    snow:[...cells].map(c=>+c||0), cargo:0, cleared:0,
    remaining:snowCells, moves:0, dumps:0, elapsed:0, feedback:''
  });
  const begin = s => s.phase === 'ready' ? {...s, phase:'running', feedback:'雪のある道へ進もう。'} : s;
  const togglePause = s => s.phase === 'running' ? {...s, phase:'paused'} : s.phase === 'paused' ? {...s, phase:'running'} : s;
  function advance(s, sec) {
    if (s.phase !== 'running' || !Number.isFinite(sec) || sec <= 0) return s;
    const elapsed = Math.min(s.elapsed + sec, limit);
    return elapsed >= limit ? {...s, elapsed, phase:'lost', feedback:'朝市の開店時間。次は排雪口を先に確認。'} : {...s, elapsed};
  }
  function move(s, dir) {
    if (s.phase !== 'running' || !Object.hasOwn(dirs,dir)) return s;
    const [dx,dy] = dirs[dir], x = s.at%W+dx, y = Math.floor(s.at/W)+dy;
    if (x<0 || y<0 || x>=W || y>=H || cells[y*W+x]==='#') return {...s, facing:dir, feedback:'屋台があって通れない。'};
    const at=y*W+x, depth=s.snow[at], changed={...s, at, facing:dir, moves:s.moves+1};
    if (!depth) return {...changed, feedback:cells[at]==='g' ? (s.cargo ? '排雪口。「排雪」で荷台が空に。' : '排雪口。荷台は空。') : ''};
    if (depth+s.cargo>maxCargo) return {...changed, feedback:'荷台に余裕がなく、この雪は残った。'};
    const snow=s.snow.slice(); snow[at]=0;
    return {...changed, snow, cleared:s.cleared+depth, cargo:s.cargo+depth, remaining:s.remaining-1, feedback:s.remaining===1?'通路の雪はゼロ。最後に排雪口で荷台を空に。':depth===2?'深雪を積んだ（2枠）。':'薄雪を積んだ（1枠）。'};
  }
  function dump(s) {
    if (s.phase!=='running') return s;
    if (cells[s.at]!=='g') return {...s,feedback:'「排雪」は青い排雪口の上で使える。'};
    if (!s.cargo) return {...s,feedback:'荷台は空。'};
    return {...s,cargo:0,dumps:s.dumps+1,phase:s.remaining===0?'won':'running',feedback:s.remaining===0?'通路が開いた！朝市の準備完了。':'排雪完了。次の通路へ。'};
  }
  return {layout,W,H,cells,dirs,maxCargo,limit,repeatMs,start,begin,togglePause,advance,move,dump,snowTotal,snowCells};
});
