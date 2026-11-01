/* Original imagegen environment atlas, 31 October 2026. Reference art is
 * inspiration only; no uploaded third-party sprite sheet is redistributed.
 * Each texture frame is an independent Phaser Image, never a map backdrop. */
export const CITY_ATLAS_KEY='torre2-city-atlas-v1';
export const CITY_ATLAS_FILE='assets/ui/city-original/cerulean-atlas-v1.webp';
export const CITY_ATLAS_SIZE=Object.freeze([1536,1024]);
export const CITY_ATLAS_FRAMES=Object.freeze({
 center:Object.freeze([27,144,450,405]),
 gym:Object.freeze([489,4,578,544]),
 mart:Object.freeze([1080,150,452,395]),
 house:Object.freeze([12,563,495,440]),
 tree:Object.freeze([547,562,477,447]),
 planter:Object.freeze([1067,795,447,188])
});
export function citySpriteRect(name,x,y,height){
 const r=CITY_ATLAS_FRAMES[name];
 return r?{x,y,width:height*r[2]/r[3],height}:null;
}
export function addCitySprite(scene,name,x,y,height,{depth=20+y/1000}={}){
 if(!scene.textures.exists(CITY_ATLAS_KEY))return null;
 const rect=CITY_ATLAS_FRAMES[name],geometry=citySpriteRect(name,x,y,height);
 if(!rect||!geometry)return null;
 const texture=scene.textures.get(CITY_ATLAS_KEY);
 if(!texture.has(name))texture.add(name,0,...rect);
 texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.image(x,y,CITY_ATLAS_KEY,name).setOrigin(.5,1)
  .setDisplaySize(geometry.width,geometry.height).setDepth(depth)
  .setData('torre2-city-atlas-piece',name);
}

// Preload anticipates a valid leader result without applying rewards or saving.
export function needsCeruleanAtlas(state,result,trainerLimit){
 if(state?.stage===1)return true;
 const m=result?.marker;
 return state?.stage===0&&result?.finished===true&&result.won===true&&
  m?.stage===0&&m.trainer===state.trainer&&state.trainer>=trainerLimit&&
  !m.training&&!m.laboratory&&m.kind!=='wild'&&m.kind!=='rematch';
}

// Four separately cropped 256px original surface tiles. Small POT frames keep
// Phaser TileSprite backing textures bounded on mobile GPUs.
export const CITY_SURFACES_KEY='torre2-city-surfaces-v1';
export const CITY_SURFACES_FILE='assets/ui/city-original/cerulean-surfaces-v1.webp';
export const CITY_SURFACES_FRAMES=Object.freeze({
 water:Object.freeze([0,0,256,256]),paving:Object.freeze([256,0,256,256]),
 grass:Object.freeze([0,256,256,256]),stone:Object.freeze([256,256,256,256])
});
export const CITY_TEXTURES=Object.freeze([
 Object.freeze([CITY_ATLAS_KEY,CITY_ATLAS_FILE]),
 Object.freeze([CITY_SURFACES_KEY,CITY_SURFACES_FILE])
]);
export function addCitySurface(scene,name,x,y,width,height,depth,scale=.25){
 if(!scene.textures.exists(CITY_SURFACES_KEY))return null;
 const texture=scene.textures.get(CITY_SURFACES_KEY),frame=CITY_SURFACES_FRAMES[name];
 if(!frame)return null;
 if(!texture.has(name))texture.add(name,0,...frame);
 texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.tileSprite(x,y,width,height,CITY_SURFACES_KEY,name)
  .setOrigin(0).setDepth(depth).setTileScale(scale)
  .setData('torre2-city-surface',name);
}
