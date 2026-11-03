/* T68 — navigation authorization for the 60 ORIGINAL approved maps.
 * Read-only: never mutates a campaign save, grants badges, unlocks quests,
 * or fabricates scenery for routes missing an approved image.
 */
import {GYMS} from './campaign-core.js';
import {approvedMap,approvedMapNeighbours} from './torre2-approved-maps-atlas.js';
import {isSeviiSceneUnlocked,seviiHasUnimplementedQuestLock} from './torre2-sevii-ferry.js';

// Zero-based last approved image visible during each native campaign stage.
export const APPROVED_STAGE_MAP_MAX=Object.freeze([
 3,9,18,26,31,36,40,42,45,46,46,46,46,60
]);
const LEAGUE_MAPS=new Set([
 'routes-22-23','victory-road','indigo-plateau',
 'elite-four-rooms','hall-of-fame'
]);

function requiredEarnedBadges(id,entry){
 if(id==='gym-giovanni')return 7;
 if(LEAGUE_MAPS.has(id)||entry.index>=48)return 8;
 return 0;
}

export function approvedMapEntryAllowed(state,id){
 const stage=state?.stage;
 const entry=approvedMap(id);
 if(!entry||!Number.isInteger(stage)||stage<0||
    stage>=APPROVED_STAGE_MAP_MAX.length)return false;
 if(entry.index>APPROVED_STAGE_MAP_MAX[stage])return false;
 if(id==='hall-of-fame'&&state.champion!==true)return false;
 if(!isSeviiSceneUnlocked(entry,state))return false;
 // Rocket passwords and Tanoby key have NO implemented earning logic.
 // Displaying the image must not silently bypass their prerequisites.
 if(seviiHasUnimplementedQuestLock(id))return false;
 const required=requiredEarnedBadges(id,entry);
 if(required){
  if(!Array.isArray(state.badges))return false;
  const earned=new Set(state.badges);
  if(!GYMS.slice(0,required).every(gym=>earned.has(gym.badge)))
   return false;
 }
 return true;
}

export function approvedMapTravelAllowed(from,target,state){
 return approvedMapNeighbours(from).includes(target)&&
  approvedMapEntryAllowed(state,target);
}
