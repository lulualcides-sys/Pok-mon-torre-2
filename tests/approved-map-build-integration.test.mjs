import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
test('T42 approved Phaser map imports are copied into the browser module tree',()=>{
 for(const [source,target] of [
  ['torre2-approved-maps-atlas.js','torre2-approved-maps-atlas.js'],
  ['torre2-approved-map-renderer.js','torre2-approved-map-renderer.js'],
  ['torre2-approved-map-first-scenes.js','torre2-approved-map-first-scenes.js']
 ]){
  assert.ok(build.includes("['tools/pokearena/"+source+"','"+target+"']"),source);
  assert.ok(build.includes("'torre2/"+target+"'"),target+' must be fingerprinted');
 }
});
test('T42 cannot publish enabled maps with absent, malformed or fewer than 60 WebP files',()=>{
 assert.ok(build.includes('APPROVED_MAP_ASSETS_READY = true;'));
 assert.ok(build.includes('entries.length!==60'));
 assert.ok(build.includes("pixels.toString('ascii',8,12)!=='WEBP'"));
 assert.ok(build.includes('await fs.writeFile(destination,pixels)'));
});

test('T42 native campaign imports resolve to exactly the built filenames',()=>{
 const campaign=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 const dependencies=[
  './torre2-approved-map-renderer.js',
  './torre2-approved-maps-atlas.js',
  './torre2-approved-map-first-scenes.js'
 ];
 for(const dep of dependencies){
  assert.ok(campaign.includes(dep)||renderer.includes(dep),'Unresolved native import '+dep);
  const target=dep.slice(2);
  assert.ok(build.includes("['tools/pokearena/"+target+"','"+target+"']"),
   'Must copy the native module under its exact import name');
  assert.ok(build.includes("'torre2/"+target+"'"),
   'Native dependency must invalidate cached mobile Phaser modules');
 }
});
