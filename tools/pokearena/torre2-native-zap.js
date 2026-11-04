/* Zap Cannon in native Poké Arena 2D pixel-art style.
 * Reuses the runtime's original p-rayo/p-electro textures (not external PNGs).
 * Pure integer geometry: deterministic mobile rendering and focused tests.
 */
export const ZAP_NATIVE_CLIENT_TEXTURES=Object.freeze(['p-rayo','p-electro']);
const clamp=(x,min=0,max=1)=>Math.max(min,Math.min(max,Number(x)||0));
const snap=n=>Math.round(n);

export function zapClientLightningGeometry(start,end,phase,frame=0){
 const p=clamp(phase),a={x:snap(start?.x),y:snap(start?.y)},
  b={x:snap(end?.x),y:snap(end?.y)};
 if(!Number.isFinite(a.x)||!Number.isFinite(a.y)||
    !Number.isFinite(b.x)||!Number.isFinite(b.y)||p<.055)return [];
 const diffX=b.x-a.x,diffY=b.y-a.y,len=Math.hypot(diffX,diffY);
 if(len<1)return [];
 const ux=diffX/len,uy=diffY/len,nx=-uy,ny=ux;
 const progress=clamp((p-.055)/.62),tip=Math.min(1,progress),
  back=Math.max(0,tip-.77);
 const alive=p<.87,fade=p>.76?clamp((.98-p)/.22):1;
 const segments=Math.min(25,Math.max(8,Math.ceil(len*(tip-back)/5)));
 const out=[];
 if(alive&&tip>0){
  for(let i=0;i<segments;i++){
   const local=(i+.5)/segments,t=back+(tip-back)*local;
   const jitter=Math.sin((i+frame*3)*2.1)*3.5*Math.sin(local*Math.PI);
   const x=snap(a.x+diffX*t+nx*jitter);
   const y=snap(a.y+diffY*t+ny*jitter);
   out.push({x,y,angle:Math.atan2(diffY,diffX)+
    (Math.sin((i+frame)*1.7)*.19),
    size:(i%3===0?12:9),alpha:fade*(i%4===0?.95:.75),
    texture:'p-rayo'});
  }
 }
 // Spark branches only after the main beam reaches the actual target.
 // Keep the opponent's body visible by using a sparse, short discharge.
 if(p>.53){
  const grow=clamp((p-.53)/.16),shrink=clamp((1-p)/.17);
  const count=6;
  for(let i=0;i<count;i++){
   const angle=i*Math.PI/3+frame*.25;
   const radius=(8+(i%3)*5)*grow;
   out.push({x:snap(b.x+Math.cos(angle)*radius),
    y:snap(b.y+Math.sin(angle)*radius),
    angle,texture:'p-electro',size:i%2?11:14,
    alpha:Math.max(.0,shrink*.88)});
  }
 }
 return out;
}
