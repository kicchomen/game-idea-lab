'use strict';
// Node-only DOM stub: checks event/state logic, not rendering or native browser behavior.
const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const E=require('../games/pocket-forest/engine.js');
let document;
class Node {
 constructor(tag='DIV'){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.attrs={};this.style={};this.listeners={};this.className='';this.disabled=false;this.textContent='';this.classList={toggle:()=>{},remove:()=>{}};}
 set innerHTML(v){if(this.children.includes(document.activeElement))document.activeElement=document.body;this.children=[];this.html=v;}
 get innerHTML(){return this.html;}
 setAttribute(k,v){this.attrs[k]=v;}
 appendChild(n){this.children.push(n);}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
 querySelectorAll(q){return this.children.filter(n=>q==='.cell'?n.className.includes('cell'):false);}
 querySelector(q){const key=q.match(/data-focus-target="([^"]+)"/)?.[1];return this.children.find(n=>n.dataset.focusTarget===key)||null;}
 focus(){document.activeElement=this;for(const f of this.listeners.focus||[])f({target:this});}
 closest(q){return q==='.cell'&&this.className.includes('cell')?this:null;}
 click(){if(this.disabled)return;for(const f of this.listeners.click||[])f({target:this});}
}
const ids={}; document={body:new Node('body'),listeners:{},getElementById:id=>ids[id]??=(new Node()),createElement:t=>new Node(t),addEventListener(k,f){this.listeners[k]=f;},querySelector(q){for(const n of Object.values(ids)){const r=n.querySelector(q);if(r)return r;}return null;}};
document.activeElement=document.body;
const source=fs.readFileSync(require.resolve('../games/pocket-forest/app.js'),'utf8');
vm.runInNewContext(source,{window:{PocketForestEngine:E},document,CSS:{escape:s=>s},console});
const turn=()=>Number(ids['turn-count'].textContent);
const cell=i=>ids.board.children[i];
function key(k,repeat=false){document.listeners.keydown({key:k,repeat,target:document.activeElement,preventDefault(){}});}
assert.equal(turn(),0);
ids['place-button'].click();assert.equal(turn(),1);
ids['place-button'].click();assert.equal(turn(),1,'rapid second click must not commit next turn');
assert(document.activeElement.closest('.cell'),'focus stays in board after placement');
key('Enter');assert.equal(turn(),1,'Enter must require explicit next-cell selection');
key('ArrowRight');key('Enter',true);assert.equal(turn(),1,'repeated Enter must not place');
key('Enter');assert.equal(turn(),2,'arrow selection then Enter places');
key('u');assert.equal(turn(),1);assert(document.activeElement.closest('.cell'),'undo restores board focus');key('Enter');assert.equal(turn(),1,'undo must require next explicit selection');
key('r');assert.equal(turn(),0);assert.equal(document.activeElement.dataset.focusTarget,'cell:12');
key('Enter');assert.equal(turn(),1,'retry starts with center armed');
cell(9).click();ids['place-button'].click();assert.equal(turn(),2,'explicit click arms placement');
console.log('PASS: Node DOM-stub click/Enter rearming, rapid-click rejection, repeated Enter rejection, focus restoration, undo/retry');

const route=[['pond',7],['forest',0],['flower',6],['flower',8],['forest',1],['forest',2],['forest',3],['forest',24],['flower',22],['flower',20],['pond',18],['forest',16]];
key('r');
for(const [type,index] of route){ids['tile-options'].children.find(n=>n.dataset.focusTarget===`tile:${type}`).click();cell(index).click();ids['place-button'].click();}
assert.equal(turn(),12);assert.equal(Number(ids.score.textContent),10);assert.equal(ids['result-banner'].hidden,false);assert.match(ids['result-banner'].textContent,/集まった/);
cell(10).click();ids['place-button'].click();key('Enter');assert.equal(turn(),12);
key('u');assert.equal(turn(),11);assert.equal(ids['result-banner'].hidden,true);
key('r');
for(const i of [0,2,4,6,8,10,12,14,16,18,20,22]){cell(i).click();ids['place-button'].click();}
assert.equal(turn(),12);assert.equal(Number(ids.score.textContent),0);assert.match(ids['result-banner'].textContent,/あと一歩/);
console.log('PASS: Node DOM-stub full win/loss routes, result banner, end freeze and final-turn undo');
