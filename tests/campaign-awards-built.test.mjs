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
