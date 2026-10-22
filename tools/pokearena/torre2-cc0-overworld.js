/* World decoration from actual licensed pixel sprites, not rectangles.
 * Shade's Puny World 16x16 (CC0) spritesheet is mirrored at build time.
 * Kanto locations and game actions are separate Phaser scene objects.
 * Retain the original Poké Arena 2D Pokémon images, portrait keys and moves.
 */
export const WORLD_SHEET='torre2-cc0-world';
const FRAME_RECTS={
 grass:[0,0,16,16],
 path:[64,16,16,16],
 rock:[0,64,32,32],
 shrub:[64,48,32,32],
 forest:[0,80,48,64],
 pine:[64,80,48,64],
 grove:[112,80,48,64],
 boulder:[160,80,32,32],
 cottage:[20,402,64,54],
 pokecenter:[90,405,64,58],
 houseBlue:[174,405,64,58],
 houseRed:[231,475,64,58],
 masonry:[196,400,48,48],
 market:[323,402,64,56],
 bridge:[311,366,48,31],
 fence:[345,441,48,21]
};
function frame(scene,id){
 const texture=scene.textures.get(WORLD_SHEET);
 if(!texture||texture.key==='__MISSING')return false;
 const name='kanto_'+id;
 if(texture.has(name))return name;
 const src=texture.source[0],rect=FRAME_RECTS[id];
 if(!rect||!src||rect[0]+rect[2]>src.width||
  rect[1]+rect[3]>src.height)return false;
 texture.add(name,0,...rect);
 return name;
}
function sprite(scene,id,x,y,w,h,{depth=1.4}={}){
 const frm=frame(scene,id);if(!frm)return null;
 return scene.add.image(x,y,WORLD_SHEET,frm)
  .setOrigin(.5,1).setDisplaySize(w,h).setDepth(depth);
}
function distance(x,y,pts){
 const p=[{x:80,y:246},...pts,{x:330,y:155}];
 let best=9999;
 for(let i=1;i<p.length;i++){
  const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,
   ((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
  best=Math.min(best,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
 }
 return best;
}
const random=(seed)=>{
 let s=seed>>>0;
 return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);
};
export function decorateWorldWithSprites(scene,region,points=[]){
 if(!scene.textures.exists(WORLD_SHEET))return false;
 const texture=scene.textures.get(WORLD_SHEET);
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const biome=region?.biome||'route';
 const rng=random((region?.stage??0)*593+(region?.page??0)*239+17);
 const wooded=['route','forest','safari','grassland','grass-gym'].includes(biome);
 const rocky=['pewter','cliff','cave','victory','ground-gym','volcano'].includes(biome);
 const civilized=['city','pewter','league','hall','tower','mansion','dojo',
  'fire-gym','water-gym','psychic-gym','electric-gym'].includes(biome);
 const sea=['river','sea','ship','water-gym'].includes(biome);
 // Place a restrained number of real foliage sprites, independent of
 // the path; leave the hit zones and trainer circles completely clear.
 const quantity=wooded?(biome==='forest'?26:16):civilized?5:rocky?8:10;
 const placed=[];
 for(let i=0;i<quantity*5&&placed.length<quantity;i++){
  const x=35+Math.floor(rng()*343),y=120+Math.floor(rng()*140);
  if(y>264||distance(x,y,points)<34||
   Math.hypot(x-74,y-228)<49||Math.hypot(x-326,y-162)<49||
   (rocky&&x<137&&y<163))continue;
  if(placed.some(p=>Math.hypot(p.x-x,p.y-y)<30))continue;
  const id=rocky&&rng()>.52?'rock':
   sea&&rng()>.4?'shrub':rng()>.65?'pine':'forest';
  const width=id==='rock'?30:34,height=id==='rock'?26:42;
  const img=sprite(scene,id,x,y,width,height);
  if(img)placed.push({x,y});
 }
 if(wooded){
  for(const [x,y]of [[29,139],[373,134],[30,251],[368,245]]){
   sprite(scene,'grove',x,y,40,48);
  }
 }
 // Real building assets, separated from the native PC / Mart click zones.
 if(['route','city'].includes(biome)){
  sprite(scene,'pokecenter',75,250,70,57,{depth:1.5});
  sprite(scene,'market',330,177,74,58,{depth:1.5});
 }else if(['pewter','ground-gym','water-gym','grass-gym',
  'electric-gym','psychic-gym','fire-gym','league','hall'].includes(biome)){
  sprite(scene,'houseRed',321,186,76,66,{depth:1.5});
  sprite(scene,'masonry',286,188,38,43,{depth:1.4});
 }else if(civilized){
  sprite(scene,'cottage',317,188,73,63,{depth:1.5});
  sprite(scene,'houseBlue',283,197,41,38);
 }else if(rocky){
  sprite(scene,'boulder',323,171,65,52,{depth:1.5});
 }
 return true;
}
