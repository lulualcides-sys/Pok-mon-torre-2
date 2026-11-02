import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drawGymWideRoom,gymWideLayout} from '../tools/pokearena/torre2-gym-wide-layout.js';

test('T36 architecture differs between the water and rock gym, without camera zoom',()=>{
 const captures=[];
 const scene=()=>({
  add:{graphics(){
   const output={shapes:[],setDepth(){return this},
    fillStyle(c,a=1){this.color=c;this.alpha=a;return this},
    fillRect(x,y,w,h){this.shapes.push({x,y,w,h,color:this.color});return this},
    lineStyle(){return this},strokeRect(){return this}};
   captures.push(output);return output;
  }},
  cameras:{main:{setZoom(){throw Error('no camera zoom')}}}
 });
 const gymWater=scene();drawGymWideRoom(gymWater,1);
 assert.equal(gymWater.__torre2GymWideLayout.theme,'water');
 const countWater=captures.reduce((n,c)=>n+c.shapes.length,0);
 assert.ok(countWater>500,'water surface and architecture should have pixel detail');
 captures.length=0;
 const gymRock=scene();drawGymWideRoom(gymRock,0);
 assert.equal(gymRock.__torre2GymWideLayout.theme,'rock');
 assert.ok(captures.some(c=>c.shapes.some(s=>s.color===0xa48c6d)),
  'original rock strata should not look like water platforms');
 for(const stage of [0,1]){
  const layout=gymWideLayout(stage);
  assert.equal(layout.cameraZoom,1);
  assert.equal(layout.slots.length,stage===0?3:4);
  assert.ok(layout.slots.every(s=>s.y>layout.leader.y+20));
 }
});

test('T36 Cerulean water surface uses existing local approved texture under paths',()=>{
 const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const npc=fs.readFileSync('tools/pokearena/torre2-gym-intermediates.js','utf8');
 assert.match(scene,/addGymInteriorFloor\(this,room,/);
 assert.match(scene,/addCitySurface\(this,'water',70,89,500,175,4\.27/);
 assert.match(npc,/const mistySprites=\['swimmer','lass','swimmer','ace'\]/);
 assert.match(npc,/const brockSprites=\['hiker','youngster','hiker'\]/);
 assert.doesNotMatch(npc,/scene\.add\.graphics\(\).*setDepth\(18\)/);
});
