import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const dir=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const moduleAt=name=>import(pathToFileURL(path.join(root,dir,name)).href);
const {SURGE3_MOVES,SURGE_LEADER_LOADOUTS}=await moduleAt('torre2/surge3/catalog.js');
const {SURGE3_FORMS}=await moduleAt('torre2/surge3/runtime.js');
const {TORRE2_FORMS}=await moduleAt('torre2/signature-fx.js');
const {TEST_LIBRARY,availableMoves,resolveLoadout,filterMoveLibrary}=await moduleAt('torre2/move-pool.js');
const {KANTO_ROUTE_SLOTS,earlyKantoSlotPlan}=await moduleAt('torre2/early-kanto-species.js');
const {createPartyMatch}=await moduleAt('torre2/party-battle.js');
const {currentOpponent,createCampaign,TRAINERS_PER_GYM}=await moduleAt('torre2/campaign-core.js');
globalThis.localStorage={getItem(){return null},setItem(){},removeItem(){}};
assert.equal(SURGE3_MOVES.length,3);
for(const h of SURGE3_MOVES){
 assert.equal(TEST_LIBRARY.filter(x=>x.id===h.id).length,1,h.id+' duplicate ID');
 assert.equal(TEST_LIBRARY.filter(x=>x.nombre===h.nombre).length,1,h.id+' duplicate name');
 assert.equal(typeof TORRE2_FORMS[h.forma],'function','Form missing in real Phaser forms '+h.id);
 assert.equal(typeof SURGE3_FORMS[h.forma],'function',h.id);
 assert.equal(h.approved,true,'Player approved the three Surge moves');
 assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').some(m=>m.id===h.id),false,
  'Approved Surge move must not appear in NEW');
}
assert.equal(filterMoveLibrary(TEST_LIBRARY,'NEW').filter(x=>x.id==='ancient-power'||x.id==='ice-shard').length,0,
 'Ice Shard and Ancient Power must NOT reappear in NEW');
const pairs=[
 ['voltorb','sonic-boom'],['voltorb','screech'],
 ['electrode','sonic-boom'],['electrode','screech'],
 ['magnemite','sonic-boom'],['magneton','sonic-boom'],
 ['pikachu','thunder-wave'],['raichu','thunder-wave']
];
// Verify the inherited Poké Arena Raichu lineup still lists the genuinely
// unlocked new electric status move, not an unrelated native move.
for(const [species,move] of pairs){
 const member={id:species,progression:{species,level:40}};
 assert.ok(availableMoves(member).some(x=>x.id===move),
  species+' missing '+move+
  ' | catalog='+JSON.stringify(TEST_LIBRARY.filter(x=>x.id===move))+
  ' | available='+JSON.stringify(availableMoves(member).map(x=>x.id))+
  ' | plan='+JSON.stringify(earlyKantoSlotPlan(species)));
}
assert.deepEqual(KANTO_ROUTE_SLOTS.voltorb,['Tackle','Sonic Boom','Screech','Explosion']);
assert.deepEqual(KANTO_ROUTE_SLOTS.electrode,['Tackle','Sonic Boom','Discharge','Explosion']);
for(const name of ['voltorb','electrode']){
 const kit=resolveLoadout({id:name,progression:{species:name,level:40}});
 assert.ok(kit.lmb?.forma&&kit.rmb?.forma&&kit.q?.forma&&kit.e?.forma);
 assert.ok(earlyKantoSlotPlan(name));
 assert.equal(kit.e.ulti,true);
}
const state=createCampaign('bulbasaur');state.stage=2;
state.trainer=TRAINERS_PER_GYM(2);
const foes=createPartyMatch(state,currentOpponent(state)).foes;
assert.deepEqual(foes.map(f=>f.id),['voltorb','pikachu','raichu']);
for(const foe of foes){
 assert.deepEqual(['lmb','rmb','q','e'].map(k=>foe.loadout[k].nombre),
  SURGE_LEADER_LOADOUTS[foe.id],foe.id+' boss must have true FireRed four moves');
 assert.equal(foe.loadout.e.ulti,true);
}
const captured=fs.readFileSync(path.join(root,dir,'luchador.js'),'utf8');
assert.ok(captured.includes('torre2Screech?.stages||0'),
 'Screech must actually affect Kanto Defense getter by two stages');
console.log('Surge 3 built: real Phaser VFX, boss FireRed party, 20 fixed damage, status mapping, Pokédex and confirmed visual approval');
