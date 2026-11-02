/* Cerulean organic foliage — real art cropped from user-approved concept
 * sheet already retained in the repository. Reference-only sheet is never
 * rendered as a full game background. Canvas isolates individual trees into
 * transparent pixel textures; no vector recreation and no gameplay changes.
 * The source is our ChatGPT-generated art, not a Nintendo sprite sheet.
 */
// Individual trees extracted from the original higher-resolution, assistant-generated
// Kanto sheet, not from its blurry 512x384 summary preview. 320x176, 8 cells.
export const CERULEAN_NATIVE_SOURCE_KEY='torre2-cerulean-native-trees-v2';
export const CERULEAN_NATIVE_SOURCE_FILE='assets/ui/city-original/cerulean-native-trees-v2.png';
export const CERULEAN_NATIVE_SOURCE_DIMENSIONS=Object.freeze([320,176]);
export const CERULEAN_NATIVE_FOLIAGE_FRAMES=Object.freeze({
 oak_sun:Object.freeze([0,0,80,88]),
 oak_lime:Object.freeze([80,0,80,88]),
 oak_deep:Object.freeze([160,0,80,88]),
 oak_autumn:Object.freeze([240,0,80,88]),
 sakura:Object.freeze([0,88,80,88]),
 wisteria:Object.freeze([80,88,80,88]),
 berry:Object.freeze([160,88,80,88]),
 pine:Object.freeze([240,88,80,88])
});
export const CERULEAN_FOLIAGE_SOURCE_KEY='torre2-cerulean-organic-ref-v1';
export const CERULEAN_FOLIAGE_SOURCE_FILE='assets/ui/city-original/cerulean-organic-reference-v1.webp';
// Source preview: reference-assets/kanto/concept-previews/vegetation_forest.webp
// Rectangles are in actual 512×384 preview pixel coordinates. No source text
// or surrounding sheet borders are included.
export const CERULEAN_FOLIAGE_FRAMES=Object.freeze({
 oak_light:Object.freeze([81,14,23,27]),
 oak_gold:Object.freeze([105,14,23,27]),
 oak_dark:Object.freeze([129,14,23,27]),
 oak_fresh:Object.freeze([153,14,23,27]),
 blossom:Object.freeze([251,14,25,28]),
 oak_moss:Object.freeze([275,14,24,28]),
});
export const CERULEAN_FOLIAGE_SOURCE_DIMENSIONS=Object.freeze([512,384]);
export function isFoliageBackdrop(r,g,b){
 // A conservative dark-blue matte key. Brown trunks and green outlines stay.
 return r<75&&g<75&&b<86&&b+5>=r&&b+3>=g;
}
export function isolateFoliagePixels(pixels){
 // A pure, testable operation. Input may be Uint8ClampedArray/Uint8Array.
 for(let i=0;i<pixels.length;i+=4)if(isFoliageBackdrop(pixels[i],pixels[i+1],pixels[i+2]))pixels[i+3]=0;
 return pixels;
}
function textureKey(name){return 'torre2-organic-cerulean-'+name;}
function createFoliageTexture(scene,name){
 const coords=CERULEAN_FOLIAGE_FRAMES[name],key=textureKey(name);
 if(!coords||!scene.textures.exists(CERULEAN_FOLIAGE_SOURCE_KEY))return null;
 if(scene.textures.exists(key))return key;
 const source=scene.textures.get(CERULEAN_FOLIAGE_SOURCE_KEY).getSourceImage();
 if(!source||source.width!==512||source.height!==384)return null;
 const [sx,sy,w,h]=coords;
 const texture=scene.textures.createCanvas(key,w,h);
 const ctx=texture.getContext();
 ctx.clearRect(0,0,w,h);
 ctx.drawImage(source,sx,sy,w,h,0,0,w,h);
 const img=ctx.getImageData(0,0,w,h);
 isolateFoliagePixels(img.data);
 ctx.putImageData(img,0,0);
 texture.refresh();
 texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return key;
}
function addNativeCeruleanTree(scene,x,y,height,name){
 const rect=CERULEAN_NATIVE_FOLIAGE_FRAMES[name],key=CERULEAN_NATIVE_SOURCE_KEY;
 if(!rect||!scene.textures.exists(key))return null;
 const texture=scene.textures.get(key);
 const src=texture.getSourceImage();
 if(!src||src.width!==320||src.height!==176)return null;
 if(!texture.has(name))texture.add(name,0,...rect);
 texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.image(x,y,key,name).setOrigin(.5,1)
  .setDisplaySize(Math.round(height*rect[2]/rect[3]),height)
  .setDepth(20+y/1000).setData('torre2-city-layer','vegetation')
  .setData('torre2-cerulean-foliage',name)
  .setData('torre2-cerulean-foliage-quality','native-v2');
}
export function addCeruleanOrganicTree(scene,x,y,height,name='oak_sun'){
 const native=addNativeCeruleanTree(scene,x,y,height,name);
 if(native)return native;
 // Backward-compatible fallback if the new compact atlas cannot load.
 const fallbackNames={oak_sun:'oak_light',oak_lime:'oak_gold',
  oak_deep:'oak_dark',oak_autumn:'oak_gold',sakura:'blossom',
  wisteria:'oak_moss',berry:'oak_fresh',pine:'oak_dark'};
 name=fallbackNames[name]||name;
 const key=createFoliageTexture(scene,name);
 if(!key)return null; // Missing asset: retain the previously working tree.
 const [,,w,h]=CERULEAN_FOLIAGE_FRAMES[name];
 return scene.add.image(x,y,key).setOrigin(.5,1)
  .setDisplaySize(Math.round(height*w/h),height).setDepth(20+y/1000)
  .setData('torre2-city-layer','vegetation')
  .setData('torre2-cerulean-foliage',name);
}
