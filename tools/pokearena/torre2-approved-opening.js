/* Canonical Kanto start: no visual skip to Pewter.
 * Existence, click areas, bilateral route exits, and atlas adjacency
 * must ALL be proven before stage zero can leave the original UI.
 */
export const REQUIRED_OPENING_SCENES=Object.freeze([
 'pallet-town','route-1','viridian-city','route-2',
 'viridian-forest','pewter-city'
]);
export const OPTIONAL_OPENING_SCENES=Object.freeze(['route-22']);
export const REQUIRED_OPENING_CONNECTIONS=Object.freeze([
 Object.freeze(['pallet-town','route-1']),
 Object.freeze(['route-1','viridian-city']),
 Object.freeze(['viridian-city','route-2']),
 Object.freeze(['route-2','viridian-forest']),
 // Forest exits back to Route 2's northern segment, THEN Pewter.
 // No fictional direct doorway between the Forest and Pewter itself.
 Object.freeze(['route-2','pewter-city'])
]);
export function missingApprovedOpeningScenes(findMap,hasReviewedHotspots){
 if(typeof findMap!=='function'||typeof hasReviewedHotspots!=='function')
  throw new TypeError('Opening map and hotspot resolvers are required');
 return REQUIRED_OPENING_SCENES.filter(id=>
  !findMap(id)||!hasReviewedHotspots(id));
}
// No implicit map edges. Both sides must have an explicit interactive exit
// and correspond to the same original approved map graph.
export function missingApprovedOpeningConnections(findMap,resolveHotspots,
 resolveDestination,neighbors){
 if([findMap,resolveHotspots,resolveDestination,neighbors].some(x=>typeof x!=='function'))
  throw new TypeError('All four opening graph resolvers are required');
 const missing=[];
 for(const [a,b] of REQUIRED_OPENING_CONNECTIONS){
  const from=findMap(a),to=findMap(b);
  if(!from||!to){missing.push(a+'<->'+b);continue;}
  const ab=resolveHotspots(from).some(h=>resolveDestination(a,h.id)===b);
  const ba=resolveHotspots(to).some(h=>resolveDestination(b,h.id)===a);
  const edge=neighbors(a).includes(b)&&neighbors(b).includes(a);
  if(!ab||!ba||!edge)missing.push(a+'<->'+b);
 }
 return missing;
}
export function approvedOpeningMapId(findMap,hasReviewedHotspots,
 resolveHotspots,resolveDestination,neighbors){
 if(missingApprovedOpeningScenes(findMap,hasReviewedHotspots).length)return null;
 if([resolveHotspots,resolveDestination,neighbors].some(x=>typeof x!=='function'))
  return null; // refuse preflight bypass from a legacy 2-argument call
 return missingApprovedOpeningConnections(findMap,resolveHotspots,
  resolveDestination,neighbors).length===0?'pallet-town':null;
}

// In-memory visual journey state, keyed by the starter's persistent UID.
// This does NOT add fields to the historical battle save. After a browser
// restart a player may revisit the forest, rather than receive a false pass.
export function openingJourneyForState(previous,state){
 if(!state||state.stage!==0)return null;
 const members=[...(Array.isArray(state.team)?state.team:[]),
  ...(Array.isArray(state.box)?state.box:[])];
 const validUid=member=>typeof member?.uid==='string'&&member.uid.length>0;
 // Preserve the *same* starter across team reordering and PC transfers.
 // Do not accidentally assign its forest milestone to a newly captured lead.
 const priorUid=previous?.owner?.startsWith('uid:')?
  previous.owner.slice(4):null;
 if(priorUid&&members.some(member=>validUid(member)&&member.uid===priorUid))
  return {owner:previous.owner,forestVisited:previous.forestVisited===true};
 const firstStarter=members.find(member=>member?.id===state.starter&&validUid(member));
 const candidate=firstStarter||members.find(validUid);
 const owner=candidate?'uid:'+candidate.uid:
  typeof state.starter==='string'&&state.starter.length?
   'legacy:'+state.starter:null;
 if(!owner)return null;
 return {owner,forestVisited:previous?.owner===owner&&previous.forestVisited===true};
}

const FOREST_VISIT_STORAGE_PREFIX='torre2:kanto:forest-visited:v1:';
function forestVisitStorageKey(journey){
 if(typeof journey?.owner!=='string'||!journey.owner.startsWith('uid:'))return null;
 const uid=journey.owner.slice(4);
 // Never use legacy starter names, untrusted key delimiters or unbounded IDs.
 return /^[a-z0-9_-]{1,96}$/i.test(uid)?
  FOREST_VISIT_STORAGE_PREFIX+uid:null;
}
// Sidecar state: read only after an ordinary campaign save has supplied a
// matching UID. No changes to SAVE_KEY, SAVE_BACKUP_KEY or save migrations.
export function restoreOpeningForestVisit(journey,storage){
 if(!journey||journey.forestVisited===true)return journey;
 const key=forestVisitStorageKey(journey);
 if(!key||typeof storage?.getItem!=='function')return journey;
 try{
  return storage.getItem(key)==='1'?{...journey,forestVisited:true}:journey;
 }catch{return journey}
}
export function persistOpeningForestVisit(journey,storage){
 const key=forestVisitStorageKey(journey);
 if(!journey?.forestVisited||!key||typeof storage?.setItem!=='function')return false;
 try{storage.setItem(key,'1');return true}
 catch{return false}
}

export function markOpeningForestVisit(previous,source,target){
 if(!previous)return null;
 if(source==='route-2'&&target==='viridian-forest')
  return {owner:previous.owner,forestVisited:true};
 return previous;
}

// Stage-zero visits are scoped to next/previous approved geographic edges,
// with Brock's actual gym as the only non-spine destination.
// Route 22 is optional and never required to unlock Pallet.
export function openingTravelAllowed(source,target,findMap,neighbors,routeTrainersCleared=false,forestVisited=false){
 if(typeof findMap!=='function'||typeof neighbors!=='function')
  throw new TypeError('Opening graph needs map and neighbor resolvers');
 const permitted=new Set([...REQUIRED_OPENING_SCENES,...OPTIONAL_OPENING_SCENES,'gym-brock']);
 if(!permitted.has(source)||!permitted.has(target)||!findMap(target))return false;
 if(!neighbors(source).includes(target))return false;
 if(target==='gym-brock')return source==='pewter-city'&&routeTrainersCleared&&forestVisited;
 // The north/Pewter exit on the Route 2 illustration must not skip the
 // first ten existing route encounters (which include Viridian Forest).
 if(source==='route-2'&&target==='pewter-city'&&(!routeTrainersCleared||!forestVisited))return false;
 if(source==='gym-brock')return target==='pewter-city';
 if(source==='route-22'||target==='route-22')
  return source==='viridian-city'||target==='viridian-city';
 return REQUIRED_OPENING_CONNECTIONS.some(([a,b])=>
  (source===a&&target===b)||(source===b&&target===a));
}
