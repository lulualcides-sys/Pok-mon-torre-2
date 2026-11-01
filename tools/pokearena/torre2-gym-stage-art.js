/* Decorative pixel geometry only. No input zones, timers, physics or saves. */
const AREAS=Object.freeze([
 [39,47,166,76],[435,47,166,76],
 [42,157,69,112],[529,157,69,112],
 [221,165,57,103],[362,165,57,103]
]);
export const GYM_ART_PROTECTED=Object.freeze([
 [215,40,210,94],[286,125,68,158],
 [119,147,94,64],[427,147,94,64],
 [119,213,94,64],[427,213,94,64]
]);
export function gymStageArtModel(stage){
 if(stage!==0&&stage!==1)return null;
 return {stage,biome:stage===0?'rock':'water',
  regions:AREAS.map(([x,y,w,h])=>({x,y,w,h}))};
}
const rect=(g,x,y,w,h,c)=>g.fillStyle(c,1).fillRect(x,y,w,h);
function drawWater(g,{x,y,w,h},seed){
 rect(g,x-2,y-2,w+4,h+4,0x1c566f);
 rect(g,x,y,w,h,0x176c96);
 rect(g,x+3,y+3,w-6,h-6,0x238eb7);
 rect(g,x+5,y+5,w-10,h-10,0x249fbd);
 // Small offset ripple clusters suggest a pool, not a flat cyan rectangle.
 for(let row=0;row<Math.floor((h-13)/13);row++){
  const yy=y+9+row*13;
  for(let col=0;col<Math.max(1,Math.floor((w-15)/29));col++){
   const xx=x+8+col*29+((row*7+seed*11)%13);
   if(xx+13>=x+w-5)continue;
   rect(g,xx,yy,13,2,0x7adbdc);
   rect(g,xx+3,yy+3,7,1,0xc7f7e7);
   rect(g,xx-2,yy+6,4,1,0x46b4cf);
  }
 }
 // Stone lip: four separate edges, all within the decoration footprint.
 rect(g,x,y,w,3,0x8fbdc0);rect(g,x,y,3,h,0x80afb3);
 rect(g,x+w-3,y,3,h,0x4b7f8e);rect(g,x,y+h-3,w,3,0x487c88);
 for(let i=8;i<w-7;i+=17)rect(g,x+i,y,2,2,0xe0e7ce);
}
function drawRock(g,{x,y,w,h},seed){
 rect(g,x-2,y-2,w+4,h+4,0x594d45);
 rect(g,x,y,w,h,0x8a765e);
 rect(g,x+3,y+3,w-6,h-6,0xa28d70);
 for(let yy=y+8;yy<y+h-8;yy+=15){
  for(let xx=x+7;xx<x+w-8;xx+=18){
   const shift=((yy+seed*13)%7)-3,px=xx+shift;
   rect(g,px,yy,9,5,0x76685b);
   rect(g,px+1,yy-2,7,3,0xbdb099);
   rect(g,px+2,yy-3,4,1,0xe1cfaa);
   rect(g,px+3,yy+5,3,2,0x625b50);
  }
 }
 // Low-profile mineral seams and gravel remain outside all walkways.
 for(let i=0;i<Math.floor(w/22);i++){
  const xx=x+7+i*22;
  rect(g,xx,y+h-9,7,2,0x6b6259);
  rect(g,xx+3,y+h-11,3,2,0xd1ba92);
 }
 rect(g,x,y,w,2,0xd7bf95);rect(g,x,y,2,h,0xc5aa84);
 rect(g,x+w-2,y,2,h,0x65554c);rect(g,x,y+h-2,w,2,0x65554c);
}
export function renderGymStageArt(scene,stage){
 const m=gymStageArtModel(stage);
 if(!m)return null;
 const g=scene.add.graphics().setDepth(2).setData('torre2-gym-layer','biome');
 m.regions.forEach((r,i)=>m.biome==='water'?drawWater(g,r,i):drawRock(g,r,i));
 const evidence={stage,biome:m.biome,regions:m.regions.length,interactive:false,animated:false};
 scene.__torre2GymStageArt=evidence;
 return evidence;
}
