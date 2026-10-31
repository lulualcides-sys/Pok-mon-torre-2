/* Optional presentation layer for the leader's existing canonical ace.
 * Receives GYMS/KANTO_DEX from the campaign caller. Never mutates battle state or adds hit zones.
 * Intended for the dedicated gym-interior scene, NOT the city/route/battle HUD.
 */

const PALETTE=Object.freeze({
 ROCK:0x9c8c70,WATER:0x6fc9ed,ELECTRIC:0xf7d76a,GRASS:0x85ce7b,
 POISON:0xb68bc9,PSYCHIC:0xe7a1d1,FIRE:0xe59b67,GROUND:0xc5a16d
});
const SPECIAL=Object.freeze({'nidoran-f':'nidoran♀','nidoran-m':'nidoran♂','mr-mime':'mrmime'});
function dexOf(species,kantoDex){
 const name=SPECIAL[species]||species;
 const normalize=s=>String(s).toLowerCase().replace(/[^a-z0-9♀♂]/g,'');
 const index=kantoDex.findIndex(x=>normalize(x)===normalize(name));
 return index<0?null:String(index+1).padStart(4,'0');
}

export function gymAceSpec(stage,gyms,kantoDex){
 if(!Array.isArray(gyms)||!Array.isArray(kantoDex)||
    !Number.isInteger(stage)||stage<0||stage>=gyms.length||stage>=8)return null;
 const gym=gyms[stage],boss=gym.boss;
 if(!gym.leaderTeam.includes(boss))return null;
 const dex=dexOf(boss,kantoDex);
 if(!dex)return null;
 return Object.freeze({stage,leader:gym.leader,species:boss,
  dex,textureKey:'torre2-portrait-'+dex,color:PALETTE[gym.type]||0x9aa9af});
}

// Call during PRELOAD of the gym interior only; the asset is already mirrored
// locally by build-preview.mjs. Do not request any external sprites or CDN.
export function preloadGymAce(scene,stage,gyms,kantoDex){
 const spec=gymAceSpec(stage,gyms,kantoDex);
 if(!spec)return null;
 if(!scene.textures.exists(spec.textureKey))
  scene.load.image(spec.textureKey,'assets/pmd/'+spec.dex+'/portrait.png');
 return spec;
}

// Layout is supplied by the future gym interior. No interaction, collision,
// gameplay event, persistent state, battle sprite or input handler is created.
export function renderGymAce(scene,stage,gyms,kantoDex,{x,y,maxWidth=48,maxHeight=48,depth=30}={}){
 const spec=gymAceSpec(stage,gyms,kantoDex);
 if(!spec||!Number.isFinite(x)||!Number.isFinite(y))return null;
 if(!scene.textures.exists(spec.textureKey))return null;
 const tex=scene.textures.get(spec.textureKey);
 const source=tex.getSourceImage?.();
 const w=source?.width||tex.source?.[0]?.width||0;
 const h=source?.height||tex.source?.[0]?.height||0;
 if(w<=0||h<=0)return null;
 const scale=Math.min(1.5,Math.max(0.1,maxWidth/w),Math.max(0.1,maxHeight/h));
 const sprite=scene.add.image(x,y,spec.textureKey)
  .setOrigin(.5,1).setScale(scale).setDepth(depth+1)
  .setData('torre2-gym-ace',spec.species);
 const shadow=scene.add.ellipse(x,y-1,Math.min(maxWidth,w*scale)*.78,5,0x0b1923,.46)
  .setDepth(depth);
 const tween=scene.tweens.add({targets:sprite,y:y-2,duration:1200,
  ease:'Sine.easeInOut',yoyo:true,repeat:-1});
 return {spec,sprite,shadow,dispose(){tween.stop();sprite.destroy();shadow.destroy()}};
}
