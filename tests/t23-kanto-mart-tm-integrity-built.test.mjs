// T23 — regression of the actual BUILT Phaser campaign Mart and TM actions.
// Isolated in-memory localStorage, no real player saves, no fabricated battles,
// no new moves, no sprite/VFX changes. Stages and money are prepared fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,version,'torre2',p)).href);
const [{MART_ITEMS,GYM_TM_REWARDS},core,{KANTO_151},{createPokemonProgression}]=await Promise.all([
 load('route-data.js'),load('campaign-core.js'),load('all-kanto-species.js'),
 load('progression.js')
]);
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.get(k)??null,
 setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
const copy=v=>JSON.parse(JSON.stringify(v));
const factory=(stage=0)=>{
 storage.clear();
 const s=core.createCampaign('bulbasaur');
 s.stage=stage;s.trainer=0;s.money=25000;
 s.badges=core.GYMS.slice(0,Math.min(stage,8)).map(g=>g.badge);
 // Gym TM already earned/spent, so Mart purchase is a replacement.
 s.gymTMClaims=GYM_TM_REWARDS.slice(0,Math.min(stage,8)).filter(Boolean);
 s.inventory.tms=[];
 core.saveCampaign(s);return core.readCampaign();
};
const kantoIds=new Set(KANTO_151.map(x=>x.id));
const report={scope:'T23 real compiled Kanto shop/medicine/TM economy integrity',
 preparedStageAndMoney:true,naturalJourney:false,
 items:[],tmCompatibility:[],gymClaims:[],rejected:[]};
