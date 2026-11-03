import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 APPROVED_PROLOGUE_MAPS,APPROVED_PROLOGUE_EDGES,APPROVED_PROLOGUE_IDS,
 activePrologueEdges,approvedPrologueBridgeDestination,validateApprovedPrologueMap
} from '../tools/pokearena/torre2-approved-prologue-assets.js';
import {APPROVED_MAPS_ATLAS,approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {hasFirstApprovedHotspots,firstApprovedHotspots,firstApprovedDestination} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {approvedOpeningMapId,missingApprovedOpeningScenes,openingJourneyForState,markOpeningForestVisit,openingTravelAllowed} from '../tools/pokearena/torre2-approved-opening.js';

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

test('T54 existing Route 2 forest sign is activated only with real registered forest art',()=>{
 assert.equal(approvedPrologueBridgeDestination('route-2','forest'),null);
 const approved=id=>id==='viridian-forest'?{id}:null;
 assert.equal(approvedPrologueBridgeDestination('route-2','forest',approved),'viridian-forest');
 assert.equal(approvedPrologueBridgeDestination('route-2','pewter',approved),null);
 assert.equal(approvedPrologueBridgeDestination('route-3','forest',approved),null);
 assert.throws(()=>approvedPrologueBridgeDestination('route-2','forest',null),TypeError);
 assert.equal(firstApprovedDestination('route-2','forest'),null);
});

test('T54 physical Kanto route: forest returns to Route 2; 10 route trainers before Pewter',()=>{
 assert.ok(APPROVED_PROLOGUE_EDGES.some(([a,b])=>a==='route-2'&&b==='pewter-city'));
 assert.equal(APPROVED_PROLOGUE_EDGES.some(([a,b])=>a==='viridian-forest'&&b==='pewter-city'),false);
 const source=readFileSync('tools/pokearena/torre2-approved-opening.js','utf8');
 assert.ok(source.includes("source==='route-2'&&target==='pewter-city'&&(!routeTrainersCleared||!forestVisited)"));
});

test('T55 visiting the real forest is required in addition to ten route battles',()=>{
 const available=new Set(['pallet-town','route-1','viridian-city','route-2','viridian-forest','pewter-city','gym-brock']);
 const edges=[['route-2','viridian-forest'],['route-2','pewter-city'],['pewter-city','gym-brock']];
 const findMap=id=>available.has(id)?{id}:null;
 const neighbors=id=>edges.filter(e=>e.includes(id)).map(e=>e[0]===id?e[1]:e[0]);
 const save={stage:0,starter:'squirtle',trainer:10,team:[{uid:'starter-immutable-1'}]};
 const start=openingJourneyForState(null,save);
 assert.deepEqual(start,{owner:'uid:starter-immutable-1',forestVisited:false});
 assert.equal(openingTravelAllowed('route-2','pewter-city',findMap,neighbors,true,start.forestVisited),false);
 const justTouched=markOpeningForestVisit(start,'route-2','pewter-city');
 assert.equal(justTouched.forestVisited,false);
 const visited=markOpeningForestVisit(start,'route-2','viridian-forest');
 assert.equal(visited.forestVisited,true);
 assert.equal(openingTravelAllowed('route-2','pewter-city',findMap,neighbors,false,visited.forestVisited),false);
 assert.equal(openingTravelAllowed('route-2','pewter-city',findMap,neighbors,true,visited.forestVisited),true);
 assert.equal(openingTravelAllowed('pewter-city','gym-brock',findMap,neighbors,true,visited.forestVisited),true);
 assert.equal(openingTravelAllowed('pewter-city','gym-brock',findMap,neighbors,true,false),false);
 assert.equal(openingJourneyForState(visited,{...save,team:[{uid:'new-starter-2'}]}).forestVisited,false);
 assert.equal(openingJourneyForState(visited,{...save,stage:1}),null);
});
test('T55 forest milestone changes only after successful Phaser navigation',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes('const shown=this.approvedMapPreview(nextState,target)'));
 assert.ok(scene.includes('if(shown&&nextState?.stage===0)'));
 assert.ok(scene.includes('markOpeningForestVisit('));
 assert.ok(scene.includes('this.__torre2OpeningJourney?.forestVisited===true'));
 assert.ok(scene.includes('this.__torre2OpeningJourney=null'));
});
