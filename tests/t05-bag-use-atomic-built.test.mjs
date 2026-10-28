// T05/T23: compiled Phaser campaign, simulated storage denial (not natural play).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function fixture(){
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
 s.stage=1;s.money=5000;
 s.team[0].hp=40;
 s.team[0].status={kind:'veneno',toxic:true,elapsed:2};
 s.inventory.potion=2;s.inventory.superpotion=2;s.inventory.antidote=2;
 s.inventory.tms=['tm-water-pulse'];
 core.saveCampaign(s,storage);
 const normalized=core.readCampaign(storage);
 core.saveCampaign(normalized,storage);
 // Ensure both valid keys exist, so denial of either write is meaningful.
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 return {s:normalized,storage};
}

const actions=[
 {id:'potion',use:s=>core.usePotion(s,'potion',0),
  verify:(before,after)=>{
   assert.equal(after.team[0].hp,65);
   assert.equal(after.inventory.potion,before.inventory.potion-1);
  }},
 {id:'superpotion',use:s=>core.usePotion(s,'superpotion',0),
  verify:(before,after)=>{
   assert.equal(after.team[0].hp,100);
   assert.equal(after.inventory.superpotion,before.inventory.superpotion-1);
  }},
 {id:'antidote',use:s=>core.useStatusCure(s,'antidote',0),
  verify:(before,after)=>{
   assert.equal(after.team[0].status,null);
   assert.equal(after.team[0].hp,before.team[0].hp);
   assert.equal(after.inventory.antidote,before.inventory.antidote-1);
  }},
 {id:'tm-water-pulse',use:s=>core.teachTM(s,'tm-water-pulse',0),
  verify:(before,after)=>{
   assert.deepEqual(after.team[0].tmMoves,['Water Pulse']);
   assert.deepEqual(after.inventory.tms,[]);
   assert.equal(after.team[0].hp,before.team[0].hp);
  }}
];

for(const action of actions)for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
 test('T05 '+action.id+' stays atomic when '+denied+' rejects write',()=>{
  const {s,storage}=fixture();
  const before=structuredClone(s);
  const member=s.team[0],inventory=s.inventory;
  const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny(denied);
  assert.throws(()=>action.use(s),/QuotaExceededError/);
  assert.deepEqual(s,before,'failed action changed live campaign');
  assert.strictEqual(s.team[0],member,'failed action replaced member object');
  assert.strictEqual(s.inventory,inventory,'failed action replaced inventory');
  assert.equal(storage.getItem(core.SAVE_KEY),primary,'failed action changed primary');
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup,'failed action changed backup');
  storage.allow();
  assert.deepEqual(core.readCampaign(storage),before,'reload lost checkpoint');
  assert.equal(action.use(s).ok,true,'retry failed');
  action.verify(before,s);
  assert.strictEqual(s.team[0],member,'successful action broke member identity');
  assert.strictEqual(s.inventory,inventory,'successful action broke inventory identity');
  assert.deepEqual(core.readCampaign(storage),s,'successful action not durable');
  if(action.id==='antidote'||action.id==='tm-water-pulse')
   assert.equal(action.use(s).ok,false,'spent medicine/TM was used twice');
 });
}

test('T05 invalid medicine/TM actions remain read-only',()=>{
 const {s,storage}=fixture();
 const before=structuredClone(s),primary=storage.getItem(core.SAVE_KEY);
 assert.equal(core.usePotion(s,'potion',99).ok,false);
 assert.equal(core.useStatusCure(s,'iceheal',0).ok,false);
 assert.equal(core.teachTM(s,'tm-earthquake',0).ok,false);
 assert.deepEqual(s,before);
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
});
