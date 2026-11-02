'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const v=require('../tools/research/pb-ranked-public-drift.cjs');

test('diffs compare exact sets without declaring unobserved gameplay',()=>{
 const d=v.sortedDiff(['old','keep'],['keep','new']);
 assert.deepEqual(d,{added:['new'],removed:['old'],addedCount:1,removedCount:1});
 assert.equal(v.norm('Iron Tail'), 'irontail');
});
test('roster changes are confined to names, defaults and public associations',()=>{
 const saved={species:[
  {name:'Pikachu',defaults:[{sourceId:'p:Thunderbolt'}],pool:[{name:'Thunderbolt',id:'p:Thunderbolt'}]},
  {name:'Raichu',defaults:[{sourceId:'r:Thunder'}],pool:[{name:'Thunder',id:'r:Thunder'}]}
 ]};
 const live=[
  {name:'Pikachu',defaults:['p:Thunderbolt'],pool:[{name:'Thunderbolt',id:'p:Thunderbolt'},{name:'Quick Attack',id:'p:Quick Attack'}]},
  {name:'Eevee',defaults:['e:Swift'],pool:[{name:'Swift',id:'e:Swift'}]}
 ];
 const r=v.compareRoster(saved,live);
 assert.equal(r.speciesDiff.addedCount,1);
 assert.deepEqual(r.speciesDiff.added,['Eevee']);
 assert.deepEqual(r.speciesDiff.removed,['Raichu']);
 assert.equal(r.moveNameDiff.addedCount,2);
 assert.equal(r.moveNameDiff.removedCount,1);
 assert.equal(r.moveSpeciesPairsDiff.addedCount,2);
 assert.equal(r.defaultSlotsChangedCount,0);
 assert.ok(!JSON.stringify(r).includes('spriteSheet'));
});
test('animation manifest diff tracks state names not frames or images',()=>{
 const saved={perSprite:[{id:'25',states:[{state:'Idle'},{state:'Attack'}]},{id:'26',states:[{state:'Idle'}]}]};
 const live={'25':{anims:{Idle:{frames:[0]},Charge:{frames:[1]}}},'27':{anims:{Walk:{frames:[3]}}}};
 const r=v.compareAnimations(saved,live);
 assert.equal(r.spriteIdDiff.addedCount,1);
 assert.equal(r.spriteIdDiff.removedCount,1);
 assert.equal(r.changedStateSetsCount,1);
 assert.equal(r.liveAnimationEntries,3);
 assert.ok(!JSON.stringify(r).includes('"frames"'));
});
test('trainers compare public names and never invent Pokeball throw',()=>{
 const before={trainerSelector:{names:['Red','Blue']}};
 const r=v.compareTrainers(before,[{name:'Red'},{name:'Cynthia'}]);
 assert.deepEqual(r.namesDiff.added,['Cynthia']);
 assert.deepEqual(r.namesDiff.removed,['Blue']);
 assert.match(r.warning,/not ball-throw/);
});
