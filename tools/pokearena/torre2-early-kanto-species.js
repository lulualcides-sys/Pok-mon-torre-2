/* Pokémon Torre 2: strictly additive early-Kanto Pokémon lines.
 * Reuses already-installed Poké Arena move renderers by original move name,
 * and user-approved Torre 2 effects where a move was missing. Never changes
 * the native species, their sprites, approved attacks or battle UI.
 */
import {BATCH24_MOVES} from './batch24/catalog.js';

// The two maps are part of the existing Kanto campaign. DO NOT change the
// original licensed Poké Arena 2D kits or its non-campaign EVO rules.
export const MISTY_ROUTE_BASE=Object.freeze([
 'paras','clefairy','sandshrew','ekans','staryu','psyduck','poliwag'
]);
export const SURGE_ROUTE_BASE=Object.freeze([
 'oddish','bellsprout','meowth','diglett','voltorb','magnemite'
]);
// In every stage of every family: [ATK LMB, HAB2 RMB, HAB3 Q, ULT E].
// ESP is always the genuine non-damaging Kanto dodge. Move names are from
// P2 native kits, or previously approved batch24; no mock/unimplemented FX.
export const KANTO_ROUTE_SLOTS=Object.freeze({
 // Pre-Brock evolutions: different real skills, never copy basic moves blindly
 pidgeotto:['Tackle','Gust','Quick Attack','Air Cutter'],
 pidgeot:['Tackle','Air Cutter','Wing Attack','Brave Bird'],
 raticate:['Tackle','Bite','Hyper Fang','Super Fang'],
 metapod:['Tackle','String Shot','Bug Bite','Confusion'],
 butterfree:['Tackle','Gust','Confusion','Psybeam'],
 kakuna:['Tackle','Poison Sting','Bug Bite','Fury Attack'],
 beedrill:['Poison Sting','Peck','Fury Attack','Cross Poison'],
 raichu:['Thunder Shock','Quick Attack','Thunderbolt','Thunder'],
 fearow:['Peck','Fury Attack','Wing Attack','Drill Peck'],
 nidorina:['Tackle','Poison Sting','Double Kick','Horn Attack'],
 nidoqueen:['Poison Sting','Horn Attack','Earthquake','Sludge Bomb'],
 nidorino:['Tackle','Poison Sting','Double Kick','Horn Attack'],
 nidoking:['Poison Sting','Horn Attack','Earthquake','Sludge Bomb'],
 primeape:['Karate Chop','Low Sweep','Revenge','Close Combat'],
 graveler:['Tackle','Rock Throw','Mud-Slap','Rock Slide'],
 golem:['Tackle','Rock Slide','Earthquake','Stone Edge'],
 // Brock → Misty: Mt. Moon, Route 4, Cerulean
 paras:['Tackle','Leech Life','String Shot','Razor Leaf'],
 parasect:['Tackle','Leech Life','Razor Leaf','Solar Beam'],
 clefairy:['Pound','Charm','Psybeam','Hyper Beam'],
 clefable:['Pound','Charm','Psybeam','Hyper Beam'],
 sandshrew:['Tackle','Rapid Spin','Dig','Earthquake'],
 sandslash:['Tackle','Dig','Rock Slide','Earthquake'],
 ekans:['Bite','Poison Sting','Acid','Sludge Bomb'],
 arbok:['Bite','Acid','Sludge Bomb','Dark Pulse'],
 staryu:['Water Gun','Rapid Spin','Bubble Beam','Water Pulse'],
 starmie:['Water Gun','Bubble Beam','Psybeam','Water Pulse'],
 psyduck:['Water Gun','Confusion','Water Pulse','Hydro Pump'],
 golduck:['Water Gun','Water Pulse','Psybeam','Hydro Pump'],
 poliwag:['Water Gun','Bubble','Hypnosis','Hydro Pump'],
 poliwhirl:['Water Gun','Bubble Beam','Hypnosis','Hydro Pump'],
 poliwrath:['Water Gun','Bubble Beam','Low Sweep','Hydro Pump'],
 // Misty → Lt. Surge: Route 24/25, Routes 5/6, port, Diglett Cave
 oddish:['Tackle','Growth','Razor Leaf','Solar Beam'],
 gloom:['Tackle','Razor Leaf','Leech Seed','Solar Beam'],
 vileplume:['Tackle','Razor Leaf','Sludge Bomb','Solar Beam'],
 bellsprout:['Vine Whip','Growth','Razor Leaf','Solar Beam'],
 weepinbell:['Vine Whip','Razor Leaf','Leech Seed','Solar Beam'],
 victreebel:['Vine Whip','Razor Leaf','Sludge Bomb','Solar Beam'],
 meowth:['Tackle','Quick Attack','Knock Off','Hyper Beam'],
 persian:['Tackle','Quick Attack','Knock Off','Hyper Beam'],
 diglett:['Tackle','Dig','Rock Slide','Earthquake'],
 dugtrio:['Tackle','Dig','Rock Slide','Earthquake'],
 voltorb:['Tackle','Shock Wave','Charge Beam','Explosion'],
 electrode:['Tackle','Shock Wave','Discharge','Explosion'],
 magnemite:['Thunder Shock','Charge Beam','Shock Wave','Discharge'],
 magneton:['Thunder Shock','Electro Ball','Discharge','Thunder']
});
const ROUTE2_IDS=new Set([
 'oddish','gloom','vileplume','bellsprout','weepinbell','victreebel',
 'meowth','persian','diglett','dugtrio','voltorb','electrode',
 'magnemite','magneton'
]);
const ID_OF_MOVE=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const ROUTE_LEVELS=Object.freeze(Object.fromEntries(
 Object.entries(KANTO_ROUTE_SLOTS).map(([id,names])=>{
  // Every evolution has its OWN move list and four unlock thresholds.
  const tier=id==='butterfree'?[1,5,10,18]:
   ROUTE2_IDS.has(id)?[1,12,18,24]:[1,6,12,18];
  return [id,Object.freeze(Object.fromEntries(names.map(
   (name,i)=>[ID_OF_MOVE(name),tier[i]])))];
 })
));
// Native P2 species already on the first map keep their genuine original
// non-campaign kits. Only campaign evolution loadouts change.
export const KANTO_NATIVE_EVOLUTION_SLOTS=Object.freeze({
 ivysaur:['Razor Leaf','Growth','Leech Seed','Solar Beam'],
 venusaur:['Razor Leaf','Sludge Bomb','Ingrain','Frenzy Plant'],
 charmeleon:['Ember','Flamethrower','Fire Spin','Fire Blast'],
 charizard:['Ember','Flamethrower','Fire Spin','Blast Burn'],
 wartortle:['Water Gun','Bubble Beam','Hydro Typhoon','Hydro Pump'],
 blastoise:['Water Gun','Bubble Beam','Hydro Typhoon','Hydro Cannon'],
 golbat:['Wing Attack','Air Cutter','Leech Life','Supersonic']
});
export const nativeKantoEvolutionPlan=id=>
 KANTO_NATIVE_EVOLUTION_SLOTS[id]||null;

