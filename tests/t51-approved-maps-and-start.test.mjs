import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {APPROVED_MAPS_ATLAS,approvedMap} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {approvedOpeningMapId,missingApprovedOpeningScenes} from '../tools/pokearena/torre2-approved-opening.js';
import {hasFirstApprovedHotspots} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {APPROVED_MAP_ASSETS_READY} from '../tools/pokearena/torre2-approved-map-renderer.js';
test('T51 60 original WebPs really reside in this code branch',()=>{
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(APPROVED_MAP_ASSETS_READY,true);
 for(const map of APPROVED_MAPS_ATLAS.maps)assert.equal(existsSync(map.image),true,map.id);
 const manifest=JSON.parse(readFileSync('assets/ui/kanto-approved-maps/approved-maps-atlas.json','utf8'));
 assert.equal(manifest.maps.length,60);
});
test('T51 Pallet-first progression refuses premature stage-zero image despite all 60 assets',()=>{
 assert.deepEqual(missingApprovedOpeningScenes(approvedMap,hasFirstApprovedHotspots),
  ['pallet-town','route-1','viridian-city','route-2','viridian-forest']);
 assert.equal(approvedOpeningMapId(approvedMap,hasFirstApprovedHotspots),null);
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(source.includes("APPROVED_STAGE_MAPS=[approvedOpeningMapId("));
 assert.ok(source.includes("if(state?.stage===0&&!APPROVED_STAGE_MAPS[0])return false"));
});
test('T51 browser loader includes opening module and native cities retain route access',()=>{
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 assert.ok(build.includes("['tools/pokearena/torre2-approved-opening.js','torre2-approved-opening.js']"));
 assert.ok(build.includes("'torre2/torre2-approved-opening.js'"));
 assert.ok(renderer.includes("entry.type==='cidade'?'ROTAS':'VOLTAR'"));
});
