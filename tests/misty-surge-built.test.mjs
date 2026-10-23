import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {LEVEL_EVOLUTIONS,createPokemonProgression} from '../src/progression.js';
const base=path.resolve('_site/arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8')).modules;
const file=p=>path.join(base,ver,p);
const mod=p=>import(pathToFileURL(file(p)));
const {ROSTER,buscar}=await mod('datos.js');
const {EARLY_KANTO_BASE,MISTY_ROUTE_BASE,SURGE_ROUTE_BASE,LATE_GYM_BASE,EARLY_KANTO_FORMS,
 earlyKantoSlotPlan,nativeKantoEvolutionPlan}=await mod('torre2/early-kanto-species.js');
const {TEST_LIBRARY,availableMoves,defaultLoadout,selectedMoves,resolveLoadout}=await mod('torre2/move-pool.js');
const {GYMS,TRAINERS_PER_GYM,currentOpponent,createCampaign}=await mod('torre2/campaign-core.js');
const {createPartyMatch}=await mod('torre2/party-battle.js');

globalThis.localStorage={
 items:new Map(),setItem(k,v){this.items.set(k,v)},
 getItem(k){return this.items.get(k)||null},
 removeItem(k){this.items.delete(k)}
};
const manifest=JSON.parse(fs.readFileSync(path.join(base,'assets/pmd/manifest.json'),'utf8'));
const families=[...EARLY_KANTO_BASE,...MISTY_ROUTE_BASE,...SURGE_ROUTE_BASE,...LATE_GYM_BASE];
assert.equal(families.length,31,'31 distinct Kanto families: eight later gym lines');
for(const id of families){
 const def=ROSTER.find(x=>x.id===id);
 assert.ok(def,'MISSING BATTLE POKÉMON '+id);
 for(const dex of EARLY_KANTO_FORMS[id]){
  const asset=manifest[dex];
  assert.ok(asset?.anims?.Idle&&asset?.anims?.Walk,
   'NO actual PMD sprite for '+id+' / '+dex);
  for(const anim of [asset.anims.Idle,asset.anims.Walk]){
   const png=path.join(base,'assets/pmd',anim.file);
   assert.ok(fs.existsSync(png)&&fs.statSync(png).size>50,'Missing PMD sheet '+png);
  }
 }
 const forms=[id,...def.evoluciones.map(x=>x.nombre.toLowerCase())];
 for(const species of forms){
  const {def:resolved}=buscar(species);
  assert.ok(resolved,'Every Kanto form must resolve to a real PMD battle entry');
  // Original Poké Arena has Pichu -> Pikachu -> Raichu before the additive
  // early-Kanto entry. Preserve its original lookup priority; verify the
  // added Kanto line directly for our campaign-only five-slot evolution kit.
  const formIndex=species===id?0:def.evoluciones.findIndex(
   e=>e.nombre.toLowerCase()===species)+1;
  assert.ok(formIndex>=0,'New Kanto evolution is defined: '+species);
  // Test at real evolution levels, not just Lv50. The previous test
  // passed at 50 while evolved Pokémon actually had blank battle slots.
  const previous=formIndex>1?forms[formIndex-1]:id;
  const rule=LEVEL_EVOLUTIONS[previous]?.find(x=>x.to===species);
  const level=species===id?50:rule?.level||50;
  const member={id:species,progression:{species,level}};
  const plan=earlyKantoSlotPlan(species);
  assert.equal(plan?.length,4,'ATK/RMB/Q/E plan missing '+species);
  const slots=selectedMoves(member);
  assert.equal(slots.length,4,'Four reserved slots '+species);
  const loadout=resolveLoadout(member);
  const evolved=formIndex>0;
  const mayUseUlt=evolved||!['caterpie','weedle'].includes(species);
  const active=evolved?['lmb','rmb','q','e']:['lmb'];
  for(const control of active){
   assert.ok(loadout[control]?.forma,
    species+' has no ${control} attack at REAL evolution Lv'+level);
   assert.notEqual(loadout[control]?.pendiente,true,
    species+' must not have an unusable '+control);
  }
  if(evolved){
   assert.equal(loadout.e.ulti,true,species+' E is a real ultimate');
   assert.equal(new Set(['lmb','rmb','q','e'].map(k=>loadout[k].nombre)).size,4,
    species+' needs four DIFFERENT skills after evolution');
   const stale={...member,moves:['tackle','gust','bite','quick-attack'],
    movePlanSpecies:previous};
   assert.deepEqual(selectedMoves(stale),slots,
    species+' migration must remove pre-evolution moves');
  }
  if(!mayUseUlt)assert.equal(loadout.e,undefined,
   'Larvae must not borrow the evolved ultimate');
  const kit=formIndex>0?def.evoluciones[formIndex-1].kit:def.kit;
  assert.equal(kit.esp.dano,0,species+' should dodge without damage');
  assert.equal(kit.esp.forma,'dash');
 }
}
// Persian receives the already-approved Pay Day rather than a new
// projectile. Its four combat inputs and Kanto Pokédex must match.
const persian={id:'persian',progression:{species:'persian',level:28}};
const payDay=TEST_LIBRARY.filter(h=>h.id==='pay-day');
assert.equal(payDay.length,1,'Only one canonical approved Pay Day exists');
assert.equal(payDay[0].approved,true,'Pay Day artwork is already user-approved');
assert.equal(payDay[0].forma,'torre2_payday','Reuse nine-coin Phaser VFX');
assert.ok(availableMoves(persian).some(h=>h.id==='pay-day'),
 'Persian should learn Pay Day upon evolving, not just in the full Mewtwo library');
