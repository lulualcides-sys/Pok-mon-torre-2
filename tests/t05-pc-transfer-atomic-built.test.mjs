import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Test the actual versioned Phaser campaign module, not a copied stub.
// Fixtures exercise storage denial; they are not natural campaign victories.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function makeStorage(){
 const data=new Map();
 let deny=null;
 return {
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   if(key===deny)throw new Error('QuotaExceededError: '+key);
   data.set(key,String(value));
  },
  removeItem:key=>data.delete(key),
  deny:key=>{deny=key;},
  allow:()=>{deny=null;}
 };
}
function setup(kind){
 const db=makeStorage();
 globalThis.localStorage=db;
 core.saveCampaign(core.createCampaign('bulbasaur'));
 const state=core.readCampaign(db); // Apply additive legacy defaults before assertions.
 if(kind!=='store')assert.equal(core.storePokemon(state,1),true);
 const action=kind==='store'?()=>core.storePokemon(state,1):
  kind==='withdraw'?()=>core.withdrawPokemon(state,0):
  ()=>core.swapPokemon(state,0,0);
 return {db,state,action};
}

for(const kind of ['store','withdraw','swap']){
 for(const deniedKey of [core.SAVE_BACKUP_KEY,core.SAVE_KEY]){
  test('T05 '+kind+' keeps the live party unchanged if '+deniedKey+' rejects the write',()=>{
   const {db,state,action}=setup(kind);
   const before=structuredClone(state);
   const originalTeam=state.team,originalBox=state.box;
   const primary=db.getItem(core.SAVE_KEY);
   db.deny(deniedKey);
   assert.throws(action,/QuotaExceededError/);
   assert.deepEqual(state,before,'in-memory state mutated after a failed save');
   assert.strictEqual(state.team,originalTeam,'team array identity changed');
   assert.strictEqual(state.box,originalBox,'PC array identity changed');
   assert.equal(db.getItem(core.SAVE_KEY),primary,'primary checkpoint changed');
   db.allow();
   assert.deepEqual(core.readCampaign(db),before,'reload lost the previous party');
  });
 }
 test('T05 '+kind+' persists an entire transfer before changing the live party',()=>{
  const {db,state,action}=setup(kind);
  const before=structuredClone(state);
  assert.equal(action(),true);
  assert.deepEqual(core.readCampaign(db),state,'persisted transfer differs from live party');
  assert.equal(state.team.length+state.box.length,before.team.length+before.box.length);
  const ids=[...state.team,...state.box].map(m=>m.uid);
  assert.equal(new Set(ids).size,ids.length,'duplicate UID after PC transfer');
  if(kind==='store'){
   assert.equal(state.team.length,before.team.length-1);
   assert.equal(state.box.length,before.box.length+1);
  }else if(kind==='withdraw'){
   assert.equal(state.team.length,before.team.length+1);
   assert.equal(state.box.length,before.box.length-1);
  }else{
   assert.equal(state.team.length,before.team.length);
   assert.equal(state.box.length,before.box.length);
   assert.equal(state.team[0].uid,before.box[0].uid);
  }
 });
}
