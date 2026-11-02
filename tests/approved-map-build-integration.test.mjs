import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
test('T42 approved Phaser map imports are copied into the browser module tree',()=>{
 for(const [source,target] of [
  ['torre2-approved-maps-atlas.js','approved-maps-atlas.js'],
  ['torre2-approved-map-renderer.js','approved-map-renderer.js'],
  ['torre2-approved-map-first-scenes.js','approved-map-first-scenes.js']
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
