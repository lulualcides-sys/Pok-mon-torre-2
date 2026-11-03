/* Additive registry for Pallet-first Kanto images. Never rewrite the
 * 60 signed off WebPs or the original approved-maps-atlas.json.
 *
 * Empty until each additional individual map image has been reviewed.
 * An approved record must include its original 1280x720 WebP SHA-256,
 * manually verified clickable hotspots and their corresponding destinations.
 * These records are intentionally NOT inferred from candidate collages.
 */
export const APPROVED_PROLOGUE_IDS=Object.freeze([
 'pallet-town','route-1','viridian-city','viridian-forest','route-22'
]);
export const APPROVED_PROLOGUE_EDGES=Object.freeze([
 Object.freeze(['pallet-town','route-1']),
 Object.freeze(['route-1','viridian-city']),
 Object.freeze(['viridian-city','route-2']),
 Object.freeze(['route-2','viridian-forest']),
 Object.freeze(['viridian-forest','pewter-city']),
 Object.freeze(['viridian-city','route-22'])
]);
// IMPORTANT: additions require explicit user approval and measured coordinates.
// Do not place a placeholder map, a generated proposal or a screenshot here.
export const APPROVED_PROLOGUE_MAPS=Object.freeze([]);

export function validateApprovedPrologueMap(map,originalIds=[]){
 if(!map||typeof map!=='object'||Array.isArray(map)||
    !APPROVED_PROLOGUE_IDS.includes(map.id)||
    new Set(originalIds).has(map.id))
  throw Error('Unknown or duplicate supplementary Kanto map ID');
 if(map.image!=='assets/ui/kanto-approved-prologue/'+map.id+'.webp'||
    !/^[a-f0-9]{64}$/.test(map.sha256||''))
  throw Error('Supplementary map requires a pinned original WebP SHA-256');
 if(!Number.isInteger(map.index)||map.index<=60||
    !['cidade','rota','caverna'].includes(map.type)||
    map.hotspots_status!=='validated'||
    !Array.isArray(map.hotspots)||!map.hotspots.length||
    !map.destinations||typeof map.destinations!=='object')
  throw Error('Supplementary map metadata or reviewed hotspots missing');
 const seen=new Set();
 for(const h of map.hotspots){
  if(typeof h.id!=='string'||!/^[a-z0-9-]+$/.test(h.id)||
     seen.has(h.id)||h.validated!=='visual'||
     ![h.cx,h.cy,h.w,h.h].every(Number.isFinite)||
     h.w<=0||h.h<=0||h.cx-h.w/2<0||h.cx+h.w/2>1||
     h.cy-h.h/2<0||h.cy+h.h/2>1)
   throw Error('Invalid manually approved prologue click target');
  seen.add(h.id);
 }
 for(const [hotspot,target] of Object.entries(map.destinations)){
  if(!seen.has(hotspot)||
     !/^[a-z0-9-]+$/.test(target)||
     ![...APPROVED_PROLOGUE_IDS,'route-2','pewter-city'].includes(target))
   throw Error('Unknown prologue navigation destination');
 }
 if(!Object.keys(map.destinations).length)
  throw Error('Supplementary map has no usable exit');
 return true;
}

export function approvedPrologueMap(id){
 return APPROVED_PROLOGUE_MAPS.find(m=>m.id===id)||null;
}
export function approvedPrologueDestination(mapId,hotspotId){
 const map=approvedPrologueMap(mapId);
 return map?.destinations?.[hotspotId]||null;
}
// Expose a graph edge only when BOTH registered/approved endpoint images exist.
// "route-2" and "pewter-city" belong to the fixed original 60-image catalog.
export function activePrologueEdges(findMap){
 if(typeof findMap!=='function')throw new TypeError('Map resolver required');
 return APPROVED_PROLOGUE_EDGES.filter(([a,b])=>findMap(a)&&findMap(b));
}
