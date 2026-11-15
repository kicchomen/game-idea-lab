(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.ForestTricks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const suits=['leaf','water'];
function rng(seed){let x=seed>>>0;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};}
function create(seed=1511){seed=Number.isFinite(+seed)?(+seed>>>0):1511;const random=rng(seed);const deck=suits.flatMap(s=>Array.from({length:7},(_,i)=>({id:s[0]+(i+1),suit:s,value:i+1})));for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}const sort=a=>a.sort((a,b)=>a.suit.localeCompare(b.suit)||a.value-b.value);return{seed,trump:suits[seed%2],hands:[sort(deck.slice(0,5)),sort(deck.slice(5,10))],phase:'bid',bid:null,wins:0,trick:0,leader:0,lead:null,last:null,history:[],result:null};}
function legal(hand,lead){if(!lead)return hand.map(c=>c.id);const follows=hand.filter(c=>c.suit===lead.suit);return(follows.length?follows:hand).map(c=>c.id);}
function beats(a,b,lead,trump){if(a.suit===b.suit)return a.value>b.value;if(a.suit===trump)return true;if(b.suit===trump)return false;return a.suit===lead;}
function choose(hand,lead,trump){const cards=hand.filter(c=>legal(hand,lead).includes(c.id));const cost=c=>c.value+(c.suit===trump?10:0);cards.sort((a,b)=>cost(a)-cost(b));if(lead){const winners=cards.filter(c=>beats(c,lead,lead.suit,trump));if(winners.length)return winners[0];}return cards[0];}
function copy(s){return JSON.parse(JSON.stringify(s));}
function bid(s,n){if(s.phase!=='bid'||!Number.isInteger(n)||n<0||n>5)return s;const t=copy(s);t.bid=n;t.phase='play';return t;}
function play(s,id){if(s.phase!=='play'||!legal(s.hands[0],s.lead).includes(id))return s;const t=copy(s);const pc=t.hands[0].find(c=>c.id===id);let oc=t.lead;if(!oc)oc=choose(t.hands[1],pc,t.trump);const lead=t.lead||pc;const win=beats(pc,oc,lead.suit,t.trump)?0:1;t.hands[0]=t.hands[0].filter(c=>c.id!==pc.id);if(!t.lead)t.hands[1]=t.hands[1].filter(c=>c.id!==oc.id);t.last={player:pc,opponent:oc,winner:win,leader:t.leader};t.history.push(t.last);t.trick++;if(win===0)t.wins++;t.leader=win;t.lead=null;t.phase='reveal';return t;}
function next(s){if(s.phase!=='reveal')return s;const t=copy(s);if(t.trick===5){t.phase='result';t.result=t.wins===t.bid?'success':'failure';return t;}t.phase='play';if(t.leader===1){t.lead=choose(t.hands[1],null,t.trump);t.hands[1]=t.hands[1].filter(c=>c.id!==t.lead.id);}return t;}
return{create,bid,play,next,legal,beats,choose};});
