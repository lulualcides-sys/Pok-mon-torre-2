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
  // Cancelling an action skips its native fin(): a fighter caught mid-Fly
  // (alpha 0, high in the air, invulnerable) or mid-Dig/Dive (hidden sprite,
  // ring and shadow) would stay invisible after a party switch. Bring it
  // back down and visible, without the fin() damage/landing effects.
  if(!actor.ko&&(actor.ocultoVuelo||actor.est?.vuelo||(actor.spr&&!actor.spr.visible))){
   actor.ocultoVuelo=null;actor.salto=0;
   if(actor.est){delete actor.est.vuelo;delete actor.est.invul;}
   if(actor.spr?.active&&!actor.enHumo)actor.spr.setVisible(true).setAlpha(1);
   actor.sombra?.setVisible?.(true);actor.anillo?.setVisible?.(true);
  }
  actor.accion=null;actor.animAccion=null;actor.animAccionHasta=0;
  actor.dash=null;actor.mediaCarga=null;actor.cargaTipo=null;
  actor.vx=0;actor.vy=0;actor.empX=0;actor.empY=0;
 }
}
