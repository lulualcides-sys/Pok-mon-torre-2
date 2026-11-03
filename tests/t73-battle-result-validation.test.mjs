import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyCampaignBattleResult as classify} from
 '../tools/pokearena/torre2-battle-result-validation.js';
import {validRematchResult} from '../tools/pokearena/torre2-rematch-policy.js';

const base=()=>({stage:2,trainer:4,champion:false,
 pendingWild:null,wildEncountersStage:7,rematches:{pending:null},
 badges:['Rocha','Cascata'],wins:9,losses:2,money:1400});
const marker=(kind='trainer')=>({kind,stage:2,trainer:4});

test('T73: only exact native trainer markers may advance stage trainer',()=>{
 const state=base(),original=JSON.stringify(state);
 assert.equal(classify(state,marker()),'trainer');
 assert.equal(classify(state,{...marker(),kind:'unknown'}),null);
 assert.equal(classify(state,{stage:2,trainer:4}),null);
 assert.equal(classify(state,{...marker(),trainer:3}),null);
 assert.equal(classify(state,{...marker(),stage:1}),null);
 assert.equal(classify({...state,champion:true},marker()),null);
 assert.equal(JSON.stringify(state),original,'policy never mutates saved state');
});

test('T73: stale/mismatched wild results NEVER downgrade into trainer rewards',()=>{
 const state=base();
 state.pendingWild={id:'zubat',stage:2};
 const valid={...marker('wild'),id:'zubat',encounterCounter:7};
 assert.equal(classify(state,valid),'wild');
 assert.equal(classify(state,{...valid,id:'rattata'}),null);
 assert.equal(classify(state,{...valid,encounterCounter:6}),null,
  'same species from a prior encounter must not be replayed');
 assert.equal(classify(state,{...valid,encounterCounter:8}),null);
 assert.equal(classify(state,{...valid,encounterCounter:undefined}),null);
 assert.equal(classify(state,{...valid,encounterCounter:'7'}),null);
 assert.equal(classify({...state,pendingWild:null},valid),null);
 assert.equal(classify({...state,pendingWild:{id:'zubat',stage:1}},valid),null);
 assert.equal(classify({...state,stage:3},valid),null);
 assert.equal(classify(state,{...valid,trainer:3}),null);
});

test('T73: VS Seeker must validate the exact durable pending ticket',()=>{
 const state=base();
 state.rematches.pending={token:14,stage:1,trainer:3,progressStage:2,progress:4};
 const ticket={...state.rematches.pending};
 const event={kind:'rematch',ticket};
 assert.equal(validRematchResult(state,ticket),true);
 assert.equal(classify(state,event,{rematchValid:validRematchResult(state,ticket)}),'rematch');
 assert.equal(classify(state,event,{rematchValid:false}),null);
 assert.equal(classify(state,{...event,ticket:{...ticket,token:13}},
  {rematchValid:validRematchResult(state,{...ticket,token:13})}),null);
 assert.equal(classify({...state,trainer:5},event,
  {rematchValid:validRematchResult({...state,trainer:5},ticket)}),null);
});

test('T73: actual wild battle marker carries the existing persistent encounter counter',()=>{
 const code=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
 assert.ok(code.includes('encounterCounter:s.wildEncountersStage,'));
 assert.ok(code.includes('wildEncountersStage:(s.wildEncountersStage||0)+1'));
});

test('T73: scene can NEVER call trainer resolver for stale wild/unknown marker',()=>{
 const code=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.ok(code.includes('const resolved=classifyCampaignBattleResult(next,marker,{'));
 assert.ok(code.includes("}else if(resolved==='trainer'||resolved==='wild'){"));
 assert.ok(code.includes("outcome=resolved==='wild'?resolveWildBattle(next,!!completed.won):"));
 assert.ok(!code.includes("const wild=marker.kind==='wild'&&next.pendingWild?.id===marker.id"));
 assert.ok(code.includes("}else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';"));
});
