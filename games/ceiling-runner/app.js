(() => {
  "use strict";
  const E = window.CeilingRunner;
  const el = (id) => document.getElementById(id);
  const canvas=el("rail"), ctx=canvas.getContext("2d"), overlay=el("overlay"), status=el("state"),
        marks=el("marks"), distance=el("distance"), gravity=el("gravity"),
        primary=el("primary"), secondary=el("secondary");
  let s=E.create(), last=0, accumulator=0, visibleWidth=0, visibleHeight=0, dpr=1;
  let mode, oldMarks, oldTarget, oldX;
  function renderStatus() {
    if(s.marks!==oldMarks){ marks.innerHTML=E.count(s.marks) + " <small>/ 6</small>"; oldMarks=s.marks; }
    if(s.target!==oldTarget){
      gravity.innerHTML=s.target===E.TOP?"↑ <small>天井へ</small>":"↓ <small>床へ</small>";
      oldTarget=s.target;
    }
    const pos=Math.round(s.x);
    if(pos!==oldX){distance.value=pos;oldX=pos;}
    if(mode===s.mode)return;
    mode=s.mode;
    overlay.hidden=mode==="running";
    secondary.disabled=mode!=="running"&&mode!=="paused";
    secondary.textContent=mode==="paused"?"最初から":"一時停止";
    if(mode==="running"){
      primary.textContent="重力を反転";
    }else if(mode==="ready"){
      primary.textContent="点検を始める";
      status.innerHTML="<b>整備ドックを目指せ</b><span>◆を4つ以上集めて到着</span>";
    }else if(mode==="paused"){
      primary.textContent="点検を続ける";
      status.innerHTML="<b>一時停止中</b><span>反転せず、その場から再開</span>";
    }else{
      primary.textContent="もう一度走る";
      const n=E.count(s.marks);
      if(mode==="won"){
        status.innerHTML="<b>点検成功！</b><span>点検マーカー "+n+" / 6</span>";
      }else{
        status.innerHTML=s.cause==="collision"?
          "<b>障害物にぶつかった</b><span>少し早めの反転がコツ</span>":
          "<b>点検マーカーが足りない</b><span>"+n+" / 6 回収（4つ必要）</span>";
      }
    }
  }
  function act(a){
    const n=E.command(s,a);
    if(n!==s && n.mode!==s.mode){accumulator=0;last=0;}
    s=n;
    renderStatus();
    if(n.mode==="running" && (a==="go"||a==="resume"||a==="restart"))primary.focus({preventScroll:true});
    draw();
  }
  function main(){
    if(s.mode==="ready") act("go");
    else if(s.mode==="paused")act("resume");
    else if(s.mode==="running")act("flip");
    else act("restart");
  }
  primary.addEventListener("click",main);
  secondary.addEventListener("click",()=>act(s.mode==="paused"?"restart":"pause"));
  canvas.addEventListener("pointerup", (e)=>{
    if(e.isPrimary && e.button===0 && s.mode==="running") act("flip");
  });
  window.addEventListener("keydown", (e)=>{
    if(e.repeat || e.isComposing || e.altKey || e.metaKey || e.ctrlKey || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName))return;
    if(e.code==="Space" && e.target?.closest("button"))return;
    if(e.code==="Space"){e.preventDefault();main();}
    if(e.code==="Escape" && (s.mode==="running"||s.mode==="paused")){
      e.preventDefault();act(s.mode==="running"?"pause":"resume");
    }
  });
  window.addEventListener("blur",()=>act("pause"));
  document.addEventListener("visibilitychange",()=>{if(document.hidden)act("pause");});
  function resize(){
    const size=canvas.getBoundingClientRect();
    dpr=Math.min(window.devicePixelRatio||1,2);
    visibleWidth=size.width; visibleHeight=size.height;
    canvas.width=Math.round(size.width*dpr);
    canvas.height=Math.round(size.height*dpr);
    draw();
  }
  new ResizeObserver(resize).observe(canvas);
  function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
  function line(x,y,x2,y2,color,width=1) {
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function diamond(x,y,r,color){
    ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x,y-r);ctx.lineTo(x+r,y);ctx.lineTo(x,y+r);ctx.closePath();
    ctx.fillStyle=color;ctx.fill();
  }
  function draw(){
    if(!visibleWidth || !visibleHeight)return;
    const ratio = Math.min(visibleHeight/E.H, visibleWidth/237);
    const width = visibleWidth/ratio, ox=width*.21-s.x, shown=1-ox;
    ctx.setTransform(dpr*ratio,0,0,dpr*visibleHeight/E.H,0,0);
    const bg=ctx.createLinearGradient(0,0,0,E.H);
    bg.addColorStop(0,"#152c43");bg.addColorStop(.52,"#18364c");bg.addColorStop(1,"#0f2233");
    rect(0,0,width,E.H,bg);
    for(let x=Math.floor(shown/54)*54;x+ox<=width+54;x+=54){
      const panel=x+ox;
      rect(panel,8,3,126,"#2b4558");
      rect(panel+5,51,38,3,"#1bf0da18");rect(panel+11,88,28,1,"#61dbed33");
      rect(panel+12,35,2,2,"#a8d9e4a0");rect(panel+42,75,2,2,"#a8d9e461");
    }
    rect(0,0,width,11,"#172030");rect(0,131,width,11,"#172030");
    rect(0,11,width,3,"#72909f");rect(0,128,width,3,"#72909f");
    for(let x=Math.floor(shown/16)*16;x+ox<width+16;x+=16){
      rect(x+ox,6,9,2,"#416072");rect(x+ox,135,9,2,"#416072");
    }
    if(E.GOAL+ox<width+15){
      const x=E.GOAL+ox;
      rect(x-3,14,9,114,"#254850");
      for(let y=16;y<128;y+=12)rect(x-2,y,6,6,"#7ef0c3");
      ctx.font="bold 9px sans-serif";ctx.fillStyle="#a8fbdf";ctx.textAlign="right";ctx.fillText("DOCK",x-7,75);
    }
    for(const [i,[px,py]] of E.points.entries()){
      if((s.marks>>i)&1||px+ox<-12||px+ox>width+12)continue;
      diamond(px+ox,py,10,"#92f5d744");diamond(px+ox,py,7,"#8ef8d2");diamond(px+ox,py,3,"#0f3843");
    }
    for(const [a,b,top,bottom] of E.hazards){
      const x=a+ox, w=b-a, h=bottom-top;
      if(x+w<0||x>width)continue;
      rect(x,top,w,h,"#eaa969");
      rect(x+1,top+1,w-2,h-2,"#85501f");
      ctx.save();ctx.beginPath();ctx.rect(x+2,top+2,w-4,h-4);ctx.clip();
      for(let i=-h;i<w+h;i+=11)line(x+i,bottom,x+i+h,top,"#f3bd76",3.5);
      ctx.restore();
      rect(x,top,w,2,"#ffe7bf");rect(x,bottom-2,w,2,"#b7844b");
    }
    const rx=s.x+ox, ry=s.y, sign=s.target===E.TOP?-1:1;
    if((mode==="running"||mode==="paused") && Math.abs(ry-s.target)>15){
      const guide=Math.max(16,Math.min(126,ry+sign*22));
      line(rx,ry+sign*14,rx,guide,"#abf4e0",1.5);
      line(rx,guide,rx-4,guide-sign*4,"#abf4e0",1.5);
      line(rx,guide,rx+4,guide-sign*4,"#abf4e0",1.5);
    }
    ctx.save();ctx.translate(rx,ry);ctx.scale(1,sign);
    rect(-8,-7,16,12, mode==="failed" && s.cause==="collision" ? "#ffae84" : "#96f5cb");
    rect(-6,-5,13,6,"#114141");
    rect(1,-4,4,3,"#c8fff0");
    rect(-8,4,5,4,"#67b9a0");rect(3,4,5,4,"#67b9a0");
    rect(-10,-1,2,3,"#70f5ca");
    ctx.restore();
  }
  function frame(t){
    if(s.mode==="running"){
      if(last) accumulator += Math.min(.2,(t-last)/1000);
      last=t;
      while(accumulator>=E.DT && s.mode==="running"){s=E.step(s);accumulator-=E.DT;}
      renderStatus();draw();
    }else{last=0;accumulator=0;}
    requestAnimationFrame(frame);
  }
  renderStatus();resize();requestAnimationFrame(frame);
})();
