import {rematchState,rechargeRematches,reserveRematch,consumeRematchResult,validRematchResult} from './rematch-policy.js';
export {validRematchResult};
/* Pokémon Torre 2 — campanha solo Kanto, sem conta, servidor ou multiplayer.
 * Reutiliza o combate original Phaser capturado com autorização de pokearena2d.com.
 * Dados em localStorage. Evolução EXCLUSIVAMENTE por nível, APÓS a batalha.
 */
import {createPokemonProgression,totalExperienceForLevel,awardBattleExperience,resolveEvolutionAfterBattle,levelEvolutionChoices} from './progression.js';
import {ROSTER} from '../datos.js';
import {KANTO_ROUTES,routeNode,routeEncounterTable,MART_ITEMS,GYM_TM_REWARDS,martItemUnlocked} from './route-data.js';
import {captureChance,rollCapture} from './capture-mechanics.js';
import {equipMove} from './move-pool.js';
import {currentLevelCap,trainerLevelFor,wildLevelFor,xpRewardFor,awardCampaignExperience,enforceCampaignCap} from './kanto-levels.js';
import {KANTO_LEVEL_EVOLUTIONS} from './frlg-learnsets.js';

// Persistent normal Kanto campaign. No temporary preview slots or save switches.
export const SAVE_KEY='pokemon-torre-2-kanto-campaign-v1';
export const SAVE_BACKUP_KEY=SAVE_KEY+'-backup';
export const GYMS=Object.freeze([
 {city:'Pewter',leader:'Brock',badge:'Rocha',arena:'crater',type:'ROCK',
  enemy:['pidgey','rattata','caterpie','weedle','pikachu','spearow','mankey','nidoran-f','nidoran-m','geodude'],
  boss:'onix',leaderTeam:['geodude','onix'],leaderLevels:[12,14]},
 {city:'Cerulean',leader:'Misty',badge:'Cascata',arena:'estadio',type:'WATER',
  enemy:['zubat','geodude','paras','clefairy','sandshrew','ekans','poliwag',
   'psyduck','staryu','magikarp'],boss:'starmie',
  leaderTeam:['staryu','starmie'],leaderLevels:[18,21]},
 {city:'Vermilion',leader:'Lt. Surge',badge:'Trovao',arena:'neon',type:'ELECTRIC',
  enemy:['oddish','bellsprout','meowth','diglett','magnemite','voltorb',
   'pikachu','raichu','machop'],boss:'raichu',
  leaderTeam:['voltorb','pikachu','raichu'],leaderLevels:[21,18,24]},
 // Official FireRed/LeafGreen first-clear lineups. The last species is the
 // ace. Every member has a real PMD atlas and four working battle slots.
 {city:'Celadon',leader:'Erika',badge:'Arco-Iris',arena:'ruinas',type:'GRASS',
  enemy:['oddish','gloom','bellsprout','weepinbell','tangela'],
  boss:'vileplume',leaderTeam:['victreebel','tangela','vileplume'],leaderLevels:[29,24,29]},
 {city:'Fuchsia',leader:'Koga',badge:'Alma',arena:'ruinas',type:'POISON',
  enemy:['venonat','venomoth','ekans','arbok','grimer','koffing'],
  boss:'weezing',leaderTeam:['koffing','muk','koffing','weezing'],
  leaderLevels:[37,39,37,43]},
 {city:'Saffron',leader:'Sabrina',badge:'Pantano',arena:'neon',type:'PSYCHIC',
  enemy:['abra','kadabra','mr-mime','venomoth','exeggcute'],
  boss:'alakazam',leaderTeam:['kadabra','mr-mime','venomoth','alakazam'],
  leaderLevels:[38,37,38,43]},
 {city:'Cinnabar',leader:'Blaine',badge:'Vulcao',arena:'crater',type:'FIRE',
  enemy:['growlithe','ponyta','rapidash','charmander'],
  boss:'arcanine',leaderTeam:['growlithe','ponyta','rapidash','arcanine'],
  leaderLevels:[42,40,42,47]},
 {city:'Viridian',leader:'Giovanni',badge:'Terra',arena:'crater',type:'GROUND',
  enemy:['rhyhorn','diglett','dugtrio','nidorino','geodude'],
  boss:'rhyhorn',leaderTeam:['rhyhorn','dugtrio','nidoqueen','nidoking','rhyhorn'],
  leaderLevels:[45,42,44,45,50]}
]);
// FireRed/LeafGreen first-clear Indigo League: authentic lineups and levels.
// Existing stage indexes 8–12 remain unchanged for old saves.
export const ELITE=Object.freeze([
 {city:'Indigo Plateau',leader:'Lorelei',badge:'Elite 1',arena:'estadio',type:'ICE',
  enemy:['seel','dewgong','shellder','cloyster','lapras','jynx','slowpoke'],
  boss:'lapras',leaderTeam:['dewgong','cloyster','slowbro','jynx','lapras'],
  leaderLevels:[52,51,52,54,54]},
 {city:'Indigo Plateau',leader:'Bruno',badge:'Elite 2',arena:'crater',type:'FIGHTING',
  enemy:['onix','machop','machoke','hitmonlee','hitmonchan'],
  boss:'machamp',leaderTeam:['onix','hitmonchan','hitmonlee','onix','machamp'],
  leaderLevels:[51,53,53,54,56]},
 {city:'Indigo Plateau',leader:'Agatha',badge:'Elite 3',arena:'ruinas',type:'GHOST',
  enemy:['gastly','haunter','gengar','golbat','arbok','cubone'],
  boss:'gengar',leaderTeam:['gengar','golbat','haunter','arbok','gengar'],
  leaderLevels:[54,54,53,56,58]},
 {city:'Indigo Plateau',leader:'Lance',badge:'Elite 4',arena:'estadio',type:'DRAGON',
  enemy:['dratini','dragonair','gyarados','aerodactyl'],
  boss:'dragonite',leaderTeam:['gyarados','dragonair','dragonair','aerodactyl','dragonite'],
  leaderLevels:[56,54,54,58,60]},
 {city:'Indigo Plateau',leader:'Campeão',badge:'Campeão',arena:'estadio',type:'MIXED',
  enemy:['pidgeot','rhydon','alakazam','exeggutor','gyarados','arcanine'],
  boss:'charizard',leaderTeam:['pidgeot','alakazam','rhydon','exeggutor','gyarados','charizard'],
  leaderLevels:[59,57,59,59,61,63]}
]);
// Rival team varies with the player's ORIGINAL starter, not party order,
// evolutions or Pokémon swaps. FireRed Lv59/57/59/59/61/63.
export function rivalChampionTeam(starter){
 if(starter==='charmander')
  return ['pidgeot','alakazam','rhydon','arcanine','exeggutor','blastoise'];
 if(starter==='squirtle')
  return ['pidgeot','alakazam','rhydon','gyarados','arcanine','venusaur'];
 return ['pidgeot','alakazam','rhydon','exeggutor','gyarados','charizard'];
}
export function campaignStarter(s){
 if(STARTERS.includes(s?.starter))return s.starter;
 const known=[...(s?.dexCaught||[]),...(s?.dexSeen||[])];
 const base={bulbasaur:'bulbasaur',ivysaur:'bulbasaur',venusaur:'bulbasaur',
  charmander:'charmander',charmeleon:'charmander',charizard:'charmander',
  squirtle:'squirtle',wartortle:'squirtle',blastoise:'squirtle'};
 for(const id of known)if(base[id])return base[id];
 for(const m of s?.team||[])if(base[m.id])return base[m.id];
 return 'bulbasaur';
}
export const STAGES=Object.freeze([...GYMS,...ELITE]);
export const STARTERS=Object.freeze(['bulbasaur','charmander','squirtle']);
export const KANTO_DEX=Object.freeze('Bulbasaur,Ivysaur,Venusaur,Charmander,Charmeleon,Charizard,Squirtle,Wartortle,Blastoise,Caterpie,Metapod,Butterfree,Weedle,Kakuna,Beedrill,Pidgey,Pidgeotto,Pidgeot,Rattata,Raticate,Spearow,Fearow,Ekans,Arbok,Pikachu,Raichu,Sandshrew,Sandslash,Nidoran♀,Nidorina,Nidoqueen,Nidoran♂,Nidorino,Nidoking,Clefairy,Clefable,Vulpix,Ninetales,Jigglypuff,Wigglytuff,Zubat,Golbat,Oddish,Gloom,Vileplume,Paras,Parasect,Venonat,Venomoth,Diglett,Dugtrio,Meowth,Persian,Psyduck,Golduck,Mankey,Primeape,Growlithe,Arcanine,Poliwag,Poliwhirl,Poliwrath,Abra,Kadabra,Alakazam,Machop,Machoke,Machamp,Bellsprout,Weepinbell,Victreebel,Tentacool,Tentacruel,Geodude,Graveler,Golem,Ponyta,Rapidash,Slowpoke,Slowbro,Magnemite,Magneton,Farfetchd,Doduo,Dodrio,Seel,Dewgong,Grimer,Muk,Shellder,Cloyster,Gastly,Haunter,Gengar,Onix,Drowzee,Hypno,Krabby,Kingler,Voltorb,Electrode,Exeggcute,Exeggutor,Cubone,Marowak,Hitmonlee,Hitmonchan,Lickitung,Koffing,Weezing,Rhyhorn,Rhydon,Chansey,Tangela,Kangaskhan,Horsea,Seadra,Goldeen,Seaking,Staryu,Starmie,MrMime,Scyther,Jynx,Electabuzz,Magmar,Pinsir,Tauros,Magikarp,Gyarados,Lapras,Ditto,Eevee,Vaporeon,Jolteon,Flareon,Porygon,Omanyte,Omastar,Kabuto,Kabutops,Aerodactyl,Snorlax,Articuno,Zapdos,Moltres,Dratini,Dragonair,Dragonite,Mewtwo,Mew'.split(','));
// Stage indexes stay stable for existing saves. 13 early route trainers,
// gradually more towards Giovanni, a real Victory Road, then direct Elite
// Four and Champion battles rather than dozens of identical boss rematches.
export const TRAINERS_PER_GYM=stage=>stage<8?13+stage*2:stage===8?17:0;

