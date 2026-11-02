import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gymIntermediateModel,drawGymIntermediates} from '../tools/pokearena/torre2-gym-intermediates.js';
// The source uses build-time import aliases. Read the exact production
// routeNode implementation without importing unbuilt './frlg-learnsets.js'.
const routeSource=fs.readFileSync(new URL('../tools/pokearena/torre2-route-data.js',import.meta.url),'utf8');
const routeLiteral=routeSource.match(/export function routeNode\(stage,index,max\)\{[\s\S]*?\n\}/);
assert.ok(routeLiteral,'production routeNode function must be present');
const routeNode=vm.runInNewContext('('+routeLiteral[0].replace(/^export /,'')+')',
 Object.create(null),{timeout:1000});

// Read the actual GYMS roster without importing the client-only Phaser graph.
const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const literal=core.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(literal);
const gyms=vm.runInNewContext('('+literal[1]+')',Object.create(null),{timeout:1000});
assert.match(core,/export const TRAINERS_PER_GYM=stage=>stage<8\?13\+stage\*2/);
const limit=stage=>13+stage*2;
const model=(stage,trainer)=>gymIntermediateModel({stage,trainer},gyms,limit,routeNode);

test('Brock: 10 route + 3 genuine gym trainers, Rival 12 stays on route',()=>{
 const s={stage:0,trainer:9,team:[{id:'bulbasaur'}],money:2000},before=JSON.stringify(s);
 const m=gymIntermediateModel(s,gyms,limit,routeNode);
 assert.equal(m.routeCount,10);
 assert.equal(m.gymCount,3);
 assert.deepEqual(Array.from(m.gymIndices),[9,10,11]);
 assert.deepEqual(Array.from(m.routeIndices),[0,1,2,3,4,5,6,7,8,12]);
 assert.equal(m.slots[0].status,'current');
 assert.ok(m.slots.every(t=>t.kind==='trainer'&&t.role==='gym-trainer'));
 assert.equal(routeNode(0,12,13).type,'rival');
 assert.equal(model(0,12).inGym,false);
 assert.equal(model(0,12).routeProgress,9);
 assert.equal(m.leaderReady,false);
 assert.equal(JSON.stringify(s),before);
});
test('Misty: 11 route + 4 genuine gym trainers; rival 12 remains route',()=>{
 const m=model(1,10);
 assert.equal(m.routeCount,11);
 assert.deepEqual(Array.from(m.gymIndices),[10,11,13,14]);
 assert.deepEqual(Array.from(m.routeIndices),[0,1,2,3,4,5,6,7,8,9,12]);
 assert.ok(m.slots.every(t=>t.kind==='trainer'&&t.title.startsWith('TREINADOR')));
 assert.equal(model(1,12).inGym,false);
 assert.equal(model(1,12).routeProgress,10);
 assert.equal(model(1,13).inGym,true);
 assert.equal(model(1,14).slots[3].status,'current');
 assert.equal(model(1,15).leaderReady,true);
 assert.equal(model(1,9).inGym,false);
});
test('all eight gyms: no Rival/Rocket inside, no new or lost encounters',()=>{
 for(let stage=0;stage<8;stage++){
  const total=limit(stage),m=model(stage,total-1);
  assert.equal(m.limit,total);
  assert.equal(m.routeCount+m.gymCount,total);
  assert.equal(new Set([...m.routeIndices,...m.gymIndices]).size,total);
  assert.deepEqual([...m.routeIndices,...m.gymIndices].sort((a,b)=>a-b),
   Array.from({length:total},(_,i)=>i));
  assert.equal(m.gymCount,stage===0?3:4);
  assert.ok(m.slots.every(t=>t.kind==='trainer'&&routeNode(stage,t.index,total).type==='trainer'));
  assert.ok(m.routeIndices.every(i=>routeNode(stage,i,total).type!=='leader'));
  for(let index=0;index<total;index++){
   const state=model(stage,index);
   assert.equal(state.inGym,state.gymIndices.includes(index));
   assert.equal(state.routeProgress,state.routeIndices.filter(i=>i<index).length);
  }
  assert.equal(m.leaderReady,false);
  assert.equal(model(stage,total).leaderReady,true);
  assert.equal(model(stage,total+1).leaderReady,true);
 }
 assert.equal(gymIntermediateModel({stage:8},gyms,limit,routeNode),null);
});
test('render only one native current encounter hitbox; keep center bridge and ace clear',()=>{
 const m=model(1,11),zones=[],npcs=[],state={stage:1,trainer:11},before=JSON.stringify(state);
 const o=()=>({setDepth(){return this},setOrigin(){return this},setData(){return this},
  setInteractive(){return this},on(_event,fn){this.click=fn;return this}});
 const scene={add:{
  ellipse(){return o()},
  text(){return o()},
  zone(x,y,w,h){zones.push({x,y,w,h});return o()}
 }};
 let fired=[];
 const report=drawGymIntermediates(scene,m,(_scene,kind,x,y)=>{npcs.push({kind,x,y});return o()},i=>fired.push(i));
 assert.equal(npcs.length,4);
 assert.equal(zones.length,1);
 assert.equal(report.interactiveCount,1);
 assert.equal(zones[0].x,470);
 assert.ok(zones.every(z=>z.x+z.w/2<240||z.x-z.w/2>400),'center bridge stays open');
 assert.ok(npcs.every(n=>n.y>140&&(n.x<230||n.x>410)),'leader and ace platform stay clear');
 assert.equal(JSON.stringify(state),before);
});
