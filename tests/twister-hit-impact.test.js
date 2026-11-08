import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldPaintProjectileImpact} from '../tools/pokearena/batch24/hit-impacts.js';
import twister from '../tools/pokearena/batch24/twister.js';

test('Twister impact only follows actual damaging contact',()=>{
 assert.equal(twister.approved,true,'preserve installed approved Twister VFX');
 assert.equal(shouldPaintProjectileImpact(twister,{landed:true,damage:8}),true);
 for(const blocked of [{landed:false,damage:0},{landed:false},{damage:0},null]){
  assert.equal(shouldPaintProjectileImpact(twister,blocked),false,
   'do not paint impact for immunity, dodge or accuracy miss');
 }
});
test('No other approved Batch24 impact is changed',()=>{
 assert.equal(shouldPaintProjectileImpact({id:'icy-wind'},{landed:false}),true);
 assert.equal(shouldPaintProjectileImpact({id:'ice-shard'},null),true);
});
