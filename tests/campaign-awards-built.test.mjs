import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')));
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const s=core.createCampaign('bulbasaur');
for(let stage=0;stage<13;stage++){s.trainer=core.TRAINERS_PER_GYM(stage);core.resolveBattle(s,true);assert.equal(s.badges.length,Math.min(stage+1,8));assert.equal(s.leagueHonors.length,Math.max(0,stage-7));}
assert.equal(s.champion,true);
// Existing saves retain every award, team member and coin through migration.
const old={...s,badges:[...s.badges,...s.leagueHonors]};delete old.leagueHonors;core.saveCampaign(old);
const migrated=core.readCampaign();assert.equal(migrated.badges.length,8);assert.equal(migrated.leagueHonors.length,5);
assert.deepEqual(migrated.team,s.team);assert.equal(migrated.money,s.money);assert.equal(migrated.stage,13);
assert.deepEqual(core.readCampaign(),migrated);
console.log('PASS eight gym badges, five separate League honors, compatible idempotent save migration');

const route=await import(pathToFileURL(path.join(root,version,'torre2/route-data.js')));
const pool=await import(pathToFileURL(path.join(root,version,'torre2/move-pool.js')));
const expected=['tm-rock-tomb','tm-water-pulse','tm-shock-wave','tm-giga-drain','tm-calm-mind','tm-fire-blast','tm-earthquake'];
assert.deepEqual(s.inventory.tms,expected);
assert.deepEqual(s.gymTMClaims,expected);
for(const id of expected){
 const item=route.MART_ITEMS.find(x=>x.id===id);
 assert.ok(item&&pool.TEST_LIBRARY.some(m=>m.nombre===item.move),'reward has a playable move: '+id);
 assert.equal(core.grantGymTM(s,route.GYM_TM_REWARDS.indexOf(id)).claimed,false);
}
// Teaching consumes the item, but never clears the durable reward claim.
const taught=core.createCampaign('squirtle');taught.stage=2;taught.badges=['Rocha','Cascata'];
core.grantGymTM(taught,0);core.grantGymTM(taught,1);
assert.equal(core.teachTM(taught,'tm-water-pulse',0).ok,true);
assert.ok(pool.availableMoves(taught.team[0]).some(m=>m.nombre==='Water Pulse'));
core.saveCampaign(taught);const afterTeach=core.readCampaign();
assert.equal(afterTeach.inventory.tms.includes('tm-water-pulse'),false);
assert.equal(core.grantGymTM(afterTeach,1).claimed,false);
// Legacy saves receive missing gym rewards once, preserving spent Brock TM.
const legacy={...s,inventory:{...s.inventory,tms:[]}};delete legacy.gymTMClaims;
core.saveCampaign(legacy);const repaired=core.readCampaign();
assert.deepEqual(repaired.inventory.tms,expected.slice(1));
assert.deepEqual(JSON.parse(data.get(core.SAVE_BACKUP_KEY)),legacy);
assert.deepEqual(core.readCampaign(),repaired);
assert.deepEqual(repaired.team,s.team);assert.equal(repaired.money,s.money);
const compatible=(item,species)=>route.MART_ITEMS.find(x=>x.id===item).compatible.includes(species);
assert.equal(compatible('tm-water-pulse','magikarp'),false);
assert.equal(compatible('tm-water-pulse','squirtle'),true);
assert.equal(compatible('tm-shock-wave','pikachu'),true);
assert.equal(compatible('tm-shock-wave','bulbasaur'),false);
assert.equal(compatible('tm-giga-drain','mewtwo'),false);
assert.equal(compatible('tm-giga-drain','mew'),true);
const no=core.createCampaign('bulbasaur');no.inventory.tms=['tm-shock-wave'];const before=JSON.stringify(no);
assert.equal(core.teachTM(no,'tm-shock-wave',0).ok,false);assert.equal(JSON.stringify(no),before);
assert.equal(core.purchaseItem(no,'tm-earthquake').ok,false);
console.log('PASS seven playable gym TMs, one-time legacy repair, consumed rewards, canonical FRLG compatibility and shop gates; Toxic remains pending');

const bought=core.createCampaign('squirtle');bought.inventory.tms=['tm-water-pulse'];
assert.equal(core.grantGymTM(bought,1).added,true,'a prior purchase must not cancel the gym prize');
assert.equal(bought.inventory.tms.length,2);assert.equal(core.grantGymTM(bought,1).claimed,false);
