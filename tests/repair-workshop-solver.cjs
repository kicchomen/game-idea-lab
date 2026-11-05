// Exhaustive adaptive decision-tree search. Tests reveal only counts in <=3 parts.
const R=require('../games/repair-workshop/engine.js');
const probes=Array.from({length:63},(_,i)=>i+1).filter(n=>R.pop(n)<=3),memo=new Map();
function solve(c,depth){if(c.length===1)return {fault:c[0]};if(depth===0)return null;const key=c.join(',')+':'+depth;if(memo.has(key))return memo.get(key);const ranked=probes.map(mask=>({mask,groups:[0,1,2].map(count=>c.filter(f=>R.pop(f&mask)===count))})).sort((a,b)=>Math.max(...a.groups.map(x=>x.length))-Math.max(...b.groups.map(x=>x.length)));for(const {mask,groups} of ranked){if(groups.some(x=>x.length===c.length))continue;const next=groups.map(g=>g.length?solve(g,depth-1):null);if(groups.every((g,i)=>!g.length||next[i])){const result={mask,next};memo.set(key,result);return result;}}memo.set(key,null);return null;}
function route(fault){let t=solve(R.PAIRS,4),steps=[];while(t&&t.fault===undefined){const count=R.pop(fault&t.mask);steps.push({mask:t.mask,parts:R.names(t.mask),count});t=t.next[count];}return {fault:t?.fault,steps};}
module.exports={solve,route};
if(require.main===module){const fs=require('node:fs'),out={threeProbesSuffice:!!solve(R.PAIRS,3),fourProbesSuffice:!!solve(R.PAIRS,4),tree:solve(R.PAIRS,4),routes:R.PAIRS.map(route),defaultJobs:R.masks(20261105).map(route)};console.log(JSON.stringify(out,null,2));}
