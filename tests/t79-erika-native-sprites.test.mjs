import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {firstApprovedGymActors,APPROVED_GYM_NPC_THEMES,
 auditApprovedGymNpcThemes,approvedGymAceIdlePlan} from
 '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {reviewedGymNpcSpriteId} from '../tools/pokearena/torre2-frlg-npc.js';
import {FRLG_NPC_NAMES} from '../tools/pokearena/install-frlg-npcs.mjs';

test('T79 Celadon original four trainer classes preserve story checks',()=>{
 const erika=firstApprovedGymActors('gym-erika',19);
 assert.equal(erika.stage,3);
 assert.equal(erika.leader.kind,'erika');
 assert.equal(erika.ace.dex,'0045');
 assert.deepEqual(erika.trainers.map(t=>t.index),[15,16,17,18]);
 assert.deepEqual(erika.trainers.map(t=>t.kind),
  ['lass','beauty','picnicker','ace_f']);
 const npcFiles=erika.trainers.map(t=>reviewedGymNpcSpriteId(t.kind));
 assert.deepEqual(npcFiles,['lass','beauty','picnicker','cooltrainer_f']);
 assert.equal(new Set(npcFiles).size,4);
 assert.ok(npcFiles.every(name=>FRLG_NPC_NAMES.includes(name)),
  'all four sheet names must exist in the local FRLG installer');
 for(const t of erika.trainers){
  assert.ok(t.cx>0&&t.cx<1&&t.cy>0&&t.cy<1);
  assert.ok(!['bugcatcher','hiker','biker','swimmer'].includes(t.kind));
 }
 const audit=auditApprovedGymNpcThemes().find(r=>r.id==='gym-erika');
 assert.equal(audit.status,'validated');
 assert.deepEqual([...audit.unexpected],[]);
 assert.equal(APPROVED_GYM_NPC_THEMES['gym-erika'].theme,'grass');
});

test('T79 beauty and three existing original assets cannot silently disappear',()=>{
 const installer=readFileSync('tools/pokearena/install-frlg-npcs.mjs','utf8');
 const required=installer.slice(installer.indexOf('const crucial='));
 for(const name of ['erika','beauty','picnicker','cooltrainer_f','lass'])
  assert.ok(required.includes("'"+name+"'"),name+' must fail build if missing');
 assert.equal(reviewedGymNpcSpriteId('beauty'),'beauty');
 assert.equal(reviewedGymNpcSpriteId('bugcatcher'),'bug_catcher');
});

test('T79 Vileplume original SpriteCollab PMD Idle is transparent, no portrait',()=>{
 const manifest={'0045':{anims:{Idle:{
  file:'0045/Idle-Anim.png',fw:72,fh:64,durations:[8,8,8,8]}}}};
 const p=approvedGymAceIdlePlan('0045',manifest);
 assert.equal(p.key,'torre2-gym-ace-idle-0045');
 assert.equal(p.file,'assets/pmd/0045/Idle-Anim.png');
 assert.equal(p.fw,72);assert.equal(p.fh,64);
 assert.equal(approvedGymAceIdlePlan('0045',{}),null);
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes("this.__torre2ErikaAcePlan=APPROVED_MAP_ASSETS_READY&&(stage===3||stage===4)?"));
 assert.ok(scene.includes("approvedGymAceIdlePlan('0045',this.registry.get('manifiesto'))"));
 assert.ok(scene.includes('this.load.spritesheet(erikaIdle.key,erikaIdle.file,{'));
 assert.ok(scene.includes("}else if(gymId==='gym-erika'){"));
 assert.ok(scene.includes("const anim='torre2-approved-erika-vileplume-idle';"));
 assert.ok(scene.includes("setData('torre2-gym-ace-source','pmd-idle')"));
 assert.ok(scene.includes("for(const kind of ['lass','beauty','picnicker','ace_f'])"));
});

test('T79 Misty and Surge must retain their approved implementation',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(scene.includes("if(gymId==='gym-misty'){"));
 assert.ok(scene.includes("if(!actors.artworkOnly){"));
 assert.ok(scene.includes("this.__torre2MistyAcePlan=APPROVED_MAP_ASSETS_READY&&(stage===1||stage===2)?"));
});
