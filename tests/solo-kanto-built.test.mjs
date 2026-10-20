import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
const stage=path.resolve('_site/arena2d');
const version=fs.readdirSync(stage).find(x=>/^src-[a-f0-9]{10}$/.test(x));
assert.ok(version,'Captured Phaser original client not staged');
const {createCampaign,currentOpponent,resolveBattle,attemptCapture,readCampaign,
 TRAINERS_PER_GYM,GYMS,STARTERS,KANTO_DEX,SAVE_KEY}=await import(pathToFileURL(path.join(stage,version,'torre2/campaign-core.js')));
const items=new Map();
globalThis.localStorage={getItem:k=>items.get(k)??null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)};
assert.equal(KANTO_DEX.length,151);
assert.equal(GYMS.length,8);
assert.deepEqual(STARTERS,['bulbasaur','charmander','squirtle']);
let state=createCampaign('charmander');
assert.equal(state.trainer,0);
assert.equal(TRAINERS_PER_GYM(0),13);
assert.equal(currentOpponent(state).id,'onix');
const initialSpecies=state.team[0].id;
for(let i=0;i<13;i++){
 assert.equal(currentOpponent(state).leader,false);
 const result=resolveBattle(state,true,()=>0);
 assert.equal(result.won,true);
 assert.equal(state.stage,0);
 assert.ok(state.team[0].progression.experience>0);
 if(state.pendingCapture){const r=attemptCapture(state,()=>0);assert.ok(r.ok)}
}
assert.equal(state.trainer,13);
assert.equal(currentOpponent(state).leader,true);
const beforeBadge=state.badges.length;
resolveBattle(state,true,()=>0);
assert.equal(state.stage,1);
assert.equal(state.badges.length,beforeBadge+1);
assert.equal(readCampaign().stage,1);
assert.equal(state.team.length,6);
assert.ok(state.box.length>0);
assert.ok(state.team[0].progression.level>=5);
assert.ok(state.team[0].id!==initialSpecies || state.team[0].progression.level<16);
const save=items.get(SAVE_KEY);assert.ok(save.includes('"version":1'));
const before=state.trainer;
resolveBattle(state,false);
assert.equal(state.trainer,before,'a lost battle does not advance trainer progression');
console.log('PASS offline Kanto campaign: 151 names, 8 gyms, 13 trainers, badges, captures, saves and no in-combat evolution.');
