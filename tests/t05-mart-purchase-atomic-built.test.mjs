import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// T05: run against the actual versioned Phaser build. Storage denial and
// stage/money are fixtures, NOT evidence of earned campaign progress.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);

function fixture(){
 const data=new Map();
 let blocked=null;
 const db={
  getItem:key=>data.get(key)??null,
  setItem(key,value){
   if(key===blocked)throw new Error('QuotaExceededError: '+key);
   data.set(key,String(value));
  },
  removeItem:key=>data.delete(key),
  deny:key=>{blocked=key;},
  allow:()=>{blocked=null;}
 };
 globalThis.localStorage=db;
 const s=core.createCampaign('bulbasaur');
 s.stage=1;s.money=5000;s.badges=[core.GYMS[0].badge];
 core.saveCampaign(s,db);
 const normalized=core.readCampaign(db);
 core.saveCampaign(normalized,db);
 // A known good pre-purchase backup must survive failed transactions.
 db.setItem(core.SAVE_BACKUP_KEY,db.getItem(core.SAVE_KEY));
 return {db,s:normalized};
}

for(const itemId of ['pokeball','potion','antidote','tm-rock-tomb']){
 for(const deniedKey of [core.SAVE_KEY,core.SAVE_BACKUP_KEY]){
  test('T05 Mart '+itemId+' remains atomic when '+deniedKey+' denies storage',()=>{
   const {db,s}=fixture();
   const original=structuredClone(s),originalInventory=s.inventory;
   const primary=db.getItem(core.SAVE_KEY),backup=db.getItem(core.SAVE_BACKUP_KEY);
   db.deny(deniedKey);
   assert.throws(()=>core.purchaseItem(s,itemId),/QuotaExceededError/);
   assert.deepEqual(s,original,'failed purchase mutated live progress or stock');
   assert.strictEqual(s.inventory,originalInventory,'inventory reference changed');
   assert.equal(db.getItem(core.SAVE_KEY),primary,'primary checkpoint changed');
   assert.equal(db.getItem(core.SAVE_BACKUP_KEY),backup,'backup checkpoint changed');
   db.allow();
   assert.deepEqual(core.readCampaign(db),original,'reload lost original progress');
   const result=core.purchaseItem(s,itemId);
   assert.equal(result.ok,true,'purchase retry should succeed');
   assert.equal(s.money,original.money-result.item.price);
   if(result.item.kind==='tm'){
    assert.deepEqual(s.inventory.tms,[...original.inventory.tms,itemId]);
    assert.equal(core.purchaseItem(s,itemId).ok,false,'same TM purchased twice');
   }else{
    assert.equal(s.inventory[itemId],original.inventory[itemId]+1);
   }
   assert.deepEqual(core.readCampaign(db),s,'successful purchase not durable');
  });
 }
}

test('T05 unavailable or unaffordable Mart purchases never write or mutate',()=>{
 const {db,s}=fixture();
 const original=structuredClone(s),primary=db.getItem(core.SAVE_KEY);
 assert.equal(core.purchaseItem(s,'ultraball').ok,false,'locked regional item');
 s.money=0;
 const noFunds=structuredClone(s);
 assert.equal(core.purchaseItem(s,'pokeball').ok,false,'insufficient funds');
 assert.deepEqual(s,noFunds);
 s.money=original.money;
 assert.deepEqual(s,original);
 assert.equal(db.getItem(core.SAVE_KEY),primary);
});
