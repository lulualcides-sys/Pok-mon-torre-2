/* Discard attacks aimed at a departing actor before reusing its identity. */
export function clearDepartingCombat(scene){
 const effects=scene.efectos||[];
 scene.efectos=[];
 scene.tareas=[];
 scene.foco=null;
 // Native hit effects can share a child sprite or leave empty slots after
 // simultaneous KO / multi-hit cleanup. Destroy each effect once; a stale
 // or repeated reference must not abort the rest of the party switch.
 const destroyed=new Set();
 for(const effect of effects){
  if(!effect||destroyed.has(effect))continue;
  destroyed.add(effect);
  try{effect.destroy?.()}
  catch(error){
   // Native Phaser can throw while tearing down a stale VFX. Queued
   // contacts are already discarded; finish the rest of recall cleanup.
   console.warn('Torre 2: efeito anterior falhou ao destruir',String(error));
  }
 }
 for(const actor of scene.luchadores||[]){
  if(!actor)continue;
  actor.accion=null;actor.animAccion=null;actor.animAccionHasta=0;
  actor.dash=null;actor.mediaCarga=null;actor.cargaTipo=null;
  actor.vx=0;actor.vy=0;actor.empX=0;actor.empY=0;
 }
}