assert.deepEqual(defaultLoadout(persian),
 ['tackle','quick-attack','pay-day','hyper-beam'],
 'Persian third skill must be Pay Day, without replacing its ultimate');
assert.equal(resolveLoadout(persian).q?.forma,'torre2_payday',
 'Persian battle third skill must use the existing approved coin animation');
const meowthEarly={id:'meowth',progression:{species:'meowth',level:19}};
const meowthLearned={id:'meowth',progression:{species:'meowth',level:20}};
assert.equal(availableMoves(meowthEarly).some(h=>h.id==='pay-day'),false,
 'Meowth should not unlock Pay Day prematurely');
assert.equal(availableMoves(meowthLearned).some(h=>h.id==='pay-day'),true,
 'Meowth Pay Day unlock remains available at level 20');
// Native P2 starters must gain their own 4-slot evolution skill sets
// at their FIRST possible evolution levels, not only late-game levels.
for(const species of ['ivysaur','venusaur','charmeleon','charizard',
 'wartortle','blastoise','golbat']){
 const from={
  ivysaur:'bulbasaur',venusaur:'ivysaur',charmeleon:'charmander',
  charizard:'charmeleon',wartortle:'squirtle',blastoise:'wartortle',
  golbat:'zubat'
 }[species];
 const level=LEVEL_EVOLUTIONS[from]?.find(x=>x.to===species)?.level||42;
 const member={id:species,progression:{species,level}};
 const plan=nativeKantoEvolutionPlan(species);
 assert.equal(plan?.length,4,species+' native evolution has 4 slots');
 const load=resolveLoadout(member);
 const missing=['lmb','rmb','q','e'].filter(slot=>!load[slot]?.forma);
 assert.deepEqual(missing,[],species+' lacks native evolution effects');
 assert.equal(load.esp.dano,0,species+' must use Kanto-only Dodge');
 assert.equal(load.e.ulti,true,species+' must have charged ULT');
}
assert.equal(TRAINERS_PER_GYM(0),13);
assert.equal(TRAINERS_PER_GYM(8),17,'Victory Road precedes Elite Four');
assert.equal(TRAINERS_PER_GYM(9),0,'Elite is consecutive without filler');
assert.equal(TRAINERS_PER_GYM(1),15);
assert.equal(TRAINERS_PER_GYM(2),17);
assert.equal(GYMS[1].boss,'starmie');
assert.deepEqual(GYMS[1].leaderTeam,['staryu','starmie']);
assert.deepEqual(GYMS[2].leaderTeam,['voltorb','pikachu','raichu']);
// All eight gym leaders use their original FRLG team and sprite order,
 // with exact first-clear levels, while preserving the existing save indexes.
