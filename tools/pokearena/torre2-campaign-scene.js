import {statusLabel} from './gen3-status.js';
import {rematchOpponent,startRematch,resolveRematch,validRematchResult} from './campaign-core.js';
import {prepareLaboratoryMatch,installLaboratoryControls,KANTO_151_IDS} from './laboratory.js';
import {WEATHER_NAMES} from './weather.js';
/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO,texto as textoMenu,estrechar} from '../config.js';
import {UI as MENU_UI} from '../ui.js';
import {header,backdrop as richBackdrop,buttonFrame,team as richTeam,
 ball,progress,drawBadgeIcon} from './campaign-art.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats,isPendingApprovalMove,filterMoveLibrary} from './move-pool.js';
import {earlyKantoSlotPlan,nativeKantoEvolutionPlan,EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,useStatusCure,teachTM,
 ensureConsciousActive} from './campaign-core.js';
import {MART_ITEMS,GYM_TM_REWARDS} from './route-data.js';
import {installWildCapture} from './capture-arena.js';
import {createPartyMatch,applyPartyBattleResult,installPartyBattle} from './party-battle.js';
import {prepareTrainingMatch,installTrainingDummy} from './training.js';
import {drawTrainer,drawShopItem} from './campaign-sprites.js';
import {campaignRegion} from './kanto-regions.js';
import {currentLevelCap} from './kanto-levels.js';
import {AVAILABLE_FRLG,AVAILABLE_FRLG_NPCS,AVAILABLE_FRLG_FILES} from './frlg-available.js';
import {buildingInteractions} from './kanto-hotspots.js';
import {spriteIdForTrainer} from './frlg-npc.js';
import {renderInteriorScene} from './frlg-interiors.js';
import {locationForCampaign} from './frlg-location.js';
import {getCampaignMapSpec} from './campaign-map-unified.js';
import {renderBattlePath,BATTLE_PATH_BACKDROP} from './battle-path.js';
import {makeBattleReport,showBattleReport} from './battle-report.js';
import {hallOfFameModel} from './hall-of-fame.js';

