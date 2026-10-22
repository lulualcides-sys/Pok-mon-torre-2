/* Real FireRed overworld figures from pret/pokefirered decomp art.
 * Only 16x32 original source sprite cells; Pokémon sprites/moves are
 * exclusively provided by Arena 2D and are never touched here.
 */
export const NPC_TEXTURE_PREFIX='frlg-npc-';
const ALIAS=Object.freeze({
 bugcatcher:'bug_catcher',bug:'bug_catcher',
 youngster:'youngster',lass:'lass',rival:'blue',
 rocket:'rocket_m',sailor:'sailor',hiker:'hiker',
 swimmer:'swimmer_m_land',blackbelt:'black_belt',ace:'cooltrainer_m',
 psychic:'channeler',biker:'biker',cyclist:'biker',scientist:'scientist',
 fisherman:'fisher',fisher:'fisher',gentleman:'gentleman',
 channeler:'channeler',camper:'camper',picnicker:'picnicker',
 brock:'brock',misty:'misty',surge:'lt_surge',erika:'erika',
 koga:'koga',sabrina:'sabrina',blaine:'blaine',giovanni:'giovanni',
 lorelei:'lorelei',bruno:'bruno',agatha:'agatha',lance:'lance',
 trainer:'youngster',rocker:'biker'
});
export function spriteIdForTrainer(kind){
 return ALIAS[String(kind||'').toLowerCase()]||'youngster';
}
export function addFireRedNPC(scene,kind,x,y,{scale=1.0,depth=8}={}){
 const name=spriteIdForTrainer(kind),key=NPC_TEXTURE_PREFIX+name;
 if(!scene.textures.exists(key))return null;
 const texture=scene.textures.get(key);
 const source=texture.source?.[0];
 if(!source||source.width<16||source.height<16)return null;
 // All people sprites are authored frame sheets. Select top-left front
 // pose, never stretch the whole sheet into a 16px character.
 const w=Math.min(16,source.width),h=Math.min(32,source.height);
 const image=scene.add.image(x,y,key).setOrigin(.5,1).setDepth(depth);
 image.setCrop(0,0,w,h);
 // Force pixels to be hard-edged, matching the FireRed tile sources.
 if(typeof Phaser!=='undefined')texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 image.setScale(scale);
 return image;
}
export function addRedPlayer(scene,x,y,options={}){
 const key=NPC_TEXTURE_PREFIX+'red_normal';
 if(!scene.textures.exists(key))return null;
 const texture=scene.textures.get(key);
 const image=scene.add.image(x,y,key).setOrigin(.5,1)
  .setDepth(options.depth??9);
 image.setCrop(0,0,Math.min(16,texture.source[0].width),
  Math.min(32,texture.source[0].height));
 if(typeof Phaser!=='undefined')texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
 image.setScale(options.scale??1);
 return image;
}
