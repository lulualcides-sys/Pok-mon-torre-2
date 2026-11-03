import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FIRST_APPROVED_GYM_LAYOUTS,APPROVED_GYM_NPC_THEMES,
 auditApprovedGymNpcThemes,firstApprovedGymActors} from
 '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {approvedMapImagePath,USER_SURGE_OVERRIDE_PATH} from
 '../tools/pokearena/torre2-approved-map-renderer.js';
import {reviewedGymNpcSpriteId} from '../tools/pokearena/torre2-frlg-npc.js';

test('T80 new user-owned Surge EMPTY map needs 6 independent Phaser actors',()=>{
 const x=FIRST_APPROVED_GYM_LAYOUTS['gym-surge'];
 assert.notEqual(x.artworkOnly,true,
  'new user map has four empty platforms, no baked-in sprites');
 assert.equal(x.leader.kind,'surge');
 assert.equal(x.ace.dex,'0026','Raichu is the native battle ace');
 assert.deepEqual(x.trainers.map(t=>t.kind),
  ['sailor','rocker','gentleman','worker_m']);
 assert.deepEqual(x.trainers.map(t=>reviewedGymNpcSpriteId(t.kind)),
  ['sailor','rocker','gentleman','worker_m']);
 const actors=firstApprovedGymActors('gym-surge',17);
 assert.deepEqual(actors.trainers.map(t=>t.index),[13,14,15,16]);
 for(const actor of [actors.leader,actors.ace,...actors.trainers])
  assert.ok(actor.cx>=0&&actor.cx<=1&&actor.cy>=0&&actor.cy<=1);
 assert.equal(APPROVED_GYM_NPC_THEMES['gym-surge'].status,'validated');
 const audit=auditApprovedGymNpcThemes().find(x=>x.id==='gym-surge');
 assert.equal(audit.renderedNpcCount,4);
 assert.deepEqual(audit.unexpected,[]);
});

test('T80 one image override without changing 60 approved scene references',()=>{
 assert.equal(approvedMapImagePath('gym-surge'),USER_SURGE_OVERRIDE_PATH);
 assert.equal(USER_SURGE_OVERRIDE_PATH,
  'assets/ui/kanto-overrides/gym-surge-user.webp');
 assert.notEqual(approvedMapImagePath('gym-misty'),USER_SURGE_OVERRIDE_PATH);
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 assert.ok(renderer.includes('approvedMapImagePath(id,item)'));
 const builder=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.ok(builder.includes("const surgeRel='assets/ui/kanto-overrides/gym-surge-user.webp';"));
 assert.ok(builder.includes('T80 user-authored Surge map override failed provenance SHA-256'));
});

test('T80 Surge real team is still Voltorb/Pikachu/Raichu, no forged reward',()=>{
 const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
 const i=core.indexOf("leader:'Lt. Surge'");
 assert.ok(i>=0);
 const roster=core.slice(i,i+700);
 assert.ok(roster.includes("boss:'raichu'"));
 assert.ok(roster.includes("leaderTeam:['voltorb','pikachu','raichu']"));
 const x=FIRST_APPROVED_GYM_LAYOUTS['gym-surge'];
 assert.equal(Object.hasOwn(x,'battleAce'),false);
 assert.equal(Object.hasOwn(x,'reward'),false);
 assert.equal(Object.hasOwn(x,'battleResult'),false);
});
