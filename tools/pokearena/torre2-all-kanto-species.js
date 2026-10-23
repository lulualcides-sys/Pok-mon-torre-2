/* Pokémon Torre 2 — Kanto 001–151. Source metadata: PokeAPI/pokeapi
 * pokemon.csv, pokemon_types.csv, pokemon_stats.csv (offline snapshot).
 * Original Poké Arena effects and already installed native forms untouched.
 */
import {LEVEL_EVOLUTIONS} from './progression.js';
import {nativeAttacks} from './early-kanto-species.js';
export const KANTO_151=Object.freeze([[1,"bulbasaur",["GRASS","POISON"],45,49,49,65,65,45],[2,"ivysaur",["GRASS","POISON"],60,62,63,80,80,60],[3,"venusaur",["GRASS","POISON"],80,82,83,100,100,80],[4,"charmander",["FIRE"],39,52,43,60,50,65],[5,"charmeleon",["FIRE"],58,64,58,80,65,80],[6,"charizard",["FIRE","FLYING"],78,84,78,109,85,100],[7,"squirtle",["WATER"],44,48,65,50,64,43],[8,"wartortle",["WATER"],59,63,80,65,80,58],[9,"blastoise",["WATER"],79,83,100,85,105,78],[10,"caterpie",["BUG"],45,30,35,20,20,45],[11,"metapod",["BUG"],50,20,55,25,25,30],[12,"butterfree",["BUG","FLYING"],60,45,50,90,80,70],[13,"weedle",["BUG","POISON"],40,35,30,20,20,50],[14,"kakuna",["BUG","POISON"],45,25,50,25,25,35],[15,"beedrill",["BUG","POISON"],65,90,40,45,80,75],[16,"pidgey",["NORMAL","FLYING"],40,45,40,35,35,56],[17,"pidgeotto",["NORMAL","FLYING"],63,60,55,50,50,71],[18,"pidgeot",["NORMAL","FLYING"],83,80,75,70,70,101],[19,"rattata",["NORMAL"],30,56,35,25,35,72],[20,"raticate",["NORMAL"],55,81,60,50,70,97],[21,"spearow",["NORMAL","FLYING"],40,60,30,31,31,70],[22,"fearow",["NORMAL","FLYING"],65,90,65,61,61,100],[23,"ekans",["POISON"],35,60,44,40,54,55],[24,"arbok",["POISON"],60,95,69,65,79,80],[25,"pikachu",["ELECTRIC"],35,55,40,50,50,90],[26,"raichu",["ELECTRIC"],60,90,55,90,80,110],[27,"sandshrew",["GROUND"],50,75,85,20,30,40],[28,"sandslash",["GROUND"],75,100,110,45,55,65],[29,"nidoran-f",["POISON"],55,47,52,40,40,41],[30,"nidorina",["POISON"],70,62,67,55,55,56],[31,"nidoqueen",["POISON","GROUND"],90,92,87,75,85,76],[32,"nidoran-m",["POISON"],46,57,40,40,40,50],[33,"nidorino",["POISON"],61,72,57,55,55,65],[34,"nidoking",["POISON","GROUND"],81,102,77,85,75,85],[35,"clefairy",["FAIRY"],70,45,48,60,65,35],[36,"clefable",["FAIRY"],95,70,73,95,90,60],[37,"vulpix",["FIRE"],38,41,40,50,65,65],[38,"ninetales",["FIRE"],73,76,75,81,100,100],[39,"jigglypuff",["NORMAL","FAIRY"],115,45,20,45,25,20],[40,"wigglytuff",["NORMAL","FAIRY"],140,70,45,85,50,45],[41,"zubat",["POISON","FLYING"],40,45,35,30,40,55],[42,"golbat",["POISON","FLYING"],75,80,70,65,75,90],[43,"oddish",["GRASS","POISON"],45,50,55,75,65,30],[44,"gloom",["GRASS","POISON"],60,65,70,85,75,40],[45,"vileplume",["GRASS","POISON"],75,80,85,110,90,50],[46,"paras",["BUG","GRASS"],35,70,55,45,55,25],[47,"parasect",["BUG","GRASS"],60,95,80,60,80,30],[48,"venonat",["BUG","POISON"],60,55,50,40,55,45],[49,"venomoth",["BUG","POISON"],70,65,60,90,75,90],[50,"diglett",["GROUND"],10,55,25,35,45,95],[51,"dugtrio",["GROUND"],35,100,50,50,70,120],[52,"meowth",["NORMAL"],40,45,35,40,40,90],[53,"persian",["NORMAL"],65,70,60,65,65,115],[54,"psyduck",["WATER"],50,52,48,65,50,55],[55,"golduck",["WATER"],80,82,78,95,80,85],[56,"mankey",["FIGHTING"],40,80,35,35,45,70],[57,"primeape",["FIGHTING"],65,105,60,60,70,95],[58,"growlithe",["FIRE"],55,70,45,70,50,60],[59,"arcanine",["FIRE"],90,110,80,100,80,95],[60,"poliwag",["WATER"],40,50,40,40,40,90],[61,"poliwhirl",["WATER"],65,65,65,50,50,90],[62,"poliwrath",["WATER","FIGHTING"],90,95,95,70,90,70],[63,"abra",["PSYCHIC"],25,20,15,105,55,90],[64,"kadabra",["PSYCHIC"],40,35,30,120,70,105],[65,"alakazam",["PSYCHIC"],55,50,45,135,95,120],[66,"machop",["FIGHTING"],70,80,50,35,35,35],[67,"machoke",["FIGHTING"],80,100,70,50,60,45],[68,"machamp",["FIGHTING"],90,130,80,65,85,55],[69,"bellsprout",["GRASS","POISON"],50,75,35,70,30,40],[70,"weepinbell",["GRASS","POISON"],65,90,50,85,45,55],[71,"victreebel",["GRASS","POISON"],80,105,65,100,70,70],[72,"tentacool",["WATER","POISON"],40,40,35,50,100,70],[73,"tentacruel",["WATER","POISON"],80,70,65,80,120,100],[74,"geodude",["ROCK","GROUND"],40,80,100,30,30,20],[75,"graveler",["ROCK","GROUND"],55,95,115,45,45,35],[76,"golem",["ROCK","GROUND"],80,120,130,55,65,45],[77,"ponyta",["FIRE"],50,85,55,65,65,90],[78,"rapidash",["FIRE"],65,100,70,80,80,105],[79,"slowpoke",["WATER","PSYCHIC"],90,65,65,40,40,15],[80,"slowbro",["WATER","PSYCHIC"],95,75,110,100,80,30],[81,"magnemite",["ELECTRIC","STEEL"],25,35,70,95,55,45],[82,"magneton",["ELECTRIC","STEEL"],50,60,95,120,70,70],[83,"farfetchd",["NORMAL","FLYING"],52,90,55,58,62,60],[84,"doduo",["NORMAL","FLYING"],35,85,45,35,35,75],[85,"dodrio",["NORMAL","FLYING"],60,110,70,60,60,110],[86,"seel",["WATER"],65,45,55,45,70,45],[87,"dewgong",["WATER","ICE"],90,70,80,70,95,70],[88,"grimer",["POISON"],80,80,50,40,50,25],[89,"muk",["POISON"],105,105,75,65,100,50],[90,"shellder",["WATER"],30,65,100,45,25,40],[91,"cloyster",["WATER","ICE"],50,95,180,85,45,70],[92,"gastly",["GHOST","POISON"],30,35,30,100,35,80],[93,"haunter",["GHOST","POISON"],45,50,45,115,55,95],[94,"gengar",["GHOST","POISON"],60,65,60,130,75,110],[95,"onix",["ROCK","GROUND"],35,45,160,30,45,70],[96,"drowzee",["PSYCHIC"],60,48,45,43,90,42],[97,"hypno",["PSYCHIC"],85,73,70,73,115,67],[98,"krabby",["WATER"],30,105,90,25,25,50],[99,"kingler",["WATER"],55,130,115,50,50,75],[100,"voltorb",["ELECTRIC"],40,30,50,55,55,100],[101,"electrode",["ELECTRIC"],60,50,70,80,80,150],[102,"exeggcute",["GRASS","PSYCHIC"],60,40,80,60,45,40],[103,"exeggutor",["GRASS","PSYCHIC"],95,95,85,125,75,55],[104,"cubone",["GROUND"],50,50,95,40,50,35],[105,"marowak",["GROUND"],60,80,110,50,80,45],[106,"hitmonlee",["FIGHTING"],50,120,53,35,110,87],[107,"hitmonchan",["FIGHTING"],50,105,79,35,110,76],[108,"lickitung",["NORMAL"],90,55,75,60,75,30],[109,"koffing",["POISON"],40,65,95,60,45,35],[110,"weezing",["POISON"],65,90,120,85,70,60],[111,"rhyhorn",["GROUND","ROCK"],80,85,95,30,30,25],[112,"rhydon",["GROUND","ROCK"],105,130,120,45,45,40],[113,"chansey",["NORMAL"],250,5,5,35,105,50],[114,"tangela",["GRASS"],65,55,115,100,40,60],[115,"kangaskhan",["NORMAL"],105,95,80,40,80,90],[116,"horsea",["WATER"],30,40,70,70,25,60],[117,"seadra",["WATER"],55,65,95,95,45,85],[118,"goldeen",["WATER"],45,67,60,35,50,63],[119,"seaking",["WATER"],80,92,65,65,80,68],[120,"staryu",["WATER"],30,45,55,70,55,85],[121,"starmie",["WATER","PSYCHIC"],60,75,85,100,85,115],[122,"mr-mime",["PSYCHIC","FAIRY"],40,45,65,100,120,90],[123,"scyther",["BUG","FLYING"],70,110,80,55,80,105],[124,"jynx",["ICE","PSYCHIC"],65,50,35,115,95,95],[125,"electabuzz",["ELECTRIC"],65,83,57,95,85,105],[126,"magmar",["FIRE"],65,95,57,100,85,93],[127,"pinsir",["BUG"],65,125,100,55,70,85],[128,"tauros",["NORMAL"],75,100,95,40,70,110],[129,"magikarp",["WATER"],20,10,55,15,20,80],[130,"gyarados",["WATER","FLYING"],95,125,79,60,100,81],[131,"lapras",["WATER","ICE"],130,85,80,85,95,60],[132,"ditto",["NORMAL"],48,48,48,48,48,48],[133,"eevee",["NORMAL"],55,55,50,45,65,55],[134,"vaporeon",["WATER"],130,65,60,110,95,65],[135,"jolteon",["ELECTRIC"],65,65,60,110,95,130],[136,"flareon",["FIRE"],65,130,60,95,110,65],[137,"porygon",["NORMAL"],65,60,70,85,75,40],[138,"omanyte",["ROCK","WATER"],35,40,100,90,55,35],[139,"omastar",["ROCK","WATER"],70,60,125,115,70,55],[140,"kabuto",["ROCK","WATER"],30,80,90,55,45,55],[141,"kabutops",["ROCK","WATER"],60,115,105,65,70,80],[142,"aerodactyl",["ROCK","FLYING"],80,105,65,60,75,130],[143,"snorlax",["NORMAL"],160,110,65,65,110,30],[144,"articuno",["ICE","FLYING"],90,85,100,95,125,85],[145,"zapdos",["ELECTRIC","FLYING"],90,90,85,125,90,100],[146,"moltres",["FIRE","FLYING"],90,100,90,125,85,90],[147,"dratini",["DRAGON"],41,64,45,50,50,50],[148,"dragonair",["DRAGON"],61,84,65,70,70,70],[149,"dragonite",["DRAGON","FLYING"],91,134,95,100,100,80],[150,"mewtwo",["PSYCHIC"],106,110,90,154,90,130],[151,"mew",["PSYCHIC"],100,100,100,100,100,100]].map(([num,id,tipos,hp,atk,def,spa,spd,speed])=>
 Object.freeze({num,id,tipos,hp,atk,def,spa,spd,speed})));
