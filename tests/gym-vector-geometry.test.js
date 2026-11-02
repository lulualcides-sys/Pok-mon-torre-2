import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateGymVector,intersects,contains,snap,GYM_VECTOR_VERSION}
 from '../tools/pokearena/torre2-gym-vector.js';
import {gymWideLayout,drawGymWideRoom}
 from '../tools/pokearena/torre2-gym-wide-layout.js';

const cases=[
 {stage:0,theme:'rock',points:[[160,164],[470,184],[188,226]],decor:10},
 {stage:1,theme:'water',points:[[160,164],[470,172],[206,224],[500,224]],decor:13}
];
test('T36 vector preflight: normalized anchors, 2px grid and freeze/cache',()=>{
 assert.equal(GYM_VECTOR_VERSION,'t36-geometry-checked-v1');
 assert.equal(snap(161),162);
 assert.equal(calculateGymVector(2),null);
 for(const c of cases){
  const p=calculateGymVector(c.stage);
  assert.equal(p,calculateGymVector(c.stage),'one precomputed plan per stage');
  assert.equal(p,gymWideLayout(c.stage),'renderer and trainers share identical geometry');
  assert.ok(Object.isFrozen(p));
  assert.equal(p.theme,c.theme);
  assert.equal(p.cameraZoom,1);
  assert.deepEqual(p.slots.map(o=>[o.x,o.y]),c.points);
  assert.equal(p.geometry.ornaments.length,c.decor);
  assert.equal(p.audit.ornamentCount,c.decor);
  assert.equal(p.audit.valid,true,'invalid geometry must fail before rendering');
  for(const [check,ok] of Object.entries(p.audit))
   if(typeof ok==='boolean')assert.equal(ok,true,'failed audit '+check);
 }
});
test('T36 connected geometric walk from entrance through all platforms to ace',()=>{
 for(const c of cases){
  const p=calculateGymVector(c.stage),g=p.geometry;
  const walk=g.walk;
  assert.equal(walk.length,3+p.slots.length*2);
  const seen=new Set([0]),todo=[0];
  while(todo.length){
   const a=todo.shift();
   for(let i=0;i<walk.length;i++)
    if(!seen.has(i)&&intersects(walk[a],walk[i])){
     seen.add(i);todo.push(i);
    }
  }
  assert.equal(seen.size,walk.length,'walkway graph must be fully connected');
  p.slots.forEach((slot,i)=>{
   assert.ok(contains(g.platforms[i],slot),'trainer stands on physical platform');
   assert.ok(intersects(g.platforms[i],g.bridges[i]),'platform meets bridge');
   assert.ok(intersects(g.bridges[i],g.spine),'branch meets main aisle');
   assert.ok(p.audit.routeDistance[i]>0&&p.audit.routeDistance[i]<=440);
   assert.ok(!intersects(g.touch[i],g.spine),'touch zone cannot cover main aisle');
  });
  assert.ok(intersects(g.entry,g.spine));
  assert.ok(intersects(g.final,g.spine));
  assert.ok(contains(g.final,p.leader));
  assert.ok(contains(g.final,p.ace));
 });
});
test('T36 decorations have measurable safety clearance to paths, users and controls',()=>{
 for(const c of cases){
  const p=calculateGymVector(c.stage),g=p.geometry;
  const forbidden=[...g.walk,...g.touch,
   {x:p.leader.x-15,y:p.leader.y-41,w:30,h:43},
   {x:p.ace.x-25,y:p.ace.y-49,w:50,h:51}];
  for(let i=0;i<g.ornaments.length;i++){
   const shape=g.ornaments[i];
   assert.ok(shape.y+shape.h<=270,'no UI region intrusion');
   assert.ok(forbidden.every(o=>!intersects(shape,o,7)),
    'no prop over corridor / trainer / leader / ace');
   for(let j=i+1;j<g.ornaments.length;j++)
    assert.ok(!intersects(shape,g.ornaments[j],7),'two props need separation');
  }
  for(let i=0;i<g.touch.length;i++)
   for(let j=i+1;j<g.touch.length;j++)
    assert.ok(!intersects(g.touch[i],g.touch[j],4),'touch hitboxes overlap');
  assert.equal(p.audit.minAceGap,12,'leader and boss ace keep side-by-side space');
 }
});
test('T36 renderer uses preflight geometry and creates no display objects for invalid stage',()=>{
 const commands=[],graphics=()=>({
  setDepth(){return this},
  fillStyle(c){this.color=c;return this},
  fillRect(x,y,w,h){commands.push({x,y,w,h,color:this.color});return this},
  lineStyle(){return this},strokeRect(){return this}
 });
 const scene={add:{graphics},cameras:{main:{
  setZoom(){throw Error('zoom is forbidden')}
 }}};
 assert.equal(drawGymWideRoom(scene,3),null);
 assert.equal(commands.length,0,'invalid stage fails closed before creating graphics');
 for(const c of cases){
  commands.length=0;
  const p=drawGymWideRoom(scene,c.stage);
  assert.equal(p.audit.valid,true);
  assert.ok(commands.length>200,'native Phaser pixel detail should remain');
  for(const r of [p.geometry.entry,p.geometry.final,...p.geometry.platforms]){
   assert.ok(commands.some(o=>o.x===r.x&&o.y===r.y&&o.w===r.w&&o.h===r.h),
    'vector platform/corridor must actually be rendered');
  }
  assert.equal(scene.__torre2GymWideLayout,p);
 }
});
test('T36 coordinate transform stays inside desktop and mobile without camera zoom',()=>{
 for(const [w,h] of [[1280,720],[854,480]]){
  const scale=Math.min(w/640,h/360);
  for(const c of cases){
   const p=calculateGymVector(c.stage);
   for(const shape of [...p.geometry.walk,...p.geometry.ornaments,...p.geometry.touch]){
    assert.ok(shape.x*scale>=0&&shape.x*scale<w);
    assert.ok(shape.y*scale>=0&&(shape.y+shape.h)*scale<=h,
     'decor geometry must be screen-safe on responsive game display');
   }
  }
 }
});
test('T36 vector module cannot mutate saves, use RNG or change battle/AI',()=>{
 const source=fs.readFileSync('tools/pokearena/torre2-gym-vector.js','utf8');
 const renderer=fs.readFileSync('tools/pokearena/torre2-gym-wide-layout.js','utf8');
 const client=fs.readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(renderer,/calculateGymVector\(stage\)/);
 assert.match(renderer,/geom\.platforms/);
 assert.match(renderer,/geom\.bridges/);
 assert.match(renderer,/geom\.ornaments/);
 assert.match(client,/torre2-gym-vector\.js/);
 assert.doesNotMatch(source,/saveCampaign|resolveBattle|startBattle|Math\.random|localStorage/);
 assert.doesNotMatch(renderer,/saveCampaign|resolveBattle|startBattle|Math\.random|localStorage/);
});
