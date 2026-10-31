/* Solo Kanto Shiny entrance — original, asset-free Phaser/WebGL pixel art.
 * Explicitly cosmetic. Never change approved native PMD sprites, moves,
 * hitboxes, combat clock, saves, capture chances or player controls.
 */
export const SHINY_DURATION_MS=1500;
const STAR_COUNT=9;
// Called only AFTER the real actor appears from its Poké Ball, or for an
// existing wild encounter. A fresh entrance on legitimate switches is allowed.
export function installShinyEntrance(scene,fighter,side=0){
 if(!scene?.add?.graphics||!scene?.events||!fighter)return null;
 const fx=scene.add.graphics().setDepth(2308).setData('torre2-shiny-stars',true);
 const token={side,species:String(fighter.def?.id||fighter.def?.nombre||''),
  duration:SHINY_DURATION_MS,disposed:false,graphic:fx};
 const debug=scene.__torre2ShinyDebug??={entrances:[],active:[]};
 debug.entrances.push({side,species:token.species});
 debug.active.push(token);
 let elapsed=0;
 function dispose(){
  if(token.disposed)return;
  token.disposed=true;
  scene.events.off('update',tick);
  scene.events.off('shutdown',dispose);
  scene.events.off('destroy',dispose);
  const i=debug.active.indexOf(token);
  if(i>=0)debug.active.splice(i,1);
  if(fx.active)fx.destroy();
 }
 function tick(_time,delta=0){
  if(token.disposed)return;
  elapsed+=Math.max(0,Number.isFinite(Number(delta))?Number(delta):0);
  if(elapsed>=SHINY_DURATION_MS||fighter.ko||fighter.spr?.active===false){
   dispose();return;
  }
  fx.clear();
  const opacity=Math.max(.05,1-elapsed/SHINY_DURATION_MS);
  const x=Number(fighter.x)||0;
  const y=(Number(fighter.y)||0)-(Number(fighter.alto)||34)*.53;
  for(let i=0;i<STAR_COUNT;i++){
   const angle=i*Math.PI*2/STAR_COUNT+(side?1:-1)*elapsed*.0013;
   const radius=18+(i%3)*5+elapsed*.012;
   const px=Math.round(x+Math.cos(angle)*radius);
   const py=Math.round(y+Math.sin(angle)*radius*.65);
   const tint=i%3===0?0xffffff:i%2===0?0xffd85c:0x8ae8ff;
   // Crisp outlined 9px star. More legible against dark arenas without
   // affecting PMD image tint, depth of the HUD or any native attack.
   fx.fillStyle(0x0b1732,opacity*.9);
   fx.fillRect(px-5,py-1,11,3).fillRect(px-1,py-5,3,11);
   fx.fillStyle(tint,opacity);
   fx.fillRect(px-4,py,9,1).fillRect(px,py-4,1,9);
   fx.fillStyle(0xffffff,opacity);
   fx.fillRect(px-1,py-1,3,3);
  }
 }
 scene.events.on('update',tick);
 scene.events.once('shutdown',dispose);
 scene.events.once('destroy',dispose);
 tick(0,0);
 return {destroy:dispose,get elapsed(){return elapsed},get disposed(){return token.disposed},graphic:fx};
}
