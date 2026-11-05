/* Johto 0152–0251. Offline/solo modes only; no Kanto campaign save or
 * evolutions changed. Real FRLG learned moves only, each one intersected with
 * an ALREADY INSTALLED P2/approved Torre2 ability and real cast renderer.
 * ATK=LMB, HAB2=RMB, HAB3=Q, ULT=E, ESP remains native simple dash.
 */
import {JOHTO_100_ROWS} from "./johto-100-data.js";
import {nativeAttacks} from "./early-kanto-species.js";
import {JOHTO_18} from "./johto-lab-catalog.js";
const canon=s=>String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
 .toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const byNumber=new Map(JOHTO_100_ROWS.map(p=>[p[0],p]));
const descendants=new Map();
for(const p of JOHTO_100_ROWS){
 const parent=p[9];
 if(!parent||!byNumber.has(parent))continue;
 if(!descendants.has(parent))descendants.set(parent,[]);
 descendants.get(parent).push(p[0]);
}
function lineage(number,seen=new Set()){
 if(seen.has(number))return[];
 seen.add(number);
 return (descendants.get(number)||[]).flatMap(num=>[byNumber.get(num),...lineage(num,seen)]);
}
const num=n=>String(n).padStart(4,"0");
const simpleDash=Object.freeze({
 nombre:"Dodge",forma:"dash",tipo:"NORMAL",dano:0,dist:95,
 dur:.20,cd:4.2,anim:"Walk"
});
const actualStats=p=>({
 hp:Math.round(40+p[3]*.63),
 vel:Math.round(58+p[8]*.66),
 atk:Math.round((p[4]+p[6])/2)/85,
 def:Math.round((p[5]+p[7])/2)/82,
 regen:4
});
const magnitude=m=>Number.isFinite(m.dano)?m.dano:0;
// Authoritative skill source: a move is eligible ONLY when it is already
// installed and executable. No new visual effects, names or placeholders.
const executable=m=>Boolean(m?.nombre&&m?.forma&&
 !m.pendiente&&!m.torre2Unavailable&&!m.torre2RequiresTM&&
 !["dash","evolucionar","megaevolucionar","renacer"].includes(m.forma));