export const EARLY_KANTO_BASE=Object.freeze([
 'pidgey','rattata','caterpie','weedle','pikachu',
 'spearow','nidoran-f','nidoran-m','mankey','geodude'
]);
export const EARLY_KANTO_LEARNSETS=Object.freeze({
 pidgey:{tackle:1,'gust':5,'quick-attack':9,'wing-attack':19},
 pidgeotto:{tackle:1,gust:9,'quick-attack':13,'wing-attack':25},
 pidgeot:{tackle:1,gust:9,'quick-attack':13,'wing-attack':25},
 rattata:{tackle:1,'quick-attack':7,bite:10,'hyper-fang':13,'super-fang':34},
 raticate:{tackle:1,'quick-attack':7,bite:10,'hyper-fang':13,'super-fang':34},
 caterpie:{tackle:1,'string-shot':1,'bug-bite':9},
 metapod:{tackle:1,'string-shot':1,'bug-bite':9},
 butterfree:{tackle:1,'string-shot':1,'bug-bite':9,gust:10,confusion:10},
 weedle:{tackle:1,'poison-sting':1,'bug-bite':9},
 kakuna:{tackle:1,'poison-sting':1,'bug-bite':9},
 beedrill:{tackle:1,'poison-sting':1,'bug-bite':9,peck:10,'fury-attack':16},
 pikachu:{'thunder-shock':1,'quick-attack':10,swift:21,thunderbolt:26},
 raichu:{'thunder-shock':1,'quick-attack':10,swift:21,thunderbolt:26},
 spearow:{peck:1,'quick-attack':9,'fury-attack':17,'wing-attack':20},
 fearow:{peck:1,'quick-attack':9,'fury-attack':17,'wing-attack':20},
 'nidoran-f':{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidorina:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidoqueen:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 'nidoran-m':{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidorino:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidoking:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 mankey:{'low-kick':1,'karate-chop':10,'quick-attack':12,'close-combat':38},
 primeape:{'low-kick':1,'karate-chop':10,'quick-attack':12,'close-combat':38},
 geodude:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15},
 graveler:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15},
 golem:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15},
 ...ROUTE_LEVELS
});
// Arena 2D original control order: LMB weak BASIC, RMB skill, ESP
// defensive DODGE, Q second skill and E meter-gated ULT. These are
// role assignments for the ADDITIVE ten Kanto families only.
export const EARLY_KANTO_SLOTS=Object.freeze({
 pidgey:['Tackle','Gust','Quick Attack','Wing Attack'],
 rattata:['Tackle','Quick Attack','Bite','Hyper Fang'],
 caterpie:['Tackle','String Shot','Bug Bite','Confusion'],
 weedle:['Tackle','Poison Sting','Bug Bite','Fury Attack'],
 pikachu:['Thunder Shock','Quick Attack','Swift','Thunderbolt'],
 spearow:['Peck','Quick Attack','Fury Attack','Wing Attack'],
 'nidoran-f':['Tackle','Poison Sting','Double Kick','Horn Attack'],
 'nidoran-m':['Tackle','Poison Sting','Double Kick','Horn Attack'],
 mankey:['Low Kick','Karate Chop','Quick Attack','Close Combat'],
 geodude:['Tackle','Rock Throw','Mud-Slap','Rock Tomb'],
 ...KANTO_ROUTE_SLOTS
});
const EVO_TO_BASE=Object.freeze({
 pidgeotto:'pidgey',pidgeot:'pidgey',raticate:'rattata',
 metapod:'caterpie',butterfree:'caterpie',kakuna:'weedle',beedrill:'weedle',
 raichu:'pikachu',fearow:'spearow',nidorina:'nidoran-f',nidoqueen:'nidoran-f',
 nidorino:'nidoran-m',nidoking:'nidoran-m',primeape:'mankey',
 graveler:'geodude',golem:'geodude'
});
export function earlyKantoSlotPlan(species){
 return EARLY_KANTO_SLOTS[species]||EARLY_KANTO_SLOTS[EVO_TO_BASE[species]||species]||null;
}
export const EARLY_KANTO_FORMS=Object.freeze({
 pidgey:['0016','0017','0018'],rattata:['0019','0020'],
 caterpie:['0010','0011','0012'],weedle:['0013','0014','0015'],
 pikachu:['0025','0026'],spearow:['0021','0022'],
 'nidoran-f':['0029','0030','0031'],'nidoran-m':['0032','0033','0034'],
 mankey:['0056','0057'],geodude:['0074','0075','0076'],
 paras:['0046','0047'],clefairy:['0035','0036'],
 sandshrew:['0027','0028'],ekans:['0023','0024'],
 staryu:['0120','0121'],psyduck:['0054','0055'],
 poliwag:['0060','0061','0062'],
 oddish:['0043','0044','0045'],bellsprout:['0069','0070','0071'],
 meowth:['0052','0053'],diglett:['0050','0051'],
 voltorb:['0100','0101'],magnemite:['0081','0082']
});
function nativeAttacks(original){
 const lookup=new Map();
 function read(kit){for(const move of Object.values(kit||{})){
  if(!move?.nombre||!move.forma)continue;
  const key=move.nombre.trim().toLowerCase();
  if(!lookup.has(key))lookup.set(key,move);
 }}
 for(const p of original){
  // Native evolutions often override only the NAME or damage of an earlier
  // move, inheriting its real 'forma' (e.g. Lopunny's Low Kick). Resolve
  // slot-by-slot exactly as the original client's move collector does.
  let inherited=p.kit||{};
  read(inherited);
  const merge=(a,b)=>Object.fromEntries(
   [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])]
    .map(slot=>[slot,{...(a?.[slot]||{}),...(b?.[slot]||{})}]));
  for(const e of p.evoluciones||[]){
   inherited=merge(inherited,e.kit||{});
   read(inherited);
   if(e.mega?.kit)read(merge(inherited,e.mega.kit));
  }
 }
 // Approved Torre 2 additions are available to the new families, but
 // native Poké Arena moves always win name collisions.
 for(const h of BATCH24_MOVES){
  const key=h.nombre.trim().toLowerCase();
  if(!lookup.has(key))lookup.set(key,h);
 }
 return lookup;
}
const CUSTOM=Object.freeze({
 'gust':['torre2_gust','FLYING',8,235,'Shoot'],
 'bug bite':['torre2_bugbite','BUG',12,74,'Swing'],
 'bite':['torre2_bite','DARK',12,76,'Swing'],
 'poison sting':['torre2_poisonsting','POISON',3,235,'Shoot'],
 'peck':['torre2_peck','FLYING',7,76,'Swing'],
 'fury attack':['torre2_furyattack','NORMAL',3,76,'Swing'],
 'double kick':['torre2_doublekick','FIGHTING',6,76,'Kick'],
 'horn attack':['torre2_hornattack','NORMAL',13,76,'Swing'],
 'hyper fang':['torre2_hyperfang','NORMAL',20,87,'Swing'],
 'super fang':['torre2_superfang','NORMAL',0,82,'Swing'],
 'rock tomb':['torre2_rocktomb','ROCK',12,235,'Throw'],
 'mud-slap':['torre2_mudslap','GROUND',4,205,'Throw'],
 'swift':['torre2_swift','NORMAL',10,250,'Shoot']
});
function move(name,native){
 const existing=native.get(name.toLowerCase());
 if(existing)return structuredClone(existing);
 const spec=CUSTOM[name.toLowerCase()];
 if(!spec)throw Error('Early Kanto move has no existing/native VFX: '+name);
 const [forma,tipo,dano,alcance,anim]=spec;
 return {nombre:name,forma,tipo,dano,alcance,cd:5,coste:16,anim,lanzar:.12};
}
// Original Phaser dodge implementation, only a small NON-DAMAGING dash.
// Never touched the captured client or any original Pokémon's actual esp.
const DODGE=Object.freeze({nombre:'Dodge',forma:'dash',tipo:'NORMAL',
 dano:0,dist:95,dur:.20,cd:4.2,anim:'Walk',estilo:'rapido'});
