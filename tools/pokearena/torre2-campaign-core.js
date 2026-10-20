/* Pokémon Torre 2 — campanha solo Kanto, sem conta, servidor ou multiplayer.
 * Reutiliza o combate original Phaser capturado com autorização de pokearena2d.com.
 * Dados em localStorage. Evolução EXCLUSIVAMENTE por nível, APÓS a batalha.
 */
import {createPokemonProgression,totalExperienceForLevel,awardBattleExperience,resolveEvolutionAfterBattle} from './progression.js';

export const SAVE_KEY='pokemon-torre-2-kanto-campaign-v1';
export const GYMS=Object.freeze([
 {city:'Pewter',leader:'Brock',badge:'Rocha',arena:'crater',type:'ROCK',enemy:['onix','machop','zubat'],boss:'onix'},
 {city:'Cerulean',leader:'Misty',badge:'Cascata',arena:'estadio',type:'WATER',enemy:['squirtle','magikarp','zubat'],boss:'wartortle'},
 {city:'Vermilion',leader:'Lt. Surge',badge:'Trovao',arena:'neon',type:'ELECTRIC',enemy:['pichu','pikachu','machop'],boss:'raichu'},
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
 return {version:1,stage:0,trainer:0,team:[newMember(starter)],box:[],
  active:0,wins:0,losses:0,capturesInStage:0,pendingCapture:null,
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
  return s;
 }catch{return null}
}
export function saveCampaign(state,storage=localStorage){
 storage.setItem(SAVE_KEY,JSON.stringify(state));
 return state;
}
export function resetCampaign(storage=localStorage){storage.removeItem(SAVE_KEY)}
export function currentOpponent(s){
 if(s.champion||s.stage>=STAGES.length)return null;
 const gym=STAGES[s.stage];
 const leader=s.stage>=GYMS.length||s.trainer>=TRAINERS_PER_GYM(s.stage);
 const list=gym.enemy;
 return {id:leader?gym.boss:list[s.trainer%list.length],leader,
  name:leader?gym.leader:'Treinador '+(s.trainer+1),
  level:Math.min(85,leader?12+s.stage*7:5+s.stage*7+Math.floor(s.trainer/3)),
  arena:gym.arena,city:gym.city};
}
export function startBattle(s){
 if(!s.team[s.active])throw new Error('Active Pokémon not selected');
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('Kanto campaign completed');
 return {p1:s.team[s.active].id,p2:opponent.id,modo:'cpu',nivel:s.stage<2?'facil':'normal',
  arena:opponent.arena,mandos:['kbm','cpu'],torre2:{stage:s.stage,trainer:s.trainer}};
}
export function resolveBattle(s,won,random=Math.random){
 const opponent=currentOpponent(s);
 if(!opponent)throw new Error('No battle pending');
 if(!won){s.losses++;s.lastMessage='Derrota contra '+opponent.name+'. Cure a equipe e tente novamente.';return {won:false,message:s.lastMessage,evolutions:[]}}
 const member=s.team[s.active],p=member.progression;
 // The species remains unchanged throughout the battle and evolves now only
 // because the Phaser battle scene already sent its confirmed result.
 const reward=Math.max(38,Math.round(opponent.level*(opponent.leader?20:14)));
 const growth=awardBattleExperience(p,reward,'fighting');
 const evolved=resolveEvolutionAfterBattle(p,'victory');
 member.id=p.species;member.hp=100;
 s.wins++;
 s.pendingCapture=(opponent.leader||s.capturesInStage<5)?{
  id:opponent.id,level:opponent.level,leader:opponent.leader,
  chance:opponent.leader?30+Math.floor(random()*61):Math.max(35,75-Math.floor(s.stage*3))
 }:null;
 if(opponent.leader){
  s.badges.push(STAGES[s.stage].badge);
  s.stage++;s.trainer=0;s.capturesInStage=0;
  if(s.stage>=STAGES.length)s.champion=true;
 }else s.trainer++;
 s.lastMessage='Vitória! +'+reward+' EXP. '+(growth.levelsGained?'Nv. '+p.level+'. ':'')+
   (evolved.evolutions.length?'Evoluiu para '+member.id+' apos a batalha!':'');
 saveCampaign(s);
 return {won:true,message:s.lastMessage,reward,growth,evolutions:evolved.evolutions,opponent};
}
export function attemptCapture(s,random=Math.random){
 if(!s.pendingCapture)return {ok:false,reason:'No encounter available'};
 const candidate=s.pendingCapture;
 s.pendingCapture=null;
 if(!candidate.leader)s.capturesInStage++;
 if(random()*100>=candidate.chance){
  s.lastMessage=candidate.id+' escapou da Pokébola.';
  saveCampaign(s);return {ok:false,reason:s.lastMessage};
 }
 const member=newMember(candidate.id,candidate.level);
 if(s.team.length<6)s.team.push(member);else s.box.push(member);
 s.lastMessage=candidate.id+' capturado! '+(s.team.includes(member)?'Equipe':'PC');
 saveCampaign(s);return {ok:true,pokemon:member};
}
export function selectTeamMember(s,index){
 if(!Number.isInteger(index)||index<0||index>=s.team.length)return false;
 s.active=index;saveCampaign(s);return true;
}
export function healTeam(s){for(const member of s.team)member.hp=100;s.lastMessage='Equipe restaurada.';saveCampaign(s)}
