/* V0.3 — additive original WebGL stage-detail layer over Pewter metallic tile base.
 * Subtle corner lighting, beveled vents, microtexture, colored pools and parallax.
 * No PNG screenshots or browser Canvas2D textures.
 */
import {makeArena as createBase} from './arena-v02.js';
function rect(g,x,y,w,h,c,a=1){g.beginFill(c,a).drawRect(x,y,w,h).endFill()}
const noise=(x,y)=>{const n=Math.imul(x+3,73856093)^Math.imul(y+7,19349663);return (n^(n>>>11))>>>0;};
export function makeArena(P){
 const stage=createBase(P);
 const {root}=stage;
 const glare=new P.Graphics(),rim=new P.Graphics(),floor=new P.Graphics();
 // Transparent panel wear; irregular scratches across only 2.7% of panels.
 for(let y=65;y<500;y+=19)for(let x=61;x<910;x+=27){
  const n=noise(x,y);
  if(n%11===0){
   rect(floor,x+(n%8),y,8+(n%17),1,0xd9e7fd,.055);
   rect(floor,x+2+(n%9),y+3,3+(n%6),1,0x091229,.12);
  }
  if(n%73===0){
   rect(floor,x-3,y-2,2,2,0x152039,.55);
   rect(floor,x,y-1,4,2,0x8796bc,.14);
  }
 }
 floor.alpha=.88;
 root.addChildAt(floor,root.getChildIndex(stage.shadow));
 // Dusty specular streaks on the four metal panels near the arena boundary.
 for(const [cx,cy,sx,sy] of [
  [156,85,220,108],[835,94,202,95],[125,455,192,104],[841,464,230,117]
 ]){
  for(let j=9;j>=1;j--){
   glare.beginFill(0x9eccf3,j===1?.033:.0018);
   glare.drawEllipse(cx,cy,sx*j/9,sy*j/9);glare.endFill();
  }
 }
 // Soft vertical and horizontal illumination along tournament floor lines.
 for(let j=11;j>0;j--){
  glare.lineStyle(j*1.5,0x50d5fa,(12-j)*.0028);
  glare.moveTo(478,58).lineTo(478,473);
 }
 // A few small edge spotlights with falloff, avoiding rings under Pokémon.
 for(const [x,y] of [[62,133],[907,133],[61,401],[906,401]]){
  for(let r=48;r>=7;r-=7){
   glare.beginFill(0x55bbfb,.006+(48-r)/7000).drawEllipse(x,y,r,r*.49).endFill();
  }
 }
 root.addChildAt(glare,root.getChildIndex(stage.shadow));
 const edge=0x071027;
 // Bottom foreground metallic border, shadow and corner clamps.
 for(const [x,y,w,h] of [[0,0,960,19],[0,516,960,24],[0,0,20,540],[940,0,20,540]]){
  rect(rim,x,y,w,h,edge,.69);
  rect(rim,x+2,y+2,Math.max(1,w-4),Math.max(1,h-4),0x304264,.48);
 }
 rect(rim,22,20,916,3,0x9bc8ef,.17);rect(rim,24,516,912,3,0x070d1d,.6);
 // Three rows of stadium safety insets.
 for(const side of [29,922]){
  for(let y=65;y<487;y+=101){
   rect(rim,side-4,y,13,22,0x050b20,.77);
   rect(rim,side-2,y+2,9,17,0x365679,.85);
   rect(rim,side,y+5,5,9,0x93d6ee,.35);
  }
 }
 root.addChildAt(rim,root.getChildIndex(stage.shadow));
 // Dynamic lighting layer is separate and hardware-accelerated.
 const lighting=new P.Graphics();
 root.addChild(lighting);
 stage.lighting=lighting;
 stage.updateLighting=(time,shotPositions=[])=>{
  lighting.clear();
  // Barely moving cool glow at the center. Deterministic and cheap.
  const pulse=.03+Math.sin(time*1.6)*.012;
  lighting.beginFill(0x71d9ff,pulse).drawEllipse(481,268,135,82).endFill();
  // Physically motivated warm light only while fiery spells are present.
  for(const shot of shotPositions.slice(0,4)){
   for(let r=52;r>=15;r-=12){
    lighting.beginFill(0xff7d20,.020).drawEllipse(shot.x,shot.y,r,r*.63).endFill();
   }
  }
 };
 return stage;
}
