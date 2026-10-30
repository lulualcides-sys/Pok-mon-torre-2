/* Arena, Training, VS CPU and League ONLY. Never touch campaign FRLG
 * unlocks, source-client sprites, hitboxes or approved VFX.
 * Reuse the installed native/approved renderer belonging to each move.
 */
import {frlgUnlockLevel,frlgMachineCompatible} from './torre2-frlg-learnsets.js';
import {ARENA_APPROVED_121} from './torre2-arena-approved-121.js';
import {selectNativeDodge,ARENA_NATIVE_DODGE_FORMS} from './torre2-arena-native-dodges.js';
import {BATCH24_MOVES} from './batch24/catalog.js';
import {SURGE3_MOVES} from './surge3/catalog.js';
import {FINALE_13_MOVES,POISON_PUNCH_MOVES} from './torre2-finale13-catalog.js';
const idOf=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const ATTACK_SLOTS=['lmb','rmb','q','e'];
export const PROTECTED_P2_KANTO_IDS=new Set([
 'bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard',
 'squirtle','wartortle','blastoise','pikachu','raichu','zubat','golbat',
 'machop','machoke','machamp','ponyta','rapidash','gastly','haunter',
 'gengar','onix','exeggcute','exeggutor','magikarp','gyarados','snorlax',
 'articuno','zapdos','mewtwo'
]);
// Protect verified native species even if a later upstream capture temporarily
// omits the parent (e.g. Pichu) and our additive roster reintroduces its child.
// User-requested fast Arena 2D pace (2–4 seconds) for only these moves.
// NEVER mutate original native VFX/metadata; never apply during campaign.
const ARENA_CD=Object.freeze({
 'blizzard':4,'blizard':4,'ventisca':4,
 'thunder':3,
 'psybeam':3,'psy-beam':3,
 'discharge':3,'descarga':3,
 'fire-blast':3.5,'llamarada':3.5,
 'solar-beam':3,'solarbeam':3,'rayo-solar':3,
 'charge':3,'carga':3,
 'hydro-pump':3.5,'hidrobomba':3.5,
 'hyper-beam':4,'hiperrayo':4,
 'seismic-toss':3,'sismic-toss':3,'movimiento-sismico':3,
 'egg-bomb':3,'eggbomb':3,'bomba-de-ovo':3,'bomba-ovo':3,
 'bomba-de-ovos':3,'bomba-de-huevos':3,'bomba-huevo':3,'bomba-de-huevo':3
});
const RESERVED_HYPER_BEAM=new Set(['dragonite','gyarados','snorlax','tauros','aerodactyl','mewtwo']);
// Previously approved, characteristic moves. Never fabricate visual effects.
const SIGNATURES=Object.freeze({
 'meowth':'Pay Day','persian':'Pay Day','rattata':'Hyper Fang','raticate':'Hyper Fang',
 'cubone':'Bone Club','marowak':'Bonemerang','porygon':'Tri Attack','magneton':'Tri Attack',
 'kingler':'Crabhammer','krabby':'Crabhammer','vileplume':'Petal Dance',
 'gengar':'Shadow Ball','haunter':'Shadow Ball','gastly':'Shadow Ball',
 'clefairy':'Metronome','clefable':'Metronome','mew':'Metronome',
 'chansey':'Soft-Boiled','jynx':'Lovely Kiss','koffing':'Smog',
 'weezing':'Sludge Bomb','muk':'Sludge Bomb','grimer':'Acid',
 'beedrill':'Fury Attack','butterfree':'Confusion','fearow':'Drill Peck',
 'gyarados':'Hydro Pump','lapras':'Ice Beam','blastoise':'Hydro Pump',
 'charizard':'Flamethrower','venusaur':'Razor Leaf','dragonite':'Dragon Pulse',
 'pikachu':'Thunderbolt','raichu':'Thunderbolt','jolteon':'Thunderbolt',
 'flareon':'Fire Blast','vaporeon':'Hydro Pump','alakazam':'Psychic',
 'machamp':'Cross Chop','primeape':'Cross Chop','sandslash':'Dig',
 'nidoking':'Earthquake','nidoqueen':'Earthquake','golem':'Earthquake',
 'rapidash':'Fire Blast','arcanine':'Flamethrower','parasect':'X-Scissor',
 'starmie':'Psychic','electrode':'Sonic Boom','magikarp':'Splash'
});
// Only an EMPTY fourth Arena role may receive one of these installed,
// official Gen III TM-compatible moves. No VFX added and no campaign grant.
const FOURTH_ROLE_GAPS=Object.freeze({
 dragonair:'hyper-beam',clefable:'psychic'
});
const SPECIAL_APPROVED=Object.freeze({
 'marowak':['bonemerang','bone-club'],'cubone':['bone-club'],
 'porygon':['tri-attack'],'magneton':['tri-attack'],
 'kingler':['crabhammer'],'krabby':['crabhammer'],
 'vileplume':['petal-dance'],'parasect':['x-scissor'],
 'dragonite':['dragon-pulse'], 'jynx':['lovely-kiss'],
 'koffing':['smog'], 'mew':['metronome'], 'clefairy':['metronome'],
 'clefable':['metronome']
});
const eligible=(id,m,types=[])=>{
 const key=idOf(m?.nombre);
 if(!key||!m?.forma||['dash','evolucionar','megaevolucionar','renacer'].includes(m.forma))return false;
 // A legally compatible TM is NOT an automatically appropriate signature move.
 // Do not give Blizzard to Raticate, Solar Beam to Clefairy, etc. Off-type
 // moves are eligible only when they are natural learned moves or signatures.
 if(key==='hyper-beam')
  return RESERVED_HYPER_BEAM.has(id)&&frlgMachineCompatible(id,key);
 const natural=frlgUnlockLevel(id,key)!==null;
 const characteristic=idOf(SIGNATURES[id])===key||
  (SPECIAL_APPROVED[id]||[]).includes(key);
 const ownTypeTM=types.includes(m.tipo)&&frlgMachineCompatible(id,key);
 return natural||characteristic||ownTypeTM;
};
const power=m=>Number.isFinite(m?.dano)?m.dano:0;
export function enforceArenaMoveCooldowns(kit){
 if(!kit||typeof kit!=='object')return kit;
 let output=kit;
 for(const slot of ATTACK_SLOTS){
  const h=kit[slot],target=ARENA_CD[idOf(h?.nombre)];
  if(!target)continue;
  // Normalize both missing/zero and previously overlong cooldowns.
  if(h.cd!==target){
   if(output===kit)output={...kit};
   output[slot]={...h,cd:target};
  }
 }
 return output;
}
// Gengar is a native Arena fighter, so the added-species filter does not
// sanitize its original kit. Replace any generic Hyper Beam OR repeated
// attack with a genuinely installed distinct Gengar-compatible renderer.
// Prefer Dark Pulse: its approved pixel-art VFX is already in Batch 24 and
// this Gen IV technique belongs in Arena, never the FRLG campaign learnset.
// Keep Shadow Ball as the thematic E/ULT, even when upstream kits move it.
export function replaceGengarHyperBeam(kit,library){
 if(!kit||!library)return kit;
 // A later upstream Gengar stage may put Night Shade on E. Keep the
 // species' real Shadow Ball as ULT, using the original renderer when
 // equipped elsewhere. Do not clone it into two attack slots.
 const nativeShadow=library.get('shadow-ball');
 const validShadow=nativeShadow?.forma&&nativeShadow?.approved!==false&&Number(nativeShadow.dano)>0;
 let output=kit;
 if(validShadow&&idOf(output.e?.nombre)!=='shadow-ball'){
  const elsewhere=ATTACK_SLOTS.slice(0,3).find(s=>idOf(output[s]?.nombre)==='shadow-ball');
  const oldE=output.e;
  output={...output,e:{...(elsewhere?output[elsewhere]:nativeShadow),pendiente:false,ulti:true}};
  if(elsewhere&&oldE)output[elsewhere]={...oldE,pendiente:false,ulti:false};
 }else if(idOf(output.e?.nombre)==='shadow-ball'&&output.e?.ulti!==true){
  output={...output,e:{...output.e,ulti:true}};
 }
 const preferred=['dark-pulse','shadow-punch','night-shade','psychic',
  'dream-eater','shadow-ball','sludge-bomb'];
 const used=new Set();
 let output=kit;
 for(const slot of ATTACK_SLOTS){
  const key=idOf(output[slot]?.nombre);
  if(!key)continue;
  if(key!=='hyper-beam'&&!used.has(key)){
   used.add(key);
   continue;
  }
  // Include all four occupied slots, including later ones, so replacing
  // Sludge Bomb cannot accidentally duplicate Shadow Ball or another move.
  const occupied=new Set(ATTACK_SLOTS.map(s=>idOf(output[s]?.nombre)).filter(Boolean));
  const move=preferred.map(name=>library.get(name)).find(m=>m?.forma&&
   m?.approved!==false&&Number(m.dano)>0&&!occupied.has(idOf(m.nombre)));
  if(!move){used.add(key);continue;} // no invented forms or illegal changes
  if(output===kit)output={...kit};
  output[slot]={...move,pendiente:false,ulti:slot==='e'};
  used.add(idOf(move.nombre));
 }
 return output;
}
export function selectArenaSpeciesKit(kit,species,types,library){
 const id=idOf(species),signature=idOf(SIGNATURES[id]);
 if(!kit||!id)return kit;
 const valid=new Map(),prefer=(m)=>m?.forma&&eligible(id,m,types);
 // Preserve exact renderer/metadata from existing stage; then native library.
 for(const m of ATTACK_SLOTS.map(s=>kit[s]).concat([...library.values()])){
  if(!prefer(m))continue;
  const k=idOf(m.nombre);
  if(!valid.has(k)||(!valid.get(k).forma.startsWith('torre2_')&&m.forma.startsWith('torre2_')))
   valid.set(k,m);
 }
 const pool=[...valid.values()];
 if(!pool.length)return enforceArenaMoveCooldowns(kit);
 const kind=new Set(types||[]);
 const label=m=>idOf(m.nombre),same=(a,b)=>label(a)===label(b);
 const selected=[],used=new Set();
 const add=m=>{if(m&&!used.has(label(m))){selected.push(m);used.add(label(m));}};
 const byPower=[...pool].sort((a,b)=>power(a)-power(b)||Number(kind.has(b.tipo))-Number(kind.has(a.tipo)));
 // Keep a genuine weak ATK. Never make Hyper Beam the basic attack.
 const basic=byPower.filter(m=>label(m)!==signature&&label(m)!=='hyper-beam');
 add(basic.find(m=>power(m)>0&&power(m)<=12)||
     basic.find(m=>power(m)>0)||
     byPower.find(m=>power(m)>0&&label(m)!=='hyper-beam'));
 const signatureMove=pool.find(m=>label(m)===signature);
 const other=[...pool].filter(m=>!used.has(label(m))&&power(m)>0)
  .sort((a,b)=>Number(kind.has(b.tipo))-Number(kind.has(a.tipo))||
                 power(a)-power(b));
 // HAB2: usable, species-compatible attack.
 add(other[0]);
 // HAB3: installed characteristic attack has priority; no generic Hyper Beam.
 add(signatureMove);
 for(const m of other)if(selected.length<3)add(m);
 // ULT: strongest distinct species-legal attack, if available.
 const finish=[...pool].filter(m=>power(m)>0&&!used.has(label(m)))
  .sort((a,b)=>power(b)-power(a)||Number(kind.has(b.tipo))-Number(kind.has(a.tipo)));
 add(finish[0]);
 // If special attack was already in HAB3, do not clone it.
 for(const m of pool)if(selected.length<4)add(m);
 const output={...kit};
 for(let i=0;i<4;i++){
  const attack=selected[i];
  if(!attack){delete output[ATTACK_SLOTS[i]];continue;}
  const slot=ATTACK_SLOTS[i];
  output[slot]={...attack,pendiente:false,...(i===3?{ulti:true}:{ulti:false})};
  delete output[slot].torre2UnlockLevel;
  delete output[slot].torre2UnlockEvolution;
  delete output[slot].torre2RequiresTM;
 }
 // Preserve approved LMB/RMB/Q; fill only the two verified empty Arena E
 // roles using a distinct, genuinely installed native Gen III TM. Never
 // make Clefable use Hyper Beam or affect the campaign's TM/level gates.
 const fallback=FOURTH_ROLE_GAPS[id];
 if(!output.e?.nombre&&fallback&&frlgMachineCompatible(id,fallback)){
  const installed=[...library.values()].find(m=>idOf(m?.nombre)===fallback&&
   m?.forma&&!ATTACK_SLOTS.some(s=>idOf(output[s]?.nombre)===fallback));
  if(installed)output.e={...installed,pendiente:false,ulti:true};
 }
 return enforceArenaMoveCooldowns(output);
}
/* Resolve only user-approved Arena-121 kits. Missing approval/renderers
 * fall back to real already installed moves; never simulate an effect,
 * grant a campaign TM, or overwrite a player save.
 */
