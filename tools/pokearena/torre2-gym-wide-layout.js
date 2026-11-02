/* T36 — wide, fixed-camera gym interiors. Visual-only geometry.
 * Existing authentic FRLG overworld trainers and SpriteCollab PMD aces
 * are rendered by the established gym modules above this one Graphics layer.
 * No sprite sheet duplication, RNG, save, collision or battle writes.
 */
export const GYM_WIDE_VERSION='t36-wide-room-v1';
const ROOM=Object.freeze({x:66,y:68,width:508,height:200});
const INTERMEDIATES=Object.freeze([
 Object.freeze({x:157,y:160}),Object.freeze({x:483,y:160}),
 Object.freeze({x:157,y:215}),Object.freeze({x:483,y:215})
]);
export function gymWideLayout(stage){
 if(stage!==0&&stage!==1)return null;
 const aquatic=stage===1;
 const slots=INTERMEDIATES.slice(0,aquatic?4:3);
 return Object.freeze({
  stage,theme:aquatic?'water':'rock',cameraZoom:1,
  room:ROOM,
  leader:Object.freeze({x:290,y:126}),
  ace:Object.freeze({x:342,y:126}),
  slots:Object.freeze(slots),
  entrance:Object.freeze({x:320,y:266}),
  // Reserve y=277..360 for native campaign information and controls.
  interactiveFloorBottom:268
 });
}
export function drawGymWideRoom(scene,stage){
 const plan=gymWideLayout(stage);if(!plan)return null;
 const water=plan.theme==='water';
 const g=scene.add.graphics().setDepth(4);
 const block=(x,y,w,h,color,alpha=1)=>{
  g.fillStyle(color,alpha);g.fillRect(x,y,w,h);
 };
 const outline=(x,y,w,h,color)=>{
  g.lineStyle(2,color,1);g.strokeRect(x,y,w,h);
 };
 // Whole interior fits the EXISTING 640x360 camera. No camera zoom and
 // no scaled screenshot pasted into a narrow central strip.
 block(60,63,520,210,water?0x193e63:0x554536);
 block(65,68,510,200,water?0x3d8dc0:0xbca17a);
 outline(65,68,510,200,water?0xb4e6f7:0xdac8a5);
 block(70,72,500,15,water?0xb7d9e4:0x877664);
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
 // Main spine, side bridges and entrance all stay clear of trainer sprites.
 deck(304,122,32,145);
 deck(185,145,119,15);deck(336,145,119,15);
 deck(185,201,119,15);deck(336,201,119,15);
 const platforms=water?
  [[124,137,82,43],[434,137,82,43],[124,192,82,43],[434,192,82,43]]:
  [[124,137,82,43],[434,137,82,43],[124,192,82,43]];
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
 // Final stage is truly separate from the intermediate platforms.
 deck(244,87,152,53);
 deck(304,135,32,14);
 if(water){
  // Water outlets on both sides, with foam and a few pool highlights.
  for(const x of [230,402]){
   block(x,83,9,24,0x9cd5ed);
   block(x+2,91,4,17,0xe5f7f6);
   block(x-3,108,15,3,0xf4fcfc,.8);
  }
  for(const x of [90,524])for(const y of [108,183,246]){
   block(x,y,15,3,0xb4eaf6,.65);
   block(x+5,y+4,9,2,0xe8fbfb,.6);
  }
 }else{
  // Rock formations: small, original procedural terrain, not borrowed VFX.
  for(const [x,y,s] of [[100,126,18],[526,124,19],[102,233,17],[536,238,15],
    [227,185,12],[414,183,11],[260,242,10],[387,243,12]]){
   block(x,y,s,s-3,0x776858);
   block(x+3,y+2,s-7,s-9,0xc3b093);
   block(x+2,y+s-4,s-4,3,0x52483d);
  }
 }
 // Fine-grained rail posts, accenting bridges without covering crossings.
 for(const x of [189,294,336,447]){
  for(const y of [143,198]){
   block(x,y-5,6,9,water?0xdfedf0:0x9b8970);
   block(x+1,y-5,4,2,water?0xffffff:0xd8c5a2);
  }
 }
 // Entrance remains visible underneath the player's route controls.
 deck(294,252,52,16);
 block(308,262,24,4,water?0x5c94be:0x7f674d);
 scene.__torre2GymWideLayout=plan;
 return plan;
}
