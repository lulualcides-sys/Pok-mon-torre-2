import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planBattlePathGeometry,rectsOverlap}
 from '../tools/pokearena/torre2-battle-path-geometry.js';

test('T39 regression: old previous-page arrow steals taps from the first trainer',()=>{
 const legacy={x:37-43/2,y:296-23/2,w:43,h:23};
 const first={x:53-30,y:275-1-63/2,w:60,h:63};
 assert.equal(rectsOverlap(legacy,first),true,'reproduce the original collision');
 const plan=planBattlePathGeometry({total:15,offset:13});
 assert.equal(plan.navigation.previous.x,371);
 assert.equal(plan.navigation.next,null);
 assert.equal(rectsOverlap(plan.navigation.previous.box,plan.spots[0].hitbox),false);
});

test('T39 preflight: all existing Kanto pages have non-overlapping route touch targets',()=>{
 for(const total of [13,15,17,19,21,23,25,27,9,1]){
  for(let offset=0;offset<=total;offset+=13){
   const plan=planBattlePathGeometry({total,offset});
   assert.ok(Object.isFrozen(plan));
   assert.equal(plan.spots.length,Math.min(14,total+1-offset));
   for(const p of plan.spots){
    assert.ok(p.hitbox.x>=14&&p.hitbox.y>=58);
    assert.ok(p.hitbox.x+p.hitbox.w<=484&&p.hitbox.y+p.hitbox.h<=308);
    for(const q of plan.spots){
     if(p===q)continue;
     assert.equal(rectsOverlap(p.hitbox,q.hitbox),false,`trainers ${p.global} and ${q.global}`);
     assert.equal(rectsOverlap(p.captureBox,q.hitbox),false,`capture ${p.global} vs trainer ${q.global}`);
    }
    for(const nav of Object.values(plan.navigation).filter(Boolean)){
     assert.equal(rectsOverlap(nav.box,p.hitbox),false,`navigation vs trainer ${p.global}`);
     assert.equal(rectsOverlap(nav.box,p.captureBox),false,`navigation vs capture ${p.global}`);
    }
   }
  }
 }
});

test('T39: geometry rejects invalid input before drawing; no RNG, save or battle mutation',()=>{
 assert.throws(()=>planBattlePathGeometry({total:15,offset:-13}),/offset/);
 assert.throws(()=>planBattlePathGeometry({total:15,offset:14}),/offset/);
 assert.throws(()=>planBattlePathGeometry({total:NaN,offset:0}),/total/);
 const finished=planBattlePathGeometry({total:0,offset:0,finished:true});
 assert.equal(finished.spots.length,0);
 assert.equal(finished.navigation.previous,null);
 assert.equal(finished.navigation.next,null);
 const source=fs.readFileSync('tools/pokearena/torre2-battle-path-geometry.js','utf8');
 const route=fs.readFileSync('tools/pokearena/torre2-battle-path.js','utf8');
 assert.doesNotMatch(source,/Math\.random|saveCampaign|localStorage|resolveBattle|startBattle/);
 assert.match(route,/planBattlePathGeometry\(\{total,offset,finished\}\)/);
 assert.doesNotMatch(route,/button\(scene,37,296,43,18/);
});
