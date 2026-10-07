'use strict';
const E=require('../../games/night-market/engine.js');
function buy(s,stock){for(let i=0;i<3;i++)for(let n=0;n<stock[i];n++)s=E.act(s,{type:'buy',good:i});return s;}
function bestPlan(s,forecast=true){
  const day=s.schedule[s.round];let best={value:-Infinity};
  for(let a=0;a<=6;a++)for(let b=0;b<=6-a;b++)for(let c=0;c<=6-a-b;c++){
    const basket=[a,b,c],spend=E.cost(basket);if(spend>s.cash)continue;
    for(let mask=0;mask<4;mask++){
      let stock=[...basket],cash=s.cash-spend,valid=true;
      for(let i=0;i<2;i++)if(mask&(1<<i)){if(!E.canServe(stock,day.known[i])){valid=false;break;}stock=stock.map((n,j)=>n-day.known[i].needs[j]);cash+=day.known[i].price;}
      if(!valid)continue;
      const expectation=day.candidates.reduce((n,o)=>n+(E.canServe(stock,o)?o.price:0),0)/3-E.FEE;
      const invite=forecast&&cash>=E.FEE&&expectation>0;
      const value=cash+(invite?expectation:0);
      if(value>best.value+1e-9||(Math.abs(value-best.value)<1e-9&&spend<best.spend))best={basket,mask,invite,value,spend};
    }
  }
  return best;
}
function simulate(seed,policy='forecast'){
  let s=E.create(seed);
  for(let r=0;r<6;r++){
    let plan;
    if(policy==='full') {const basket=[2,2,2];while(E.cost(basket)>s.cash){const i=basket.findIndex(n=>n>0);basket[i]--;}plan={basket,mask:3,invite:true};}
    else plan=bestPlan(s,policy==='forecast');
    s=buy(s,plan.basket);s=E.act(s,{type:'open'});
    for(let i=0;i<2;i++)s=E.act(s,{type:(plan.mask&(1<<i))&&E.canServe(s.stock,E.currentOrder(s))?'serve':'skip'});
    if(plan.invite&&s.cash>=E.FEE){s=E.act(s,{type:'invite'});s=E.act(s,{type:E.canServe(s.stock,E.currentOrder(s))?'serve':'skip'});}else s=E.act(s,{type:'close'});
  }
  return s;
}

module.exports={buy,bestPlan,simulate};