// NPC species follow the same Kanto level thresholds as player evolutions.
// Never choose an arbitrary branch (Eevee), and never evolve a fighter mid-battle.
const trainerEvolutionSteps=new Map();
for(const [to,[from,atLevel]] of Object.entries(KANTO_LEVEL_EVOLUTIONS)){
 const options=trainerEvolutionSteps.get(from)||[];
 options.push({to,atLevel});
 trainerEvolutionSteps.set(from,options);
}
export function trainerSpeciesForLevel(species,level){
 let current=String(species||'').toLowerCase();
 if(!Number.isInteger(level)||level<1)return current;
 for(let i=0;i<4;i++){
  const options=trainerEvolutionSteps.get(current)||[];
  if(options.length!==1||level<options[0].atLevel)break;
  current=options[0].to;
 }
 return current;
}


function newMember(species,level=5){
 const exp=createPokemonProgression(species,level);
 return {id:species,progression:exp,uid:species+'-'+Math.random().toString(36).slice(2,9),hp:100};
}
export function createCampaign(starter){
 if(!STARTERS.includes(starter))throw new Error('Choose an original Kanto starter');
 return {version:1,starter,stage:0,trainer:0,team:[newMember(starter),newMember('mewtwo',50)],box:[],dexSeen:[starter],dexCaught:[starter],
  active:0,wins:0,losses:0,capturesInStage:0,pendingCapture:null,
  money:1400,inventory:{pokeball:5,greatball:0,ultraball:0,potion:3,superpotion:0,tms:[]},
  wildEncountersStage:0,pendingWild:null,
  badges:[],leagueHonors:[],gymTMClaims:[],lastMessage:'Campanha iniciada. Treine e enfrente os 13 treinadores antes de Brock.',champion:false};
}
// Production-only new game. The original createCampaign factory deliberately
// retains its historical Mewtwo fixture for test/replay compatibility; do not
// let that level-50 debug fighter enter a NEW player's Kanto journey.
// Legacy saves are never rewritten or stripped of Pokémon by this function.
export function createPlayerCampaign(starter){
 const state=createCampaign(starter);
 state.team=state.team.filter(member=>member.id!=='mewtwo');
 if(state.team.length!==1||state.team[0].id!==starter)
  throw Error('Fresh Kanto campaign must contain exactly its chosen starter');
 return state;
}
// A string can be valid JSON while no longer being a usable campaign.
// Do not overwrite the last good backup with such a structurally broken save.
function usableCampaignSnapshot(s){
 return s?.version===1&&Array.isArray(s.team)&&s.team.length>0&&
  s.team.every(m=>m&&typeof m==='object'&&typeof m.id==='string'&&m.id.length>0)&&
  (!('box'in s)||Array.isArray(s.box)&&s.box.every(m=>
   m&&typeof m==='object'&&typeof m.id==='string'&&m.id.length>0))&&
  Number.isInteger(s.stage)&&s.stage>=0&&s.stage<=STAGES.length&&
  Number.isInteger(s.trainer)&&s.trainer>=0;
}
// Economic corruption is distinct from legacy optional-field migration.
// A broken primary must never replace a clean backup or silently reset
// earned money/items when a clean checkpoint is still available.
function economySnapshotSafe(s){
 const inv=s?.inventory;
 return Number.isFinite(s?.money)&&s.money>=0&&
  inv&&typeof inv==='object'&&!Array.isArray(inv)&&Array.isArray(inv.tms)&&
  ['pokeball','greatball','ultraball','potion','superpotion']
   .every(key=>Number.isInteger(inv[key])&&inv[key]>=0)&&
  MART_ITEMS.filter(item=>item.kind==='status').every(item=>
   inv[item.id]===undefined||(Number.isInteger(inv[item.id])&&inv[item.id]>=0));
}
// Duplicate non-empty identities across the team and PC are structural save
// corruption. Older saves without UIDs remain readable and are not discarded.
function hasRepeatedMemberUid(s){
 const seen=new Set();
 for(const member of [...s.team,...(Array.isArray(s.box)?s.box:[])]){
  const uid=member?.uid;
  if(typeof uid!=='string'||!uid)continue;
  if(seen.has(uid))return true;
  seen.add(uid);
 }
 return false;
}
// Preserve every team/PC member in its original slot. When no clean
// checkpoint exists, retain the first UID and give later collisions stable,
// collision-free identities; never remove or create a Pokemon entry.
function repairRepeatedMemberUids(s){
 const members=[...s.team,...(Array.isArray(s.box)?s.box:[])];
 const reserved=new Set(members.map(m=>m?.uid).filter(uid=>typeof uid==='string'&&uid));
 const seen=new Set();
 let repaired=false;
 for(const member of members){
  const uid=member?.uid;
  if(typeof uid!=='string'||!uid)continue; // Legacy saves stay readable.
  if(!seen.has(uid)){seen.add(uid);continue;}
  let suffix=1,unique;
  do{unique=uid+'-recovered-'+suffix++;}while(reserved.has(unique));
  member.uid=unique;
  reserved.add(unique);
  seen.add(unique);
  repaired=true;
 }
 return repaired;
}
function parseUsableCampaign(raw){
 if(!raw)return null;
 try{
  const data=JSON.parse(raw);
  return usableCampaignSnapshot(data)?data:null;
 }catch{return null}
}
export function readCampaign(storage=localStorage){
 try{
  // Browsers and storage adapters can deny access to one key while the
  // other remains readable. A failed backup read must not hide a valid
  // primary save (nor should a failed primary read hide a valid backup).
  let raw=null,backup=null;
  try{raw=storage.getItem(SAVE_KEY)}catch{/* primary key inaccessible */}
  try{backup=storage.getItem(SAVE_BACKUP_KEY)}catch{/* backup key inaccessible */}
  const primary=parseUsableCampaign(raw);
  const fallback=parseUsableCampaign(backup);
  // Prefer a clean backup. Otherwise preserve every stored member and
  // repair only colliding identities, archiving original bytes before save.
  // A backup with broken money/inventory is not a safe replacement for a
  // duplicate-UID primary with intact economy. Repair the UIDs in place
  // instead of silently resetting earned funds or items from that backup.
  const recoverUid=!!(primary&&fallback&&hasRepeatedMemberUid(primary)&&
   !hasRepeatedMemberUid(fallback)&&economySnapshotSafe(fallback));
  const recoverEconomy=!!(primary&&fallback&&!economySnapshotSafe(primary)&&economySnapshotSafe(fallback));
  const recoverCheckpoint=recoverUid||recoverEconomy;
  const s=recoverCheckpoint?fallback:(primary||fallback);
  if(!s)return null;
  const repairedUid=hasRepeatedMemberUid(s)&&repairRepeatedMemberUids(s);
  // Recover from truncation, JSON-valid corruption and duplicated identities.
  if((!primary||recoverCheckpoint)&&backup){
   // A full/read-only storage must not turn a valid backup into a blank game.
   // Keep the original backup intact so the next read can recover again.
   try{storage.setItem(SAVE_KEY,backup)}catch{/* read-only or quota-exceeded storage */}
  }
  // Additive v1 migration. Do not reset saves or lose stored Pokémon.
  let migrated=!!repairedUid;
  // Old saves stored Elite victories alongside gym badges. Preserve them in
  // a separate field so the badge case contains only the eight Kanto awards.
  const legacyHonors=new Set(ELITE.map(stage=>stage.badge));
  const oldBadges=Array.isArray(s.badges)?s.badges:[];
  const badges=[...new Set(oldBadges.filter(b=>!legacyHonors.has(b)))];
  const leagueHonors=[...new Set([...(Array.isArray(s.leagueHonors)?s.leagueHonors:[]),...oldBadges.filter(b=>legacyHonors.has(b))])];
  if(JSON.stringify(s.badges)!==JSON.stringify(badges)||JSON.stringify(s.leagueHonors)!==JSON.stringify(leagueHonors)){
   s.badges=badges;s.leagueHonors=leagueHonors;migrated=true;
  }
  if(!STARTERS.includes(s.starter)){s.starter=campaignStarter(s);migrated=true;}
  if(!Array.isArray(s.box)){s.box=[];migrated=true}
  if(s.team.length>6){s.box.unshift(...s.team.splice(6));migrated=true}
  if(!Number.isInteger(s.active)||s.active<0||s.active>=s.team.length){
   s.active=0;migrated=true;
  }
  if(!Number.isInteger(s.capturesInStage)||s.capturesInStage<0){
   s.capturesInStage=0;migrated=true;
  }
  if(!Array.isArray(s.dexCaught)){
   s.dexCaught=[...new Set([...s.team,...s.box].map(p=>p.id).filter(id=>id!=='mewtwo'))];
   migrated=true;
  }
  if(!Array.isArray(s.dexSeen)){s.dexSeen=[...s.dexCaught];migrated=true}
  if(!Number.isFinite(s.money)||s.money<0){s.money=1400;migrated=true}
  if(!s.inventory||typeof s.inventory!=='object'){
   s.inventory={pokeball:5,greatball:0,ultraball:0,potion:3,superpotion:0,tms:[]};migrated=true;
  }
  for(const [item,n] of Object.entries({pokeball:5,greatball:0,ultraball:0,potion:3,superpotion:0})){
   if(!Number.isInteger(s.inventory[item])||s.inventory[item]<0){s.inventory[item]=n;migrated=true}
  }
  for(const item of MART_ITEMS.filter(i=>i.kind==='status')){
   if(!Number.isInteger(s.inventory[item.id])||s.inventory[item.id]<0){s.inventory[item.id]=0;migrated=true;}
  }
  if(!Array.isArray(s.inventory.tms)){s.inventory.tms=[];migrated=true}
  if(!Array.isArray(s.gymTMClaims)){
   // Brock was already awarded by older builds, including consumed TMs.
   s.gymTMClaims=s.stage>0?['tm-rock-tomb']:[];migrated=true;
  }
  // Add missing rewards to existing completed gyms once; never recreate a
  // consumed reward or infer a victory from a malformed badge alone.
  for(let i=0;i<Math.min(s.stage,GYMS.length);i++){
   if(s.badges.includes(GYMS[i].badge)&&grantGymTM(s,i,{migration:true}).claimed)migrated=true;
  }
  if(!Number.isInteger(s.wildEncountersStage)||s.wildEncountersStage<0){s.wildEncountersStage=0;migrated=true}
  if(s.pendingCapture){s.pendingCapture=null;migrated=true}
  if(!('pendingWild'in s)){s.pendingWild=null;migrated=true}
  if(s.pendingWild&&(!Number.isFinite(s.pendingWild.hpPercent)||s.pendingWild.hpPercent<1)){
   s.pendingWild.hpPercent=100;migrated=true;
  }
  // Never silently add a level-50 tester to a genuine player's save.
  // Previous saves containing Mewtwo remain unchanged: the migration only
  // fills missing metadata and never deletes existing Pokémon or PC data.
  // Invalid stale wild markers from a previous stage must never be replayed.
  if(s.pendingWild&&s.pendingWild.stage!==s.stage){s.pendingWild=null;migrated=true}
  for(const member of [...s.team,...s.box])if(enforceCampaignCap(member,s.stage))migrated=true;
  if(migrated){
   // Migrations are additive. If storage cannot be written, the recovered
   // campaign remains playable in memory; no Pokémon/progress is discarded.
   try{saveCampaign(s,storage)}catch{/* migration can be retried on next load */}
  }
  return s;
 }catch{return null}
}
export function saveCampaign(state,storage=localStorage){
 // Reject broken snapshots BEFORE touching either storage key. A valid
 // checkpoint must never be replaced by an empty party, invalid stage or
 // duplicate member identity (including collisions between party and PC).
 // Legacy members without UIDs remain supported by the read migration.
 if(!usableCampaignSnapshot(state)||hasRepeatedMemberUid(state)||!economySnapshotSafe(state))
  throw new TypeError('Refusing to persist an invalid or duplicate-UID campaign');
 const serialized=JSON.stringify(state);
 const previous=storage.getItem(SAVE_KEY);
 let rotatedBackup=false,originalBackup=null;
 if(previous&&previous!==serialized){
  const candidate=parseUsableCampaign(previous);
  // Rotate clean checkpoints normally. If this is the only surviving
  // duplicate-UID primary, archive its exact bytes before replacement.
  // A denied archive write must abort the primary write, not lose evidence.
  if(candidate){
   originalBackup=storage.getItem(SAVE_BACKUP_KEY);
   if((!hasRepeatedMemberUid(candidate)&&economySnapshotSafe(candidate))||
      !originalBackup){
    storage.setItem(SAVE_BACKUP_KEY,previous);
    rotatedBackup=true;
   }
  }
 }
 try{
  storage.setItem(SAVE_KEY,serialized);
 }catch(error){
  // localStorage updates one key atomically, but not BOTH keys as a
  // transaction. If the primary write was denied AFTER backup rotation,
  // restore the exact prior backup (or remove the newly created backup).
  // Even when rollback is denied, never mask the original primary failure:
  // the previously committed primary checkpoint stays recoverable.
  if(rotatedBackup){
   try{
    if(originalBackup===null)storage.removeItem(SAVE_BACKUP_KEY);
    else storage.setItem(SAVE_BACKUP_KEY,originalBackup);
   }catch{/* Storage may also deny rollback; preserve primary and error */}
  }
  throw error;
 }
 return state;
}
// Reset must remove the backup FIRST. If backup removal is denied, keep the
// primary untouched; otherwise a later read could resurrect an old checkpoint.
// If the PRIMARY deletion is denied after the backup was cleared, restore
// the exact previous backup bytes so a failed reset cannot silently lose a
// recovery point. localStorage is not a multi-key transaction; if the browser
// also forbids rollback, preserve the primary and propagate the original error.
export function resetCampaign(storage=localStorage){
 // Native localStorage has getItem; injected legacy/test storage adapters
 // may only expose removeItem. Keep the previous reset contract for those
 // adapters while recovering backup bytes whenever reading is supported.
 const previousBackup=typeof storage.getItem==='function'?
  storage.getItem(SAVE_BACKUP_KEY):null;
 storage.removeItem(SAVE_BACKUP_KEY);
 try{storage.removeItem(SAVE_KEY);}
 catch(error){
  if(previousBackup!==null){
   try{storage.setItem(SAVE_BACKUP_KEY,previousBackup);}
   catch{/* Primary remains; never mask the original reset failure */}
  }
  throw error;
 }
}
// Pokédex data describes encounters/captures, not which sprites are playable.
export function recordSeen(s,id){
 // Keep distinct male/female Nidoran IDs while displaying native Dex symbols.
 const dexId=id==='nidoran-f'?'nidoran♀':id==='nidoran-m'?'nidoran♂':
  id==='mr-mime'?'mrmime':String(id||'').toLowerCase();
 if(!id||!KANTO_DEX.some(name=>name.toLowerCase()===dexId))return false;
 s.dexSeen??=[];if(s.dexSeen.includes(id))return false;
 s.dexSeen.push(id);return true;
}
export function recordCaught(s,id){
 const added=recordSeen(s,id);s.dexCaught??=[];
 if(!s.dexCaught.includes(id)){s.dexCaught.push(id);return true}
 return added;
}
// PC transfers must not change the live party until the new checkpoint is
// persisted. A denied localStorage write (quota/private mode) otherwise leaves
// the UI with a party/PC different from the last recoverable save.
function persistPartyTransfer(s,changes){
 const next={...s,...changes};
 saveCampaign(next);
 Object.assign(s,changes);
 return true;
}
export function storePokemon(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length||s.team.length<=1)return false;
 const team=s.team.slice(),box=Array.isArray(s.box)?s.box.slice():[];
 const [member]=team.splice(index,1);
 box.push(member);
 let active=s.active;
 if(active===index)active=0;
 else if(index<active)active--;
 return persistPartyTransfer(s,{team,box,active,
  lastMessage:member.id+' enviado para o PC.'});
}
export function withdrawPokemon(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.box.length||s.team.length>=6)return false;
 const team=s.team.slice(),box=s.box.slice();
 const [member]=box.splice(index,1);
 team.push(member);
 return persistPartyTransfer(s,{team,box,
  lastMessage:member.id+' entrou na equipe.'});
}
export function swapPokemon(s,teamIndex,boxIndex){
 if(!Number.isInteger(teamIndex)||teamIndex<0||teamIndex>=s.team.length||
    !Number.isInteger(boxIndex)||boxIndex<0||boxIndex>=s.box.length)return false;
 const team=s.team.slice(),box=s.box.slice();
 const old=team[teamIndex];
 team[teamIndex]=box[boxIndex];box[boxIndex]=old;
 return persistPartyTransfer(s,{team,box,
  lastMessage:team[teamIndex].id+' trocado com '+old.id+'.'});
}
export function currentOpponent(s){
 if(s.champion||s.stage>=STAGES.length)return null;
 const gym=STAGES[s.stage];
 const leader=s.trainer>=TRAINERS_PER_GYM(s.stage);
 const list=gym.enemy;
 const node=routeNode(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage));
 const role=leader?'leader':node.type;
 const originalStarter=campaignStarter(s);
 const rivalId=originalStarter==='charmander'?'squirtle':
  originalStarter==='squirtle'?'bulbasaur':'charmander';
 const championId=rivalChampionTeam(originalStarter).at(-1);
 const level=trainerLevelFor(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage),leader);
 const baseSpecies=leader?(s.stage===STAGES.length-1?championId:gym.boss):role==='rival'?rivalId:
  role==='rocket'?(['zubat','machop','ekans'].includes(list[s.trainer%list.length])?
   list[s.trainer%list.length]:'zubat'):list[s.trainer%list.length];
 // Fixed gym/League rosters remain untouched; rival and regular NPCs evolve
 // as their levels rise, with the actual evolved sprite and attacks.
 const species=leader?baseSpecies:trainerSpeciesForLevel(baseSpecies,level);
 return {id:species,leader,kind:role,
  name:leader?gym.leader:role==='rival'?'Rival':role==='rocket'?'Equipe Rocket':'Treinador '+(s.trainer+1),
  level,arena:gym.arena,city:gym.city};
}
// Route selection must never create a full-HP battle actor from a fainted save.
// Resume with an already-conscious reserve, or let the player use the Center.
export function ensureConsciousActive(s){
 if(s?.team?.[s.active]?.hp>0)return true;
 const reserve=s?.team?.findIndex(m=>m?.hp>0)??-1;
 if(reserve<0)return false;
 // Persist first: failed storage must not select a different live battler.
 saveCampaign({...s,active:reserve});
 s.active=reserve;
 return true;
}
export function startBattle(s){
 if(!ensureConsciousActive(s))
  throw new Error('Equipe desmaiada: visite o Centro Pokémon antes de batalhar.');
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('Kanto campaign completed');
 // Scale the ORIGINAL Poké Arena tactical bot as Kanto progresses:
 // its native difficulty adjusts reactions, evasions and attack judgment.
 // The opponent descriptor names the ACE, but real gym/League battles
 // always send their first roster member initially. Never mark an unseen
 // ace in the Pokédex before the player has actually faced that species.
 const firstSeen=opponent.leader?
  STAGES[s.stage]?.leaderTeam?.[0]||opponent.id:opponent.id;
 // The first seen species belongs to the battle checkpoint. A denied
 // write must not register a Pokémon in RAM that the save never recorded.
 const nextDexSeen=[...(s.dexSeen||[])];
 const next={...s,dexSeen:nextDexSeen};
 recordSeen(next,firstSeen);
 saveCampaign(next);
 s.dexSeen=nextDexSeen;
 const tier=opponent.leader?
  (s.stage>=8?'maestro':s.stage>=4?'dificil':'normal'):
  (s.stage>=8?'maestro':s.stage>=3?'normal':'facil');
 return {p1:s.team[s.active].id,p2:opponent.id,modo:'cpu',nivel:tier,
  arena:opponent.arena,mandos:['kbm','cpu'],torre2:{stage:s.stage,trainer:s.trainer,kind:'trainer',
   playerLevel:s.team[s.active].progression?.level??5,
   enemyLevel:opponent.level,hardCap:currentLevelCap(s.stage)}};
}
// Kanto-only whole-party Exp Share. Award FULL reward to every owned
// party member (never split one reward six ways), with level caps enforced.
// The special level-50 Mewtwo is a fixed tester and deliberately gains no EXP.
// Evolution remains AFTER the battle; no approved combat sprite is modified.
export function awardSharedTeamExperience(state,reward,{kind='trainer'}={}){
 const gains=[],evolutions=[];
 for(let index=0;index<state.team.length;index++){
  const member=state.team[index],progress=member?.progression;
  if(!progress)continue;
  const growth=awardCampaignExperience(progress,reward,state.stage,{
   tester:member.id==='mewtwo'});
  // FireRed route families with branching later-generation evolutions:
  // complete the Kanto lineage during the campaign without stalling on a
  // choice dialog which this one-click map does not implement.
  const evolved=resolveEvolutionAfterBattle(progress,'victory',({species,choices})=>{
   const kanto={gloom:'vileplume',poliwhirl:'poliwrath',slowpoke:'slowbro'};
   return choices.includes(kanto[species])?kanto[species]:null;
  });
  const before=member.id;
  member.id=progress.species;
  if(before!==member.id){
   // A newly evolved form MUST recalculate LMB/RMB/Q/E from its own kit.
   // Preserve collected TMs, party position, HP, XP and nickname; only the
   // stale four-slot selection from the pre-evolution form is invalidated.
   member.moves=[];
   delete member.movePlanSpecies;
  }
  gains.push({index,uid:member.uid,id:member.id,before,reward:growth.experienceGained,
   fromLevel:growth.fromLevel,toLevel:growth.toLevel,
   levelsGained:growth.levelsGained,tester:!!growth.tester,kind});
  for(const event of evolved.evolutions||[]){
   // A Pokémon obtained through evolution counts as caught in the Gen III
   // Pokédex, including intermediate forms gained in one post-battle award.
   // Use the existing idempotent recorder (also registers the form as seen).
   recordCaught(state,event.to);
   evolutions.push({index,uid:member.uid,...event});
  }
 }
 return {gains,evolutions,totalRecipients:gains.filter(x=>!x.tester).length};
}
// Eevee's three Kanto options have the SAME level-only requirement.
// After its XP is awarded, the choice remains pending in the normal save
// until the trainer picks one; no random branch, extra item or battle flag.
export const EEVEE_KANTO_CHOICES=Object.freeze(['vaporeon','jolteon','flareon']);
// Legacy v1 team/PC entries can lack a UID. Expose a stable, collision-free
// selector without mutating the live save; assign it only after a successful
// evolution checkpoint. Other team members and all modern UIDs stay intact.
function eeveeEntries(state){
 const team=Array.isArray(state?.team)?state.team:[];
 const box=Array.isArray(state?.box)?state.box:[];
 const reserved=new Set([...team,...box].map(m=>m?.uid)
  .filter(uid=>typeof uid==='string'&&uid.length>0));
 const entries=[];
 for(const [location,group] of [['team',team],['box',box]]){
  group.forEach((member,index)=>{
   const hasUid=typeof member?.uid==='string'&&member.uid.length>0;
   let uid=hasUid?member.uid:'legacy-eevee:'+location+':'+index;
   if(!hasUid){
    while(reserved.has(uid))uid+=':recovered';
    reserved.add(uid);
   }
   entries.push({member,uid,location,index});
  });
 }
 return entries;
}
export function pendingEeveeEvolution(state){
 for(const {member,uid} of eeveeEntries(state)){
  if(member?.id==='eevee'&&member.progression?.species==='eevee'&&
     levelEvolutionChoices(member.progression).some(id=>EEVEE_KANTO_CHOICES.includes(id)))
   return {uid,level:member.progression.level,choices:EEVEE_KANTO_CHOICES.slice()};
 }
 return null;
}
export function chooseEeveeEvolution(state,uid,choice){
 // Do not trust UI state or a manually edited save. Resolve only a named
 // Eevee that has REALLY met Lv30; do not mutate on invalid requests.
 if(typeof uid!=='string'||!EEVEE_KANTO_CHOICES.includes(choice))
  return {ok:false,reason:'Evolução inválida.'};
 const selected=eeveeEntries(state).find(entry=>entry.uid===uid);
 const member=selected?.member;
 if(!member||member.id!=='eevee'||member.progression?.species!=='eevee'||
   !levelEvolutionChoices(member.progression).includes(choice))
  return {ok:false,reason:'Eevee ainda não está pronto para evoluir.'};
 // Stage the entire evolution, Pokédex registration and message before
 // touching the live party/PC. A denied primary or backup write must leave
 // Eevee pending at Lv30 so the trainer can retry the same choice.
 const nextProgress=JSON.parse(JSON.stringify(member.progression));
 const result=resolveEvolutionAfterBattle(nextProgress,'finished',choice);
 if(!result.ok||result.evolutions.length!==1||result.evolutions[0].to!==choice)
  return {ok:false,reason:'Evolução não concluída.'};
 const evolved={...member,uid,id:nextProgress.species,progression:nextProgress,moves:[]};
 delete evolved.movePlanSpecies;
 const next={...state,
  team:state.team.map((p,i)=>selected.location==='team'&&i===selected.index?evolved:p),
  box:(state.box||[]).map((p,i)=>selected.location==='box'&&i===selected.index?evolved:p),
  dexSeen:[...(state.dexSeen||[])],dexCaught:[...(state.dexCaught||[])],
  lastMessage:'Eevee evoluiu para '+choice.toUpperCase()+' após atingir o nível 30!'};
 recordCaught(next,choice);
 saveCampaign(next);
 // Preserve the original Pokémon/progression references used by UI callers.
 // Only a committed save can assign a missing legacy UID, remove the
 // pending choice or refresh the old move kit.
 member.uid=uid;
 Object.assign(member.progression,nextProgress);
 member.id=evolved.id;
 member.moves=[];
 delete member.movePlanSpecies;
 state.dexSeen=next.dexSeen;
 state.dexCaught=next.dexCaught;
 state.lastMessage=next.lastMessage;
 return {ok:true,uid,from:'eevee',to:choice,level:member.progression.level};
}
export function grantGymTM(s,stage,{migration=false}={}){
 const id=GYM_TM_REWARDS[stage];
 if(!id)return {claimed:false};
 s.gymTMClaims??=[];
 if(s.gymTMClaims.includes(id))return {claimed:false};
 const item=MART_ITEMS.find(x=>x.id===id);
 if(!item)return {claimed:false};
 const already=migration&&(s.inventory.tms.includes(id)||[...s.team,...(s.box||[])].some(m=>m.tmMoves?.includes(item.move)));
 if(!already)s.inventory.tms.push(id);
 s.gymTMClaims.push(id);
 return {claimed:true,item,added:!already};
}
// Stage combat rewards off the live save. A failed primary/backup write must
// not grant XP, money, badges, TMs, a level/evolution or a rematch win in RAM.
function commitBattleOutcome(state,produce){
 const next=JSON.parse(JSON.stringify(state));
 const outcome=produce(next);
 if(outcome?.ok===false)return outcome;
 saveCampaign(next);
 Object.assign(state,next);
 return outcome;
}
export function resolveBattle(s,won,random=Math.random){
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('No battle pending');
 return commitBattleOutcome(s,next=>{
  if(!won){
   next.losses++;next.team[next.active].hp=Math.min(next.team[next.active].hp??100,35);
   next.pendingCapture=null;
   next.lastMessage='Derrota contra '+opponent.name+'. Cure a equipe e tente novamente.';
   return {won:false,message:next.lastMessage,evolutions:[]};
  }
  recordSeen(next,opponent.id);
  const member=next.team[next.active];
  next.lastRewardTM=null;
  const reward=xpRewardFor(next.stage,TRAINERS_PER_GYM(next.stage),opponent.leader?'leader':'trainer');
  const shared=awardSharedTeamExperience(next,reward,{kind:'trainer'});
  const growth=shared.gains.find(g=>g.index===next.active);
  member.hp=100;
  next.wins++;rechargeRematches(next);
  next.money=(next.money??1400)+(opponent.leader?1200:opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180+next.stage*60);
  next.pendingCapture=null;
  if(opponent.leader){
   const awards=next.stage<GYMS.length?next.badges:(next.leagueHonors??=[]);
   if(!awards.includes(STAGES[next.stage].badge))awards.push(STAGES[next.stage].badge);
   const tm=grantGymTM(next,next.stage);
   next.lastRewardTM=tm.added?tm.item.name:null;
   next.stage++;next.trainer=0;next.capturesInStage=0;next.wildEncountersStage=0;next.pendingWild=null;
   if(next.stage>=STAGES.length)next.champion=true;
  }else next.trainer++;
  next.lastMessage='Vitória! +'+reward+' EXP para toda a equipe ('+
   shared.totalRecipients+' Pokémon). '+(next.lastRewardTM?'Recebeu '+next.lastRewardTM+'. ':'')+(shared.evolutions.length?
   shared.evolutions.length+' evolução(ões) após a batalha!':'');
  return {won:true,message:next.lastMessage,reward,growth,sharedExp:shared.gains,
   evolutions:shared.evolutions,opponent};
 });
}
// Wild captures are requested from the live battle while the foe still has HP.
// Previously finished trainer fights keep their existing reward-capture flow.
export function attemptCapture(s,random=Math.random,ball='pokeball',options={}){
 const inWild=options?.duringBattle===true;
 if(!inWild)return {ok:false,reason:'Pokémon de treinadores não podem ser capturados.'};
 const candidate=inWild?s.pendingWild:s.pendingCapture;
 if(!candidate)return {ok:false,reason:'Nenhum Pokémon disponível para captura.'};
 if(!['pokeball','greatball','ultraball'].includes(ball)||!(s.inventory?.[ball]>0))
  return {ok:false,reason:'Sem Pokébolas! Visite o Mart.'};
 if(inWild&&candidate.stage!==s.stage)
  return {ok:false,reason:'Encontro selvagem expirado.'};
 // Enemy HP and status are read at the instant of the throw.
 const target={...candidate,wild:inWild,
  hpPercent:inWild?Math.max(1,Math.min(100,Number(options.hpPercent??candidate.hpPercent??100))):100,
  hp:options.hp,hpMax:options.hpMax,
  status:inWild?options.status:'none'};
 const outcome=rollCapture(target,ball,typeof random==='function'?random:Math.random);
 // Prepare the entire throw as one checkpoint. A denied localStorage write
 // must not consume the ball, award a Pokémon, clear the wild encounter or
 // change the Pokédex in the live session. The same encounter can be retried.
 const next={...s,inventory:{...s.inventory,[ball]:s.inventory[ball]-1}};
 let member=null;
 if(!outcome.caught){
  next.lastMessage=candidate.id+' escapou! '+outcome.shakes+' balanços.';
 }else{
  member=newMember(candidate.id,Math.min(currentLevelCap(s.stage),candidate.level));
  member.shiny=candidate.shiny===true;
  member.hp=target.hpPercent;
  member.status=options.persistentStatus?JSON.parse(JSON.stringify(options.persistentStatus)):null;
  next.pendingWild=null;
  next.team=[...s.team];next.box=[...s.box];
  next.dexSeen=[...(s.dexSeen||[])];next.dexCaught=[...(s.dexCaught||[])];
  recordCaught(next,candidate.id);
  const destination=next.team.length<6?'Equipe':'PC';
  if(destination==='Equipe')next.team.push(member);else next.box.push(member);
  next.lastMessage=candidate.id+' capturado! '+destination+
   ' · '+Math.round(outcome.chance*100)+'% de chance.';
 }
 saveCampaign(next);
 // Commit only after both snapshot validation and the primary write succeed.
 // Preserve existing inventory, team and PC array identities for live UI refs.
 s.inventory[ball]--;
 s.lastMessage=next.lastMessage;
 if(!outcome.caught)return {ok:false,reason:s.lastMessage,...outcome};
 s.pendingWild=null;
 recordCaught(s,candidate.id);
 if(s.team.length<6)s.team.push(member);else s.box.push(member);
 return {ok:true,pokemon:member,...outcome};
}
// The summary editor is a save transaction, not an in-memory preview.
// Equip on a detached member first, persist the complete team checkpoint,
// then update only the two loadout fields on the live Pokémon. A denied
// primary/backup write leaves the old slots, marker and references intact.
export function equipCampaignMove(s,memberIndex,slot,moveId,storage=localStorage){
 if(!Number.isInteger(memberIndex)||memberIndex<0||memberIndex>=s?.team?.length)
  return false;
 const member=s.team[memberIndex];
 const candidate={...member,moves:Array.isArray(member.moves)?[...member.moves]:member.moves};
 if(!equipMove(candidate,slot,moveId))return false;
 const team=s.team.slice();
 team[memberIndex]=candidate;
 saveCampaign({...s,team},storage);
 member.moves=candidate.moves;
 member.movePlanSpecies=candidate.movePlanSpecies;
 return true;
}

