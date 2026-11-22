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
 psychic:'psychic',biker:'biker',cyclist:'biker',scientist:'scientist',
 fisherman:'fisher',fisher:'fisher',gentleman:'gentleman',
 channeler:'channeler',camper:'camper',picnicker:'picnicker',
 brock:'brock',misty:'misty',surge:'lt_surge',erika:'erika',
 koga:'koga',sabrina:'sabrina',blaine:'blaine',giovanni:'giovanni',
 lorelei:'lorelei',bruno:'bruno',agatha:'agatha',lance:'lance',
 oak:'prof_oak',professor:'prof_oak',prof_oak:'prof_oak',
 trainer:'youngster',rocker:'rocker',acef:'cooltrainer_f',woman:'woman_1',
 oldman:'old_man_1',man:'man',bill:'bill',fuji:'mr_fuji',nurse:'nurse',clerk:'clerk',rocketf:'rocket_f'
});
export function spriteIdForTrainer(kind){
 return ALIAS[String(kind||'').toLowerCase()]||'youngster';
}
// A cropped Image still uses the ORIGINAL sheet dimensions as its geometry.
 // A dedicated texture frame has true 16x32 bounds and fixes NPCs shifted
 // outside the map / incorrect hover targets on mobile.
// Most FRLG overworld sheets use 16x32 cells; the biker sheet uses 32x32
// cells (10 frames in 320 px). A 16 px crop showed half the cyclist (VS intro).
export function npcCellWidth(width,height){return width===320&&height===32?32:16}
function frontFrame(texture,key){
 const source=texture.source?.[0];
 if(!source||source.width<16||source.height<16)return null;
 const cell=npcCellWidth(source.width,source.height);
 const frame=cell===16?'torre2-front-16x32':'torre2-front-32x32';
 if(!texture.has(frame))
  texture.add(frame,0,0,0,cell,Math.min(32,source.height));
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
// Player character chosen on the trainer-name screen: Red or Leaf (FireRed).
export function playerSpriteId(storage=globalThis.localStorage){
 try{return storage?.getItem('torre2-trainer-gender')==='leaf'?'green_normal':'red_normal'}catch{return 'red_normal'}
}
export function addRedPlayer(scene,x,y,{scale=1,depth=9}={}){
 // Customized look (trainer-look.js) when the player built one.
 let key=scene.textures.exists(NPC_TEXTURE_PREFIX+'player-look')?NPC_TEXTURE_PREFIX+'player-look':NPC_TEXTURE_PREFIX+playerSpriteId();
 if(!scene.textures.exists(key))key=NPC_TEXTURE_PREFIX+'red_normal';
 if(!scene.textures.exists(key))return null;
 const tex=scene.textures.get(key),frame=frontFrame(tex,key);
 if(!frame)return null;
 if(typeof Phaser!=='undefined')
  tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
 return scene.add.image(x,y,key,frame).setOrigin(.5,1)
  .setDepth(depth).setScale(scale);
}