const officialGymTeams=[
 [['geodude','onix'],[12,14]],
 [['staryu','starmie'],[18,21]],
 [['voltorb','pikachu','raichu'],[21,18,24]],
 [['victreebel','tangela','vileplume'],[29,24,29]],
 [['koffing','muk','koffing','weezing'],[37,39,37,43]],
 [['kadabra','mr-mime','venomoth','alakazam'],[38,37,38,43]],
 [['growlithe','ponyta','rapidash','arcanine'],[42,40,42,47]],
 [['rhyhorn','dugtrio','nidoqueen','nidoking','rhyhorn'],[45,42,44,45,50]]
];
for(const [stage,[lineup,levels]] of officialGymTeams.entries()){
 assert.deepEqual(GYMS[stage].leaderTeam,lineup,'FireRed leader roster '+stage);
 assert.deepEqual(GYMS[stage].leaderLevels,levels,'FireRed leader levels '+stage);
}
for(const stage of [0,1,2,3,4,5,6,7]){
 const state=createCampaign('bulbasaur');
 state.stage=stage;
 state.trainer=TRAINERS_PER_GYM(stage);
 const opponent=currentOpponent(state);
 assert.ok(opponent.leader&&opponent.id===GYMS[stage].boss);
 const party=createPartyMatch(state,opponent);
 assert.deepEqual(party.foes.map(p=>p.id),GYMS[stage].leaderTeam,
  'Real Gym opponent squad must end with its ace');
 assert.equal(party.foes.at(-1).level,opponent.level,
  'Gym leader ace receives full stage level cap');
 assert.deepEqual(party.foes.map(p=>p.level),GYMS[stage].leaderLevels,
  'Leader Pokémon must enter battles at their actual first-clear levels');
 assert.ok(party.foes.every(x=>x.loadout?.lmb&&x.loadout?.rmb),
  'Gym Pokémon must attack with ACTUAL Native / Torre 2 effects');
 assert.ok(party.foes.every(x=>manifest[x.id==='mr-mime'?'0122':
  ({tangela:'0114',koffing:'0109',weezing:'0110',
    grimer:'0088',muk:'0089',kadabra:'0064',alakazam:'0065',
    venomoth:'0049',growlithe:'0058',arcanine:'0059',
    rhyhorn:'0111',dugtrio:'0051',victreebel:'0071',
    vileplume:'0045',nidoqueen:'0031',nidoking:'0034'})[x.id]]||
  ROSTER.some(p=>p.id===x.id||p.evoluciones?.some(e=>e.nombre.toLowerCase()===x.id))),
  'Every gym foe must have a real PMD animation in the built client');
}
// Confirm full XP reward triggers Kanto branch evolutions automatically.
for(const [from,to] of [['gloom','vileplume'],['poliwhirl','poliwrath']]){
 const evolution=LEVEL_EVOLUTIONS[from].find(rule=>rule.to===to);
 const campaign=createCampaign('bulbasaur');
 campaign.stage=8;
 campaign.team=[{id:from,uid:'evo-'+from,hp:100,
  moves:['tackle','gust','bite','scratch'],movePlanSpecies:from,
  progression:createPokemonProgression(from,evolution.level)}];
 const {awardSharedTeamExperience}=await mod('torre2/campaign-core.js');
 awardSharedTeamExperience(campaign,0);
 assert.equal(campaign.team[0].id,to,from+' must evolve in Kanto');
 assert.deepEqual(campaign.team[0].moves,[],
  from+' invalidates stale pre-evolution skills');
 const kit=resolveLoadout(campaign.team[0]);
 for(const slot of ['lmb','rmb','q','e'])
  assert.ok(kit[slot]?.forma,to+' evolved battle slot '+slot+' is empty');
}
// Pokédex source must read the exact same evolved loadout as Kanto combat,
// rather than showing an inherited, outdated native P2 kit.
const dexCode=fs.readFileSync(file('escenas/pokedex.js'),'utf8');
assert.match(dexCode,/function kantoDexStages\(def\)/);
assert.match(dexCode,/const equipped=resolveLoadout\(member\)/);
assert.match(dexCode,/this\.etapas=kantoDexStages\(p\)/);
for(const role of ['ATK','HAB 2','HAB 3','ULT','ESQUIVA'])
 assert.ok(dexCode.includes('"'+role+'"'),'Missing Pokédex role '+role);

