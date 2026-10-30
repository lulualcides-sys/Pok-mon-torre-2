// Regression against the versioned, built Phaser game. Prepared test saves
// are fixtures; no claim of an entire naturally played Kanto campaign.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8')).modules;
const read=rel=>fs.readFileSync(path.join(base,version,rel),'utf8');
const load=rel=>import(pathToFileURL(path.join(base,version,'torre2',rel)).href);
const [core,routes,party,moves,sprites,surge]=await Promise.all([
 load('campaign-core.js'),load('route-data.js'),load('party-battle.js'),
 load('move-pool.js'),load('campaign-sprites.js'),load('surge3/catalog.js')
]);
const saved=new Map();
globalThis.localStorage={
 getItem:key=>saved.get(key)??null,
 setItem:(key,value)=>saved.set(key,String(value)),
 removeItem:key=>saved.delete(key)
};
const make=(stage=0)=>{
 saved.clear();
 const state=core.createCampaign('bulbasaur');
 state.stage=stage;state.trainer=0;state.money=90000;
 state.badges=core.GYMS.slice(0,Math.min(stage,8)).map(g=>g.badge);
 core.saveCampaign(state);return core.readCampaign();
};
test('every TM is hidden and cannot be bought before its particular leader is defeated',()=>{
 assert.equal(Object.keys(routes.SHOP_TM_BADGE_STAGE).length,
  routes.MART_ITEMS.filter(i=>i.kind==='tm').length);
 for(const tm of routes.MART_ITEMS.filter(i=>i.kind==='tm')){
  const gym=routes.SHOP_TM_BADGE_STAGE[tm.id];
  assert.ok(Number.isInteger(gym)&&gym>=0&&gym<8,tm.id);
  const before=make(gym),funds=before.money;
  assert.equal(routes.martItemUnlocked(before,tm),false,tm.id+' visible pre-leader');
  assert.equal(core.purchaseItem(before,tm.id).ok,false,tm.id+' buyable before leader');
  assert.equal(before.money,funds);
  const atStage=make(Math.max(tm.minStage??0,gym+1));
  // Corrupted/imported save progressed to the city WITHOUT the earned badge.
  atStage.badges=atStage.badges.filter(b=>b!==core.GYMS[gym].badge);
  assert.equal(routes.martItemUnlocked(atStage,tm),false,tm.id+' lacks badge');
  assert.equal(core.purchaseItem(atStage,tm.id).ok,false,tm.id+' bypasses badge');
  atStage.badges.push(core.GYMS[gym].badge);
  assert.ok(routes.martItemUnlocked(atStage,tm),tm.id+' must unlock on victory');
  assert.equal(core.purchaseItem(atStage,tm.id).ok,true,tm.id+' paid purchase denied');
 }
 assert.ok(routes.MART_ITEMS.filter(i=>i.kind!=='tm').every(i=>
  routes.martItemUnlocked(make(Math.max(0,i.minStage??0)),i)),
  'Balls, medicines and potions must keep original city availability');
});
test('nine-map rematch browser includes Brock through Victory Road; no unearned rivals',()=>{
 const s=make(8);s.trainer=10;
 for(let mapStage=0;mapStage<=8;mapStage++){
  const defeated=Array.from({length:core.TRAINERS_PER_GYM(mapStage)},(_,i)=>
   core.rematchOpponent(s,i,mapStage)).filter(Boolean);
  assert.ok(defeated.length>0,'missing rematches on map '+mapStage);
  assert.ok(defeated.every(f=>f.mapStage===mapStage&&!f.leader),
   'wrong stage/leader '+mapStage);
 }
 assert.equal(core.rematchOpponent(s,core.TRAINERS_PER_GYM(8),8),null);
 assert.equal(core.rematchOpponent(s,11,8),null,'current active future trainer blocked');
 assert.equal(core.rematchOpponent(s,0,9),null,'Elite Four cannot be replayed as a trainer');
 const fresh=make(0);fresh.trainer=0;
 assert.equal(core.rematchOpponent(fresh,0,0),null,'Unbeaten trainer never unlocked');
});
test('historic stage0 recharge, atomic result, no duplicate reward or story mutation',()=>{
 const s=make(5);s.trainer=4;
 s.rematches={charge:3,sequence:0,wins:0,pending:null};
 const before={stage:s.stage,trainer:s.trainer,badges:[...s.badges],tms:[...s.inventory.tms]};
 const start=core.startRematch(s,0,0);
 assert.equal(start.ok,true);
 assert.equal(start.ticket.stage,0);
 assert.equal(start.ticket.progressStage,5);
 assert.equal(s.stage,before.stage);assert.equal(s.trainer,before.trainer);
 const reloaded=core.readCampaign();
 const outcome=core.resolveRematch(reloaded,start.ticket,true);
 assert.equal(outcome.ok,true);
 assert.equal(outcome.money,90,'Brock route prize, not endgame prize');
 assert.ok(outcome.xp>0);
 assert.deepEqual({stage:reloaded.stage,trainer:reloaded.trainer,badges:reloaded.badges,
  tms:reloaded.inventory.tms},before);
 assert.equal(core.resolveRematch(reloaded,start.ticket,true).ok,false);
 assert.equal(reloaded.rematches.charge,0);
});
test('Lt Surge uses themed, distinct, offensive four-role kits and retains FireRed forms',()=>{
 const s=make(2);s.trainer=core.TRAINERS_PER_GYM(2);
 const roster=party.createPartyMatch(s,core.currentOpponent(s)).foes;
 assert.deepEqual(roster.map(m=>m.id),['voltorb','pikachu','raichu']);
 assert.deepEqual(roster.map(m=>m.level),[21,18,24]);
 for(const m of roster){
  const actual=['lmb','rmb','q','e'].map(slot=>m.loadout[slot]);
  assert.deepEqual(actual.map(x=>x.nombre),surge.SURGE_LEADER_LOADOUTS[m.id]);
  assert.equal(new Set(actual.map(x=>x.nombre)).size,4);
  assert.ok(actual.every(x=>x.forma&&!x.pendiente));
  assert.equal(actual[3].ulti,true);
  assert.ok(actual[3].dano>0);
 }
 assert.equal(roster[2].loadout.e.nombre,'Thunderbolt');
 assert.equal(roster[1].loadout.rmb.nombre,'Thunder Shock');
});
test('Seismic Toss is 1.8s in Kanto only, original mode and Lv8 ULT are untouched',()=>{
 const native={nombre:'Seismic Toss',cd:6,forma:'proyectil'};
 const altered=moves.balanceCampaignQuickCooldown(native);
 assert.equal(altered.cd,1.8);
 assert.equal(native.cd,6);
 assert.equal(moves.KANTO_CAMPAIGN_QUICK_COOLDOWNS['seismic-toss'],1.8);
 assert.strictEqual(moves.balanceCampaignQuickCooldown({nombre:'ULT · Seismic Toss',
  torre2IntroSource:'seismic-toss',torre2IntroPractice:true,cd:8}).cd,8);
 assert.match(read('torre2/move-pool.js'),
  /balanceCampaignQuickCooldown\(balanceCampaignLeechSeed\(battle\[slot\]\)\)/);
});
test('all Mart items use individually cached Phaser texture sprites',()=>{
 const source=read('torre2/campaign-sprites.js'),ui=read('torre2/campanha.js');
 assert.ok(typeof sprites.shopItemSprite==='function');
 assert.match(source,/g\.generateTexture\(key,24,24\)/);
 assert.match(ui,/shopItemSprite\(this,item\)/);
 assert.match(ui,/martItemUnlocked\(state,i\)/);
 assert.match(ui,/torre2-rematch-map/);
 assert.match(read('torre2/battle-path.js'),/torre2-open-rematch-atlas/);
});
