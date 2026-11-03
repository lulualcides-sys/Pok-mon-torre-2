/* T86 — Native FRLG NPC overlay for cleaned, user-provided opening art.
 * Presentation only: never paint NPCs twice or create trainer checkpoints.
 * The background itself must be a CLEAN plate, verified by its own manifest.
 * Normalized positions are independent of desktop/mobile viewport scaling.
 */
const npc=(id,kind,cx,feetY,index)=>Object.freeze({id,kind,cx,feetY,index});
export const OPENING_NPC_PLANS=Object.freeze({
 'viridian-forest':Object.freeze([
  npc('forest-bug-1','bugcatcher',.244,.317,3),
  npc('forest-bug-2','bugcatcher',.454,.528,4),
  npc('forest-bug-3','bugcatcher',.854,.299,5),
  npc('forest-bug-4','bugcatcher',.210,.776,6),
  npc('forest-bug-5','bugcatcher',.835,.776,7)
 ]),
 'route-1':Object.freeze([
  npc('route1-npc','youngster',.777,.458,0)
 ]),
 'viridian-city':Object.freeze([
  npc('viridian-youngster','youngster',.358,.479,0),
  npc('viridian-elder','gentleman',.662,.491,1),
  npc('viridian-lass','lass',.843,.461,2),
  npc('viridian-local','youngster',.870,.850,3)
 ]),
 'pallet-town':Object.freeze([])
});
/** False until approved WebP contains NO painted trainer pixels.
 * A missing clean plate is safer than drawing a duplicate figure. */
export function openingNpcPlan(mapId,{cleanPlate=false,stage=0}={}){
 if(!cleanPlate||stage!==0)return [];
 return OPENING_NPC_PLANS[mapId]||[];
}
export function projectOpeningNpc(npc,rect){
 if(!npc||!rect||![npc.cx,npc.feetY,rect.x,rect.y,rect.width,rect.height].every(Number.isFinite))
  throw new TypeError('NPC and image rectangle must be finite');
 if(npc.cx<0||npc.cx>1||npc.feetY<0||npc.feetY>1)
  throw new RangeError('NPC is outside the approved map image');
 return Object.freeze({
  x:rect.x+npc.cx*rect.width,
  y:rect.y+npc.feetY*rect.height
 });
}
export function auditOpeningNpcPlan(mapId,layout=OPENING_NPC_PLANS[mapId]){
 if(!Array.isArray(layout))return false;
 const ids=new Set(),indexes=new Set();
 for(const actor of layout){
  if(!actor||typeof actor.id!=='string'||!actor.id||
   !['bugcatcher','youngster','gentleman','lass'].includes(actor.kind)||
   !Number.isInteger(actor.index)||actor.index<0||actor.index>=13||
   ids.has(actor.id)||indexes.has(actor.index)||
   !Number.isFinite(actor.cx)||!Number.isFinite(actor.feetY)||
   actor.cx<.03||actor.cx>.97||actor.feetY<.05||actor.feetY>.95)
   return false;
  ids.add(actor.id);indexes.add(actor.index);
 }
 return true;
}