const C={gold:'#f8c448',blue:'#6bc4ff',ink:'#090d1c',panel:'#15233a',muted:'#9cb4cd',white:'#f0f5ff'};
const titleStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'23px',fontStyle:'bold',color:C.gold,stroke:'#000',strokeThickness:3};
const textStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:C.white};
const statusStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'12px',color:C.muted};
function text(scene,x,y,content,style={}){return scene.add.text(x,y,content,{...textStyle,...style})}
// Portraits come from the captured Poké Arena 2D PMD asset library.
// Preload all six team members so the map does not show empty squares.
function portraitId(member){
 const {def,etapa}=buscar(member.id);
 return (etapa>0?def.evoluciones?.[etapa-1]?.dex:def.dex)||'0150';
}
function portraitKey(member){return 'torre2-portrait-'+portraitId(member)}
// Only the explicit reset link modifies the browser's private Kanto save.
// Remove the URL flag immediately so page reloads never reset repeatedly.
export function consumeCampaignResetLink(storage=localStorage,url=window.location,
 historyApi=window.history){
 const query=new URLSearchParams(url.search);
 if(query.get('reset_kanto')!=='1')return false;
 resetCampaign(storage);
 query.delete('reset_kanto');
 const suffix=query.toString();
 historyApi.replaceState(null,'',url.pathname+(suffix?'?'+suffix:'')+url.hash);
 return true;
}
class Campanha extends Phaser.Scene{
 constructor(){super('campanha')}
 init(input){this.result=input?.finished?input:null}
 preload(){
  if(!this.textures.exists('torre2-frlg-badges'))this.load.spritesheet('torre2-frlg-badges','assets/ui/frlg/badges.png',{frameWidth:16,frameHeight:16});
  const state=readCampaign();
  // Mobile performance: the old loader uploaded every Kanto map and all
  // 41 trainer sheets to the GPU even though only one city is visible.
  // Load JUST the current gym world + the FireRed characters it displays.
  const stage=state?.stage??0;
  const world=getCampaignMapSpec(stage,0).id;
  const pathWorld=BATTLE_PATH_BACKDROP[stage]||'indigo';
  if(AVAILABLE_FRLG.includes(world)){
   const key='frlg-location-'+world;
   if(!this.textures.exists(key))
    this.load.image(key,AVAILABLE_FRLG_FILES[world]||'assets/ui/frlg/'+world+'.webp');
  }else if(!this.textures.exists('torre2-cc0-world')){
   this.load.image('torre2-cc0-world','assets/ui/kanto-cc0-world.png');
  }
  const boss=['brock','misty','surge','erika','koga','sabrina',
   'blaine','giovanni','lorelei','bruno','agatha','lance','rival'][stage]||'brock';
  const archetypes=stage===0?
   ['youngster','lass','bugcatcher','hiker']:
   ['youngster','lass','bugcatcher','hiker','ace','rocket'];
  const needed=new Set(['red_normal',spriteIdForTrainer(boss),
   spriteIdForTrainer('rival'),spriteIdForTrainer('rocket'),
   spriteIdForTrainer('ace'),
   ...archetypes.map(spriteIdForTrainer)]);
  // Across gyms, old campaign-specific GPU textures used to accumulate.
  // Prune only our private FRLG resources, never PMD battle sprites/effects.
  const desired=new Set(['frlg-location-'+world,'frlg-location-'+pathWorld]);
  if(AVAILABLE_FRLG.includes(pathWorld)){
   const key='frlg-location-'+pathWorld;
   if(!this.textures.exists(key))
    this.load.image(key,AVAILABLE_FRLG_FILES[pathWorld]||'assets/ui/frlg/'+pathWorld+'.webp');
  }
  for(const key of this.textures.getTextureKeys()){
   if(key.startsWith('frlg-location-')&&!desired.has(key))
    this.textures.remove(key);
   if(key.startsWith('frlg-npc-')&&!needed.has(key.slice(9)))
    this.textures.remove(key);
  }
  for(const id of needed){
   if(!AVAILABLE_FRLG_NPCS.includes(id))continue;
   const key='frlg-npc-'+id;
   if(!this.textures.exists(key))
    this.load.image(key,'assets/ui/frlg/npc/'+id+'.png');
  }
  const toLoad=new Set(state?.team?.map(p=>portraitId(p))||[]);
  if(state?.box)for(const p of state.box.slice(0,12))toLoad.add(portraitId(p));
  // Pokémon no longer present in team / first PC box page need not stay
  // in the GPU after repeated captures and campaign restarts.
  for(const key of this.textures.getTextureKeys()){
   if(key.startsWith('torre2-portrait-')&&
      !toLoad.has(key.slice('torre2-portrait-'.length)))
    this.textures.remove(key);
  }
  for(const dex of toLoad){
   const key='torre2-portrait-'+dex;
   if(!this.textures.exists(key))this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
  }
 }
create(){
  // Phaser reuses this Scene instance on restart; remove stale treatment locks.
  this.__torre2CenterBusy=false;
  // Restore the native Poké Arena 2D camera/viewport; no injected map zoom.
  if(consumeCampaignResetLink())this.result=null;
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  let state=readCampaign();
  let battleReport=null;
  if(this.result&&state&&!this.result.marker?.training&&!this.result.marker?.laboratory){
   // Existing resolver owns rewards and saving; report only reads snapshots.
   const marker=this.result.marker||{};
   const before=JSON.parse(JSON.stringify(state));
   let outcome=null,kind='trainer';
   if(marker.kind==='rematch'){
    if(validRematchResult(state,marker.ticket)){
     applyPartyBattleResult(state,marker.party);
     outcome=resolveRematch(state,marker.ticket,!!this.result.won);
     kind='rematch';
    }
   }else if(marker.stage===state.stage&&marker.trainer===state.trainer){
    applyPartyBattleResult(state,marker.party);
    const wild=marker.kind==='wild'&&state.pendingWild?.id===marker.id;
    outcome=wild?resolveWildBattle(state,!!this.result.won):
     resolveBattle(state,!!this.result.won);
    kind=wild?'wild':'trainer';
    state.lastMessage=outcome.message;
    saveCampaign(state);
   }else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';
   if(outcome&&outcome.ok!==false)
    battleReport=makeBattleReport(before,state,outcome,{
     kind,listMoves:availableMoves,
     tmNames:Object.fromEntries(MART_ITEMS.map(item=>[item.id,item.name]))
    });
  }
  if(!state)return this.starterSelection();
  this.renderCampaign(state);
  if(battleReport)showBattleReport(this,battleReport);
 }
 // Exact original Poké Arena 2D menu frame, font and hover/highlight,
 // reused here rather than reinterpreted with generic rectangles and CSS.
 button(x,y,w,h,label,callback,emphasis=false,tam=null,variant=null){
  const g=this.add.graphics().setDepth(3);
  const size=tam??(w>=202?12:w>=145?10:w>=92?9:8);
  const caption=estrechar(textoMenu(this,x,y,label,{
   tam:size,borde:3,colorBorde:MENU_UI.bordeTexto
  }).setOrigin(.5).setDepth(5),w-14);
  let hovered=false;
  const paint=()=>{
   g.clear();const tone=variant||(emphasis?'gold':'blue');
   buttonFrame(g,x-w/2,y-h/2,w,h,tone,hovered);
   caption.setColor(tone==='gold'?'#2e291b':hovered?'#fff5cd':'#f9fdff');
   caption.setStroke(tone==='gold'?'#fff1ac':'#091629',tone==='gold'?0:3);
  };
  const zone=this.add.zone(x,y,w,Math.max(h,27)).setDepth(8)
   .setInteractive({useHandCursor:true});
  zone.on('pointerover',()=>{hovered=true;paint()});
  zone.on('pointerout',()=>{hovered=false;paint()});
  zone.on('pointerdown',()=>callback());
  paint();return zone;
 }
 starterSelection(){
  text(this,ANCHO/2,73,'ESCOLHA SEU PRIMEIRO POKÉMON',{color:C.gold,fontSize:'19px'}).setOrigin(.5);
  text(this,ANCHO/2,111,'Campanha Kanto: 13 treinadores antes do primeiro ginásio.',statusStyle).setOrigin(.5);
  STARTERS.forEach((id,i)=>{
   const x=135+i*185;
   this.button(x,180,166,58,id.toUpperCase(),()=>{
    saveCampaign(createCampaign(id));this.scene.restart();
   },true);
  });
  text(this,ANCHO/2,270,'Movimentação e golpes: combate original Phaser · progressão: Torre 1',statusStyle).setOrigin(.5);
  text(this,ANCHO/2,294,'Mewtwo nível 50 será adicionado à equipe para testes.',statusStyle).setOrigin(.5);
 }
 backdrop(){
  richBackdrop(this);
 }
 mapScreen(state){
  // Reopen the SAME stage map through Phaser's scene lifecycle so the
  // navigation header and all click zones are recreated correctly.
  this.scene.restart();
 }
 enterLocalityBuilding(state,location,hotspot){
  // Only mark the real accessible landmark. Never cover the map with a
  // pretend building, and never expose a future gym boss early.
  const type=hotspot.id;
  const gymAt={pewter:0,cerulean:1,vermilion:2,celadon:3,
   fuchsia:4,saffron:5,cinnabar:6,viridian:7};
  const isCurrentGym=type==='gym'&&gymAt[location]===state.stage;
  this.children.removeAll(true);this.backdrop();
  text(this,320,45,hotspot.title,{
   fontSize:'21px',fontStyle:'bold',color:'#ffdf9d'}).setOrigin(.5).setDepth(12);
  const displayed=renderInteriorScene(this,location,type);
  if(!displayed){
   text(this,320,160,hotspot.description,{
    fontSize:'15px',color:'#e5f1f4',fontStyle:'bold'}).setOrigin(.5).setDepth(12);
   text(this,320,188,'INTERIOR EM PREPARAÇÃO — MAPA ORIGINAL PRESERVADO',{
    fontSize:'9px',color:'#a8d1d2'}).setOrigin(.5).setDepth(12);
  }
  if(type==='center')
   this.button(260,300,225,34,'CURAR POKÉMON / PC',
    ()=>this.centerScreen(state),true);
  else if(type==='mart'||type==='department')
   this.button(260,300,225,34,'ABRIR A LOJA',
    ()=>this.martScreen(state),true);
  else if(type==='gym'&&isCurrentGym)
   this.button(260,300,225,34,
    state.trainer>=TRAINERS_PER_GYM(state.stage)?
     'DESAFIAR O LÍDER':'LÍDER BLOQUEADO',
    ()=>this.gymScreen(state),
    state.trainer>=TRAINERS_PER_GYM(state.stage));
  else if(type==='safari'&&state.stage===4)
   this.button(260,300,225,34,'EXPLORAR GRAMA ALTA',
    ()=>this.grassScreen(state),true);
  else if(['rocket','tower','silph','harbor'].includes(type))
   this.button(260,300,225,34,'CONTINUAR A CAMPANHA',
    ()=>this.scene.restart(),true);
  else
   text(this,320,293,'TOQUE EM VOLTAR PARA EXPLORAR OUTRO LOCAL',{
    fontSize:'11px',color:'#a9d6e1'}).setOrigin(.5).setDepth(12);
  this.button(510,336,198,29,'◀ VOLTAR AO MAPA',
   ()=>this.scene.restart(),false,10);
 }
 housesScreen(state){
  const total=Math.max(1,Math.ceil((TRAINERS_PER_GYM(state.stage)+1)/(state.stage===0?3:5)));
  const region=campaignRegion(state.stage,this.mapPage??0,total,!!state.champion);
  const location=locationForCampaign(region);
  const important=new Set(['house','rival','lab','school','museum','bike',
   'fuji','dojo','bill','safari','tower','silph','harbor']);
  const homes=buildingInteractions(location).filter(h=>important.has(h.id));
  this.children.removeAll(true);this.backdrop();
  text(this,320,35,'CASAS E LUGARES IMPORTANTES',{
   ...titleStyle,fontSize:'18px'}).setOrigin(.5);
  text(this,320,74,'LOCAL: '+(location||region.title).toUpperCase(),{
   fontSize:'13px',color:C.blue}).setOrigin(.5);
  homes.slice(0,8).forEach((h,i)=>{
   const x=165+(i%2)*307,y=111+Math.floor(i/2)*49;
   this.button(x,y,278,36,h.title,()=>this.enterLocalityBuilding(state,location,h),false,10);
  });
  if(!homes.length)text(this,320,180,
   'NENHUMA CASA DISPONÍVEL NESTE TRECHO DA ROTA.',{
   fontSize:'13px',color:C.muted}).setOrigin(.5);
  this.button(522,333,198,30,'◀ VOLTAR À ROTA',()=>this.scene.restart());
 }
 gymScreen(state){
  const limit=TRAINERS_PER_GYM(state.stage);
  const remaining=Math.max(0,limit-state.trainer);
  const ready=!state.champion&&remaining===0;
  this.children.removeAll(true);this.backdrop();
  text(this,320,47,state.stage<8?'DESAFIO DO GINÁSIO':'DESAFIO DA LIGA',{
   ...titleStyle,fontSize:'22px'}).setOrigin(.5);
  text(this,320,104,ready?'LÍDER DISPONÍVEL PARA BATALHA':
   'DERROTE OS TREINADORES DA ROTA PRIMEIRO.',{
    fontSize:'15px',color:ready?'#a9f4bd':'#f5dda0'
   }).setOrigin(.5);
  text(this,320,162,ready?'VOCÊ PODE ENTRAR AGORA.':
   'FALTAM '+remaining+' TREINADORES PARA LIBERAR O LÍDER.',{
    fontSize:'12px',color:C.white
   }).setOrigin(.5);
  this.button(320,225,278,47,ready?'▶ DESAFIAR LÍDER':'CONTINUAR A ROTA',()=>{
   if(ready)this.enterBattle(state);
   else this.scene.restart();
  },ready,13);
  this.button(320,306,210,33,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 card(x,y,w,h,accent=0x4b789b){
  const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x13253e,.98).setStrokeStyle(1,accent);
  const line=this.add.rectangle(x+2,y+2,4,h-4,accent,.9).setOrigin(0,0);
  return bg;
 }
 hallOfFameScreen(state){
  // Deliberately no save mutation: awards were granted by resolveBattle.
  const hall=hallOfFameModel(state);
  if(!hall)return this.renderCampaign(state);
  this.__torre2HallOpen=true;
  // A Championship win can evolve an inactive party member AFTER combat.
  // Phaser preload ran on the BEFORE-battle team: load evolved PMD portrait
  // sheets here instead of drawing a fake box or silently reusing old art.
  const requested=this.__torre2HallRequested??=new Set();
  const missing=hall.team.filter(m=>{
   const key=portraitKey(m);
   return !this.textures.exists(key)&&!requested.has(key);
  });
  if(missing.length&&!this.__torre2HallLoading){
   this.__torre2HallLoading=true;
   for(const m of missing){
    const dex=portraitId(m),key='torre2-portrait-'+dex;
    requested.add(key);
    this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
   }
   this.load.once('complete',()=>{
    this.__torre2HallLoading=false;
    if(this.scene.isActive()&&this.__torre2HallOpen)
     this.hallOfFameScreen(readCampaign()||state);
   });
   this.load.start();
  }
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(0x060f21);
  const g=this.add.graphics().setDepth(1);
  g.fillStyle(0x061426).fillRect(0,0,640,360);
  g.fillStyle(0x112d40).fillRoundedRect(18,18,604,320,10);
  g.lineStyle(3,0xe4bd64,1).strokeRoundedRect(18,18,604,320,10);
  g.fillStyle(0x26475c,.95).fillRoundedRect(32,29,576,45,6);
  g.lineStyle(1,0xffe9a3).strokeRoundedRect(32,29,576,45,6);
  const center=(x,y,label,size=12,color=C.white)=>{
   const t=text(this,x,y,label,{fontSize:size+'px',fontStyle:'bold',
    color,stroke:'#081521',strokeThickness:3});
   t.setOrigin(.5).setDepth(7);return t;
  };
  center(320,45,'★ SALÃO DA FAMA ★',21,'#ffdf94');
  center(320,65,'CAMPEÃO DA REGIÃO DE KANTO',10,'#dcf4fb');
  const badges=hall.badgeCount+'/8 INSÍGNIAS';
  const honors=hall.honorCount+'/5 LIGA';
  center(320,89,badges+'  ·  '+honors+'  ·  '+hall.wins+' VITÓRIAS',
   10,hall.complete?'#b2ffcb':'#ffdfa0');
  // Canonical captured PMD portraits already loaded by Campanha.preload.
  // Entire champion party, capped at six, remains shown at their actual level.
  hall.team.forEach((member,i)=>{
   const col=i%3,row=Math.floor(i/3);
   const x=123+col*197,y=138+row*78;
   g.fillStyle(0x1a3449).fillRoundedRect(x-89,y-27,178,68,5);
   g.lineStyle(1,0x719dbe).strokeRoundedRect(x-89,y-27,178,68,5);
   g.fillStyle(0x1d5b49,.86).fillRoundedRect(x-80,y-19,58,51,4);
   this.drawPortrait(member,x-51,y+6,44,5);
   const name=member.id.replace(/-/g,' ').toUpperCase().slice(0,16);
   center(x+24,y-10,name,10,'#f6eed1');
   center(x+24,y+13,'NÍVEL '+member.level,10,'#c1e6f3');
  });
  if(!hall.team.length)center(320,172,'EQUIPE NÃO ENCONTRADA NO SAVE',11,'#f3c7a7');
  center(320,301,'LIGA CONCLUÍDA · PROGRESSO PRESERVADO NO SEU SAVE',
   9,'#adcbe0');
  this.button(320,327,232,27,'◀ VOLTAR AO MAPA',()=>this.renderCampaign(state))
   .setData('torre2-hall-back',true);
  this.__torre2HallOfFame={...hall};
 }
 renderCampaign(state){
  this.__torre2HallOpen=false;
  // The image-approved UI is a sequential battle road, not an overworld.
  // Keep all trainer/leader counters and the existing localStorage save IDs.
  // Retain older scene helpers below for PC, Center, Mart and summary only.
  this.children.removeAll(true);
  this.__torre2PathData={buscar};
  if(this.__torre2PathStage!==state.stage){
   this.__torre2PathPage=undefined;
   this.__torre2PathStage=state.stage;
  }
  const movePage=delta=>{
   const current=this.__torre2BattlePath?.offset||0;
   this.__torre2PathPage=Math.max(0,current+delta*13);
   this.renderCampaign(state);
  };
  const details=()=>{
   const foe=currentOpponent(state);
   if(!foe)return this.gymScreen(state);
   if(foe.leader)return this.gymScreen(state);
   this.__torre2PathDetails(text,this,foe);
  };
  const path=renderBattlePath(this,state,{
   rematch:i=>this.rematchScreen(state,i),
   battle:()=>this.enterBattle(state),
   gym:()=>this.gymScreen(state),
   training:()=>this.enterTraining(state),
   capture:()=>this.grassScreen(state),
   pokemon:i=>state.team[i]&&this.showSummary(state,i),
   bag:()=>this.bagScreen(state),center:()=>this.centerScreen(state),
   mart:()=>this.martScreen(state),badges:()=>this.badgeCaseScreen(state),
   hall:()=>this.hallOfFameScreen(state),
   menu:()=>this.scene.start('titulo',{menu:'principal'}),
   page:movePage,details,reset:()=>this.confirmResetJourney(),
   locked:()=>this.__torre2PathDetails(text,this,null)
  });
  // Expose stable index for smoke tests and safe scene re-entry; no overworld
  // map, invisible trainer zones or city navigation are created.
  this.__torre2PathPage=path.offset;
  return path;
 }
 badgeCaseScreen(state,selected=0){
  this.children.removeAll(true);this.backdrop();
  const index=Math.max(0,Math.min(7,selected));
  text(this,320,28,'ESTOJO DE INSÍGNIAS',titleStyle).setOrigin(.5);
  text(this,320,52,'KANTO  ·  '+GYMS.filter(g=>state.badges.includes(g.badge)).length+' / 8',statusStyle).setOrigin(.5);
  const cards=this.add.graphics().setDepth(2);
  GYMS.forEach((gym,i)=>{
   const x=110+(i%4)*140,y=107+Math.floor(i/4)*89,earned=state.badges.includes(gym.badge);
   cards.fillStyle(i===index?0x29485c:0x0a2135);cards.fillRect(x-61,y-37,122,76);
   cards.lineStyle(i===index?2:1,i===index?0xf5cf76:0x436480);cards.strokeRect(x-61,y-37,122,76);
   drawBadgeIcon(this,i,x,y-9,earned,2);
   text(this,x,y+14,gym.badge.toUpperCase(),{fontSize:'10px',color:earned?C.white:C.muted}).setOrigin(.5).setDepth(4);
   text(this,x,y+29,earned?'CONQUISTADA':'NÃO CONQUISTADA',{fontSize:'8px',color:earned?'#8be2b3':'#71899e'}).setOrigin(.5).setDepth(4);
   this.add.zone(x,y,122,76).setDepth(8).setInteractive({useHandCursor:true})
    .setData('torre2-badge-index',i).on('pointerdown',()=>this.badgeCaseScreen(state,i));
  });
  const gym=GYMS[index],earned=state.badges.includes(gym.badge),reward=GYM_TM_REWARDS[index];
  const item=MART_ITEMS.find(i=>i.id===reward),claimed=earned&&!!reward&&state.gymTMClaims?.includes(reward);
  text(this,320,253,gym.leader+'  ·  GINÁSIO DE '+gym.city.toUpperCase(),{fontSize:'14px',color:C.gold}).setOrigin(.5);
  const rewardText=item?item.name+'  ·  '+(claimed?'RECEBIDA':earned?'A RECEBER':'RECOMPENSA DO GINÁSIO'):
   'TM06 TOXIC  ·  INDISPONÍVEL NESTA VERSÃO';
  text(this,320,278,rewardText,{fontSize:'11px',color:C.white}).setOrigin(.5);
  text(this,320,297,'Selecione uma insígnia para consultar o ginásio e a recompensa.',{fontSize:'9px',color:C.muted}).setOrigin(.5);
  this.button(320,332,230,29,'◀ VOLTAR AO MAPA',()=>this.renderCampaign(state))
   .setData('torre2-badge-case-back',true);
  this.__torre2BadgeCase={selected:index,earned,claimed,reward:reward||null};
 }
 // Reset is intentionally a two-step action; a single stray tap may
 // never erase the campaign, team, PC, badges or saved inventory.
 confirmResetJourney(){
  if(this.__torre2ResetDialog?.active)return;
  const objects=[];
  const overlay=this.add.graphics().setDepth(3000);
  overlay.fillStyle(0x050b16,.83);overlay.fillRect(0,0,640,360);
  overlay.fillStyle(0x102b40,.99);overlay.fillRoundedRect(115,102,410,160,9);
  overlay.lineStyle(3,0xf7d17b,.96);overlay.strokeRoundedRect(115,102,410,160,9);
  objects.push(overlay);
  const blocker=this.add.zone(320,180,640,360).setDepth(3001).setInteractive();
  objects.push(blocker);
  const addLabel=(x,y,label,size,color='#fff4dc')=>{
   const obj=text(this,x,y,label,{
    fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',
    fontStyle:'bold',color,stroke:'#07121f',strokeThickness:2})
    .setOrigin(.5).setDepth(3005);
   objects.push(obj);return obj;
  };
  addLabel(320,133,'REINICIAR JORNADA?',19,'#ffe09a');
  addLabel(320,164,'Apaga equipe, insígnias, capturas e progresso.',11);
  addLabel(320,184,'A ação não poderá ser desfeita.',10,'#ffad9f');
  const close=()=>{
   for(const obj of objects)if(obj?.active)obj.destroy();
   this.__torre2ResetDialog=null;
  };
  const option=(x,title,confirm)=>{
   const bg=this.add.graphics().setDepth(3003);
   bg.fillStyle(confirm?0xa3423e:0x1b6186,.99);
   bg.fillRoundedRect(x-89,207,178,34,5);
   bg.lineStyle(2,confirm?0xffb39f:0x9cd5ea);
   bg.strokeRoundedRect(x-89,207,178,34,5);
   objects.push(bg);
   addLabel(x,224,title,12);
   const zone=this.add.zone(x,224,178,36).setDepth(3006)
    .setInteractive({useHandCursor:true})
    .setData('torre2-reset-confirm',confirm);
   zone.on('pointerdown',()=>{
    close();
    if(!confirm)return;
    resetCampaign();
    this.result=null;this.__torre2PathPage=0;this.__torre2PathStage=null;
    // The fresh starter picker must not replay old win results.
    this.scene.restart();
   });
   objects.push(zone);
  };
  option(229,'CANCELAR',false);
  option(411,'SIM, REINICIAR',true);
  this.__torre2ResetDialog=overlay;
 }
 __torre2PathDetails(draw,scene,foe){
  if(this.__torre2PathNotice?.active)this.__torre2PathNotice.destroy();
  const g=this.add.graphics().setDepth(190);
  g.fillStyle(0x071625,.95);g.fillRoundedRect(111,141,420,81,7);
  g.lineStyle(2,0xf3ce74);g.strokeRoundedRect(111,141,420,81,7);
  draw(this,320,162,foe?.name||'DESAFIO BLOQUEADO',{
   fontSize:'18px',fontStyle:'bold',color:'#ffe9a7'
  }).setOrigin(.5).setDepth(191);
  draw(this,320,186,foe?
   'NV.'+foe.level+' · '+foe.id.toUpperCase()+' · CLIQUE NO NÓ DOURADO PARA LUTAR':
   'VENÇA OS DESAFIOS ANTERIORES PARA AVANÇAR',{
    fontSize:'11px',color:'#bce9ee'
   }).setOrigin(.5).setDepth(191);
  const zone=this.add.zone(320,181,420,84).setDepth(192)
   .setInteractive({useHandCursor:true}).on('pointerdown',()=>{
    g.destroy();zone.destroy();for(const o of extra)o.destroy();
   });
  const extra=this.children.list.filter(o=>o.depth===191).slice(-2);
  this.__torre2PathNotice=g;
  this.time.delayedCall(3000,()=>{g.active&&g.destroy();zone.active&&zone.destroy();extra.forEach(o=>o.active&&o.destroy())});
 }
 drawPortrait(member,x,y,size=34,depth=5){
  const key=portraitKey(member);
  if(this.textures.exists(key)){
   const img=this.add.image(x,y,key).setDisplaySize(size,size).setDepth(depth);
   return img;
  }
  // A missing captured portrait must not hide the name or block input.
  const g=this.add.graphics().setDepth(depth);
  g.fillStyle(0x34556b);g.fillRect(x-size/2,y-size/2,size,size);
  g.lineStyle(1,0x7baabb);g.strokeRect(x-size/2,y-size/2,size,size);
  text(this,x,y,member.id.slice(0,2).toUpperCase(),{
   fontSize:'11px',color:'#ffffff'}).setOrigin(.5).setDepth(depth+1);
 }
 battleButton(x,y,w,h,label,callback,active=true){
  // A dedicated gold pixel-art action, centered under the Kanto map.
  // Native Phaser/WebGL graphics only; the touch target covers the whole CTA.
  const g=this.add.graphics().setDepth(74);
  const icon=this.add.graphics().setDepth(76);
  let hovered=false;
  const paint=()=>{
   g.clear();icon.clear();
   g.fillStyle(0x030f20,.75);
   g.fillRect(x-w/2-4,y-h/2+5,w+8,h+5);
   buttonFrame(g,x-w/2,y-h/2,w,h,'gold',hovered);
   g.fillStyle(0xfff0ab,.9);g.fillRect(x-w/2+32,y-h/2+6,2,h-12);
   g.fillStyle(0x695020,.8);g.fillRect(x+w/2-8,y-h/2+7,2,h-13);
   ball(icon,x-w/2+17,y,8);
  };
  const caption=estrechar(textoMenu(this,x+11,y,label,{
   tam:13,borde:3,colorBorde:MENU_UI.bordeTexto
  }).setOrigin(.5).setDepth(77),w-48);
  caption.setColor(active?'#2b291c':'#77736a');
  caption.setStroke('#ffea9f',0);
  const zone=this.add.zone(x,y,w,Math.max(32,h))
   .setDepth(79).setInteractive({useHandCursor:true});
  zone.on('pointerover',()=>{hovered=true;paint()});
  zone.on('pointerout',()=>{hovered=false;paint()});
  zone.on('pointerdown',()=>{if(active)callback()});
  paint();
  return zone;
 }
 captureScreen(state){
  this.children.removeAll(true);this.backdrop();
  const victim=state.pendingCapture;
  if(!victim)return this.scene.restart();
  text(this,320,37,'CAPTURAR '+victim.id.toUpperCase(),{
   ...titleStyle,fontSize:'21px'}).setOrigin(.5);
  text(this,320,82,'ESCOLHA A POKÉBOLA',{fontSize:'15px',color:C.white}).setOrigin(.5);
  for(const [i,key,label] of [
   [0,'pokeball','POKÉ BALL'],[1,'greatball','GREAT BALL'],[2,'ultraball','ULTRA BALL']]){
   const x=134+i*187,n=state.inventory?.[key]||0;
   this.button(x,176,173,72,label+'  x'+n,()=>{
    if(!n){state.lastMessage='Sem '+label+'. Compre no Poké Mart.';this.captureScreen(state);return}
    attemptCapture(state,Math.random,key);this.scene.restart();
   },n>0);
  }
  text(this,320,258,'Chance base '+victim.chance+'% · bolas melhores aumentam a chance',{
   fontSize:'12px',color:C.muted}).setOrigin(.5);
  this.button(320,319,225,37,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 rematchScreen(state,index){
  const foe=rematchOpponent(state,index);if(!foe)return;
  this.children.removeAll(true);this.backdrop();
  text(this,320,60,'REVANCHE · '+foe.name.toUpperCase(),titleStyle).setOrigin(.5);
  text(this,320,110,'Equipe até Nv.'+foe.level+' · VS Seeker '+(state.rematches?.charge||0)+'/3',textStyle).setOrigin(.5);
  text(this,320,151,'Recarrega ao vencer 3 outras batalhas.',statusStyle).setOrigin(.5);
  text(this,320,178,'Não concede insígnias, TMs ou progresso da história.',statusStyle).setOrigin(.5);
  this.button(320,235,240,40,'REVANCHE',()=>{
   const result=startRematch(state,index);
   if(!result.ok){text(this,320,278,result.reason,{fontSize:'10px',color:C.gold}).setOrigin(.5);return;}
   const party=createPartyMatch({...state,trainer:index},currentOpponent({...state,trainer:index}),false);
   for(const member of party.foes){member.level=Math.min(currentLevelCap(state.stage),member.level+Math.min(10,(state.badges?.length||0)*2));member.loadout=resolveLoadout({id:member.id,progression:{species:member.id,level:member.level}});}
   const p=party.friend[party.playerIndex],e=party.foes[0];
   const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
   this.launchBattle({p1:p.id,p2:e.id,modo:'cpu',nivel:'normal',arena:result.opponent.arena,mandos:[touch?'tactil':'kbm','cpu'],torre2:{stage:state.stage,trainer:state.trainer,kind:'rematch',ticket:result.ticket,party,playerLevel:p.level,enemyLevel:e.level,hardCap:currentLevelCap(state.stage)},torre2Loadout:p.loadout,torre2OpponentLoadout:e.loadout},false);
  },true);
  this.button(320,320,230,32,'◀ MAPA',()=>this.scene.restart());
 }
 enterTraining(state){
  this.children.removeAll(true);this.backdrop();
  const cfg=this.__labConfig??={player:'mewtwo',enemy:'onix',level:50,weather:'none'};
  text(this,320,35,'LABORATÓRIO · 151 POKÉMON',titleStyle).setOrigin(.5);
  text(this,320,65,'Testes isolados · sem XP, dinheiro ou alterações no save',statusStyle).setOrigin(.5);
  const change=(key,delta)=>{const i=KANTO_151_IDS.indexOf(cfg[key]);cfg[key]=KANTO_151_IDS[(i+delta+151)%151];this.enterTraining(state)};
  for(const [key,y,title]of [['player',115,'JOGADOR'],['enemy',170,'ADVERSÁRIO']]){
   text(this,320,y-20,title+': '+cfg[key].toUpperCase(),{fontSize:'13px'}).setOrigin(.5);
   this.button(165,y+6,70,28,'−10',()=>change(key,-10));this.button(245,y+6,70,28,'◀',()=>change(key,-1));
   this.button(395,y+6,70,28,'▶',()=>change(key,1));this.button(475,y+6,70,28,'+10',()=>change(key,10));
  }
  this.button(165,220,80,30,'NV −5',()=>{cfg.level=Math.max(1,cfg.level-5);this.enterTraining(state)});
  text(this,320,220,'NÍVEL '+cfg.level,{fontSize:'14px'}).setOrigin(.5);
  this.button(475,220,80,30,'NV +5',()=>{cfg.level=Math.min(100,cfg.level+5);this.enterTraining(state)});
  this.button(320,260,270,30,'CLIMA: '+WEATHER_NAMES[cfg.weather],()=>{const keys=Object.keys(WEATHER_NAMES);cfg.weather=keys[(keys.indexOf(cfg.weather)+1)%keys.length];this.enterTraining(state)});
  this.button(140,310,155,34,'◀ MAPA',()=>this.scene.restart());
  this.button(320,310,175,34,'TESTAR BATALHA',()=>{const match=prepareLaboratoryMatch(cfg);const touch='ontouchstart' in window||navigator.maxTouchPoints>0;match.mandos=[touch?'tactil':'kbm','cpu'];this.launchBattle(match,false)},true);
  this.button(500,310,155,34,'TREINO DE GOLPES',()=>this.enterMoveTraining(state));
 }
 enterMoveTraining(state){
  const match=prepareTrainingMatch(state);
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  match.mandos=[touch?'tactil':'kbm','cpu'];
  this.launchBattle(match,false);
 }
 enterBattle(state,wild=false){
  // A KO party cannot be resurrected by Phaser's native reiniciar().
  // Offer the real healing Center without consuming a trainer attempt,
  // progressing a route, resetting the save, or launching combat.
  if(!ensureConsciousActive(state)){
   state.lastMessage='Sua equipe desmaiou. Recupere-a no Centro Pokémon.';
   saveCampaign(state);
   this.centerScreen(state);
   return;
  }
  // Captures offered after victories are optional. The old guard silently
  // restarted the map forever from Trainer 2 onward.
  if(!wild&&state.pendingCapture){
   state.pendingCapture=null;
   state.lastMessage='Captura opcional dispensada; próximo treinador liberado.';
   saveCampaign(state);
  }
  const match=wild?startWildBattle(state):startBattle(state);
  const foe={id:match.p2,level:match.torre2.enemyLevel,
   leader:state.trainer>=TRAINERS_PER_GYM(state.stage)};
  const party=createPartyMatch(state,foe,wild);
  match.torre2.party=party;
  // The encounter descriptor names the ace; the party opens with its first
  // member. Sprite, level, stats and loadout must all use that same member.
  const firstPlayer=party.friend[party.playerIndex],firstEnemy=party.foes[party.enemyIndex];
  match.p1=firstPlayer.id;match.p2=firstEnemy.id;
  match.torre2.playerLevel=firstPlayer.level;match.torre2.enemyLevel=firstEnemy.level;
  match.torre2Loadout=firstPlayer.loadout;
  match.torre2OpponentLoadout=firstEnemy.loadout;
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  match.mandos=[touch?'tactil':'kbm','cpu'];
  this.launchBattle(match,wild);
 }
 launchBattle(match,wild=false){
  // Campaign-only level HUD, using the real saved levels and leader cap.
  // The original Arena 2D sprites, attacks and other modes remain untouched.
  const game=this.game;let frames=0;
  // The previous fight may return to the hub before 60 frames have passed.
  // Never let its stale installer grab the NEXT match (including training).
  if(game.__torre2BattleAttach)
   game.events.off('step',game.__torre2BattleAttach);
  const attach=()=>{
   const battle=game.scene.getScene('combate');
   if(battle.scene.isActive()&&battle.luchadores?.length===2&&
      !battle.__torre2PartyInstalled){
    const levelPanel=battle.add.graphics().setDepth(1170);
    levelPanel.fillStyle(0x071a2b,.92);
    levelPanel.fillRoundedRect(189,5,262,24,3);
    levelPanel.lineStyle(1,0xd3ac60);
    levelPanel.strokeRoundedRect(189,5,262,24,3);
    text(battle,199,10,'SEU NV.'+match.torre2.playerLevel+
     '   RIVAL NV.'+match.torre2.enemyLevel+
     '   TETO NV.'+match.torre2.hardCap,{
     fontSize:'11px',fontStyle:'bold',color:'#fff0c6'}).setDepth(1171);
    installPartyBattle(battle);
    if(match.torre2.laboratory)installLaboratoryControls(battle);
    else if(match.torre2.training)installTrainingDummy(battle);
    else if(wild)installWildCapture(battle);
    // Phaser restarts the SAME battle scene to send out the next Pokémon.
    // Keep this ONE listener while battling so every replacement gets a HUD.
   }
   if((game.scene.isActive('campanha')&&frames>60)||++frames>18000){
    game.events.off('step',attach);
    if(game.__torre2BattleAttach===attach)game.__torre2BattleAttach=null;
   }
  };
  game.__torre2BattleAttach=attach;
  game.events.on('step',attach);
  // Defer scene transition until the current pointer event finishes.
  // On mobile, starting combate during a pointerdown can route the same
  // tap to the battle scene and immediately close/restart it.
  this.time.delayedCall(0,()=>{
   if(this.scene.isActive())this.scene.start('combate',match);
  });
 }
 grassScreen(state){
  // Do not destroy the loaded overworld when entering tall grass. Removing
  // all scene children invalidated the map and its hotspot/hover references.
  // This modal uses separate high-depth Phaser objects, so Close restores
  // precisely the same map, sprites, and panel state without a scene restart.
  if(this.__torre2GrassOverlay?.active)return;
  const start=this.children.list.length;
  const wideOffset=0;
  const shade=this.add.rectangle(320+wideOffset,180,
   640+wideOffset*2,360,0x020c17,.90).setDepth(610);
  this.__torre2GrassOverlay=shade;
  this.add.zone(320+wideOffset,180,640+wideOffset*2,360)
   .setDepth(611).setInteractive();
  this.add.rectangle(320+wideOffset,179,598,295,0x10283c)
   .setStrokeStyle(2,0xf0ce87).setDepth(612);
  const msg=(x,y,value,style={})=>text(this,x+wideOffset,y,value,style)
   .setDepth(620).setOrigin(.5);
  const close=()=>{
   const list=this.children.list.slice(start);
   list.forEach(obj=>obj.active&&obj.destroy());
   this.__torre2GrassOverlay=null;
  };
  const modalButton=(x,y,w,h,label,callback,gold=false)=>{
   const g=this.add.graphics().setDepth(622);
   buttonFrame(g,x+wideOffset-w/2,y-h/2,w,h,gold?'gold':'blue',false);
   msg(x,y,label,{fontSize:'12px',fontStyle:'bold',
    color:gold?'#302510':'#fff6e4'}).setDepth(623);
   return this.add.zone(x+wideOffset,y,w,h).setDepth(630)
    .setInteractive({useHandCursor:true}).on('pointerdown',callback);
  };
  const area=wildAvailability(state.stage);
  msg(320,57,'GRAMA ALTA · '+area.label,{...titleStyle,fontSize:'18px'});
  msg(320,88,area.area.toUpperCase(),{fontSize:'13px',color:C.gold});
  msg(320,111,'ENCONTROS REGIONAIS (FIRE RED)',{
   fontSize:'11px',color:C.blue});
  area.wild.slice(0,12).forEach((id,i)=>{
   const x=111+(i%4)*142,y=148+Math.floor(i/4)*29;
   const ok=area.available.includes(id);
   const badge=this.add.rectangle(x+wideOffset,y,132,25,ok?0x24553f:0x223345)
    .setStrokeStyle(1,ok?0x7dd597:0x445468).setDepth(617);
   msg(x,y,id.toUpperCase()+(ok?' ✓':' · FUTURO'),{
    fontSize:'9px',color:ok?'#d7ffda':'#8ca9bb'});
  });
  msg(320,248,'Encontros nesta área: '+(state.wildEncountersStage||0)+'/5',
   {fontSize:'11px',color:C.gold});
  modalButton(174,292,224,31,'◀ VOLTAR AO MAPA',close);
  modalButton(465,292,224,31,'PROCURAR POKÉMON',()=>{
   const found=startWildEncounter(state);
   if(found.ok){close();this.enterBattle(state,true);}
   else{
    close();
    const toast=text(this,320,285,state.lastMessage||'Nenhum encontro disponível.',{
     fontSize:'11px',color:C.gold}).setOrigin(.5).setDepth(620);
    this.time.delayedCall(1600,()=>toast.active&&toast.destroy());
   }
  },true);
 }
 centerScreen(state){
  this.__torre2CenterBusy=false;
  this.children.removeAll(true);this.backdrop();
  text(this,320,41,'CENTRO POKÉMON',{...titleStyle,fontSize:'24px'}).setOrigin(.5);
  text(this,320,96,'CURAR TODA A EQUIPE · SEM CUSTO',{
   fontSize:'16px',color:'#a4f6dc'}).setOrigin(.5);
  const beginHeal=()=>{
   if(this.__torre2CenterBusy||!this.scene.isActive())return;
   this.__torre2CenterBusy=true;
   // Native Phaser-only treatment. An opaque input zone prevents multiple
   // clicks, PC transfers or a map restart while the one save is pending.
   this.add.zone(320,180,640,360).setDepth(601).setInteractive()
    .setData('torre2-center-lock',true);
   const overlay=this.add.graphics().setDepth(602);
   overlay.fillStyle(0x061425,.97).fillRect(0,0,640,360);
   overlay.fillStyle(0x152f42).fillRoundedRect(52,58,536,244,10);
   overlay.lineStyle(2,0xd8bc74).strokeRoundedRect(52,58,536,244,10);
   text(this,320,94,'RECUPERANDO SUA EQUIPE',{
    fontSize:'21px',fontStyle:'bold',color:'#ffe6a3'
   }).setOrigin(.5).setDepth(610);
   const status=text(this,320,238,'RESTAURANDO HP E CONDIÇÕES DE STATUS',{
    fontSize:'12px',color:'#bde9e7'
   }).setOrigin(.5).setDepth(610);
   for(const [i,member] of state.team.slice(0,6).entries()){
    const x=320-(Math.min(6,state.team.length)-1)*43+i*86;
    const icon=this.add.graphics().setDepth(610);
    ball(icon,x,160,13);
    icon.setAlpha(.27);
    this.tweens.add({targets:icon,alpha:1,duration:260,delay:i*150,
     yoyo:true,repeat:1,ease:'Sine.easeInOut'});
    text(this,x,191,member.id.toUpperCase().slice(0,11),{
     fontSize:'9px',color:'#f1f7e5'
    }).setOrigin(.5).setDepth(610);
   }
   // HealTeam remains the SOLE economy/save authority: one invocation only.
   this.time.delayedCall(1400,()=>{
    if(!this.scene.isActive()||!this.__torre2CenterBusy)return;
    healTeam(state);
    status.setText('EQUIPE RECUPERADA · HP, STATUS E DESMAIOS CURADOS')
     .setColor('#a9f6d3');
    this.add.zone(320,270,250,25).setDepth(615)
     .setData('torre2-center-heal-done',true);
    this.time.delayedCall(450,()=>{
     if(this.scene.isActive()&&this.__torre2CenterBusy)this.scene.restart();
    });
   });
  };
  this.button(320,154,275,46,'CURAR POKÉMON',beginHeal,true)
   .setData('torre2-center-heal',true);
  this.button(320,219,275,40,'ABRIR PC',()=>this.pcScreen(state))
   .setData('torre2-center-pc',true);
  this.button(320,298,275,32,'◀ VOLTAR AO MAPA',()=>this.scene.restart())
   .setData('torre2-center-back',true);
 }
 martScreen(state,page=0){
  this.children.removeAll(true);this.backdrop();
  text(this,320,23,'POKÉ MART · $'+state.money,{
   ...titleStyle,fontSize:'19px'}).setOrigin(.5);
  const items=MART_ITEMS.filter(i=>state.stage>=(i.minStage||0));
  const count=Math.max(1,Math.ceil(items.length/6));
  const pageNum=Math.min(count-1,Math.max(0,page));
  items.slice(pageNum*6,(pageNum+1)*6).forEach((item,i)=>{
   const x=168+(i%2)*301,y=95+Math.floor(i/2)*66;
   this.card(x-141,y-20,283,57,state.money>=item.price?0x568fbb:0x6b5669);
   drawShopItem(this.add.graphics().setDepth(5),x-118,y+6,item,1);
   text(this,x-98,y-9,item.name,{fontSize:'11px',color:C.white});
   text(this,x-98,y+9,'$'+item.price+(item.kind==='tm'?' · TM':' · '+item.kind.toUpperCase()),{
    fontSize:'10px',color:C.muted});
   this.button(x+100,y+6,70,30,'COMPRAR',()=>{
    purchaseItem(state,item.id);this.martScreen(state,pageNum);
   },state.money>=item.price).setData('torre2-mart-buy',item.id);
  });
  this.button(140,315,177,33,'◀ MAPA',()=>this.scene.restart());
  this.button(346,315,205,33,'ITENS '+(pageNum+1)+'/'+count,()=>this.martScreen(state,(pageNum+1)%count),true);
  this.button(543,315,176,33,'BOLSA / TM',()=>this.bagScreen(state)).setData('torre2-mart-bag',true);
  text(this,320,281,state.lastMessage||'Compre Pokébolas, poções e TM',{
   fontSize:'10px',color:C.gold,wordWrap:{width:560}}).setOrigin(.5);
 }
 bagScreen(state){
  this.children.removeAll(true);this.backdrop();
  text(this,320,27,'BOLSA · POKÉDÓLARES '+state.money,{
   ...titleStyle,fontSize:'20px'}).setOrigin(.5);
  const inv=state.inventory||{};
  const target=Math.max(0,Math.min(state.team.length-1,
   Number.isInteger(this.bagMemberIndex)?this.bagMemberIndex:state.active));
  this.bagMemberIndex=target;
  text(this,320,63,'PB '+(inv.pokeball||0)+' · GB '+(inv.greatball||0)+
   ' · UB '+(inv.ultraball||0)+' · POÇÃO '+(inv.potion||0)+
   ' · SUPER '+(inv.superpotion||0),{
   fontSize:'11px',color:C.gold}).setOrigin(.5);
  text(this,320,92,'ESCOLHA QUEM RECEBE O ITEM:',{
   fontSize:'11px',color:C.blue}).setOrigin(.5);
  state.team.slice(0,6).forEach((member,i)=>{
   const x=161+(i%3)*160,y=127+Math.floor(i/3)*40;
   const chosen=i===target;
   const hit=this.add.rectangle(x,y,149,33,chosen?0x35566e:0x213950)
    .setStrokeStyle(2,chosen?0xffd479:0x567994)
    .setInteractive({useHandCursor:true});
   hit.on('pointerdown',()=>{
    this.bagMemberIndex=i;this.bagScreen(state);
   });
   this.drawPortrait(member,x-55,y,27);
   text(this,x-34,y-12,(chosen?'◆ ':'')+member.id.toUpperCase().slice(0,12),{
    fontSize:'10px',color:chosen?'#ffe4a1':'#e4f2ff'});
   text(this,x-33,y+3,'NV.'+(member.progression?.level??'?')+
    ' · HP '+Math.round(Math.max(0,Math.min(100,Number(member.hp??100)||0)))+'% '+statusLabel({est:{[member.status?.kind]:true}}),{fontSize:'9px',color:C.muted});
  });
  this.button(320,198,210,24,'REMÉDIOS DE STATUS',()=>this.statusMedicineScreen(state,target)).setData('torre2-status-medicine-open',true);
  this.button(157,231,170,37,'POÇÃO +25 HP',()=>{
   const result=usePotion(state,'potion',target);
   if(!result.ok)state.lastMessage=result.reason;
   this.bagScreen(state);
  },true);
  this.button(340,231,170,37,'SUPER +60 HP',()=>{
   const result=usePotion(state,'superpotion',target);
   if(!result.ok)state.lastMessage=result.reason;
   this.bagScreen(state);
  },true);
  this.button(517,231,166,37,'SUMÁRIO',()=>this.showSummary(state,target));
  const tms=inv.tms||[];
  const pages=Math.max(1,Math.ceil(tms.length/3));
  this.bagTmPage=Math.max(0,Math.min(pages-1,this.bagTmPage||0));
  if(tms.length)text(this,292,269,'ENSINAR TM PARA '+state.team[target].id.toUpperCase().slice(0,11),{
   fontSize:'11px',color:C.gold}).setOrigin(.5);
  else text(this,292,269,'Nenhuma TM. Compre no Mart.',{
   fontSize:'11px',color:C.muted}).setOrigin(.5);
  if(pages>1)this.button(561,269,117,22,
   'TM '+(this.bagTmPage+1)+'/'+pages+'  ›',()=>{
    this.bagTmPage=(this.bagTmPage+1)%pages;this.bagScreen(state);
   },false,9);
  tms.slice(this.bagTmPage*3,this.bagTmPage*3+3).forEach((id,i)=>{
   const item=MART_ITEMS.find(x=>x.id===id);
   if(!item)return;
   const compatible=!Array.isArray(item.compatible)||
    item.compatible.includes(state.team[target].id);
   this.button(144+i*181,302,173,27,
    compatible?item.name:'INCOMP. '+item.name.slice(0,12),()=>{
    const result=teachTM(state,id,target);
    if(!result.ok)state.lastMessage=result.reason;
    this.bagScreen(state);
   },compatible);
   drawShopItem(this.add.graphics().setDepth(6),76+i*181,303,item,.65);
  });
  if(state.lastMessage)text(this,320,324,state.lastMessage.slice(0,90),{
   fontSize:'9px',color:C.gold}).setOrigin(.5);
  this.button(320,343,220,23,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 statusMedicineScreen(state,target){
  this.children.removeAll(true);this.backdrop();
  const member=state.team[target];
  text(this,320,25,'REMÉDIOS DE STATUS',{...titleStyle,fontSize:'20px'}).setOrigin(.5);
  const status=statusLabel({est:{[member.status?.kind]:true}})||(member.confusion?'CONFUSÃO':'SEM STATUS');
  text(this,320,59,member.id.toUpperCase()+' · '+(member.hp<=0?'DESMAIADO':status),{fontSize:'12px',color:C.gold}).setOrigin(.5);
  MART_ITEMS.filter(i=>i.kind==='status').forEach((item,i)=>{
   const x=167+(i%2)*306,y=105+Math.floor(i/2)*65;
   this.button(x,y,275,38,item.name+' ×'+(state.inventory[item.id]||0),()=>{
    const result=useStatusCure(state,item.id,target);
    if(!result.ok)state.lastMessage=result.reason;
    this.statusMedicineScreen(state,target);
   }).setData('torre2-status-medicine',item.id);
   text(this,x,y+25,item.cureConfusion?'Cura todos os status e confusão':'Cura '+statusLabel({est:{[item.cures[0]]:true}}),{fontSize:'10px',color:C.muted}).setOrigin(.5);
  });
  text(this,320,285,state.lastMessage||'Selecione o remédio para este Pokémon.',{fontSize:'10px',color:C.gold,wordWrap:{width:570}}).setOrigin(.5);
  this.button(175,330,260,32,'◀ VOLTAR À BOLSA',()=>this.bagScreen(state)).setData('torre2-status-medicine-back',true);
  this.button(465,330,260,32,'POKÉ MART',()=>this.martScreen(state));
 }
 showSummary(state,index,slot=0,page=0){
  // Game-native Phaser UI: clear hierarchy, 4 visible attack slots, large
  // touch targets, instant type filtering and search for Mewtwo's large pool.
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  const member=state.team[index];
  if(!member)return this.scene.restart();
  const stats=pokemonStats(member),pool=availableMoves(member);
  // Campaign preload also loads this PMD portrait; keep the summary image visible.
  const chosen=selectedMoves(member),activeSlot=Math.min(3,Math.max(0,slot));
  const battleKit=resolveLoadout(member),introStage=member.id!=='mewtwo'&&Object.values(battleKit).some(move=>move?.torre2IntroPractice);
  const earlyPlan=earlyKantoSlotPlan(member.id)||nativeKantoEvolutionPlan(member.id);
  this.summaryFilter??='ALL';this.summarySearch??='';
  const slotCodes=['LMB','RMB','Q','E'];
  const slotNames=earlyPlan?['ATK','HAB 2','HAB 3','ULT']:
   ['ATAQUE 1','ATAQUE 2','ESPECIAL','FINALIZADOR'];
  const types={NORMAL:0xb9c4d2,FIRE:0xf0804d,WATER:0x6fb7f0,ELECTRIC:0xeec95d,
    GRASS:0x83d18a,ICE:0x9bdcee,FIGHTING:0xdb8e77,POISON:0xb98cd9,
    GROUND:0xc3aa77,FLYING:0x98c6e3,PSYCHIC:0xe997bf,BUG:0xaacb70,
    ROCK:0xbaa981,GHOST:0x9b8ec5,DRAGON:0x9da9ef,DARK:0x969cac,
    STEEL:0xa4bbc6,FAIRY:0xe5a8d6};
  const hex=(type)=>'#'+(types[type]??0x9db1c7).toString(16).padStart(6,'0');
  const ncol=type=>types[type]??0x9db1c7;
  const box=(x,y,w,h,fill=0x14243b,stroke=0x375371)=>{
   const rect=this.add.rectangle(x+w/2,y+h/2,w,h,fill,.98).setStrokeStyle(1,stroke);
   return rect;
  };
  const label=(x,y,caption,color='#dceaff',size=11)=>text(this,x,y,caption,{
   fontSize:size+'px',color});
  const button=(x,y,w,h,caption,click,selected=false)=>{
   const bg=box(x,y,w,h,selected?0x28465f:0x1b314a,selected?0xe7c56a:0x52718f);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerover',()=>bg.setFillStyle(selected?0x385b79:0x2d506f));
   bg.on('pointerout',()=>bg.setFillStyle(selected?0x28465f:0x1b314a));
   bg.on('pointerdown',click);
   const name=label(x+w/2,y+h/2,caption,selected?'#ffe09a':'#e1eeff',11);
   name.setOrigin(.5);
   return bg;
  };
  // Distinct header and unified back navigation.
  box(10,8,620,36,0x10243d,0x456b91);
  label(23,15,'POKÉMON / SUMÁRIO',C.gold,16);
  button(521,13,98,27,'◀ EQUIPE',()=>{this.summaryFilter='ALL';this.summarySearch='';this.scene.restart()});
  // Left: species identity and visible stats.
  box(13,52,197,296,0x13233b,0x4a789f);
  label(24,61,stats.name.toUpperCase(),C.gold,15);
  const typesCaption=stats.types.join('  /  ');
  label(25,82,'NV. '+stats.level+'    '+typesCaption,hex(stats.types[0]),11);
  const {def,etapa}=buscar(member.id);
  const dex=(etapa>0?def.evoluciones[etapa-1]?.dex:def.dex)||'0150';
  const key='torre2-portrait-'+dex;
  box(25,103,82,81,0x091726,0x365b78);
  const portrait=()=>{
   if(!this.scene.isActive()||!this.textures.exists(key))return;
   this.add.image(66,143,key).setDisplaySize(74,74).setDepth(2);
  };
  if(this.textures.exists(key))portrait();
  else{
   this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
   this.load.once('complete',portrait);
   if(!this.load.isLoading())this.load.start();
  }
  label(119,114,'TIPO',C.muted,10);
  label(119,131,stats.types[0],hex(stats.types[0]),12);
  label(119,151,'NV. '+stats.level,C.white,11);
  const statRows=[['HP',stats.hp,180,0x64cb9c],['ATK',stats.attack,160,0xf6a268],
                  ['DEF',stats.defense,165,0x7ab3f5],['SPD',stats.speed,200,0x9cd4d7]];
  statRows.forEach(([name,value,max,color],i)=>{
   const y=194+i*23;
   label(25,y,name,C.muted,10);label(179,y,String(value),C.white,10).setOrigin(1,0);
   box(60,y+3,100,7,0x0c1725,0x1d3046);
   const width=Math.max(3,96*Math.min(1,Math.max(0,value/max)));
   this.add.rectangle(62+width/2,y+6.5,width,4,color,1);
  });
  label(25,289,member.id==='mewtwo'?'TESTE · GOLPES LIBERADOS':'ESCOLHA SEU POKÉMON',
    member.id==='mewtwo'?'#ffcd7b':C.blue,10);
  button(24,311,174,29,index===state.active?'◆ EM BATALHA':'USAR NA BATALHA',()=>{
   selectTeamMember(state,index);this.summaryFilter='ALL';this.summarySearch='';this.scene.restart();
  },index===state.active);
  // Right: four prominent touch-friendly equipped slots, 2×2.
  box(218,52,409,296,0x12243a,0x496b86);
  label(231,59,'GOLPES EQUIPADOS',C.gold,14);
  label(231,78,earlyPlan?'LMB ATK  ·  RMB HAB 2  ·  Q HAB 3  ·  E ULT  ·  ESP ESQUIVA':
   'TOQUE NO SLOT QUE DESEJA ALTERAR',C.muted,earlyPlan?8:9);
  slotCodes.forEach((_,i)=>{
   const id=chosen[i],battleSlot=['lmb','rmb','q','e'][i];
   const nativeMove=pool.find(m=>m.id===id);
   const move=introStage?(battleKit[battleSlot]||null):nativeMove;
   const x=229+(i%2)*194,y=93+Math.floor(i/2)*43;
   const current=activeSlot===i;
   const bg=box(x,y,189,39,current?0x294765:0x172d43,current?0xf0cb6d:0x385772);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerdown',()=>this.showSummary(state,index,i,0));
   bg.on('pointerover',()=>bg.setFillStyle(0x335977));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x294765:0x172d43));
   label(x+8,y+4,slotCodes[i]+' · '+slotNames[i],
     current?'#ffe6a7':'#96b2ce',9);
   const upcoming=earlyPlan?.[i],need=upcoming?EARLY_KANTO_LEARNSETS[member.id]?.[
    upcoming.toLowerCase().replace(/[^a-z0-9]+/g,'-')]:null;
   label(x+8,y+18,move?.nombre??(introStage&&i===3&&stats.level<8?
    'ULT · DESBLOQUEIA NV. 8':upcoming?
    upcoming+' · LV '+(need??'EVO'):'—'),move?C.white:'#f5c578',move?12:10);
   if(move?.torre2IntroPractice)label(x+8,y+31,'TREINO · PODER REDUZIDO','#b1cfde',7);
   label(x+180,y+4,move?.tipo??'',hex(move?.tipo),9).setOrigin(1,0);
   label(x+180,y+21,'CD '+(move?.cd??0)+'s',C.muted,9).setOrigin(1,0);
  });
  // Fifth dedicated action is ALWAYS defensive and never consumes an
  // attack slot: native Phaser Space Dodge, untouched original ATK visuals.
  if(earlyPlan){
   label(230,179,'ESQUIVA  ·  ESP / SPACE  ·  DODGE (SEM DANO)','#9ddcf0',8);
  }
  // Separated library with filters and paging: can navigate Mewtwo moves.
  this.add.rectangle(424,189,384,1,0x446580);
  label(230,195,'BIBLIOTECA · '+pool.length+' GOLPES',C.gold,12);
  button(445,187,91,25,'TIPO ▾',()=>this.showMoveTypePicker(state,index,activeSlot),false);
  button(541,187,75,25,'BUSCAR',()=>{
   const query=window.prompt('Buscar golpe por nome (vazio para limpar):',this.summarySearch||'');
   if(query===null)return;
   this.summarySearch=query.trim().slice(0,35);
   this.showSummary(state,index,activeSlot,0);
  });
  // Virtual NEW tab shows only not-yet-approved Torre 2 moves.
  const filtered=filterMoveLibrary(pool,this.summaryFilter,this.summarySearch);
  const pageSize=6,pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const safePage=Math.min(pages-1,Math.max(0,page));
  if(this.summaryFilter!=='ALL'||this.summarySearch)
   label(230,213,'FILTRO: '+this.summaryFilter+
    (this.summarySearch?'  ·  '+this.summarySearch.toUpperCase():''),
    '#95ceef',9);
  const rowsY=223;
  filtered.slice(safePage*pageSize,(safePage+1)*pageSize).forEach((move,i)=>{
   const x=230+(i%2)*193,y=rowsY+Math.floor(i/2)*30;
   const equipped=chosen.includes(move.id);
   const current=chosen[activeSlot]===move.id;
   const pending=isPendingApprovalMove(move);
   const bg=box(x,y,188,27,current?0x275749:equipped?0x1e434c:0x1a344d,
    current?0x73d8b0:equipped?0x658e96:0x3c6283);
   bg.setInteractive({useHandCursor:true});
   bg.on('pointerdown',()=>{
    if(equipMove(member,activeSlot,move.id)){
     saveCampaign(state);this.showSummary(state,index,activeSlot,safePage);
    }else{
     this.summaryWarning=equipped?'ESSE GOLPE JÁ ESTÁ EM OUTRO SLOT.':'GOLPE NÃO DISPONÍVEL.';
     this.showSummary(state,index,activeSlot,safePage);
    }
   });
   bg.on('pointerover',()=>bg.setFillStyle(0x305c70));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x275749:equipped?0x1e434c:0x1a344d));
   label(x+6,y+3,(current?'✓ ':equipped?'◆ ':'+ ')+move.nombre+(move.approved?' ✓':''),
    current?'#bcffe3':'#ebf5ff',10);
   label(x+6,y+16,move.tipo,C.muted,8);
   if(pending)label(x+77,y+16,'NEW','#ffdc89',8);
   label(x+181,y+16,'CD '+move.cd+'s',C.muted,8).setOrigin(1,0);
  });
  if(filtered.length===0)label(242,255,this.summaryFilter==='NEW'?'TODOS OS GOLPES APROVADOS ✓':'NENHUM GOLPE ENCONTRADO',C.muted,11);
  button(233,317,68,25,'◀ ANTES',()=>this.showSummary(state,index,activeSlot,(safePage+pages-1)%pages));
  button(306,317,125,25,(safePage+1)+' / '+pages+' PÁGINAS',()=>this.showSummary(state,index,activeSlot,0),true);
  button(437,317,73,25,'PRÓXIMO ▶',()=>this.showSummary(state,index,activeSlot,(safePage+1)%pages));
  button(515,317,101,25,'LIMPAR',()=>{
   this.summaryFilter='ALL';this.summarySearch='';this.summaryWarning=null;
   this.showSummary(state,index,activeSlot,0);
  });
  if(this.summaryWarning)label(242,211,this.summaryWarning,'#f6bc86',9);
  this.summaryWarning=null;
 }
 showMoveTypePicker(state,index,slot){
  // In-game type chooser, not a browser form or tiny cycle control.
  const all=availableMoves(state.team[index]);
  const newCount=all.filter(isPendingApprovalMove).length;
  // NEW belongs in the type selector, after ALL; it is not a Pokémon type.
  const types=['ALL','NEW',...[...new Set(all.map(m=>m.tipo))].sort()];
  const overlay=this.add.rectangle(320,180,640,360,0x050e19,.9)
   .setDepth(2000).setInteractive();
  const panel=this.add.rectangle(320,178,550,268,0x152a45,.99)
   .setStrokeStyle(2,0x7da5c1).setDepth(2001);
  const title=text(this,75,66,'FILTRAR MOVIMENTOS POR TIPO',
   {fontSize:'17px',color:C.gold}).setDepth(2002);
  const close=text(this,548,69,'FECHAR ✕',{fontSize:'11px',color:C.white})
   .setInteractive({useHandCursor:true}).setDepth(2003);
  close.on('pointerdown',()=>this.showSummary(state,index,slot,0));
  types.forEach((type,i)=>{
   const x=79+(i%5)*99,y=109+Math.floor(i/5)*49;
   const rect=this.add.rectangle(x+43,y+14,91,35,
     this.summaryFilter===type?0x365d74:0x233f59).setStrokeStyle(1,
      this.summaryFilter===type?0xecc76d:0x5e809d)
    .setInteractive({useHandCursor:true}).setDepth(2002);
   const labelType=text(this,x+43,y+14,type,{
     fontSize:'11px',color:type==='NEW'?'#ffe09a':'#f2f6fb'
   }).setOrigin(.5).setDepth(2003);
   if(type==='NEW')text(this,x+81,y+4,String(newCount),
     {fontSize:'9px',color:'#ffe09a'}).setOrigin(1,0).setDepth(2003);
   rect.on('pointerdown',()=>{
    this.summaryFilter=type;
    if(type==='NEW')this.summarySearch=''; // always reveal entire pending queue
    this.summaryWarning=null;
    this.showSummary(state,index,slot,0);
   });
  });
 }
 pcScreen(state,page=0){
  // Native Phaser PC, storing and swapping caught Pokémon, fully persistent.
  this.children.removeAll(true);this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  text(this,20,13,'CENTRO POKÉMON · PC',{...titleStyle,fontSize:'19px'});
  this.button(549,21,155,28,'◀ CAMPANHA',()=>{this.pcSelected=null;this.scene.restart()});
  text(this,22,52,'EQUIPE '+state.team.length+'/6',{color:C.gold,fontSize:'14px'});
  text(this,330,52,'ARMAZENAMENTO '+state.box.length,{color:C.gold,fontSize:'14px'});
  const totalPages=Math.max(1,Math.ceil(state.box.length/6));
  const safePage=Math.max(0,Math.min(totalPages-1,page));
  state.team.forEach((m,i)=>{
   const y=79+i*34,selected=this.pcSelected===i,isActive=i===state.active;
   this.button(164,y,281,29,(isActive?'◆ ':'')+m.id.toUpperCase()+
    ' NV.'+(m.progression?.level??'?')+(selected?' [SELECIONADO]':''),()=>{
     this.pcSelected=i===this.pcSelected?null:i;this.pcScreen(state,safePage);
    },selected);
  });
  const boxPage=state.box.slice(safePage*6,(safePage+1)*6);
  boxPage.forEach((m,i)=>{
   const actual=safePage*6+i,y=79+i*34;
   this.button(466,y,277,29,m.id.toUpperCase()+' · NV.'+(m.progression?.level??'?'),()=>{
    let changed=false;
    if(state.team.length<6)changed=withdrawPokemon(state,actual);
    else if(Number.isInteger(this.pcSelected))changed=swapPokemon(state,this.pcSelected,actual);
    if(changed)this.pcSelected=null;
    else state.lastMessage='Selecione um Pokémon da equipe para trocar.';
    this.pcScreen(state,Math.min(safePage,Math.max(0,Math.ceil(state.box.length/6)-1)));
   });
  });
  if(!boxPage.length)text(this,342,94,'PC VAZIO · CAPTURE POKÉMON',statusStyle);
  this.button(121,310,195,29,'GUARDAR SELECIONADO',()=>{
   if(!storePokemon(state,this.pcSelected))
    state.lastMessage='Selecione um Pokémon; mantenha pelo menos um na equipe.';
   this.pcSelected=null;this.pcScreen(state,safePage);
  });
  this.button(337,310,111,29,'◀ ANTERIOR',()=>this.pcScreen(state,(safePage-1+totalPages)%totalPages));
  this.button(451,310,104,29,(safePage+1)+' / '+totalPages,()=>this.pcScreen(state,0));
  this.button(568,310,119,29,'PRÓXIMA ▶',()=>this.pcScreen(state,(safePage+1)%totalPages));
  text(this,20,345,'Equipe cheia? Selecione alguém à esquerda e clique no PC para trocar.',{
   fontSize:'10px',color:C.muted});
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  text(this,ANCHO/2,18,'POKÉDEX DE KANTO · '+KANTO_DEX.length+' ESPÉCIES',
    {...titleStyle,fontSize:'18px'}).setOrigin(.5,0);
  const supported=new Set(ROSTER.flatMap(p=>[p.id,...(p.evoluciones||[]).map(x=>x.nombre.toLowerCase())]));
  text(this,ANCHO/2,47,'VISTOS '+(state.dexSeen?.length??0)+'  ·  CAPTURADOS '+(state.dexCaught?.length??0)+
   '  ·  Somente espécies integradas entram em batalha.',statusStyle).setOrigin(.5);
  const page=Math.min(this.dexPage||0,6);
  for(let i=0;i<22;i++){
   const index=page*22+i;if(index>=KANTO_DEX.length)break;
   const raw=KANTO_DEX[index];
   const slug=raw==='Nidoran♀'?'nidoran-f':raw==='Nidoran♂'?'nidoran-m':raw.toLowerCase();
   const ready=supported.has(slug),caught=(state.dexCaught||[]).includes(slug);
   const seen=caught||(state.dexSeen||[]).includes(slug);
   const x=35+(i>=11?295:0),y=75+(i%11)*21;
   const marker=caught?' ★':seen?' ◦':ready?' ✓':'';
   text(this,x,y,String(index+1).padStart(3,'0')+'. '+raw+marker,{
    fontSize:'11px',color:caught?C.gold:seen?C.blue:C.muted});
  }
  this.button(91,329,140,31,'◀ VOLTAR',()=>this.scene.restart());
  this.button(360,329,160,31,'PÁGINA '+(page+1)+'/7',()=>{
   this.dexPage=(page+1)%7;this.dexScreen(state);
  });
 }
}
export {Campanha};
