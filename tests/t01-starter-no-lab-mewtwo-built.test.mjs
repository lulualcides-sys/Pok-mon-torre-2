/* T01: a real NEW Kanto journey starts with only the selected starter.
 * The historical two-member factory is retained for legacy fixture and
 * existing save compatibility; never delete a previously saved Pokémon. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const core=await import(pathToFileURL(path.join(root,modules,'torre2/campaign-core.js')).href);
const pool=await import(pathToFileURL(path.join(root,modules,'torre2/move-pool.js')).href);
const storage=()=>{const map=new Map();return {
 getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),
 removeItem:k=>map.delete(k)
}};
for(const starter of core.STARTERS){
 const fresh=core.createPlayerCampaign(starter);
 assert.deepEqual(fresh.team.map(x=>x.id),[starter],
  'New journey must start with chosen Lv5 starter only');
 assert.equal(fresh.team[0].progression.level,5);
 assert.deepEqual(fresh.box,[],'No laboratory Mewtwo in fresh PC');
 assert.deepEqual(fresh.dexSeen,[starter]);
 assert.deepEqual(fresh.dexCaught,[starter]);
 assert.equal(fresh.active,0);
 assert.equal(fresh.stage,0);
 assert.equal(fresh.trainer,0);
 assert.equal(fresh.wins,0);
 assert.equal(fresh.badges.length,0);
 const kit=pool.resolveLoadout(fresh.team[0]);
 assert.ok(['lmb','rmb','q'].every(slot=>kit[slot]?.forma&&!kit[slot].pendiente),
  'Starter must retain three real attacks at Lv5');
 assert.equal(kit.e,undefined,'Lv5 ULT must remain locked');
 const db=storage();core.saveCampaign(fresh,db);
 const loaded=core.readCampaign(db);
 assert.deepEqual(loaded.team.map(x=>x.id),[starter],
  'Reload must not restore the free Mewtwo');
 assert.deepEqual(loaded.box,[]);
 assert.equal(loaded.team[0].uid,fresh.team[0].uid);
}
// Existing saves may legitimately contain a prior laboratory tester.
// Reading such a saved party/PC must never silently delete any member.
const old=core.createCampaign('bulbasaur');
assert.deepEqual(old.team.map(x=>x.id),['bulbasaur','mewtwo'],
 'Historical fixture must remain available without affecting new players');
const oldDb=storage();core.saveCampaign(old,oldDb);
assert.deepEqual(core.readCampaign(oldDb).team.map(x=>x.id),['bulbasaur','mewtwo']);
old.box.push(old.team.pop());core.saveCampaign(old,oldDb);
const oldLoaded=core.readCampaign(oldDb);
assert.deepEqual(oldLoaded.team.map(x=>x.id),['bulbasaur']);
assert.deepEqual(oldLoaded.box.map(x=>x.id),['mewtwo'],
 'Existing PC saves must never lose their previous Pokémon');
console.log('PASS_T01_ONE_STARTER_NO_DEBUG_M2',JSON.stringify({
 starters:core.STARTERS,realStarterOnly:true,pcEmpty:true,
 oldSavesPreserved:true,level5Attacks:3,ultUnlockedAt:8
}));
