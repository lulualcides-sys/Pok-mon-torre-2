/* T67: read-only Sevii ferry policy. The only destinations are existing
 * edges between original approved islands and a Champion-earned League exit.
 * No Save fields, HMs, tickets, faux maps, or free boss rewards.
 */
import {approvedMapNeighbours} from './torre2-approved-maps-atlas.js';
export const SEVII_ISLAND_PORTS=Object.freeze([
 'sevii-1','sevii-2','sevii-3','sevii-4','sevii-5','sevii-6','sevii-7'
]);
export const SEVII_FERRY_LABELS=Object.freeze({
 'hall-of-fame':'RETORNAR À LIGA',
 'sevii-1':'ILHA 1','sevii-2':'ILHA 2','sevii-3':'ILHA 3',
 'sevii-4':'ILHA 4','sevii-5':'ILHA 5','sevii-6':'ILHA 6','sevii-7':'ILHA 7'
});
export function seviiLeagueUnlocked(state){
 return Number(state?.stage)===13&&state?.champion===true;
}
export function seviiFerryDestinations(id,state){
 if(!SEVII_ISLAND_PORTS.includes(id)||!seviiLeagueUnlocked(state))return [];
 return approvedMapNeighbours(id).filter(target=>
  target==='hall-of-fame'||SEVII_ISLAND_PORTS.includes(target));
}
export function isSeviiSceneUnlocked(entry,state){
 if(!entry)return false;
 if(entry.index<48)return true;
 return seviiLeagueUnlocked(state);
}
// Exact source atlas already declares separate requirements for these two
// interiors. Do not let the art click bypass unimplemented event prerequisites.
export const SEVII_QUEST_LOCKED=Object.freeze(['rocket-warehouse','tanoby-ruins']);
export function seviiHasUnimplementedQuestLock(id){
 return SEVII_QUEST_LOCKED.includes(id);
}
