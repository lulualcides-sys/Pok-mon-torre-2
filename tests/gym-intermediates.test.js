import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gymIntermediateModel,drawGymIntermediates} from '../tools/pokearena/torre2-gym-intermediates.js';
import {routeNode} from '../tools/pokearena/torre2-route-data.js';

// Read the actual GYMS roster without importing the client-only Phaser graph.
const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const literal=core.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(literal);
const gyms=vm.runInNewContext('('+literal[1]+')',Object.create(null),{timeout:1000});
assert.match(core,/export const TRAINERS_PER_GYM=stage=>stage<8\?13\+stage\*2/);
const limit=stage=>13+stage*2;
const model=(stage,trainer)=>gymIntermediateModel({stage,trainer},gyms,limit,routeNode);

test('Brock: original 13 indices split 10 route + 3 inside, no new battle',()=>{
 const s={stage:0,trainer:10,team:[{id:'bulbasaur'}],money:2000},before=JSON.stringify(s);
 const m=gymIntermediateModel(s,gyms,limit,routeNode);
 assert.equal(m.routeCount,10);
 assert.equal(m.gymCount,3);
 assert.deepEqual(m.slots.map(t=>t.index),[10,11,12]);
 assert.equal(m.slots[0].status,'current');
 assert.equal(m.slots[2].kind,'rival');
 assert.equal(m.slots[2].title,'RIVAL');
 assert.equal(m.leaderReady,false);
 assert.equal(JSON.stringify(s),before);
});
test('Misty: original 15 indices split 11 route + 4 inside; preserve actual routeNode rival',()=>{
 const m=model(1,11);
 assert.equal(m.routeCount,11);
 assert.deepEqual(m.slots.map(t=>t.index),[11,12,13,14]);
 assert.deepEqual(m.slots.map(t=>t.kind),['trainer','rival','trainer','trainer']);
 assert.deepEqual(m.slots.map(t=>t.title),['TREINADOR 1','RIVAL','TREINADOR 3','TREINADOR 4']);
 assert.equal(model(1,14).slots[3].status,'current');
 assert.equal(model(1,15).leaderReady,true);
 assert.equal(model(1,10).inGym,false);
});
test('all gyms use exactly 3 or 4 existing indices, boss gated by same limit',()=>{
 for(let stage=0;stage<8;stage++){
  const m=model(stage,limit(stage)-1);
  assert.equal(m.limit,limit(stage));
  assert.equal(m.routeCount+m.gymCount,limit(stage));
  assert.equal(new Set(m.slots.map(t=>t.index)).size,m.gymCount);
  assert.ok(m.slots.every(t=>t.index>=m.routeCount&&t.index<m.limit));
  assert.equal(m.leaderReady,false);
  assert.equal(model(stage,limit(stage)).leaderReady,true);
  assert.equal(model(stage,limit(stage)+1).leaderReady,true);
 }
 assert.equal(gymIntermediateModel({stage:8},gyms,limit,routeNode),null);
});
test('render only one native current encounter hitbox; keep center bridge and ace clear',()=>{
 const m=model(1,12),zones=[],npcs=[],state={stage:1,trainer:12},before=JSON.stringify(state);
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
 assert.equal(zones[0].x,483);
 assert.ok(zones.every(z=>z.x+z.w/2<240||z.x-z.w/2>400),'center bridge stays open');
 assert.ok(npcs.every(n=>n.x<200||n.x>440),'leader and ace platform stay clear');
 assert.equal(JSON.stringify(state),before);
});
