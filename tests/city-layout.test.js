import test from 'node:test';
import assert from 'node:assert/strict';
import {cityViewModel,CERULEAN_LANDMARKS,CERULEAN_CIVILIANS} from '../tools/pokearena/torre2-city-layout.js';
test('only Center, Mart and Gym are functional buildings; entrances stay in map',()=>{
 assert.deepEqual(CERULEAN_LANDMARKS.map(x=>x.id),['center','mart','gym']);
 for(const p of CERULEAN_LANDMARKS){assert.ok(p.x>20&&p.x<620);assert.ok(p.y>80&&p.y<294)}
});
test('city progress reads real trainer limit without writing the save',()=>{
 const state={stage:1,trainer:7,badges:['Rocha'],team:[{id:'ivysaur',hp:71}],active:0};
 const before=JSON.stringify(state),v=cityViewModel(state,15);
 assert.equal(v.done,7);assert.equal(v.remaining,8);assert.equal(v.gymReady,false);
 assert.deepEqual(v.trainers,[],'route and gym encounters must not spawn in the city');
 assert.deepEqual([v.routeCount,v.routeDone,v.gymCount,v.gymDone],[11,7,4,0]);
 assert.equal(JSON.stringify(state),before);
});
test('gym only becomes ready after the actual route count',()=>{
 assert.equal(cityViewModel({trainer:15},15).gymReady,true);
 assert.equal(cityViewModel({trainer:15},17).gymReady,false);
 assert.equal(cityViewModel({trainer:17,champion:true},17).gymReady,false);
});

test('civilian decoration stays clear of building entrance hit areas',()=>{
 assert.equal(CERULEAN_CIVILIANS.length,2);
 for(const npc of CERULEAN_CIVILIANS){
  const a={left:npc.x-12,right:npc.x+12,top:npc.y-23,bottom:npc.y+5};
  for(const p of CERULEAN_LANDMARKS){
   const b={left:p.x-41,right:p.x+41,top:p.doorY-12,bottom:p.y+15};
   assert.ok(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom,
    `civilian at ${npc.x},${npc.y} blocks ${p.id}`);
  }
 }
});
test('all 15 Misty encounters retain their original indices outside city',()=>{
 const v=cityViewModel({stage:1,trainer:12},15);
 assert.deepEqual([v.routeCount,v.routeDone,v.gymCount,v.gymDone],[11,11,4,1]);
 assert.equal(v.remaining,3);assert.equal(v.gymReady,false);
 assert.equal(cityViewModel({stage:1,trainer:15},15).gymReady,true);
});
