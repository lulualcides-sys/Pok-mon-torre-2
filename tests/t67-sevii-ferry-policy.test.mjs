import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {
 SEVII_ISLAND_PORTS,SEVII_FERRY_LABELS,
 seviiLeagueUnlocked,seviiFerryDestinations,isSeviiSceneUnlocked,
 seviiHasUnimplementedQuestLock
} from '../tools/pokearena/torre2-sevii-ferry.js';
const champion={stage:13,champion:true};
test('T67 ferry is read-only, Champion-only, and follows exactly original graph',()=>{
 assert.equal(SEVII_ISLAND_PORTS.length,7);
 assert.equal(new Set(SEVII_ISLAND_PORTS).size,7);
 assert.equal(seviiLeagueUnlocked(champion),true);
 for(const state of [{stage:12,champion:true},{stage:13,champion:false},
  {stage:13},{stage:0,champion:true},null]){
  assert.equal(seviiLeagueUnlocked(state),false);
  for(const island of SEVII_ISLAND_PORTS)
   assert.deepEqual(seviiFerryDestinations(island,state),[]);
 }
 const adjacency={
  'sevii-1':['hall-of-fame','sevii-2'],
  'sevii-2':['sevii-1','sevii-3'],
  'sevii-3':['sevii-2','sevii-4'],
  'sevii-4':['sevii-3','sevii-5'],
  'sevii-5':['sevii-4','sevii-6'],
  'sevii-6':['sevii-5','sevii-7'],
  'sevii-7':['sevii-6']
 };
 for(const [island,neighbors] of Object.entries(adjacency)){
  assert.deepEqual(seviiFerryDestinations(island,champion),neighbors);
  for(const target of neighbors){
   assert.ok(approvedMapNeighbours(island).includes(target),island+':'+target);
   assert.ok(SEVII_FERRY_LABELS[target],target);
  }
 }
 assert.deepEqual(seviiFerryDestinations('mt-ember',champion),[]);
 assert.deepEqual(seviiFerryDestinations('hall-of-fame',champion),[]);
});
test('T67 never bypasses protected original Tanoby/warehouse quests',()=>{
 for(const id of SEVII_ISLAND_PORTS){
  assert.equal(isSeviiSceneUnlocked(approvedMap(id),champion),true);
  assert.equal(isSeviiSceneUnlocked(approvedMap(id),{stage:13,champion:false}),false);
 }
 assert.equal(isSeviiSceneUnlocked(approvedMap('elite-four-rooms'),{stage:0}),true);
 assert.equal(seviiHasUnimplementedQuestLock('rocket-warehouse'),true);
 assert.equal(seviiHasUnimplementedQuestLock('tanoby-ruins'),true);
 assert.equal(seviiHasUnimplementedQuestLock('icefall-cave'),false);
 assert.equal(seviiHasUnimplementedQuestLock('trainer-tower'),false);
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes("if(!isSeviiSceneUnlocked(approvedMap(id),state))return false"));
 assert.ok(scene.includes('!seviiHasUnimplementedQuestLock(target)'));
 assert.ok(scene.includes('seviiFerryDestinations(id,fresh)'));
 assert.ok(scene.includes("if(id==='hall-of-fame'&&seviiLeagueUnlocked(state))"));
 assert.ok(scene.includes('torre2-approved-sevii-departure'));
});
