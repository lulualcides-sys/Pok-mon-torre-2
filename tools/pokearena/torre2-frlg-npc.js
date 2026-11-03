/* Real FireRed overworld figures from pret/pokefirered decomp art.
 * Only 16x32 original source sprite cells; Pokémon sprites/moves are
 * exclusively provided by Arena 2D and are never touched here.
 */
export const NPC_TEXTURE_PREFIX='frlg-npc-';
const ALIAS=Object.freeze({
 bugcatcher:'bug_catcher',bug:'bug_catcher',
 youngster:'youngster',lass:'lass',rival:'blue',
 rocket:'rocket_m',sailor:'sailor',hiker:'hiker',
 swimmer:'swimmer_m_land',swimmer_f:'swimmer_f_land',
 tuber_m:'tuber_m_land',tuber_f:'tuber_f',
 blackbelt:'black_belt',ace:'cooltrainer_m',
 ace_f:'cooltrainer_f',
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
// Strict original asset path for reviewed gym NPCs: never silently turn a
// missing or misspelled role into a generic Youngster character.
export function reviewedGymNpcSpriteId(kind){
 return ALIAS[String(kind||'').toLowerCase()]||null;
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
export function addFireRedNPC(scene,kind,x,y,{scale=1,depth=8,strict=false}={}){
 const spriteId=strict?reviewedGymNpcSpriteId(kind):spriteIdForTrainer(kind);
 if(!spriteId)return null;
 const key=NPC_TEXTURE_PREFIX+spriteId;
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
