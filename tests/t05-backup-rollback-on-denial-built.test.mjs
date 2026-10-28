import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Exercise the actual compiled/versioned Phaser campaign-core, not a stub.
// Storage denial and checkpoints are fixtures; no natural game victories.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function makeStorage(){
 const m=new Map();
 let blocked=null,rollbackBlocked=false,primaryFailed=false;
 const db={
  getItem:k=>m.get(k)??null,
  setItem(k,v){
   if(k===blocked){
    if(k===core.SAVE_KEY)primaryFailed=true;
    throw new Error('QuotaExceededError: '+k);
   }
   if(rollbackBlocked&&primaryFailed&&k===core.SAVE_BACKUP_KEY)
    throw new Error('Backup rollback denied');
   m.set(k,String(v));
  },
  removeItem(k){
   if(rollbackBlocked&&primaryFailed&&k===core.SAVE_BACKUP_KEY)
    throw new Error('Backup deletion denied');
   m.delete(k);
  },
  denyPrimary:()=>{blocked=core.SAVE_KEY;primaryFailed=false},
  denyBackup:()=>{blocked=core.SAVE_BACKUP_KEY},
  denyRollback:()=>{rollbackBlocked=true},
  allow:()=>{blocked=null;rollbackBlocked=false;primaryFailed=false}
 };
 return db;
}
function initial(db){
 core.saveCampaign(core.createCampaign('bulbasaur'),db);
 // Normalize additive v1 defaults once, so a read does not mutate the
 // checkpoint being tested. This is NOT a forged battle result.
 const a=structuredClone(core.readCampaign(db));
 db.removeItem(core.SAVE_BACKUP_KEY);
 const aBytes=db.getItem(core.SAVE_KEY);
 return {a,aBytes};
}

test('T05 denied primary write rolls an existing rotated backup back byte for byte',()=>{
 const db=makeStorage();
 const {a,aBytes}=initial(db);
 const b=structuredClone(a);b.money+=25;
 core.saveCampaign(b,db);
 const bBytes=db.getItem(core.SAVE_KEY);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),aBytes);
 const c=structuredClone(b);c.money+=10;
 db.denyPrimary();
 assert.throws(()=>core.saveCampaign(c,db),/QuotaExceededError/);
 assert.equal(db.getItem(core.SAVE_KEY),bBytes,'primary committed data changed');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),aBytes,'older rollback point was lost');
 db.allow();
 assert.deepEqual(core.readCampaign(db),b,'previous progress must remain readable');
 assert.equal(core.saveCampaign(c,db),c,'retry should work after denial ends');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),bBytes,'next success rotates backup');
 assert.equal(db.getItem(core.SAVE_KEY),JSON.stringify(c));
});
test('T05 denied first backup rotation deletes the new uncommitted backup',()=>{
 const db=makeStorage();
 const {a,aBytes}=initial(db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
 const b=structuredClone(a);b.money+=42;
 db.denyPrimary();
 assert.throws(()=>core.saveCampaign(b,db),/QuotaExceededError/);
 assert.equal(db.getItem(core.SAVE_KEY),aBytes);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null,
  'failed first update must not replace an absent backup');
 db.allow();
 core.saveCampaign(b,db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),aBytes);
});
test('T05 denied backup archive still aborts without touching the primary',()=>{
 const db=makeStorage();
 const {a,aBytes}=initial(db);
 const b=structuredClone(a);b.money+=99;
 db.denyBackup();
 assert.throws(()=>core.saveCampaign(b,db),/QuotaExceededError/);
 assert.equal(db.getItem(core.SAVE_KEY),aBytes);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
});
test('T05 original primary error is retained if the browser also denies rollback',()=>{
 const db=makeStorage();
 const {a}=initial(db);
 const b=structuredClone(a);b.money+=10;
 core.saveCampaign(b,db);
 const bBytes=db.getItem(core.SAVE_KEY);
 const c=structuredClone(b);c.money+=10;
 db.denyPrimary();db.denyRollback();
 assert.throws(()=>core.saveCampaign(c,db),{
  message:/QuotaExceededError: .*kanto-campaign/
 },'do not replace original primary failure with secondary rollback error');
 assert.equal(db.getItem(core.SAVE_KEY),bBytes,'recoverable primary never changed');
 db.allow();
 assert.equal(core.readCampaign(db).money,b.money);
});
for(const kind of ['store','withdraw','swap']){
 test('T05 denied '+kind+' keeps live party and both on-disk save keys identical',()=>{
  const db=makeStorage();globalThis.localStorage=db;
  initial(db);
  const st=core.readCampaign(db);
  if(kind!=='store')assert.equal(core.storePokemon(st,1),true);
  const b=structuredClone(st);b.money+=7;
  core.saveCampaign(b,db); // ensure distinct existing backup
  Object.assign(st,b);
  const live=structuredClone(st);
  const main=db.getItem(core.SAVE_KEY),backup=db.getItem(core.SAVE_BACKUP_KEY);
  const action=kind==='store'?()=>core.storePokemon(st,1):
   kind==='withdraw'?()=>core.withdrawPokemon(st,0):
    ()=>core.swapPokemon(st,0,0);
  db.denyPrimary();
  assert.throws(action,/QuotaExceededError/);
  assert.deepEqual(st,live,'party/box were mutated in memory');
  assert.equal(db.getItem(core.SAVE_KEY),main,'primary changed');
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),backup,'backup changed');
  db.allow();
  assert.deepEqual(core.readCampaign(db),live,'valid save after failed PC transfer not recoverable');
 });
}
