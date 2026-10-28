import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Run against the actual versioned Phaser build, not unresolved source imports.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
function storage(){
 const data=new Map();
 return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),
  removeItem:k=>data.delete(k)};
}
function fixture(){
 const db=storage(),s=core.createCampaign('bulbasaur');
 s.box.push(s.team.pop()); // Preserve the permanent test Mewtwo in the PC.
 s.team[0].hp=41;s.team[0].status={kind:'poison',turns:2};
 s.money=2741;s.wins=9;
 core.saveCampaign(s,db);core.readCampaign(db); // Finish additive migration.
 const damaged=JSON.parse(db.getItem(core.SAVE_KEY));
 db.removeItem(core.SAVE_BACKUP_KEY);
 return {db,damaged};
}
test('T05 losslessly repairs multiple repeated UIDs and respects existing suffixes',()=>{
 const {db,damaged}=fixture();
 const uid=damaged.team[0].uid;
 damaged.team.push({...damaged.team[0],id:'pikachu',uid,hp:27});
 damaged.box[0].uid=uid;
 damaged.box.push({...damaged.box[0],id:'eevee',uid:uid+'-recovered-1',hp:55});
 const raw=JSON.stringify(damaged);
 db.setItem(core.SAVE_KEY,raw);
 const fixed=core.readCampaign(db);
 assert.ok(fixed);
 assert.deepEqual([...fixed.team,...fixed.box].map(m=>m.id),['bulbasaur','pikachu','mewtwo','eevee']);
 assert.deepEqual([...fixed.team,...fixed.box].map(m=>m.hp),[41,27,100,55]);
 assert.equal(fixed.team[0].uid,uid,'first occurrence retains identity');
 assert.equal(fixed.box[1].uid,uid+'-recovered-1','existing valid UID is never overwritten');
 assert.equal(new Set([...fixed.team,...fixed.box].map(m=>m.uid)).size,4);
 assert.equal(fixed.money,2741);assert.equal(fixed.wins,9);
 assert.deepEqual(fixed.team[0].status,{kind:'poison',turns:2});
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),raw,'original damaged bytes archived');
 assert.equal(db.getItem(core.SAVE_KEY),JSON.stringify(fixed));
 assert.deepEqual(core.readCampaign(db),fixed,'second read is byte-idempotent');
});
test('T05 archive denial never overwrites the only corrupted save',()=>{
 const {db,damaged}=fixture();
 damaged.box[0].uid=damaged.team[0].uid;
 const raw=JSON.stringify(damaged);
 db.setItem(core.SAVE_KEY,raw);
 let attempted=0,primaryWrites=0;
 const blocked={
  getItem:k=>db.getItem(k),
  setItem(k,v){
   if(k===core.SAVE_BACKUP_KEY){attempted++;throw Error('QuotaExceededError');}
   primaryWrites++;db.setItem(k,v);
  }
 };
 const state=core.readCampaign(blocked);
 assert.ok(state,'repair stays available in memory');
 assert.notEqual(state.team[0].uid,state.box[0].uid);
 assert.equal(attempted,1);
 assert.equal(primaryWrites,0,'never replace primary before original is archived');
 assert.equal(db.getItem(core.SAVE_KEY),raw);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),null);
 assert.deepEqual(core.readCampaign(blocked),state,'stable deterministic repair after failure');
});
test('T05 failed primary write leaves original and archive for retry',()=>{
 const {db,damaged}=fixture();
 damaged.box[0].uid=damaged.team[0].uid;
 const raw=JSON.stringify(damaged);
 db.setItem(core.SAVE_KEY,raw);
 const blocked={
  getItem:k=>db.getItem(k),
  setItem(k,v){
   if(k===core.SAVE_KEY)throw Error('SecurityError');
   db.setItem(k,v);
  }
 };
 const state=core.readCampaign(blocked);
 assert.notEqual(state.team[0].uid,state.box[0].uid);
 assert.equal(db.getItem(core.SAVE_KEY),raw);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),raw);
 const retry=core.readCampaign(db);
 assert.deepEqual(retry,state);
 assert.equal(db.getItem(core.SAVE_KEY),JSON.stringify(retry));
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),raw);
});
test('T05 clean backup always wins over a duplicated primary',()=>{
 const {db,damaged}=fixture();
 const good=JSON.stringify(damaged);
 db.setItem(core.SAVE_BACKUP_KEY,good);
 damaged.box[0].uid=damaged.team[0].uid;
 db.setItem(core.SAVE_KEY,JSON.stringify(damaged));
 assert.equal(JSON.stringify(core.readCampaign(db)),good);
 assert.equal(db.getItem(core.SAVE_KEY),good);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good);
});
