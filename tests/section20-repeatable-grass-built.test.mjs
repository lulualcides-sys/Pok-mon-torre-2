import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
const levels=await import(pathToFileURL(path.join(root,version,'torre2/kanto-levels.js')).href);
const memory=new Map();
globalThis.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:key=>memory.delete(key)
};

test('FireRed grass is available after five searches, never soft-locks pre-Brock',()=>{
 const s=core.createCampaign('bulbasaur');
 s.wildEncountersStage=5;
 const before={trainer:s.trainer,stage:s.stage,level:s.team[0].progression.level,
  money:s.money,balls:s.inventory.pokeball};
 const found=core.startWildEncounter(s,()=>0);
 assert.equal(found.ok,true,found.reason);
 assert.equal(s.wildEncountersStage,6);
 assert.ok(core.wildAvailability(s.stage).available.includes(found.encounter.id));
 assert.equal(found.encounter.level,levels.wildLevelFor(s.stage,s.trainer,core.TRAINERS_PER_GYM(s.stage)));
 assert.equal(s.money,before.money);
 assert.equal(s.trainer,before.trainer);
 assert.equal(s.stage,before.stage);
 assert.equal(s.team[0].progression.level,before.level);
 assert.equal(s.inventory.pokeball,before.balls);
 assert.equal(core.readCampaign().wildEncountersStage,6);
});

test('Failed ordinary Pokeball still consumes one and cannot exhaust regional grass',()=>{
 const s=core.createCampaign('charmander');
 s.wildEncountersStage=5;
 const originalMoney=s.money,originalProgress=s.trainer;
 const found=core.startWildEncounter(s,()=>0);
 assert.equal(found.ok,true);
 const miss=core.attemptCapture(s,()=>.999999,'pokeball',{
  duringBattle:true,hpPercent:100,hp:100,hpMax:100,status:'none'
 });
 assert.equal(miss.ok,false);
 assert.equal(s.inventory.pokeball,4);
 assert.equal(s.pendingWild.id,found.encounter.id);
 assert.equal(s.money,originalMoney);
 // Battle escape/defeat is explicitly SIMULATED for this core-only test.
 // No natural-campaign win/XP is claimed by this unit test.
 core.resolveWildBattle(s,false);
 const next=core.startWildEncounter(s,()=>.75);
 assert.equal(next.ok,true);
 assert.equal(s.wildEncountersStage,7);
 assert.equal(s.trainer,originalProgress);
 assert.equal(s.money,originalMoney);
});

test('Regional encounter counter remains informational even for long saves',()=>{
 const s=core.createCampaign('squirtle');
 s.wildEncountersStage=134;
 const fresh=core.startWildEncounter(s,()=>.3);
 assert.equal(fresh.ok,true);
 assert.equal(s.wildEncountersStage,135);
 assert.equal(s.stage,0);
 assert.ok(s.pendingWild);
 assert.equal(core.readCampaign().wildEncountersStage,135);
});

test('Indigo League chambers remain protected from grass encounters',()=>{
 const s=core.createCampaign('bulbasaur');
 s.stage=9;
 s.wildEncountersStage=120;
 const result=core.startWildEncounter(s,()=>0);
 assert.equal(result.ok,false);
 assert.match(result.reason,/Sem grama alta/);
 assert.equal(s.wildEncountersStage,120);
});
