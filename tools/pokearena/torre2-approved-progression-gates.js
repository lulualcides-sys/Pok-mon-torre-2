/* T68 — navigation authorization for the 60 ORIGINAL approved maps.
 * Read-only: never mutates a campaign save, grants badges, unlocks quests,
 * or fabricates scenery for routes missing an approved image.
 */
// Keep the rules self-contained in Node tests: the captured native Phaser
// client resolves campaign-core's upstream imports only during a build.
// The regression test compares these badges with the native GYMS definition.
export const KANTO_BADGES=Object.freeze([
 'Rocha','Cascata','Trovao','Arco-Iris',
 'Alma','Pantano','Vulcao','Terra'
]);
import {approvedMap,approvedMapNeighbours} from './torre2-approved-maps-atlas.js';
import {firstApprovedDestination} from './torre2-approved-map-first-scenes.js';
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
  if(!KANTO_BADGES.slice(0,required).every(badge=>earned.has(badge)))
   return false;
 }
 return true;
}

// These atlas edges exist for geography only. Their ORIGINAL corresponding
// walking exits were not approved/installed (Saffron gates, Viridian approach).
// Never use them as a synthetic teleport or hidden navigation chip.
const UNREVIEWED_WALK_LINKS=new Set([
 'celadon-city>saffron-city','saffron-city>celadon-city',
 'route-21>gym-giovanni','gym-giovanni>route-21',
 'gym-giovanni>routes-22-23','routes-22-23>gym-giovanni'
]);

export function approvedMapTravelAllowed(from,target,state){
 return !UNREVIEWED_WALK_LINKS.has(from+'>'+target)&&
  approvedMapNeighbours(from).includes(target)&&
  approvedMapEntryAllowed(state,target);
}


/** Restore only a map the player actually viewed in the SAME campaign stage.
 * This is UI-only memory, not a save migration or a travel authorization.
 * The current persisted badges/champion flag are rechecked, so returning
 * from the party menu cannot resurrect a now-locked map.
 */
export function approvedReturnMapId(returnEntry,state){
 if(!returnEntry||typeof returnEntry.id!=='string'||
    returnEntry.stage!==state?.stage)return null;
 return approvedMapEntryAllowed(state,returnEntry.id)?returnEntry.id:null;
}


/** Only a committed result in the same native stage may resume the last
 * approved artwork. A gym/League win changes stages, while failed/stale
 * battle markers are not durable checkpoints. Never write to the save. */
export function approvedPostBattleReturnMapId(returnEntry,previousStage,nextState,accepted){
 if(accepted!==true||previousStage!==nextState?.stage)return null;
 return approvedReturnMapId(returnEntry,nextState);
}

/** Navigate back within the 60 approved Phaser scenes, never to the
 * obsolete campaign path. Only legal adjacent links are permitted.
 * This is UI history, not a campaign save or an unlock mechanism. */
export function approvedBackMapId(currentId,state,history=[]){
 if(!approvedMapEntryAllowed(state,currentId))return null;
 if(Array.isArray(history)){
  for(let i=history.length-1;i>=0;i--){
   const previous=history[i];
   if(previous!==currentId&&approvedMapTravelAllowed(currentId,previous,state))
    return previous;
  }
 }
 const entrance=firstApprovedDestination(currentId,'entrance');
 if(entrance&&approvedMapTravelAllowed(currentId,entrance,state))return entrance;
 const exit=firstApprovedDestination(currentId,'exit');
 if(exit&&approvedMapTravelAllowed(currentId,exit,state))return exit;
 const neighbors=approvedMapNeighbours(currentId)
  .filter(id=>approvedMapTravelAllowed(currentId,id,state));
 // With no history (direct entry or reload), go to the preceding atlas
 // artwork instead of accidentally jumping FORWARD to an unvisited route.
 // Never skip the existing stage/quest gate checked above.
 return neighbors.sort((a,b)=>approvedMap(a).index-approvedMap(b).index)[0]||null;
}
