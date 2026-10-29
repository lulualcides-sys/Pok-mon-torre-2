// T05: compiled Phaser campaign; denied storage is a fixture, not Android hardware.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,version,'torre2');
const core=await import(pathToFileURL(path.join(base,'campaign-core.js')).href);
const pool=await import(pathToFileURL(path.join(base,'move-pool.js')).href);

function fixture(){
 const data=new Map();let denied=null;
 const storage={
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   if(key===denied)throw new Error('QuotaExceededError: '+key);
   data.set(key,String(value));
  },
  removeItem:key=>data.delete(key),
  deny:key=>{denied=key;},allow:()=>{denied=null;}
 };
 globalThis.localStorage=storage;
 const s=core.createCampaign('squirtle');
 const member=s.team[1]; // Lv50 Mewtwo is an existing unrestricted test fixture.
 member.moves=pool.selectedMoves(member);
 member.movePlanSpecies=member.id;
 core.saveCampaign(s,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 const chosen=pool.selectedMoves(member);
 const next=pool.availableMoves(member).find(m=>!chosen.includes(m.id));
 assert.ok(next,'fixture needs a valid, unequipped native move');
 return {s,member,storage,next};
}
for(const denied of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
 test('T05 summary equip stays atomic when '+denied+' denies save',()=>{
  const {s,member,storage,next}=fixture();
  const before=structuredClone(s),party=s.team,moves=member.moves;
  const primary=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  storage.deny(denied);
  assert.throws(()=>core.equipCampaignMove(s,1,1,next.id,storage),/QuotaExceededError/);
  assert.deepEqual(s,before,'denied equip changed live party or slots');
  assert.strictEqual(s.team,party,'denied equip replaced team reference');
  assert.strictEqual(s.team[1],member,'denied equip replaced Pokémon reference');
  assert.strictEqual(member.moves,moves,'denied equip replaced original slot array');
  assert.equal(storage.getItem(core.SAVE_KEY),primary,'primary checkpoint changed');
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup,'backup checkpoint changed');
  storage.allow();
  assert.deepEqual(core.readCampaign(storage),before,'reload lost old equipped moves');
  assert.equal(core.equipCampaignMove(s,1,1,next.id,storage),true);
  assert.equal(member.moves[1],next.id,'retry did not equip chosen move');
  assert.strictEqual(s.team,party,'successful equip replaced team array');
  assert.strictEqual(s.team[1],member,'successful equip replaced member object');
  assert.deepEqual(core.readCampaign(storage),s,'retry was not persisted');
 });
}
test('T05 invalid summary selections are read-only',()=>{
 const {s,storage,next}=fixture();
 const before=structuredClone(s),primary=storage.getItem(core.SAVE_KEY);
 storage.deny(core.SAVE_KEY);
 assert.equal(core.equipCampaignMove(s,-1,1,next.id,storage),false);
 assert.equal(core.equipCampaignMove(s,1,8,next.id,storage),false);
 assert.equal(core.equipCampaignMove(s,1,1,'nonexistent-move',storage),false);
 assert.deepEqual(s,before);
 assert.equal(storage.getItem(core.SAVE_KEY),primary);
});
