/* Pokémon Torre 2 — campanha solo Kanto, sem conta, servidor ou multiplayer.
 * Reutiliza o combate original Phaser capturado com autorização de pokearena2d.com.
 * Dados em localStorage. Evolução EXCLUSIVAMENTE por nível, APÓS a batalha.
 */
import {createPokemonProgression,totalExperienceForLevel,awardBattleExperience,resolveEvolutionAfterBattle} from './progression.js';
import {ROSTER} from '../datos.js';
import {KANTO_ROUTES,routeNode,routeEncounterTable,MART_ITEMS} from './route-data.js';

// Persistent normal Kanto campaign. No temporary preview slots or save switches.
export const SAVE_KEY='pokemon-torre-2-kanto-campaign-v1';
export const GYMS=Object.freeze([
 {city:'Pewter',leader:'Brock',badge:'Rocha',arena:'crater',type:'ROCK',
  enemy:['pidgey','rattata','caterpie','weedle','pikachu','spearow','mankey','nidoran-f','nidoran-m','geodude'],
  boss:'onix'},
 {city:'Cerulean',leader:'Misty',badge:'Cascata',arena:'estadio',type:'WATER',enemy:['squirtle','magikarp','zubat'],boss:'wartortle'},
 {city:'Vermilion',leader:'Lt. Surge',badge:'Trovao',arena:'neon',type:'ELECTRIC',enemy:['pikachu','raichu','machop'],boss:'raichu'},
 {city:'Celadon',leader:'Erika',badge:'Arco-Iris',arena:'ruinas',type:'GRASS',enemy:['bulbasaur','ivysaur','exeggcute'],boss:'venusaur'},
 {city:'Fuchsia',leader:'Koga',badge:'Alma',arena:'ruinas',type:'POISON',enemy:['zubat','golbat','exeggcute'],boss:'golbat'},
 {city:'Saffron',leader:'Sabrina',badge:'Pantano',arena:'neon',type:'PSYCHIC',enemy:['exeggcute','machop','zubat'],boss:'exeggutor'},
 {city:'Cinnabar',leader:'Blaine',badge:'Vulcao',arena:'crater',type:'FIRE',enemy:['ponyta','rapidash','charmander'],boss:'rapidash'},
 {city:'Viridian',leader:'Giovanni',badge:'Terra',arena:'crater',type:'GROUND',enemy:['onix','machoke','machamp'],boss:'onix'}
]);
export const ELITE=Object.freeze([
 {city:'Elite Four',leader:'Lorelei',badge:'Elite 1',arena:'estadio',enemy:['squirtle','wartortle','onix'],boss:'blastoise'},
 {city:'Elite Four',leader:'Bruno',badge:'Elite 2',arena:'crater',enemy:['machop','onix','machoke'],boss:'machamp'},
 {city:'Elite Four',leader:'Agatha',badge:'Elite 3',arena:'ruinas',enemy:['zubat','golbat','exeggcute'],boss:'golbat'},
 {city:'Elite Four',leader:'Lance',badge:'Elite 4',arena:'estadio',enemy:['magikarp','gyarados','onix'],boss:'gyarados'}
]);
export const STAGES=Object.freeze([...GYMS,...ELITE]);
export const STARTERS=Object.freeze(['bulbasaur','charmander','squirtle']);
export const KANTO_DEX=Object.freeze('Bulbasaur,Ivysaur,Venusaur,Charmander,Charmeleon,Charizard,Squirtle,Wartortle,Blastoise,Caterpie,Metapod,Butterfree,Weedle,Kakuna,Beedrill,Pidgey,Pidgeotto,Pidgeot,Rattata,Raticate,Spearow,Fearow,Ekans,Arbok,Pikachu,Raichu,Sandshrew,Sandslash,Nidoran♀,Nidorina,Nidoqueen,Nidoran♂,Nidorino,Nidoking,Clefairy,Clefable,Vulpix,Ninetales,Jigglypuff,Wigglytuff,Zubat,Golbat,Oddish,Gloom,Vileplume,Paras,Parasect,Venonat,Venomoth,Diglett,Dugtrio,Meowth,Persian,Psyduck,Golduck,Mankey,Primeape,Growlithe,Arcanine,Poliwag,Poliwhirl,Poliwrath,Abra,Kadabra,Alakazam,Machop,Machoke,Machamp,Bellsprout,Weepinbell,Victreebel,Tentacool,Tentacruel,Geodude,Graveler,Golem,Ponyta,Rapidash,Slowpoke,Slowbro,Magnemite,Magneton,Farfetchd,Doduo,Dodrio,Seel,Dewgong,Grimer,Muk,Shellder,Cloyster,Gastly,Haunter,Gengar,Onix,Drowzee,Hypno,Krabby,Kingler,Voltorb,Electrode,Exeggcute,Exeggutor,Cubone,Marowak,Hitmonlee,Hitmonchan,Lickitung,Koffing,Weezing,Rhyhorn,Rhydon,Chansey,Tangela,Kangaskhan,Horsea,Seadra,Goldeen,Seaking,Staryu,Starmie,MrMime,Scyther,Jynx,Electabuzz,Magmar,Pinsir,Tauros,Magikarp,Gyarados,Lapras,Ditto,Eevee,Vaporeon,Jolteon,Flareon,Porygon,Omanyte,Omastar,Kabuto,Kabutops,Aerodactyl,Snorlax,Articuno,Zapdos,Moltres,Dratini,Dragonair,Dragonite,Mewtwo,Mew'.split(','));
export const TRAINERS_PER_GYM=stage=>13+stage*2;

