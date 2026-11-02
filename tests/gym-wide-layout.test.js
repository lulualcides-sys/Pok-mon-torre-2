import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gymWideLayout,drawGymWideRoom,GYM_WIDE_VERSION} from '../tools/pokearena/torre2-gym-wide-layout.js';
import {gymAcePlacement} from '../tools/pokearena/torre2-gym-ace.js';

test('T36: full-room fixed-camera presentation for Brock and Misty only',()=>{
 assert.equal(GYM_WIDE_VERSION,'t36-wide-room-v1');
 assert.equal(gymWideLayout(2),null);
 for(const [stage,count] of [[0,3],[1,4]]){
  const plan=gymWideLayout(stage);
  assert.equal(plan.cameraZoom,1);
  assert.ok(plan.room.width>=500,'avoid a narrow zoomed screenshot');
  assert.ok(plan.room.height>=190);
  assert.equal(plan.slots.length,count);
  assert.ok(plan.slots.every(({x,y})=>x<230||x>410),'open center aisle');
  assert.ok(plan.slots.every(({x,y})=>y>plan.leader.y+20&&y<plan.interactiveFloorBottom));
  assert.equal(plan.entrance.x,320);
  assert.ok(plan.room.x>0&&plan.room.x+plan.room.width<640);
 }
});
test('T36: authentic ace anchors are on the final rear platform',()=>{
 for(const stage of [0,1]){
  const p=gymAcePlacement({stage,species:stage===0?'onix':'starmie'});
  const l=gymWideLayout(stage);
  assert.equal(p.leaderX,l.leader.x);
  assert.equal(p.aceX,l.ace.x);
  assert.equal(p.baseline,l.leader.y);
  assert.ok(p.baseline<l.slots[0].y);
  assert.ok(p.aceX-p.leaderX>p.maxWidth/2+18);
  assert.ok(p.maxHeight<=48);
 }
});
test('T36: the real Phaser room uses one Graphics object and never changes camera zoom',()=>{
 let graphicsCount=0,drawCount=0;
 const g={setDepth(){return this},
  fillStyle(){return this},fillRect(){drawCount++;return this},
  lineStyle(){return this},strokeRect(){return this}};
 const scene={add:{graphics(){graphicsCount++;return g}},
  cameras:{main:{setZoom(){throw Error('no zoom allowed')}}}};
 const water=drawGymWideRoom(scene,1);
 assert.equal(water.theme,'water');
 assert.equal(graphicsCount,2);
 assert.ok(drawCount>100);
 assert.equal(scene.__torre2GymWideLayout,water);
 drawGymWideRoom(scene,0);
 assert.equal(graphicsCount,4);
 assert.equal(drawGymWideRoom(scene,3),null);
 assert.equal(graphicsCount,4);
});
test('T36: only presentation code changes, original battle/campaign boundaries remain',()=>{
 const room=fs.readFileSync('tools/pokearena/torre2-gym-wide-layout.js','utf8');
 const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const npc=fs.readFileSync('tools/pokearena/torre2-frlg-npc.js','utf8');
 assert.match(scene,/drawGymWideRoom\(this,state\.stage\)/);
 assert.match(scene,/addGymInteriorFloor\(this,room,/);
 assert.match(scene,/stage===1\?\['swimmer'\]:\[\]/);
 assert.match(scene,/gymWideLayout\(state\.stage\)/);
 assert.match(npc,/brock:'brock',misty:'misty'/);
 assert.doesNotMatch(room,/saveCampaign|resolveBattle|startBattle|Math\.random|localStorage/);
});
