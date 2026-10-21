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
 golem:{tackle:1,'rock-throw':11,'rock-tomb':13,'mud-slap':15}
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
 geodude:['Tackle','Rock Throw','Mud-Slap','Rock Tomb']
});
const EVO_TO_BASE=Object.freeze({
 pidgeotto:'pidgey',pidgeot:'pidgey',raticate:'rattata',
 metapod:'caterpie',butterfree:'caterpie',kakuna:'weedle',beedrill:'weedle',
 raichu:'pikachu',fearow:'spearow',nidorina:'nidoran-f',nidoqueen:'nidoran-f',
 nidorino:'nidoran-m',nidoking:'nidoran-m',primeape:'mankey',
 graveler:'geodude',golem:'geodude'
});
export function earlyKantoSlotPlan(species){
 return EARLY_KANTO_SLOTS[EVO_TO_BASE[species]||species]||null;
}
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
  const requiredLevel=learned[id]??99;
  const evoLocked=(i===3&&stageIndex<reqStage);
  // Later moves are visible in the Pokédex, but inactive until unlocked.
  out[slots[i]]={...moveData,
   ...(requiredLevel>5||evoLocked?{pendiente:true,torre2UnlockLevel:requiredLevel,
    torre2UnlockEvolution:evoLocked?names[3]==='Confusion'?'Butterfree':'Beedrill':null}:{})};
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
    kit:kit(native,attacks||names,id,stageId)};
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
 ['Tackle','Rock Throw','Rock Tomb','Mud-Slap'],[
 ['0075','GRAVELER',94,['ROCK','GROUND']],
 ['0076','GOLEM',109,['ROCK','GROUND']]])
 ];
 const known=new Set(original.map(p=>p.id));
 return lines.filter(p=>!known.has(p.id));
}
