/* Pokémon Torre 2 — level-only evolution rules, independent from battle rendering.
 * Every evolution, including former stone/trade/friendship evolutions, is earned
 * exclusively through levels and can be applied only AFTER combat ends.
 */

const RULES = [
 ['bulbasaur',16,'ivysaur'],['ivysaur',32,'venusaur'],
 ['charmander',16,'charmeleon'],['charmeleon',36,'charizard'],
 ['squirtle',16,'wartortle'],['wartortle',36,'blastoise'],
 ['caterpie',7,'metapod'],['metapod',10,'butterfree'],
 ['weedle',7,'kakuna'],['kakuna',10,'beedrill'],
 ['pidgey',18,'pidgeotto'],['pidgeotto',36,'pidgeot'],
 ['rattata',20,'raticate'],['spearow',20,'fearow'],
 ['ekans',22,'arbok'],['sandshrew',22,'sandslash'],
 ['nidoran-f',16,'nidorina'],['nidorina',36,'nidoqueen'],
 ['nidoran-m',16,'nidorino'],['nidorino',36,'nidoking'],
 ['clefairy',30,'clefable'],['vulpix',36,'ninetales'],
 ['jigglypuff',30,'wigglytuff'],['zubat',22,'golbat'],['golbat',40,'crobat'],
 ['oddish',21,'gloom'],['gloom',36,'vileplume'],['gloom',36,'bellossom'],
 ['paras',24,'parasect'],['venonat',31,'venomoth'],
 ['diglett',26,'dugtrio'],['meowth',28,'persian'],
 ['psyduck',33,'golduck'],['mankey',28,'primeape'],
 ['growlithe',36,'arcanine'],['poliwag',25,'poliwhirl'],
 ['poliwhirl',36,'poliwrath'],['poliwhirl',36,'politoed'],
 ['abra',16,'kadabra'],['kadabra',36,'alakazam'],
 ['machop',28,'machoke'],['machoke',40,'machamp'],
 ['bellsprout',21,'weepinbell'],['weepinbell',36,'victreebel'],
 ['tentacool',30,'tentacruel'],['geodude',25,'graveler'],['graveler',40,'golem'],
 ['ponyta',40,'rapidash'],['slowpoke',37,'slowbro'],['slowpoke',37,'slowking'],
 ['magnemite',30,'magneton'],['magneton',42,'magnezone'],
 ['doduo',31,'dodrio'],['seel',34,'dewgong'],
 ['grimer',38,'muk'],['shellder',36,'cloyster'],
 ['gastly',25,'haunter'],['haunter',40,'gengar'],
 ['onix',40,'steelix'],['drowzee',26,'hypno'],
 ['krabby',28,'kingler'],['voltorb',30,'electrode'],
 ['exeggcute',36,'exeggutor'],['cubone',28,'marowak'],
 ['koffing',35,'weezing'],['rhyhorn',42,'rhydon'],
 ['horsea',32,'seadra'],['seadra',44,'kingdra'],
 ['goldeen',33,'seaking'],['staryu',36,'starmie'],
 ['magikarp',20,'gyarados'],['eevee',30,'vaporeon'],
 ['eevee',30,'jolteon'],['eevee',30,'flareon'],
 ['omanyte',40,'omastar'],['kabuto',40,'kabutops'],['dratini',30,'dragonair'],
 ['dragonair',55,'dragonite'],
 // Some newer species catalogued by REA — still level-only in Torre 2.
 ['pichu',16,'pikachu'],['pikachu',32,'raichu'],
 ['munchlax',30,'snorlax'],['buneary',30,'lopunny'],
 ['riolu',30,'lucario'],['froakie',16,'frogadier'],['frogadier',36,'greninja'],
 ['dreepy',50,'drakloak'],['drakloak',60,'dragapult'],
 ['joltik',36,'galvantula'],['shinx',15,'luxio'],['luxio',30,'luxray']
];
const lookup = Object.create(null);
for (const [from, level, to] of RULES) {
 (lookup[from] ??= []).push(Object.freeze({level,to}));
}
export const LEVEL_EVOLUTIONS = Object.freeze(Object.fromEntries(
 Object.entries(lookup).map(([id,options])=>[id,Object.freeze(options)])));
