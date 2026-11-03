import test from 'node:test';
import assert from 'node:assert/strict';
import {
 FIRST_APPROVED_GYM_LAYOUTS,
 APPROVED_GYM_NPC_THEMES,
 auditApprovedGymNpcThemes,
 firstApprovedGymActors
} from '../tools/pokearena/torre2-approved-map-first-scenes.js';

// T78: the user-approved WebP already PAINTS Surge, Pikachu and four NPCs.
// The painted Pikachu is decoration; it is NOT evidence that Surge's
// actual battle ACE is Pikachu. Never spawn an additional Raichu over it.
test('Surge painted layer is not duplicated by Phaser NPC actors',()=>{
 const scene=FIRST_APPROVED_GYM_LAYOUTS['gym-surge'];
 assert.equal(scene.artworkOnly,true);
 assert.equal(scene.ace.dex,'0025'); // original painted Pikachu, not battle roster
 assert.equal(scene.trainers.length,4);
 assert.equal(APPROVED_GYM_NPC_THEMES['gym-surge'].status,'artwork-only');
 const audit=auditApprovedGymNpcThemes().find(row=>row.id==='gym-surge');
 assert.ok(audit);
 assert.equal(audit.renderedNpcCount,0);
 assert.deepEqual([...audit.unexpected],[]);
 const actors=firstApprovedGymActors('gym-surge',17);
 assert.equal(actors.artworkOnly,true);
 assert.equal(actors.trainers.length,4);
 for(const actor of [actors.leader,actors.ace,...actors.trainers]){
  assert.ok(actor.cx>=0&&actor.cx<=1&&actor.cy>=0&&actor.cy<=1);
 }
});

test('Surge artwork metadata never changes the battle roster or rewards',()=>{
 const scene=FIRST_APPROVED_GYM_LAYOUTS['gym-surge'];
 assert.equal(scene.stage,2);
 assert.equal(Object.hasOwn(scene,'battleAce'),false);
 assert.equal(Object.hasOwn(scene,'reward'),false);
 assert.equal(Object.hasOwn(scene,'battleResult'),false);
});
