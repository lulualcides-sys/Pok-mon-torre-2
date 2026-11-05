import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
const artwork=fs.readFileSync('tools/pokearena/torre2-campaign-art.js','utf8');
const selection=fs.readFileSync('tools/pokearena/torre2-selection-pages.mjs','utf8');
const methodStart=scene.indexOf(' uiSection(x,y,w,h,accent=0x5ba5c9){');
const methodEnd=scene.indexOf('\n mapScreen(state){',methodStart);
assert.ok(methodStart>0 && methodEnd>methodStart,'noncombat frame method must exist');

test('8-item arena selection keeps its native page arrows and fight buttons',()=>{
 assert.match(selection,/const POR_FILA=4;/);
 assert.match(selection,/FILAS=2;const POR_FILA=4;/);
 assert.match(selection,/this\.torre2Pages=Math\.ceil\(ROSTER\.length\/\(POR_FILA\*2\)\)/);
 assert.match(selection,/for\(const \[x,d,t\] of \[\[72,-1,"◀"\],\[568,1,"▶"\]\]\)/);
 assert.match(selection,/card\.objects=this\.children\.list\.slice\(before\)/);
 assert.match(selection,/o\.input\.enabled=show/);
 assert.doesNotMatch(selection,/\.scene\.start\(['"]combate/);
});

test('campaign common frame paints pixel art but registers no click zones',()=>{
 const ops=[],graphics={
  setDepth(depth){ops.push(['depth',depth]);return this},
  fillStyle(color,alpha){ops.push(['style',color,alpha]);return this},
  fillRect(x,y,w,h){ops.push(['rect',x,y,w,h]);return this}
 };
 const method=vm.runInNewContext('({'+scene.slice(methodStart,methodEnd)+'})',{}).uiSection;
 const instance={add:{graphics:()=>graphics}};
 assert.equal(method.call(instance,13,81,614,241,0x428ea9),graphics);
 const rects=ops.filter(x=>x[0]==='rect');
 assert.ok(rects.length>=8);
 assert.ok(rects.every(x=>x[3]>0&&x[4]>0),'frame must never produce inverted rectangles');
 assert.ok(ops.some(x=>x[0]==='depth'&&x[1]===0),'frame stays behind UI');
 assert.ok(!ops.some(x=>/interactive|zone|input/.test(String(x[0]))),'graphics must not capture touch');
});

test('screen-specific polish covers campaign panels without touching native fight renderer',()=>{
 const screens=['martScreen(state','teamScreen(state','bagScreen(state',
  'statusMedicineScreen(state','showSummary(state','pcScreen(state','dexScreen(state',
  'badgeCaseScreen(state','captureScreen(state','centerScreen(state',
  'enterTraining(state','rematchScreen(state','rematchAtlasScreen(state','gymScreen(state',
  'housesScreen(state'];
 for(const name of screens){
  const idx=scene.indexOf(' '+name);
  assert.ok(idx>=0,'missing native campaign screen: '+name);
  const next=scene.indexOf('\n }',idx);
  assert.ok(scene.slice(idx,next>=0?next:idx+2500).includes('this.uiSection('),
   'no consistent pixel panel on '+name);
 }
 assert.match(artwork,/One coherent noncombat visual system/);
 assert.match(scene,/this\.add\.zone\(x,y,w,Math\.max\(h,27\)\)/);
 assert.match(scene,/Avoid duplicate mobile purchase|duplicate-submit protection/i);
 assert.match(scene,/renderTrainerCardHub\(this,state,handlers\)/);
 assert.match(scene,/this\.scene\.start\('combate',match\)/);
});
