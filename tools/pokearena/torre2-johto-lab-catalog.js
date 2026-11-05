/* Johto move prototypes: OFFLINE MEWTWO TEST LAB ONLY.
 * Deliberately not imported into campaign move-pool, saves, Pokédex or TM system.
 * Renderer metadata for visual testing is provisional, not a claim of Gen II parity.
 */
import {JOHTO_PIXELFX_28} from "./torre2-johto-pixelfx-catalog.js";
export const JOHTO_18=Object.freeze([
 ["triple-kick","Triple Kick","FIGHTING","PHYSICAL",10,90,10,6,70,"Punch","kick"],
 ["thief","Thief","DARK","SPECIAL",40,100,10,12,85,"Attack","slash"],
 ["snore","Snore","NORMAL","PHYSICAL",40,100,15,10,190,"Charge","sound"],
 ["powder-snow","Powder Snow","ICE","SPECIAL",40,100,25,8,240,"Shoot","snow"],
 ["octazooka","Octazooka","WATER","SPECIAL",65,85,10,13,240,"Shoot","ink"],
 ["zap-cannon","Zap Cannon","ELECTRIC","SPECIAL",120,50,5,24,280,"Charge","electric"],
 ["false-swipe","False Swipe","NORMAL","PHYSICAL",40,100,40,8,86,"Swing","slash"],
 ["steel-wing","Steel Wing","STEEL","PHYSICAL",70,90,25,14,95,"Swing","wing"],
 ["return","Return","NORMAL","PHYSICAL",102,100,20,16,100,"Attack","dash"],
 ["present","Present","NORMAL","PHYSICAL",0,90,15,12,235,"Throw","gift"],
 ["frustration","Frustration","NORMAL","PHYSICAL",102,100,20,16,98,"Attack","dash"],
 ["magnitude","Magnitude","GROUND","PHYSICAL",0,100,30,16,150,"Charge","quake"],
 ["pursuit","Pursuit","DARK","SPECIAL",40,100,20,8,170,"Attack","slash"],
 ["vital-throw","Vital Throw","FIGHTING","PHYSICAL",70,100,10,15,84,"Attack","throw"],
 ["hidden-power","Hidden Power","NORMAL","SPECIAL",60,100,15,12,238,"Charge","orb"],
 ["rock-smash","Rock Smash","FIGHTING","PHYSICAL",40,100,15,8,100,"Swing","rock"],
 ["whirlpool","Whirlpool","WATER","SPECIAL",35,85,15,8,215,"Charge","vortex"],
 ["beat-up","Beat Up","DARK","SPECIAL",0,100,10,12,92,"Attack","kick"]
].map(([id,nombre,tipo,categoria,poder,precisao,pp,dano,alcance,anim,style])=>
 Object.freeze({id,nombre,tipo,categoria,poder,precisao,pp,dano,alcance,
  anim,style,forma:"torre2_johto_"+id.replaceAll("-",""),coste:8,cd:1,
  lanzar:.13,source:"johto-lab-prototype",approved:["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka"].includes(id),
  pendiente:false})));
export const JOHTO_LAB_SLOTS=Object.freeze(["lmb","rmb","q","e"]);
// The three approved techniques remain in JOHTO_LAB_ALL for compatibility,
 // original animation preservation and campaign use. They are NOT review targets.
export const JOHTO_APPROVED_5=Object.freeze(["powder-snow","whirlpool","zap-cannon","triple-kick","octazooka"]);
// Next visual approval batch: two reworks plus two other offensive Gen III moves.
// All 28 STATUS/visual-only prototypes remain excluded from the visible review list.
export const JOHTO_LAB_REVIEW_4=Object.freeze(["thief","snore","false-swipe","steel-wing"]);
export const JOHTO_LAB_VISIBLE=Object.freeze(JOHTO_LAB_REVIEW_4.map(id=>
 [...JOHTO_18,...JOHTO_PIXELFX_28].find(m=>m.id===id)));
export const JOHTO_LAB_DEFAULT=JOHTO_LAB_REVIEW_4;
export const JOHTO_LAB_ALL=Object.freeze([...JOHTO_18,...JOHTO_PIXELFX_28]);
const byId=new Map(JOHTO_LAB_ALL.map(m=>[m.id,m]));
export function validateJohtoLabSlots(ids){
 return Array.isArray(ids)&&ids.length===4&&new Set(ids).size===4&&ids.every(id=>byId.has(id));
}
export function makeJohtoTrainingKit(ids){
 if(!validateJohtoLabSlots(ids))throw new Error("Quatro golpes de Johto distintos sao obrigatorios");
 return Object.fromEntries(ids.map((id,index)=>[
  JOHTO_LAB_SLOTS[index],{...byId.get(id),ulti:index===3}
 ]));
}
export function johtoLabMove(id){return byId.get(id)||null;}