function newMember(species,level=5){
 const exp=createPokemonProgression(species,level);
 return {id:species,progression:exp,uid:species+'-'+Math.random().toString(36).slice(2,9),hp:100};
}
export function createCampaign(starter){
 if(!STARTERS.includes(starter))throw new Error('Choose an original Kanto starter');
 return {version:1,stage:0,trainer:0,team:[newMember(starter),newMember('mewtwo',50)],box:[],dexSeen:[starter],dexCaught:[starter],
  active:0,wins:0,losses:0,capturesInStage:0,pendingCapture:null,
  money:1400,inventory:{pokeball:5,greatball:0,ultraball:0,potion:3,superpotion:0,tms:[]},
  wildEncountersStage:0,pendingWild:null,
  badges:[],lastMessage:'Campanha iniciada. Treine e enfrente os 13 treinadores antes de Brock.',champion:false};
}
export function readCampaign(storage=localStorage){
 try{
  const raw=storage.getItem(SAVE_KEY);
  if(!raw)return null;
  const s=JSON.parse(raw);
  if(s?.version!==1||!Array.isArray(s.team)||s.team.length===0||
    !Number.isInteger(s.stage)||s.stage<0||s.stage>STAGES.length||
    !Number.isInteger(s.trainer)||s.trainer<0)return null;
  // Additive v1 migration. Do not reset saves or lose stored Pokémon.
  let migrated=false;
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
  if(!('pendingWild'in s)){s.pendingWild=null;migrated=true}
  // Existing player saves receive exactly one permanent level-50 test Mewtwo.
  if(![...s.team,...(s.box||[])].some(p=>p.id==='mewtwo')){
   // Keep the tester playable immediately, without discarding the sixth team member.
   if(s.team.length>=6)s.box.push(s.team.pop());
   s.team.push(newMember('mewtwo',50));
   migrated=true;
  }
  // Invalid stale wild markers from a previous stage must never be replayed.
  if(s.pendingWild&&s.pendingWild.stage!==s.stage){s.pendingWild=null;migrated=true}
  if(migrated)storage.setItem(SAVE_KEY,JSON.stringify(s));
  return s;
 }catch{return null}
}
export function saveCampaign(state,storage=localStorage){
 storage.setItem(SAVE_KEY,JSON.stringify(state));
 return state;
}
export function resetCampaign(storage=localStorage){storage.removeItem(SAVE_KEY)}
// Pokédex data describes encounters/captures, not which sprites are playable.
export function recordSeen(s,id){
 if(!id||!KANTO_DEX.some(name=>name.toLowerCase()===String(id).toLowerCase()))return false;
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
 const leader=s.stage>=GYMS.length||s.trainer>=TRAINERS_PER_GYM(s.stage);
 const list=gym.enemy;
 const node=routeNode(s.stage,s.trainer,TRAINERS_PER_GYM(s.stage));
 const role=leader?'leader':node.type;
 const rivalId=s.team[0]?.id==='charmander'?'squirtle':
  s.team[0]?.id==='squirtle'?'bulbasaur':'charmander';
 const species=leader?gym.boss:role==='rival'?rivalId:
  role==='rocket'?(['zubat','machop','ekans'].includes(list[s.trainer%list.length])?
   list[s.trainer%list.length]:'zubat'):list[s.trainer%list.length];
 return {id:species,leader,kind:role,
  name:leader?gym.leader:role==='rival'?'Rival':role==='rocket'?'Equipe Rocket':'Treinador '+(s.trainer+1),
  level:Math.min(85,leader?12+s.stage*7:5+s.stage*7+Math.floor(s.trainer/3)),
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
  (s.stage>=8?'dificil':s.stage>=3?'normal':'facil');
 return {p1:s.team[s.active].id,p2:opponent.id,modo:'cpu',nivel:tier,
  arena:opponent.arena,mandos:['kbm','cpu'],torre2:{stage:s.stage,trainer:s.trainer,kind:'trainer'}};
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
 const member=s.team[s.active],p=member.progression;
 // The species remains unchanged throughout the battle and evolves now only
 // because the Phaser battle scene already sent its confirmed result.
 const reward=Math.max(38,Math.round(opponent.level*(opponent.leader?20:14)));
 const growth=awardBattleExperience(p,reward,'fighting');
 const evolved=resolveEvolutionAfterBattle(p,'victory');
 member.id=p.species;member.hp=100;
 s.wins++;
 s.money=(s.money??1400)+(opponent.leader?1200:opponent.kind==='rival'?460:opponent.kind==='rocket'?360:180+s.stage*60);
 s.pendingCapture=(opponent.leader||s.capturesInStage<5)?{
  id:opponent.id,level:opponent.level,leader:opponent.leader,
  chance:opponent.leader?30+Math.floor(random()*61):Math.max(35,75-Math.floor(s.stage*3))
 }:null;
 if(opponent.leader){
  s.badges.push(STAGES[s.stage].badge);
  s.stage++;s.trainer=0;s.capturesInStage=0;s.wildEncountersStage=0;s.pendingWild=null;
  if(s.stage>=STAGES.length)s.champion=true;
 }else s.trainer++;
 s.lastMessage='Vitória! +'+reward+' EXP. '+(growth.levelsGained?'Nv. '+p.level+'. ':'')+
   (evolved.evolutions.length?'Evoluiu para '+member.id+' apos a batalha!':'');
 saveCampaign(s);
 return {won:true,message:s.lastMessage,reward,growth,evolutions:evolved.evolutions,opponent};
}
export function attemptCapture(s,random=Math.random,ball='pokeball'){
 if(!s.pendingCapture)return {ok:false,reason:'No encounter available'};
 if(!['pokeball','greatball','ultraball'].includes(ball)||!(s.inventory?.[ball]>0))
  return {ok:false,reason:'Sem Pokébolas! Visite o Mart.'};
 const candidate=s.pendingCapture;
 s.inventory[ball]--;
 s.pendingCapture=null;
 if(!candidate.leader&&!candidate.wild)s.capturesInStage++;
 const bonus=ball==='ultraball'?22:ball==='greatball'?11:0;
 if(random()*100>=Math.min(95,candidate.chance+bonus)){
  s.lastMessage=candidate.id+' escapou da Pokébola.';
  saveCampaign(s);return {ok:false,reason:s.lastMessage};
 }
 const member=newMember(candidate.id,candidate.level);
 recordCaught(s,candidate.id);
 if(s.team.length<6)s.team.push(member);else s.box.push(member);
 s.lastMessage=candidate.id+' capturado! '+(s.team.includes(member)?'Equipe':'PC');
 saveCampaign(s);return {ok:true,pokemon:member};
}
export function selectTeamMember(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length)return false;
 s.active=index;saveCampaign(s);return true;
}
export function healTeam(s){for(const member of s.team)member.hp=100;s.lastMessage='Equipe restaurada.';saveCampaign(s)}

