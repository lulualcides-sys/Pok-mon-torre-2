import test from'node:test';import assert from'node:assert/strict';
import{rechargeRematches,reserveRematch,consumeRematchResult,validRematchResult}from'../tools/pokearena/torre2-rematch-policy.js';
test('three real activities, consumption before battle, reload and no duplicate reward',()=>{
 const s={stage:1,trainer:4};assert.equal(reserveRematch(s,0),null);
 for(let i=0;i<3;i++)rechargeRematches(s);const ticket=reserveRematch(s,0);assert.ok(ticket);assert.equal(s.rematches.charge,0);assert.equal(reserveRematch(s,0),null);
 const loaded=JSON.parse(JSON.stringify(s));assert.ok(validRematchResult(loaded,ticket));assert.ok(consumeRematchResult(loaded,ticket));assert.equal(consumeRematchResult(loaded,ticket),false);assert.equal(loaded.stage,1);assert.equal(loaded.trainer,4);
});
test('old result cannot reward a new activity or a different trainer',()=>{
 const s={stage:2,trainer:5};for(let i=0;i<9;i++)rechargeRematches(s);assert.equal(s.rematches.charge,3);const t=reserveRematch(s,1);assert.equal(validRematchResult(s,{...t,trainer:2}),false);s.trainer++;assert.equal(validRematchResult(s,t),false);
});
