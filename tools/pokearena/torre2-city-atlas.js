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
