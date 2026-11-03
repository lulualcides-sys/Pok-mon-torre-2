import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 OPENING_NPC_PLANS,openingNpcPlan,projectOpeningNpc,auditOpeningNpcPlan
} from '../tools/pokearena/torre2-opening-npc-overlays.js';

test('T86: 5 distinct original Bug Catchers render as Phaser actors only on a clean forest plate',()=>{
 const all=OPENING_NPC_PLANS['viridian-forest'];
 assert.equal(all.length,5);
 assert.equal(new Set(all.map(n=>n.id)).size,5);
 assert.ok(all.every(n=>n.kind==='bugcatcher'));
 assert.deepEqual(openingNpcPlan('viridian-forest'),[]);
 assert.deepEqual(openingNpcPlan('viridian-forest',{cleanPlate:true,stage:1}),[]);
 assert.equal(openingNpcPlan('viridian-forest',{cleanPlate:true,stage:0}).length,5);
});

test('T86: native overlay coordinates remain inside the 640x360 Phaser image',()=>{
 for(const [id,plan] of Object.entries(OPENING_NPC_PLANS)){
  assert.ok(auditOpeningNpcPlan(id),id);
  for(const actor of plan){
   const a=projectOpeningNpc(actor,{x:0,y:0,width:640,height:360});
   assert.ok(a.x>=0&&a.x<=640,id);
   assert.ok(a.y>=0&&a.y<=360,id);
  }
 }
 assert.throws(()=>projectOpeningNpc({cx:-.01,feetY:.4},
  {x:0,y:0,width:640,height:360}),RangeError);
});

test('T86: runtime gameplay hooks exist but original art is never overwritten',()=>{
 const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.match(scene,/cleanPlate:entry\.npcCleanPlate===true/);
 assert.match(scene,/addFireRedNPC\(scene,actor\.kind/);
 assert.match(scene,/this\.enterBattle\(fresh\)/);
 assert.match(scene,/this\.rematchScreen\(fresh,actor\.index,0\)/);
 assert.doesNotMatch(scene,/saveCampaign\(.*openingNpcPlan/);
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(build,/torre2-opening-npc-overlays\.js/);
 const registry=readFileSync('tools/pokearena/torre2-approved-maps-atlas.js','utf8');
 assert.match(registry,/"original_count"|"route-2"/);
});
