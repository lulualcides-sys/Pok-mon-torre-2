import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ELITE_ROOM_VERSION,eliteChamberPlan,drawEliteChamber}
 from '../tools/pokearena/torre2-elite-chambers.js';

test('T38: five unique native Indigo chambers, never gym stages or extra battles',()=>{
 assert.equal(ELITE_ROOM_VERSION,'t38-indigo-five-rooms-v1');
 assert.equal(eliteChamberPlan(7),null);
 assert.equal(eliteChamberPlan(13),null);
 const plans=[8,9,10,11,12].map(eliteChamberPlan);
 assert.deepEqual(plans.map(x=>x.leader),
  ['Lorelei','Bruno','Agatha','Lance','Rival']);
 assert.equal(new Set(plans.map(x=>x.motif)).size,5);
 assert.equal(new Set(plans.map(x=>x.floor)).size,5);
 for(const p of plans){
  assert.equal(p.cameraZoom,1);
  assert.equal(p.combatGate,'existing-stage-only');
  assert.ok(p.room.width>=500&&p.room.height>=190);
  assert.ok(p.leaderPosition.y<p.entrance.y-50);
  assert.ok(p.room.x>0&&p.room.x+p.room.width<640);
  assert.ok(Object.isFrozen(p));
 }
});

test('T38: real Phaser sprites, 16px shared atlas and no invisible battle zones',()=>{
 const calls={graphics:0,tiles:0,images:[],npcs:[],hitboxes:0};
 const graphic={setDepth(){return this},fillStyle(){return this},
  fillRect(){return this},lineStyle(){return this},strokeRect(){return this}};
 const img={setOrigin(){return this},setDisplaySize(){return this},
  setDepth(){return this},setAlpha(){return this},setData(){return this}};
 const frames=new Set();
 const texture={source:[{width:384,height:320}],has:k=>frames.has(k),
  add(k){frames.add(k)},setFilter(){}};
 const scene={add:{graphics(){calls.graphics++;return graphic},
  image(...args){calls.tiles++;calls.images.push(args);return img},
  zone(){calls.hitboxes++;throw Error('no extra battle zones')}},textures:{
  exists:key=>key==='frlg-location-indigo',get:()=>texture},
  cameras:{main:{setZoom(){throw Error('camera zoom forbidden')}}}};
 const npc=(_scene,kind,x,y)=>{calls.npcs.push({kind,x,y});return img};
 for(let stage=8;stage<=12;stage++){
  const result=drawEliteChamber(scene,stage,npc);
  assert.equal(result.stage,stage);
  assert.equal(result.cameraZoom,1);
  assert.equal(result.nativeTiles,70);
  assert.equal(result.leaderSprite,true);
  assert.equal(result.playerSprite,true);
  assert.equal(scene.__torre2EliteChamber,result);
 }
 assert.equal(calls.graphics,10);
 assert.equal(calls.tiles,350);
 assert.equal(calls.hitboxes,0);
 assert.equal(frames.size,1,'reuse one native texture frame');
 assert.deepEqual(calls.npcs.filter(x=>x.kind!=='red_normal').map(x=>x.kind),
  ['lorelei','bruno','agatha','lance','rival']);
 assert.equal(drawEliteChamber(scene,6,npc),null);
});

test('T38: isolated from save schema, battle, rewards, RNG and Arena HUD',()=>{
 const code=fs.readFileSync('tools/pokearena/torre2-elite-chambers.js','utf8');
 const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const build=fs.readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.doesNotMatch(code,/saveCampaign|resolveBattle|startBattle|Math\.random|localStorage|inventory|xp\s*=|money\s*=/);
 assert.match(scene,/if\(!gym&&eliteChamberPlan\(state\.stage\)\)/);
 assert.match(scene,/drawEliteChamber\(this,state\.stage,addFireRedNPC\)/);
 assert.match(scene,/if\(ready\|\|roster\?\.inGym\)this\.enterBattle\(state\)/);
 assert.match(build,/torre2-elite-chambers\.js','torre2-elite-chambers\.js'/);
});
