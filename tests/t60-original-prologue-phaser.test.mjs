import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PROLOGUE_REFERENCE_SHEETS} from '../tools/pokearena/torre2-prologue-reference-sheets.js';
import {sourceSheet,sourceLayout,prologueReferenceKey,preloadSourceSheet,showSourceSheetPhaser} from '../tools/pokearena/torre2-prologue-source-preview.js';
test('T60 three references remain proportional on Phaser 640×360 with zero fabricated Route 1 art',()=>{
 assert.equal(PROLOGUE_REFERENCE_SHEETS.length,3);
 for(const sheet of PROLOGUE_REFERENCE_SHEETS){
  const rect=sourceLayout(sheet);
  assert.equal(rect.proportionsPreserved,true);
  assert.ok(rect.width<=640&&rect.height<=360);
  assert.ok(rect.x>=0&&rect.y>=0);
  assert.ok(Math.abs(2*rect.x+rect.width-640)<1e-7);
  assert.ok(Math.abs(2*rect.y+rect.height-360)<1e-7);
  assert.equal(sourceSheet(sheet.id),sheet);
 }
 assert.equal(sourceSheet('route-1'),null);
 assert.throws(()=>sourceLayout(null),TypeError);
});
test('T60 native Phaser frames isolate genuine exterior without touching saves',()=>{
 const sheet=PROLOGUE_REFERENCE_SHEETS[0],loaded=[],frames=[],drawn=[];
 const texture={getSourceImage:()=>({width:sheet.sourceWidth,height:sheet.sourceHeight}),
  has:()=>false,add:(...x)=>frames.push(x)};
 const scene={
  load:{image:(...x)=>loaded.push(x)},
  textures:{exists:()=>false,get:()=>texture},
  add:{image:(...x)=>{drawn.push(x);return {
    setOrigin(){return this},setDisplaySize(){return this},
    setDepth(){return this},setData(){return this}
  }}}
 };
 assert.equal(preloadSourceSheet(scene,sheet.id),true);
 assert.deepEqual(loaded,[[prologueReferenceKey(sheet.id),
  'assets/ui/kanto-reference-prologue/'+sheet.id+'.png']]);
 scene.textures.exists=()=>true;
 const result=showSourceSheetPhaser(scene,sheet.id);
 assert.equal(result.ok,true);
 assert.equal(result.interactive,false);
 assert.equal(result.sourceSha256,sheet.sha256);
 assert.deepEqual(frames[0],['exterior',0,
  sheet.crop.x,sheet.crop.y,sheet.crop.width,sheet.crop.height]);
 assert.equal(drawn.length,1);
 assert.equal(showSourceSheetPhaser(scene,'route-1').ok,false);
});
test('T60 build includes only audit-preview imports, not approved scene registration',()=>{
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.ok(build.includes("['tools/pokearena/torre2-prologue-source-preview.js','torre2-prologue-source-preview.js']"));
 assert.ok(build.includes("torre2/torre2-prologue-source-preview.js"));
 assert.ok(build.includes("createHash('sha256').update(bits).digest('hex')!==sheet.sha256"));
 const registry=readFileSync('tools/pokearena/torre2-approved-prologue-assets.js','utf8');
 assert.ok(registry.includes('APPROVED_PROLOGUE_MAPS=Object.freeze([])'));
});
