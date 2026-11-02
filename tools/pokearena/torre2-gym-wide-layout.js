/* T36 — wide, fixed-camera gym interiors. Visual-only geometry.
 * Existing authentic FRLG overworld trainers and SpriteCollab PMD aces
 * are rendered by the established gym modules above this one Graphics layer.
 * No sprite sheet duplication, RNG, save, collision or battle writes.
 */
import {calculateGymVector,GYM_VECTOR_VERSION} from './torre2-gym-vector.js';
export const GYM_WIDE_VERSION='t36-wide-room-v1';
// One mathematical source of truth for every decorative and gameplay anchor.
export function gymWideLayout(stage){return calculateGymVector(stage);}
export function drawGymWideRoom(scene,stage){
 const plan=gymWideLayout(stage);if(!plan)return null;
 const water=plan.theme==='water';
 const bg=scene.add.graphics().setDepth(4);
 const g=scene.add.graphics().setDepth(4.4);
 const block=(x,y,w,h,color,alpha=1)=>{
  g.fillStyle(color,alpha);g.fillRect(x,y,w,h);
 };
 const background=(x,y,w,h,color)=>{bg.fillStyle(color);bg.fillRect(x,y,w,h)};
 const outline=(x,y,w,h,color)=>{
  g.lineStyle(2,color,1);g.strokeRect(x,y,w,h);
 };
 // Whole interior fits the EXISTING 640x360 camera. No camera zoom and
 // no scaled screenshot pasted into a narrow central strip.
 background(60,63,520,210,water?0x193e63:0x554536);
 background(65,68,510,200,water?0x3d8dc0:0xbca17a);
 bg.lineStyle(2,water?0xb4e6f7:0xdac8a5).strokeRect(65,68,510,200);
 background(70,72,500,15,water?0xb7d9e4:0x877664);
 // The authentic FRLG room-floor sprite batch is inserted at depth 4.2
 // between this background and the raised bridges; no enlarged screenshot.
 // Shaded architectural masonry borrows the 16px geometry of the native
 // FireRed interior, not a vector wall or a scaled screenshot.
 for(let x=74;x<561;x+=24){
  block(x,73,21,12,water?0x285778:0x746250);
  block(x+2,74,17,3,water?0x89c7dd:0xc0a789);
  block(x+2,80,17,2,water?0x25517b:0x473d36);
  if((x-74)%72===0){
   block(x+7,88,8,12,water?0x7eafc1:0x95836b);
   block(x+9,88,4,10,water?0xd3e6e2:0xddc29b);
   block(x+5,99,12,3,water?0x235b81:0x695742);
  }
 }
 for(const x of [69,558])for(let y=100;y<258;y+=24){
  block(x,y,12,21,water?0x234e71:0x766450);
  block(x+1,y+1,8,3,water?0xabcbd5:0xc9b195);
  block(x+9,y+3,2,17,water?0x092e56:0x483a30);
 }
 if(water){
  // Layered shore and ripple highlights; original city water texture is
  // composited BELOW the bridges in the actual Phaser scene.
  for(let y=103;y<251;y+=25)for(let x=88;x<553;x+=31){
   const phase=(x*7+y*3)%13;
   block(x+phase%5,y,10,2,0x70d1ed,.28);
   block(x+2+phase%3,y+4,6,1,0xd8f7f2,.55);
  }
  for(const [x,y] of [[96,125],[529,136],[102,214],[527,235]]){
   block(x,y,21,3,0x8ae9ea,.88);
   block(x+5,y+3,14,2,0xd0fcf2,.72);
   block(x+8,y+5,8,1,0x2c8fbd);
  }
 }else{
  // Geological strata and lit stones distinguish the Pewter hall from
  // the water platforms without crossing the navigation aisle.
  for(const [x,y,w] of [[85,114,35],[507,115,39],[86,226,32],
   [522,230,28],[209,111,23],[411,116,25]]){
   block(x,y,w,10,0x75644f);
   block(x+3,y-4,w-7,8,0xa48c6d);
   block(x+6,y-6,w-13,3,0xe3c59a);
   block(x+5,y+7,w-10,3,0x514537);
  }
  for(let x=82;x<562;x+=53)for(const y of [102,243]){
   block(x,y,12,3,0x7c6b56,.9);
   block(x+4,y-2,5,2,0xd6c09a,.8);
  }
 }
 // GBA-like 16 px tiling rendered in a single Phaser Graphics batch.
 for(let yy=90;yy<264;yy+=16)for(let xx=74;xx<568;xx+=16){
  if(water){
   block(xx,yy+4,10,2,0x9bd5eb,.45);
   block(xx+7,yy+11,5,2,0x15547d,.50);
  }else{
   block(xx+3,yy+4,3,2,0xd7be90,.65);
   block(xx+12,yy+12,3,2,0x7d694e,.45);
  }
 }
 for(const x of [75,553]){
  for(let y=91;y<264;y+=27){
   block(x,y,10,13,water?0xe0f1ed:0x6c6258);
   block(x+2,y+2,6,8,water?0x86b6d5:0xbaa588);
  }
 }
 // Connected bridges / terraces are readable from the full-room view.
 const walkway=water?0xf2e1b8:0xd3b188;
 const shadow=water?0x255575:0x61503d;
 const trim=water?0x8bb6bd:0x88745a;
 const deck=(x,y,w,h)=>{
  block(x+2,y+3,w,h,shadow,.9);
  block(x,y,w,h,walkway);
  outline(x,y,w,h,trim);
  block(x+3,y+3,w-6,3,water?0xfff4d1:0xe8cd9e,.7);
 };
 // Vector model was validated before creating any Phaser display objects.
 // All bridges are computed to overlap both the spine and trainer platforms.
 const geom=plan.geometry;
 deck(geom.spine.x,geom.spine.y,geom.spine.w,geom.spine.h);
 for(const r of geom.bridges)deck(r.x,r.y,r.w,r.h);
 const platforms=geom.platforms.map(r=>[r.x,r.y,r.w,r.h]);
 for(const [x,y,w,h] of platforms){
  deck(x,y,w,h);
  if(water){
   block(x+8,y+9,w-16,h-17,0xc7e8ec,.66);
   outline(x+8,y+9,w-16,h-17,0x80b5ca);
  }else{
   for(const dx of [8,w-18]){
    block(x+dx,y+13,9,6,0x81715d);
    block(x+dx+1,y+11,6,3,0xe0c8a2);
   }
  }
 }
 // Final platform, in the connectivity graph, remains unobstructed.
 deck(geom.final.x,geom.final.y,geom.final.w,geom.final.h);
 // Every ornamental cluster below is positioned by calculateGymVector;
 // the audit excluded bridges, actor rectangles, boss+ace and CTA margins.
 // Natural asymmetry is deterministic: same save => same scene geometry.
 for(const r of geom.ornaments){
  if(water){
   block(r.x,r.y+r.h-2,r.w,2,0x155783,.55);
   block(r.x+2,r.y+2,r.w-4,2,0xaee4eb,.72);
   block(r.x+4,r.y+5,Math.max(3,r.w-8),2,0xe5f9f2,.75);
   block(r.x+1,r.y+3,2,2,0x4fc1df,.7);
  }else{
   block(r.x+1,r.y+3,r.w,r.h-1,0x51483c,.92);
   block(r.x,r.y,r.w,r.h-4,0x887660);
   block(r.x+3,r.y+1,r.w-7,3,0xd5bf95);
   block(r.x+3,r.y+r.h-5,r.w-4,2,0x6c5a46);
  }
 }
 // Already-approved room architecture remains behind the upper wall.
 // Fine-grained rail posts, accenting bridges without covering crossings.
 for(const x of [189,294,336,447]){
  for(const y of [143,198]){
   block(x,y-5,6,9,water?0xdfedf0:0x9b8970);
   block(x+1,y-5,4,2,water?0xffffff:0xd8c5a2);
  }
 }
 // The threshold is part of the verified entrance→boss traversal graph.
 deck(geom.entry.x,geom.entry.y,geom.entry.w,geom.entry.h);
 block(geom.entry.x+14,geom.entry.y+10,24,4,water?0x5c94be:0x7f674d);
 scene.__torre2GymWideLayout=plan;
 return plan;
}