test('T23 all Mart items obey unlock stage and charge exactly the listed price',()=>{
 assert.ok(MART_ITEMS.length>=14,'Kanto Mart catalog unexpectedly incomplete');
 const ids=new Set();
 for(const item of MART_ITEMS){
  assert.ok(item.id&&!ids.has(item.id),'Duplicate shop item '+item.id);
  ids.add(item.id);
  assert.ok(Number.isInteger(item.price)&&item.price>=100,'Invalid shop price '+item.id);
  const stage=item.minStage??0;
  assert.ok(stage>=0&&stage<=8,'Unexpected Mart unlock stage '+item.id);
  if(stage>0){
   const before=factory(stage-1),money=before.money,stock=copy(before.inventory);
   assert.equal(core.purchaseItem(before,item.id).ok,false,'Early shop unlock '+item.id);
   assert.equal(before.money,money,'Premature purchase charged '+item.id);
   assert.deepEqual(before.inventory,stock,'Premature purchase added stock '+item.id);
   assert.deepEqual(core.readCampaign().inventory,stock,'Early shop mutated persisted stock '+item.id);
  }
  const ready=factory(stage),money=ready.money;
  const countBefore=item.kind==='tm'?ready.inventory.tms.filter(x=>x===item.id).length:
   ready.inventory[item.id]||0;
  assert.ok(core.purchaseItem(ready,item.id).ok,'Stage '+stage+' buy '+item.id);
  const saved=core.readCampaign();
  assert.equal(saved.money,money-item.price,'Exact charge '+item.id);
  assert.equal(saved.stage,stage,'Purchase cannot advance trainer stage');
  const countAfter=item.kind==='tm'?saved.inventory.tms.filter(x=>x===item.id).length:
   saved.inventory[item.id]||0;
  assert.equal(countAfter,countBefore+1,'Correct purchased quantity '+item.id);
  const priceAfter=saved.money,inventoryAfter=copy(saved.inventory);
  if(item.kind==='tm'){
   assert.equal(core.purchaseItem(saved,item.id).ok,false,
    'Duplicate TM in BAG cannot be purchased '+item.id);
   assert.equal(saved.money,priceAfter,'Duplicate TM purchase charged money '+item.id);
   assert.deepEqual(saved.inventory,inventoryAfter,
    'Duplicate TM purchase altered BAG '+item.id);
  }
  const invalid=core.purchaseItem(saved,'not-an-item');
  assert.equal(invalid.ok,false,'Unknown item unexpectedly permitted');
  assert.equal(saved.money,priceAfter,'Unknown item deducted money '+item.id);
  assert.deepEqual(core.readCampaign().inventory,inventoryAfter,
   'Failed purchase changed the persisted BAG '+item.id);
  const restored=core.readCampaign();
  assert.equal(restored.money,priceAfter);
  report.items.push({item:item.id,kind:item.kind,stage,price:item.price,
   before:countBefore,after:countAfter,duplicateRejected:item.kind==='tm'});
 }
});
test('T23 each legal TM respects actual Kanto compatibility, consumption and reload',()=>{
 const tms=MART_ITEMS.filter(x=>x.kind==='tm');
 assert.ok(tms.length>=9);
 for(const tm of tms){
  const compatible=tm.compatible.filter(x=>kantoIds.has(x));
  const blocked=KANTO_151.find(x=>!tm.compatible.includes(x.id))?.id;
  assert.ok(compatible.length>0,tm.id+' has no real compatible Kanto species');
  assert.ok(blocked,tm.id+' has no incompatible Kanto test species');
  const owner=compatible[0],s=factory(tm.minStage??0);
  assert.ok(core.purchaseItem(s,tm.id).ok,tm.id+' purchase failed');
  const bought=core.readCampaign();
  const unchanged=copy(bought.inventory),cash=bought.money;
  bought.team[0].id=blocked;
  bought.team[0].uid='t23-incompatible-'+tm.id;
  bought.team[0].progression=createPokemonProgression(blocked,15);
  assert.equal(core.teachTM(bought,tm.id,0).ok,false,
   'TM illegally taught to '+blocked+': '+tm.id);
  assert.equal(bought.money,cash,'TM incompatibility charged money '+tm.id);
  assert.deepEqual(bought.inventory,unchanged,
   'TM incompatibility consumed item '+tm.id);
  bought.team[0].id=owner;
  bought.team[0].uid='t23-compatible-'+tm.id;
  bought.team[0].progression=createPokemonProgression(owner,15);
  const taught=core.teachTM(bought,tm.id,0);
  assert.ok(taught.ok,'Legal '+tm.id+' teaching rejected for '+owner+': '+taught.reason);
  assert.equal(taught.move,tm.move);
  assert.equal(bought.money,cash,'Teaching TM deducted extra money '+tm.id);
  assert.equal(bought.inventory.tms.includes(tm.id),false,
   'Teaching TM must consume exactly one item '+tm.id);
  assert.equal(bought.team[0].tmMoves.filter(x=>x===tm.move).length,1,
   'TM move applied more than once '+tm.id);
  assert.equal(core.teachTM(bought,tm.id,0).ok,false,
   'Reusing consumed TM must fail '+tm.id);
  const saved=core.readCampaign();
  assert.equal(saved.team[0].id,owner);
  assert.equal(saved.team[0].tmMoves.filter(x=>x===tm.move).length,1);
  assert.equal(saved.inventory.tms.includes(tm.id),false);
  assert.equal(saved.money,cash,'Reload after TM teaching changed money '+tm.id);
  report.tmCompatibility.push({id:tm.id,move:tm.move,owner,rejected:blocked});
 }
});
test('T23 all available gym TM rewards are claimed once, and spending cannot respawn them',()=>{
 assert.equal(GYM_TM_REWARDS.length,8);
 const ids=GYM_TM_REWARDS.filter(Boolean);
 assert.equal(ids.length,7,'Toxic is separately blocked, never invent the missing gym TM');
 for(let gym=0;gym<8;gym++){
  const reward=GYM_TM_REWARDS[gym],s=factory(gym+1);
  if(reward)s.gymTMClaims=s.gymTMClaims.filter(id=>id!==reward);
  if(!reward){
   assert.equal(core.grantGymTM(s,gym).claimed,false);
   continue;
  }
  assert.ok(ids.includes(reward));
  const cash=s.money;
  const first=core.grantGymTM(s,gym);
  assert.ok(first.claimed&&first.added,reward+' not awarded');
  assert.equal(core.grantGymTM(s,gym).claimed,false,
   reward+' repeated gym reward exploit');
  assert.equal(s.inventory.tms.filter(x=>x===reward).length,1,
   reward+' duplicate gym prize');
  core.saveCampaign(s);
  const saved=core.readCampaign();
  assert.ok(saved.gymTMClaims.includes(reward));
  assert.equal(core.grantGymTM(saved,gym).claimed,false);
  assert.equal(saved.inventory.tms.filter(x=>x===reward).length,1);
  assert.equal(saved.money,cash,'Gym reward should be free');
  // Persist legitimate earned reward claim, then remove the single TM to
  // represent having spent it; a reload must never grant it a second time.
  saved.inventory.tms.splice(saved.inventory.tms.indexOf(reward),1);
  core.saveCampaign(saved);
  const spent=core.readCampaign();
  assert.equal(spent.inventory.tms.includes(reward),false);
  assert.equal(core.grantGymTM(spent,gym).claimed,false);
  assert.equal(spent.money,cash);
  report.gymClaims.push({gym,reward,once:true,restored:false});
 }
});
test('T23 insufficient funds and invalid items never mutate monetary checkpoints',()=>{
 for(const item of MART_ITEMS){
  const s=factory(item.minStage??0),start=copy(s.inventory);
  s.money=item.price-1;core.saveCampaign(s);
  const raw=storage.get(core.SAVE_KEY);
  const result=core.purchaseItem(s,item.id);
  assert.equal(result.ok,false,item.id+' purchased with insufficient money');
  assert.equal(storage.get(core.SAVE_KEY),raw,'Failed charge wrote a checkpoint');
  assert.equal(s.money,item.price-1);
  assert.deepEqual(s.inventory,start);
 }
 fs.mkdirSync('test-evidence',{recursive:true});
 fs.writeFileSync('test-evidence/t23-shop-tm-economic-audit.json',
  JSON.stringify(report,null,2));
 console.log('T23 KANTO MART & TM AUDIT PASS',JSON.stringify({
  auditedItems:report.items.length,tmCompatibility:report.tmCompatibility.length,
  gymClaims:report.gymClaims.length,mode:'built source, in-memory checkpoint'
 }));
});