export const JOHTO_ATTACK_SLOTS=Object.freeze([
 ["lmb","ATK"],["rmb","HAB 2"],["q","HAB 3"],["e","ULT"]
]);
export const JOHTO_100=Object.freeze(JOHTO_100_ROWS.map(p=>Object.freeze({
 dex:num(p[0]),num:p[0],id:p[1],tipos:Object.freeze([...p[2]]),
 hp:p[3],atk:p[4],def:p[5],spa:p[6],spd:p[7],speed:p[8],
 parent:p[9],legalCount:p[10].length
})));
export function johtoMoveLibrary(original){
 const m=nativeAttacks(original),out=new Map();
 for(const [name,move] of m){
  const key=canon(name);
  if(key&&executable(move)&&!out.has(key))out.set(key,move);
 }
 // Hidden Power (#201 Unown) already has an approved Johto renderer.
 // Expose it to newly added Johto kits only; never change native P2 kits.
 const hidden=JOHTO_18.find(m=>m.id==="hidden-power");
 if(executable(hidden)&&!out.has("hidden-power"))out.set("hidden-power",hidden);
 return out;
}
export function selectJohto100Moves(p,library){
 // In FRLG Smeargle learns only Sketch. A Sketch-derived move may be any
 // legal target ability. In the offline Arena this is an explicit DEMO kit,
 // not fake level-up data, and it is never applied to native P2 species.
 if(p[1]==="smeargle"){
  return ["tackle","quick-attack","swift","body-slam"]
   .map(id=>({id,level:-2,move:library.get(id),sketched:true}))
   .filter(x=>executable(x.move));
 }
 // p[10] contains only Gen III FireRed/LeafGreen natural (level>=0)
 // and compatible TM (level=-1). No invented species/type assignments.
 const legal=p[10].map(([id,level])=>({
  id,level,move:library.get(canon(id))
 })).filter(x=>executable(x.move)&&
  !["snore","hyper-beam"].includes(canon(x.id))&&
  !(canon(x.id)==="solar-beam"&&!p[2].includes("GRASS")));
 const distinct=[...new Map(legal.map(x=>[canon(x.id),x])).values()];
 const damage=x=>magnitude(x.move);
 const offensive=distinct.filter(x=>damage(x)>0);
 const isTyped=x=>p[2].includes(x.move.tipo);
 const isNatural=x=>x.level>=0;
 const byEarly=(a,b)=>a.level-b.level||damage(a)-damage(b);
 const byStrong=(a,b)=>
  Number(isTyped(b))-Number(isTyped(a))||
  damage(b)-damage(a)||
  Number(isNatural(b))-Number(isNatural(a));
 const moves=[],used=new Set();
 const add=x=>{
  const key=canon(x?.id);
  if(!key||used.has(key))return false;
  moves.push(x);used.add(key);return true;
 };
 // Reserve the strongest compatible type/signature attack for ULT
 // BEFORE allocating HAB 2/3; do not let a generic TM win by raw damage.
 // Pokémon with one attack (e.g. Unown) keep their actual ATK.
 const ultimate=offensive.length>=2?[...offensive].sort(byStrong)[0]:null;
 const others=distinct.filter(x=>x!==ultimate);
 const lowerOffense=others.filter(x=>damage(x)>0);
 const natural=lowerOffense.filter(isNatural);
 const first=[...natural].sort(byEarly)[0]||
  [...lowerOffense].sort((a,b)=>damage(a)-damage(b))[0]||others[0];
 add(first);
 const byProgress=[...natural].sort(byEarly);
 const typeAttacks=[...lowerOffense].filter(isTyped).sort(byEarly);
 const otherAttacks=[...lowerOffense].sort((a,b)=>damage(a)-damage(b));
 for(const choice of [...byProgress.filter(isTyped),...byProgress,
  ...typeAttacks,...otherAttacks,...others.filter(isTyped),...others])
  if(moves.length<3)add(choice);
 if(ultimate)add(ultimate);

 return moves.slice(0,4);
}
export function johto100Kit(p,library){
 const moves=selectJohto100Moves(p,library);
 const kit={esp:{...simpleDash}},slots=["lmb","rmb","q","e"];
 moves.forEach((m,i)=>{
  // The sole provider is the already installed, executable move library.
  // Missing skill? Leave the slot empty rather than create a fake fallback.
  if(!executable(m.move)||library.get(canon(m.id))!==m.move)return;
  kit[slots[i]]={...m.move,pendiente:false,
  torre2JohtoLegal:m.sketched?"FRLG-SKETCH-DEMO":"FRLG",
  torre2JohtoMoveLevel:m.level,
  ...(p[1]==="unown"&&m.id==="hidden-power"?
    {torre2JohtoSpecialUnown:true}:{}),
  ...(i===3?{ulti:true}:{})};
 });
 return kit;
}
export function addAllJohtoSpecies(original){
 const library=johtoMoveLibrary(original);
 // The native P2 roster contains both root species and evolution stages
 // nested in evoluciones (sometimes with a Mega form). Protect ALL of them,
 // not merely original[].id, and do not create duplicate re-kitted stages.
 const nativeNames=new Set(),nativeDex=new Set();
 const register=form=>{
  if(!form)return;
  for(const name of [form.id,form.nombre]){
   const key=canon(name);if(key)nativeNames.add(key);
  }
  const n=Number(form.dex);
  if(Number.isInteger(n)&&n>0)nativeDex.add(n);
 };
 for(const p of original){
  register(p);register(p.mega);
  for(const stage of p.evoluciones||[]){register(stage);register(stage.mega)}
 }
 const result=[];
 for(const p of JOHTO_100_ROWS){
  // Native P2 originals (including evolutions, megas and empty Ho-Oh) are
  // NEVER mutated, completed or re-slotted. Only genuinely new species
  // receive FRLG-compatible Torre 2 kits; Arena and Pokédex share native truth.
  if(nativeNames.has(canon(p[1]))||nativeDex.has(p[0])) continue;
  const kit=johto100Kit(p,library);
  const sub=lineage(p[0]);
  result.push({
   id:p[1],dex:num(p[0]),nombre:p[1].toUpperCase(),
   torre2Johto100:true,torre2ArenaAdded:true,torre2ArenaRegion:"JOHTO",
   torre2JohtoLegalMoves:p[10].length,
   torre2JohtoFilledSlots:["lmb","rmb","q","e"].filter(slot=>kit[slot]).length,
   tipos:[...p[2]],// The original Phaser ROLES table accepts FISICO/MIXTO, not
   // CUERPO_A_CUERPO. Preserve native role matrix without modifying P2.
   rol:["FIGHTING","GROUND","ROCK"].includes(p[2][0])?
    "FISICO":"MIXTO",
   lema:"JOHTO / GEN II",...actualStats(p),ia:{rango:115},kit,
   evoluciones:sub.map(q=>({
    dex:num(q[0]),nombre:q[1].toUpperCase(),
    tipos:[...q[2]],...actualStats(q),
    kit:johto100Kit(q,library)
   }))
  });
 }
 return result;
}
