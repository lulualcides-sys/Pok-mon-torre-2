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
// A cropped Image still uses the ORIGINAL sheet dimensions as its geometry.
 // A dedicated texture frame has true 16x32 bounds and fixes NPCs shifted
 // outside the map / incorrect hover targets on mobile.
function frontFrame(texture,key){
 const source=texture.source?.[0];
 if(!source||source.width<16||source.height<16)return null;
 const frame='torre2-front-16x32';
 if(!texture.has(frame))
  texture.add(frame,0,0,0,16,Math.min(32,source.height));
 return frame;
}
export function addFireRedNPC(scene,kind,x,y,{scale=1,depth=8}={}){
 const key=NPC_TEXTURE_PREFIX+spriteIdForTrainer(kind);
 if(!scene.textures.exists(key))return null;
 const tex=scene.textures.get(key);
 const frame=frontFrame(tex,key);
 if(!frame)return null;
 if(typeof Phaser!=='undefined')
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.image(x,y,key,frame).setOrigin(.5,1)
  .setDepth(depth).setScale(scale);
}
export function addRedPlayer(scene,x,y,{scale=1,depth=9}={}){
 const key=NPC_TEXTURE_PREFIX+'red_normal';
 if(!scene.textures.exists(key))return null;
 const tex=scene.textures.get(key),frame=frontFrame(tex,key);
 if(!frame)return null;
 if(typeof Phaser!=='undefined')
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.image(x,y,key,frame).setOrigin(.5,1)
  .setDepth(depth).setScale(scale);
}
