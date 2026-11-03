import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_MAPS_ATLAS,USER_OPENING_MAPS,approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {approvedOpeningMapId,missingApprovedOpeningScenes} from '../tools/pokearena/torre2-approved-opening.js';
import {hasFirstApprovedHotspots,firstApprovedHotspots,firstApprovedDestination} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {APPROVED_STAGE_MAP_MAX,approvedMapEntryAllowed,approvedMapTravelAllowed,KANTO_BADGES} from '../tools/pokearena/torre2-approved-progression-gates.js';
import {planApprovedMapOverlays} from '../tools/pokearena/torre2-approved-map-renderer.js';
import {OPENING_NPC_PLANS,openingNpcPlan} from '../tools/pokearena/torre2-opening-npc-overlays.js';

const order=['pallet-town','route-1','viridian-city','viridian-forest','route-2','pewter-city'];

test('T87 preserves all 60 canonical approved artworks and adds only four user opening images',()=>{
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(USER_OPENING_MAPS.length,4);
 assert.equal(new Set([...APPROVED_MAPS_ATLAS.maps,...USER_OPENING_MAPS].map(x=>x.id)).size,64);
 assert.deepEqual(USER_OPENING_MAPS.map(x=>x.id),order.slice(0,4));
 assert.ok(APPROVED_MAPS_ATLAS.maps.every(x=>x.image.startsWith('assets/ui/kanto-approved-maps/')));
 assert.ok(USER_OPENING_MAPS.every(x=>x.image.startsWith('assets/ui/kanto-opening-user/')));
 assert.equal(USER_OPENING_MAPS.filter(x=>x.npcCleanPlate===true).map(x=>x.id).join(','),'pallet-town,viridian-forest');
});

test('T87 canonical stage-0 now begins at Pallet Town instead of the old cards or Route2 shortcut',()=>{
 assert.deepEqual(missingApprovedOpeningScenes(approvedMap,hasFirstApprovedHotspots),[]);
 assert.equal(approvedOpeningMapId(approvedMap,hasFirstApprovedHotspots),'pallet-town');
 assert.equal(APPROVED_STAGE_MAP_MAX[0],3);
 const current={stage:0,badges:[],champion:false};
 for(const id of order.slice(0,5)){
  assert.equal(approvedMapEntryAllowed(current,id),true,id);
 }
 assert.equal(approvedMapEntryAllowed(current,'gym-giovanni'),false);
 const late={stage:7,badges:KANTO_BADGES.slice(0,7)};
 assert.equal(approvedMapTravelAllowed('viridian-city','gym-giovanni',late),true);
 assert.equal(approvedMapTravelAllowed('viridian-city','gym-giovanni',current),false);
});

test('T87 every step has forward and backward real click targets, no phantom teleports',()=>{
 const edges=[['pallet-town','route-1','route1','pallet'],
  ['route-1','viridian-city','viridian','route1'],
  ['viridian-city','viridian-forest','forest','viridian'],
  ['viridian-forest','route-2','route2','forest']];
 for(const [a,b,buttonA,buttonB] of edges){
  assert.ok(approvedMapNeighbours(a).includes(b),a+':'+b);
  assert.ok(approvedMapNeighbours(b).includes(a),b+':'+a);
  assert.equal(firstApprovedDestination(a,buttonA),b);
  assert.equal(firstApprovedDestination(b,buttonB),a);
  assert.equal(approvedMapTravelAllowed(a,b,{stage:0,badges:[]}),true);
 }
});

test('T87 tested visual hitboxes do not overlap each other on 640x360 Phaser map',()=>{
 for(const id of order.slice(0,4)){
  const entry=approvedMap(id);
  const hotspots=firstApprovedHotspots(entry);
  assert.ok(hotspots.length>=2,id);
  const plan=planApprovedMapOverlays({...entry,hotspots},
   {x:0,y:0,width:640,height:360},[]);
  assert.equal(plan.ok,true,id+':'+JSON.stringify(plan));
 }
});

test('T87 exactly five original Bug Catchers are drawn only on verified clean Forest art',()=>{
 const list=OPENING_NPC_PLANS['viridian-forest'];
 assert.deepEqual(list.map(x=>x.index),[0,1,2,3,4]);
 assert.ok(list.every(x=>x.kind==='bugcatcher'));
 assert.equal(openingNpcPlan('viridian-forest',{cleanPlate:true,stage:0}).length,5);
 assert.equal(openingNpcPlan('route-1',{cleanPlate:false,stage:0}).length,0);
 assert.equal(openingNpcPlan('viridian-city',{cleanPlate:false,stage:0}).length,0);
});
