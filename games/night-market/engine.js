(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NightMarket = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const GOODS = [{name:'お茶', icon:'🍵', cost:1}, {name:'ご飯',icon:'🍚',cost:2}, {name:'果物',icon:'🍊',cost:2}];
  const CAPACITY = 6, ROUNDS = 6, INITIAL = 12, TARGET = 40, FEE = 2;
  const RECIPES = [[2,0,0],[0,2,0],[0,0,2],[1,1,0],[1,0,1],[0,1,1],[1,1,1],[2,1,0],[1,0,2],[2,2,0],[0,2,2],[2,0,2],[2,1,1],[1,2,1],[1,1,2]];
  const sum = a => a.reduce((x,y)=>x+y,0);
  const cost = a => a.reduce((x,n,i)=>x+n*GOODS[i].cost,0);
  function rng(seed) {
    let n=2166136261;
    for (const c of String(seed)) n=Math.imul(n^c.charCodeAt(0),16777619);
    return function(){ n+=0x6D2B79F5; let t=n; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  }
  function schedule(seed) {
    const random=rng(seed);
    return Array.from({length:ROUNDS},(_,r)=>{
      const order=(late=false)=>{const needs=[...RECIPES[Math.floor(random()*RECIPES.length)]]; return {needs,price:cost(needs)+(late?8:2+Math.floor(random()*2))};};
      const known=[order(),order()];
      const candidates=[order(true),order(true),order(true)];
      return {known,candidates,hidden:Math.floor(random()*3),label:['宵の口','灯りの通り','人波の時間','夜風の路地','祭りの余韻','最後の灯り'][r]};
    });
  }
  function create(seed='2026-10-07') {
    return {seed:String(seed).slice(0,80),cash:INITIAL,round:0,phase:'shop',stock:[0,0,0],customer:0,served:0,waste:0,history:[],message:'まずは２人の注文を見て仕入れよう。',schedule:schedule(String(seed).slice(0,80))};
  }
  function canServe(stock,order) { return order.needs.every((n,i)=>stock[i]>=n); }
  function currentOrder(s) { const day=s.schedule[s.round]; return s.phase==='late' ? day.candidates[day.hidden] : day.known[s.customer]; }
  function endRound(s) {
    const waste=sum(s.stock); s.waste+=waste; s.history.push({round:s.round+1,cash:s.cash,waste}); s.stock=[0,0,0];
    if(s.round===ROUNDS-1) {s.phase='done';s.message=s.cash>=TARGET?'目標達成！夜市の仕入れ番、お見事。':'今夜は目標に届かず。注文と仕入れを見直して、もう一夜。';}
    else {s.round++;s.phase='shop';s.customer=0;s.message=`閉店。売れ残り ${waste} 個を片づけ、次の夜へ。`;}
  }
  function act(state,action) {
    const s=JSON.parse(JSON.stringify(state));
    if(s.phase==='done') throw new Error('今夜の営業は終了しました');
    const day=s.schedule[s.round];
    if(action.type==='buy'||action.type==='remove') {
      if(s.phase!=='shop') throw new Error('仕入れは開店前だけです');
      const i=action.good;if(!Number.isInteger(i)||!GOODS[i])throw new Error('商品が不正です');
      if(action.type==='buy') {if(sum(s.stock)>=CAPACITY)throw new Error('かごが満杯です');if(s.cash<GOODS[i].cost)throw new Error('所持金が足りません');s.cash-=GOODS[i].cost;s.stock[i]++;}
      else {if(s.stock[i]<1)throw new Error('在庫がありません');s.stock[i]--;s.cash+=GOODS[i].cost;}
      s.message='仕入れ中は「−」で無料で戻せます。';
    } else if(action.type==='open') {
      if(s.phase!=='shop')throw new Error('すでに開店しています');s.phase='known';s.customer=0;s.message='１人目のお客さん。売るか、見送るか。';
    } else if(action.type==='serve'||action.type==='skip') {
      if(!['known','late'].includes(s.phase))throw new Error('接客中ではありません');
      const o=currentOrder(s);
      if(action.type==='serve') {if(!canServe(s.stock,o))throw new Error('注文分の在庫が足りません');s.stock=s.stock.map((n,i)=>n-o.needs[i]);s.cash+=o.price;s.served++;s.message=`ありがとう！ ${o.price} 円の売上。`;}
      else s.message='このお客さんは見送りました。';
      if(s.phase==='late')endRound(s);
      else if(++s.customer>=day.known.length)s.phase='decision';
    } else if(action.type==='invite') {
      if(s.phase!=='decision')throw new Error('延長を選ぶ場面ではありません');if(s.cash<FEE)throw new Error('延長料が足りません');s.cash-=FEE;s.phase='late';s.message='２円で灯りを延長。夜更けのお客さんが来ました。';
    } else if(action.type==='close') {
      if(s.phase!=='decision')throw new Error('まだ接客中です');endRound(s);
    } else throw new Error('不明な操作です');
    return s;
  }
  return {GOODS,CAPACITY,ROUNDS,INITIAL,TARGET,FEE,sum,cost,rng,schedule,create,canServe,currentOrder,act};
});
