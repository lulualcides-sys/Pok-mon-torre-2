/* Discard attacks aimed at a departing actor before reusing its identity. */
export function clearDepartingCombat(scene){
 const effects=scene.efectos||[];
 scene.efectos=[];
 scene.tareas=[];
 scene.foco=null;
 for(const effect of effects)effect.destroy?.();
 for(const actor of scene.luchadores||[]){
  actor.accion=null;actor.animAccion=null;actor.animAccionHasta=0;
  actor.dash=null;actor.mediaCarga=null;actor.cargaTipo=null;
  actor.vx=0;actor.vy=0;actor.empX=0;actor.empY=0;
 }
}
