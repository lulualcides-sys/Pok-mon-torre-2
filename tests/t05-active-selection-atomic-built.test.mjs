// T05: compiled campaign module. Denied localStorage writes are fixtures,
// not physical-device validation or a naturally played campaign.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
function fixture({fainted=false}={}){
 const data=new Map();let denied=null;
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
 assert.ok(s.team.length>=2,'fixture requires a reserve Pokémon');
 s.active=0;
 if(fainted){s.team[0].hp=0;s.team[1].hp=70;}
 core.saveCampaign(s,storage);
 const loaded=core.readCampaign(storage);
 core.saveCampaign(loaded,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {s:loaded,storage};
}
for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
 for(const [name,invoke] of [
  ['manual summary selection',s=>core.selectTeamMember(s,1)],
  ['automatic fainted-lead selection',s=>core.ensureConsciousActive(s)]
 ]){
  test('T05 '+name+' is atomic on '+denied,()=>{
   const {s,storage}=fixture({fainted:name.startsWith('automatic')});
   const before=structuredClone(s),team=s.team,lead=s.team[0];
   const primary=storage.getItem(core.SAVE_KEY);
   const backup=storage.getItem(core.SAVE_BACKUP_KEY);
   storage.deny(denied);
   assert.throws(()=>invoke(s),/QuotaExceededError/);
   assert.deepEqual(s,before,'denied selection changed live state');
   assert.strictEqual(s.team,team);
   assert.strictEqual(s.team[0],lead);
   assert.equal(storage.getItem(core.SAVE_KEY),primary);
   assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
   storage.allow();
   assert.deepEqual(core.readCampaign(storage),before);
   assert.equal(invoke(s),true);
   assert.equal(s.active,1);
   assert.strictEqual(s.team,team,'successful selection replaced party array');
   assert.strictEqual(s.team[0],lead,'successful selection replaced Pokémon');
   assert.deepEqual(core.readCampaign(storage),s);
  });
 }
}
test('T05 invalid selection and fully fainted party do not write',()=>{
 const {s,storage}=fixture();
 const primary=storage.getItem(core.SAVE_KEY);
 storage.deny(core.SAVE_KEY);
 assert.equal(core.selectTeamMember(s,-1),false);
 assert.equal(core.selectTeamMember(s,s.team.length),false);
 s.team.forEach(m=>{m.hp=0});
 assert.equal(core.ensureConsciousActive(s),false);
 assert.equal(s.active,0);
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
});
