// T05/T06: compiled Phaser campaign, simulated storage denials (not natural play).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function fixture({fullParty=false,shiny=false}={}){
 const data=new Map();
 let denied=null;
 const storage={
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   if(key===denied)throw new Error('QuotaExceededError: '+key);
   data.set(key,String(value));
  },
  removeItem:key=>data.delete(key),
  deny:key=>{denied=key;},
  allow:()=>{denied=null;}
 };
 globalThis.localStorage=storage;
 const s=core.createCampaign('squirtle');
 s.inventory.pokeball=4;
 s.pendingWild={id:'pikachu',stage:0,trainer:0,level:4,hpPercent:75,shiny};
 if(fullParty)for(let i=s.team.length;i<6;i++)
  s.team.push({...structuredClone(s.team[0]),uid:'fixture-'+i});
 core.saveCampaign(s,storage);
 const loaded=core.readCampaign(storage);
 core.saveCampaign(loaded,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {s:loaded,storage};
}
const options={duringBattle:true,hpPercent:75,hp:75,hpMax:100,
 status:'paralyzed',persistentStatus:{kind:'paralysis',elapsed:1}};
for(const caught of [false,true])for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
 test('T05 '+(caught?'caught':'breakout')+' wild ball is atomic on '+denied,()=>{
  const {s,storage}=fixture({fullParty:caught,shiny:caught});
  const before=structuredClone(s),team=s.team,box=s.box,inventory=s.inventory;
  const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny(denied);
  assert.throws(()=>core.attemptCapture(s,()=>caught?0:.999999,'pokeball',options),
   /QuotaExceededError/);
  assert.deepEqual(s,before,'denied write changed the live campaign');
  assert.strictEqual(s.team,team,'denied write replaced the team');
  assert.strictEqual(s.box,box,'denied write replaced the PC');
  assert.strictEqual(s.inventory,inventory,'denied write replaced the bag');
  assert.equal(storage.getItem(core.SAVE_KEY),primary);
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
  storage.allow();
  assert.deepEqual(core.readCampaign(storage),before,'failed throw lost the checkpoint');
  const outcome=core.attemptCapture(s,()=>caught?0:.999999,'pokeball',options);
  assert.equal(outcome.ok,caught,'retry outcome must use original capture RNG');
  assert.equal(s.inventory.pokeball,before.inventory.pokeball-1);
  assert.strictEqual(s.team,team,'retry replaced team identity');
  assert.strictEqual(s.box,box,'retry replaced PC identity');
  assert.strictEqual(s.inventory,inventory,'retry replaced bag identity');
  if(caught){
   assert.equal(s.pendingWild,null);
   assert.equal(s.team.length,6);
   assert.equal(s.box.length,before.box.length+1);
   assert.equal(s.box.at(-1).id,'pikachu');
   assert.equal(s.box.at(-1).shiny,true);
   assert.deepEqual(s.box.at(-1).status,options.persistentStatus);
   assert.ok(s.dexCaught.includes('pikachu'));
   assert.equal(s.box.at(-1).uid,outcome.pokemon.uid);
  }else{
   assert.deepEqual(s.pendingWild,before.pendingWild);
   assert.equal(s.team.length,before.team.length);
   assert.equal(s.box.length,before.box.length);
   assert.deepEqual(s.dexCaught,before.dexCaught);
  }
  assert.deepEqual(core.readCampaign(storage),s,'successful throw did not persist exactly');
 });
}
test('T05 trainer-owned and empty-ball capture requests never touch storage',()=>{
 const {s,storage}=fixture();
 const before=structuredClone(s),primary=storage.getItem(core.SAVE_KEY);
 assert.equal(core.attemptCapture(s,()=>0,'pokeball',{}).ok,false);
 assert.equal(core.attemptCapture(s,()=>0,'greatball',options).ok,false);
 assert.deepEqual(s,before);
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
});
