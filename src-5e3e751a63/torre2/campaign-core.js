/* Pokémon Torre 2 — campanha solo Kanto, sem conta, servidor ou multiplayer.
 * Reutiliza o combate original Phaser capturado com autorização de pokearena2d.com.
 * Dados em localStorage. Evolução EXCLUSIVAMENTE por nível, APÓS a batalha.
 */
import {createPokemonProgression,totalExperienceForLevel,awardBattleExperience,resolveEvolutionAfterBattle} from './progression.js';
import {ROSTER} from '../datos.js';
import {KANTO_ROUTES,routeNode,routeEncounterTable,MART_ITEMS} from './route-data.js';
import {captureChance,rollCapture} from './capture-mechanics.js';
import {currentLevelCap,trainerLevelFor,wildLevelFor,xpRewardFor,awardCampaignExperience,enforceCampaignCap} from './kanto-levels.js';

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
  badges:[],lastMessage:'Campanha iniciada. Treine e enfrente os 13 treinadores antes de Brock.',champion:false};
}
export function readCampaign(storage=localStorage){
 try{
  const raw=storage.getItem(SAVE_KEY);
  if(!raw)return null;
  // Resume from the previous valid save if the latest payload was truncated.
  let s;
  try{s=JSON.parse(raw)}catch{
   const backup=storage.getItem(SAVE_BACKUP_KEY);
   if(!backup)return null;
   s=JSON.parse(backup);
   storage.setItem(SAVE_KEY,backup);
  }
  if(s?.version!==1||!Array.isArray(s.team)||s.team.length===0||
    !Number.isInteger(s.stage)||s.stage<0||s.stage>STAGES.length||
    !Number.isInteger(s.trainer)||s.trainer<0)return null;
  // Additive v1 migration. Do not reset saves or lose stored Pokémon.
  let migrated=false;
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
  if(!Array.isArray(s.inventory.tms)){s.inventory.tms=[];migrated=true}
  if(!Number.isInteger(s.wildEncountersStage)||s.wildEncountersStage<0){s.wildEncountersStage=0;migrated=true}
  if(s.pendingCapture){s.pendingCapture=null;migrated=true}
  if(!('pendingWild'in s)){s.pendingWild=null;migrated=true}
  if(s.pendingWild&&(!Number.isFinite(s.pendingWild.hpPercent)||s.pendingWild.hpPercent<1)){
   s.pendingWild.hpPercent=100;migrated=true;
  }
  // Existing player saves receive exactly one permanent level-50 test Mewtwo.
  if(![...s.team,...(s.box||[])].some(p=>p.id==='mewtwo')){
   // Keep the tester playable immediately, without discarding the sixth team member.
   if(s.team.length>=6)s.box.push(s.team.pop());
   s.team.push(newMember('mewtwo',50));
   migrated=true;
  }
  // Invalid stale wild markers from a previous stage must never be replayed.
  if(s.pendingWild&&s.pendingWild.stage!==s.stage){s.pendingWild=null;migrated=true}
  for(const member of [...s.team,...s.box])if(enforceCampaignCap(member,s.stage))migrated=true;
  if(migrated)storage.setItem(SAVE_KEY,JSON.stringify(s));
  return s;
 }catch{return null}
}
export function saveCampaign(state,storage=localStorage){
 const serialized=JSON.stringify(state);
 const previous=storage.getItem(SAVE_KEY);
 if(previous&&previous!==serialized){
  try{JSON.parse(previous);storage.setItem(SAVE_BACKUP_KEY,previous)}catch{}
 }
 storage.setItem(SAVE_KEY,serialized);
 return state;
}
export function resetCampaign(storage=localStorage){
 storage.removeItem(SAVE_KEY);storage.removeItem(SAVE_BACKUP_KEY);
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
export function storePokemon(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length||s.team.length<=1)return false;
 const [member]=s.team.splice(index,1);
 s.box??=[];s.box.push(member);
 if(s.active===index)s.active=0;
 else if(index<s.active)s.active--;
 s.lastMessage=member.id+' enviado para o PC.';
 saveCampaign(s);return true;
}
export function withdrawPokemon(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.box.length||s.team.length>=6)return false;
 const [member]=s.box.splice(index,1);
 s.team.push(member);s.lastMessage=member.id+' entrou na equipe.';
 saveCampaign(s);return true;
}
export function swapPokemon(s,teamIndex,boxIndex){
 if(!Number.isInteger(teamIndex)||teamIndex<0||teamIndex>=s.team.length||
    !Number.isInteger(boxIndex)||boxIndex<0||boxIndex>=s.box.length)return false;
 const old=s.team[teamIndex];
 s.team[teamIndex]=s.box[boxIndex];s.box[boxIndex]=old;
 s.lastMessage=s.team[teamIndex].id+' trocado com '+old.id+'.';
 saveCampaign(s);return true;
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
 const species=leader?(s.stage===STAGES.length-1?championId:gym.boss):role==='rival'?rivalId:
  role==='rocket'?(['zubat','machop','ekans'].includes(list[s.trainer%list.length])?
   list[s.trainer%list.length]:'zubat'):list[s.trainer%list.length];
 return {id:species,leader,kind:role,
  name:leader?gym.leader:role==='rival'?'Rival':role==='rocket'?'Equipe Rocket':'Treinador '+(s.trainer+1),
  level:trainerLevelFor(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage),leader),
  arena:gym.arena,city:gym.city};
}
export function startBattle(s){
 if(!s.team[s.active])throw new Error('Active Pokémon not selected');
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('Kanto campaign completed');
 // Scale the ORIGINAL Poké Arena tactical bot as Kanto progresses:
 // its native difficulty adjusts reactions, evasions and attack judgment.
 recordSeen(s,opponent.id);saveCampaign(s);
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
   const kanto={gloom:'vileplume',poliwhirl:'poliwrath'};
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
  for(const event of evolved.evolutions||[])
   evolutions.push({index,uid:member.uid,...event});
 }
 return {gains,evolutions,totalRecipients:gains.filter(x=>!x.tester).length};
}
export function resolveBattle(s,won,random=Math.random){
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('No battle pending');
 if(!won){
  s.losses++;s.team[s.active].hp=Math.min(s.team[s.active].hp??100,35);
  s.pendingCapture=null; // Never retain a capture opportunity from a prior victory.
  s.lastMessage='Derrota contra '+opponent.name+'. Cure a equipe e tente novamente.';
  saveCampaign(s);
  return {won:false,message:s.lastMessage,evolutions:[]};
 }
 recordSeen(s,opponent.id);
 const member=s.team[s.active];
 // Full team EXP, including teammates left on the bench. The active fighter
 // still gets its post-victory recovery; bench HP and statuses are untouched.
 const reward=xpRewardFor(s.stage,TRAINERS_PER_GYM(s.stage),opponent.leader?'leader':'trainer');
 const shared=awardSharedTeamExperience(s,reward,{kind:'trainer'});
 const growth=shared.gains.find(g=>g.index===s.active);
 member.hp=100;
 s.wins++;
 s.money=(s.money??1400)+(opponent.leader?1200:opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180+s.stage*60);
 s.pendingCapture=null; // Trainer-owned Pokémon cannot be captured.
 if(opponent.leader){
  s.badges.push(STAGES[s.stage].badge);
  if(s.stage===0&&!s.inventory.tms.includes('tm-rock-tomb')){
   s.inventory.tms.push('tm-rock-tomb');s.lastRewardTM='TM39 ROCK TOMB';
  }
  s.stage++;s.trainer=0;s.capturesInStage=0;s.wildEncountersStage=0;s.pendingWild=null;
  if(s.stage>=STAGES.length)s.champion=true;
 }else s.trainer++;
 s.lastMessage='Vitória! +'+reward+' EXP para toda a equipe ('+
   shared.totalRecipients+' Pokémon). '+(shared.evolutions.length?
   shared.evolutions.length+' evolução(ões) após a batalha!':'');
 saveCampaign(s);
 return {won:true,message:s.lastMessage,reward,growth,sharedExp:shared.gains,
  evolutions:shared.evolutions,opponent};
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
 s.inventory[ball]--;
 if(!inWild){s.pendingCapture=null;
  if(!candidate.leader)s.capturesInStage++;
 }
 if(!outcome.caught){
  s.lastMessage=candidate.id+' escapou! '+outcome.shakes+' balanços.';
  saveCampaign(s);
  return {ok:false,reason:s.lastMessage,...outcome};
 }
 if(inWild)s.pendingWild=null;
 const member=newMember(candidate.id,Math.min(currentLevelCap(s.stage),candidate.level));
 member.shiny=candidate.shiny===true;
 member.hp=target.hpPercent;
 member.status=options.persistentStatus?JSON.parse(JSON.stringify(options.persistentStatus)):null;
 recordCaught(s,candidate.id);
 if(s.team.length<6)s.team.push(member);else s.box.push(member);
 s.lastMessage=candidate.id+' capturado! '+(s.team.includes(member)?'Equipe':'PC')+
  ' · '+Math.round(outcome.chance*100)+'% de chance.';
 saveCampaign(s);return {ok:true,pokemon:member,...outcome};
}
export function selectTeamMember(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length)return false;
 s.active=index;saveCampaign(s);return true;
}
export function healTeam(s){for(const member of s.team){member.hp=100;member.status=null;member.confusion=null;}s.lastMessage='Equipe restaurada.';saveCampaign(s)}

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
 if(s.stage>GYMS.length)return {ok:false,reason:'Sem grama alta nas câmaras da Elite Four.'};
 if(s.wildEncountersStage>=5)return {ok:false,reason:'Você explorou os cinco encontros desta região.'};
 const area=wildAvailability(s.stage);
 if(!area.available.length)return {ok:false,reason:'Pokémon desta rota ainda não integrados ao motor de batalha.'};
 const id=area.available[Math.min(area.available.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*area.available.length))];
 const wild={id,stage:s.stage,trainer:s.trainer,
  level:wildLevelFor(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage)),area:area.area,hpPercent:100};
 s.pendingWild=wild;s.wildEncountersStage++;
 recordSeen(s,id);saveCampaign(s);
 return {ok:true,encounter:wild};
}
export function startWildBattle(s){
 const wild=s.pendingWild;
 if(!wild||wild.stage!==s.stage||!s.team[s.active])throw new Error('Wild encounter no longer active');
 return {p1:s.team[s.active].id,p2:wild.id,modo:'cpu',nivel:'facil',
  arena:STAGES[s.stage].arena,mandos:['kbm','cpu'],
  torre2:{kind:'wild',stage:s.stage,trainer:s.trainer,id:wild.id,
   playerLevel:s.team[s.active].progression?.level??5,
   enemyLevel:wild.level,hardCap:currentLevelCap(s.stage)}};
}
export function resolveWildBattle(s,won){
 const wild=s.pendingWild;
 if(!wild)return {won:false,message:'Encontro selvagem expirado.'};
 s.pendingWild=null;
 if(!won){
  s.losses++;
  s.team[s.active].hp=Math.min(s.team[s.active].hp??100,50);
  s.pendingCapture=null;
  s.lastMessage='O '+wild.id+' selvagem escapou após a batalha.';
  saveCampaign(s);return {won:false,message:s.lastMessage};
 }
 const shared=awardSharedTeamExperience(s,
  xpRewardFor(s.stage,TRAINERS_PER_GYM(s.stage),'wild'),{kind:'wild'});
 const growth=shared.gains.find(g=>g.index===s.active);
 s.wins++;
 s.pendingCapture=null;
 s.lastMessage=wild.id+' selvagem foi derrotado. Para capturar, lance uma Pokébola antes do nocaute.';
 saveCampaign(s);return {won:true,message:s.lastMessage,growth,
  sharedExp:shared.gains,evolutions:shared.evolutions};
}
export function purchaseItem(s,itemId){
 const item=MART_ITEMS.find(i=>i.id===itemId&&s.stage>=(i.minStage??0));
 if(!item)return {ok:false,reason:'Item não está disponível nesta cidade.'};
 if(!Number.isFinite(s.money)||s.money<item.price)return {ok:false,reason:'Poké Dollars insuficientes.'};
 if(item.kind==='tm'&&s.inventory.tms.includes(itemId))
  return {ok:false,reason:'Essa TM já está na bolsa.'};
 s.money-=item.price;
 if(item.kind==='tm')s.inventory.tms.push(itemId);
 else s.inventory[itemId]=(s.inventory[itemId]||0)+1;
 s.lastMessage=item.name+' comprado por $'+item.price+'.';
 saveCampaign(s);return {ok:true,item};
}
export function usePotion(s,itemId='potion',memberIndex=s.active){
 const item=MART_ITEMS.find(x=>x.id===itemId&&x.kind==='heal');
 if(!item||!(s.inventory?.[itemId]>0))return {ok:false,reason:'Sem poções desse tipo.'};
 const member=s.team[memberIndex];
 if(!member||member.hp>=100)return {ok:false,reason:'Pokémon já está saudável.'};
 s.inventory[itemId]--;
 member.hp=Math.min(100,member.hp+item.heal);
 s.lastMessage=member.id+' recuperou HP.';
 saveCampaign(s);return {ok:true,hp:member.hp};
}
export function teachTM(s,itemId,memberIndex=s.active){
 const item=MART_ITEMS.find(x=>x.id===itemId&&x.kind==='tm');
 const target=s.team[memberIndex];
 if(!item||!target||!s.inventory?.tms?.includes(itemId))
  return {ok:false,reason:'TM indisponível para esse Pokémon.'};
 if(target.id!=='mewtwo'&&Array.isArray(item.compatible)&&
   !item.compatible.includes(target.id))
  return {ok:false,reason:target.id+' não é compatível com '+item.name+'.'};
 target.tmMoves??=[];
 if(target.tmMoves.includes(item.move))return {ok:false,reason:'Golpe já aprendido.'};
 target.tmMoves.push(item.move);
 s.inventory.tms.splice(s.inventory.tms.indexOf(itemId),1);
 s.lastMessage=target.id+' aprendeu '+item.move+'. Configure no sumário.';
 saveCampaign(s);return {ok:true,move:item.move};
}
