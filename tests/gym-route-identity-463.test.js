/* Regression for issue #463. The final 3/4 trainers belong to the gym,
 * never Rival/Rocket. Preserve the total number of encounters and existing
 * stage/index save keys; no fabricated win/progression is used.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('tools/pokearena/torre2-route-data.js','utf8');
const body=source.match(/export function routeNode\(stage,index,max\)\{([\s\S]*?)\n\}/)?.[1];
assert.ok(body,'Could not load production routeNode');
const routeNode=new Function('stage','index','max',body);
const historic=(stage,index)=>{
 const rivals=[0,1,2,4,5,8].includes(stage);
 const rockets=[1,3,5,7].includes(stage);
 return index>0&&index%9===3&&rivals?'rival':
  index>0&&index%7===5&&rockets?'rocket':'trainer';
};
test('all eight gyms have 3 or 4 genuine gym trainers; no Rival/Rocket',()=>{
 for(let stage=0;stage<8;stage++){
  const max=13+stage*2,count=stage===0?3:4;
  for(let index=max-count;index<max;index++){
   const node=routeNode(stage,index,max);
   assert.equal(node.type,'trainer',
    'Gym '+stage+' interior index '+index+' must be a real trainer, not '+node.type);
   assert.equal(node.index,index);
  }
  assert.equal(routeNode(stage,max,max).type,'leader');
 }
});
test('Rival and Rocket identities are retained on routes without adding fights',()=>{
 for(let stage=0;stage<8;stage++){
  const max=13+stage*2,interior=stage===0?3:4,stop=max-interior;
  const observed=Array.from({length:max},(_,index)=>routeNode(stage,index,max));
  assert.deepEqual(observed.map(x=>x.index),Array.from({length:max},(_,i)=>i));
  assert.equal(observed.every(x=>['trainer','rival','rocket'].includes(x.type)),true);
  for(const role of ['rival','rocket']){
   const before=Array.from({length:max},(_,i)=>historic(stage,i)).filter(x=>x===role).length;
   const after=observed.filter(x=>x.type===role).length;
   assert.equal(after,before,'Preserve '+role+' count at stage '+stage);
   assert.equal(observed.slice(stop).some(x=>x.type===role),false);
  }
 }
 // Victory Road is not a gym and retains its existing encounter ordering.
 for(let i=0;i<17;i++)
  assert.equal(routeNode(8,i,17).type,historic(8,i));
});
test('no save schema or number of checkpoints changed by route relocation',()=>{
 const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
 const cards=readFileSync('tools/pokearena/torre2-trainer-cards.js','utf8');
 assert.match(core,/TRAINERS_PER_GYM=stage=>stage<8\?13\+stage\*2:stage===8\?17:0/);
 assert.match(core,/const node=routeNode\(s.stage,s.trainer,TRAINERS_PER_GYM\(s.stage\)\)/);
 assert.match(cards,/currentOpponent\(\{\.\.\.state,trainer:index/);
});
