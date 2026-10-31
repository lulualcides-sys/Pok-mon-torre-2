import {rematchOpponent} from './campaign-core.js';
import {installCampaignAudioSettings,playOriginalMenuCue} from './audio-settings.js';
/* Pokémon Torre 2 — Kanto Battle Path hub, replaces the cluttered city map.
 * Phaser/WebGL native scene objects only. No pasted mockup, HTML overlay,
 * CSS-made combat or changes to the approved Poké Arena 2D move runtime.
 * Trainer numbers and stages map directly onto existing campaign save IDs.
 */
import {routeNode} from './route-data.js';
import {pathCheckpointAction} from './path-actions.js';
import {getCampaignMapSpec} from './campaign-map-unified.js';
import {trainerClass,drawTrainer} from './campaign-sprites.js';
import {addFireRedNPC} from './frlg-npc.js';
import {ROOM_CROPS} from './frlg-interiors.js';
import {ball} from './campaign-art.js';
import {TRAINERS_PER_GYM,STAGES,currentOpponent} from './campaign-core.js';

export const BATTLE_PATH_BACKDROP=Object.freeze([
 'pewter','cerulean','vermilion','celadon','fuchsia',
 'saffron','cinnabar','viridian','indigo','indigo',
 'indigo','indigo','indigo'
]);
const COLORS={ink:0x071729,navy:0x0a223a,edge:0x508cb4,gold:0xffd573,
 green:0x43d881,blue:0x5ba9dc,muted:0x768ca0};
