/* Kanto environment tiles drawn as reusable 16x16 pixel motifs on Phaser Graphics.
 * Replaces random noise with readable vegetation, paving, rocky strata,
 * water ripples and theme-specific ground materials. No Pokémon art touched.
 * This is pure Phaser graphics, no canvas and no single large background image.
 */
const C={
 leaf:[0x367a44,0x2d6742,0x58aa56,0xa3cf73],
 shade:[0x265a48,0x295a49,0x3b8461,0x79aa76],
 stone:[0x717c76,0x526564,0x9fa99c,0x303f44],
 wall:[0x9c9784,0x6b706b,0xc8c0a5,0x515d5e],
 brick:[0xb1aaa0,0x8e948f,0xd6cdb5,0x566b71],
 sea:[0x3e9ed0,0x2076b5,0x84d7ec,0xd2f7f6],
 ice:[0x7ebdc9,0x70aabf,0xc7eff2,0xf1ffff],
 ash:[0x716e69,0x625e61,0xb1a496,0xef9b62],
 shadow:[0x50556b,0x454c5c,0x82869b,0xb2aaba],
 lava:[0x815747,0x785043,0xd6874b,0xffba5e],
 tile:[0xa69f81,0x848e84,0xc3b99d,0x657b7c],
 metal:[0x627b89,0x475f70,0x9dbcc6,0xc3dade],
 dirt:[0xbca374,0xa48b62,0xe3cb8b,0x748c65]
};
const sea=new Set(['sea','river','ship','water-gym']);
const frozen=new Set(['ice']);
const floor=new Set(['city','mansion','league','hall','tower','gate','dojo',
 'psychic-gym','electric-gym','fire-gym','grass-gym','poison-gym','ground-gym','hideout']);
const rock=new Set(['cliff','cave','victory','dragon']);
const dark=new Set(['graveyard']);
const hot=new Set(['volcano']);
const forest=new Set(['forest','safari','grassland']);
function tilePalette(b){
 if(sea.has(b))return C.sea;
 if(frozen.has(b))return C.ice;
 if(rock.has(b))return C.stone;
 if(dark.has(b))return C.shadow;
 if(hot.has(b))return C.lava;
 if(floor.has(b))return ['tower','hideout','electric-gym','psychic-gym'].includes(b)?C.metal:C.brick;
 if(forest.has(b))return C.shade;
 if(b==='road')return C.wall;
 return C.dirt;
}
function rect(g,x,y,w,h,c){
 g.fillStyle(c,1);g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}
function hash(x,y,k){
 let v=Math.imul(x+37,2654435761)^Math.imul(y+59,1597334677)^Math.imul(k+1,2246822519);
 v^=v>>>15;v=Math.imul(v,3266489917);v^=v>>>16;
 return(v>>>0)/4294967295;
}
export function drawKantoTiles(g,biome='route',seed=0){
 const p=tilePalette(biome);
 const WATER=sea.has(biome),SNOW=frozen.has(biome),ROCK=rock.has(biome);
 const FLOOR=floor.has(biome),FOREST=forest.has(biome),DARK=dark.has(biome);
 const HEAT=hot.has(biome),ROAD=biome==='road';
 // Clip implicitly to the inset area of the native map, 24x11 tiles.
 for(let yy=90;yy<266;yy+=16)for(let xx=20;xx<388;xx+=16){
  const x=xx,y=yy,q=hash(xx,yy,seed),v=hash(yy,xx,seed+61);
  rect(g,x,y,16,16,p[q<.17?0:q<.8?1:0]);
  if(WATER){
   rect(g,x+1,y+3,9,2,p[2]);
   rect(g,x+5,y+5,6,1,p[3]);
   rect(g,x+9,y+12,7,1,p[2]);
   rect(g,x+2,y+13,4,1,p[1]);
  }else if(SNOW){
   rect(g,x+1,y+4,12,4,p[2]);rect(g,x+4,y+2,5,3,p[3]);
   rect(g,x+2,y+12,6,2,p[2]);
   rect(g,x+12,y+9,2,4,p[3]);
  }else if(ROCK){
   rect(g,x+1,y+1,9,3,p[2]);rect(g,x+11,y+3,4,7,p[3]);
   rect(g,x,y+12,10,3,p[3]);rect(g,x+3,y+6,7,4,p[0]);
   rect(g,x+8,y+10,6,1,p[2]);
  }else if(FLOOR||ROAD){
   // Visible 16-pixel tile boundaries and mortar.
   rect(g,x,y,16,1,p[3]);rect(g,x,y,1,16,p[3]);
   rect(g,x+2,y+2,10,2,p[2]);
   rect(g,x+3,y+7,11,1,p[0]);
   rect(g,x+8,y+10,7,3,p[2]);
   if(ROAD&&q>.6)rect(g,x+5,y+7,6,2,0xf4dc9f);
  }else if(FOREST){
   rect(g,x+1,y+10,9,4,p[0]);rect(g,x+10,y+1,4,8,p[2]);
   rect(g,x+2,y+3,3,7,p[1]);rect(g,x+6,y+7,3,5,p[2]);
   rect(g,x+11,y+12,2,3,p[3]);rect(g,x+13,y+5,2,3,p[0]);
  }else if(DARK){
   rect(g,x+3,y+3,8,10,p[0]);rect(g,x+9,y+8,6,2,p[2]);
   rect(g,x,y+13,9,2,p[3]);rect(g,x+1,y+1,3,2,p[2]);
  }else if(HEAT){
   rect(g,x+3,y+3,7,6,p[0]);rect(g,x+10,y+8,5,5,p[3]);
   rect(g,x+13,y+10,2,4,0xffbd5f);rect(g,x+1,y+12,4,2,p[2]);
  }else{
   // Route verge: textured ground with frequent, recognizable low grasses.
   rect(g,x+2,y+2,3,2,p[2]);rect(g,x+8,y+5,7,2,p[0]);
   rect(g,x+10,y+11,5,1,p[3]);
   if(q<.55){
    rect(g,x+4,y+7,2,5,0x397a43);
    rect(g,x+2,y+9,2,3,0x57a550);
    rect(g,x+6,y+8,2,4,0x8bcb62);
   }
  }
  if(v<.15){
   rect(g,x+12,y+2,2,1,p[2]);
   rect(g,x+13,y+3,1,2,p[3]);
  }
 }
}
