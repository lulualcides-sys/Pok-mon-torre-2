import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {visibleFootOrigin,nativePmdFootOrigin} from
 '../tools/pokearena/torre2-gym-ace-ground.js';
import {approvedMapImagePath,USER_SURGE_OVERRIDE_PATH} from
 '../tools/pokearena/torre2-approved-map-renderer.js';
import {firstApprovedGymActors} from
 '../tools/pokearena/torre2-approved-map-first-scenes.js';

const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceSha='6ad10368ae69d1be43a07ad31aecafce21e4a8a076c37eac2e73f6271653d469';

test('T80: the one Surge override matches user upload and cannot change 60 originals',()=>{
 const manifest=JSON.parse(readFileSync(
  'assets/ui/kanto-overrides/gym-surge-user.json','utf8'));
 const pixels=readFileSync(USER_SURGE_OVERRIDE_PATH);
 assert.equal(manifest.id,'gym-surge');
 assert.equal(manifest.width,1280);assert.equal(manifest.height,720);
 assert.equal(manifest.source_sha256,sourceSha);
 assert.equal(manifest.bytes,pixels.length);
 assert.equal(manifest.optimized_sha256,hash(pixels));
 assert.equal(pixels.toString('ascii',0,4),'RIFF');
 assert.equal(pixels.toString('ascii',8,12),'WEBP');
 assert.equal(approvedMapImagePath('gym-surge'),USER_SURGE_OVERRIDE_PATH);
 const originalManifest=JSON.parse(readFileSync(
  'assets/ui/kanto-approved-maps/approved-maps-atlas.json','utf8'));
 assert.equal(originalManifest.maps.length,60);
 const oldSurge=originalManifest.maps.find(m=>m.id==='gym-surge');
 assert.ok(oldSurge);
 assert.notEqual(oldSurge.image,USER_SURGE_OVERRIDE_PATH);
 assert.equal(hash(readFileSync(oldSurge.image)),oldSurge.optimized_sha256);
 assert.equal(manifest.original_approved_art_preserved,true);
});

test('T80 alpha-aware gym sprite feet return actual visible bottom row',()=>{
 const w=4,h=6,pixels=new Uint8ClampedArray(w*h*4);
 // First opaque pixel y=1 and LAST opaque pixel y=3. Transparent tail y4..5.
 pixels[(1*w+1)*4+3]=255;
 pixels[(3*w+1)*4+3]=255;
 assert.equal(visibleFootOrigin(pixels,w,h),4/6);
 assert.equal(visibleFootOrigin(pixels,w,h,256),1);
 assert.equal(visibleFootOrigin(null,w,h),1);
 assert.equal(visibleFootOrigin(pixels,w,0),1);
 assert.equal(nativePmdFootOrigin(null,null),1);
});

test('T80: all five gym leaders use the same floor line as the PMD ace',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes('const ace=project(actors.ace.cx,actors.leader.cy);'));
 assert.ok(scene.includes("import {nativePmdFootOrigin} from './torre2-gym-ace-ground.js';"));
 for(const [id,dex,stage,total] of [
  ['gym-brock','0095',0,13],['gym-misty','0121',1,15],
  ['gym-surge','0026',2,17],['gym-erika','0045',3,19],
  ['gym-koga','0110',4,21]]){
  assert.equal(firstApprovedGymActors(id,total).ace.dex,dex);
  assert.ok(scene.includes(dex),'missing native PMD first-frame sheet '+id);
 }
 assert.ok(!scene.includes(".setDisplaySize(30,30).setDepth(24)"),
  'gym Pokémon must not fallback to tiny decorative portrait');
 assert.ok(scene.includes("setData('torre2-gym-ace-source','pmd-idle')"));
 // Vileplume already has calibrated alpha origin and must preserve it.
 assert.ok(scene.includes('.setOrigin(.5,26/40).setScale(scale).setDepth(24)'));
});

test('T80: original battle teams and story indices remain entirely unchanged',()=>{
 const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
 const i=core.indexOf("leader:'Lt. Surge'");
 assert.ok(i>=0);
 assert.ok(core.slice(i,i+700).includes("boss:'raichu'"));
 const surge=firstApprovedGymActors('gym-surge',17);
 assert.deepEqual(surge.trainers.map(t=>t.index),[13,14,15,16]);
 assert.deepEqual(surge.trainers.map(t=>t.kind),
  ['sailor','rocker','gentleman','worker_m']);
});
