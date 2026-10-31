/* Campaign ESP uses only original, already installed Poké Arena 2D
 * dash/flight moves. Reuses the SAME native Arena selector; never edits
 * the source roster or equips a new attack, TM, ULT or visual effect.
 */
import {selectNativeDodge,ARENA_NATIVE_DODGE_FORMS} from './arena-native-dodges.js';
const idOf=s=>String(s||'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const CAMPAIGN_DODGE_FALLBACK=Object.freeze({
 nombre:'Dodge',forma:'dash',tipo:'NORMAL',dano:0,
 dist:95,dur:.20,cd:4.2,anim:'Walk',estilo:'rapido'
});
const legal=move=>Boolean(move?.nombre&&
 ARENA_NATIVE_DODGE_FORMS.includes(move.forma)&&!move.pendiente&&
 move.approved!==false&&(move.source!=='new-phaser-fx'||move.approved===true));
export function buildCampaignDodgeTemplates(roster=[],library=[]){
 const map=new Map();
 const add=move=>{if(!legal(move))return;
  const key=idOf(move.nombre);if(key&&!map.has(key))map.set(key,move);
 };
 // The source Arena registers only ORIGINAL P2 family ESP sprites first,
 // then previously approved move renderers. Mirror that exact precedence.
 for(const def of roster){
  if(def?.torre2ArenaAdded===true)continue;
  add(def?.kit?.esp);
  for(const evo of def?.evoluciones||[])
   add({...def.kit?.esp,...evo.kit?.esp});
 }
 for(const move of library)add(move);
 return map;
}
export function campaignNativeDodge(species,loadout,templates,original=null){
 // The 30 original P2 Kanto forms keep their actual unchanged Arena ESP.
 if(legal(original))return {...original,torre2CampaignNativeEvasion:true};
 const attacks=['lmb','rmb','q','e'].map(k=>loadout?.[k]?.nombre).filter(Boolean);
 const fallback={...CAMPAIGN_DODGE_FALLBACK};
 const selected=selectNativeDodge(species,attacks,templates||new Map(),fallback);
 // Never invent an animation. The legacy dash remains a safe fallback
 // only when no compatible native renderer exists in the approved client.
 if(selected===fallback||!legal(selected))return fallback;
 return {...selected,torre2CampaignNativeEvasion:true};
}