export const KANTO_151_IDS=Object.freeze(KANTO_151.map(p=>p.id));
const byId=new Map(KANTO_151.map(p=>[p.id,p]));
const parent=new Map();
for(const [species,rules] of Object.entries(LEVEL_EVOLUTIONS))
 for(const {to} of rules)if(byId.has(species)&&byId.has(to)&&!parent.has(to))
  parent.set(to,species);
function root(id){let x=id;const seen=new Set();
 while(parent.has(x)&&!seen.has(x)){seen.add(x);x=parent.get(x);}return x;}
const families=new Map();
for(const p of KANTO_151){const id=root(p.id),list=families.get(id)||[];
 list.push(p);families.set(id,list);}
export const KANTO_151_BASES=Object.freeze([...families.keys()]);
const plans=new Map();
export const kanto151SlotPlan=id=>plans.get(id)||null;
const DODGE={nombre:'Dodge',forma:'dash',tipo:'NORMAL',dano:0,dist:95,dur:.20,cd:4.2,anim:'Walk'};
const choices={
 NORMAL:['Tackle','Quick Attack','Pound','Scratch','Swift','Body Slam','Hyper Beam'],
 FIRE:['Ember','Flame Wheel','Fire Punch','Fire Spin','Flamethrower','Fire Blast'],
 WATER:['Water Gun','Bubble Beam','Water Pulse','Surf','Hydro Pump'],
 GRASS:['Absorb','Vine Whip','Razor Leaf','Seed Bomb','Solar Beam'],
 ELECTRIC:['Thunder Shock','Spark','Thunder Punch','Thunderbolt','Thunder'],
 ROCK:['Rock Throw','Rock Tomb','Rock Blast','Rock Slide'],
 GROUND:['Mud-Slap','Dig','Earth Power','Earthquake'],
 PSYCHIC:['Confusion','Psybeam','Psychic'],
 GHOST:['Lick','Shadow Ball','Night Shade'],
 POISON:['Poison Sting','Acid','Sludge Bomb'],
 FIGHTING:['Low Kick','Karate Chop','Double Kick','Cross Chop','Close Combat'],
 FLYING:['Gust','Peck','Wing Attack','Aerial Ace','Air Cutter'],
 BUG:['Bug Bite','Fury Cutter','X-Scissor'],
 ICE:['Ice Shard','Icy Wind','Ice Punch','Ice Beam'],
 DRAGON:['Twister','Dragon Breath','Dragon Pulse'],
 STEEL:['Metal Claw','Flash Cannon'],
 FAIRY:['Disarming Voice','Dazzling Gleam'],
 DARK:['Bite','Crunch','Dark Pulse']};
