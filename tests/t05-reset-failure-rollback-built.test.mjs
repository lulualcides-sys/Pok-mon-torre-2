import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Test the actual versioned Phaser module after build-preview, never a
// synthetic replacement of campaign save/reset logic.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function storage(){
 const data=new Map();
 let denyRemove=null,denyRestore=false,removePrimaryFailed=false;
 return {
  getItem:k=>data.get(k)??null,
  setItem(k,v){
   if(denyRestore&&removePrimaryFailed&&k===core.SAVE_BACKUP_KEY)
    throw new Error('QuotaExceededError: backup restoration denied');
   data.set(k,String(v));
  },
  removeItem(k){
   if(k===denyRemove){
    if(k===core.SAVE_KEY)removePrimaryFailed=true;
    throw new Error('SecurityError: delete denied '+k);
   }
   data.delete(k);
  },
  denyDeletion:k=>{denyRemove=k;removePrimaryFailed=false;},
  denyRollback:()=>{denyRestore=true;},
  allow:()=>{denyRemove=null;denyRestore=false;removePrimaryFailed=false;}
 };
}
function setup(){
 const db=storage();
 core.saveCampaign(core.createCampaign('bulbasaur'),db);
 const a=core.readCampaign(db); // Normalize any additive save defaults.
 core.saveCampaign(a,db);
 const beforeA=db.getItem(core.SAVE_KEY);
 const b=structuredClone(a);b.money+=45;
 core.saveCampaign(b,db);
 const main=db.getItem(core.SAVE_KEY);
 const backup=db.getItem(core.SAVE_BACKUP_KEY);
 assert.equal(backup,beforeA,'A real prior backup checkpoint is required');
 return {db,main,backup,money:b.money};
}
test('T05 successful confirmed reset clears BOTH keys and never revives the old party',()=>{
 const {db}=setup();
 core.resetCampaign(db);
 assert.equal(db.getItem(core.SAVE_KEY),null);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
 assert.equal(core.readCampaign(db),null);
});
test('T05 denied backup deletion cannot touch the primary',()=>{
 const {db,main,backup}=setup();
 db.denyDeletion(core.SAVE_BACKUP_KEY);
 assert.throws(()=>core.resetCampaign(db),/SecurityError: delete denied/);
 assert.equal(db.getItem(core.SAVE_KEY),main);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),backup);
 db.allow();
});
test('T05 denied primary deletion restores previous backup byte for byte',()=>{
 const {db,main,backup,money}=setup();
 db.denyDeletion(core.SAVE_KEY);
 assert.throws(()=>core.resetCampaign(db),/SecurityError: delete denied/);
 assert.equal(db.getItem(core.SAVE_KEY),main,'Primary save changed after failed reset');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),backup,
  'Failed reset erased a recoverable backup');
 db.allow();
 assert.equal(core.readCampaign(db).money,money,'Original journey must still be readable');
 core.resetCampaign(db); // Explicit user retry succeeds.
 assert.equal(db.getItem(core.SAVE_KEY),null);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
});
test('T05 failed primary deletion does not create a backup which was absent',()=>{
 const {db,main}=setup();
 db.removeItem(core.SAVE_BACKUP_KEY);
 db.denyDeletion(core.SAVE_KEY);
 assert.throws(()=>core.resetCampaign(db),/SecurityError: delete denied/);
 assert.equal(db.getItem(core.SAVE_KEY),main);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
});
test('T05 failed rollback never masks primary reset error or deletes primary',()=>{
 const {db,main}=setup();
 db.denyDeletion(core.SAVE_KEY);
 db.denyRollback();
 assert.throws(()=>core.resetCampaign(db),/SecurityError: delete denied/,
  'Primary deletion error is authoritative');
 assert.equal(db.getItem(core.SAVE_KEY),main);
 db.allow();
 assert.ok(core.readCampaign(db),'Primary still recovers the game even if backup rollback is denied');
});
