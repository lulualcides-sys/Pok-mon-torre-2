import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
// The source tree is a preview generator: campaign-core imports copied client
// modules that exist only in the versioned Phaser build, not the repository.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const {createCampaign,readCampaign,saveCampaign,SAVE_KEY,SAVE_BACKUP_KEY}=
 await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

// T05: preserve the last known-good party/PC when a JSON-valid primary
// accidentally repeats a Pokemon UID. Never reset the only remaining save.
function storage(){
 const map=new Map();
 return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),
  removeItem:k=>map.delete(k)};
}
function seeded(){
 const db=storage();
 const state=createCampaign('bulbasaur');
 state.box.push(state.team.pop());
 saveCampaign(state,db);
 readCampaign(db); // apply legacy additive defaults before comparing bytes
 return {db,valid:db.getItem(SAVE_KEY)};
}
test('T05 restores clean backup when primary repeats a UID across party and PC',()=>{
 const {db,valid}=seeded();
 db.setItem(SAVE_BACKUP_KEY,valid);
 const damaged=JSON.parse(valid);
 damaged.box[0].uid=damaged.team[0].uid;
 db.setItem(SAVE_KEY,JSON.stringify(damaged));
 const restored=readCampaign(db);
 assert.ok(restored);
 assert.notEqual(restored.team[0].uid,restored.box[0].uid);
 assert.equal(db.getItem(SAVE_KEY),valid,'recover exact primary bytes');
 assert.equal(db.getItem(SAVE_BACKUP_KEY),valid,'keep good backup');
 assert.deepEqual(readCampaign(db),restored,'second read idempotent');
});
test('T05 restores backup when duplicate UID appears twice within the team',()=>{
 const {db,valid}=seeded();
 db.setItem(SAVE_BACKUP_KEY,valid);
 const damaged=JSON.parse(valid);
 damaged.team.push({...damaged.team[0]});
 db.setItem(SAVE_KEY,JSON.stringify(damaged));
 assert.deepEqual(readCampaign(db),JSON.parse(valid));
 assert.equal(db.getItem(SAVE_KEY),valid);
});
test('T05 never rotates duplicate-UID primary over a clean backup',()=>{
 const {db,valid}=seeded();
 db.setItem(SAVE_BACKUP_KEY,valid);
 const damaged=JSON.parse(valid);
 damaged.box[0].uid=damaged.team[0].uid;
 db.setItem(SAVE_KEY,JSON.stringify(damaged));
 const next=JSON.parse(valid);
 next.money+=25;
 saveCampaign(next,db);
 assert.equal(db.getItem(SAVE_BACKUP_KEY),valid);
 assert.equal(readCampaign(db).money,next.money);
});
test('T05 keeps sole legacy or duplicate-UID save rather than silently resetting progress',()=>{
 const {db,valid}=seeded();
 const legacy=JSON.parse(valid);
 for(const member of [...legacy.team,...legacy.box])delete member.uid;
 db.removeItem(SAVE_BACKUP_KEY);
 db.setItem(SAVE_KEY,JSON.stringify(legacy));
 assert.equal(readCampaign(db).team[0].id,'bulbasaur');
 const damaged=JSON.parse(valid);
 damaged.box[0].uid=damaged.team[0].uid;
 db.removeItem(SAVE_BACKUP_KEY);
 db.setItem(SAVE_KEY,JSON.stringify(damaged));
 const recovered=readCampaign(db);
 assert.ok(recovered,'no clean backup must not erase only surviving save');
 assert.equal(recovered.team[0].uid,recovered.box[0].uid,
  'do not silently delete or clone a Pokemon without recovery evidence');
});

test('T05 reads clean backup even if primary restoration cannot write to storage',()=>{
 const {db,valid}=seeded();
 const damaged=JSON.stringify({...JSON.parse(valid),team:[]});
 db.setItem(SAVE_BACKUP_KEY,valid);
 db.setItem(SAVE_KEY,damaged);
 let writes=0;
 const readonly={
  getItem:key=>db.getItem(key),
  setItem(){writes++;throw new Error('QuotaExceededError')},
  removeItem(){throw new Error('read-only')}
 };
 const recovered=readCampaign(readonly);
 assert.ok(recovered,'valid backup must remain playable when localStorage is full');
 assert.equal(recovered.team[0].id,'bulbasaur');
 assert.equal(recovered.box[0].id,'mewtwo');
 assert.equal(JSON.stringify(recovered),valid);
 assert.equal(writes,1,'one best-effort attempt to restore primary');
 assert.equal(db.getItem(SAVE_KEY),damaged,'do not claim failed write succeeded');
 assert.equal(db.getItem(SAVE_BACKUP_KEY),valid,'preserve recoverable backup bytes');
 assert.deepEqual(readCampaign(readonly),recovered,'repeated read must remain safe');
});
test('T05 reads duplicate-UID backup recovery even when storage is read-only',()=>{
 const {db,valid}=seeded();
 const damaged=JSON.parse(valid);
 damaged.box[0].uid=damaged.team[0].uid;
 db.setItem(SAVE_KEY,JSON.stringify(damaged));
 db.setItem(SAVE_BACKUP_KEY,valid);
 const readonly={getItem:key=>db.getItem(key),
  setItem(){throw new Error('SecurityError')},
  removeItem(){throw new Error('SecurityError')}};
 const recovered=readCampaign(readonly);
 assert.ok(recovered);
 assert.equal(JSON.stringify(recovered),valid);
 assert.notEqual(recovered.team[0].uid,recovered.box[0].uid);
 assert.equal(db.getItem(SAVE_BACKUP_KEY),valid);
});
test('T05 returns additive migrated campaign when persistence is temporarily unavailable',()=>{
 const {db,valid}=seeded();
 const legacy=JSON.parse(valid);
 delete legacy.leagueHonors;
 db.setItem(SAVE_KEY,JSON.stringify(legacy));
 db.removeItem(SAVE_BACKUP_KEY);
 let writes=0;
 const readonly={getItem:key=>db.getItem(key),
  setItem(){writes++;throw new Error('QuotaExceededError')},
  removeItem(){throw new Error('read-only')}};
 const recovered=readCampaign(readonly);
 assert.ok(recovered,'migration must not blank the only save on failed write');
 assert.deepEqual(recovered.leagueHonors,[]);
 assert.equal(recovered.team[0].id,'bulbasaur');
 assert.equal(recovered.box[0].id,'mewtwo');
 assert.equal(writes,1,'migration attempted once and failed without losing memory state');
 assert.equal(db.getItem(SAVE_KEY),JSON.stringify(legacy),
  'do not rewrite stored bytes after failed migration');
});
