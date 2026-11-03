import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_APPROVED_GYM_LAYOUTS,firstApprovedGymActors,auditApprovedGymNpcThemes} from
 '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {reviewedGymNpcSpriteId,spriteIdForTrainer} from
 '../tools/pokearena/torre2-frlg-npc.js';
import {FRLG_NPC_NAMES} from '../tools/pokearena/install-frlg-npcs.mjs';

const required=[
 'swimmer_m_land','swimmer_f_land','tuber_m_land','tuber_f'
];

test('T77: user-reviewed Misty gym contains ONLY standing aquatic FRLG NPCs',()=>{
 const misty=FIRST_APPROVED_GYM_LAYOUTS['gym-misty'];
 assert.equal(misty.stage,1);
 assert.deepEqual(misty.trainers.map(t=>t.kind),
  ['swimmer','swimmer_f','tuber_m','tuber_f']);
 assert.deepEqual(misty.trainers.map(t=>reviewedGymNpcSpriteId(t.kind)),required);
 assert.equal(new Set(misty.trainers.map(t=>t.kind)).size,4);
 assert.deepEqual(firstApprovedGymActors('gym-misty',15).trainers.map(t=>t.index),
  [11,12,13,14]);
 for(const kind of misty.trainers.map(t=>t.kind))
  assert.ok(!['picnicker','camper','hiker','ace_f','sailor'].includes(kind));
});

test('T77: missing approved NPC must NOT silently turn into random Youngster',()=>{
 assert.equal(reviewedGymNpcSpriteId('swimmer_f'),'swimmer_f_land');
 assert.equal(reviewedGymNpcSpriteId('tuber_m'),'tuber_m_land');
 assert.equal(reviewedGymNpcSpriteId('tuber_f'),'tuber_f');
 assert.equal(reviewedGymNpcSpriteId('missing_role'),null);
 // Preserve legacy behavior elsewhere until route NPCs are audited one by one.
 assert.equal(spriteIdForTrainer('missing_role'),'youngster');
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes('point.x,point.y,{scale:1.45,depth:24,strict:true}'));
 assert.ok(scene.includes('{scale:1.7,depth:24,strict:true}'));
});

test('T77: ensure FOUR real FireRed assets installed, not guessed placeholders',()=>{
 for(const name of required)
  assert.ok(FRLG_NPC_NAMES.includes(name),'missing original sprite download '+name);
 const installer=readFileSync('tools/pokearena/install-frlg-npcs.mjs','utf8');
 const guaranteed=installer.slice(installer.indexOf('const crucial='));
 for(const name of required)
  assert.ok(guaranteed.includes("'"+name+"'"),name+' must fail the build if missing');
 assert.ok(installer.includes('Missing essential original FireRed NPC graphics'));
});

test('T77: map-by-map visual policy records outstanding gym work honestly',()=>{
 const reports=auditApprovedGymNpcThemes();
 const ids=reports.map(r=>r.id);
 assert.deepEqual(ids,Object.keys(FIRST_APPROVED_GYM_LAYOUTS));
 const misty=reports.find(r=>r.id==='gym-misty');
 assert.equal(misty.theme,'water');
 assert.equal(misty.status,'validated');
 assert.deepEqual(misty.unexpected,[]);
 assert.equal(misty.renderedNpcCount,4);
 const surge=reports.find(r=>r.id==='gym-surge');
 assert.equal(surge.artworkOnly,true);
 assert.equal(surge.status,'artwork-only');
 assert.equal(surge.renderedNpcCount,0);
 for(const id of ['gym-erika','gym-koga']){
  const report=reports.find(r=>r.id===id);
  assert.equal(report.status,'review');
  assert.ok(report.unexpected.length>0,
   id+' must stay in the review backlog until original sprites are replaced');
 }
});

test('T77: Misty original PMD Starmie and approved art stay unchanged',()=>{
 const gym=FIRST_APPROVED_GYM_LAYOUTS['gym-misty'];
 assert.equal(gym.leader.kind,'misty');
 assert.equal(gym.ace.dex,'0121');
 assert.equal(gym.artworkOnly,undefined);
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes("this.__torre2MistyAcePlan=APPROVED_MAP_ASSETS_READY&&(stage===1||stage===2)?"));
 assert.ok(scene.includes("setData('torre2-gym-ace-source','pmd-idle')"));
});
