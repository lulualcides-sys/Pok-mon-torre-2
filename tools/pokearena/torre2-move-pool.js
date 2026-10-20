/* Pokémon Torre 2 — per-Pokémon move list and battle loadout.
 * The test Mewtwo (level 50) can choose every available move in the captured
 * Poké Arena client, plus all four brand-new signature VFX in this project.
 */
import {ROSTER,buscar,etapaDe} from '../datos.js';

const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SLOTS=['lmb','rmb','q','e'];
export const SIGNATURE_MOVES=Object.freeze([
 {id:'bonemerang',nombre:'Bonemerang',forma:'torre2_bonemerang',tipo:'GROUND',dano:10.5,alcance:245,coste:24,cd:5.7,anim:'Shoot',lanzar:.16,description:'Bone boomerang / two synchronized hits'},
 {id:'bone-club',nombre:'Bone Club',forma:'torre2_boneclub',tipo:'GROUND',dano:12,alcance:64,coste:20,cd:4.7,anim:'Swing',lanzar:.13,description:'Physical contact, pixel bone club'},
 {id:'tri-attack',nombre:'Tri Attack',forma:'torre2_triattack',tipo:'NORMAL',dano:13,alcance:240,coste:30,cd:6.2,anim:'Charge',lanzar:.2,description:'Fire / ice / electric three-point projectile'},
 {id:'pay-day',nombre:'Pay Day',forma:'torre2_payday',tipo:'NORMAL',dano:10,alcance:235,coste:23,cd:5.4,anim:'Shoot',lanzar:.15,description:'Five pixel coins / independent collision frames'}
]);
function collect(def){
 // Use every actual move slot and carry inherited base/evolution properties
 // forward. In the original client, some evolution kits override only damage
 // or name; the previous reader lost moves from ESP, Megas and mid-evolutions.
 const slots=['lmb','rmb','esp','q','e'];
 const merge=(a,b)=>Object.fromEntries(
  [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])]
   .map(key=>[key,{...(a?.[key]||{}),...(b?.[key]||{})}]));
 const moves=[];
 const read=(kit,origin)=>{
  for(const slot of slots){
   const h=kit?.[slot];
   if(!h?.nombre||!h.forma)continue;
   moves.push({...h,cd:typeof h.cd==='number'?h.cd:5,
    learnedFrom:origin,originalSlot:slot});
  }
 };
 let accumulated=def.kit||{};
 read(accumulated,def.nombre||def.id);
 for(const evo of def.evoluciones||[]){
  accumulated=merge(accumulated,evo.kit||{});
  read(accumulated,evo.nombre||evo.dex||'evolution');
  if(evo.mega?.kit)read(merge(accumulated,evo.mega.kit),
   evo.mega.nombre||'Mega');
 }
 return moves;
}
const rawLibrary=[...ROSTER.flatMap(collect),...SIGNATURE_MOVES];
const ids=new Map();
for(const h of rawLibrary){
 const id=h.id||norm(h.nombre);
 if(!ids.has(id))ids.set(id,{...h,id,source:h.forma?.startsWith('torre2_')?'new-phaser-fx':'arena2d-original'});
}
export const TEST_LIBRARY=[...ids.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre));
export function availableMoves(member){
 if(member.id==='mewtwo')return TEST_LIBRARY;
 const {def}=buscar(member.id);
 const names=new Set(collect(def).map(x=>norm(x.nombre)));
 if(['cubone','marowak'].includes(member.id)){names.add('bonemerang');names.add('bone-club')}
 if(['meowth','persian'].includes(member.id))names.add('pay-day');
 if(['porygon'].includes(member.id))names.add('tri-attack');
 return TEST_LIBRARY.filter(x=>names.has(x.id)||names.has(norm(x.nombre)));
}
export function defaultLoadout(member){
 const pool=availableMoves(member);
 if(member.id==='mewtwo')
  return ['bonemerang','bone-club','tri-attack','pay-day'];
 const {def}=buscar(member.id);
 const slots=['lmb','rmb','q','e'];
 const ids=slots.map(s=>norm(def.kit[s]?.nombre));
 return ids.map((name,i)=>pool.find(p=>p.id===name)?.id||pool[i]?.id).filter(Boolean).slice(0,4);
}
export function selectedMoves(member){
 const pool=availableMoves(member),valid=new Set(pool.map(x=>x.id));
 const chosen=(member.moves?.length===4&&member.moves.every(id=>valid.has(id)))?member.moves:defaultLoadout(member);
 return chosen.filter(id=>valid.has(id)).slice(0,4);
}
export function equipMove(member,slot,moveId){
 if(!Number.isInteger(slot)||slot<0||slot>=4)return false;
 const pool=availableMoves(member);
 if(!pool.some(m=>m.id===moveId))return false;
 const selected=selectedMoves(member);
 // Do not put the same move into multiple buttons.
 if(selected.some((id,i)=>id===moveId&&i!==slot))return false;
 while(selected.length<4)selected.push(pool[selected.length]?.id);
 selected[slot]=moveId;member.moves=selected;
 return true;
}
export function resolveLoadout(member){
 const pool=availableMoves(member);
 const dict=new Map(pool.map(h=>[h.id,h]));
 const out={};
 selectedMoves(member).forEach((id,i)=>{
  const move=dict.get(id);
  if(move)out[SLOTS[i]]={...move};
 });
 return out;
}
export function pokemonStats(member){
 const {def,etapa}=buscar(member.id);
 const stage=etapaDe(def,etapa);
 const level=member.progression.level;
 const hp=Math.round((stage.hp??def.hp??70)*(1+level/95));
 return {name:stage.nombre||def.nombre,types:stage.tipos||def.tipos,
  role:stage.rol||def.rol,level,hp,attack:Math.round((stage.atk??def.atk??1)*100),
  defense:Math.round((stage.def??def.def??1)*100),speed:Math.round(stage.vel??def.vel??100),
  xp:member.progression.experience,stage:etapa};
}
