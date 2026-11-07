(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShadowEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const levels=[{name:'月を見上げるうさぎ',animal:'rabbit',target:[-22,-28,24],start:[26,35,-35]},{name:'冠羽をゆらす夜の鳥',animal:'bird',target:[18,-35,40],start:[-32,32,-30]},{name:'風を聴くきつね',animal:'fox',target:[-12,35,-32],start:[35,-38,35]}];
const limits=[[-45,45],[-55,55],[-50,50]];
function turn(p,deg){const a=deg*Math.PI/180;return{x:p.x*Math.cos(a)-p.y*Math.sin(a),y:p.x*Math.sin(a)+p.y*Math.cos(a)};}
function add(a,b){return{x:a.x+b.x,y:a.y+b.y};}
function geometry(p){const root={x:144,y:157},joint=add(root,turn({x:30,y:-15},p[0])),head=add(joint,turn({x:25,y:-23},p[0]+p[1]));return {root,joint,head,handles:[add(root,turn({x:-43,y:0},p[0])),head,add(head,turn({x:4,y:-44},p[0]+p[1]+p[2]))],probes:[add(root,turn({x:-43,y:0},p[0])),add(root,turn({x:0,y:27},p[0])),head,add(head,turn({x:4,y:-44},p[0]+p[1]+p[2]))]};}
function create(){return {level:0,pose:levels[0].start.slice(),selected:0,attempts:3,status:'ready',history:[],message:'青緑の輪郭に、影を重ねよう。'};}
function matches(s){const a=geometry(s.pose).probes,b=geometry(levels[s.level].target).probes;return a.every((p,i)=>Math.hypot(p.x-b[i].x,p.y-b[i].y)<=7);}
function remember(s){s.history.push(s.pose.slice());if(s.history.length>100)s.history.shift();}
function begin(s){if(s.status!=='ready')return false;s.status='playing';s.message='丸い取っ手を動かすか、部位と左右ボタンで調整。';return true;}
function select(s,i){if(s.status!=='playing'||!Number.isInteger(i)||i<0||i>2)return false;s.selected=i;return true;}
function setAngle(s,i,value,record=true){if(s.status!=='playing'||!Number.isInteger(i)||i<0||i>2||!Number.isFinite(value))return false;const v=Math.max(limits[i][0],Math.min(limits[i][1],value));if(s.pose[i]===v)return false;if(record)remember(s);s.pose[i]=v;return true;}
function nudge(s,delta){return Number.isFinite(delta)&&setAngle(s,s.selected,s.pose[s.selected]+delta);}
function submit(s){if(s.status!=='playing')return false;if(matches(s)){s.status=s.level===2?'won':'cleared';s.message=s.level===2?'三つの影が、物語になった！':'ぴたり！ 次の動物を演じよう。';}else{s.attempts--;s.message=s.attempts?'まだ輪郭がはみ出している。体から順に見てみよう。':'幕が下りた。もう一度、ゆっくり重ねよう。';if(!s.attempts)s.status='lost';}return true;}
function next(s){if(s.status!=='cleared')return false;s.level++;s.pose=levels[s.level].start.slice();s.attempts=3;s.history=[];s.selected=0;s.status='playing';s.message='新しい影。青緑の輪郭をよく見よう。';return true;}
function reset(s){s.pose=levels[s.level].start.slice();s.attempts=3;s.history=[];s.selected=0;s.status='playing';s.message='この演目を、はじめから。';}
function undo(s){if(s.status!=='playing'||!s.history.length)return false;s.pose=s.history.pop();return true;}
function keyAction(key,repeat,targetTag){if(['BUTTON','INPUT','SELECT','TEXTAREA'].includes(targetTag))return null;const k=key.toLowerCase();if(['arrowleft','a','arrowright','d'].includes(k))return{type:'nudge',value:['arrowleft','a'].includes(k)?-2:2};if(repeat)return null;if(['1','2','3'].includes(k))return{type:'select',value:Number(k)-1};if(k==='enter'||k===' ')return{type:'submit'};if(k==='z')return{type:'undo'};return null;}
return {levels,limits,geometry,create,begin,select,setAngle,nudge,matches,submit,next,reset,undo,keyAction,remember};
});
