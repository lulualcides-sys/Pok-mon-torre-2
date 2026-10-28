// T05: compiled Phaser campaign; storage denial is simulated, not Android QA.
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
 s.team[0].hp=19;s.team[0].status={kind:'burn',elapsed:3};
 s.team[0].confusion={remaining:2};
 s.team[1].hp=0;s.team[1].status={kind:'poison',elapsed:1};
 core.saveCampaign(s,storage);
 const loaded=core.readCampaign(storage);
 core.saveCampaign(loaded,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {s:loaded,storage};
}
for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
 test('T05 Center healing is atomic when '+denied+' refuses write',()=>{
  const {s,storage}=fixture();
  const before=structuredClone(s),team=s.team,member=s.team[0];
  const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny(denied);
  assert.throws(()=>core.healTeam(s),/QuotaExceededError/);
  assert.deepEqual(s,before,'Denied Center heal changed live HP/status');
  assert.strictEqual(s.team,team);
  assert.strictEqual(s.team[0],member);
  assert.equal(storage.getItem(core.SAVE_KEY),primary);
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
  storage.allow();
  assert.deepEqual(core.readCampaign(storage),before,'Denied Center heal lost checkpoint');
  core.healTeam(s);
  assert.strictEqual(s.team,team,'Center replaced team array');
  assert.strictEqual(s.team[0],member,'Center replaced member identity');
  for(const m of s.team){
   assert.equal(m.hp,100);
   assert.equal(m.status,null);
   assert.equal(m.confusion,null);
  }
  assert.equal(s.lastMessage,'Equipe restaurada.');
  assert.deepEqual(core.readCampaign(storage),s,'Center retry not persisted');
 });
}
