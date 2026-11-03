import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyCampaignBattleResult as classify} from
 '../tools/pokearena/torre2-battle-result-validation.js';
import {validRematchResult,reserveRematch,consumeRematchResult} from
 '../tools/pokearena/torre2-rematch-policy.js';

const core=readFileSync('tools/pokearena/torre2-campaign-core.js','utf8');
const scene=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');

test('T74: native high-grass search refuses to overwrite an existing encounter',()=>{
 const start=core.indexOf('export function startWildEncounter(s,random=Math.random){');
 const end=core.indexOf('export function startWildBattle(',start);
 assert.ok(start>=0&&end>start);
 const body=core.slice(start,end);
 const guard=body.indexOf('if(s.pendingWild)return {ok:false');
 const lookup=body.indexOf('const area=wildAvailability(s.stage)');
 const mutation=body.indexOf('saveCampaign(next);');
 assert.ok(guard>0&&lookup>guard&&mutation>guard,
  'pending encounter must be denied before RNG, counter or save mutations');
 assert.ok(body.includes("reason:'Encontro pendente. Retome a batalha"));
});

test('T74: Phaser grass modal resumes the saved wild, not a second RNG roll',()=>{
 const a=scene.indexOf('grassScreen(state){');
 const b=scene.indexOf('centerScreen(state){',a);
 const block=scene.slice(a,b);
 assert.ok(block.includes("hasPending?'RETOMAR ENCONTRO':'PROCURAR POKÉMON'"));
 assert.ok(block.includes("const live=readCampaign()||state;"));
 const resume=block.indexOf("if(live.pendingWild?.stage===live.stage){");
 const fresh=block.indexOf('try{found=startWildEncounter(live);}');
 assert.ok(resume>=0&&fresh>resume,'resume path must run before fresh encounter');
 assert.ok(block.includes('close();this.enterBattle(live,true);return;'));
 assert.ok(block.includes("search.setData(hasPending?'torre2-grass-resume':'torre2-grass-find',true);"));
});

test('T74: valid wild remains valid only for its own durable encounter number',()=>{
 const saved={stage:2,trainer:1,pendingWild:{id:'zubat',stage:2,shiny:true},
  wildEncountersStage:23};
 const marker={kind:'wild',stage:2,trainer:1,id:'zubat',encounterCounter:23};
 const original=JSON.stringify(saved);
 assert.equal(classify(saved,marker),'wild');
 assert.equal(classify(saved,{...marker,encounterCounter:22}),null);
 assert.equal(classify(saved,{...marker,encounterCounter:24}),null);
 assert.equal(classify({...saved,pendingWild:null},marker),null);
 assert.equal(classify({...saved,pendingWild:{...saved.pendingWild,id:'rattata'}},marker),null);
 assert.equal(JSON.stringify(saved),original);
});

test('T74: expired VS Seeker tickets cannot be consumed or charge rewards twice',()=>{
 const s={stage:2,trainer:8,rematches:{charge:3,sequence:10,wins:0,pending:null}};
 const ticket=reserveRematch(s,3,1);
 assert.ok(ticket?.token>0);
 assert.equal(validRematchResult(s,ticket),true);
 assert.equal(consumeRematchResult(s,ticket),true);
 assert.equal(consumeRematchResult(s,ticket),false);
 assert.equal(validRematchResult(s,ticket),false);
 assert.equal(s.trainer,8);
 assert.equal(s.stage,2);
 const stale={stage:2,trainer:9,rematches:{charge:3,sequence:10,wins:0,pending:{...ticket}}};
 assert.equal(validRematchResult(stale,ticket),false);
 assert.equal(classify(stale,{kind:'rematch',ticket},
  {rematchValid:validRematchResult(stale,ticket)}),null);
});
