import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
const storage=()=>{
 const map=new Map();
 return {
  map,
  getItem:key=>map.get(key)??null,
  setItem:(key,val)=>map.set(key,String(val)),
  removeItem:key=>map.delete(key)
 };
};
const snapshot=()=>{
 const s=core.createCampaign('bulbasaur');
 s.team[0].hp=36;
 s.money=5731;
 s.wins=14;
 s.stage=1;
 s.trainer=3;
 s.badges=['Rocha'];
 s.inventory.pokeball=17;
 s.inventory.potion=2;
 s.box.push(s.team.pop()); // Keep Mewtwo permanently in PC.
 return s;
};

test('T05 recovers JSON-valid broken team from backup, preserving exact values and slot',()=>{
 const db=storage();
 const saved=snapshot();
 core.saveCampaign(saved,db);
 const valid=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,valid);
 const bad={...saved,team:[]};
 db.setItem(core.SAVE_KEY,JSON.stringify(bad)); // valid JSON; invalid campaign
 const got=core.readCampaign(db);
 assert.ok(got);
 assert.deepEqual(got.team,saved.team);
 assert.deepEqual(got.box,saved.box);
 assert.deepEqual(got.badges,saved.badges);
 assert.deepEqual(got.inventory,saved.inventory);
 assert.equal(got.money,5731);
 assert.equal(got.trainer,3);
 assert.equal(got.stage,1);
 assert.equal(got.wins,14);
 assert.equal(db.getItem(core.SAVE_KEY),valid,'Recovered original bytes into primary');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),valid,'Backup must survive recovery');
 assert.deepEqual(core.readCampaign(db),got,'Second read idempotent');
});

test('T05 keeps good backup when primary parses but has invalid stage, boxes or members',()=>{
 const cases=[
  s=>({...s,stage:999}),
  s=>({...s,team:[null]}),
  s=>({...s,team:[{id:''}]}),
  s=>({...s,box:{lost:'mewtwo'}}),
  s=>({...s,trainer:-4}),
  s=>({...s,version:200})
 ];
 for(const makeBad of cases){
  const db=storage(),good=snapshot();
  core.saveCampaign(good,db);
  const bytes=db.getItem(core.SAVE_KEY);
  db.setItem(core.SAVE_BACKUP_KEY,bytes);
  db.setItem(core.SAVE_KEY,JSON.stringify(makeBad(good)));
  const fixed=core.readCampaign(db);
  assert.ok(fixed,JSON.stringify(makeBad(good)));
  assert.equal(fixed.money,good.money);
  assert.equal(db.getItem(core.SAVE_KEY),bytes);
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),bytes);
 }
});

test('T05 never replaces valid backup with JSON-valid malformed former primary',()=>{
 const db=storage(),s=snapshot();
 core.saveCampaign(s,db);
 db.setItem(core.SAVE_BACKUP_KEY,db.getItem(core.SAVE_KEY));
 const goodBackup=db.getItem(core.SAVE_BACKUP_KEY);
 db.setItem(core.SAVE_KEY,JSON.stringify({...s,team:[]}));
 const next=snapshot();
 next.money=999;
 core.saveCampaign(next,db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),goodBackup);
 assert.equal(core.readCampaign(db).money,999);
});

test('T05 recovers malformed JSON and missing primary, but never revives after reset',()=>{
 for(const corrupted of ['{"team":',null]){
  const db=storage(),s=snapshot();
  core.saveCampaign(s,db);
  const valid=db.getItem(core.SAVE_KEY);
  db.setItem(core.SAVE_BACKUP_KEY,valid);
  if(corrupted===null)db.removeItem(core.SAVE_KEY);
  else db.setItem(core.SAVE_KEY,corrupted);
  assert.equal(core.readCampaign(db).money,5731);
  assert.equal(db.getItem(core.SAVE_KEY),valid);
  core.resetCampaign(db);
  assert.equal(core.readCampaign(db),null);
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
 }
});

test('T05 valid legacy optional-field migration remains idempotent with backup protection',()=>{
 const db=storage(),s=snapshot();
 delete s.dexSeen;
 delete s.gymTMClaims;
 core.saveCampaign(s,db);
 const original=db.getItem(core.SAVE_KEY);
 const once=core.readCampaign(db);
 assert.ok(Array.isArray(once.dexSeen));
 assert.ok(once.gymTMClaims.includes('tm-rock-tomb'));
 assert.equal(once.stage,1);
 assert.equal(once.team[0].hp,36);
 assert.equal(once.box[0].id,'mewtwo');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),original);
 assert.deepEqual(core.readCampaign(db),once);
});
