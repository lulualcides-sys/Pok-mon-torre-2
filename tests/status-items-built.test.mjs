import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const core=await import(pathToFileURL(path.join(root,version,'torre2/campaign-core.js')));
const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
const pairs=[['antidote','veneno'],['burnheal','quemado'],['awakening','dormido'],['paralyzeheal','paralizado'],['iceheal','congelado']];
for(const [item,kind] of pairs){
 const s=core.createCampaign('squirtle');s.team[0].hp=100;s.team[0].status={kind,toxic:kind==='veneno',elapsed:2,turns:3};s.inventory[item]=2;
 const other=JSON.stringify(s.team.slice(1)),money=s.money;
 assert.equal(core.useStatusCure(s,item,0).ok,true);assert.equal(s.team[0].status,null);assert.equal(s.team[0].hp,100);assert.equal(s.inventory[item],1);assert.equal(s.money,money);assert.equal(JSON.stringify(s.team.slice(1)),other);
 assert.equal(core.readCampaign().team[0].status,null);assert.equal(core.readCampaign().inventory[item],1);
 assert.equal(core.useStatusCure(s,item,0).ok,false);assert.equal(s.inventory[item],1);
 s.team[0].hp=0;s.team[0].status={kind};assert.equal(core.useStatusCure(s,item,0).ok,false);assert.equal(s.inventory[item],1);assert.equal(s.team[0].status.kind,kind);
}
const s=core.createCampaign('squirtle');s.team[0].hp=48;s.team[0].status={kind:'quemado'};s.team[0].confusion={turns:2};s.inventory.antidote=1;
assert.equal(core.useStatusCure(s,'antidote').ok,false);assert.equal(s.inventory.antidote,1);
s.inventory.fullheal=1;assert.equal(core.useStatusCure(s,'fullheal').ok,true);assert.equal(s.team[0].status,null);assert.equal(s.team[0].confusion,null);assert.equal(s.team[0].hp,48);assert.equal(s.inventory.fullheal,0);
assert.equal(core.useStatusCure(s,'fullheal').ok,false);
s.team[0].confusion={turns:3};s.inventory.fullheal=1;assert.equal(core.useStatusCure(s,'fullheal').ok,true);assert.equal(s.team[0].confusion,null);
const money=s.money;assert.equal(core.purchaseItem(s,'iceheal').ok,false);assert.equal(s.money,money);assert.equal(core.purchaseItem(s,'antidote').ok,true);assert.equal(s.money,money-100);assert.equal(core.readCampaign().inventory.antidote,2);
// Old saves acquire zero medicine, preserving party, money, badges and inventory.
const old=core.createCampaign('bulbasaur');old.money=777;core.saveCampaign(old);const migrated=core.readCampaign();assert.equal(migrated.money,777);assert.deepEqual(migrated.team,old.team);assert.equal(migrated.inventory.fullheal,0);assert.equal(migrated.inventory.antidote,0);assert.equal(migrated.inventory.pokeball,old.inventory.pokeball);assert.deepEqual(core.readCampaign(),migrated);
console.log('PASS five status cures, Toxic, Full Heal/confusion, no wasted items/revival, persistence, shop gates and safe migration');
