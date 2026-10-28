import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Built Phaser client, not a rewritten mock of the campaign runtime.
// Corruption is deliberately injected in an isolated storage adapter.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')).href);
function storage(){
 const map=new Map();let writes=0;
 return {getItem:k=>map.get(k)??null,
  setItem(k,v){writes++;map.set(k,String(v));},
  removeItem:k=>map.delete(k),get writes(){return writes}};
}
function checkpoint(){
 const s=core.createCampaign('squirtle');
 s.team[0].hp=47;s.money=9876;s.inventory.pokeball=13;
 s.inventory.potion=2;s.inventory.tms=['tm-rock-tomb'];
 s.box.push(s.team.pop());s.stage=1;s.trainer=2;
 const isolated=storage();core.saveCampaign(s,isolated);
 return core.readCampaign(isolated); // Normalize legacy additive fields first.

}
test('T05 rejects invalid economy writes before touching primary or backup',()=>{
 const db=storage(),s=checkpoint();
 core.saveCampaign(s,db);
 const good=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,good);
 const mutations=[
  ['negative money',x=>x.money=-1],
  ['nonfinite money',x=>x.money=Infinity],
  ['missing money',x=>delete x.money],
  ['negative balls',x=>x.inventory.pokeball=-1],
  ['fractional potions',x=>x.inventory.potion=1.5],
  ['nonfinite greatballs',x=>x.inventory.greatball=NaN],
  ['missing TM array',x=>delete x.inventory.tms],
  ['negative antidote',x=>x.inventory.antidote=-3]
 ];
 for(const [name,damage] of mutations){
  const bad=structuredClone(s);damage(bad);
  const writes=db.writes;
  assert.throws(()=>core.saveCampaign(bad,db),/Refusing to persist/,name);
  assert.equal(db.writes,writes,name+' wrote before validation');
  assert.equal(db.getItem(core.SAVE_KEY),good,name+' damaged primary');
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good,name+' damaged backup');
 }
});
test('T05 restores clean backup rather than silently resetting corrupted money or inventory',()=>{
 for(const damage of [x=>x.money=-100,x=>x.money=null,
  x=>x.inventory.pokeball=-5,x=>x.inventory.tms='invalid']){
  const db=storage(),s=checkpoint();
  core.saveCampaign(s,db);
  const good=db.getItem(core.SAVE_KEY);
  db.setItem(core.SAVE_BACKUP_KEY,good);
  const bad=structuredClone(s);damage(bad);
  db.setItem(core.SAVE_KEY,JSON.stringify(bad));
  const recovered=core.readCampaign(db);
  assert.deepEqual(recovered,s,'recover original earned economy and party');
  assert.equal(db.getItem(core.SAVE_KEY),good,'restore original bytes');
  assert.equal(db.getItem(core.SAVE_BACKUP_KEY),good,'retain clean backup');
  assert.deepEqual(core.readCampaign(db),s,'second load is idempotent');
 }
});
test('T05 legacy economy corruption without backup migrates without dropping party or PC',()=>{
 const db=storage(),s=checkpoint();
 const corrupted=structuredClone(s);
 corrupted.money=-9;corrupted.inventory.pokeball=-2;
 db.setItem(core.SAVE_KEY,JSON.stringify(corrupted));
 const recovered=core.readCampaign(db);
 assert.ok(recovered);
 assert.equal(recovered.money,1400,'legacy fallback only when no good checkpoint');
 assert.equal(recovered.inventory.pokeball,5);
 assert.deepEqual(recovered.team,s.team);
 assert.deepEqual(recovered.box,s.box);
 assert.deepEqual(core.readCampaign(db),recovered);
});
test('T05 never rotates a corrupt economic primary over the last clean backup',()=>{
 const db=storage(),s=checkpoint();
 core.saveCampaign(s,db);
 const clean=db.getItem(core.SAVE_KEY);
 db.setItem(core.SAVE_BACKUP_KEY,clean);
 db.setItem(core.SAVE_KEY,JSON.stringify({...s,money:-999}));
 const next=structuredClone(s);next.money+=200;
 core.saveCampaign(next,db);
 assert.equal(db.getItem(core.SAVE_BACKUP_KEY),clean);
 assert.equal(core.readCampaign(db).money,10076);
});
