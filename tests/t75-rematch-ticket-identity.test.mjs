import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveRematch,validRematchResult,consumeRematchResult} from
 '../tools/pokearena/torre2-rematch-policy.js';
import {classifyCampaignBattleResult} from
 '../tools/pokearena/torre2-battle-result-validation.js';

test('T75: an interrupted rematch retains its exact durable ticket',()=>{
 const state={stage:3,trainer:7,rematches:{charge:3,sequence:21,wins:0,pending:null}};
 const ticket=reserveRematch(state,2,1);
 assert.ok(ticket);
 const snapshot=JSON.stringify(state);
 assert.equal(validRematchResult(state,ticket),true);
 assert.equal(reserveRematch(state,2,1),null);
 assert.equal(JSON.stringify(state),snapshot,'reopening must not consume another charge');
 for(const field of ['token','stage','trainer','progressStage','progress']){
  const altered={...ticket,[field]:ticket[field]+1};
  assert.equal(validRematchResult(state,altered),false,field);
  assert.equal(classifyCampaignBattleResult(state,{kind:'rematch',ticket:altered},
   {rematchValid:validRematchResult(state,altered)}),null,field);
 }
 assert.equal(consumeRematchResult(state,ticket),true);
 assert.equal(consumeRematchResult(state,ticket),false,'replay cannot consume again');
 assert.equal(validRematchResult(state,ticket),false);
});

test('T75: checkpoint change invalidates interrupted VS Seeker ticket',()=>{
 const state={stage:4,trainer:6,rematches:{charge:3,sequence:3,wins:0,pending:null}};
 const ticket=reserveRematch(state,1,2);
 assert.equal(validRematchResult(state,ticket),true);
 state.trainer++;
 assert.equal(validRematchResult(state,ticket),false);
 assert.equal(consumeRematchResult(state,ticket),false);
 state.trainer--;
 state.stage++;
 assert.equal(validRematchResult(state,ticket),false);
});
