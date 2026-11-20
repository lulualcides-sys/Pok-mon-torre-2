/* Pokémon Torre 2 — fire particle cap (whole game: campaign, Arena, VS, Training).
 * Owner request 2026-11-20, approved after a side-by-side video: fire moves
 * (Heat Wave peaked at ~990 live additive particles) froze phones. Every
 * particle emitter whose texture is fire ('llama' glow or the animated
 * 'vfx-llam…' flames) keeps at most FIRE_PARTICLE_CAP live particles.
 * Shape, colours, range, damage, hit timing and duration are unchanged; the
 * oldest particles simply stop being replaced once the cap is reached.
 * Other emitters (ice, water, smoke, sparks…) are untouched.
 */
export const FIRE_PARTICLE_CAP=250;
export function isFireParticleTexture(key){
 return typeof key==='string'&&/^(llama|vfx-llam)/.test(key);
}
export function capFireEmitter(emitter,key,cap=FIRE_PARTICLE_CAP){
 if(!emitter||!isFireParticleTexture(key??emitter.texture?.key))return false;
 const current=Number(emitter.maxAliveParticles)||0;
 if(current>0&&current<=cap)return false;
 emitter.maxAliveParticles=cap;
 return true;
}
// Wrap the shared scene.add.particles factory once (all scenes use it).
export function installFireParticleCap(P=globalThis.Phaser,cap=FIRE_PARTICLE_CAP){
 const proto=P?.GameObjects?.GameObjectFactory?.prototype;
 if(!proto||typeof proto.particles!=='function')return false;
 if(proto.__torre2FireCap)return true;
 const native=proto.particles;
 proto.particles=function(x,y,texture,config){
  const emitter=native.call(this,x,y,texture,config);
  try{capFireEmitter(emitter,emitter?.texture?.key??texture,cap)}catch{}
  return emitter;
 };
 proto.__torre2FireCap=cap;
 return true;
}
