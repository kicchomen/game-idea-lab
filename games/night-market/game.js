(function(){
  'use strict';
  const E=window.NightMarket, app=document.querySelector('#app');
  let serial=0, state=E.create('2026-10-07');
  const needs=o=>o.needs.map((n,i)=>n?`<span class="need">${E.GOODS[i].icon} ${E.GOODS[i].name} ×${n}</span>`:'').join('');
  const order=(o,label,cls='')=>`<article class="order ${cls}"><h3>${label}</h3><div class="needs">${needs(o)}</div><p class="price">${o.price}円</p></article>`;
  const button=(type,label,disabled=false,cls='')=>`<button data-action="${type}" class="${cls}" ${disabled?'disabled':''}>${label}</button>`;
  function render(){
    const s=state, day=s.schedule[s.round], shop=s.phase==='shop',done=s.phase==='done';
    let body=`<div class="stats"><div class="stat"><span>営業</span><strong>${s.round+1} / 6 夜</strong></div><div class="stat"><span>所持金</span><strong>${s.cash} 円</strong></div><div class="stat"><span>最終目標</span><strong>40 円</strong></div></div><div class="progress" role="progressbar" aria-label="目標金額への進捗" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${Math.min(40,s.cash)}"><span style="width:${Math.min(100,s.cash/40*100)}%"></span></div>`;
    if(done){
      const win=s.cash>=E.TARGET;
      body+=`<section class="result ${win?'':'loss'}"><p class="section-label">６夜の営業終了</p><h2>${win?'夜市の名仕入れ番！':'もう一夜、腕試し。'}</h2><p>最終所持金 <strong>${s.cash}円</strong> / 目標40円</p><p>${win?'仕入れと引き際が実を結びました。':'あと'+(40-s.cash)+'円。かごの配分と延長の判断を変えてみよう。'}</p><p class="hint">接客成功 ${s.served}人 · 売れ残り ${s.waste}個</p><ol class="history">${s.history.map(h=>`<li>${h.round}夜目：${h.cash}円 / 売れ残り${h.waste}個</li>`).join('')}</ol><div class="actions">${button('retry','同じ夜市でもう一度',false,'primary')}${button('new','別の夜市に出店')}</div></section>`;
    }else{
      body+=`<p class="section-label">第${s.round+1}夜 · ${day.label}</p><h2>${shop?'① 注文を見て、仕入れる':s.phase==='known'?'② お客さんに売る':s.phase==='decision'?'③ 延長する？ 閉店する？':'夜更けのお客さん'}</h2><div class="orders">${day.known.map((o,i)=>order(o,`${i+1}人目・確定`,s.phase==='known'&&s.customer===i?'active':!shop&&(s.customer>i||['decision','late'].includes(s.phase))?'past':'')).join('')}</div><section class="late-panel"><h3>夜更けの来客予報</h3><p>２人の後に、２円で延長できます。下の３候補から各1/3で１人だけ来店。</p><div class="late-list">${day.candidates.map((o,i)=>order(o,`候補${i+1} · 1/3`)).join('')}</div></section><section class="stock-panel"><div class="stock-head"><h2>仕入れかご</h2><span>${E.sum(s.stock)} / 6枠</span></div><div class="goods">${E.GOODS.map((g,i)=>`<div class="good"><div class="icon" aria-hidden="true">${g.icon}</div><strong>${g.name}</strong><small>仕入れ ${g.cost}円 / 個</small><div class="counter">${shop?`<button data-action="remove" data-good="${i}" aria-label="${g.name}を１個戻す" ${s.stock[i]===0?'disabled':''}>−</button>`:''}<strong aria-label="${g.name}の在庫${s.stock[i]}個">${s.stock[i]}</strong>${shop?`<button data-action="buy" data-good="${i}" aria-label="${g.name}を１個仕入れる" ${s.cash<g.cost||E.sum(s.stock)>=6?'disabled':''}>＋</button>`:''}</div></div>`).join('')}</div>${shop?'<p class="hint">「−」で全額返金。開店後は追加仕入れできません。</p>':''}</section>`;
      if(s.phase==='late'||s.phase==='known')body+=order(E.currentOrder(s),s.phase==='late'?'実際に来た注文':`いま接客中：${s.customer+1}人目`,'active');
      body+='<div class="actions">';
      if(shop)body+=button('open','この仕入れで開店',false,'primary');
      if(s.phase==='known'||s.phase==='late') {const ok=E.canServe(s.stock,E.currentOrder(s));body+=button('serve',ok?'注文を渡す · '+E.currentOrder(s).price+'円':'在庫不足で売れません',!ok,'primary')+button('skip',s.phase==='late'?'見送って閉店':'この客を見送る');}
      if(s.phase==='decision'){const odds=day.candidates.filter(o=>E.canServe(s.stock,o)).length;body+=button('invite','２円で延長する',s.cash<2,'primary')+button('close','ここで閉店');body+=`</div><p class="hint">今の在庫で売れる候補：${odds} / 3。閉店後は残った商品をすべて廃棄します。</p><div>`;}
      body+='</div>';
    }
    body+=`<p class="seed">夜市番号：${s.seed}</p>`;
    app.innerHTML=body;
    document.querySelector("#notice").textContent=s.message;
  }
  app.addEventListener('click',event=>{const b=event.target.closest('button[data-action]');if(!b||b.disabled||!app.contains(b))return;const action=b.dataset.action;const oldFocus={action,good:b.dataset.good};try{if(action==='retry')state=E.create(state.seed);else if(action==='new')state=E.create(`market-${Date.now().toString(36)}-${++serial}`);else state=E.act(state,{type:action,good:b.dataset.good===undefined?undefined:Number(b.dataset.good)});render();const same=app.querySelector(`button[data-action="${oldFocus.action}"]${oldFocus.good!==undefined?'[data-good="'+oldFocus.good+'"]':''}:not(:disabled)`);const next=same||app.querySelector('.actions button:not(:disabled)');if(next)next.focus({preventScroll:true});}catch(error){const notice=document.querySelector("#notice");notice.textContent=error.message;}});
  app.addEventListener('keydown',event=>{if(event.repeat&&(event.key==='Enter'||event.key===' '))event.preventDefault();});
  render();
})();
