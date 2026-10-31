// T17 data mechanics only. Prepared deterministic RNG, NOT a naturally
// observed wild Shiny, full-game encounter animation or Android validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [core,progression]=await Promise.all([
 load('torre2/campaign-core.js'),load('torre2/progression.js')
]);
function fresh(){
 const store=new Map();let deny=false;
 const storage={
  getItem:key=>store.get(key)??null,
  setItem(key,value){
   if(deny&&key===core.SAVE_KEY)throw Error('primary storage refused');
   store.set(key,String(value));
  },
  removeItem:key=>store.delete(key),
  deny:()=>{deny=true},allow:()=>{deny=false}
 };
 globalThis.localStorage=storage;
 const state=core.createPlayerCampaign('bulbasaur');
 core.saveCampaign(state);
 return {state,storage};
}
function start(state,speciesRoll=.2,shinyRoll=.005){
 const values=[speciesRoll,shinyRoll];let calls=0;
 const result=core.startWildEncounter(state,()=>{
  calls++;return values.shift()??.8;
 });
 return {result,calls};
}
test('exact 1% independent Shiny roll is attached once to a durable wild encounter',()=>{
 const {state}=fresh(),{result,calls}=start(state,.21,.009999);
 assert.equal(calls,2,'One species draw and exactly one Shiny draw');
 assert.equal(result.ok,true);
 assert.equal(result.encounter.shiny,true);
 assert.equal(core.startWildBattle(state).torre2.shiny,true);
 assert.ok(state.dexShinySeen.includes(result.encounter.id));
 const before=JSON.stringify(state.pendingWild);
 const reloaded=core.readCampaign();
 assert.equal(JSON.stringify(reloaded.pendingWild),before,'Reload must not reroll the Shiny');
 assert.equal(core.startWildBattle(reloaded).torre2.shiny,true);
 assert.ok(reloaded.dexShinySeen.includes(result.encounter.id));
 assert.deepEqual(reloaded.dexShinyCaught,[],'Sighting is not a capture');
});
test('1% boundary and invalid RNG never award a free Shiny',()=>{
 for(const roll of [.01,.5,.999999,Number.NaN,-1]){
  const {state}=fresh(),{result,calls}=start(state,.25,roll);
  assert.equal(result.ok,true);assert.equal(calls,2);
  assert.equal(result.encounter.shiny,false,'Not shiny at RNG '+roll);
  assert.equal(core.startWildBattle(state).torre2.shiny,false);
  assert.equal(state.dexShinySeen.length,0);
 }
});
for(const boxed of [false,true]){
 test('native Shiny capture stays marked in '+(boxed?'PC':'party')+' and after reload',()=>{
  const {state}=fresh();
  if(boxed){
   for(let i=1;i<6;i++)state.team.push({uid:'ordinary-'+i,id:'pidgey',
    hp:100,progression:progression.createPokemonProgression('pidgey',5)});
   core.saveCampaign(state);
  }
  const {result}=start(state,.3,.00001);
  const id=result.encounter.id;
  const caught=core.attemptCapture(state,()=>0,'pokeball',
   {duringBattle:true,hpPercent:1,hp:1,hpMax:100});
  assert.equal(caught.ok,true,'Deterministic capture should succeed');
  assert.equal(caught.pokemon.shiny,true);
  assert.ok(state.dexShinySeen.includes(id));
  assert.ok(state.dexShinyCaught.includes(id));
  const reloaded=core.readCampaign();
  const target=boxed?reloaded.box:reloaded.team;
  const member=target.find(m=>m.id===id&&m.shiny);
  assert.ok(member,'Shiny should persist in '+(boxed?'PC':'team'));
  assert.equal(reloaded.pendingWild,null);
  assert.ok(reloaded.dexShinyCaught.includes(id));
 });
}
test('denied save cannot grant a phantom Shiny, sightings or capture',()=>{
 const {state,storage}=fresh();
 const original=structuredClone(state);
 const beforePrimary=storage.getItem(core.SAVE_KEY);
 const beforeBackup=storage.getItem(core.SAVE_BACKUP_KEY);
 storage.deny();
 assert.throws(()=>start(state,.4,.001),/primary storage refused/);
 assert.deepEqual(state,original,'Denied encounter changed the live state');
 assert.equal(storage.getItem(core.SAVE_KEY),beforePrimary);
 assert.equal(storage.getItem(core.SAVE_BACKUP_KEY),beforeBackup);
 storage.allow();
 assert.equal(start(state,.4,.001).result.encounter.shiny,true);
 const beforeCapture=structuredClone(state);
 const capturedPrimary=storage.getItem(core.SAVE_KEY);
 storage.deny();
 assert.throws(()=>core.attemptCapture(state,()=>0,'pokeball',
  {duringBattle:true,hpPercent:1,hp:1,hpMax:100}),/primary storage refused/);
 assert.deepEqual(state,beforeCapture,'Denied capture created Pokémon or spent ball');
 assert.equal(storage.getItem(core.SAVE_KEY),capturedPrimary);
 storage.allow();
 assert.equal(core.attemptCapture(state,()=>0,'pokeball',
  {duringBattle:true,hpPercent:1,hp:1,hpMax:100}).ok,true);
});
test('Shiny Eevee keeps its identity and records evolved form',()=>{
 const {state}=fresh();
 state.stage=4;
 state.box.push({uid:'rare-eevee',id:'eevee',shiny:true,hp:68,
  progression:progression.createPokemonProgression('eevee',30,{
   experience:progression.totalExperienceForLevel(30)})});
 core.saveCampaign(state);
 const result=core.chooseEeveeEvolution(state,'rare-eevee','jolteon');
 assert.equal(result.ok,true);
 const saved=core.readCampaign();
 const eevee=saved.box.find(m=>m.uid==='rare-eevee');
 assert.equal(eevee.id,'jolteon');assert.equal(eevee.shiny,true);
 assert.ok(saved.dexShinySeen.includes('jolteon'));
 assert.ok(saved.dexShinyCaught.includes('jolteon'));
});
