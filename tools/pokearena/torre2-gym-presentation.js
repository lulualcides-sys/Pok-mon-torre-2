import {addCitySurface} from './city-atlas.js';
import {addFireRedNPC,spriteIdForTrainer} from './frlg-npc.js';
import {drawBadgeIcon} from './campaign-art.js';
const KINDS=['brock','misty','surge','erika','koga','sabrina','blaine','giovanni','lorelei','bruno','agatha','lance','rival'];
const COLORS=[0xb39a72,0x5bcce8,0xe8ce66,0x83bb72,0xab7dd0,0xb99ae9,0xef9862,0x9fb176,0x9ce8ef,0xb89b76,0xaa7edb,0xda8269,0xe4cf88];
export function gymPresentationModel(state,stage,opponent,limit,tm){
 const index=state.stage,remaining=Math.max(0,limit-state.trainer);
 return {index,name:stage.leader,city:stage.city,type:stage.type,badge:stage.badge,
  ace:opponent?.id||stage.boss,level:opponent?.level||stage.leaderLevels?.at(-1),
  remaining,ready:!state.champion&&remaining===0,
  earned:(state.badges||[]).includes(stage.badge),tm:tm?.name||null,
  kind:KINDS[index]||'rival',color:COLORS[index]||COLORS[12]};
}
// Own menu texture: never modify or evict the battle's PMD sheets.
export function gymAceKey(dex){return 'torre2-gym-ace-'+dex}
export function visiblePixelBounds(pixels,width,height){
 let left=width,top=height,right=-1,bottom=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=16){
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 return right<0?null:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}
function visibleAceFrame(texture,animation){
 const name='gym-visible';if(texture.has(name))return name;
 const canvas=document.createElement('canvas');canvas.width=animation.fw;canvas.height=animation.fh;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(texture.getSourceImage(),0,0,animation.fw,animation.fh,0,0,animation.fw,animation.fh);
 const bounds=visiblePixelBounds(ctx.getImageData(0,0,animation.fw,animation.fh).data,animation.fw,animation.fh);
 if(!bounds)return 0;
 texture.add(name,0,bounds.x,bounds.y,bounds.width,bounds.height);return name;
}
export function releaseGymAce(scene,wanted=null){
 scene.__torre2GymAceWanted=wanted;
 for(const key of scene.textures.getTextureKeys())
  if(key.startsWith('torre2-gym-ace-')&&key!==wanted)scene.textures.remove(key);
}
export function paintGymAce(scene,dex,anchor){
 const key=gymAceKey(dex),animation=scene.registry.get('manifiesto')?.[dex]?.anims?.Idle;
 if(!animation)return;
 releaseGymAce(scene,key);
 if(!scene.__torre2GymAceTracking){
  const settled=loaded=>{
   if(loaded.startsWith('torre2-gym-ace-')&&loaded!==scene.__torre2GymAceWanted&&scene.textures.exists(loaded))scene.textures.remove(loaded);
  };
  const stop=()=>{scene.load.off('filecomplete',settled);scene.__torre2GymAceTracking=false;releaseGymAce(scene)};
  scene.__torre2GymAceTracking=true;scene.load.on('filecomplete',settled);scene.events.once('shutdown',stop);
 }
 anchor.once('destroy',()=>{if(scene.__torre2GymAceWanted===key)releaseGymAce(scene)});
 const paint=()=>{
  if(!anchor.active||!scene.textures.exists(key)||anchor.getData('ace-painted'))return;
  anchor.setData('ace-painted',true);scene.textures.get(key).setFilter(0);
  const texture=scene.textures.get(key);
  const frame=typeof document==='undefined'?0:visibleAceFrame(texture,animation);
  const sprite=scene.add.image(277,228,key,frame).setOrigin(.5,1).setDepth(12);
  const size=texture.get?.(frame)||{width:animation.fw,height:animation.fh};
  const scale=Math.min(126/size.width,138/size.height);
  sprite.setScale(scale).setData('torre2-gym-ace',dex);
  anchor.once('destroy',()=>{if(sprite.active)sprite.destroy()});
 };
 if(scene.textures.exists(key)){paint();return;}
 const event='filecomplete-spritesheet-'+key;
 const complete=()=>{cleanup();paint()};
 const cleanup=()=>{scene.load.off(event,complete);scene.events.off('shutdown',cleanup)};
 scene.load.once(event,complete);scene.events.once('shutdown',cleanup);anchor.once('destroy',cleanup);
 const pending=[scene.load.list,scene.load.inflight,scene.load.queue].some(list=>[...(list?.entries||[])].some(f=>f.key===key));
 if(!pending)scene.load.spritesheet(key,'assets/pmd/'+animation.file,{frameWidth:animation.fw,frameHeight:animation.fh});
 if(!scene.load.isLoading())scene.load.start();
}
export function renderGymPresentation(scene,model,{aceDex,onBattle,onRoute,onBack}){
 const g=scene.add.graphics().setDepth(2),accent=model.color;
 const box=(x,y,w,h,fill=0x0b213b)=>{
  g.fillStyle(0x030b17).fillRect(x+2,y+3,w,h);
  g.fillStyle(0xa4bed0).fillRect(x,y,w,h);
  g.fillStyle(0x385a77).fillRect(x+2,y+2,w-4,h-4);
  g.fillStyle(fill).fillRect(x+4,y+4,w-8,h-8);
  g.fillStyle(0xd0e4eb).fillRect(x+5,y+3,w-10,1);
 };
 const txt=(x,y,value,size=12,color='#eff7ff',depth=10)=>scene.add.text(x,y,value,{
  fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',fontStyle:'bold',color,
  stroke:'#07182b',strokeThickness:['#133249','#244a61','#46647b'].includes(color)?0:2}).setDepth(depth);
 scene.cameras.main.setBackgroundColor('#071421');
 const floor=addCitySurface(scene,'stone',0,42,386,228,0);
 if(floor)floor.setTint(model.index===1||model.index===8?0xa2dce8:model.index===10?0x9e81bc:0xc5b89e);
 g.fillStyle(0x101b2c,.65).fillRect(0,42,386,75);
 g.fillStyle(0x172b40).fillRect(91,80,215,161);
 g.lineStyle(2,accent).strokeRect(97,86,203,149);
 g.lineStyle(1,accent,.5).strokeCircle(198,173,57);
 g.lineStyle(2,accent,.6).lineBetween(140,173,255,173).strokeCircle(198,173,16);
 for(const x of [28,343]){
  g.fillStyle(0x344655).fillRect(x,76,20,172);
  g.fillStyle(0x8b9b9f).fillRect(x+3,76,5,170);
  g.fillStyle(accent).fillRect(x-4,73,28,8).fillRect(x-6,244,32,9);
  g.fillStyle(0x152a42).fillRect(x+3,108,14,70);
  g.fillStyle(accent).fillRect(x+7,114,6,51);
 }
 for(let y=240;y<266;y+=5){g.fillStyle(0x91a3a3).fillRect(90,y,217,3);g.fillStyle(0x384c5d).fillRect(90,y+3,217,2)}
 box(9,8,372,35);txt(20,16,'POKÉMON TORRE 2',18);txt(241,21,'DESAFIO DE KANTO',9,'#a5d8f1');
 box(392,47,238,229);txt(405,58,model.city.toUpperCase()+(model.index<8?' · GINÁSIO':' · LIGA'),11);
 txt(405,83,model.index>=8?'ELITE DE KANTO':'LÍDER DE GINÁSIO',10,'#a5d8f1');
 txt(405,100,model.name.toUpperCase(),26);
 txt(405,136,'ESPECIALIDADE: '+model.type,10,'#d0e7ef');
 box(402,158,218,49);txt(444,168,model.index<8?'INSÍGNIA '+model.badge.toUpperCase():model.badge.toUpperCase(),11);
 txt(444,186,model.earned?'CONQUISTADA':'PROGRESSÃO REAL DA CAMPANHA',8,'#b7d1df');
 if(model.index<8)drawBadgeIcon(scene,model.index,423,183,true,1.4).setDepth(10);
 box(402,216,218,49);txt(414,225,model.tm||(model.index<8?'RECOMPENSA DO GINÁSIO':'DESAFIO DA LIGA'),12,'#ffe0a1');
 txt(414,244,model.tm?'RECOMPENSA APÓS A PRIMEIRA VITÓRIA':model.index<8?'INSÍGNIA APÓS DERROTAR O LÍDER':'AVANCE PELA SEQUÊNCIA DA CAMPANHA',8,'#b7d1df');
 g.fillStyle(0x030e1a,.5).fillEllipse(143,231,69,12).fillEllipse(277,231,86,14);
 const leader=addFireRedNPC(scene,model.kind,143,228,{scale:4,depth:13});
 if(leader)leader.setData('torre2-gym-leader',model.kind);
 else {
  // A region may be opened by a test or imported save before its NPC is cached.
  const key='frlg-npc-'+spriteIdForTrainer(model.kind),event='filecomplete-image-'+key;
  const marker=scene.add.zone(143,228,1,1);
  const draw=()=>{cleanup();if(marker.active)addFireRedNPC(scene,model.kind,143,228,{scale:4,depth:13})?.setData('torre2-gym-leader',model.kind)};
  const cleanup=()=>scene.load.off(event,draw);
  scene.load.once(event,draw);marker.once('destroy',cleanup);
  scene.load.image(key,'assets/ui/frlg/npc/'+spriteIdForTrainer(model.kind)+'.png');
  if(!scene.load.isLoading())scene.load.start();
 }
 txt(100,250,model.name.toUpperCase(),12);txt(236,250,model.ace.toUpperCase(),11,'#ffe0a1');
 const anchor=scene.add.zone(277,224,1,1).setData('torre2-gym-presentation',model.ace);
 if(aceDex)paintGymAce(scene,aceDex,anchor);
 box(9,277,372,74,0xeff3eb);
 txt(22,287,model.ready?'O desafio de '+model.name+' está liberado.':
  'FALTAM '+model.remaining+' TREINADORES NA ROTA.',12,'#133249');
 txt(22,310,model.ready?'Prepare sua equipe para enfrentar '+model.ace+'.':
  'Conclua a rota para enfrentar o líder.',10,'#244a61');
 txt(22,330,'Equipe pronta? Consulte a Bolsa e o Centro Pokémon.',8,'#46647b');
 const button=(x,y,w,h,label,fn,color)=>{
  box(x-w/2,y-h/2,w,h,color);txt(x,y,label,13).setOrigin(.5);
  return scene.add.zone(x,y,w,h).setDepth(30).setInteractive({useHandCursor:true}).on('pointerdown',fn);
 };
 button(511,316,238,62,model.ready?'▶ DESAFIAR LÍDER':'CONTINUAR A ROTA',model.ready?onBattle:onRoute,model.ready?0xaf2838:0x245980)
  .setData('torre2-gym-primary',model.ready?'battle':'route');
 button(570,24,120,28,'◀ VOLTAR',onBack,0x173a57).setData('torre2-gym-back',true);
 return model;
}
