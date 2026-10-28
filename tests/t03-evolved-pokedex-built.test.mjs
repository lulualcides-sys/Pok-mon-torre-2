import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Test the compiled Phaser campaign modules, not a copied implementation.
// In-memory storage prevents touching any real player's saves.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,version,'torre2');
const storage=new Map();
globalThis.localStorage={
 getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),
 removeItem:k=>storage.delete(k)
};
const core=await import(pathToFileURL(path.join(base,'campaign-core.js')));
const prog=await import(pathToFileURL(path.join(base,'progression.js')));
function newOwnedWeedle(){
 const s=core.createCampaign('bulbasaur');
 assert.equal(core.storePokemon(s,1),true,'Deposit non-evolving test Mewtwo in PC');
 const member={
  id:'weedle',uid:'test-weedle-owned-001',hp:100,
  progression:prog.createPokemonProgression('weedle',3),tmMoves:[]
 };
 s.team.push(member);
 core.recordCaught(s,'weedle'); // As if legally captured before EXP
 assert.deepEqual(s.dexCaught,['bulbasaur','weedle']);
 return {s,member};
}
const {s,member}=newOwnedWeedle();
const uid=member.uid;
const before=member.progression.experience;
assert.equal(before,27);

const first=core.awardSharedTeamExperience(s,318,{kind:'trainer'});
assert.deepEqual(first.evolutions.map(e=>e.to),['kakuna']);
assert.equal(member.id,'kakuna');
assert.equal(member.progression.level,7);
assert.deepEqual(s.dexCaught,['bulbasaur','weedle','kakuna']);
assert.ok(s.dexSeen.includes('kakuna'));
const afterKakuna=member.progression.experience;
assert.equal(afterKakuna,345);

const second=core.awardSharedTeamExperience(s,800,{kind:'trainer'});
assert.deepEqual(second.evolutions.map(e=>e.to),['beedrill']);
assert.equal(member.id,'beedrill');
assert.ok(member.progression.level>=10);
assert.deepEqual(s.dexCaught,['bulbasaur','weedle','kakuna','beedrill']);
assert.ok(s.dexSeen.includes('beedrill'));
assert.equal(member.uid,uid);
assert.equal(s.box.length,1);
assert.equal(s.box[0].id,'mewtwo');
assert.equal(s.team.length,2);
assert.equal(s.active,0);

const count=s.dexCaught.length;
core.recordCaught(s,'beedrill');
assert.equal(s.dexCaught.length,count,'Repeated entry must be idempotent');
core.saveCampaign(s);
const raw=storage.get(core.SAVE_KEY);
const saved=core.readCampaign();
assert.equal(storage.get(core.SAVE_KEY),raw,'Reload must not rewrite a clean save');
assert.deepEqual(saved.dexCaught,s.dexCaught);
assert.deepEqual(saved.dexSeen,s.dexSeen);
assert.equal(saved.team[1].id,'beedrill');
assert.equal(saved.team[1].uid,uid);
assert.equal(saved.team[1].progression.experience,member.progression.experience);

// One large genuine post-battle XP award can jump past BOTH thresholds.
// Every intermediate form must be recorded, not just the final species.
const burst=newOwnedWeedle();
const jumped=core.awardSharedTeamExperience(burst.s,1200,{kind:'trainer'});
assert.deepEqual(jumped.evolutions.map(e=>e.to),['kakuna','beedrill']);
assert.equal(burst.member.id,'beedrill');
assert.deepEqual(burst.s.dexCaught,['bulbasaur','weedle','kakuna','beedrill']);
assert.equal(new Set(burst.s.dexCaught).size,burst.s.dexCaught.length);
assert.equal(new Set(burst.s.dexSeen).size,burst.s.dexSeen.length);
console.log('PASS T03 POKEDEX after earned XP: Weedle→Kakuna→Beedrill, both intermediate forms counted, UID/save preserved, no duplicate dex entries');