export const MAX_LEVEL = 100;

const id = value => String(value || '').trim().toLowerCase();
const validLevel = level => Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL;

export function totalExperienceForLevel(level, growth = 'medium-fast') {
 if (!validLevel(level)) throw new RangeError('Level must be an integer between 1 and 100');
 const n = level;
 if (growth === 'fast') return Math.floor(4*n**3/5);
 if (growth === 'medium-fast') return n**3;
 if (growth === 'medium-slow') return Math.max(0,Math.floor(6*n**3/5-15*n**2+100*n-140));
 if (growth === 'slow') return Math.floor(5*n**3/4);
 throw new RangeError('Unknown experience growth group');
}

export function createPokemonProgression(species, level = 5, opts = {}) {
 if (!id(species) || !validLevel(level)) throw new RangeError('Invalid species or level');
 const growth = opts.growth || 'medium-fast';
 const minExperience = totalExperienceForLevel(level,growth);
 const experience = opts.experience === undefined ? minExperience : Number(opts.experience);
 if (!Number.isFinite(experience) || experience < minExperience)
  throw new RangeError('Experience must cover current level');
 return {species:id(species),level,experience:Math.floor(experience),growth,
  pendingEvolution:false};
}

export function levelEvolutionChoices(pokemon) {
 return (LEVEL_EVOLUTIONS[id(pokemon?.species)] || [])
  .filter(rule=>pokemon.level>=rule.level).map(rule=>rule.to);
}

export function awardBattleExperience(pokemon, experience, battleStatus = 'fighting') {
 if (battleStatus !== 'fighting') throw new Error('Experience is awarded within a battle');
 if (!Number.isSafeInteger(experience) || experience<0) throw new RangeError('Invalid experience reward');
 const before = pokemon.level;
 pokemon.experience += experience;
 while (pokemon.level < MAX_LEVEL &&
  pokemon.experience >= totalExperienceForLevel(pokemon.level+1,pokemon.growth)) {
  pokemon.level++;
 }
 // Never change species, evolution sprite or evolutionary move kit in combat.
 pokemon.pendingEvolution = levelEvolutionChoices(pokemon).length>0;
 return {fromLevel:before,toLevel:pokemon.level,levelsGained:pokemon.level-before,
  experienceGained:experience,evolutionPending:pokemon.pendingEvolution};
}

export function resolveEvolutionAfterBattle(pokemon, battleStatus, selectedEvolution = null) {
 if (battleStatus === 'fighting' || battleStatus === 'starting')
  return {ok:false,reason:'battle-active',evolutions:[],choices:[]};
 if (!['victory','defeat','finished'].includes(battleStatus))
  return {ok:false,reason:'battle-not-finished',evolutions:[],choices:[]};
 const evolutions=[];
 for (let i=0;i<10;i++) {
  const options=levelEvolutionChoices(pokemon);
  if (!options.length) break;
  let target;
  if (options.length===1) target=options[0];
  else if (typeof selectedEvolution === 'function')
   target=id(selectedEvolution({species:pokemon.species,level:pokemon.level,choices:options.slice()}));
  else target=id(selectedEvolution);
  if (!options.includes(target)) {
   pokemon.pendingEvolution=true;
   return {ok:true,evolutions,choices:options,needsChoice:true};
  }
  const from=pokemon.species;
  pokemon.species=target;
  evolutions.push({from,to:target,level:pokemon.level});
 }
 pokemon.pendingEvolution=levelEvolutionChoices(pokemon).length>0;
 return {ok:true,evolutions,choices:[],needsChoice:false};
}
