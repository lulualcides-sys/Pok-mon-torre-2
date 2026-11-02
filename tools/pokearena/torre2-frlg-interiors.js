/* Optional room art cutouts from an authentic FireRed locality sheet.
 * Composite reference sheets include the town on the left and rooms on
 * the right/bottom; render ONLY the correct interior crop, never a random
 * duplicate exterior. Missing room art => use existing functional screens.
 */
export const ROOM_CROPS=Object.freeze({
 pallet:{
  house:[399,23,215,165],rival:[399,194,215,168],
  lab:[814,24,211,235]
 },
 viridian:{
  center:[782,25,243,153],mart:[783,202,238,141],
  gym:[1030,24,320,385],school:[1030,384,166,140]
 },
 pewter:{
  center:[782,24,243,153],mart:[782,198,243,150],
  gym:[790,544,190,247],museum:[4,688,451,208]
 },
 cerulean:{
  center:[780,24,245,152],mart:[780,204,246,145],
  gym:[1033,24,258,317],bike:[782,381,245,151]
 },
 vermilion:{
  center:[781,23,245,161],mart:[782,205,246,145],
  gym:[1034,24,168,340]
 },
 lavender:{
  center:[399,22,241,163],mart:[399,204,240,143],
  fuji:[647,24,195,145]
 },
 celadon:{
  center:[858,23,213,145],gym:[1013,637,183,275],
  department:[3,953,183,303]
 },
 fuchsia:{
  center:[781,21,243,167],mart:[783,195,240,151],
  gym:[1030,23,247,365],safari:[1279,23,150,149]
 },
 cinnabar:{
  center:[397,23,241,164],mart:[398,197,243,149],
  gym:[712,22,484,395],lab:[4,453,438,174]
 },
 saffron:{
  center:[903,621,196,156],mart:[1107,622,169,155],
  gym:[1550,21,402,330],dojo:[1551,393,173,215],
  silph:[902,22,645,539]
 }
});
export function canRenderInterior(scene,location,kind){
 const key='frlg-location-'+location,rect=ROOM_CROPS[location]?.[kind];
 if(!rect||!scene.textures.exists(key))return false;
 const t=scene.textures.get(key),s=t.source?.[0];
 return !!(s&&rect[0]+rect[2]<=s.width&&rect[1]+rect[3]<=s.height);
}
export function renderInteriorScene(scene,location,kind,{
 centerX=227,centerY=179,maxWidth=330,maxHeight=200,depth=5
}={}){
 if(!canRenderInterior(scene,location,kind))return false;
 const rect=ROOM_CROPS[location][kind],key='frlg-location-'+location,
  source=scene.textures.get(key),name='frlg_room_'+kind;
 if(!source.has(name))source.add(name,0,...rect);
 if(typeof Phaser!=='undefined')
  source.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const scale=Math.min(maxWidth/rect[2],maxHeight/rect[3],2);
 scene.add.image(centerX,centerY,key,name).setOrigin(.5,.5)
  .setDisplaySize(rect[2]*scale,rect[3]*scale).setDepth(depth);
 return true;
}

/* Repeating a genuine 16px floor tile from the SAME FireRed room avoids
 * giant blank flat-color panels around the boss platform. No pasted
 * screenshot, CSS background, extra texture download or battle change. */
export function addGymInteriorFloor(scene,location,{
 x=83,y=82,width=474,height=128,depth=4.2
}={}){
 if(!canRenderInterior(scene,location,'gym'))return null;
 const key='frlg-location-'+location,texture=scene.textures.get(key);
 const room=ROOM_CROPS[location].gym;
 // Pick clean room-floor pixels, away from wall/roof and entrance signs.
 const ox=location==='cerulean'?72:24;
 const oy=location==='cerulean'?170:Math.max(30,room[3]-64);
 const name='torre2-gym-floor-'+location;
 if(!texture.has(name))texture.add(name,0,room[0]+ox,room[1]+oy,16,16);
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 // Never use TileSprite with a cropped frame of this SAME texture:
 // the original Kanto map hit a real Android/WebGL UV corruption that way.
 // Sixty small Phaser Images share one atlas and batch safely instead.
 let first=null;
 for(let yy=0;yy<height;yy+=32)for(let xx=0;xx<width;xx+=32){
  const tile=scene.add.image(x+xx,y+yy,key,name).setOrigin(0)
   .setDisplaySize(Math.min(32,width-xx),Math.min(32,height-yy))
   .setDepth(depth).setData('torre2-gym-floor',location);
  if(!first)first=tile;
 }
 return first;
}


