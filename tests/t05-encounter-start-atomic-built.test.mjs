// T05: compiled Phaser campaign with deliberately denied storage writes.
// All encounters and trainer checkpoints are fixtures, not natural play.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function fixture(){
 const data=new Map();let denied=null;
 const storage={
  getItem:key=>data.get(key)??null,
  setItem(key,value){if(key===denied)throw Error('QuotaExceededError: '+key);data.set(key,String(value));},
  removeItem:key=>data.delete(key),
  deny:key=>{denied=key},allow:()=>{denied=null}
 };
 globalThis.localStorage=storage;
 const state=core.createCampaign('bulbasaur');
 core.saveCampaign(state,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {state,storage};
}
for(const event of ['wild','trainer'])for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY])
 test('T05 '+event+' checkpoint rejects '+denied+' atomically and retries',()=>{
  const {state,storage}=fixture();
  const original=structuredClone(state),dexSeen=state.dexSeen;
  const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  const invoke=()=>event==='wild'?core.startWildEncounter(state,()=>0):core.startBattle(state);
  storage.deny(denied);
  assert.throws(invoke,/QuotaExceededError/);
  assert.deepEqual(state,original,'failed checkpoint mutated live progress');
  assert.strictEqual(state.dexSeen,dexSeen,'failed checkpoint replaced live Pokédex');
  assert.equal(storage.getItem(core.SAVE_KEY),primary,'primary checkpoint changed');
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup,'backup checkpoint changed');
  storage.allow();
  assert.deepEqual(core.readCampaign(storage),original,'reload after denial lost progress');
  const result=invoke();
  assert.ok(result);
  assert.equal(state.wildEncountersStage,original.wildEncountersStage+(event==='wild'?1:0));
  if(event==='wild'){
   assert.equal(state.pendingWild.id,result.encounter.id);
   assert.ok(state.dexSeen.includes(result.encounter.id));
  }else{
   assert.equal(state.pendingWild,original.pendingWild);
   assert.ok(state.dexSeen.includes(result.p2)||state.dexSeen.length>=original.dexSeen.length);
  }
  assert.deepEqual(core.readCampaign(storage),state,'retry checkpoint was not durable');
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),primary,
   'successful retry must preserve the previous checkpoint as backup');
 });

test('T05 unavailable wild route is a no-op without storage writes',()=>{
 const {state,storage}=fixture();
 state.stage=12;state.trainer=core.TRAINERS_PER_GYM(12);
 const before=structuredClone(state),primary=storage.getItem(core.SAVE_KEY);
 const result=core.startWildEncounter(state,()=>0);
 assert.equal(result.ok,false);
 assert.deepEqual(state,before);
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
});
