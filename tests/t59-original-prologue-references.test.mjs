import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PROLOGUE_REFERENCE_SHEETS,MISSING_PROLOGUE_REFERENCE_IDS,validatePrologueReferenceSheet} from '../tools/pokearena/torre2-prologue-reference-sheets.js';
import {APPROVED_PROLOGUE_MAPS} from '../tools/pokearena/torre2-approved-prologue-assets.js';
import {APPROVED_MAPS_ATLAS} from '../tools/pokearena/torre2-approved-maps-atlas.js';

test('T59 three original user reference sheets exist and have exact original bytes',()=>{
 const original=JSON.parse(readFileSync('reference-assets/kanto/manifest.json','utf8'));
 const manifest=new Map(original.files.map(e=>[e.path,e]));
 assert.equal(PROLOGUE_REFERENCE_SHEETS.length,3);
 for(const sheet of PROLOGUE_REFERENCE_SHEETS){
  assert.equal(validatePrologueReferenceSheet(sheet),true);
  const bytes=readFileSync(sheet.source);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],sheet.source);
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  assert.deepEqual([width,height],[sheet.sourceWidth,sheet.sourceHeight]);
  const sha256=createHash('sha256').update(bytes).digest('hex');
  assert.equal(sha256,sheet.sha256);
  const originalRecord=manifest.get(sheet.source);
  assert.ok(originalRecord,'Missing original file provenance '+sheet.id);
  assert.equal(originalRecord.sha256,sha256);
  assert.equal(originalRecord.source,'user-uploaded reference sheet');
  assert.equal(originalRecord.usage,'reference only; not automatically loaded into the game');
  const {x,y,width:w,height:h}=sheet.crop;
  assert.ok(x>=0&&y>0&&x+w<=width&&y+h<=height);
 }
});
test('T59 crops exclude sheet titles and neighboring interiors, not claim 16:9 readiness',()=>{
 const [pallet,viridian,forest]=PROLOGUE_REFERENCE_SHEETS;
 assert.deepEqual(pallet.crop,{x:5,y:24,width:387,height:329});
 assert.deepEqual(viridian.crop,{x:6,y:24,width:770,height:640});
 assert.deepEqual(forest.crop,{x:6,y:24,width:868,height:1104});
 for(const sheet of PROLOGUE_REFERENCE_SHEETS){
  assert.notEqual(sheet.crop.width/sheet.crop.height,16/9);
  assert.equal(sheet.status,'reference-only');
  assert.throws(()=>validatePrologueReferenceSheet({
   ...sheet,crop:{...sheet.crop,x:sheet.sourceWidth}
  }));
 }
});
test('T59 missing standalone Route 1 remains explicit; cannot accidentally unlock stage zero',()=>{
 assert.deepEqual(MISSING_PROLOGUE_REFERENCE_IDS,['route-1']);
 assert.equal(APPROVED_PROLOGUE_MAPS.length,0,'References must never activate production');
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(APPROVED_MAPS_ATLAS.maps.some(m=>m.id==='route-1'),false);
 for(const sheet of PROLOGUE_REFERENCE_SHEETS)
  assert.equal(APPROVED_MAPS_ATLAS.maps.some(m=>m.id===sheet.id),false);
});
