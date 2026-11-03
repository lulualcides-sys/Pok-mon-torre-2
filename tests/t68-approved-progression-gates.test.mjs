import test from 'node:test';
import assert from 'node:assert/strict';
import {GYMS} from '../tools/pokearena/torre2-campaign-core.js';
import {APPROVED_MAPS_ATLAS,approvedMap} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {
 APPROVED_STAGE_MAP_MAX,approvedMapEntryAllowed,approvedMapTravelAllowed
} from '../tools/pokearena/torre2-approved-progression-gates.js';

const badges=GYMS.map(gym=>gym.badge);
const fixture=(stage,badgesEarned=[],champion=false)=>({
 stage,badges:badgesEarned.slice(),champion
});

test('T68: only the 60 approved unchanged map IDs are authorized',()=>{
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(new Set(APPROVED_MAPS_ATLAS.maps.map(m=>m.id)).size,60);
 assert.equal(APPROVED_STAGE_MAP_MAX.length,14);
 assert.equal(approvedMap('pallet-town'),null);
 assert.equal(approvedMap('viridian-city'),null);
 assert.equal(approvedMapEntryAllowed(fixture(13,badges,true),'pallet-town'),false);
});

test('T68: Giovanni cannot be entered without the seven native badges',()=>{
 const state=fixture(7,badges.slice(0,6));
 assert.equal(approvedMapEntryAllowed(state,'gym-giovanni'),false);
 assert.equal(approvedMapEntryAllowed(fixture(7,Array(8).fill(badges[0])),'gym-giovanni'),false);
 assert.equal(approvedMapEntryAllowed(fixture(7,badges.slice(0,7)),'gym-giovanni'),true);
 assert.equal(approvedMapEntryAllowed(fixture(6,badges),'gym-giovanni'),false);
 assert.deepEqual(state,fixture(7,badges.slice(0,6)),'policy must not create a badge');
});

test('T68: the League requires all eight distinct native badges and stage eight',()=>{
 const incomplete=fixture(8,badges.slice(0,7)),complete=fixture(8,badges);
 for(const id of ['routes-22-23','victory-road','indigo-plateau']){
  assert.equal(approvedMapEntryAllowed(incomplete,id),false,id);
  assert.equal(approvedMapEntryAllowed(complete,id),true,id);
 }
 // Stage 8 cannot open the Elite image (index 46) or the Hall (index 47).
 assert.equal(approvedMapEntryAllowed(complete,'elite-four-rooms'),false);
 assert.equal(approvedMapEntryAllowed(fixture(9,badges),'elite-four-rooms'),true);
 assert.equal(approvedMapTravelAllowed('victory-road','indigo-plateau',complete),true);
 assert.equal(approvedMapTravelAllowed('victory-road','indigo-plateau',incomplete),false);
});

test('T68: no unapproved physical shortcuts into Saffron or Viridian/Giovanni',()=>{
 const seven=fixture(7,badges.slice(0,7));
 const eight=fixture(8,badges);
 assert.equal(approvedMapEntryAllowed(fixture(5,badges.slice(0,5)),'saffron-city'),true,
  'isolated Saffron visual fixture remains available for inspection');
 for(const [from,to,state] of [
  ['celadon-city','saffron-city',fixture(5,badges.slice(0,5))],
  ['saffron-city','celadon-city',fixture(5,badges.slice(0,5))],
  ['route-21','gym-giovanni',seven],
  ['gym-giovanni','route-21',seven],
  ['gym-giovanni','routes-22-23',eight],
  ['routes-22-23','gym-giovanni',eight]
 ])assert.equal(approvedMapTravelAllowed(from,to,state),false,from+'→'+to);
 assert.equal(approvedMapTravelAllowed('route-3','mt-moon',fixture(1)),false,
  'nonadjacent journey must be rejected');
});

test('T68: Hall/Sevii require real champion flag, stage thirteen and badges',()=>{
 const complete=fixture(13,badges,true);
 for(const invalid of [
  fixture(12,badges,true),fixture(13,badges,false),
  fixture(13,badges.slice(0,7),true)
 ]){
  assert.equal(approvedMapEntryAllowed(invalid,'hall-of-fame'),false);
  assert.equal(approvedMapEntryAllowed(invalid,'sevii-1'),false);
 }
 assert.equal(approvedMapEntryAllowed(complete,'hall-of-fame'),true);
 assert.equal(approvedMapTravelAllowed('hall-of-fame','sevii-1',complete),true);
 assert.equal(approvedMapTravelAllowed('sevii-1','sevii-2',complete),true);
 for(const locked of ['rocket-warehouse','tanoby-ruins'])
  assert.equal(approvedMapEntryAllowed(complete,locked),false);
});

test('T68: bad/legacy input cannot unlock map or alter saved progress',()=>{
 const examples=[
  null,{},fixture(-1,badges,true),fixture(14,badges,true),
  fixture(8.2,badges,true),fixture('8',badges,true),
  {stage:8,badges:null,champion:true}
 ];
 for(const state of examples)
  assert.equal(approvedMapEntryAllowed(state,'routes-22-23'),false);
 const original=fixture(8,badges);
 const snapshot=JSON.stringify(original);
 for(const id of ['victory-road','hall-of-fame','rocket-warehouse']){
  approvedMapEntryAllowed(original,id);
  approvedMapTravelAllowed('routes-22-23',id,original);
 }
 assert.equal(JSON.stringify(original),snapshot,'read-only navigation must not mutate saves');
});