export function selectTeamMember(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length)return false;
 // Summary selection must not diverge from the recoverable checkpoint.
 saveCampaign({...s,active:index});
 s.active=index;
 return true;
}
export function healTeam(s){
 // A denied save must never make the team appear cured in the live session.
 // Persist the complete treatment first, preserving member references on success.
 const nextTeam=s.team.map(member=>({...member,hp:100,status:null,confusion:null}));
 const lastMessage='Equipe restaurada.';
 saveCampaign({...s,team:nextTeam,lastMessage});
 for(const member of s.team){member.hp=100;member.status=null;member.confusion=null;}
 s.lastMessage=lastMessage;
}

const supportedKanto=new Set();
for(const species of ROSTER){
 const all=[species.id,...(species.evoluciones||[]).map(x=>String(x.nombre||'').toLowerCase().replace(/[^a-z0-9]+/g,''))];
 for(const id of all){
  const name=id==='nidoran-f'?'nidoran♀':id==='nidoran-m'?'nidoran♂':id;
  if(KANTO_DEX.some(entry=>entry.toLowerCase().replace(/[^a-z0-9♀♂]+/g,'')===
    name.replace(/[^a-z0-9♀♂]+/g,'')))supportedKanto.add(id);
 }
}
export function wildAvailability(stage){
 const route=routeEncounterTable(stage);
 return {...route,available:route.wild.filter(id=>supportedKanto.has(id))};
}
export function startWildEncounter(s,random=Math.random){
 if(s.pendingCapture)return {ok:false,reason:'Resolva a captura pendente primeiro.'};
 // Stage 8 has genuine Victory Road trainers before Lorelei. Keep those
 // encounters, but do not allow fresh wild battles after the final route
 // trainer has been defeated and the Elite Four chamber is unlocked.
 // Stages 9-12 are exclusively Elite Four / Champion chambers.
 if(s.stage>GYMS.length||
    (s.stage===GYMS.length&&s.trainer>=TRAINERS_PER_GYM(s.stage)))
  return {ok:false,reason:'Sem grama alta nas câmaras da Elite Four.'};
 // Tall grass is repeatable in FireRed. A per-region five-encounter hard
 // stop stranded teams after ordinary failed catches, especially pre-Brock.
 // The existing stage level cap, Pokeball inventory and catch RNG still apply.
 // Keep wildEncountersStage as a historical statistic; never grant free items.

 const area=wildAvailability(s.stage);
 if(!area.available.length)return {ok:false,reason:'Pokémon desta rota ainda não integrados ao motor de batalha.'};
 const id=area.available[Math.min(area.available.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*area.available.length))];
 const wild={id,stage:s.stage,trainer:s.trainer,
  level:wildLevelFor(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage)),area:area.area,hpPercent:100};
 // Stage the encounter, counter and Pokédex together. Storage denial
 // must leave the original route and RNG retry available without a phantom
 // encounter, incremented counter or newly seen species in memory.
 const dexSeen=[...(s.dexSeen||[])];
 const next={...s,pendingWild:wild,wildEncountersStage:(s.wildEncountersStage||0)+1,dexSeen};
 recordSeen(next,id);
 saveCampaign(next);
 s.pendingWild=wild;
 s.wildEncountersStage=next.wildEncountersStage;
 s.dexSeen=dexSeen;
 return {ok:true,encounter:wild};
}
export function startWildBattle(s){
 const wild=s.pendingWild;
 if(!wild||wild.stage!==s.stage)throw new Error('Wild encounter no longer active');
 if(!ensureConsciousActive(s))
  throw new Error('Equipe desmaiada: visite o Centro Pokémon antes de batalhar.');
 return {p1:s.team[s.active].id,p2:wild.id,modo:'cpu',nivel:'facil',
  arena:STAGES[s.stage].arena,mandos:['kbm','cpu'],
  torre2:{kind:'wild',stage:s.stage,trainer:s.trainer,id:wild.id,
   playerLevel:s.team[s.active].progression?.level??5,
   enemyLevel:wild.level,hardCap:currentLevelCap(s.stage)}};
}
export function resolveWildBattle(s,won){
 if(!s.pendingWild)return {won:false,message:'Encontro selvagem expirado.'};
 return commitBattleOutcome(s,next=>{
  const wild=next.pendingWild;
  next.pendingWild=null;
  if(!won){
   next.losses++;
   next.team[next.active].hp=Math.min(next.team[next.active].hp??100,50);
   next.pendingCapture=null;
   next.lastMessage='O '+wild.id+' selvagem escapou após a batalha.';
   return {won:false,message:next.lastMessage};
  }
  const shared=awardSharedTeamExperience(next,
   xpRewardFor(next.stage,TRAINERS_PER_GYM(next.stage),'wild'),{kind:'wild'});
  const growth=shared.gains.find(g=>g.index===next.active);
  next.wins++;rechargeRematches(next);
  next.pendingCapture=null;
  next.lastMessage=wild.id+' selvagem foi derrotado. Para capturar, lance uma Pokébola antes do nocaute.';
  return {won:true,message:next.lastMessage,growth,
   sharedExp:shared.gains,evolutions:shared.evolutions};
 });
}
export function purchaseItem(s,itemId){
 const item=MART_ITEMS.find(i=>i.id===itemId&&martItemUnlocked(s,i));
 if(!item)return {ok:false,reason:'Item não está disponível nesta cidade.'};
 if(!Number.isFinite(s.money)||s.money<item.price)return {ok:false,reason:'Poké Dollars insuficientes.'};
 if(item.kind==='tm'&&s.inventory.tms.includes(itemId))
  return {ok:false,reason:'Essa TM já está na bolsa.'};
 // Persist the complete purchase before changing live money or inventory.
 // Denied primary/backup writes must leave the previous checkpoint playable.
 const inventory={...s.inventory,tms:[...s.inventory.tms]};
 if(item.kind==='tm')inventory.tms.push(itemId);
 else inventory[itemId]=(inventory[itemId]||0)+1;
 const changes={money:s.money-item.price,inventory,
  lastMessage:item.name+' comprado por $'+item.price+'.'};
 saveCampaign({...s,...changes});
 Object.assign(s,changes);
 return {ok:true,item};
}
// Commit the item, target Pokémon and message as ONE campaign checkpoint.
 // A denied primary/backup write must not consume medicine, teach a TM or
 // change live HP/status. Preserve the existing party/inventory references.
