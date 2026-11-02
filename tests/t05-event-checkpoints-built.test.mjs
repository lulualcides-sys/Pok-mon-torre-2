import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// T05: event checkpoints use the actual versioned Phaser build modules.
// These are isolated fixtures, NOT evidence of a naturally played campaign.
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const base=path.join(root,version);
const core=await import(pathToFileURL(path.join(base,'torre2/campaign-core.js')).href);
const progression=await import(pathToFileURL(path.join(base,'torre2/progression.js')).href);
function fresh(){
 const values=new Map();
 globalThis.localStorage={
  getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,String(v)),
  removeItem:k=>values.delete(k)
 };
 const s=core.createCampaign('bulbasaur');
 s.box.push(s.team.pop()); // Preserve the permanent Mewtwo in PC.
 core.saveCampaign(s);
 return core.readCampaign();
}
function checkpoint(state,label){
 const before=localStorage.getItem(core.SAVE_KEY);
 assert.ok(before,label+': no primary save');
 assert.deepEqual(JSON.parse(before),state,label+': event not persisted');
 const loaded=core.readCampaign();
 assert.deepEqual(loaded,state,label+': reload changed state');
 assert.equal(localStorage.getItem(core.SAVE_KEY),before,label+': read rewrote valid save');
 assert.deepEqual(core.readCampaign(),loaded,label+': second read changed state');
 return loaded;
}
function uniqueMembers(s){
 const all=[...s.team,...s.box];
 assert.equal(new Set(all.map(m=>m.uid)).size,all.length,'duplicated party/PC member');
 assert.equal(all.filter(m=>m.id==='mewtwo').length,1,'test Mewtwo duplicated or lost');
}

test('T05 preserves money, items, wild encounter and capture across reloads',()=>{
 let s=fresh();
 const money=s.money,balls=s.inventory.pokeball;
 assert.equal(core.purchaseItem(s,'pokeball').ok,true);
 s=checkpoint(s,'purchase');
 assert.equal(s.money,money-200);
 assert.equal(s.inventory.pokeball,balls+1);
 const found=core.startWildEncounter(s,()=>0);
 assert.equal(found.ok,true);
 s=checkpoint(s,'wild encounter');
 assert.equal(s.pendingWild.id,found.encounter.id);
 const caught=core.attemptCapture(s,()=>0,'pokeball',{duringBattle:true,hpPercent:25});
 assert.equal(caught.ok,true);
 s=checkpoint(s,'wild capture');
 assert.equal(s.pendingWild,null);
 assert.equal(s.inventory.pokeball,balls);
 assert.equal(s.dexCaught.filter(id=>id===caught.pokemon.id).length,1);
 assert.equal(s.team.filter(m=>m.uid===caught.pokemon.uid).length,1);
 uniqueMembers(s);
 const wins=s.wins,trainer=s.trainer,previousMoney=s.money;
 assert.equal(core.resolveBattle(s,true).won,true);
 s=checkpoint(s,'trainer victory');
 assert.equal(s.wins,wins+1);
 assert.equal(s.trainer,trainer+1);
 assert.ok(s.money>previousMoney);
 uniqueMembers(s);
 const losses=s.losses,afterWin=s.wins;
 assert.equal(core.resolveBattle(s,false).won,false);
 s=checkpoint(s,'trainer defeat');
 assert.equal(s.losses,losses+1);
 assert.equal(s.wins,afterWin);
 uniqueMembers(s);
});

test('T05 persists post-battle evolution, PC movements and one-time badge/TM',()=>{
 let s=fresh();
 const xp=progression.totalExperienceForLevel(7)-1;
 s.team.push({id:'caterpie',uid:'t05-caterpie',hp:73,
  progression:progression.createPokemonProgression('caterpie',6,{experience:xp})});
 core.saveCampaign(s);
 s=checkpoint(s,'pre-evolution fixture');
 const battle=core.resolveBattle(s,true);
 assert.equal(battle.won,true);
 assert.ok(battle.evolutions.some(e=>e.from==='caterpie'&&e.to==='metapod'),
  'Level 7 Caterpie must evolve after the trainer battle');
 s=checkpoint(s,'evolution');
 assert.equal(s.team.find(m=>m.uid==='t05-caterpie').id,'metapod');
 assert.equal(s.team.find(m=>m.uid==='t05-caterpie').hp,73,
  'Bench HP must survive battle/evolution');
 assert.equal(core.storePokemon(s,1),true);
 s=checkpoint(s,'store in PC');
 assert.equal(s.box.filter(m=>m.uid==='t05-caterpie').length,1);
 assert.equal(core.withdrawPokemon(s,1),true);
 s=checkpoint(s,'withdraw from PC');
 assert.equal(s.team.filter(m=>m.uid==='t05-caterpie').length,1);
 assert.equal(core.swapPokemon(s,0,0),true);
 s=checkpoint(s,'swap PC and team');
 uniqueMembers(s);
 // This is a deliberately prepared gym checkpoint, not a natural Brock win.
 s.trainer=core.TRAINERS_PER_GYM(0);
 core.saveCampaign(s);
 const result=core.resolveBattle(s,true);
 assert.equal(result.won,true);
 s=checkpoint(s,'Brock fixture reward');
 assert.equal(s.stage,1);
 assert.equal(s.badges.filter(x=>x==='Rocha').length,1);
 assert.equal(s.inventory.tms.filter(x=>x==='tm-rock-tomb').length,1);
 assert.equal(s.gymTMClaims.filter(x=>x==='tm-rock-tomb').length,1);
 uniqueMembers(s);
});
