import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gymImageOverlayLayout} from '../tools/pokearena/torre2-gym-image-background.js';
import {GYM_IMAGE_PREFLIGHT_VERSION,preflightGymImageOverlay}
 from '../tools/pokearena/torre2-gym-image-preflight.js';

test('T38: all eight gym image overlays pass pre-render AABB and mobile bounds',()=>{
 for(let stage=0;stage<8;stage++){
  const plan=gymImageOverlayLayout(stage);
  assert.equal(plan.safety.version,GYM_IMAGE_PREFLIGHT_VERSION);
  assert.equal(plan.safety.verified,true);
  assert.equal(plan.safety.stage,stage);
  assert.equal(plan.safety.hotspots.length,stage===0?3:4);
  assert.equal(plan.safety.responsive.length,3);
  assert.equal(plan.cameraZoom,1);
  assert.equal(gymImageOverlayLayout(stage),plan,'cache preflight once per stage');
  for(const viewport of plan.safety.responsive){
   assert.ok(viewport.scale>0);
   assert.ok(viewport.minimumTouchWidth>0);
   assert.ok(viewport.offsetX>=0&&viewport.offsetY>=0);
  }
 }
 assert.equal(gymImageOverlayLayout(8),null);
});

test('T38: reject corridor overlap BEFORE Phaser can create a touch zone',()=>{
 const good=gymImageOverlayLayout(2);
 const original=JSON.stringify(good);
 const bad={...good,slots:[{x:320,y:174},...good.slots.slice(1)]};
 assert.throws(()=>preflightGymImageOverlay(bad),/AABB overlap.*corridor/);
 assert.equal(JSON.stringify(good),original,'preflight never mutates plan');
});

test('T38: reject clipped actor, duplicated trainer and boss/ace overlap',()=>{
 const good=gymImageOverlayLayout(1);
 assert.throws(()=>preflightGymImageOverlay({
  ...good,slots:[{x:72,y:80},...good.slots.slice(1)]
 }),/out of bounds/);
 assert.throws(()=>preflightGymImageOverlay({
  ...good,slots:[good.slots[0],good.slots[0],...good.slots.slice(2)]
 }),/AABB overlap.*trainer/);
 assert.throws(()=>preflightGymImageOverlay({
  ...good,ace:{x:good.leader.x+12,y:good.leader.y}
 }),/AABB overlap.*leader \/ ace/);
 assert.throws(()=>preflightGymImageOverlay({...good,cameraZoom:1.5}),
  /invalid gym overlay plan/);
});

test('T38: mobile letterbox geometry rejects invalid viewport dimensions',()=>{
 const good=gymImageOverlayLayout(0);
 assert.throws(()=>preflightGymImageOverlay(good,{
  screens:[{width:0,height:480}]
 }),/invalid viewport/);
 assert.throws(()=>preflightGymImageOverlay(good,{screens:[]}),/no viewports/);
 const portrait=preflightGymImageOverlay(good,{
  screens:[{width:390,height:844}]
 }).responsive[0];
 assert.ok(portrait.offsetY>300);
 assert.ok(portrait.minimumTouchWidth>30);
});

test('T38: build and Phaser runtime import exactly the preflight module',()=>{
 const build=fs.readFileSync('tools/pokearena/build-preview.mjs','utf8');
 const image=fs.readFileSync('tools/pokearena/torre2-gym-image-background.js','utf8');
 assert.match(build,/torre2-gym-image-preflight\.js/);
 assert.match(image,/preflightGymImageOverlay\(plan\)/);
 assert.doesNotMatch(image,/Math\.random|localStorage|saveCampaign/);
});
