/* Pokémon Torre 2: strictly additive early-Kanto Pokémon lines.
 * Reuses already-installed Poké Arena move renderers by original move name,
 * and user-approved Torre 2 effects where a move was missing. Never changes
 * the native species, their sprites, approved attacks or battle UI.
 */
export const EARLY_KANTO_BASE=Object.freeze([
 'pidgey','rattata','caterpie','weedle','pikachu',
 'spearow','nidoran-f','nidoran-m','mankey','geodude'
]);
export const EARLY_KANTO_LEARNSETS=Object.freeze({
 pidgey:{tackle:1,'gust':9,'quick-attack':13,'wing-attack':25},
 pidgeotto:{tackle:1,gust:9,'quick-attack':13,'wing-attack':25},
 pidgeot:{tackle:1,gust:9,'quick-attack':13,'wing-attack':25},
 rattata:{tackle:1,'quick-attack':7,bite:10,'hyper-fang':13,'super-fang':34},
 raticate:{tackle:1,'quick-attack':7,bite:10,'hyper-fang':13,'super-fang':34},
 caterpie:{tackle:1,'bug-bite':9},metapod:{tackle:1,'bug-bite':9},
 butterfree:{tackle:1,'bug-bite':9,gust:10,confusion:10},
 weedle:{tackle:1,'poison-sting':1,'bug-bite':9},
 kakuna:{tackle:1,'poison-sting':1,'bug-bite':9},
 beedrill:{tackle:1,'poison-sting':1,'bug-bite':9,peck:10,'fury-attack':16},
 pikachu:{'thunder-shock':1,'quick-attack':10,swift:21,thunderbolt:26},
 raichu:{'thunder-shock':1,'quick-attack':10,swift:21,thunderbolt:26},
 spearow:{peck:1,'quick-attack':13,'fury-attack':17},
 fearow:{peck:1,'quick-attack':13,'fury-attack':17},
 'nidoran-f':{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidorina:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidoqueen:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 'nidoran-m':{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidorino:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 nidoking:{tackle:1,'poison-sting':1,'double-kick':12,'horn-attack':20},
 mankey:{'low-kick':1,'karate-chop':10,'quick-attack':12},
 primeape:{'low-kick':1,'karate-chop':10,'quick-attack':12},
 geodude:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15},
 graveler:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15},
 golem:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15}
});
export const EARLY_KANTO_FORMS=Object.freeze({
 pidgey:['0016','0017','0018'],rattata:['0019','0020'],
 caterpie:['0010','0011','0012'],weedle:['0013','0014','0015'],
 pikachu:['0025','0026'],spearow:['0021','0022'],
 'nidoran-f':['0029','0030','0031'],'nidoran-m':['0032','0033','0034'],
 mankey:['0056','0057'],geodude:['0074','0075','0076']
});
function nativeAttacks(original){
 const lookup=new Map();
 function read(kit){for(const move of Object.values(kit||{})){
  if(!move?.nombre||!move.forma)continue;
  const key=move.nombre.trim().toLowerCase();
  if(!lookup.has(key))lookup.set(key,move);
 }}
 for(const p of original){
  read(p.kit);
  for(const e of p.evoluciones||[]){
   read(e.kit);if(e.mega)read(e.mega.kit);
  }
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
function kit(native,names){
 const slots=['lmb','rmb','q','e'];
 return Object.fromEntries(names.slice(0,4).map((n,i)=>[slots[i],move(n,native)]));
}
function evolutionaryLine(native,id,dex,name,types,stats,names,evolutions=[]){
 return {id,dex,nombre:name,tipos:types,rol:stats.role,
  lema:'KANTO WILD POKÉMON',hp:stats.hp,vel:stats.speed,
  atk:stats.attack,def:stats.defense,regen:4,ia:{rango:stats.range||102},
  kit:kit(native,names),
  evoluciones:evolutions.map(([dex,nombre,hp,tipos,attacks])=>({
   dex,nombre,hp,tipos,kit:kit(native,attacks||names)
  }))
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
 ['Tackle','Bug Bite'],[
 ['0011','METAPOD',72,['BUG']],
 ['0012','BUTTERFREE',85,['BUG','FLYING'],['Tackle','Bug Bite','Gust','Confusion']]]),
 evolutionaryLine(native,'weedle','0013','WEEDLE',['BUG','POISON'],
 {role:'CONTROL',hp:53,speed:111,attack:.72,defense:.78},
 ['Tackle','Poison Sting','Bug Bite'],[
 ['0014','KAKUNA',71,['BUG','POISON']],
 ['0015','BEEDRILL',86,['BUG','POISON'],['Poison Sting','Bug Bite','Peck','Fury Attack']]]),
 evolutionaryLine(native,'pikachu','0025','PIKACHU',['ELECTRIC'],
 {role:'DISTANCIA',hp:60,speed:151,attack:1,defense:.80},
 ['Thunder Shock','Quick Attack','Swift','Thunderbolt'],[
 ['0026','RAICHU',84,['ELECTRIC']]]),
 evolutionaryLine(native,'spearow','0021','SPEAROW',['NORMAL','FLYING'],
 {role:'FISICO',hp:57,speed:143,attack:.92,defense:.78},
 ['Peck','Quick Attack','Fury Attack'],[
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
 ['Low Kick','Karate Chop','Quick Attack'],[
 ['0057','PRIMEAPE',87,['FIGHTING']]]),
 evolutionaryLine(native,'geodude','0074','GEODUDE',['ROCK','GROUND'],
 {role:'TANQUE',hp:82,speed:80,attack:1.05,defense:1.20},
 ['Tackle','Rock Throw','Rock Tomb','Mud-Slap'],[
 ['0075','GRAVELER',94,['ROCK','GROUND']],
 ['0076','GOLEM',109,['ROCK','GROUND']]])
 ];
 const known=new Set(original.map(p=>p.id));
 return lines.filter(p=>!known.has(p.id));
}
