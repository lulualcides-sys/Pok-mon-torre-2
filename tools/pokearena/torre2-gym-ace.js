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
 // The native gym backdrop is only ~106 logical pixels wide (x267..373).
 // Keep both figures centered on its final platform, not over side walls.
 return Object.freeze({leaderX:294,aceX:342,baseline:190,
  maxWidth:big?58:52,maxHeight:big?72:60});
}
// PMD Idle sheets can have transparent rows below the feet. Anchoring the
// entire frame at the floor makes the visible Pokémon float above its shadow.
// Read at most one 256x256 frame once per gym; failures fall back safely.
export function gymAceVisibleBottomPadding(texture,documentRef=globalThis.document){
 try{
  const frame=texture?.get?.(0),img=frame?.source?.image;
  const w=frame?.cutWidth,h=frame?.cutHeight;
  if(!documentRef?.createElement||!img||!Number.isInteger(w)||!Number.isInteger(h)||
   w<1||h<1||w>256||h>256)return 0;
  const canvas=documentRef.createElement('canvas');canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return 0;
  ctx.drawImage(img,frame.cutX,frame.cutY,w,h,0,0,w,h);
  const pixels=ctx.getImageData(0,0,w,h).data;
  for(let y=h-1;y>=0;y--){
   for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>8)return h-1-y;
  }
 }catch{ /* Missing or tainted canvas must not block gym navigation. */ }
 return 0;
}
export function drawGymAce(scene,plan,addLeader,{token=null}={}){
 if(!plan)return null;
 const p=gymAcePlacement(plan);
 scene.add.ellipse(p.leaderX,p.baseline,26,6,0x11243c,.48).setDepth(12);
 const leader=addLeader(scene,plan.leaderSprite,p.leaderX,p.baseline,{scale:1.55,depth:16});
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
  const scale=Math.min(2.25,p.maxWidth/plan.frameWidth,p.maxHeight/plan.frameHeight);
  const aceShadow=scene.add.ellipse(p.aceX,p.baseline,Math.min(65,plan.frameWidth*scale*.8),8,0x11243c,.48).setDepth(12);
  const bottomPadding=gymAceVisibleBottomPadding(texture);
  const sprite=scene.add.sprite(p.aceX,p.baseline-3+bottomPadding*scale,plan.textureKey,0)
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
 // Phaser can complete an unrelated loader batch before this sheet is ready.
 // Listen for THIS spritesheet, not the global 'complete' event: otherwise
 // the ace silently disappears from a gym during concurrent preload.
 const event='filecomplete-spritesheet-'+plan.textureKey;
 const cleanup=()=>{
  scene.load.off(event,onReady);
  scene.load.off('loaderror',onError);
 };
 const onReady=()=>{cleanup();mount()};
 const onError=file=>{
  if(file?.key!==plan.textureKey)return;
  cleanup();report.reason='Authentic PMD Idle sheet failed to load';
 };
 scene.load.once(event,onReady);
 scene.load.on('loaderror',onError);
 token?.once?.('destroy',cleanup);
 scene.load.spritesheet(plan.textureKey,plan.file,{frameWidth:plan.frameWidth,frameHeight:plan.frameHeight});
 if(!scene.load.isLoading())scene.load.start();
 return report;
}
