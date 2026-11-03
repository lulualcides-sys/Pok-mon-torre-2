/* T81: keep visible feet of PMD Idle frames on the leader's floor.
 * Cache each sampled frame: looping sprites do not repeat canvas readback.
 */
const frameFootCache=new WeakMap();
export function visibleFootOrigin(pixels,width,height,alphaThreshold=20){
 if(!Number.isInteger(width)||width<1||width>256||
    !Number.isInteger(height)||height<1||height>256||
    !pixels||pixels.length<width*height*4)return 1;
 for(let y=height-1;y>=0;y--)
  for(let x=0;x<width;x++)
   if(pixels[(y*width+x)*4+3]>=alphaThreshold)
    return (y+1)/height;
 return 1;
}
export function nativePmdFootOrigin(texture,plan,frame=0){
 if(!texture?.source?.[0]?.image||!plan||
    typeof document==='undefined')return 1;
 const image=texture.source[0].image,cacheKey=String(frame);
 let origins=frameFootCache.get(texture);
 if(origins?.has(cacheKey))return origins.get(cacheKey);
 try{
  const f=texture.get?.(frame),fw=plan.fw,fh=plan.fh;
  if(!Number.isInteger(fw)||fw<1||fw>256||
     !Number.isInteger(fh)||fh<1||fh>256)return 1;
  // Phaser spritesheet frames use source-sheet crop coordinates.
  const sx=f&&Number.isFinite(f.cutX)?f.cutX:0;
  const sy=f&&Number.isFinite(f.cutY)?f.cutY:0;
  const canvas=document.createElement('canvas');
  canvas.width=fw;canvas.height=fh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return 1;
  ctx.drawImage(image,sx,sy,fw,fh,0,0,fw,fh);
  const y=visibleFootOrigin(ctx.getImageData(0,0,fw,fh).data,fw,fh);
  if(!origins){origins=new Map();frameFootCache.set(texture,origins);}
  origins.set(cacheKey,y);
  return y;
 }catch(error){
  console.warn('T81: PMD visible feet could not be sampled',error);
  return 1;
 }
}
export function lockNativePmdIdleFeet(sprite,texture,plan,firstFrameOrigin=null){
 if(!sprite||!texture||!plan)return false;
 const originForFrame=frame=>String(frame)==='0'&&Number.isFinite(firstFrameOrigin)?
  firstFrameOrigin:nativePmdFootOrigin(texture,plan,frame);
 sprite.setOrigin(.5,originForFrame(0));
 // Listener is disposed with the sprite. Keep y/scale/animation untouched.
 sprite.on?.('animationupdate',(_animation,frame)=>{
  if(!sprite.active)return;
  const name=frame?.textureFrame??sprite.frame?.name??0;
  sprite.setOrigin(.5,originForFrame(name));
 });
 return true;
}
