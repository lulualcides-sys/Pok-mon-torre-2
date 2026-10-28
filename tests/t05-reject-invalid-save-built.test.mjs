import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Import the actual versioned Phaser client, not an unrelated source stub.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function storage(){
 const map=new Map();
 let writes=0;
 return {getItem:key=>map.get(key)??null,
  setItem(key,value){writes++;map.set(key,String(value));},
  removeItem:key=>map.delete(key),
  get writes(){return writes;}
 };
}

test('T05 refuses malformed or duplicate-UID snapshots without touching either checkpoint',()=>{
 const db=storage();
 const saved=core.createCampaign('bulbasaur');
 core.saveCampaign(saved,db);
 const primary=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,primary);
 const backup=db.getItem(core.SAVE_BACKUP_KEY);
 const cases=[
  ['empty party',s=>{s.team=[];}],
  ['invalid stage',s=>{s.stage=-1;}],
  ['invalid trainer',s=>{s.trainer=-1;}],
  ['broken PC member',s=>{s.box=[{id:''}];}],
  ['duplicate team UID',s=>{s.team.push({...s.team[0]});}],
  ['duplicate party-PC UID',s=>{s.box.push({...s.team[0]});}]
 ];
 for(const [name,damage] of cases){
  const invalid=structuredClone(saved);
  damage(invalid);
  const writesBefore=db.writes;
  assert.throws(()=>core.saveCampaign(invalid,db),{
   name:'TypeError',message:/Refusing to persist an invalid or duplicate-UID campaign/
  },name);
  assert.equal(db.writes,writesBefore,name+': must not write to storage');
  assert.equal(db.getItem(core.SAVE_KEY),primary,name+': primary changed');
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),backup,name+': backup changed');
  assert.deepEqual(core.readCampaign(db),saved,name+': playable save lost');
 }
});

test('T05 still saves valid legacy members without UID and rotates clean checkpoints',()=>{
 const db=storage();
 const original=core.createCampaign('charmander');
 for(const member of original.team)delete member.uid;
 core.saveCampaign(original,db);
 const primary=db.getItem(core.SAVE_KEY);
 const updated=structuredClone(original);
 updated.money+=25;
 core.saveCampaign(updated,db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),primary);
 assert.equal(core.readCampaign(db).money,updated.money);
 assert.equal(core.readCampaign(db).team[0].id,'charmander');
});

test('T05 does not archive a malformed previous primary when saving a clean state',()=>{
 const db=storage();
 const good=core.createCampaign('squirtle');
 core.saveCampaign(good,db);
 const cleanBackup=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,cleanBackup);
 db.setItem(core.SAVE_KEY,JSON.stringify({...good,team:[]}));
 const updated=structuredClone(good);
 updated.money+=100;
 core.saveCampaign(updated,db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),cleanBackup);
 assert.equal(core.readCampaign(db).money,updated.money);
});