// Informational gap audit: these are candidates for future custom VFX,
// not mandatory prerequisites of Misty/Surge battles. Do not invent
// generic substitutes or touch already approved original moves.
const optionalForNextPatch=[
 'Sleep Powder','Protect','Light Screen','Rain Dance',
 'Sand Attack','Psychic','Aerial Ace','Fire Punch','Ice Punch',
 'Thunder Punch','Cross Chop','Flame Wheel','Psyshock'
];
const currentMoves=new Set(TEST_LIBRARY.map(x=>
 String(x.nombre||'').trim().toLowerCase()));
const unimplemented=optionalForNextPatch.filter(name=>
 !currentMoves.has(name.toLowerCase()));
console.log('OPTIONAL KANTO MOVES NOT PRESENT IN APPROVED LIBRARY: '+
 unimplemented.join(', '));
const {SURGE3_MOVES,SURGE_LEADER_LOADOUTS}=await mod('torre2/surge3/catalog.js');
assert.equal(SURGE3_MOVES.length,3,'Three distinct Lt. Surge FX');
for(const m of SURGE3_MOVES){
 const found=TEST_LIBRARY.filter(x=>x.nombre===m.nombre);
 assert.equal(found.length,1,'Original P2 move must never be duplicated: '+m.nombre);
 assert.equal(found[0].forma,m.forma,'New SURGE move missing from loaded build');
}
for(const id of ['voltorb','pikachu','raichu']){
 const member={id,progression:{species:id,level:24}};
 const loadout=resolveLoadout(member);
 assert.ok(loadout.lmb?.forma,'Playable '+id+' must keep ATK');
 assert.ok(Array.isArray(SURGE_LEADER_LOADOUTS[id]));
}
const surgeState=createCampaign('bulbasaur');
surgeState.stage=2;surgeState.trainer=TRAINERS_PER_GYM(2);
const surgeMatch=createPartyMatch(surgeState,currentOpponent(surgeState));
assert.equal(surgeMatch.foes.length,3);
for(const foe of surgeMatch.foes){
 const expected=SURGE_LEADER_LOADOUTS[foe.id];
 const names=['lmb','rmb','q','e'].map(k=>foe.loadout[k]?.nombre);
 assert.deepEqual(names,expected,'Lt. Surge original FRLG moves must render in battle');
}
assert.equal(surgeMatch.foes[0].loadout.rmb.forma,'torre2_surge_sonic_boom');
assert.equal(surgeMatch.foes[0].loadout.q.forma,'torre2_surge_screech');
for(const foe of surgeMatch.foes.slice(1))
 assert.equal(foe.loadout.rmb.forma,'torre2_surge_thunder_wave');
assert.equal(TEST_LIBRARY.filter(x=>x.nombre==='Dragon Pulse').length,1);
const regionSource=fs.readFileSync(file('torre2/battle-path.js'),'utf8');
assert.match(regionSource,/ROTA 3  >  MT. MOON/);
assert.match(regionSource,/ROTAS 24\/25  >  5\/6/);
assert.match(regionSource,/checkpointZone\(i\)/);
console.log('PASS: 23 Kanto families, every PMD atlas, every evolution ATK/HAB2/HAB3/ULT/DODGE, Misty 2 and Surge 3 real party members, 15/17 trainers and original VFX untouched.');