const supportedKanto=new Set();
for(const species of ROSTER){
 const all=[species.id,...(species.evoluciones||[]).map(x=>String(x.nombre||'').toLowerCase().replace(/[^a-z0-9]+/g,''))];
 for(const id of all)if(KANTO_DEX.some(name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'')===id))
  supportedKanto.add(id);
}
export function wildAvailability(stage){
 const route=routeEncounterTable(stage);
 return {...route,available:route.wild.filter(id=>supportedKanto.has(id))};
}
export function startWildEncounter(s,random=Math.random){
 if(s.pendingCapture)return {ok:false,reason:'Resolva a captura pendente primeiro.'};
 if(s.stage>=GYMS.length)return {ok:false,reason:'Sem grama alta na Elite Four.'};
 if(s.wildEncountersStage>=5)return {ok:false,reason:'Você explorou os cinco encontros desta região.'};
 const area=wildAvailability(s.stage);
 if(!area.available.length)return {ok:false,reason:'Pokémon desta rota ainda não integrados ao motor de batalha.'};
 const id=area.available[Math.min(area.available.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*area.available.length))];
 const wild={id,stage:s.stage,trainer:s.trainer,level:Math.max(3,4+s.stage*5),area:area.area};
 s.pendingWild=wild;s.wildEncountersStage++;
 recordSeen(s,id);saveCampaign(s);
 return {ok:true,encounter:wild};
}
export function startWildBattle(s){
 const wild=s.pendingWild;
 if(!wild||wild.stage!==s.stage||!s.team[s.active])throw new Error('Wild encounter no longer active');
 return {p1:s.team[s.active].id,p2:wild.id,modo:'cpu',nivel:'facil',
  arena:STAGES[s.stage].arena,mandos:['kbm','cpu'],
  torre2:{kind:'wild',stage:s.stage,trainer:s.trainer,id:wild.id}};
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
 const member=s.team[s.active],growth=awardBattleExperience(member.progression,
  wild.level*9,'fighting');
 const evolved=resolveEvolutionAfterBattle(member.progression,'victory');
 member.id=member.progression.species;
 s.wins++;
 s.pendingCapture={id:wild.id,level:wild.level,leader:false,wild:true,chance:68};
 s.lastMessage='Encontro na grama! '+wild.id+' NV.'+wild.level+
  ' · Use uma Pokébola para tentar capturar.';
 saveCampaign(s);return {won:true,message:s.lastMessage,growth,evolutions:evolved.evolutions};
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
 target.tmMoves??=[];
 if(target.tmMoves.includes(item.move))return {ok:false,reason:'Golpe já aprendido.'};
 target.tmMoves.push(item.move);
 s.inventory.tms.splice(s.inventory.tms.indexOf(itemId),1);
 s.lastMessage=target.id+' aprendeu '+item.move+'. Configure no sumário.';
 saveCampaign(s);return {ok:true,move:item.move};
}
