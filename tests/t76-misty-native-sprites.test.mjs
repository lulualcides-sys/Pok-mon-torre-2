import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {firstApprovedGymActors,approvedGymAceIdlePlan} from
 '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {spriteIdForTrainer} from '../tools/pokearena/torre2-frlg-npc.js';

test('T76 Misty: four distinct original FRLG trainer types, same checkpoints',()=>{
 const gym=firstApprovedGymActors('gym-misty',15);
 assert.equal(gym.stage,1);
 assert.deepEqual(gym.trainers.map(t=>t.index),[11,12,13,14]);
 assert.deepEqual(gym.trainers.map(t=>t.kind),
  ['swimmer','sailor','picnicker','ace_f']);
 const textures=gym.trainers.map(t=>'frlg-npc-'+spriteIdForTrainer(t.kind));
 assert.deepEqual(textures,[
  'frlg-npc-swimmer_m_land','frlg-npc-sailor',
  'frlg-npc-picnicker','frlg-npc-cooltrainer_f'
 ]);
 assert.equal(new Set(textures).size,4);
 assert.equal(gym.leader.kind,'misty');
 assert.equal(gym.ace.dex,'0121');
 assert.ok(gym.ace.cx>gym.leader.cx);
 assert.ok(gym.ace.cy<=.27&&gym.ace.cy>=.18);
});

test('T76 transparent PMD Idle plan only trusts local SpriteCollab metadata',()=>{
 const valid={ '0121':{anims:{Idle:{
  file:'0121/Walk-Anim.png',fw:56,fh:64,durations:[10,10,10]}}}};
 const plan=approvedGymAceIdlePlan('0121',valid);
 assert.ok(plan);
 assert.equal(plan.file,'assets/pmd/0121/Walk-Anim.png');
 assert.equal(plan.key,'torre2-gym-ace-idle-0121');
 assert.equal(plan.fw,56);
 assert.equal(plan.fh,64);
 assert.deepEqual(plan.durations,[10,10,10]);
 assert.equal(approvedGymAceIdlePlan('0121',{}),null);
 assert.equal(approvedGymAceIdlePlan('0121',{'0121':{anims:{Idle:{...valid['0121'].anims.Idle,
  file:'0121/../../bad.png'}}}}),null);
 assert.equal(approvedGymAceIdlePlan('0121',{'0121':{anims:{Idle:{...valid['0121'].anims.Idle,
  fw:0}}}}),null);
 assert.equal(approvedGymAceIdlePlan('0121',{'0121':{anims:{Idle:{...valid['0121'].anims.Idle,
  file:'0095/Idle-Anim.png'}}}}),null);
 assert.equal(approvedGymAceIdlePlan('../',valid),null);
});

test('T76 Phaser scene renders full PMD Idle, not the opaque portrait for Misty',()=>{
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(source.includes("approvedGymAceIdlePlan('0121',this.registry.get('manifiesto'))"));
 assert.ok(source.includes('this.load.spritesheet(mistyIdle.key,mistyIdle.file,{'));
 assert.ok(source.includes("if(gymId==='gym-misty'){"));
 assert.ok(source.includes('scene.add.sprite(ace.x,ace.y,plan.key,0)'));
 assert.ok(source.includes("setData('torre2-gym-ace-source','pmd-idle')"));
 assert.ok(source.includes("if(APPROVED_MAP_ASSETS_READY&&stage===1)"));
 for(const kind of ['sailor','picnicker','ace_f'])
  assert.ok(source.includes("'"+kind+"'"),kind);
 assert.ok(source.includes("npc?.setData('torre2-gym-trainer-sprite'"));
 assert.ok(source.includes("leaderSprite?.setData('torre2-gym-leader-sprite'"));
});