function commitBagUse(s,memberIndex,memberPatch,inventoryPatch,message){
 const member=s.team[memberIndex];
 const nextTeam=s.team.map((entry,i)=>i===memberIndex?{...member,...memberPatch}:entry);
 const nextInventory={...s.inventory,...inventoryPatch};
 saveCampaign({...s,team:nextTeam,inventory:nextInventory,lastMessage:message});
 Object.assign(member,memberPatch);
 Object.assign(s.inventory,inventoryPatch);
 s.lastMessage=message;
}
export function usePotion(s,itemId='potion',memberIndex=s.active){
 const item=MART_ITEMS.find(x=>x.id===itemId&&x.kind==='heal');
 if(!item||!Number.isInteger(s.inventory?.[itemId])||s.inventory[itemId]<=0)
  return {ok:false,reason:'Sem poções desse tipo.'};
 if(!Number.isInteger(memberIndex)||memberIndex<0||memberIndex>=s.team.length)
  return {ok:false,reason:'Escolha um Pokémon válido da sua equipe.'};
 const member=s.team[memberIndex];
 if(!member||!Number.isFinite(member.hp))
  return {ok:false,reason:'HP inválido: nenhuma poção foi consumida.'};
 // Gen III Potion cannot revive a fainted Pokémon; only the Center can
 // restore all Pokémon and clear major/volatile conditions for free.
 if(member.hp<=0)return {ok:false,reason:'Pokémon desmaiado: use o Centro Pokémon.'};
 if(member.hp>=100)return {ok:false,reason:'Pokémon já está saudável.'};
 const hp=Math.min(100,member.hp+item.heal);
 commitBagUse(s,memberIndex,{hp},{[itemId]:s.inventory[itemId]-1},
  member.id+' recuperou HP.');
 return {ok:true,hp};
}
// Map bag medicine: no HP change, revival or effect on another party member.
export function useStatusCure(s,itemId,memberIndex=s.active){
 const item=MART_ITEMS.find(i=>i.id===itemId&&i.kind==='status');
 if(!item||!Number.isInteger(s.inventory?.[itemId])||s.inventory[itemId]<=0)
  return {ok:false,reason:'Sem remédios desse tipo.'};
 const member=s.team[memberIndex];
 if(!member||!(member.hp>0))return {ok:false,reason:'Escolha um Pokémon que não esteja desmaiado.'};
 const cureMain=item.cures.includes(member.status?.kind);
 const cureConfusion=item.cureConfusion&&!!member.confusion;
 if(!cureMain&&!cureConfusion)return {ok:false,reason:'Esse remédio não terá efeito.'};
 const patch={};
 if(cureMain)patch.status=null;
 if(cureConfusion)patch.confusion=null;
 commitBagUse(s,memberIndex,patch,{[itemId]:s.inventory[itemId]-1},
  item.name+' curou '+member.id.toUpperCase()+'.');
 return {ok:true};
}
export function teachTM(s,itemId,memberIndex=s.active){
 const item=MART_ITEMS.find(x=>x.id===itemId&&x.kind==='tm');
 const target=s.team[memberIndex];
 if(!item||!target||!s.inventory?.tms?.includes(itemId))
  return {ok:false,reason:'TM indisponível para esse Pokémon.'};
 if(Array.isArray(item.compatible)&&
   !item.compatible.includes(target.id))
  return {ok:false,reason:target.id+' não é compatível com '+item.name+'.'};
 if(target.tmMoves?.includes(item.move))return {ok:false,reason:'Golpe já aprendido.'};
 const tms=[...s.inventory.tms];
 tms.splice(tms.indexOf(itemId),1);
 commitBagUse(s,memberIndex,{tmMoves:[...(target.tmMoves||[]),item.move]},
  {tms},target.id+' aprendeu '+item.move+'. Configure no sumário.');
 return {ok:true,move:item.move};
}

