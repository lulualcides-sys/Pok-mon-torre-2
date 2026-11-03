import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 APPROVED_PROLOGUE_MAPS,APPROVED_PROLOGUE_EDGES,APPROVED_PROLOGUE_IDS,
 activePrologueEdges,validateApprovedPrologueMap
} from '../tools/pokearena/torre2-approved-prologue-assets.js';
import {APPROVED_MAPS_ATLAS,approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {hasFirstApprovedHotspots,firstApprovedHotspots,firstApprovedDestination} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {approvedOpeningMapId,missingApprovedOpeningScenes} from '../tools/pokearena/torre2-approved-opening.js';

const art={
 id:'pallet-town',index:61,name:'Pallet Town',type:'cidade',group:'kanto',
 image:'assets/ui/kanto-approved-prologue/pallet-town.webp',
 sha256:'a'.repeat(64),hotspots_status:'validated',
 hotspots:[{id:'north',cx:.50,cy:.12,w:.16,h:.12,validated:'visual'}],
 destinations:{north:'route-1'}
};
test('T54 original approved 60 are immutable and no invented opening map is activated',()=>{
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(APPROVED_PROLOGUE_MAPS.length,0);
 assert.equal(approvedMap('pallet-town'),null);
 assert.equal(approvedMap('route-2')?.index,1);
 assert.equal(approvedMapNeighbours('route-2').includes('pewter-city'),true);
 assert.equal(approvedMapNeighbours('route-2').includes('viridian-forest'),false);
 assert.equal(hasFirstApprovedHotspots('pallet-town'),false);
 assert.deepEqual(missingApprovedOpeningScenes(approvedMap,hasFirstApprovedHotspots),
  ['pallet-town','route-1','viridian-city','viridian-forest']);
 assert.equal(approvedOpeningMapId(approvedMap,hasFirstApprovedHotspots,
  firstApprovedHotspots,firstApprovedDestination,approvedMapNeighbours),null);
});
test('T54 new approved prologue assets are independently registered, never mixed into 60',()=>{
 assert.deepEqual(APPROVED_PROLOGUE_IDS,
  ['pallet-town','route-1','viridian-city','viridian-forest','route-22']);
 assert.ok(APPROVED_PROLOGUE_EDGES.some(([a,b])=>a==='route-2'&&b==='viridian-forest'));
 assert.equal(validateApprovedPrologueMap(art,['route-2','pewter-city']),true);
 for(const broken of [
  {...art,id:'pewter-city'},
  {...art,image:'../pallet-town.webp'},
  {...art,sha256:'00'},
  {...art,index:1},
  {...art,hotspots:[]},
  {...art,hotspots:[{...art.hotspots[0],cx:1}]},
  {...art,destinations:{north:'rocket-hideout'}},
  {...art,destinations:{invented:'route-1'}}
 ])assert.throws(()=>validateApprovedPrologueMap(broken,['pewter-city']),Error);
});
test('T54 optional Route 22 is not required for canonical Pallet-to-Pewter links',()=>{
 const set=new Set(['route-2','pewter-city','pallet-town','route-1','viridian-city','viridian-forest']);
 const links=activePrologueEdges(id=>set.has(id));
 assert.equal(links.length,5);
 assert.equal(links.some(([a,b])=>a==='viridian-city'&&b==='route-22'),false);
 set.add('route-22');
 assert.equal(activePrologueEdges(id=>set.has(id)).length,6);
});
test('T54 Phaser build copies the sidecar under the same ESM browser import name',()=>{
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 const atlas=readFileSync('tools/pokearena/torre2-approved-maps-atlas.js','utf8');
 const first=readFileSync('tools/pokearena/torre2-approved-map-first-scenes.js','utf8');
 assert.ok(build.includes("['tools/pokearena/torre2-approved-prologue-assets.js','torre2-approved-prologue-assets.js']"));
 assert.ok(build.includes("'torre2/torre2-approved-prologue-assets.js'"));
 assert.ok(atlas.includes("from './torre2-approved-prologue-assets.js'"));
 assert.ok(first.includes("from './torre2-approved-prologue-assets.js'"));
 assert.ok(build.includes('validateApprovedPrologueMap(extra,originalIds)'));
 assert.ok(build.includes("digest('hex')!==extra.sha256"));
});
