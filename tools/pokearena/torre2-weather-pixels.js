/* Original WebGL/Pixi-safe pixel-weather overlay for Torre 2 only.
 * This module does not draw on Canvas2D, touch move VFX, change damage,
 * read or write saves, or fetch copyrighted assets. Four small palettes and
 * deterministic particles make the layer cheap, reproducible and testable.
 */
const PALETTE=Object.freeze({
 sun:Object.freeze([0xffe8a0,0xffcf73,0xfff7d0]),
 rain:Object.freeze([0x9bcbe7,0xd0ebfa,0x7bb5dc]),
 sand:Object.freeze([0xe2c186,0xf5d9a2,0xc39d67]),
 hail:Object.freeze([0xe5f6ff,0xa5d6ec,0xc4e6ff])
});
export const WEATHER_PIXEL_BUDGET=48;
export const WEATHER_FRAME_MS=90;
const within=(number,limit)=>((number%limit)+limit)%limit;
export function weatherPixelScene(kind,phase=0,width=640,height=360){
 if(!Object.hasOwn(PALETTE,kind))return [];
 const t=Math.max(0,Math.floor(Number(phase)||0));
 const w=Math.max(1,Math.round(Number(width)||640));
 const h=Math.max(1,Math.round(Number(height)||360));
 const count=kind==='sun'?20:kind==='rain'?48:kind==='sand'?34:30;
 const results=[];
 for(let i=0;i<count;i++){
  // Fixed dispersal with periodic translation, no per-frame RNG or textures.
  const x0=within(i*97+((i*i*13)%211)+17,w);
  const y0=within(i*43+(i*i*7)%101+31,h);
  let x=x0,y=y0,color=PALETTE[kind][i%3],rw=2,rh=2,alpha=.6;
  if(kind==='sun'){
   // Soft sunbeams across the top edge: no flashing or fullscreen tint.
   x=within(x0+t*2+i*3,w);y=within(y0-t*2,h);
   rw=i%5===0?15:7;rh=2;alpha=i%5===0?.26:.18;
  }else if(kind==='rain'){
   x=within(x0-t*3,w);y=within(y0+t*11,h);
   rw=i%4===0?2:1;rh=i%5===0?9:6;alpha=.55;
  }else if(kind==='sand'){
   x=within(x0+t*9,w);y=within(y0+t*2,h);
   rw=i%3===0?6:3;rh=i%6===0?2:1;alpha=.35;
  }else if(kind==='hail'){
   x=within(x0+t*3,w);y=within(y0+t*7,h);
   rw=i%7===0?4:2;rh=rw;alpha=.7;
  }
  results.push({x,y,w:rw,h:rh,color,alpha});
 }
 return results;
}
export function installWeatherPixels(scene,state){
 // Only Kanto/laboratory weather scenes invoke this. Never original Arena.
 const layer=scene.add.graphics().setDepth(2150);
 layer.setVisible(false);
 let accumulator=WEATHER_FRAME_MS,lastKind='none',lastRevision=-1,frame=0,draws=0;
 const instance={layer,lastKind,draws,frame,budget:WEATHER_PIXEL_BUDGET,disposed:false};
 function update(_time,delta){
  if(instance.disposed)return;
  const kind=state?.kind||'none';
  if(kind==='none'){
   if(lastKind!=='none'){layer.clear();layer.setVisible(false);}
   lastKind='none';lastRevision=state?.revision??0;instance.lastKind='none';
   return;
  }
  const dt=Number.isFinite(delta)?Math.max(0,Math.min(200,delta)):16;
  accumulator+=dt;
  if(kind===lastKind&&lastRevision===state.revision&&accumulator<WEATHER_FRAME_MS)return;
  accumulator=0;lastKind=kind;lastRevision=state.revision;instance.lastKind=kind;
  const view=scene.cameras.main.worldView;
  // Graphics uses world coordinates; track camera without setScrollFactor(0)
  // (which would double-offset the game's native camera transform).
  const x=Math.round(view.x),y=Math.round(view.y);
  const w=Math.round(view.width||640),h=Math.round(view.height||360);
  layer.clear();
  for(const p of weatherPixelScene(kind,frame,w,h)){
   layer.fillStyle(p.color,p.alpha);
   layer.fillRect(x+p.x,y+p.y,p.w,p.h);
  }
  layer.setVisible(true);
  frame++;draws++;instance.frame=frame;instance.draws=draws;
 }
 function dispose(){
  if(instance.disposed)return;
  instance.disposed=true;
  scene.events.off('update',update);
  layer.destroy();
  instance.lastKind='none';
  if(scene.__torre2WeatherPixels===instance)scene.__torre2WeatherPixels=null;
 }
 scene.__torre2WeatherPixels=instance;
 scene.events.on('update',update);
 scene.events.once('shutdown',dispose);
 return instance;
}
