/* Presentation-only gate for the canonical Kanto opening.
 * The approved 60-image archive starts at Route 2, not Pallet Town.
 * Never replace the opening with Pewter just because Pewter has a WebP.
 */
export const REQUIRED_OPENING_SCENES=Object.freeze([
 'pallet-town','route-1','viridian-city','route-2',
 'viridian-forest','pewter-city'
]);
export const OPTIONAL_OPENING_SCENES=Object.freeze(['route-22']);

// Dependencies are injected to keep this preflight independent of saves,
// battles and Phaser, and testable before installing any artwork.
export function missingApprovedOpeningScenes(findMap,hasReviewedHotspots){
 if(typeof findMap!=='function'||typeof hasReviewedHotspots!=='function')
  throw new TypeError('Opening map and hotspot resolvers are required');
 return REQUIRED_OPENING_SCENES.filter(id=>
  !findMap(id)||!hasReviewedHotspots(id));
}

export function approvedOpeningMapId(findMap,hasReviewedHotspots){
 return missingApprovedOpeningScenes(findMap,hasReviewedHotspots).length===0?
  'pallet-town':null;
}
