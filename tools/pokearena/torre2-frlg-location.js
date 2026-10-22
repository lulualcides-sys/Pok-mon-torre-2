/* Source-backed FireRed 16x16 overworld tile renderer for Phaser.
 * The supplied location image is a tile SOURCE, not a pasted background.
 * Each tile is its own Phaser GameObject, clipped to the playing field.
 * Trainer buttons, routes, bag and capture remain original game objects.
 */
export const FRLG_LOCALE_NAMES=Object.freeze(['route1','viridian','forest','pewter',
 'cerulean','vermilion','lavender','celadon','fuchsia','cinnabar']);
export function locationForCampaign(region){
 if(!region)return null;
 if(region.stage===0)return FRLG_LOCALE_NAMES[region.page]||null;
 const stage=region.stage,page=region.page;
 if(stage===1&&page>=2)return 'cerulean';
 if(stage===2&&page>=2)return 'vermilion';
 if(stage===3&&page===2)return 'lavender';
 if(stage===3&&page>=3)return 'celadon';
 if(stage===4&&page>=3)return 'fuchsia';
 if(stage===5&&page>=2)return 'celadon'; // Saffron art not yet verified
 if(stage===6&&page>=3)return 'cinnabar';
 if(stage===7&&page>=1)return 'viridian';
 return null;
}
export const TILE_VIEW=Object.freeze({
 route1:{cx:192,cy:315},
 viridian:{cx:472,cy:328},
 forest:{cx:395,cy:525},
 pewter:{cx:264,cy:248},
 cerulean:{cx:400,cy:315},
 vermilion:{cx:400,cy:317},
 lavender:{cx:197,cy:153},
 celadon:{cx:497,cy:365},
 fuchsia:{cx:425,cy:335},
 cinnabar:{cx:220,cy:133}
});
export function renderLocationTiles(scene,region){
 const id=locationForCampaign(region),key=id&&'frlg-location-'+id;
 if(!key||!scene.textures.exists(key))return false;
 const texture=scene.textures.get(key);
 const source=texture.source?.[0];
 if(!source||source.width<300||source.height<320)return false;
 const cols=23,rows=11,size=16;
 const center=TILE_VIEW[id],maxX=source.width-cols*size,
  maxY=source.height-rows*size;
 const x0=Math.floor(Math.max(0,Math.min(maxX,center.cx-cols*size/2))/16)*16,
  y0=Math.floor(Math.max(0,Math.min(maxY,center.cy-rows*size/2))/16)*16;
 // Keep the native FRLG pixel sharpness on GBA-sized displays.
 if(typeof Phaser!=='undefined')
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const sx=x0+col*size,sy=y0+row*size;
  if(sx+size>source.width||sy+size>source.height)continue;
  const name='frlg_'+sx+'_'+sy;
  if(!texture.has(name))texture.add(name,0,sx,sy,size,size);
  scene.add.image(21+col*size,90+row*size,key,name)
   .setOrigin(0,0).setDepth(1.35);
 }
 // Thin rim separates world tiles from the fixed battle panels.
 const border=scene.add.graphics().setDepth(1.49);
 border.lineStyle(2,0xc7e8bb);
 border.strokeRect(20,89,369,177);
 return true;
}
