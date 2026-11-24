(function (root, make) {
  "use strict";
  const api = make();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CeilingRunner = api;
})(typeof globalThis === "object" ? globalThis : this, function () {
  "use strict";
  const H = 142, TOP = 21, BOTTOM = 121, SPEED = 81, LIFT = 172, RADIUS = 9;
  const GOAL = 1040, REQUIRED = 4, DT = 1 / 120;
  const hazards = Object.freeze([
    [151,198,94,128],[300,344,14,49],[438,479,89,128],[500,530,54,91],
    [605,650,14,53],[746,788,89,128],[885,917,14,53],[925,948,53,89]
  ].map((v) => Object.freeze(v)));
  const points = Object.freeze([
    [104,BOTTOM],[251,TOP],[390,BOTTOM],[555,TOP],[698,BOTTOM],[833,TOP]
  ].map((v) => Object.freeze(v)));
  function create(mode = "ready") {
    return {mode, x: 0, y: BOTTOM, target: BOTTOM, marks: 0, ticks: 0, cause: null};
  }
  const count = (marks) => points.reduce((sum,_,i) => sum+((marks>>i)&1),0);
  function command(s, action) {
    if (action === "restart") return create("running");
    if (action === "go" && s.mode === "ready") return create("running");
    if (action === "pause" && s.mode === "running") return {...s, mode:"paused"};
    if (action === "resume" && s.mode === "paused") return {...s, mode:"running"};
    if (action === "flip" && s.mode === "running" && s.y === s.target)
      return {...s,target:s.target === TOP ? BOTTOM : TOP};
    return s;
  }
  function hits(x, y, box) {
    const [left, right, top, bottom] = box;
    const dx = x - Math.max(left, Math.min(x, right));
    const dy = y - Math.max(top, Math.min(y, bottom));
    return dx*dx + dy*dy < RADIUS*RADIUS;
  }
  function step(s) {
    if (s.mode !== "running") return s;
    const x = Math.min(GOAL, s.x + SPEED * DT);
    const y = s.y < s.target ? Math.min(s.target, s.y+LIFT*DT) : Math.max(s.target, s.y-LIFT*DT);
    const next = {...s, x, y, ticks:s.ticks + 1};
    if (hazards.some((box) => hits(x,y,box))) return {...next,mode:"failed",cause:"collision"};
    for (let i=0; i<points.length; ++i) {
      if ((s.marks>>i)&1) continue;
      const [px, py] = points[i];
      if (Math.hypot(x-px,y-py) <= 19) next.marks |= 1<<i;
    }
    if (x >= GOAL) {
      return (count(next.marks) >= REQUIRED) ? {...next,mode:"won"} : {...next,mode:"failed",cause:"missed"};
    }
    return next;
  }
  return Object.freeze({H,TOP,BOTTOM,SPEED,LIFT,RADIUS,GOAL,REQUIRED,DT,hazards,points,create,command,step,count,hits});
});
