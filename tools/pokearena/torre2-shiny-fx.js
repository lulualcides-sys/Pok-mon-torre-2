/* Individual shiny encounter entrance: 1.5s native Phaser pixel sparkle.
 * Never changes PMD sprites, native attack renderers or battle hitboxes.
 */
export const SHINY_DURATION_MS=1500;
export function installShinyEntrance(scene,fighter,side=0){
 if(!scene?.add?.graphics||!scene?.events||!fighter)return null;
 const fx=scene.add.graphics().setDepth(2320),stars=7;
 let elapsed=0,disposed=false;
 function dispose(){
  if(disposed)return;
  disposed=true;
  scene.events.off('update',tick);
  scene.events.off('shutdown',dispose);
  scene.events.off('destroy',dispose);
  fx.destroy();
 }
 function tick(_time,delta=0){
  if(disposed)return;
  elapsed+=Math.max(0,Number(delta)||0);
  if(elapsed>=SHINY_DURATION_MS||fighter.ko||!fighter.active&&fighter.spr?.active===false){dispose();return;}
  fx.clear();
  const alpha=1-elapsed/SHINY_DURATION_MS;
  const x=Number(fighter.x)||0,y=(Number(fighter.y)||0)-(Number(fighter.alto)||36)*.55;
  for(let i=0;i<stars;i++){
   const angle=i*2*Math.PI/stars+elapsed*.002*(side?1:-1),
    radius=17+(i%3)*5+elapsed/150;
   const px=Math.round(x+Math.cos(angle)*radius),py=Math.round(y+Math.sin(angle)*radius*.62);
   const tint=i%3===0?0xffffff:i%2?0xfde58a:0x98e8ff;
   fx.fillStyle(0x122639,alpha*.86).fillRect(px-4,py-1,9,3).fillRect(px-1,py-4,3,9);
   fx.fillStyle(tint,alpha).fillRect(px-3,py,7,1).fillRect(px,py-3,1,7);
   fx.fillStyle(0xffffff,alpha).fillRect(px,py,1,1);
  }
 }
 scene.events.on('update',tick);
 scene.events.once('shutdown',dispose);
 scene.events.once('destroy',dispose);
 tick(0,0);
 return {destroy:dispose,update:tick,get duration(){return elapsed},get disposed(){return disposed},graphic:fx};
}
