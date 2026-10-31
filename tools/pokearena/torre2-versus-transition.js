/* Standalone VS transition clock: Phaser owns the normal 2.5s timing.
 * One wall-clock watchdog prevents a busy/stalled Scene Clock leaving
 * the cinematic on screen indefinitely. Never enters combat after shutdown.
 */
export const VS_WATCHDOG_GRACE_MS=900;
export function scheduleVsEntry(scene,finish,durationMs=2500,{
 after=(callback,ms)=>setTimeout(callback,ms),
 cancelAfter=token=>clearTimeout(token)
}={}){
 if(!scene?.time?.delayedCall||!scene?.events?.once||
   !scene?.scene?.isActive||typeof finish!=='function')
  throw new TypeError('Active Phaser scene and transition callback required');
 let settled=false,phaser=null,wall=null;
 const cancel=()=>{
  if(settled)return false;
  settled=true;
  phaser?.remove?.(false);
  if(wall!==null)cancelAfter(wall);
  scene.events.off('shutdown',cancel);
  return true;
 };
 const complete=()=>{
  if(!cancel())return false;
  if(scene.scene.isActive())finish();
  return true;
 };
 scene.events.once('shutdown',cancel);
 phaser=scene.time.delayedCall(durationMs,complete);
 wall=after(complete,durationMs+VS_WATCHDOG_GRACE_MS);
 return {cancel,complete};
}
