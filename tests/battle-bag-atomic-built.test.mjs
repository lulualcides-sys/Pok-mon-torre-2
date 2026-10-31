// T05: real built Phaser module and atomic localStorage dual-key write.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const v=JSON.parse(fs.readFileSync(path.join(dir,'version.json'),'utf8')).modules;
const url=filename=>pathToFileURL(path.join(dir,v,'torre2',filename)).href;
const {commitBattleBagItem}=await import(url('battle-bag.js'));
const core=await import(url('campaign-core.js'));
const make=()=>{
 const data=new Map(),failed={key:null};
 const storage={
  getItem:k=>data.get(k)??null,
  setItem(k,v){if(k===failed.key)throw new Error('storage rejected '+k);data.set(k,String(v))},
  removeItem:k=>data.delete(k)};
 const s=core.createCampaign('squirtle');
 s.inventory.potion=3;s.inventory.antidote=2;
 core.saveCampaign(s,storage);
 storage.setItem(core.SAVE_BACKUP_KEY,storage.getItem(core.SAVE_KEY));
 const party={friend:s.team.map(m=>({...m})),playerIndex:0};
 return {s,party,storage,failed};
};
for(const deny of [core.SAVE_KEY,core.SAVE_BACKUP_KEY])
 test('compiled Phaser battle Bag save is atomic when '+deny+' rejects',()=>{
  const {s,party,storage,failed}=make();
  const before=structuredClone(s),battle=structuredClone(party);
  // readCampaign legitimately migrates legacy inventory defaults and may
  // rewrite the primary checkpoint. Capture the baseline AFTER migration.
  const loadedBefore=core.readCampaign(storage);
  const first=storage.getItem(core.SAVE_KEY),backup=storage.getItem(core.SAVE_BACKUP_KEY);
  const ref=s.team[0],friend=party.friend[0],inv=s.inventory;
  failed.key=deny;
  assert.throws(()=>commitBattleBagItem(s,party,'potion',0,{hp:27},
   draft=>core.saveCampaign(draft,storage)),/storage rejected/);
  assert.deepEqual(s,before);
  assert.deepEqual(party,battle);
  assert.equal(storage.getItem(core.SAVE_KEY),first);
  assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),backup);
  assert.deepEqual(core.readCampaign(storage),loadedBefore,'failed write changed recovery');
  failed.key=null;
  const ok=commitBattleBagItem(s,party,'potion',0,{hp:27},
   draft=>core.saveCampaign(draft,storage));
  assert.equal(ok.ok,true);assert.equal(s.inventory.potion,2);
  assert.equal(s.team[0].hp,52);assert.equal(party.friend[0].hp,52);
  assert.strictEqual(s.team[0],ref);assert.strictEqual(party.friend[0],friend);
  assert.strictEqual(s.inventory,inv);
  assert.deepEqual(JSON.parse(storage.getItem(core.SAVE_KEY)),s,
   'primary must contain exact atomic committed snapshot');
  const recovered=core.readCampaign(storage);
  assert.equal(recovered.team[0].hp,s.team[0].hp);
  assert.equal(recovered.inventory.potion,s.inventory.potion);
 });
