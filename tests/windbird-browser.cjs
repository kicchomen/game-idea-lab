'use strict';
// Real Chromium, real RAF and input events. The observer copies engine state;
// it never sets gameplay state, advances the clock, or steps the engine itself.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
let base=process.env.WINDBIRD_BASE_URL;
const out=path.resolve(process.env.WINDBIRD_QA_OUTPUT||path.join(__dirname,'../../qa'));
const records=[];
const errors=[];
const widths=(process.env.WINDBIRD_QA_WIDTHS||'1100,320,360,390').split(',').map(Number);
fs.mkdirSync(out,{recursive:true});
let browser;
let server,gameURL;
async function observe(page){
  await page.evaluate(()=>{
    const original=Windbird.step;
    Windbird.step=function(s,...args){const result=original(s,...args);window.__windbirdReadOnly={...s};return result;};
  });
}
async function layout(page,label){
  const result=await page.evaluate(()=>({
    width:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
    controls:[...document.querySelectorAll('.controls button')].map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})),
    visibleButtons:[...document.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height>0).map(b=>({text:b.textContent,height:b.getBoundingClientRect().height})),
    overlay:document.querySelector('#overlay').getBoundingClientRect().toJSON(),
    start:document.querySelector('#start').getBoundingClientRect().toJSON()
  }));
  assert.equal(result.scroll,result.client,label+' horizontal overflow');
  for(const b of result.controls){assert.ok(b.width>=44&&b.height>=44,label+' control target');}
  for(const b of result.visibleButtons){assert.ok(b.height>=44,label+' button '+b.text+' is shorter than 44px');}
  if(await page.locator('#overlay').isVisible())assert.ok(result.start.bottom<=result.overlay.bottom,label+' start clipped');
  records.push({check:label,...result});
}
async function capture(page,label){await page.screenshot({path:path.join(out,label+'.png'),fullPage:true});}
async function start(page,course=0){
  await page.locator('#course').selectOption(String(course));
  await page.locator('#start').click();
  await page.waitForFunction(()=>window.__windbirdReadOnly?.status==='playing');
}
async function keyboardRoute(page,course,label){
  await start(page,course);
  let held=false;
  let thermal=false,glide=false,flapping=false,shot=false;
  await page.keyboard.down('ArrowRight');
  const began=Date.now();
  while(Date.now()-began<55000){
    const s=await page.evaluate(()=>window.__windbirdReadOnly);
    if(s.status!=='playing')break;
    thermal=thermal||s.inThermal;glide=glide||(!s.flapping&&!s.inThermal);flapping=flapping||s.flapping;
    const target=course===0?(s.x<605?220:s.x<1050?95:280):course===1?(s.x<650?235:s.x<1160?75:280):(s.x<690?283:s.x<1270?230:s.x<1710?70:280);
    const flap=s.y+s.vy*.55>target&&s.energy>.5;
    if(flap!==held){await page.keyboard[flap?'down':'up']('Space');held=flap;}
    if(s.x>300&&!shot){await capture(page,label+'-thermal');shot=true;}
    await page.waitForTimeout(40);
  }
  await page.keyboard.up('Space');await page.keyboard.up('ArrowRight');
  const result=await page.evaluate(()=>window.__windbirdReadOnly);
  assert.equal(result.status,'won',label+' must land successfully');
  assert.ok(thermal&&glide&&flapping,label+' must use thermal, glide and flap');
  assert.equal(await page.locator('#headline').textContent(),'島へ無事に着地！');
  assert.equal(await page.locator('[data-input="flap"]').isDisabled(),true);
  records.push({check:label,result,thermal,glide,flapping});await capture(page,label);console.log('PASS',label,result.time.toFixed(2));
}
async function failureRetry(page,label){
  await start(page);
  await page.waitForFunction(()=>window.__windbirdReadOnly?.status==='lost',{},{timeout:12000});
  assert.match(await page.locator('#message').textContent(),/海まで降りて/);
  await capture(page,label+'-failure');
  await page.locator('#start').click();
  assert.ok(Number(await page.locator('#time').textContent())>41);
  await page.locator('#restart').click();
  assert.equal(await page.locator('#energy').textContent(),'100');
  assert.equal(await page.locator('#time').textContent(),'42.0');
  assert.equal(await page.locator('#start').textContent(),'飛び立つ');
  records.push({check:label+'-natural-sea-failure-retry-reset',pass:true});console.log('PASS',label,'failure/retry/reset');
}
async function pauseAndPointer(page){
  await start(page);
  const right=await page.locator('[data-input="right"]').boundingBox();
  await page.mouse.move(right.x+right.width/2,right.y+right.height/2);await page.mouse.down();
  await page.waitForTimeout(450);
  await page.keyboard.down('Space');await page.waitForTimeout(350);
  assert.match(await page.locator('#status').textContent(),/羽ばたいて/);
  await page.keyboard.up('Space');
  await page.keyboard.press('p');
  const time=await page.locator('#time').textContent();await page.waitForTimeout(250);
  assert.equal(await page.locator('#time').textContent(),time);
  await page.mouse.up();await page.locator('#start').click();await page.waitForTimeout(160);
  assert.equal(await page.locator('.controls .active').count(),0);
  const beforeLeft=await page.evaluate(()=>window.__windbirdReadOnly.x);
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(500);await page.keyboard.up('ArrowLeft');
  assert.ok(await page.evaluate(()=>window.__windbirdReadOnly.x)<beforeLeft);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#start').textContent(),'飛行を再開');
  await page.locator('#restart').click();records.push({check:'PC-held-pointer-keyboard-left-flap-P-Escape-pause-resume',pass:true,limitation:'Headless tab switching did not produce native window blur; interruption remains source/mock-DOM coverage'});console.log('PASS PC pointer/pause/resume');
}
async function touchCheck(page,label){
  await start(page);
  const session=await page.context().newCDPSession(page);
  const right=await page.locator('[data-input="right"]').boundingBox(),flap=await page.locator('[data-input="flap"]').boundingBox();
  const points=[right,flap].map((r,id)=>({x:r.x+r.width/2,y:r.y+r.height/2,id}));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});await page.waitForTimeout(350);
  assert.equal(await page.locator('.controls .active').count(),2);
  assert.match(await page.locator('#status').textContent(),/羽ばたいて/);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(100);
  assert.equal(await page.locator('.controls .active').count(),0);
  await session.detach();await page.locator('#restart').click();
  records.push({check:label+'-Chromium-simultaneous-touch-emulation-release',pass:true});
}
(async()=>{
  if(!base){
    const root=path.resolve(__dirname,'..');
    server=http.createServer((req,res)=>{
      let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(name.endsWith('/'))name+='index.html';
      const target=path.resolve(root,'.'+name);
      if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
      fs.readFile(target,(err,bytes)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'})[path.extname(target)]||'application/octet-stream');res.end(bytes);});
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    base='http://127.0.0.1:'+server.address().port+'/';
  }
  gameURL=new URL('games/windbird/',base).href;
  browser=await chromium.launch({headless:true});
  for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:900},hasTouch:width!==1100});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.goto(gameURL);await observe(page);
    await layout(page,'standalone-'+width+'-ready');await capture(page,'standalone-'+width+'-ready');
    if(width===1100){await pauseAndPointer(page);for(const course of [0,1,2])await keyboardRoute(page,course,'PC-course-'+(course+1));}
    else{await touchCheck(page,String(width));await keyboardRoute(page,0,'standalone-'+width+'-success');}
    await layout(page,'standalone-'+width+'-won');await failureRetry(page,String(width));
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1100,height:1000}}),page=await context.newPage();
  await page.goto(new URL('tests/windbird-responsive.html',base).href);
  for(const width of widths.filter(w=>w!==1100)){
    const child=await page.locator('iframe[width="'+width+'"]').elementHandle();
    const f=await child.contentFrame();await observe(f);await layout(f,'iframe-'+width+'-ready');
    // Keyboard input goes to the focused iframe; locator clicks establish focus.
    const adapter={...f,locator:s=>f.locator(s),evaluate:(...a)=>f.evaluate(...a),waitForFunction:(...a)=>f.waitForFunction(...a),keyboard:page.keyboard,waitForTimeout:ms=>page.waitForTimeout(ms),screenshot:opts=>child.screenshot(opts)};
    await keyboardRoute(adapter,0,'iframe-'+width+'-success');await failureRetry(adapter,'iframe-'+width);await layout(f,'iframe-'+width+'-reset');
  }
  await context.close();assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({at:new Date().toISOString(),browser:await browser.version(),base,mode:'Actual isolated headless Chromium with real RAF; responsive/touch emulation, no physical phone',errors,records},null,2)+'\n');
  console.log('PASS all browser checks, no page errors');
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(out,'browser-failure.json'),JSON.stringify({at:new Date().toISOString(),error:e.stack,records},null,2));process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(server)server.close();});
