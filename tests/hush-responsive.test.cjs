'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=fs.readFileSync(path.join(__dirname,'../games/hush-courier/style.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../games/hush-courier/index.html'),'utf8');
test('narrow embed reserves overlay space and retains scrolling fallback (source regression, not visual QA)',()=>{
 const narrow=css.split('@media(max-width:360px){')[1].split('@media(prefers-reduced-motion')[0];
 assert.match(narrow,/\.stage\{min-height:240px;display:flex;align-items:center\}/);
 assert.match(narrow,/\.stage canvas\{flex-shrink:0\}/);
 assert.match(narrow,/\.overlay \.card\{max-height:100%;overflow-y:auto\}/);
});
test('narrow stage does not stretch canvas aspect ratio or remove state controls (source regression)',()=>{
 assert.match(html,/<canvas[^>]*width="480" height="340"/);
 assert.match(css,/canvas\{display:block;width:100%;height:auto\}/);
 for(const id of ['primary','restart','heading','description'])assert.ok(html.includes(`id="${id}"`));
});