function kit(native,names,baseId,stageId){
 const slots=['lmb','rmb','q','e'],out={};
 const learned=EARLY_KANTO_LEARNSETS[stageId]||EARLY_KANTO_LEARNSETS[baseId]||{};
 const reqStage=baseId==='caterpie'&&names[3]==='Confusion'?2:
  baseId==='weedle'&&names[3]==='Fury Attack'?2:0;
 const stageIndex=stageId===baseId?0: // Butterfree/Beedrill are stage two.
  ['butterfree','beedrill','pidgeot','nidoqueen','nidoking','golem'].includes(stageId)?2:1;
 for(let i=0;i<slots.length;i++){
  const name=names[i];if(!name)continue;
  const moveData=move(name,native),id=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const futureForms=baseId==='caterpie'?['metapod','butterfree']:
   baseId==='weedle'?['kakuna','beedrill']:[];
  const futureLevels=futureForms.map(form=>EARLY_KANTO_LEARNSETS[form]?.[id])
   .filter(v=>Number.isInteger(v));
  const requiredLevel=learned[id]??(futureLevels.length?Math.min(...futureLevels):99);
  const evoLocked=(i===3&&stageIndex<reqStage);
  // Later moves are visible in the Pokédex, but inactive until unlocked.
  out[slots[i]]={...moveData,
   ...(requiredLevel>5||evoLocked?{pendiente:true,torre2UnlockLevel:requiredLevel,
    ...(evoLocked?{torre2UnlockEvolution:names[3]==='Confusion'?'Butterfree':'Beedrill'}:{})}:{})};
  // E is a genuine meter-gated Ultimate of the Arena 2D engine. Preserve
  // the move's artwork/stats, only gate its unlock on new Kanto species.
  if(i===3)out.e={...out.e,ulti:true};
 }
 out.esp={...DODGE};
 return out;
}
function evolutionaryLine(native,id,dex,name,types,stats,names,evolutions=[]){
 return {id,dex,nombre:name,tipos:types,rol:stats.role,
  lema:'KANTO WILD POKÉMON',hp:stats.hp,vel:stats.speed,
  atk:stats.attack,def:stats.defense,regen:4,ia:{rango:stats.range||102},
  kit:kit(native,names,id,id),
  evoluciones:evolutions.map(([dex,nombre,hp,tipos,attacks])=>{
   const stageId=nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-');
   return {dex,nombre,hp,tipos,
    kit:kit(native,attacks||EARLY_KANTO_SLOTS[stageId]||names,id,stageId)};
  })
 };
}
export function addEarlyKantoSpecies(original){
 const native=nativeAttacks(original);
 const lines=[
 evolutionaryLine(native,'pidgey','0016','PIDGEY',['NORMAL','FLYING'],
 {role:'DISTANCIA',hp:57,speed:130,attack:.83,defense:.85},
 ['Tackle','Gust','Quick Attack','Wing Attack'],[
 ['0017','PIDGEOTTO',73,['NORMAL','FLYING']],
 ['0018','PIDGEOT',90,['NORMAL','FLYING']]]),
 evolutionaryLine(native,'rattata','0019','RATTATA',['NORMAL'],
 {role:'FISICO',hp:52,speed:147,attack:.95,defense:.73},
 ['Tackle','Quick Attack','Bite','Hyper Fang'],[
 ['0020','RATICATE',81,['NORMAL']]]),
 evolutionaryLine(native,'caterpie','0010','CATERPIE',['BUG'],
 {role:'CONTROL',hp:55,speed:105,attack:.65,defense:.8},
 ['Tackle','String Shot','Bug Bite','Confusion'],[
 ['0011','METAPOD',72,['BUG']],
 ['0012','BUTTERFREE',85,['BUG','FLYING'],['Tackle','String Shot','Bug Bite','Confusion']]]),
 evolutionaryLine(native,'weedle','0013','WEEDLE',['BUG','POISON'],
 {role:'CONTROL',hp:53,speed:111,attack:.72,defense:.78},
 ['Tackle','Poison Sting','Bug Bite','Fury Attack'],[
 ['0014','KAKUNA',71,['BUG','POISON']],
 ['0015','BEEDRILL',86,['BUG','POISON'],['Tackle','Poison Sting','Bug Bite','Fury Attack']]]),
 evolutionaryLine(native,'pikachu','0025','PIKACHU',['ELECTRIC'],
 {role:'DISTANCIA',hp:60,speed:151,attack:1,defense:.80},
 ['Thunder Shock','Quick Attack','Swift','Thunderbolt'],[
 ['0026','RAICHU',84,['ELECTRIC']]]),
 evolutionaryLine(native,'spearow','0021','SPEAROW',['NORMAL','FLYING'],
 {role:'FISICO',hp:57,speed:143,attack:.92,defense:.78},
 ['Peck','Quick Attack','Fury Attack','Wing Attack'],[
 ['0022','FEAROW',85,['NORMAL','FLYING']]]),
 evolutionaryLine(native,'nidoran-f','0029','NIDORAN♀',['POISON'],
 {role:'FISICO',hp:65,speed:116,attack:.89,defense:.94},
 ['Tackle','Poison Sting','Double Kick','Horn Attack'],[
 ['0030','NIDORINA',82,['POISON']],
 ['0031','NIDOQUEEN',99,['POISON','GROUND']]]),
 evolutionaryLine(native,'nidoran-m','0032','NIDORAN♂',['POISON'],
 {role:'FISICO',hp:63,speed:118,attack:.92,defense:.91},
 ['Tackle','Poison Sting','Double Kick','Horn Attack'],[
 ['0033','NIDORINO',81,['POISON']],
 ['0034','NIDOKING',99,['POISON','GROUND']]]),
 evolutionaryLine(native,'mankey','0056','MANKEY',['FIGHTING'],
 {role:'FISICO',hp:61,speed:139,attack:1.02,defense:.79},
 ['Low Kick','Karate Chop','Quick Attack','Close Combat'],[
 ['0057','PRIMEAPE',87,['FIGHTING']]]),
 evolutionaryLine(native,'geodude','0074','GEODUDE',['ROCK','GROUND'],
 {role:'TANQUE',hp:82,speed:80,attack:1.05,defense:1.20},
 ['Tackle','Rock Throw','Mud-Slap','Rock Tomb'],[
 ['0075','GRAVELER',94,['ROCK','GROUND']],
 ['0076','GOLEM',109,['ROCK','GROUND']]]),
 // Misty's chapter: Mount Moon, Route 4 and Cerulean
 evolutionaryLine(native,'paras','0046','PARAS',['BUG','GRASS'],
 {role:'CONTROL',hp:59,speed:108,attack:.80,defense:.87},
 KANTO_ROUTE_SLOTS.paras,[['0047','PARASECT',82,['BUG','GRASS']]]),
 evolutionaryLine(native,'clefairy','0035','CLEFAIRY',['FAIRY'],
 {role:'CONTROL',hp:75,speed:105,attack:.76,defense:.86},
 KANTO_ROUTE_SLOTS.clefairy,[['0036','CLEFABLE',100,['FAIRY']]]),
 evolutionaryLine(native,'sandshrew','0027','SANDSHREW',['GROUND'],
 {role:'FISICO',hp:69,speed:117,attack:.98,defense:1.05},
 KANTO_ROUTE_SLOTS.sandshrew,[['0028','SANDSLASH',95,['GROUND']]]),
 evolutionaryLine(native,'ekans','0023','EKANS',['POISON'],
 {role:'FISICO',hp:64,speed:119,attack:.91,defense:.94},
 KANTO_ROUTE_SLOTS.ekans,[['0024','ARBOK',91,['POISON']]]),
 evolutionaryLine(native,'staryu','0120','STARYU',['WATER'],
 {role:'DISTANCIA',hp:66,speed:140,attack:.90,defense:.97},
 KANTO_ROUTE_SLOTS.staryu,[['0121','STARMIE',98,['WATER','PSYCHIC']]]),
 evolutionaryLine(native,'psyduck','0054','PSYDUCK',['WATER'],
 {role:'DISTANCIA',hp:68,speed:116,attack:.92,defense:.90},
 KANTO_ROUTE_SLOTS.psyduck,[['0055','GOLDUCK',92,['WATER']]]),
 evolutionaryLine(native,'poliwag','0060','POLIWAG',['WATER'],
 {role:'CONTROL',hp:64,speed:138,attack:.87,defense:.90},
 KANTO_ROUTE_SLOTS.poliwag,[
 ['0061','POLIWHIRL',84,['WATER']],
 ['0062','POLIWRATH',100,['WATER','FIGHTING']]]),
 // Surge's chapter: Cerulean north, Routes 5/6 and Vermilion
 evolutionaryLine(native,'oddish','0043','ODDISH',['GRASS','POISON'],
 {role:'CONTROL',hp:64,speed:104,attack:.88,defense:.92},
 KANTO_ROUTE_SLOTS.oddish,[
 ['0044','GLOOM',84,['GRASS','POISON']],
 ['0045','VILEPLUME',101,['GRASS','POISON']]]),
 evolutionaryLine(native,'bellsprout','0069','BELLSPROUT',['GRASS','POISON'],
 {role:'DISTANCIA',hp:60,speed:107,attack:.97,defense:.81},
 KANTO_ROUTE_SLOTS.bellsprout,[
 ['0070','WEEPINBELL',83,['GRASS','POISON']],
 ['0071','VICTREEBEL',103,['GRASS','POISON']]]),
 evolutionaryLine(native,'meowth','0052','MEOWTH',['NORMAL'],
 {role:'FISICO',hp:60,speed:148,attack:.97,defense:.80},
 KANTO_ROUTE_SLOTS.meowth,[['0053','PERSIAN',89,['NORMAL']]]),
 evolutionaryLine(native,'diglett','0050','DIGLETT',['GROUND'],
 {role:'FISICO',hp:53,speed:169,attack:1.06,defense:.70},
 KANTO_ROUTE_SLOTS.diglett,[['0051','DUGTRIO',80,['GROUND']]]),
 evolutionaryLine(native,'voltorb','0100','VOLTORB',['ELECTRIC'],
 {role:'DISTANCIA',hp:63,speed:163,attack:.96,defense:.90},
 KANTO_ROUTE_SLOTS.voltorb,[['0101','ELECTRODE',90,['ELECTRIC']]]),
 evolutionaryLine(native,'magnemite','0081','MAGNEMITE',['ELECTRIC','STEEL'],
 {role:'DISTANCIA',hp:67,speed:109,attack:1.05,defense:1.13},
 KANTO_ROUTE_SLOTS.magnemite,[['0082','MAGNETON',96,['ELECTRIC','STEEL']]])
 ];
 const known=new Set(original.map(p=>p.id));
 return lines.filter(p=>!known.has(p.id));
}
