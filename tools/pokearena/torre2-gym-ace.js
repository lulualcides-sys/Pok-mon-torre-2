/* T35 — decorative Kanto gym aces. Native PMD SpriteCollab Idle sheets only.
 * The scene owns every display object; no save, combat, trainer or RNG writes.
 * Asset provenance: same locally mirrored PMD sprites used by Arena/Torre 2.
 */
export const GYM_ACE_VERSION='t35-native-idle-v1';
const DEX=Object.freeze({onix:'0095',starmie:'0121',raichu:'0026',vileplume:'0045',
 weezing:'0110',alakazam:'0065',arcanine:'0059',rhyhorn:'0111'});
const LEADERS=Object.freeze(['brock','misty','surge','erika','koga','sabrina','blaine','giovanni']);
export function gymAcePlan(gyms,stage,manifest){
 if(!Number.isInteger(stage)||stage<0||stage>=8)return null;
 const gym=gyms?.[stage];if(!gym)return null;
 const species=gym.boss,dex=DEX[species];
 if(!dex||!gym.leaderTeam?.includes(species))throw Error('Gym ace must be an actual member of the unchanged leader team');
 const idle=manifest?.[dex]?.anims?.Idle;
 const valid=idle&&Number.isInteger(idle.fw)&&Number.isInteger(idle.fh)&&
  idle.fw>=12&&idle.fw<=256&&idle.fh>=12&&idle.fh<=256&&
  Array.isArray(idle.durations)&&idle.durations.length>0&&idle.durations.length<=40&&
  typeof idle.file==='string'&&new RegExp('^'+dex+'/[A-Za-z0-9_-]+-Anim\\.png$').test(idle.file);
 return Object.freeze({stage,leader:gym.leader,leaderSprite:LEADERS[stage],species,dex,
  textureKey:'torre2-gym-ace-'+dex,file:valid?'assets/pmd/'+idle.file:null,
  frameWidth:valid?idle.fw:0,frameHeight:valid?idle.fh:0,
  durations:valid?[...idle.durations]:[],assetReady:!!valid});
}
export function gymAcePlacement(plan){
 const big=plan?.species==='onix'||plan?.species==='arcanine';
 return Object.freeze({leaderX:293,aceX:351,baseline:190,
  maxWidth:big?74:62,maxHeight:big?78:65});
}
export function drawGymAce(scene,plan,addLeader,{token=null}={}){
 if(!plan)return null;
 const p=gymAcePlacement(plan);
 scene.add.ellipse(p.leaderX,p.baseline,26,6,0x11243c,.48).setDepth(12);
 const leader=addLeader(scene,plan.leaderSprite,p.leaderX,p.baseline,{scale:1.35,depth:16});
 if(leader)leader.setData('torre2-gym-leader',plan.leader);
 const report={stage:plan.stage,leader:plan.leader,species:plan.species,dex:plan.dex,
  textureKey:plan.textureKey,version:GYM_ACE_VERSION,decorative:true,ready:false,
  sprite:null,leaderSprite:leader||null,reason:null};
 scene.__torre2GymAce=report;
 const mount=()=>{
  if(token&&!token.active)return;
  if(!scene.scene?.isActive?.())return;
  if(!scene.textures.exists(plan.textureKey)){
   report.reason='PMD Idle sheet not loaded';return;
  }
  const texture=scene.textures.get(plan.textureKey);
  if(typeof Phaser!=='undefined'&&Phaser.Textures?.FilterMode)
   texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  const scale=Math.min(1.8,p.maxWidth/plan.frameWidth,p.maxHeight/plan.frameHeight);
  const aceShadow=scene.add.ellipse(p.aceX,p.baseline,Math.min(65,plan.frameWidth*scale*.8),8,0x11243c,.48).setDepth(12);
  const sprite=scene.add.sprite(p.aceX,p.baseline-3,plan.textureKey,0)
   .setOrigin(.5,1).setScale(scale).setDepth(17).setData('torre2-gym-ace',plan.species);
  const count=Math.min(plan.durations.length,texture.frameTotal||1);
  if(count>1){
   const anim='torre2-gym-ace-idle-'+plan.dex;
   if(!scene.anims.exists(anim)){
    const mean=plan.durations.slice(0,count).reduce((a,b)=>a+(Number(b)||6),0)/count;
    scene.anims.create({key:anim,frames:scene.anims.generateFrameNumbers(plan.textureKey,{start:0,end:count-1}),
     frameRate:Math.max(2,Math.min(8,60/mean)),repeat:-1});
   }
   sprite.play(anim);
  }
  // One small idle motion, never physics or gameplay collision.
  if(scene.tweens?.add){
   scene.tweens.add({targets:sprite,y:p.baseline-5,duration:1300,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
   sprite.once('destroy',()=>scene.tweens.killTweensOf(sprite));
  }
  report.ready=true;report.sprite=sprite;report.shadow=aceShadow;report.reason=null;
 };
 if(!plan.assetReady){report.reason='Authentic PMD Idle manifest missing';return report;}
 if(scene.textures.exists(plan.textureKey)){mount();return report;}
 scene.load.once('complete',mount);
 scene.load.spritesheet(plan.textureKey,plan.file,{frameWidth:plan.frameWidth,frameHeight:plan.frameHeight});
 if(!scene.load.isLoading())scene.load.start();
 return report;
}