/* Full-width gym stage. The former renderInteriorScene(... maxHeight:136)
 * shrank a 190x247/258x317 FireRed room into a tiny portrait at x320.
 * That looked like a zoomed menu thumbnail rather than a playable room.
 * Instead, reuse the ORIGINAL 16px FireRed floor tiles above, then draw
 * static pixel-aligned platforms across the entire 474px stage. No camera
 * zoom, no stretched trainer art, no new hitboxes, no extra textures/timers.
 */
export const GYM_STAGE_BOUNDS=Object.freeze({x:83,y:82,width:474,height:128});
const STAGE_PALETTE=Object.freeze({
 pewter:[0x56483b,0x9d896d,0xd6c39c,0x3c302a],
 cerulean:[0x103f60,0x3189a9,0xa6e5e9,0x16516f],
 vermilion:[0x66512d,0xd6b958,0xf2e6a1,0x6e5a34],
 celadon:[0x244f35,0x70ad6b,0xc4df94,0x376d45],
 fuchsia:[0x4b3658,0x9470a6,0xc7afd5,0x584264],
 saffron:[0x3b3b6c,0x8b87c8,0xd5d0f0,0x515181],
 cinnabar:[0x572c27,0xc16c49,0xf3bb80,0x71362c],
 viridian:[0x4c4930,0x9a9a61,0xd3d1a0,0x57543c]
});
export function renderGymStage(scene,location){
 const palette=STAGE_PALETTE[location];
 if(!palette)return null;
 const [wall,ground,light,dark]=palette;
 const g=scene.add.graphics().setDepth(5);
 // The stage occupies its own screen: left and right trainer platforms,
 // a clear central approach and the final leader/ace dais.
 g.fillStyle(wall).fillRect(83,82,474,10).fillRect(83,82,10,128)
  .fillRect(547,82,10,128).fillRect(83,203,474,7);
 g.fillStyle(dark,.9).fillRect(97,94,112,109).fillRect(431,94,112,109);
 g.fillStyle(ground).fillRect(111,103,86,99).fillRect(443,103,86,99);
 g.fillStyle(light).fillRect(111,103,86,5).fillRect(443,103,86,5);
 // Four trainer positions stay on dry 86px-wide side aisles. There are no
 // obstacles/hitboxes at x157/483, y139/192.
 for(const x of [122,454])for(const y of [118,170]){
  g.fillStyle(dark,.48).fillRect(x,y,64,28);
  g.fillStyle(ground).fillRect(x+2,y+1,60,23);
  g.fillStyle(light,.9).fillRect(x+3,y+1,58,3);
 }
 // Central walkway is deliberately continuous; no room thumbnail or zoom.
 g.fillStyle(dark).fillRect(246,92,148,111);
 g.fillStyle(ground).fillRect(252,96,136,106);
 for(let y=98;y<201;y+=16)for(let x=254;x<388;x+=16){
  if(((x+y)>>4)%2===0)g.fillStyle(light,.11).fillRect(x,y,15,15);
 }
 g.fillStyle(light).fillRect(258,151,124,5).fillRect(258,197,124,5);
 g.fillStyle(wall).fillRect(258,156,124,41);
 g.fillStyle(ground).fillRect(263,159,114,35);
 // Environmental accents are static Phaser graphics, not new sprites.
 if(location==='cerulean'){
  for(const x of [100,532])for(let y=101;y<198;y+=19){
   g.fillStyle(0x65c7d9,.9).fillRect(x,y,7,3);
   g.fillStyle(0xc1eff0,.65).fillRect(x+2,y+5,4,2);
  }
 }else if(location==='pewter'){
  for(const x of [100,213,418,533])for(const y of [100,176]){
   g.fillStyle(0x75614c).fillRect(x,y,9,8);
   g.fillStyle(0xc4aa83).fillRect(x+1,y,6,2);
  }
 }else{
  for(const x of [100,533])for(const y of [111,145,179]){
   g.fillStyle(light,.7).fillRect(x,y,6,3);
  }
 }
 const report=Object.freeze({location,mode:'full-width',zoom:1,
  bounds:GYM_STAGE_BOUNDS,trainerColumns:Object.freeze([157,483]),
  leaderPlatform:Object.freeze({x:258,y:151,width:124,height:51}),
  staticDraw:true});
 scene.__torre2GymStage=report;
 return report;
}
