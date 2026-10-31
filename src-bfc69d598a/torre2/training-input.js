/* Exclusively for the passive Onix training scene.
 * Preserve the normal Poké Arena controls and cooldown rules everywhere else.
 * One attack per new press; no held-button repeated casts / dual simultaneous
 * spells even when all five slot cooldowns are reset to zero each frame.
 */
export const TRAINING_ATTACK_SLOTS=Object.freeze(['e','q','rmb','lmb','esp']);
export function singleTrainingCastReader(read,actor){
 if(typeof read!=='function'||typeof actor!=='function')
  throw Error('Training reader requires a native input function and active fighter');
 let held=new Set(),lastFrame=-Infinity;
 const guarded=function(...args){
  const raw=read.apply(this,args);
  if(!raw)return raw;
  const pressed=new Set(TRAINING_ATTACK_SLOTS.filter(slot=>Boolean(raw[slot])));
  const fresh=TRAINING_ATTACK_SLOTS.find(slot=>pressed.has(slot)&&!held.has(slot));
  // Consume BOTH fresh edges when two controls are held together, allowing
  // only the highest-priority move, not a second move one frame later.
  held=pressed;
  const fighter=actor(),now=Number(fighter?.t)||0;
  // Global animation lock is not a cooldown. The player can immediately
  // cast again with a fresh press when their current animation completes.
  const busy=Boolean(fighter?.accion&&now<Number(fighter.accion.hasta||0));
  const cast=fresh&&!busy&&now>=lastFrame+.12?fresh:null;
  if(cast)lastFrame=now;
  const gated={...raw};
  for(const slot of TRAINING_ATTACK_SLOTS)gated[slot]=slot===cast;
  return gated;
 };
 guarded.__torre2SingleTrainingCast=true;
 return guarded;
}
