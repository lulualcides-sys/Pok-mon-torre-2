/* T19 regression: last existing trainer IDs are interior-only presentation. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {gymIntermediateModel} from '../tools/pokearena/torre2-gym-intermediates.js';

const routeSource=fs.readFileSync(new URL('../tools/pokearena/torre2-route-data.js',import.meta.url),'utf8');
const routeLiteral=routeSource.match(/export function routeNode\(stage,index,max\)\{[\s\S]*?\n\}/);
assert.ok(routeLiteral,'read the original routeNode, not a replacement identity');
const routeNode=vm.runInNewContext('('+routeLiteral[0].replace(/^export /,'')+')',
 Object.create(null),{timeout:1000});
const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const literal=core.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(literal);
const gyms=vm.runInNewContext('('+literal[1]+')',Object.create(null),{timeout:1000});
const perStage=stage=>13+stage*2;

test('all eight gym rosters keep stable IDs and place only trainers indoors',()=>{
 for(let stage=0;stage<8;stage++){
  const total=perStage(stage),routeCount=total-(stage===0?3:4);
  for(let progress=0;progress<=total;progress++){
   const state={stage,trainer:progress,team:[{id:'bulbasaur'}],money:1400};
   const before=JSON.stringify(state);
   const roster=gymIntermediateModel(state,gyms,perStage,routeNode);
   assert.equal(roster.routeCount,routeCount);
   assert.equal(roster.gymCount,total-routeCount);
   assert.equal(roster.inGym,roster.gymIndices.includes(progress));
   assert.equal(roster.leaderReady,progress===total);
   assert.equal(roster.routeProgress,roster.routeIndices.filter(i=>i<progress).length);
   assert.deepEqual([...roster.routeIndices,...roster.gymIndices].sort((a,b)=>a-b),
    Array.from({length:total},(_,i)=>i));
   assert.ok(roster.slots.every(t=>routeNode(stage,t.index,total).type==='trainer'));
   assert.ok(roster.routeIndices.filter(i=>['rival','rocket'].includes(routeNode(stage,i,total).type))
    .every(i=>!roster.gymIndices.includes(i)));
   assert.equal(JSON.stringify(state),before);
  }
 }
});

test('native route path uses original noncontiguous indices and an independent gym portal',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-battle-path.js',import.meta.url),'utf8');
 assert.match(source,/const routeIndices=gymRoster\?\.routeIndices\?\?Array\.from/);
 assert.match(source,/const routeProgress=routeIndices\.filter\(i=>i<progress\)\.length/);
 assert.match(source,/const length=finished\?0:Math\.min\(14,Math\.max\(0,routeCount\+1-offset\)\)/);
 assert.match(source,/global:boss\?total:routeIndices\[routeSlot\],portal:boss/);
 assert.match(source,/const gymPortal=!!gymRoster&&p\.portal/);
 assert.match(source,/const node=gymPortal\?\{type:'gym',index:i\}:routeNode/);
 assert.match(source,/if\(gymPortal\)\{/);
 assert.match(source,/if\(progress>=total\|\|gymRoster\?\.inGym\)return handlers\.gym\(\)/);
 assert.match(source,/scene\.__torre2BattlePath=\{stage,total,routeCount,routeIndices,progress/);
});

test('city building and route CTA cannot bypass the interior',()=>{
 const source=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.match(source,/const accessible=!!roster&&\(roster\.inGym\|\|roster\.leaderReady\)/);
 assert.match(source,/roster&&\(roster\.inGym\|\|roster\.leaderReady\)\?\s*this\.gymScreen\(state\):this\.enterBattle\(state\)/);
});
