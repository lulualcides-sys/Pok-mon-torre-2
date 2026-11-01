import test from 'node:test';
import assert from 'node:assert/strict';
import {cityViewModel,CERULEAN_LANDMARKS} from '../tools/pokearena/torre2-city-layout.js';
test('only Center, Mart and Gym are functional buildings; entrances stay in map',()=>{
 assert.deepEqual(CERULEAN_LANDMARKS.map(x=>x.id),['center','mart','gym']);
 for(const p of CERULEAN_LANDMARKS){assert.ok(p.x>20&&p.x<620);assert.ok(p.y>80&&p.y<294)}
});
test('city progress reads real trainer limit without writing the save',()=>{
 const state={stage:1,trainer:7,badges:['Rocha'],team:[{id:'ivysaur',hp:71}],active:0};
 const before=JSON.stringify(state),v=cityViewModel(state,15);
 assert.equal(v.done,7);assert.equal(v.remaining,8);assert.equal(v.gymReady,false);
 assert.deepEqual(v.trainers,[],'no mandatory trainers belong to the city');
 assert.equal(JSON.stringify(state),before);
});
test('gym only becomes ready after the actual route count',()=>{
 assert.equal(cityViewModel({trainer:15},15).gymReady,true);
 assert.equal(cityViewModel({trainer:15},17).gymReady,false);
 assert.equal(cityViewModel({trainer:17,champion:true},17).gymReady,false);
});

test('all 15 Misty encounters remain progress counters, never city actors',()=>{
 for(const trainer of [0,1,7,14,15]){
  const state={stage:1,trainer};
  const before=JSON.stringify(state),view=cityViewModel(state,15);
  assert.equal(view.count,15);
  assert.equal(view.done,trainer);
  assert.deepEqual(view.trainers,[]);
  assert.equal(JSON.stringify(state),before);
 }
});
