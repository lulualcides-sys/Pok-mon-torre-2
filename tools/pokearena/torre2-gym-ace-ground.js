/* T80: align the VISIBLE PMD pixels of leader Pokémon with the feet
 * of the leader on the same raised floor. Transparent padding differs by
 * species. Never treat the bottom of a PNG cell as a Pokémon's feet.
 */
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
export function nativePmdFootOrigin(texture,plan){
 if(!texture?.source?.[0]?.image||!plan||
    typeof document==='undefined')return 1;
 try{
  const canvas=document.createElement('canvas');
  canvas.width=plan.fw;canvas.height=plan.fh;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return 1;
  ctx.drawImage(texture.source[0].image,
   0,0,plan.fw,plan.fh,0,0,plan.fw,plan.fh);
  return visibleFootOrigin(ctx.getImageData(0,0,plan.fw,plan.fh).data,
   plan.fw,plan.fh);
 }catch(error){
  console.warn('T80: PMD visible feet could not be sampled',error);
  return 1;
 }
}
