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
// Stage-zero visits are scoped to next/previous approved geographic edges,
// with Brock's actual gym as the only non-spine destination.
// Route 22 is optional and never required to unlock Pallet.
export function openingTravelAllowed(source,target,findMap,neighbors,routeTrainersCleared=false){
 if(typeof findMap!=='function'||typeof neighbors!=='function')
  throw new TypeError('Opening graph needs map and neighbor resolvers');
 const permitted=new Set([...REQUIRED_OPENING_SCENES,...OPTIONAL_OPENING_SCENES,'gym-brock']);
 if(!permitted.has(source)||!permitted.has(target)||!findMap(target))return false;
 if(!neighbors(source).includes(target))return false;
 if(target==='gym-brock')return source==='pewter-city'&&routeTrainersCleared;
 // The north/Pewter exit on the Route 2 illustration must not skip the
 // first ten existing route encounters (which include Viridian Forest).
 if(source==='route-2'&&target==='pewter-city'&&!routeTrainersCleared)return false;
 if(source==='gym-brock')return target==='pewter-city';
 if(source==='route-22'||target==='route-22')
  return source==='viridian-city'||target==='viridian-city';
 return REQUIRED_OPENING_CONNECTIONS.some(([a,b])=>
  (source===a&&target===b)||(source===b&&target===a));
}
