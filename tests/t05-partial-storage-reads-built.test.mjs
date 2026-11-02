import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// T05: real versioned Phaser build, with deliberately failing storage reads.
// These are isolated storage fixtures, not natural battles or device failures.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function setup(){
 const data=new Map();
 const db={
  getItem:key=>data.get(key)??null,
  setItem:(key,value)=>data.set(key,String(value)),
  removeItem:key=>data.delete(key)
 };
 const s=core.createCampaign('bulbasaur');
 s.box.push(s.team.pop()); // Keep the permanent Mewtwo in the PC.
 s.team[0].hp=41;
 s.team[0].status={kind:'veneno',elapsed:2};
 s.money=3187;
 s.wins=4;
 core.saveCampaign(s,db);
 core.readCampaign(db); // Migrate once before the read-failure fixtures.
 const good=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,good);
 return {db,good};
}
function blocked(db,key){
 let writes=0;
 const adapter={
  getItem:k=>{
   if(k===key)throw new Error('SecurityError: key inaccessible');
   return db.getItem(k);
  },
  setItem(){writes++;throw new Error('QuotaExceededError: read-only')},
  removeItem(){throw new Error('read-only')}
 };
 return {adapter,writes:()=>writes};
}

test('T05 reads intact primary when backup key throws, without touching stored bytes',()=>{
 const {db,good}=setup();
 const {adapter,writes}=blocked(db,core.SAVE_BACKUP_KEY);
 const state=core.readCampaign(adapter);
 assert.ok(state,'a denied backup read must not hide an intact primary');
 assert.equal(JSON.stringify(state),good);
 assert.equal(state.team[0].status.kind,'veneno');
 assert.equal(state.team[0].hp,41);
 assert.equal(state.box[0].id,'mewtwo');
 assert.equal(writes(),0,'an intact primary must not trigger restoration');
 assert.equal(db.getItem(core.SAVE_KEY),good);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good);
 assert.deepEqual(core.readCampaign(adapter),state,'second read remains idempotent');
});

test('T05 reads clean backup when primary key throws, even if restore write is blocked',()=>{
 const {db,good}=setup();
 db.setItem(core.SAVE_KEY,'{"version":1,"team":[]}');
 const corrupt=db.getItem(core.SAVE_KEY);
 const {adapter,writes}=blocked(db,core.SAVE_KEY);
 const state=core.readCampaign(adapter);
 assert.ok(state,'a denied primary read must not hide a clean backup');
 assert.equal(JSON.stringify(state),good);
 assert.equal(state.money,3187);
 assert.equal(state.team[0].hp,41);
 assert.equal(state.team[0].status.kind,'veneno');
 assert.equal(state.box[0].id,'mewtwo');
 assert.equal(writes(),1,'restoration should be attempted only once');
 assert.equal(db.getItem(core.SAVE_KEY),corrupt,'failed write is not a successful recovery');
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good,'backup must remain untouched');
 assert.deepEqual(core.readCampaign(adapter),state);
});

test('T05 does not invent a save when both storage keys are unreadable',()=>{
 const {db,good}=setup();
 const inaccessible={getItem(){throw new Error('SecurityError')},
  setItem(){throw new Error('SecurityError')}};
 assert.equal(core.readCampaign(inaccessible),null);
 assert.equal(db.getItem(core.SAVE_KEY),good);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good);
});

test('T05 keeps intact primary when unreadable backup might be corrupt',()=>{
 const {db,good}=setup();
 db.setItem(core.SAVE_BACKUP_KEY,'not-json');
 const {adapter}=blocked(db,core.SAVE_BACKUP_KEY);
 const state=core.readCampaign(adapter);
 assert.equal(JSON.stringify(state),good);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),'not-json');
});
