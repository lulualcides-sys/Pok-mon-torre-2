import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 approvedPostBattleReturnMapId,KANTO_BADGES
} from '../tools/pokearena/torre2-approved-progression-gates.js';

const state=(stage,badges=[],champion=false)=>({
 stage,badges:[...badges],champion
});
const last=(id,stage)=>({id,stage});

test('T71: committed trainer loss returns to the same approved city',()=>{
 const s=state(2),before=JSON.stringify(s);
 assert.equal(approvedPostBattleReturnMapId(
  last('vermilion-city',2),2,s,true),'vermilion-city');
 assert.equal(JSON.stringify(s),before,'UI routing must never modify save');
});

test('T71: committed nonleader win preserves current route after trainer index advances',()=>{
 const s={...state(2),trainer:3,losses:0,wins:3};
 assert.equal(approvedPostBattleReturnMapId(
  last('route-6',2),2,s,true),'route-6');
});

test('T71: leader and Champion stage changes discard previous art',()=>{
 const badges7=KANTO_BADGES.slice(0,7);
 assert.equal(approvedPostBattleReturnMapId(
  last('gym-giovanni',7),7,state(8,KANTO_BADGES),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('elite-four-rooms',12),12,state(13,KANTO_BADGES,true),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('gym-misty',1),1,state(2,KANTO_BADGES.slice(0,2)),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('gym-giovanni',7),7,state(7,badges7),true),'gym-giovanni');
});

test('T71: denied/stale checkpoint cannot reopen map or claim badges',()=>{
 for(const accepted of [false,null,undefined,0,'true'])
  assert.equal(approvedPostBattleReturnMapId(
   last('vermilion-city',2),2,state(2),accepted),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('vermilion-city',2),2,state(3),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('hall-of-fame',13),13,state(13,KANTO_BADGES,false),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('rocket-warehouse',13),13,state(13,KANTO_BADGES,true),true),null);
 assert.equal(approvedPostBattleReturnMapId(
  last('fake-map',2),2,state(2),true),null);
});

test('T71: battle report must precede map restoration; no second resolver or restart',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes('const preBattleStage=state?.stage;'));
 assert.ok(scene.includes('battleOutcomeCommitted=true;'));
 assert.ok(scene.includes('const currentMap=approvedPostBattleReturnMapId('));
 assert.ok(scene.includes('if(!currentMap)this.__torre2ApprovedReturn=null;'));
 assert.ok(scene.includes('if(this.promptPendingEeveeEvolution(fresh))return;'));
 assert.ok(scene.includes('this.returnFromPartyToMap(fresh);'));
 const part=scene.slice(scene.indexOf("panel.button.on('pointerdown'"),
  scene.indexOf("panel.button.on('pointerdown'")+550);
 assert.ok(!part.includes('resolveBattle('));
 assert.ok(!part.includes('this.scene.restart('));
});