export function rematchOpponent(s,index,mapStage=s.stage){
 const stage=Number(mapStage);
 if(!Number.isInteger(stage)||stage<0||stage>8||stage>s.stage||
  !Number.isInteger(index)||index<0||index>=TRAINERS_PER_GYM(stage)||
  (stage===s.stage&&index>=s.trainer))return null;
 const foe=currentOpponent({...s,stage,trainer:index,champion:false});
 if(!foe||!['trainer','rocket'].includes(foe.kind)||foe.leader)return null;
 const level=Math.min(currentLevelCap(s.stage),foe.level+Math.min(10,(s.badges?.length||0)*2));
 return {...foe,level,id:trainerSpeciesForLevel(foe.id,level),mapStage:stage};
}
export function startRematch(s,index,mapStage=s.stage){
 const opponent=rematchOpponent(s,index,mapStage);
 if(!opponent)return {ok:false,reason:'Este treinador ainda não tem revanche disponível.'};
 // Reserve the VS Seeker ticket only after the pending fight is durable.
 const next=JSON.parse(JSON.stringify(s));
 const ticket=reserveRematch(next,index,opponent.mapStage);
 if(!ticket)return {ok:false,reason:'VS Seeker: '+rematchState(next).charge+'/3 atividades. Vença outras batalhas para recarregar.'};
 saveCampaign(next);
 Object.assign(s,next);
 return {ok:true,opponent,ticket};
}
export function resolveRematch(s,ticket,won){
 if(!validRematchResult(s,ticket))return {ok:false,reason:'Resultado antigo de revanche ignorado.'};
 return commitBattleOutcome(s,next=>{
  if(!consumeRematchResult(next,ticket))return {ok:false,reason:'Resultado antigo de revanche ignorado.'};
  let money=0,xp=0,shared=null;
  if(won){
   money=Math.floor((180+ticket.stage*60)/2);
   xp=Math.max(1,Math.floor(xpRewardFor(ticket.stage,TRAINERS_PER_GYM(ticket.stage),'trainer')*.6));
   shared=awardSharedTeamExperience(next,xp,{kind:'trainer'});
   next.money=(next.money||0)+money;
   next.rematches.wins=(next.rematches.wins||0)+1;
  }
  next.lastMessage=won?'Revanche vencida! +'+xp+' EXP para a equipe · +$'+money+'.':'Revanche encerrada. Cure a equipe para tentar novamente.';
  return {ok:true,won,money,xp,shared,message:next.lastMessage};
 });
}