const ROWS=Object.freeze([
 // Normal trainers stay outside the gym; Brock owns the central platform.
 [53,116,179,242,305],
 [305,242,179,116,53],
 [70,148,226,304]
]);
const TX={fontFamily:'Pixelify Sans,monospace',fontStyle:'bold'};
function txt(scene,x,y,value,size=10,color='#f5f8fc',depth=26){
 return scene.add.text(x,y,String(value),{...TX,fontSize:size+'px',
  color,stroke:'#07121f',strokeThickness:2}).setOrigin(.5).setDepth(depth)
}
function frame(g,x,y,w,h,{fill=COLORS.navy,border=COLORS.edge,radius=4}={}){
 g.fillStyle(0x020816,.88);g.fillRoundedRect(x+2,y+3,w,h,radius);
 g.fillStyle(fill,.96);g.fillRoundedRect(x,y,w,h,radius);
 g.lineStyle(1,border,1);g.strokeRoundedRect(x+.5,y+.5,w-1,h-1,radius);
}
function button(scene,x,y,w,h,title,action,{gold=false,enabled=true,depth=40,small=false}={}){
 const g=scene.add.graphics().setDepth(depth),label=txt(scene,x,y,title,small?8:gold?13:9,
  enabled?(gold?'#262114':'#f7f8ff'):'#9facb9',depth+1);
 let hover=false;
 const paint=()=>{
  g.clear();frame(g,x-w/2,y-h/2,w,h,{fill:gold?
   hover?0xffe392:0xf4be4e:hover?0x22588a:0x164674,
   border:gold?0xffe7a0:0x6fb7e3,radius:3});
  g.fillStyle(gold?0xffe99e:0x92d5fa,.9);g.fillRect(x-w/2+4,y-h/2+3,w-8,2);
 };
 const zone=scene.add.zone(x,y,w,Math.max(h,23)).setDepth(depth+2)
  .setInteractive({useHandCursor:true}).setData('torre2-path-action',title);
 zone.on('pointerover',()=>{hover=true;paint()});
 zone.on('pointerout',()=>{hover=false;paint()});
 zone.on('pointerdown',()=>{if(enabled){playOriginalMenuCue(scene);action()}});
 paint();return zone;
}
function connector(g,ax,ay,bx,by,lit){
 const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
 const steps=Math.ceil(length/10);
 // Contrast backing makes the dashed route legible over dense FireRed trees.
 g.lineStyle(3,0x102a2d,.76);g.lineBetween(ax,ay,bx,by);
 for(let n=1;n<steps;n++){
  const t=n/steps,x=ax+dx*t,y=ay+dy*t;
  g.fillStyle(lit?0xffe9b3:0xf3f3ce,lit ? .98 : .93);
  g.fillCircle(x,y,lit?2.4:2.05);
 }
}
function trainerKind(stage,node){
 if(node.type==='leader')return ['brock','misty','surge','erika','koga',
  'sabrina','blaine','giovanni','lorelei','bruno','agatha','lance','rival'][stage]||'brock';
 return trainerClass(stage,node.index,node.type,stage===0?'forest':'route');
}
function titleFor(stage,i,count){
 const n=routeNode(stage,i,count);
 if(i>=count)return (STAGES[stage]?.leader||'LÍDER').toUpperCase();
 if(n.type==='rocket')return 'ROCKET';
 if(n.type==='rival')return 'RIVAL';
 return 'TREINADOR';
}
function hudSprite(scene,member,x,y,depth=34){
 if(!member)return;
 // Textures already loaded for the party summary and Pokédex.
 const {buscar}=scene.__torre2PathData;
 let dex='0150';
 try{const v=buscar(member.id);dex=String((v.etapa>0?
  v.def.evoluciones?.[v.etapa-1]?.dex:v.def.dex)||dex).padStart(4,'0')}
 catch{}
 const key='torre2-portrait-'+dex;
 if(!scene.textures.exists(key))return;
 scene.add.image(x,y,key).setDisplaySize(23,23).setDepth(depth);
}
function renderBackdrop(scene,stage){
 // Use ORIGINAL FireRed exterior and gym interior from a loaded map sheet.
 // No screenshot-as-UI, no generated facade, no CSS/native-canvas zoom.
 const city=BATTLE_PATH_BACKDROP[stage]||'indigo',imageKey='frlg-location-'+city;
 const base=scene.add.graphics().setDepth(5);
 frame(base,10,54,478,255,{fill:0x163849,border:0xe0bd7b,radius:4});
 const texture=scene.textures.exists(imageKey)?scene.textures.get(imageKey):null;
 const src=texture?.source?.[0];let realExterior=false,realGym=false;
 if(texture&&src){
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  // Composite FRLG sheets have the city on the LEFT and rooms on the right.
  // The Pewter source includes Brock's pink-roof gym at (200..370,30..145).
  // Crop that real building as our BACKDROP, rather than all of Kanto.
  const exteriorRect=city==='pewter'?[120,18,380,215]:
   [0,0,Math.min(768,src.width),Math.min(640,src.height)];
  const [sx,sy,w,h]=exteriorRect;
  if(w>=160&&h>=160){
   const name='torre2-path-city-'+city;
   if(!texture.has(name))texture.add(name,0,sx,sy,w,h);
   const cityImage=scene.add.image(249,181,imageKey,name).setDepth(6);
   cityImage.setScale(Math.max(470/w,247/h));
   const mask=scene.make.graphics({x:0,y:0,add:false});
   mask.fillStyle(0xffffff);mask.fillRect(14,58,470,247);
   cityImage.setMask(mask.createGeometryMask());
   scene.events.once('shutdown',()=>{cityImage.clearMask();mask.destroy()});
   realExterior=true;
  }
  const rect=ROOM_CROPS[city]?.gym;
  if(rect&&rect[0]+rect[2]<=src.width&&rect[1]+rect[3]<=src.height){
   const name='torre2-path-gym-'+city;
   if(!texture.has(name))texture.add(name,0,...rect);
   const arch=scene.add.graphics().setDepth(7);
   arch.fillStyle(0x071624,.9);arch.fillRoundedRect(346,65,135,240,7);
   arch.lineStyle(2,0xeec376,1);arch.strokeRoundedRect(346,65,135,240,7);
   arch.fillStyle(0x264862);arch.fillRoundedRect(351,71,125,19,3);
   const scale=Math.min(117/rect[2],197/rect[3]);
   scene.add.image(414,198,imageKey,name).setDepth(8).setScale(scale);
   txt(scene,414,81,'GINÁSIO',9,'#ffe3a0',10);
   realGym=true;
  }
 }
 if(!realExterior){base.fillStyle(0x244959);base.fillRect(14,58,470,247)}
 const glass=scene.add.graphics().setDepth(9);
 glass.fillStyle(0x081b2a,.13);glass.fillRect(14,58,470,247);
 glass.fillStyle(0x061827,.88);glass.fillRoundedRect(18,62,267,36,5);
 glass.lineStyle(1,0x638ba0,.94);glass.strokeRoundedRect(18,62,267,36,5);
 scene.__torre2GymBackdrop={city,realExterior,realGym,texture:imageKey};
 return {imageKey};
}
export function renderBattlePath(scene,state,handlers){
 const stage=state.stage,finished=state.champion||!STAGES[stage],
  total=finished?0:TRAINERS_PER_GYM(stage),
  progress=Math.min(total,Math.max(0,state.trainer||0)),
  leader=STAGES[stage]?.leader||'CAMPEÃO',
  city=STAGES[stage]?.city||'KANTO';
 const sc=scene.add.graphics().setDepth(1);
 sc.fillStyle(COLORS.ink);sc.fillRect(0,0,640,360);
 sc.fillStyle(0x071d34);sc.fillRect(0,0,640,51);
 sc.fillStyle(0x4b90bb);sc.fillRect(0,49,640,1);
 sc.fillStyle(0x0d2b43);sc.fillRect(0,313,640,47);
 ball(sc,22,25,13);
 txt(scene,115,14,'POKÉMON TORRE 2',15,'#f7cc5f',22).setOrigin(0,.5);
 txt(scene,116,31,'KANTO · '+city.toUpperCase(),9,'#e8f3fd',22).setOrigin(0,.5);
 txt(scene,322,13,finished?'LIGA DE KANTO':'GINÁSIO DE '+city.toUpperCase(),9,'#e9e4cb');
 txt(scene,324,32,leader.toUpperCase(),14,'#ffd37b');
 txt(scene,431,12,'PROGRESSO',8,'#a9d9e9');
 txt(scene,433,30,finished?'8 / 8':progress+' / '+total,14,'#ffffff');
 const progressG=scene.add.graphics().setDepth(10);
 progressG.fillStyle(0x173d49);progressG.fillRoundedRect(400,42,66,4,2);
 progressG.fillStyle(0x40d48c);progressG.fillRoundedRect(400,42,
  Math.max(1,66*progress/Math.max(1,total)),4,2);
 button(scene,517,23,69,29,'TELA CHEIA',()=>{}, {depth:41,small:true})
  .setData('torre2-fullscreen',true)
  .on('pointerup',()=>scene.scale.isFullscreen?
   scene.scale.stopFullscreen():scene.scale.startFullscreen({navigationUI:'hide'}));
 button(scene,599,23,65,29,'MENU',handlers.menu,{depth:41});
 renderBackdrop(scene,stage);
 const mapTitle=txt(scene,25,69,finished?'CAMPEÃO DE KANTO':'ROTA DE '+city.toUpperCase(),13,'#fff5d8',28);
 mapTitle.setOrigin(0,.5);
 const areaLegend=stage===1?'ROTA 3  >  MT. MOON  >  ROTA 4  >  CERULEAN':
  stage===2?'ROTAS 24/25  >  5/6  >  S.S. ANNE  >  VERMILION':
  finished?'O SALÃO DA FAMA AGUARDA A SUA EQUIPE':
  'VENÇA OS DESAFIOS ATÉ '+leader.toUpperCase();
 txt(scene,28,89,areaLegend,stage===1||stage===2?7:8,'#cdeaf4',28)
  .setOrigin(0,.5);
 button(scene,424,103,107,24,'VS SEEKER',()=>handlers.rematchAtlas?.(),
  {depth:39,small:true}).setData('torre2-open-rematch-atlas',true);
 // Optional city exploration. Keep the established battle route interactive.
 if(stage===1)button(scene,424,131,107,23,'EXPLORAR CIDADE',
  ()=>handlers.city?.(),{depth:39,small:true})
   .setData('torre2-open-cerulean-city',true);
 // When a NORMAL battle advances the checkpoint beyond the current
 // route page, reveal the new checkpoint automatically. Manual browsing of
 // earlier pages stays intact until a new trainer is actually beaten.
 // Page 0 already contains indexes 0..13, so don't jump early at index 13.
 const previousProgress=scene.__torre2RenderedPathProgress;
 const previousStage=scene.__torre2RenderedPathStage;
 const requested=scene.__torre2PathPage;
 const progressed=previousStage===stage&&
  Number.isInteger(previousProgress)&&previousProgress!==progress;
 const oldPage=Math.max(0,Math.floor((requested??0)/13)*13);
 const outOfView=progress<oldPage||progress>oldPage+13;
 const pageForProgress=Math.max(0,Math.floor(Math.max(0,progress-1)/13)*13);
 const page=progressed&&outOfView?pageForProgress:(requested??progress);
 const offset=Math.max(0,Math.min(total,Math.floor(page/13)*13));
 scene.__torre2RenderedPathProgress=progress;
 scene.__torre2RenderedPathStage=stage;
 const length=finished?0:Math.min(14,Math.max(0,total+1-offset));
 const spots=[];
 for(let i=0;i<length;i++){
  const row=Math.floor(i/5),column=i%5;
  const boss=offset+i===total;
  const px=boss?414:(ROWS[Math.min(2,row)][column]??ROWS[2][3]);
  const y=boss?178:[275,211,147][Math.min(row,2)];
  spots.push({x:px,y,global:offset+i});
 }
 // Map region labels reference existing FireRed town/mountain sheets.
 // One connected zigzag and the leader at its end; no extra pages/maps.
 const checkpointZone=(n)=>{
  if(stage===1)return n<4?'ROTA 3':n<9?'MT. MOON':n<13?'ROTA 4':'CERULEAN';
  if(stage===2)return n<4?'ROTAS 24/25':n<9?'ROTAS 5/6':
   n<13?'S.S. ANNE':'VERMILION';
  return null;
 };
 const pathGraphics=scene.add.graphics().setDepth(14);
 for(let i=1;i<spots.length;i++){
  const a=spots[i-1],b=spots[i];
  connector(pathGraphics,a.x,a.y,b.x,b.y,a.global<progress);
 }
 // The next checkpoint receives the gold border. Completed checkpoints
 // retain their own pass/fail mark, and future ones remain visible.
 const hitZones=[];
 for(const p of spots){
  const i=p.global;
  const node=routeNode(stage,i,total);
  const checkpoint=pathCheckpointAction(i,progress,total,
   i<progress&&Boolean(rematchOpponent(state,i)));
  const {done,active,boss,available}=checkpoint;
  // Catching never substitutes for the next required trainer. The badge
  // has its own small hit target above the trainer/rematch node.
  const capture=checkpoint.optionalCapture;
  const g=scene.add.graphics().setDepth(18);
  const width=boss?82:60,top=p.y-23;
  if(active){
   g.fillStyle(0xffd374,.17);g.fillCircle(p.x,p.y-5,boss?36:29);
  }
  g.fillStyle(0x061a2e,.88);g.fillRoundedRect(p.x-width/2,top+10,width,37,5);
  g.lineStyle(active?2:1,active?0xffd15f:done?0x54d99a:0x768a95,1);
  g.strokeRoundedRect(p.x-width/2,top+10,width,37,5);
  g.fillStyle(active?0x7c5521:done?0x255b4b:0x304755,.95);
  g.fillEllipse(p.x,top+8,boss?50:42,18);
  g.lineStyle(2,active?0xffe9aa:done?0x66d5a6:0x778f9c);
  g.strokeEllipse(p.x,top+8,boss?50:42,18);
  if(boss){
   g.fillStyle(0xffe0a0,.18);g.fillEllipse(p.x,p.y+9,90,50);
   g.lineStyle(3,0xffda77,1);g.strokeEllipse(p.x,p.y+9,80,38);
   g.fillStyle(0x93713b,.9);g.fillRoundedRect(p.x-34,top-5,68,15,3);
   g.lineStyle(1,0xffedb5,1);g.strokeRoundedRect(p.x-34,top-5,68,15,3);
  }
  if(capture){
   // A real ball icon in grass, with a direct encounter interaction.
   g.fillStyle(0x2d8a47);g.fillTriangle(p.x-14,top+1,p.x-8,top-11,p.x-1,top+1);
   g.fillTriangle(p.x,top+1,p.x+6,top-14,p.x+14,top+1);
   ball(g,p.x,top-2,9);
  }else{
   const kind=trainerKind(stage,node);
   const npc=addFireRedNPC(scene,kind,p.x,top+12,{scale:boss?1.68:1.20,depth:21});
   if(!npc)drawTrainer(g,p.x,top-1,kind,.9);
   if(!available&&npc)npc.setTint(0xd2dfd4).setAlpha(.94);
  }
  txt(scene,p.x,boss?p.y+11:p.y+8,boss?leader.toUpperCase():
   node.type==='rocket'?'EQUIPE ROCKET':node.type==='rival'?'RIVAL':'TREINADOR',
   boss?12:node.type==='rocket'?7:8,
   active?'#ffe29a':available?'#f1f8f3':'#afbdc8',23);
  g.fillStyle(active?0xf5c75d:done?0x56be86:0x40647e);
  g.fillRoundedRect(p.x-width/2+2,p.y-17,15,17,3);
  txt(scene,p.x-width/2+9.5,p.y-8,String(i+1),8,
   active?'#30220f':'#fff7d4',24);
  for(let d=0;d<3;d++){
   g.lineStyle(1,done?0x76e0a6:0xb6ced9,.98);
   g.strokeCircle(p.x-10+d*10,p.y+23,2.1);
  }
  if(checkpoint.primary==='rematch')txt(scene,p.x,p.y+22,
   (state.rematches?.charge||0)>=3?'REVANCHE':'VS '+(state.rematches?.charge||0)+'/3',
   6,'#f7d986',25);
  if(done){
   g.fillStyle(0x28c868);g.fillCircle(p.x+width/2-8,p.y-17,7);
   g.lineStyle(2,0xffffff);g.lineBetween(p.x+width/2-11,p.y-17,p.x+width/2-9,p.y-14);
   g.lineBetween(p.x+width/2-9,p.y-14,p.x+width/2-5,p.y-21);
  }else if(active){
   g.fillStyle(0xffdd85);g.fillTriangle(p.x-4,top-17,p.x+4,top-17,p.x,top-8);
  }
  const zone=scene.add.zone(p.x,p.y-1,width,63).setDepth(31)
   .setInteractive({useHandCursor:true}).setData('torre2-path-node',i)
   .setData('torre2-path-type',node.type);
  if(checkpointZone(i))zone.setData('torre2-route-zone',checkpointZone(i));
  zone.on('pointerover',()=>{
   if(scene.__torre2RegionHover?.active)scene.__torre2RegionHover.destroy();
   const region=checkpointZone(i);
   if(region)scene.__torre2RegionHover=txt(scene,325,69,region,9,'#b3f4e8',56);
  });
  zone.on('pointerout',()=>{
   if(scene.__torre2RegionHover?.active)scene.__torre2RegionHover.destroy();
  });
  zone.on('pointerdown',()=>{
   if(checkpoint.primary==='gym')return handlers.gym();
   if(checkpoint.primary==='battle')return handlers.battle();
   if(checkpoint.primary==='rematch')return handlers.rematch?.(i);
   if(!done)return handlers.locked?.();
  });
  // Separate touch zone over the existing green-grass ball pictogram.
  // Higher depth than the trainer's large hitbox, lower than all modals.
  if(capture){
   const badge=scene.add.zone(p.x,p.y-26,22,18).setDepth(36)
    .setInteractive({useHandCursor:true})
    .setData('torre2-path-capture',i);
   badge.on('pointerdown',(_p,_x,_y,event)=>{
    event?.stopPropagation?.();
    return available?handlers.capture?.():handlers.locked?.();
   });
  }
  hitZones.push(zone);
 }
 // NPCs flanking the leader are gym attendants; not extra opponents.
 if(spots.some(p=>p.global===total)&&stage<8&&scene.__torre2GymBackdrop?.realGym){
  for(const [kind,x] of [['hiker',359],['youngster',469]]){
   const sideTrainer=addFireRedNPC(scene,kind,x,220,{scale:1.07,depth:20});
   if(sideTrainer)sideTrainer.setAlpha(.93);
  }
 }
 // Stable page navigation for Misty and later routes with >13 battles.
 if(offset>0)button(scene,37,296,43,18,'◀',()=>handlers.page(-1),{small:true});
 if(!finished&&offset+length<total+1)button(scene,460,296,43,18,'▶',()=>handlers.page(1),{small:true});
 // After the final Champion KO, never redraw a fake 14th boss that can
 // reopen the gym. This honors the earned victory with native Phaser pixels.
 if(finished){
  const victory=scene.add.graphics().setDepth(19);
  victory.fillStyle(0x092235,.95).fillRoundedRect(64,139,401,137,8);
  victory.lineStyle(3,0xe9c373).strokeRoundedRect(64,139,401,137,8);
  victory.fillStyle(0x254437,.9).fillRoundedRect(85,156,357,40,4);
  txt(scene,263,175,'★ CAMPEÃO DE KANTO ★',20,'#ffe3a1',25);
  txt(scene,263,222,'8 GINÁSIOS  ·  ELITE FOUR  ·  CAMPEÃO',11,'#d5f4e2',25);
  txt(scene,263,250,'ABRA O SALÃO DA FAMA PARA VER SUA EQUIPE',9,'#c1dce9',25);
 }
 // Right-hand side: portraits with compact HP, no giant cards or map overlays.
 const side=scene.add.graphics().setDepth(12);
 frame(side,496,54,136,255,{fill:0x081d31,border:0x5a91b6,radius:4});
 frame(side,502,60,124,30,{fill:0x19476d,border:0x578db0,radius:3});
 txt(scene,561,74,'SUA EQUIPE  '+state.team.length+'/6',11,'#fff1c7',24);
 button(scene,538,101,80,17,Math.min(8,state.badges.length)+'/8 INSÍGNIAS',()=>handlers.badges?.(),{depth:39,small:true})
  .setData('torre2-badge-case-open',true);
 txt(scene,596,102,'$'+(state.money||0),9,'#ffda74',24);
 for(let i=0;i<6;i++){
  const m=state.team[i],y=119+i*22;
  side.fillStyle(i===state.active?0x28475a:0x102c43);
  side.fillRoundedRect(502,y-9,124,21,3);
  side.lineStyle(1,i===state.active?0xf2c267:0x345d76,1);
  side.strokeRoundedRect(502,y-9,124,21,3);
  if(!m){
   txt(scene,517,y,'◌',10,'#47677b',24);
   txt(scene,535,y,'ESPAÇO LIVRE',7,'#5f839b',24).setOrigin(0,.5);
   continue;
  }
  hudSprite(scene,m,514,y+1,23);
  txt(scene,530,y-4,m.id.toUpperCase().slice(0,12),8,'#fff5e3',24).setOrigin(0,.5);
  txt(scene,531,y+5,'NV.'+(m.progression?.level||5),7,'#b7dfea',24).setOrigin(0,.5);
  const hp=Math.max(0,Math.min(100,Number(m.hp)||0));
  side.fillStyle(0x091c2c);side.fillRect(576,y+5,45,4);
  side.fillStyle(hp>50?0x3ee18f:hp>22?0xf0ce61:0xe9716e);
  side.fillRect(576,y+5,Math.round(45*hp/100),4);
  scene.add.zone(564,y+1,124,22).setDepth(35).setInteractive({useHandCursor:true})
   .on('pointerdown',()=>handlers.pokemon(i));
 }
 [['BOLSA',handlers.bag],['POKÉMON',()=>handlers.pokemon(state.active)],
  ['CENTRO',handlers.center],['LOJA',handlers.mart],
  ['TREINAMENTO',handlers.training],['CAPTURA',handlers.capture]
 ].forEach(([label,action],i)=>button(scene,533+(i%2)*64,261+Math.floor(i/2)*19,
  60,17,label,action,{depth:39,small:true}));
 // Bottom action bar: the only primary gameplay action, directly starts battle.
 const current=finished?null:currentOpponent(state);
 txt(scene,24,323,'DESAFIO ATUAL',8,'#a9d6e8',30).setOrigin(0,.5);
 txt(scene,24,342,finished?'CAMPEÃO DE KANTO':current?.name||leader,
  12,'#fff2d2',30).setOrigin(0,.5);
 const label=finished?'★ SALÃO DA FAMA':progress>=total?
  'ENFRENTAR '+leader.toUpperCase():'ENTRAR NA BATALHA';
 const cta=button(scene,359,335,217,32,label,()=>{
  if(finished)return handlers.hall?.();
  if(progress>=total)return handlers.gym();
  handlers.battle();
 },{gold:true,enabled:true,depth:70});
 cta.setData('torre2-central-cta',true);
 button(scene,568,336,113,27,'REINICIAR',handlers.reset,{depth:70,small:true})
  .setData('torre2-reset-journey',true);
 // Standalone audio tab on the Kanto path; avoids moving any approved HUD control.
 installCampaignAudioSettings(scene);
 scene.__torre2BattlePath={stage,total,progress,offset,locations:spots.length,
  regions:stage===1?['ROTA 3','MT. MOON','ROTA 4','CERULEAN']:
   stage===2?['ROTAS 24/25','ROTAS 5/6','S.S. ANNE','VERMILION']:null,
  nodes:hitZones,imageKey:'frlg-location-'+(BATTLE_PATH_BACKDROP[stage]||'indigo'),
  gym:scene.__torre2GymBackdrop};
 return scene.__torre2BattlePath;
}