const damage=m=>Number.isFinite(m?.dano)?m.dano:0;
function kitFor(p,lib){
 const pool=[...lib.values()].filter(m=>m?.nombre&&m.forma&&damage(m)>0&&
  !['dash','evolucionar','megaevolucionar','renacer'].includes(m.forma));
 const named=new Map(pool.map(m=>[m.nombre.toLowerCase(),m]));
 const pref=p.tipos.flatMap(t=>(choices[t]||[]).map(n=>named.get(n.toLowerCase()))).filter(Boolean);
 const sorted=[...pool].sort((a,b)=>damage(a)-damage(b));
 // Prefer an affordable STAB move; only fall back to Normal when the
 // captured native catalog lacks a weak move of this Pokémon's actual type.
 const basic=[...pref,...choices.NORMAL.map(n=>named.get(n.toLowerCase())),...sorted]
  .find(x=>x&&damage(x)<=12);
 const themed=pool.filter(m=>p.tipos.includes(m.tipo)).sort((a,b)=>damage(a)-damage(b));
 const arr=[],seen=new Set();
 for(const m of [basic,...pref,...themed,...sorted]){
  if(!m||seen.has(m.nombre.toLowerCase()))continue;
  seen.add(m.nombre.toLowerCase());arr.push(m);
 }
 if(arr.length<4)throw Error('No installed Kanto moves: '+p.id);
 const typeFinishers=arr.slice(1).filter(m=>p.tipos.includes(m.tipo));
 const ultimate=(typeFinishers.length?typeFinishers:arr.slice(1))
  .sort((a,b)=>damage(b)-damage(a))[0];
 const chosen=[arr[0],...arr.filter(m=>m!==arr[0]&&m!==ultimate).slice(0,2),ultimate];
 if(chosen.length!==4||new Set(chosen.map(m=>m.nombre)).size!==4)
  throw Error('Invalid Kanto moves: '+p.id);
 const slots=['lmb','rmb','q','e'],kit={esp:{...DODGE}};
 for(let i=0;i<4;i++)kit[slots[i]]={...structuredClone(chosen[i]),...(i===3?{ulti:true}:{})};
 plans.set(p.id,chosen.map(m=>m.nombre));
 return kit;
}
const stats=p=>({hp:Math.round(40+p.hp*.63),vel:Math.round(58+p.speed*.66),
 atk:Math.round((p.atk+p.spa)/2)/85,def:Math.round((p.def+p.spd)/2)/82,regen:4});
export function addAllKantoSpecies(original){
 const known=new Set();
 for(const p of original){known.add(p.id);
  for(const e of p.evoluciones||[])known.add(e.nombre.toLowerCase());}
 const pool=nativeAttacks(original),added=[];
 for(const [id,members] of families){
  if(known.has(id))continue;
  const p=byId.get(id);
  added.push({id,dex:String(p.num).padStart(4,'0'),nombre:id.toUpperCase(),
   tipos:[...p.tipos],rol:'DISTANCIA',lema:'KANTO POKÉMON',
   ...stats(p),ia:{rango:115},torre2Kanto151:true,
   kit:kitFor(p,pool),evoluciones:members.filter(e=>e.id!==id&&!known.has(e.id))
    .map(e=>({dex:String(e.num).padStart(4,'0'),nombre:e.id.toUpperCase(),
      tipos:[...e.tipos],...stats(e),kit:kitFor(e,pool)}))});
 }
 return added;
}
