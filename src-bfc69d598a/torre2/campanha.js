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
import {cargarPMD,soloFormas} from '../sprites.js';
import {availableMoves,selectedMoves,resolveLoadout,pokemonStats,isPendingApprovalMove,filterMoveLibrary,canonicalMoveKey,campaignMoveSlotReason,suggestedCampaignMoveSlot,upcomingCampaignMoves} from './move-pool.js';
import {earlyKantoSlotPlan,nativeKantoEvolutionPlan,EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';
import {readCampaign,createPlayerCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,trainerSpeciesForLevel,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,useStatusCure,teachTM,
 ensureConsciousActive,pendingEeveeEvolution,chooseEeveeEvolution,equipCampaignMove} from './campaign-core.js';
import {MART_ITEMS,GYM_TM_REWARDS,martItemUnlocked} from './route-data.js';
import {installWildCapture} from './capture-arena.js';
import {createPartyMatch,applyPartyBattleResult,installPartyBattle} from './party-battle.js';
import {prepareTrainingMatch,installTrainingDummy} from './training.js';
import {drawTrainer,drawShopItem,shopItemSprite,FRLG_MART_ITEM_FILES} from './campaign-sprites.js';
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
import {originalBallSprite} from './ball-sprites.js';
import {routeNode} from './route-data.js';
import {kantoDexPageModel,pcPageModel,pcMemberLabel,PC_FILTERS} from './collection-ui.js';
import {versusOpponentProfile,playVersusIntro} from './versus-intro.js';

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
// The Kanto Pokédex is in National Dex order. Use its number for every
// grass entry instead of the native roster fallback (which can select Mewtwo).
// Keep identity stable for Nidoran genders and Mr Mime without changing saves.
function grassPortraitDex(id){
 const alias={'nidoran-f':'nidoran♀','nidoran-m':'nidoran♂','mr-mime':'mrmime'};
 const key=alias[id]||String(id||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const index=KANTO_DEX.findIndex(name=>name.toLowerCase().replace(/[^a-z0-9♀♂]+/g,'')===key);
 return index>=0?String(index+1).padStart(4,'0'):null;
}
// The native battle loader downloads full PMD animation sets for the entire
// party. Begin the active pair and two nearby reserves DURING the approved
// 2.5 s VS instead of starting all these requests only after the transition.
// Phaser's shared TextureManager lets the combat loader skip cached sheets.
// Bound to four species to protect mobile WebGL memory and VS smoothness.
export function prewarmVersusBattleSprites(scene,match){
 const p=match?.torre2?.party,manifest=scene?.registry?.get?.('manifiesto');
 if(!match?.torre2?.versus||!p||!manifest||scene.load?.isLoading?.())
  return{queued:0,reason:'not-ready'};
 const selected=[p.friend?.[p.playerIndex],p.foes?.[p.enemyIndex??0],
  p.friend?.find((m,i)=>i!==p.playerIndex&&m.hp>0),
  p.foes?.find((m,i)=>i!==(p.enemyIndex??0)&&m.hp>0)].filter(Boolean);
 const dexList=[...new Set(selected.map(m=>portraitId(m)))];
 const forms=soloFormas(manifest,dexList);
 const queued=cargarPMD(scene,forms);
 const report={queued,species:dexList,startedAt:Date.now(),readyAt:null};
 if(scene.game)scene.game.__torre2BattlePrewarm=report;
 if(queued){
  const loaded=()=>{report.readyAt=Date.now();scene.events?.off('shutdown',cleanup)};
  const cleanup=()=>scene.load?.off('complete',loaded);
  scene.load.once('complete',loaded);
  scene.events?.once('shutdown',cleanup);
  scene.load.start();
 }else report.readyAt=report.startedAt;
 return report;
}
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
 init(input){
  // Phaser may reuse the prior start payload on scene.restart(). A finished
  // defeat is an event, not persistent scene data: never process it twice
  // when the user heals at the Center and returns to the same trainer.
  this.result=input?.finished&&input!==this.__torre2ConsumedFinished?input:null;
 }
 preload(){
  if(!this.textures.exists('torre2-frlg-badges'))this.load.spritesheet('torre2-frlg-badges','assets/ui/frlg/badges.png',{frameWidth:16,frameHeight:16});
  const state=readCampaign();
  // Nine tiny original GBA item icons shared by every Mart page.
  // Load once into Phaser's image cache, never over the network during shopping.
  for(const file of FRLG_MART_ITEM_FILES){
   const key='torre2-frlg-mart-'+file;
   if(!this.textures.exists(key))
    this.load.image(key,'assets/ui/frlg/items/'+file+'.png');
  }
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
  // Only this region's twelve unique wild entries; reuse existing small PMD
  // portraits, not twelve full animation sheets (mobile GPU memory).
  for(const id of [...new Set(wildAvailability(stage).wild)].slice(0,12)){
   const dex=grassPortraitDex(id);
   if(dex)toLoad.add(dex);
  }
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
  // Finished battles are single-use events. A loss preserves the same
  // stage/trainer, so replaying the old result on Phaser scene.restart()
  // otherwise reapplies a defeat AFTER the player heals at the Center.
  const completed=this.result;
  this.result=null;
  if(completed)this.__torre2ConsumedFinished=completed;
  if(completed&&state&&!completed.marker?.training&&!completed.marker?.laboratory){
   const marker=completed.marker||{};
   const before=JSON.parse(JSON.stringify(state));
   let outcome=null,kind='trainer';
   try{
    // Battle HP/status and rewards share ONE durable checkpoint. Do not
    // mutate the map's live state or save the result a second time.
    const next=JSON.parse(JSON.stringify(state));
    if(marker.kind==='rematch'){
     if(validRematchResult(next,marker.ticket)){
      applyPartyBattleResult(next,marker.party);
      outcome=resolveRematch(next,marker.ticket,!!completed.won);
      kind='rematch';
     }
    }else if(marker.stage===next.stage&&marker.trainer===next.trainer){
     applyPartyBattleResult(next,marker.party);
     const wild=marker.kind==='wild'&&next.pendingWild?.id===marker.id;
     outcome=wild?resolveWildBattle(next,!!completed.won):
      resolveBattle(next,!!completed.won);
     kind=wild?'wild':'trainer';
    }else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';
    if(outcome&&outcome.ok!==false)state=next;
   }catch(error){
    console.warn('Torre 2: battle result could not be saved',error);
    this.backdrop();
    text(this,320,126,'RESULTADO NÃO SALVO',{fontSize:'19px',color:'#ff9d9d'}).setOrigin(.5);
    text(this,320,167,'O armazenamento recusou o checkpoint da batalha.',{
     fontSize:'11px',color:C.white}).setOrigin(.5);
    text(this,320,191,'Nenhum XP, dinheiro ou insígnia foi confirmado.',{
     fontSize:'11px',color:C.muted}).setOrigin(.5);
    this.button(320,249,266,40,'TENTAR SALVAR NOVAMENTE',()=>{
     // New event object: Phaser ignores the already-consumed result on
     // ordinary scene.restart(), but this explicit retry must be accepted.
     this.scene.restart({...completed});
    },true).setData('torre2-battle-save-retry',true);
    return;
   }
   // A report rendering failure is not a failed save: never offer a retry
   // that could award the same battle twice after the checkpoint committed.
   if(outcome&&outcome.ok!==false){
    try{
     battleReport=makeBattleReport(before,state,outcome,{
      kind,listMoves:availableMoves,
      tmNames:Object.fromEntries(MART_ITEMS.map(item=>[item.id,item.name]))
     });
    }catch(error){console.warn('Torre 2: battle report unavailable',error);}
   }
  }
  if(!state)return this.starterSelection();
  this.renderCampaign(state,{deferEeveeChoice:!!battleReport});
  if(battleReport){
   const panel=showBattleReport(this,battleReport);
   // Offer choices only AFTER the battle report has been acknowledged.
   // The save remains pending on reload if the player leaves meanwhile.
   panel.button.on('pointerdown',()=>{
    if(this.scene.isActive())this.promptPendingEeveeEvolution(readCampaign());
   });
  }
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
  // A blocked first write must not crash Phaser or leave a phantom journey.
  // Keep the three native choices available for retry when storage returns.
  const saveError=text(this,ANCHO/2,326,'NÃO FOI POSSÍVEL SALVAR · TENTE NOVAMENTE',{
   fontSize:'11px',color:'#ff9d9d'
  }).setOrigin(.5).setVisible(false).setData('torre2-starter-save-error',true);
  STARTERS.forEach((id,i)=>{
   const x=135+i*185;
   this.button(x,180,166,58,id.toUpperCase(),()=>{
    try{
     saveCampaign(createPlayerCampaign(id));
    }catch(error){
     console.warn('Torre 2: starter selection could not be saved',error);
     saveError.setVisible(true);
     return;
    }
    this.scene.restart();
   },true).setData('torre2-starter-select',id);
  });
  text(this,ANCHO/2,270,'Movimentação e golpes: combate original Phaser · progressão: Torre 1',statusStyle).setOrigin(.5);
  text(this,ANCHO/2,294,'Sua aventura começa somente com o inicial escolhido · Mewtwo fica no laboratório.',statusStyle).setOrigin(.5);
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
 renderCampaign(state,{deferEeveeChoice=false}={}){
  this.__torre2EeveeChoice=null;
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
   rematchAtlas:()=>this.rematchAtlasScreen(state),
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
  if(!deferEeveeChoice)this.promptPendingEeveeEvolution(state);
  return path;
 }
 // This is a campaign-only choice, NOT the instant EVO command in Arena.
 // A stored Eevee reaches Lv30 during battle; the three Kanto forms are
 // offered only once the battle ends. No random auto-choice or XP shortcut.
 promptPendingEeveeEvolution(state){
  const pending=pendingEeveeEvolution(state);
  if(!pending||this.__torre2EeveeChoice?.active)return false;
  const layer=480;
  const backdrop=this.add.graphics().setDepth(layer);
  backdrop.fillStyle(0x06101f,.94);backdrop.fillRect(0,0,640,360);
  backdrop.fillStyle(0x112b40,.99);backdrop.fillRoundedRect(56,69,528,231,8);
  backdrop.lineStyle(3,0xf4cd71,1);backdrop.strokeRoundedRect(56,69,528,231,8);
  this.__torre2EeveeChoice=backdrop;
  this.add.zone(320,180,640,360).setDepth(layer+1).setInteractive()
   .setData('torre2-eevee-blocker',true);
  const title=(x,y,content,size,color)=>{
   return text(this,x,y,content,{fontFamily:'Pixelify Sans,monospace',
    fontSize:size+'px',fontStyle:'bold',color,
    stroke:'#040e18',strokeThickness:2}).setOrigin(.5).setDepth(layer+5);
  };
  title(320,101,'EEVEE PRONTO PARA EVOLUIR!',21,'#ffe3a0');
  title(320,136,'NÍVEL '+pending.level+'  ·  ESCOLHA A FORMA DE KANTO',12,'#e4f3fb');
  title(320,158,'A escolha é permanente e ficará salva.',10,'#c7d6e2');
  const variants=[
   ['vaporeon','ÁGUA',0x4a91cf],
   ['jolteon','ELÉTRICO',0xe2ba4d],
   ['flareon','FOGO',0xc96750]
  ];
  let saveWarning;
  variants.forEach(([id,type,color],i)=>{
   const x=149+i*171,y=226,w=158,h=68;
   const g=this.add.graphics().setDepth(layer+3);
   g.fillStyle(0x142e44,1);g.fillRoundedRect(x-w/2,y-h/2,w,h,5);
   g.fillStyle(color,.96);g.fillRect(x-w/2+4,y-h/2+4,w-8,5);
   g.lineStyle(2,color,1);g.strokeRoundedRect(x-w/2,y-h/2,w,h,5);
   title(x,y-5,id.toUpperCase(),12,'#fff9e9');
   title(x,y+17,type,10,'#deebf5');
   this.add.zone(x,y,w,h).setDepth(layer+8)
    .setInteractive({useHandCursor:true})
    .setData('torre2-eevee-choice',id)
    .on('pointerdown',(_p,_x,_y,event)=>{
     event?.stopPropagation?.();
     try{
      const current=readCampaign();
      // A stale/malformed save must never be evolved by a frozen UI object.
      if(!current)return this.scene.restart();
      const outcome=chooseEeveeEvolution(current,pending.uid,id);
      if(!outcome.ok)return this.scene.restart();
      this.scene.restart();
     }catch{
      // Keep all three choices clickable so the player can retry the save.
      saveWarning?.setText('NÃO FOI POSSÍVEL SALVAR · TENTE NOVAMENTE');
     }
    });
  });
  title(320,284,'EVOLUÇÃO POR NÍVEL · APÓS A BATALHA',9,'#b6cedf');
  saveWarning=title(320,309,'',10,'#ff9898')
   .setData('torre2-eevee-save-error',true);
  return true;
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
  const resetError=addLabel(320,265,'',10,'#ffad9f').setVisible(false);
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
    if(!confirm)close(); // Cancel closes only the dialog; save stays intact.
    if(!confirm)return;
    try{resetCampaign();}
    catch(error){
     // Never leave a broken confirmation flow or hide a denied deletion.
     // The primary journey still exists; after core rollback, its backup
     // also survives unless the browser denies BOTH write and restore.
     console.warn('Torre 2: reset denied by browser storage',error);
     resetError.setText('NÃO FOI POSSÍVEL REINICIAR · SAVE PRESERVADO')
      .setVisible(true);
     return; // Keep the confirm/cancel controls alive for a safe retry.
    }
    close();
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
 // VS Seeker on every previously cleared Kanto map without changing progress.
 rematchAtlasScreen(state,mapStage=Math.min(state.stage,8),page=0){
  const eligible=Array.from({length:9},(_,stage)=>({
   stage,name:STAGES[stage]?.city||'KANTO',
   trainers:Array.from({length:TRAINERS_PER_GYM(stage)},(_,i)=>
    rematchOpponent(state,i,stage)?i:null).filter(i=>i!==null)
  })).filter(m=>m.trainers.length);
  if(!eligible.some(m=>m.stage===mapStage))mapStage=eligible.at(-1)?.stage??0;
  const current=eligible.find(m=>m.stage===mapStage),trainers=current?.trainers||[];
  const maxPage=Math.max(0,Math.ceil(trainers.length/6)-1);
  page=Math.max(0,Math.min(maxPage,page));
  this.children.removeAll(true);this.backdrop();
  text(this,320,23,'VS SEEKER · REVANCHES DE KANTO',{
   ...titleStyle,fontSize:'18px'}).setOrigin(.5);
  text(this,320,47,'MAPAS CONCLUÍDOS · CARGA '+(state.rematches?.charge||0)+'/3 · SEM NOVAS INSÍGNIAS',{
   fontSize:'10px',color:C.muted}).setOrigin(.5);
  eligible.forEach((entry,i)=>{
   const x=112+(i%3)*207,y=81+Math.floor(i/3)*29;
   this.button(x,y,194,25,entry.name.toUpperCase().slice(0,19),()=>
    this.rematchAtlasScreen(state,entry.stage,0),true)
    .setData('torre2-rematch-map',entry.stage);
  });
  text(this,320,168,(current?.name||'KANTO').toUpperCase()+
   ' · TREINADORES '+trainers.length+' · PÁGINA '+(page+1)+'/'+(maxPage+1),{
    fontSize:'11px',color:C.gold}).setOrigin(.5);
  trainers.slice(page*6,page*6+6).forEach((index,i)=>{
   const x=165+(i%2)*315,y=203+Math.floor(i/2)*31;
   const foe=rematchOpponent(state,index,mapStage);
   this.button(x,y,295,27,'#'+(index+1)+' · '+foe.name.toUpperCase()+' Nv.'+foe.level,
    ()=>this.rematchScreen(state,index,mapStage),true)
    .setData('torre2-rematch-trainer',mapStage+':'+index);
  });
  if(page>0)this.button(70,320,100,29,'◀ ANTERIOR',()=>
   this.rematchAtlasScreen(state,mapStage,page-1));
  if(page<maxPage)this.button(570,320,105,29,'PRÓXIMA ▶',()=>
   this.rematchAtlasScreen(state,mapStage,page+1));
  this.button(320,320,170,30,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
  this.__torre2RematchAtlas={mapStage,page,count:trainers.length,maps:eligible.map(m=>m.stage)};
 }
 rematchScreen(state,index,mapStage=state.stage){
  const foe=rematchOpponent(state,index,mapStage);if(!foe)return;
  this.children.removeAll(true);this.backdrop();
  text(this,320,60,'REVANCHE · '+foe.name.toUpperCase(),titleStyle).setOrigin(.5);
  text(this,320,110,'MAPA '+(STAGES[mapStage]?.city||'KANTO').toUpperCase()+
   ' · EQUIPE Nv.'+foe.level+' · VS '+(state.rematches?.charge||0)+'/3',textStyle).setOrigin(.5);
  text(this,320,151,'Recarrega ao vencer 3 outras batalhas.',statusStyle).setOrigin(.5);
  text(this,320,178,'Não concede insígnias, TMs ou progresso da história.',statusStyle).setOrigin(.5);
  // One durable ticket per fight: an interrupted rematch may be resumed
  // explicitly after reload without buying a second VS Seeker charge.
  // Keep the existing REVANCHE button's denial for insufficient charge.
  const launchReserved=result=>{
   // Temporary opponent uses the selected map; story stage and trainer stay fixed.
   const party=createPartyMatch({...state,stage:mapStage,trainer:index},
    currentOpponent({...state,stage:mapStage,trainer:index,champion:false}),false);
   const boost=Math.min(10,(state.badges?.length||0)*2);
   party.foes.forEach((member,i)=>{
    member.level=i===0?foe.level:
     Math.min(currentLevelCap(state.stage),member.level+boost);
    member.id=trainerSpeciesForLevel(member.id,member.level);
    member.loadout=resolveLoadout({id:member.id,progression:{species:member.id,level:member.level}});
   });
   const p=party.friend[party.playerIndex],e=party.foes[0];
   const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
   this.launchBattle({p1:p.id,p2:e.id,modo:'cpu',nivel:'normal',arena:result.opponent.arena,mandos:[touch?'tactil':'kbm','cpu'],torre2:{stage:state.stage,trainer:state.trainer,kind:'rematch',ticket:result.ticket,party,
   versus:versusOpponentProfile({stage:mapStage,trainer:index,
    kind:routeNode(mapStage,index,TRAINERS_PER_GYM(mapStage)).type,
    name:foe.name,city:STAGES[mapStage]?.city,rematch:true}),
   playerLevel:p.level,enemyLevel:e.level,hardCap:currentLevelCap(state.stage)},torre2Loadout:p.loadout,torre2OpponentLoadout:e.loadout},false);
  };
  this.button(320,235,240,40,'REVANCHE',()=>{
   const result=startRematch(state,index,mapStage);
   if(!result.ok){
    text(this,320,265,result.reason,{fontSize:'10px',color:C.gold}).setOrigin(.5);
    return;
   }
   launchReserved(result);
  },true);
  const pending=state.rematches?.pending;
  if(pending?.stage===mapStage&&pending?.trainer===index&&
     validRematchResult(state,pending)){
   this.button(320,286,240,28,'RETOMAR REVANCHE',()=>launchReserved({
    ok:true,opponent:foe,ticket:{...pending}
   }),true).setData('torre2-rematch-resume',true);
  }
  this.button(320,320,230,32,'◀ REVANCHES',()=>this.rematchAtlasScreen(state,mapStage));
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
  // Auto-select a conscious reserve only after the checkpoint is durable.
  let conscious=false;
  try{conscious=ensureConsciousActive(state);}
  catch(error){
   console.warn('Torre 2: automatic party selection not saved',error);
   text(this,320,334,'TROCA NÃO SALVA · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE',{
    fontSize:'11px',color:'#ff9d9d'
   }).setOrigin(.5).setDepth(1000).setData('torre2-auto-active-save-error',true);
   return;
  }
  if(!conscious){
   state.lastMessage='Sua equipe desmaiou. Recupere-a no Centro Pokémon.';
   saveCampaign(state);
   this.centerScreen(state);
   return;
  }
  // Captures offered after victories are optional. The old guard silently
  // restarted the map forever from Trainer 2 onward.
  if(!wild&&state.pendingCapture){
   const message='Captura opcional dispensada; próximo treinador liberado.';
   try{saveCampaign({...state,pendingCapture:null,lastMessage:message});}
   catch(error){
    console.warn('Torre 2: optional capture dismissal not saved',error);
    text(this,320,312,'PROGRESSO NÃO SALVO · TENTE NOVAMENTE',{
     fontSize:'11px',color:'#ff9d9d'
    }).setOrigin(.5).setDepth(1000).setData('torre2-battle-save-error',true);
    return;
   }
   state.pendingCapture=null;
   state.lastMessage=message;
  }
  let match;
  try{match=wild?startWildBattle(state):startBattle(state);}
  catch(error){
   console.warn('Torre 2: battle checkpoint not saved',error);
   text(this,320,312,'BATALHA NÃO SALVA · TENTE NOVAMENTE',{
    fontSize:'11px',color:'#ff9d9d'
   }).setOrigin(.5).setDepth(1000).setData('torre2-battle-save-error',true);
   return;
  }
  const foe={id:match.p2,level:match.torre2.enemyLevel,
   leader:!wild&&state.trainer>=TRAINERS_PER_GYM(state.stage)};
  const party=createPartyMatch(state,foe,wild);
  match.torre2.party=party;
  if(!wild){
   const opponent=currentOpponent(state);
   if(opponent)match.torre2.versus=versusOpponentProfile({
    stage:state.stage,trainer:state.trainer,kind:opponent.kind,
    leader:opponent.leader,name:opponent.name,city:opponent.city
   });
  }
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
  const game=this.game;let frames=0,combatEntered=false;
  // The previous fight may return to the hub before 60 frames have passed.
  // Never let its stale installer grab the NEXT match (including training).
  if(game.__torre2BattleAttach)
   game.events.off('step',game.__torre2BattleAttach);
  const attach=()=>{
   const battle=game.scene.getScene('combate');
   // The 1.48s VS runs while campanha is still active. The old 60-frame
   // exit guard must not retire this installer BEFORE combat even starts.
   if(battle.scene.isActive())combatEntered=true;
   if(battle.scene.isActive()&&battle.luchadores?.length===2&&
      !battle.__torre2PartyInstalled){
    installPartyBattle(battle);
    if(match.torre2.laboratory)installLaboratoryControls(battle);
    else if(match.torre2.training)installTrainingDummy(battle);
    else if(wild)installWildCapture(battle);
    // Phaser restarts the SAME battle scene to send out the next Pokémon.
    // Keep this ONE listener while battling so every replacement gets a HUD.
   }
   if((combatEntered&&game.scene.isActive('campanha')&&frames>60)||++frames>18000){
    game.events.off('step',attach);
    if(game.__torre2BattleAttach===attach)game.__torre2BattleAttach=null;
   }
  };
  game.__torre2BattleAttach=attach;
  game.events.on('step',attach);
  // Introduce real trainers, rivals, leaders, Elite and VS Seeker battles.
  // Keep wild encounters/training instantaneous, and do not touch the match
  // payload or the combat-side scene restart on a new Pokémon.
  // The VS timer already runs outside pointerdown. Transition directly
  // at its end; queuing a nested zero-delay Phaser event can be lost on
  // re-entrant rematch/party flows. Only the NO-VS fallback needs deferral.
  const enterCombat=()=>{
   if(this.scene.isActive())this.scene.start('combate',match);
  };
  try{
   if(playVersusIntro(this,match,enterCombat)){
    // Prefetch sprites only while the cinematic is already running; do not
    // extend/shorten VS, alter battle logic, or preload outside Kanto.
    try{prewarmVersusBattleSprites(this,match)}
    catch(error){console.warn('Torre 2: VS sprite prewarm skipped',error)}
    return;
   }
  }catch(error){
   console.warn('Torre 2: versus intro skipped safely',error);
  }
  // Defer only when no VS was rendered, to protect the original tap.
  this.time.delayedCall(0,enterCombat);
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
  // Green means genuinely caught (Pokédex), never merely available in grass.
  const caught=new Set(state.dexCaught||[]);
  [...new Set(area.wild)].slice(0,12).forEach((id,i)=>{
   const x=111+(i%4)*142,y=148+Math.floor(i/4)*29;
   const owned=caught.has(id);
   const available=area.available.includes(id);
   this.add.rectangle(x+wideOffset,y,132,25,owned?0x24553f:0x223345)
    .setStrokeStyle(1,owned?0x7dd597:0x5d91b4).setDepth(617);
   const dex=grassPortraitDex(id),key=dex&&'torre2-portrait-'+dex;
   if(key&&this.textures.exists(key)){
    // Original PMD pixel portrait, with no silhouette substitution or VFX.
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(x-49+wideOffset,y,key).setDisplaySize(22,22)
     .setDepth(619).setData('torre2-grass-sprite',id);
   }
   msg(x+11,y,id.toUpperCase()+(available?'':' · FUTURO'),{
    fontSize:available?'9px':'8px',
    color:owned?'#d7ffda':available?'#f5f3e8':'#8ca9bb'})
    .setData('torre2-grass-name',id);
  });
  msg(320,248,'ENCONTROS REALIZADOS: '+(state.wildEncountersStage||0)+' · SEM LIMITE',
   {fontSize:'11px',color:C.gold});
  modalButton(174,292,224,31,'◀ VOLTAR AO MAPA',close);
  modalButton(465,292,224,31,'PROCURAR POKÉMON',()=>{
   let found;
   try{found=startWildEncounter(state);}
   catch(error){
    console.warn('Torre 2: wild encounter not saved',error);
    const notice=text(this,320,266,'ENCONTRO NÃO SALVO · TENTE NOVAMENTE',{
     fontSize:'11px',color:'#ff9d9d'
    }).setOrigin(.5).setDepth(620).setData('torre2-wild-save-error',true);
    this.time.delayedCall(2300,()=>notice.active&&notice.destroy());
    return;
   }
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
    // Use the same approved nearest-filtered 16x16 Pokéball texture as
    // captures and the party HUD. Keep the original healing glow/pulse.
    const icon=originalBallSprite(this,x,160,'pokeball',32,610)
     .setData('torre2-center-heal-ball',i);
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
    try{healTeam(state);}
    catch(error){
     // Storage can be unavailable after the healing animation starts.
     // The saved and live party are still unchanged: show a visible error
     // and unlock the native Center controls for a new attempt.
     console.warn('Torre 2: Center healing not saved',error);
     status.setText('CURA NÃO SALVA · ARMAZENAMENTO BLOQUEADO')
      .setColor('#ff9d9d').setData('torre2-center-save-error',true);
     this.time.delayedCall(1400,()=>{
      if(this.scene.isActive())this.centerScreen(state);
     });
     return;
    }
    status.setText('EQUIPE RECUPERADA · HP, STATUS E DESMAIOS CURADOS')
     .setColor('#a9f6d3');
    this.add.zone(320,270,250,25).setDepth(615)
     .setData('torre2-center-heal-done',true);
    this.time.delayedCall(450,()=>{
     if(this.scene.isActive()&&this.__torre2CenterBusy)this.scene.restart({});
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
 martScreen(state,page=0,errorText=''){
  this.children.removeAll(true);this.backdrop();
  text(this,320,23,'POKÉ MART · $'+state.money,{
   ...titleStyle,fontSize:'19px'}).setOrigin(.5);
  const items=MART_ITEMS.filter(i=>martItemUnlocked(state,i));
  const count=Math.max(1,Math.ceil(items.length/6));
  const pageNum=Math.min(count-1,Math.max(0,page));
  items.slice(pageNum*6,(pageNum+1)*6).forEach((item,i)=>{
   const x=168+(i%2)*301,y=95+Math.floor(i/2)*66;
   this.card(x-141,y-20,283,57,state.money>=item.price?0x568fbb:0x6b5669);
   const art=this.add.image(x-118,y+6,shopItemSprite(this,item));
   // Original FRLG indexed icon at its native pixel resolution (no serrated
   // fractional upscaling), with GBA palette-zero transparency preserved.
   const w=art.frame?.width||24,h=art.frame?.height||24;
   art.setDisplaySize(Math.min(28,w),Math.min(28,h)).setDepth(5)
    .setData('torre2-mart-item-sprite',item.id);
   text(this,x-98,y-9,item.name,{fontSize:'11px',color:C.white});
   text(this,x-98,y+9,'$'+item.price+(item.kind==='tm'?' · TM':' · '+item.kind.toUpperCase()),{
    fontSize:'10px',color:C.muted});
   this.button(x+100,y+6,70,30,'COMPRAR',()=>{
    try{
     purchaseItem(state,item.id);
     this.martScreen(state,pageNum);
    }catch(error){
     // A storage-denied purchase is NOT completed. Keep the previous
     // wallet and items, show an actionable message and allow retry.
     console.warn('Torre 2: Mart purchase not saved',error);
     this.martScreen(state,pageNum,
      'COMPRA NÃO SALVA · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
    }
   },state.money>=item.price).setData('torre2-mart-buy',item.id);
  });
  this.button(140,315,177,33,'◀ MAPA',()=>this.scene.restart());
  this.button(346,315,205,33,'ITENS '+(pageNum+1)+'/'+count,()=>this.martScreen(state,(pageNum+1)%count),true);
  this.button(543,315,176,33,'BOLSA / TM',()=>this.bagScreen(state)).setData('torre2-mart-bag',true);
  const notice=text(this,320,281,errorText||state.lastMessage||'Compre Pokébolas, poções e TM',{
   fontSize:'10px',color:errorText?'#ff9d9d':C.gold,
   wordWrap:{width:560}}).setOrigin(.5);
  if(errorText)notice.setData('torre2-mart-save-error',true);
 }
 bagScreen(state,errorText=''){
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
   try{
    const result=usePotion(state,'potion',target);
    if(!result.ok)state.lastMessage=result.reason;
    this.bagScreen(state);
   }catch(error){
    console.warn('Torre 2: Potion not saved',error);
    this.bagScreen(state,'ITEM NÃO SALVO · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
   }
  },true).setData('torre2-bag-use','potion');
  this.button(340,231,170,37,'SUPER +60 HP',()=>{
   try{
    const result=usePotion(state,'superpotion',target);
    if(!result.ok)state.lastMessage=result.reason;
    this.bagScreen(state);
   }catch(error){
    console.warn('Torre 2: Super Potion not saved',error);
    this.bagScreen(state,'ITEM NÃO SALVO · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
   }
  },true).setData('torre2-bag-use','superpotion');
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
    try{
     const result=teachTM(state,id,target);
     if(!result.ok)state.lastMessage=result.reason;
     this.bagScreen(state);
    }catch(error){
     console.warn('Torre 2: TM teaching not saved',error);
     this.bagScreen(state,'TM NÃO SALVA · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
    }
   },compatible).setData('torre2-bag-teach-tm',id);
   drawShopItem(this.add.graphics().setDepth(6),76+i*181,303,item,.65);
  });
  if(errorText||state.lastMessage){
   const notice=text(this,320,324,(errorText||state.lastMessage).slice(0,100),{
    fontSize:'9px',color:errorText?'#ff9d9d':C.gold,
    wordWrap:{width:585}}).setOrigin(.5);
   if(errorText)notice.setData('torre2-bag-save-error',true);
  }
  this.button(320,343,220,23,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 statusMedicineScreen(state,target,errorText=''){
  this.children.removeAll(true);this.backdrop();
  const member=state.team[target];
  text(this,320,25,'REMÉDIOS DE STATUS',{...titleStyle,fontSize:'20px'}).setOrigin(.5);
  const status=statusLabel({est:{[member.status?.kind]:true}})||(member.confusion?'CONFUSÃO':'SEM STATUS');
  text(this,320,59,member.id.toUpperCase()+' · '+(member.hp<=0?'DESMAIADO':status),{fontSize:'12px',color:C.gold}).setOrigin(.5);
  MART_ITEMS.filter(i=>i.kind==='status').forEach((item,i)=>{
   const x=167+(i%2)*306,y=105+Math.floor(i/2)*65;
   this.button(x,y,275,38,item.name+' ×'+(state.inventory[item.id]||0),()=>{
    try{
     const result=useStatusCure(state,item.id,target);
     if(!result.ok)state.lastMessage=result.reason;
     this.statusMedicineScreen(state,target);
    }catch(error){
     console.warn('Torre 2: Status medicine not saved',error);
     this.statusMedicineScreen(state,target,
      'REMÉDIO NÃO SALVO · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
    }
   }).setData('torre2-status-medicine',item.id);
   text(this,x,y+25,item.cureConfusion?'Cura todos os status e confusão':'Cura '+statusLabel({est:{[item.cures[0]]:true}}),{fontSize:'10px',color:C.muted}).setOrigin(.5);
  });
  const notice=text(this,320,285,errorText||state.lastMessage||
   'Selecione o remédio para este Pokémon.',{
   fontSize:'10px',color:errorText?'#ff9d9d':C.gold,wordWrap:{width:570}}).setOrigin(.5);
  if(errorText)notice.setData('torre2-status-save-error',true);
  this.button(175,330,260,32,'◀ VOLTAR À BOLSA',()=>this.bagScreen(state)).setData('torre2-status-medicine-back',true);
  this.button(465,330,260,32,'POKÉ MART',()=>this.martScreen(state));
 }
 showSummary(state,index,slot=0,page=0){
  // Game-native Phaser UI: clear hierarchy, 4 visible attack slots, large
  // touch targets, instant type filtering and search for Mewtwo's large pool.
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  // Exclusive mobile screen: prevent touches on Back and attack rows from
  // passing to other scene hotspots (notably original fullscreen behind it).
  this.scene.bringToTop();
  // The original title's fullscreen hotspot can receive a second mobile
  // pointer beneath this screen; keep it stopped while managing the party.
  // Phaser may queue a title launch until after this callback; enqueue the
  // corresponding stop unconditionally so the fullscreen hotzone cannot
  // reactivate behind the summary on the next mobile pointer event.
  this.scene.stop('titulo');
  this.input.setTopOnly(true);
  this.add.zone(320,180,640,360).setDepth(2).setInteractive()
   .setData('torre2-summary-input-shield',true)
   .on('pointerdown',(_pointer,_x,_y,event)=>event?.stopPropagation?.());
  const member=state.team[index];
  if(!member)return this.scene.restart();
  const stats=pokemonStats(member),pool=availableMoves(member);
  // Campaign preload also loads this PMD portrait; keep the summary image visible.
  const chosen=selectedMoves(member),activeSlot=Math.min(3,Math.max(0,slot));
  const slotReason=move=>campaignMoveSlotReason(member,activeSlot,move);
  const battleKit=resolveLoadout(member);
  // Highlight exactly the moves the battle controller will execute.
  const equippedIds=['lmb','rmb','q','e'].map(key=>battleKit[key]?.id||null);
  const introStage=member.id!=='mewtwo'&&Object.values(battleKit).some(move=>move?.torre2IntroPractice);
  const earlyPlan=earlyKantoSlotPlan(member.id)||nativeKantoEvolutionPlan(member.id);
  this.summaryFilter??='ALL';this.summarySearch??='';this.summaryView??='moves';
  const showFuture=this.summaryView==='future';
  const slotCodes=['LMB','RMB','Q','E'];
  const slotNames=['ATK','HAB 2','HAB 3','ULT'];
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
   fontSize:size+'px',color}).setDepth(16);
  const button=(x,y,w,h,caption,click,selected=false)=>{
   const bg=box(x,y,w,h,selected?0x28465f:0x1b314a,selected?0xe7c56a:0x52718f);
   bg.setDepth(12).setInteractive({useHandCursor:true});
   bg.on('pointerover',()=>bg.setFillStyle(selected?0x385b79:0x2d506f));
   bg.on('pointerout',()=>bg.setFillStyle(selected?0x28465f:0x1b314a));
   bg.on('pointerdown',(_pointer,_x,_y,event)=>{
    event?.stopPropagation?.();click();
   });
   const name=label(x+w/2,y+h/2,caption,selected?'#ffe09a':'#e1eeff',11);
   name.setOrigin(.5);
   return bg;
  };
  // Distinct header and unified back navigation.
  box(10,8,620,36,0x10243d,0x456b91);
  label(23,15,'POKÉMON / SUMÁRIO',C.gold,16);
  // Avoid the legacy fullscreen hitbox around x=624.
  button(494,13,108,27,'◀ EQUIPE',()=>{
   this.summaryFilter='ALL';this.summarySearch='';this.summaryWarning=null;
   this.summaryView='moves';
   // No scene.restart: retain browser fullscreen and native Phaser canvas.
   this.renderCampaign(state);
  }).setData('torre2-summary-back',true);
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
   this.add.image(66,143,key).setDisplaySize(74,74).setDepth(3);
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
  // Distinguish a real Shiny individual in the native summary without
  // recoloring the approved PMD portrait or inventing a Shiny sprite.
  if(member.shiny===true)
   label(119,168,'✦ SHINY',C.gold,11).setData('torre2-shiny-summary-label',true);
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
   try{
    if(!selectTeamMember(state,index))return;
   }catch(error){
    console.warn('Torre 2: party selection not saved',error);
    this.summaryWarning='TROCA NÃO SALVA · ARMAZENAMENTO BLOQUEADO';
    this.showSummary(state,index,slot,page);
    return;
   }
   this.summaryFilter='ALL';this.summarySearch='';this.summaryView='moves';this.renderCampaign(state);
  },index===state.active).setData('torre2-active-select',true);
  // Right: four prominent touch-friendly equipped slots, 2×2.
  box(218,52,409,296,0x12243a,0x496b86);
  label(231,59,'GOLPES EQUIPADOS',C.gold,14);
  label(231,78,'1. TOQUE NO SLOT   2. ESCOLHA O GOLPE NA LISTA',C.muted,9);
  slotCodes.forEach((_,i)=>{
   const battleSlot=['lmb','rmb','q','e'][i];
   const move=battleKit[battleSlot]||null;
   const x=229+(i%2)*194,y=93+Math.floor(i/2)*43;
   const current=activeSlot===i;
   const bg=box(x,y,189,39,current?0x294765:0x172d43,current?0xf0cb6d:0x385772);
   bg.setDepth(12).setInteractive({useHandCursor:true});
   bg.on('pointerdown',(_pointer,_x,_y,event)=>{
    event?.stopPropagation?.();this.showSummary(state,index,i,0);
   });
   bg.on('pointerover',()=>bg.setFillStyle(0x335977));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x294765:0x172d43));
   label(x+8,y+4,slotCodes[i]+' · '+slotNames[i],
     current?'#ffe6a7':'#96b2ce',9);
   const upcoming=earlyPlan?.[i],need=upcoming?EARLY_KANTO_LEARNSETS[member.id]?.[
    upcoming.toLowerCase().replace(/[^a-z0-9]+/g,'-')]:null;
   label(x+8,y+18,move?.nombre??(introStage&&i===3&&stats.level<8?
    'ULT · DESBLOQUEIA NV. 8':upcoming?
    upcoming+' · LV '+(need??'EVO'):'—'),move?C.white:'#f5c578',move?12:10);
   if(move?.torre2IntroPractice)label(x+8,y+31,'INICIAL · POTÊNCIA EQUILIBRADA','#b1cfde',7);
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
  // Power-capped Lv5 adapters use existing VFX but are NOT different
  // species moves. List just one named option per native technique.
  const dedupeByMove=moves=>{
   const byName=new Map();
   for(const move of moves){
    const key=(move.torre2IntroSlot==='e'?'ULT:':'MOVE:')+
     canonicalMoveKey(move.torre2IntroSource||move.nombre);
    const old=byName.get(key);
    const score=m=>
     (equippedIds[activeSlot]===m.id?120:0)+
     (m.torre2IntroPractice?(stats.level<=8?30:1):(stats.level>8?30:0))+
     (m.torre2IntroSlot===slotCodes[activeSlot].toLowerCase()?2:0)+
     (slotReason(m)===null?50:0);
    if(!old||score(move)>score(old))byName.set(key,move);
   }
   return [...byName.values()];
  };
  // Learned moves all remain visible; compatible choices appear first.
  // No hidden ULT in HAB slots or silent equip failure on mobile.
  const displayed=dedupeByMove(filterMoveLibrary(pool,this.summaryFilter,this.summarySearch))
   .sort((a,b)=>Number(!!slotReason(a))-Number(!!slotReason(b))||
    Number(equippedIds[activeSlot]!==a.id)-Number(equippedIds[activeSlot]!==b.id));
  const compatibleCount=displayed.filter(m=>!slotReason(m)).length;
  label(230,195,showFuture?'PRÓXIMOS':'BIBLIOTECA',C.gold,11);
  button(334,187,105,25,showFuture?'◀ EQUIPAR':'POR NÍVEL',()=>{
   this.summaryView=showFuture?'moves':'future';
   this.summaryWarning=null;
   this.showSummary(state,index,activeSlot,0);
  },showFuture).setData('torre2-summary-future-toggle',true);
  if(!showFuture){
   button(445,187,91,25,'TIPO ▾',()=>this.showMoveTypePicker(state,index,activeSlot),false);
   button(541,187,75,25,'BUSCAR',()=>{
    const query=window.prompt('Buscar golpe por nome (vazio para limpar):',this.summarySearch||'');
    if(query===null)return;
    this.summarySearch=query.trim().slice(0,35);
    this.showSummary(state,index,activeSlot,0);
   });
  }else label(465,195,'ATÉ NV. 50',C.muted,9);
  // The upcoming view contains only real future level unlocks for THIS form.
  // TM-only moves remain excluded; an evolution has its own learnset.
  const filtered=showFuture?upcomingCampaignMoves(member):displayed;
  const pageSize=6,pages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const safePage=Math.min(pages-1,Math.max(0,page));
  if(!this.summaryWarning){
   const hint=showFuture?
    'FORMA ATUAL · '+filtered.length+' FUTUROS · TM NÃO AUTOMÁTICA':
    this.summaryFilter!=='ALL'||this.summarySearch?
     'FILTRO '+this.summaryFilter+(this.summarySearch?' · '+this.summarySearch.toUpperCase():''):
     slotNames[activeSlot]+' · '+compatibleCount+'/'+displayed.length+' COMPATÍVEIS';
   label(230,211,hint,'#95ceef',8);
  }
  const rowsY=223;
  if(showFuture){
   filtered.slice(safePage*pageSize,(safePage+1)*pageSize).forEach((move,i)=>{
    const x=230+(i%2)*193,y=rowsY+Math.floor(i/2)*30;
    const bg=box(x,y,188,27,move.ultimatePreview?0x3b3441:0x19364b,
     move.ultimatePreview?0xe3c176:0x436985);
    bg.setDepth(12).setData('torre2-summary-upcoming-move',move.id)
     .setData('torre2-summary-upcoming-level',move.level);
    label(x+6,y+3,(move.ultimatePreview?'E NV ':'NV ')+
     String(move.level).padStart(2,'0')+' · '+move.name.toUpperCase().slice(0,18),
     move.ultimatePreview?'#ffdfa4':'#edf5ff',9);
    label(x+6,y+16,move.ultimatePreview?
     'ULT INICIAL · POTÊNCIA REDUZIDA':String(move.type||'')+' · DESBLOQUEIA POR NÍVEL',
     C.muted,7);
   });
  }else filtered.slice(safePage*pageSize,(safePage+1)*pageSize).forEach((move,i)=>{
   const x=230+(i%2)*193,y=rowsY+Math.floor(i/2)*30;
   const equipped=equippedIds.includes(move.id);
   const current=equippedIds[activeSlot]===move.id;
   const pending=isPendingApprovalMove(move),reason=slotReason(move);
   const bg=box(x,y,188,27,current?0x275749:reason?0x162737:equipped?0x1e434c:0x1a344d,
    current?0x73d8b0:reason?0x53667b:equipped?0x658e96:0x3c6283);
   bg.setDepth(12).setInteractive({useHandCursor:true})
    .setData('torre2-equip-move',move.id)
    .setData('torre2-equip-reason',reason);
   bg.on('pointerdown',(_pointer,_x,_y,event)=>{
    event?.stopPropagation?.();
    if(reason){
     const suggestion=suggestedCampaignMoveSlot(member,activeSlot,move);
     if(suggestion!==null&&suggestion!==activeSlot){
      // A wrong-slot tap is navigation, NEVER an implicit equip. The
      // player must explicitly choose the technique again in the new slot.
      this.summaryWarning=reason.includes('ULT')?
       'GOLPE FORTE: SELECIONE E (ULT)':
       'SLOT CORRETO: '+slotNames[suggestion]+' · TOQUE NO GOLPE NOVAMENTE';
      // Keep the requested move visible after switching the active slot.
      // The compatible rows are sorted ahead of blocked rows, so page zero
      // is not always the page containing the move the player tapped.
      const reordered=dedupeByMove(filterMoveLibrary(pool,this.summaryFilter,this.summarySearch))
       .sort((a,b)=>Number(!!campaignMoveSlotReason(member,suggestion,a))-
        Number(!!campaignMoveSlotReason(member,suggestion,b)));
      const row=reordered.findIndex(option=>option.id===move.id);
      this.showSummary(state,index,suggestion,row<0?0:Math.floor(row/6));
     }else{
      this.summaryWarning='BLOQUEADO: '+reason;
      this.showSummary(state,index,activeSlot,0);
     }
     return;
    }
    let equippedNow=false;
    try{equippedNow=equipCampaignMove(state,index,activeSlot,move.id);}
    catch(error){
     console.warn('Torre 2: summary move equip not saved',error);
     this.summaryWarning='TROCA NÃO SALVA · TENTE NOVAMENTE';
     this.showSummary(state,index,activeSlot,safePage);
     return;
    }
    if(equippedNow){
     this.summaryWarning=null;
     this.showSummary(state,index,activeSlot,0);
     return;
    }
    if(!equippedNow)
     this.summaryWarning=equipped?'ESSE GOLPE JÁ ESTÁ EM OUTRO SLOT.':
      activeSlot===3&&stats.level<13?
       'ULT EQUILIBRADA ATÉ NV.12 · SELECIONE ATK/HAB 2/HAB 3':
       'GOLPE NÃO DISPONÍVEL PARA ESSE SLOT.';
    this.showSummary(state,index,activeSlot,safePage);
   });
   bg.on('pointerover',()=>bg.setFillStyle(0x305c70));
   bg.on('pointerout',()=>bg.setFillStyle(current?0x275749:equipped?0x1e434c:0x1a344d));
   label(x+6,y+3,(current?'✓ ':equipped?'◆ ':reason?'× ':'+ ')+
    (move.torre2IntroSlot==='e'?'ULT · ':'')+move.nombre+
    (move.approved?' ✓':''),
    current?'#bcffe3':reason?'#9caec1':'#ebf5ff',10);
   label(x+6,y+16,reason||move.tipo,reason?'#f4b69a':C.muted,8);
   if(pending)label(x+110,y+16,'NEW','#ffdc89',8);
   label(x+181,y+16,'CD '+move.cd+'s',C.muted,8).setOrigin(1,0);
  });
  if(filtered.length===0)label(242,255,showFuture?
   (stats.level>=50?'TODOS OS NÍVEIS LIBERADOS':'SEM NOVOS GOLPES NESTA FORMA ATÉ NV. 50'):
   this.summaryFilter==='NEW'?'TODOS OS GOLPES APROVADOS ✓':'NENHUM GOLPE ENCONTRADO',C.muted,9);
  button(233,317,68,25,'◀ ANTES',()=>this.showSummary(state,index,activeSlot,(safePage+pages-1)%pages));
  button(306,317,125,25,(safePage+1)+' / '+pages+' PÁGINAS',()=>this.showSummary(state,index,activeSlot,0),true);
  button(437,317,73,25,'PRÓXIMO ▶',()=>this.showSummary(state,index,activeSlot,(safePage+1)%pages));
  button(515,317,101,25,showFuture?'EQUIPAR':'LIMPAR',()=>{
   if(showFuture)this.summaryView='moves';
   else{this.summaryFilter='ALL';this.summarySearch='';}
   this.summaryWarning=null;
   this.showSummary(state,index,activeSlot,0);
  });
  if(this.summaryWarning){
   const warning=label(242,211,this.summaryWarning,
    this.summaryWarning.startsWith('TROCA NÃO SALVA')?'#ff9d9d':'#f6bc86',9);
   if(this.summaryWarning.startsWith('TROCA NÃO SALVA'))
    warning.setData('torre2-active-save-error',true);
  }
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
  // Read-only filtered PC presentation; all transfers address original box
  // indexes, not filtered row indexes. Saves and team order never change here.
  const attemptTransfer=perform=>{
   try{
    const done=perform();
    if(done){this.__torre2PcSaveError=null;this.__torre2PcNotice=null}
    return {done,blocked:false};
   }catch(error){
    console.warn('Torre 2 PC: checkpoint could not be saved',error);
    this.__torre2PcSaveError='SALVAMENTO BLOQUEADO · EQUIPE PRESERVADA · TENTE NOVAMENTE';
    return {done:false,blocked:true};
   }
  };
  this.children.removeAll(true);this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  this.pcFilter=PC_FILTERS.includes(this.pcFilter)?this.pcFilter:'ALL';
  const boxView=pcPageModel(state,page,this.pcFilter);
  const {page:safePage,pages:totalPages}=boxView;
  text(this,20,13,'CENTRO POKÉMON · PC',{...titleStyle,fontSize:'19px'});
  this.button(549,21,155,28,'◀ CAMPANHA',()=>{
   this.pcSelected=null;this.__torre2PcNotice=null;this.scene.restart()
  });
  text(this,22,52,'EQUIPE '+state.team.length+'/6',{color:C.gold,fontSize:'14px'});
  text(this,330,52,'ARMAZENAMENTO '+boxView.total+' · ✦ '+boxView.shiny,{
   color:C.gold,fontSize:'12px'});
  state.team.forEach((member,i)=>{
   const y=79+i*34,selected=this.pcSelected===i;
   this.button(164,y,281,29,pcMemberLabel(member,{
    active:i===state.active,selected
   }),()=>{
    this.pcSelected=i===this.pcSelected?null:i;
    this.__torre2PcNotice=null;this.pcScreen(state,safePage);
   },selected).setData('torre2-pc-team-index',i);
  });
  boxView.rows.forEach(({member,actualIndex},i)=>{
   const y=79+i*34;
   this.button(466,y,277,29,pcMemberLabel(member),()=>{
    const result=attemptTransfer(()=>{
     if(state.team.length<6)return withdrawPokemon(state,actualIndex);
     if(Number.isInteger(this.pcSelected))
      return swapPokemon(state,this.pcSelected,actualIndex);
     return false;
    });
    if(result.done)this.pcSelected=null;
    else if(!result.blocked)
     this.__torre2PcNotice='EQUIPE CHEIA · SELECIONE UM POKÉMON À ESQUERDA';
    this.pcScreen(state,Math.min(safePage,Math.max(0,
     Math.ceil(boxView.matched/6)-1)));
   }).setData('torre2-pc-box-index',actualIndex);
  });
  if(!boxView.rows.length)text(this,344,103,boxView.total?
   'NENHUM POKÉMON NESTE FILTRO':'PC VAZIO · CAPTURE POKÉMON',statusStyle);
  // Four one-tap filters on the native Phaser screen; never alter box order.
  for(const [i,filter] of PC_FILTERS.entries()){
   const buttonLabel={ALL:'TODOS',SHINY:'✦ SHINY',KO:'KO',STATUS:'STATUS'}[filter];
   this.button(363+i*69,282,65,26,buttonLabel,()=>{
    this.pcFilter=filter;this.__torre2PcNotice=null;this.pcScreen(state,0);
   },boxView.filter===filter,9).setData('torre2-pc-filter',filter);
  }
  this.button(121,310,195,29,'GUARDAR SELECIONADO',()=>{
   const result=attemptTransfer(()=>storePokemon(state,this.pcSelected));
   if(!result.done&&!result.blocked)
    this.__torre2PcNotice='SELECIONE UM POKÉMON · MANTENHA UM NA EQUIPE';
   if(result.done)this.pcSelected=null;
   this.pcScreen(state,safePage);
  }).setData('torre2-pc-store',true);
  this.button(337,310,111,29,'◀ ANTERIOR',()=>
   this.pcScreen(state,(safePage-1+totalPages)%totalPages))
   .setData('torre2-pc-prev',true);
  this.button(451,310,104,29,(safePage+1)+' / '+totalPages,()=>
   this.pcScreen(state,0)).setData('torre2-pc-page',safePage);
  this.button(568,310,119,29,'PRÓXIMA ▶',()=>
   this.pcScreen(state,(safePage+1)%totalPages))
   .setData('torre2-pc-next',true);
  const notice=this.__torre2PcSaveError||this.__torre2PcNotice||
   (boxView.filter==='ALL'?
    'EQUIPE CHEIA? SELECIONE À ESQUERDA E TROQUE PELO PC.':
    boxView.matched+' DE '+boxView.total+' NO FILTRO '+boxView.filter);
  text(this,20,345,notice,{
   fontSize:'10px',color:this.__torre2PcSaveError?'#ff9aa8':
    this.__torre2PcNotice?'#ffdb94':C.muted});
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  const supported=ROSTER.flatMap(p=>[p.id,
   ...(p.evoluciones||[]).map(x=>x.nombre)]);
  const view=kantoDexPageModel(state,KANTO_DEX,supported,this.dexPage||0);
  this.dexPage=view.page;
  text(this,ANCHO/2,18,'POKÉDEX DE KANTO · '+view.totals.all+' ESPÉCIES',
   {...titleStyle,fontSize:'18px'}).setOrigin(.5,0);
  text(this,ANCHO/2,47,'VISTOS '+view.totals.seen+
   ' · CAPTURADOS '+view.totals.caught+
   ' · Somente espécies integradas entram em batalha.',statusStyle).setOrigin(.5);
  if(view.totals.shinySeen)
   text(this,ANCHO/2,61,'✦ SHINY AVISTADOS '+view.totals.shinySeen+
    ' · CAPTURADOS '+view.totals.shinyCaught,{
    ...statusStyle,color:'#f0d789',fontSize:'9px'}).setOrigin(.5);
  view.rows.forEach((row,i)=>{
   const x=35+(i>=11?295:0),y=75+(i%11)*21;
   const marker=row.shinyCaught?' ✦ SHINY':row.shinySeen?' ✦':
    row.caught?' ★':row.seen?' ◦':row.ready?' ✓':'';
   text(this,x,y,String(row.index+1).padStart(3,'0')+'. '+row.name+marker,{
    fontSize:'11px',color:row.shinyCaught?'#f5db86':
     row.caught?C.gold:row.seen?C.blue:C.muted
   }).setData('torre2-dex-id',row.id);
  });
  this.button(82,329,140,31,'◀ VOLTAR',()=>this.scene.restart());
  this.button(236,329,133,31,'◀ ANTERIOR',()=>{
   this.dexPage=(view.page-1+view.pages)%view.pages;this.dexScreen(state);
  }).setData('torre2-dex-prev',true);
  text(this,382,328,'PÁG. '+(view.page+1)+'/'+view.pages,{
   color:C.gold,fontSize:'12px'}).setOrigin(.5,0);
  this.button(543,329,141,31,'PRÓXIMA ▶',()=>{
   this.dexPage=(view.page+1)%view.pages;this.dexScreen(state);
  }).setData('torre2-dex-next',true);
 }

}
export {Campanha};
