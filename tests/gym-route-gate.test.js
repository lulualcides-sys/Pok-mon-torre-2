/* T19 regression: last existing trainer IDs are interior-only presentation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gymIntermediateModel} from '../tools/pokearena/torre2-gym-intermediates.js';

const routeSource=fs.readFileSync(new URL('../tools/pokearena/torre2-route-data.js',import.meta.url),'utf8');
const routeLiteral=routeSource.match(/export function routeNode\\(stage,index,max\\)\\{[\\s\\S]*?\\n\\}/);
assert.ok(routeLiteral,'read the original routeNode, not a replacement identity');
const routeNode=vm.runInNewContext('('+routeLiteral[0].replace(/^export /,'')+')',
 Object.create(null),{timeout:1000});
const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const literal=core.match(/export const GYMS=Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);/);
assert.ok(literal);
const gyms=vm.runInNewContext('('+literal[1]+')',Object.create(null),{timeout:1000});
const perStage=stage=>13+stage*2;

test('every gym portal is the boundary before the original 3–4 interior encounters',()=>{
 for(let stage=0;stage<8;stage++){
  const total=perStage(stage),routeCount=total-(stage===0?3:4);
  for(const progress of [0,routeCount-1,routeCount,total-1,total]){
   const state={stage,trainer:progress,team:[{id:'bulbasaur'}],money:1400};
   const before=JSON.stringify(state);
   const roster=gymIntermediateModel(state,gyms,perStage,routeNode);
   assert.equal(roster.routeCount,routeCount);
   assert.equal(roster.slots[0].index,routeCount);
   assert.equal(roster.slots.at(-1).index,total-1);
   assert.equal(roster.inGym,progress>=routeCount&&progress<total);
   assert.equal(roster.leaderReady,progress===total);
   assert.equal(JSON.stringify(state),before);
  }
 }
});

test('native route path renders gym portal instead of repeating boss or interior NPCs',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-battle-path.js',import.meta.url),'utf8');
 assert.match(source,/const routeCount=gymRoster\\?\\.routeCount\\?\\?total/);
 assert.match(source,/const length=finished\\?0:Math\\.min\\(14,Math\\.max\\(0,routeCount\\+1-offset\\)\\)/);
 assert.match(source,/const gymPortal=!!gymRoster&&i===routeCount/);
 assert.match(source,/const node=gymPortal\\?\\{type:'gym',index:i\\}:routeNode/);
 assert.match(source,/if\\(gymPortal\\)\\{/);
 assert.match(source,/if\\(progress>=total\\|\\|gymRoster&&progress>=routeCount\\)return handlers\\.gym\\(\\)/);
 assert.match(source,/scene\\.__torre2BattlePath=\\{stage,total,routeCount,progress/);
});

test('city building and route CTA cannot bypass the interior',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.match(source,/const accessible=!!roster&&\\(roster\\.inGym\\|\\|roster\\.leaderReady\\)/);
 assert.match(source,/roster&&\\(roster\\.inGym\\|\\|roster\\.leaderReady\\)\\?\\s*this\\.gymScreen\\(state\\):this\\.enterBattle\\(state\\)/);
});
