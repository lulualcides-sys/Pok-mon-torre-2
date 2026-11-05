/* Johto 0152–0251. Offline/solo modes only; no Kanto campaign save or
 * evolutions changed. Real FRLG learned moves only, each one intersected with
 * an ALREADY INSTALLED P2/approved Torre2 ability and real cast renderer.
 * ATK=LMB, HAB2=RMB, HAB3=Q, ULT=E, ESP remains native simple dash.
 */
import {JOHTO_100_ROWS} from "./johto-100-data.js";
import {nativeAttacks} from "./early-kanto-species.js";
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
  if(key&&move?.forma&&!out.has(key))out.set(key,move);
 }
 return out;
}
export function selectJohto100Moves(p,library){
 // p[10] contains only Gen III FireRed/LeafGreen natural (level>=0)
 // and compatible TM (level=-1). No invented species/type assignments.
 const legal=p[10].map(([id,level])=>({
  id,level,move:library.get(canon(id))
 })).filter(x=>x.move?.nombre&&x.move?.forma&&x.id!=="snore"&&
  !["dash","evolucionar","megaevolucionar","renacer"].includes(x.move.forma));
 const distinct=[...new Map(legal.map(x=>[canon(x.id),x])).values()];
 const damage=x=>magnitude(x.move);
 const offensive=distinct.filter(x=>damage(x)>0);
 const natural=offensive.filter(x=>x.level>=0);
 const primary=p[2][0],typed=x=>x.move.tipo===primary;
 const moves=[],used=new Set();
 const add=x=>{
  const key=canon(x?.id);
  if(!key||used.has(key))return false;
  moves.push(x);used.add(key);return true;
 };
 // Basic attack is the weakest actual learned physical/special renderer,
 // prioritizing one natively learned early, never inventing Tackle.
 add([...natural].sort((a,b)=>a.level-b.level||damage(a)-damage(b))[0]||
     [...offensive].sort((a,b)=>damage(a)-damage(b))[0]||distinct[0]);
 // Two abilities: distinct genuine learnable moves; favor same-type STAB,
 // variety, and normal progress from weaker to stronger.
 const byProgress=[...natural].sort((a,b)=>a.level-b.level||damage(a)-damage(b));
 for(const choice of [...byProgress.filter(typed),...byProgress,
  ...offensive.filter(typed).sort((a,b)=>damage(a)-damage(b)),
  ...offensive.sort((a,b)=>damage(a)-damage(b)),...distinct])
  if(moves.length<3)add(choice);
 // ULT only a real, installed and legal offensive attack, strongest
 // among unused moves. If none exists, leave a visible honest gap.
 const ultimate=[...offensive].filter(x=>!used.has(canon(x.id)))
  .sort((a,b)=>damage(b)-damage(a)||Number(typed(b))-Number(typed(a)))[0];
 add(ultimate);
 return moves.slice(0,4);
}
export function johto100Kit(p,library){
 const moves=selectJohto100Moves(p,library);
 const kit={esp:{...simpleDash}},slots=["lmb","rmb","q","e"];
 moves.forEach((m,i)=>{kit[slots[i]]={...m.move,pendiente:false,
  torre2JohtoLegal:"FRLG",torre2JohtoMoveLevel:m.level,
  ...(i===3?{ulti:true}:{})}});
 return kit;
}
export function addAllJohtoSpecies(original){
 const known=new Map(original.map(x=>[x.id,x])),library=johtoMoveLibrary(original);
 const result=[];
 for(const p of JOHTO_100_ROWS){
  if(known.has(p[1])){
   // The P2 client already includes Ho-Oh as a sprite/roster entry but it
   // currently has no executable battle slots. Preserve all native visuals
   // and existing moves; fill ONLY empty slots from its legal FRLG learnset,
   // and ONLY with already installed P2 or approved Torre 2 renderers.
   if(p[1]==="ho-oh"){
    const native=known.get(p[1]),slots=["lmb","rmb","q","e"];
    if(!slots.some(slot=>native?.kit?.[slot]?.nombre&&native.kit[slot]?.forma)){
     const legalKit=johto100Kit(p,library),restored={...native.kit};
     for(const slot of slots)if(!restored[slot]?.forma&&legalKit[slot]?.forma)
      restored[slot]=legalKit[slot];
     if(slots.some(slot=>restored[slot]?.forma)){
      native.kit=restored;
      native.torre2JohtoNativeLegalKit=true;
     }
    }
   }
   continue;
  }
  const kit=johto100Kit(p,library);
  const sub=lineage(p[0]);
  result.push({
   id:p[1],dex:num(p[0]),nombre:p[1].toUpperCase(),
   torre2Johto100:true,torre2ArenaAdded:true,torre2ArenaRegion:"JOHTO",
   torre2JohtoLegalMoves:p[10].length,
   torre2JohtoFilledSlots:["lmb","rmb","q","e"].filter(slot=>kit[slot]).length,
   tipos:[...p[2]],rol:["FIGHTING","GROUND","ROCK"].includes(p[2][0])?
    "CUERPO_A_CUERPO":"MIXTO",
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
