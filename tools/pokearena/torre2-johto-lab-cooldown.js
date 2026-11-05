/* Exclusively for the isolated Johto Mewtwo Test Lab.
 * Apply an actual shared 1s cooldown and prevent animation stacking.
 * Each successful offensive cast announces its canonical name ABOVE the
 * attacker with the genuine Poké Arena 2D vfx.globo UI (presentar()).
 */
// Native P2 visual modules are injected by the browser runtime, not imported
// here: unit tests run without upstream src/vfx.js and datos.js.
export const JOHTO_LAB_COOLDOWN_SECONDS=1;
const SLOTS=["lmb","rmb","q","e"];
export function withJohtoLabCooldown(cast,announce=null){
 if(typeof cast!=="function")throw TypeError("Johto cast function required");
 return function guardedJohtoCast(fighter,move,extra){
  const scene=fighter?.escena;
  // Keep normal P2 Arena cooldowns intact. Lab-shared cooldown is only
  // applied in the Mewtwo Lab. New Unown's Hidden Power is exempt.
  if(!scene?.datos?.johtoLab){
   if(move?.id==="hidden-power"&&move?.torre2JohtoSpecialUnown===true)
    return cast(fighter,move,extra);
   return false;
  }
  const now=Number(fighter.t);
  if(!Number.isFinite(now))return false;
  if(now<(fighter.__johtoLabNextCastAt??-Infinity))return false;
  if((fighter.__johtoLabActiveEffects||[]).some(isLive=>isLive()))return false;
  const effects=scene.efectos||[],before=effects.length;
  const applied=cast(fighter,move,extra);
  if(applied!==true)return applied;
  fighter.__johtoLabActiveEffects=effects.slice(before).map(effect=>{
   let alive=true;
   if(typeof effect.update==="function"){
    const oldUpdate=effect.update;
    effect.update=function(...args){
     const ok=oldUpdate.apply(this,args);
     if(ok===false)alive=false;
     return ok;
    };
   }
   if(typeof effect.destroy==="function"){
    const oldDestroy=effect.destroy;
    effect.destroy=function(...args){alive=false;return oldDestroy.apply(this,args)};
   }
   // An effect removed from the Phaser effect list is no longer active.
   // Avoid a stale reference blocking the next cast forever after cleanup.
   return ()=>alive&&Array.isArray(scene.efectos)&&scene.efectos.includes(effect);
  });
  fighter.__johtoLabNextCastAt=now+JOHTO_LAB_COOLDOWN_SECONDS;
  // Native Poké Arena 2D: habilidades.js#presentar -> vfx.globo.
  // Unlike its basic-attack exception, the user explicitly requires this
  // for ALL new offensive moves, including ATK. Never announce failed casts.
  if(move&&!move.visualOnly&&!scene.__johtoSyntheticVfxTextBurst&&
     scene.globos&&typeof announce==="function")
   announce(scene,fighter,move);
  // Share a visible cooldown across all four skill buttons.
  if(fighter.cd&&typeof fighter.cd==="object")
   for(const slot of SLOTS)
    fighter.cd[slot]=Math.max(JOHTO_LAB_COOLDOWN_SECONDS,Number(fighter.cd[slot])||0);
  return true;
 };
}