export function selectApprovedArenaKit(nativeKit,species,library,nativeDodges){
 const id=idOf(species),plan=ARENA_APPROVED_121[id];
 if(!plan)return enforceArenaMoveCooldowns(nativeKit);
 const slots=['lmb','rmb','q','e'];
 // Allow only verified installed move objects, including accepted Surf
 // and Seismic Toss renderers; never invent a forma from a name.
 const valid=m=>Boolean(m?.nombre&&m?.forma&&m.approved!==false&&
  !['evolucionar','megaevolucionar','renacer'].includes(m.forma));
 const original={...nativeKit},used=new Set(),selected=[];
 // Ditto's Transform, Caterpie's Rede Total and Weedle's Chuva de Ferrões
 // are explicitly reserved; never pretend these are playable.
 for(let i=0;i<4;i++){
  const want=plan[i],key=idOf(want),candidate=library.get(key);
  if(want&&valid(candidate)&&!used.has(key)){
   selected.push({...candidate,pendiente:false,ulti:i===3});
   used.add(key);
   continue;
  }
  const same=nativeKit[slots[i]];
  // Prefer the real original slot, then a real approved alternative.
  const fallback=[same,...slots.map(k=>nativeKit[k])]
   .find(m=>valid(m)&&!used.has(idOf(m.nombre)));
  if(fallback){
   selected.push({...fallback,pendiente:false,ulti:i===3});
   used.add(idOf(fallback.nombre));
  }else selected.push(null);
 }
 const output={...original};
 for(let i=0;i<4;i++)if(selected[i])output[slots[i]]=selected[i];
 const chosen=slots.map(k=>output[k]?.nombre||'');
 output.esp=selectNativeDodge(id,chosen,nativeDodges,original.esp);
 if(!output.esp?.forma||!['dash','vuelo'].includes(output.esp.forma))
  output.esp=original.esp;
 // Keep approved attack forms and cooldowns. Native ESP has its own move
 // cooldown and sprite/rendered animation, as in the original Arena 2D.
 return enforceArenaMoveCooldowns(output);
}
export function chooseEeveeBranch(count,random=Math.random){
 if(!Number.isInteger(count)||count<1)throw new RangeError('Eevee needs available evolutions');
 const roll=Number(random());
 const safe=Number.isFinite(roll)?Math.max(0,Math.min(.999999999,roll)):0;
 return Math.floor(safe*count)+1;
}
export function installArenaMovePolicy(Luchador,roster,extraApproved=[]){
 const proto=Luchador.prototype,originalKit=proto.kitActual;
 if(typeof originalKit!=='function')throw Error('Arena fighter kitActual missing');
 const library=new Map(),nativeDodges=new Map();
 const addDodge=h=>{
  const key=idOf(h?.nombre);
  if(key&&ARENA_NATIVE_DODGE_FORMS.includes(h.forma)&&!nativeDodges.has(key))
   nativeDodges.set(key,h);
 };
 const register=kit=>{
  for(const m of Object.values(kit||{})){
   const k=idOf(m?.nombre);
   if(k&&m?.forma&&!library.has(k))library.set(k,m);
  }
 };
 for(const def of roster){
  register(def.kit);
  for(const evo of def.evoluciones||[]){register(evo.kit);register(evo.mega?.kit);}
  // Extract DEFENSIVE ORIGINAL P2 assets only, never derive dodge
  // animation from a fake per-species render. Include inherited kit ESP.
  if(def.torre2ArenaAdded!==true){
   addDodge(def.kit?.esp);
   for(const e of def.evoluciones||[])
    addDodge({...def.kit?.esp,...e.kit?.esp});
  }
 }
 // Installed approved Torre 2 techniques absent from base P2 roster
 // (Surf, cross-source specials) are playable in Arena ONLY.
 for(const move of [...BATCH24_MOVES,...SURGE3_MOVES,
                   ...FINALE_13_MOVES,...POISON_PUNCH_MOVES,...extraApproved]){
  const key=idOf(move?.nombre);
  if(key&&move?.forma&&move.approved!==false&&!library.has(key))
   library.set(key,move);
 }
 // Some moves have a validated original P2 dash/flight renderer in the
 // general move library rather than the original ESP slot.
 for(const m of library.values())
  if(m?.approved!==false)addDodge(m);
 // Branch once PER fighter, only after Eevee evolves. No page-level random
 // mutation, no changing the original campaign or the global roster.
 const formaDescriptor=Object.getOwnPropertyDescriptor(proto,'forma');
 if(!formaDescriptor?.get)throw Error('Unknown Arena evolution getter');
 Object.defineProperty(proto,'forma',{...formaDescriptor,get:function(){
  const form=formaDescriptor.get.call(this);
  if(this.escena?.datos?.torre2||this.def?.id!=='eevee'||!(this.etapa>0))
   return form;
  if(!this.__torre2EeveeEvolution){
   const choices=(this.def.evoluciones||[]).filter(e=>['vaporeon','jolteon','flareon'].includes(idOf(e.nombre)));
   if(choices.length!==3)return form;
   const pick=chooseEeveeBranch(choices.length);
   this.__torre2EeveeEvolution=choices[pick-1].nombre;
   this.etapa=this.def.evoluciones.indexOf(choices[pick-1])+1;
  }
  return formaDescriptor.get.call(this); // retain complete merged stage stats
 }});
 const evoDescriptor=Object.getOwnPropertyDescriptor(proto,'puedeEvolucionar');
 if(evoDescriptor?.get)Object.defineProperty(proto,'puedeEvolucionar',{...evoDescriptor,get:function(){
  if(!this.escena?.datos?.torre2&&this.def?.id==='eevee'&&this.etapa>0)return false;
  return evoDescriptor.get.call(this);
 }});
 proto.kitActual=function(...args){
  const original=originalKit.apply(this,args);
  if(this.escena?.datos?.torre2)return original;
  const form=this.forma;
  const id=idOf(this.etapa>0?form?.nombre:this.def?.id);
  if(id==='gengar')return enforceArenaMoveCooldowns(replaceGengarHyperBeam(original,library));
  if(this.def?.torre2ArenaAdded!==true||PROTECTED_P2_KANTO_IDS.has(id))
   return enforceArenaMoveCooldowns(original);
  const auto=selectArenaSpeciesKit(original,id,form?.tipos||this.def.tipos,library);
  return selectApprovedArenaKit(auto,id,library,nativeDodges);
 };
}
