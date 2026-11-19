import {premiumSprite} from './premium-art.js';
import {renderCityHub} from './city-hub.js';
import {statusLabel} from './gen3-status.js';
import {rematchOpponent,startRematch,resolveRematch,validRematchResult} from './campaign-core.js';
import {prepareLaboratoryMatch,installLaboratoryControls,KANTO_151_IDS} from './laboratory.js';
import {WEATHER_NAMES} from './weather.js';
/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO,texto as textoMenu,estrechar} from '../config.js';
import {UI as MENU_UI,marco as nativeMarco,aro as nativeAro,rectRedondo as nativeRect,fondoMenu as nativeBackground,pastillaTipo} from '../ui.js';
import {header,backdrop as richBackdrop,buttonFrame,team as richTeam,
 ball,progress,drawBadgeIcon} from './campaign-art.js';
import {ROSTER,buscar,TIPOS} from '../datos.js';
import {sfx} from '../sonido.js';
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
import {trainerClass,drawTrainer,drawShopItem,shopItemSprite,FRLG_MART_ITEM_FILES} from './campaign-sprites.js';
import {campaignRegion} from './kanto-regions.js';
import {currentLevelCap} from './kanto-levels.js';
import {AVAILABLE_FRLG,AVAILABLE_FRLG_NPCS,AVAILABLE_FRLG_FILES,AVAILABLE_OAK_INTRO} from './frlg-available.js';
import {buildingInteractions} from './kanto-hotspots.js';
import {spriteIdForTrainer,addFireRedNPC,playerSpriteId} from './frlg-npc.js';
import {renderInteriorScene,ROOM_CROPS} from './frlg-interiors.js';
import {locationForCampaign} from './frlg-location.js';
import {getCampaignMapSpec} from './campaign-map-unified.js';
import {renderBattlePath,BATTLE_PATH_BACKDROP} from './battle-path.js';
import {renderTrainerCardHub,renderTrainerCardMapTab,pixelIcon,ownerArt,leaderSpriteKind,trainerSpriteKind} from './trainer-cards.js';
import {installCampaignAudioSettings,readAudioSettings} from './audio-settings.js';
import {resetCardPortraitRequests,requestCardPortrait} from './card-portrait-cache.js';
import {makeBattleReport,showBattleReport} from './battle-report.js';
import {hallOfFameModel,HALL_GYM_BADGES as HALL_BADGE_ORDER} from './hall-of-fame.js';
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
  // Native UI kit handed to plain modules (battle report) that must stay
  // importable in Node tests without the base client's ui.js.
  this.__torre2UiKit={UI:MENU_UI,marco:nativeMarco,rectRedondo:nativeRect,texto:textoMenu,buscar};
  // Phaser may reuse the prior start payload on scene.restart(). A finished
  // defeat is an event, not persistent scene data: never process it twice
  // when the user heals at the Center and returns to the same trainer.
  this.result=input?.finished&&input!==this.__torre2ConsumedFinished?input:null;
  this.__torre2OakIntroSeen=false;
  // Restarted Phaser scenes keep the instance, but discard old card layers.
  resetCardPortraitRequests(this);
 }
 preload(){
  if(!this.textures.exists('torre2-frlg-badges'))this.load.spritesheet('torre2-frlg-badges','assets/ui/frlg/badges.png',{frameWidth:16,frameHeight:16});
  // Original Pokémon FireRed bag frames, bundled locally at build time.
  // Center / Shop button icons: FireRed buildings (campaign-art, PROVENANCE.json).
  for(const name of ['icon-center','icon-mart'])
   if(!this.textures.exists('torre2-art-'+name))this.load.image('torre2-art-'+name,'assets/ui/torre2-campaign/'+name+'.png');
  if(!this.textures.exists('torre2-frlg-bag'))
   this.load.spritesheet('torre2-frlg-bag','assets/ui/frlg/items/bag-male.png',{frameWidth:64,frameHeight:64});
  const state=readCampaign();
  // Prefer the full-body FireRed lecture sprite shown in the user's reference.
  // The 16x32 native NPC remains as an offline-safe fallback.
  if(!state){
   for(const name of ['oak','platform']){
    if(AVAILABLE_OAK_INTRO.includes(name)&&
       !this.textures.exists('frlg-oak-intro-'+name))
     this.load.image('frlg-oak-intro-'+name,
      'assets/ui/frlg/intro/'+name+'.png');
   }
  }
  // Nine tiny original GBA item icons shared by every Mart page.
  // Load once into Phaser's image cache, never over the network during shopping.
  for(const file of FRLG_MART_ITEM_FILES){
   const key='torre2-frlg-mart-'+file;
   if(!this.textures.exists(key))
    this.load.image(key,'assets/ui/frlg/items/'+file+'.png');
  }
  // Cards-only campaign: do not upload city/cave/route atlases to WebGL.
  // Genuine trainer sprites remain available below.
  const stage=state?.stage??0;
  const boss=['brock','misty','surge','erika','koga','sabrina',
   'blaine','giovanni','lorelei','bruno','agatha','lance','rival'][stage]||'brock';
  const archetypes=stage===0?
   ['youngster','lass','bugcatcher','hiker']:
   ['youngster','lass','bugcatcher','hiker','ace','rocket'];
  const needed=new Set(['red_normal',playerSpriteId(),...(state?[]:['prof_oak']),spriteIdForTrainer(boss),
   spriteIdForTrainer('rival'),spriteIdForTrainer('rocket'),
   spriteIdForTrainer('ace'),
   ...archetypes.map(spriteIdForTrainer)]);
  // Each trainer's card must render the genuine NPC, not a generic silhouette.
  // A gym has at most 13 regular challengers; the image cost is small.
  for(let i=0;i<TRAINERS_PER_GYM(stage);i++){
   const projection=currentOpponent({...state,stage,trainer:i,champion:false});
   const kind=projection?.kind;
   const archetype=projection?.spriteKind||
    trainerClass(stage,i,kind||'trainer',stage===0?'forest':'route');
   needed.add(spriteIdForTrainer(archetype));
  }
  // Map rendering is retained ONLY for old automated regression suites.
  const qaLegacyMap=new URLSearchParams(location.search).get('qa-legacy-map')==='1';
  if(qaLegacyMap){
   const world=getCampaignMapSpec(stage,0).id;
   const pathWorld=BATTLE_PATH_BACKDROP[stage]||'indigo';
   const routeWorld=stage===6?'seafoam':null;
   const desired=new Set();
   for(const id of [world,pathWorld,routeWorld].filter(Boolean)){
    if(!AVAILABLE_FRLG.includes(id))continue;
    const key='frlg-location-'+id;
    desired.add(key);
    if(!this.textures.exists(key))
     this.load.image(key,AVAILABLE_FRLG_FILES[id]||'assets/ui/frlg/'+id+'.webp');
   }
   for(const key of this.textures.getTextureKeys()){
    if(key.startsWith('frlg-location-')&&!desired.has(key))this.textures.remove(key);
    if(key.startsWith('frlg-npc-')&&!needed.has(key.slice(9)))this.textures.remove(key);
   }
  }else{
   // Normal Kanto: no map textures are allocated or retained on the GPU.
   for(const key of this.textures.getTextureKeys()){
    if(key.startsWith('frlg-location-'))this.textures.remove(key);
    if(key.startsWith('frlg-npc-')&&!needed.has(key.slice(9)))this.textures.remove(key);
   }
  }
  for(const id of needed){
   if(!AVAILABLE_FRLG_NPCS.includes(id))continue;
   const key='frlg-npc-'+id;
   if(!this.textures.exists(key))
    this.load.image(key,'assets/ui/frlg/npc/'+id+'.png');
  }
  const toLoad=new Set(state?.team?.map(p=>portraitId(p))||[]);
  if(!state)for(const dex of ['0001','0004','0007'])toLoad.add(dex);
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
  if(this.__torre2ShowEvolution){
   const list=this.__torre2ShowEvolution;this.__torre2ShowEvolution=null;
   this.evolutionScene(list);
  }
  if(battleReport){
   const panel=showBattleReport(this,battleReport);
   // Offer choices only AFTER the battle report has been acknowledged.
   // The save remains pending on reload if the player leaves meanwhile.
   panel.button.on('pointerdown',()=>{
    if(!this.scene.isActive())return;
    // Evolutions from this battle get their own cutscene, then Eevee's choice.
    this.evolutionScene(battleReport.evolutions,()=>{
     if(this.scene.isActive())this.promptPendingEeveeEvolution(readCampaign());
    });
   });
  }
 }
 // Design Taste adapted to the existing FRLG pixel-art language:
 // consistent visual hierarchy and tactile feedback on CAMPAIGN buttons only.
 // The trainer-card hub, Arena HUD, move keys and native combat UI are untouched.
 button(x,y,w,h,label,callback,emphasis=false,tam=null,variant=null,captionInset=0){
  const g=this.add.graphics().setDepth(3);
  const size=tam??(w>=202?12:w>=145?10:w>=92?9:8);
  // Keep the native caption sizing, icon gutter and exact click geometry.
  const caption=estrechar(textoMenu(this,x,y,label,{
   tam:size,borde:3,colorBorde:MENU_UI.bordeTexto
  }).setOrigin(.5).setDepth(5),w-14-captionInset)
   .setData('torre2-button-caption',label);
  if(captionInset)caption.setX(x+captionInset/2);
  const tone=variant||(emphasis?'gold':'blue');
  const isBack=/^[◀←]/.test(label);
  let hovered=false,pressed=false;
  const paint=()=>{
   g.clear();
   const left=Math.round(x-w/2),top=Math.round(y-h/2);
   const down=pressed?1:0;
   // Native Poké Arena 2D button (same marco as the base client menus):
   // gold = main action, blue = secondary, green-edged panel = confirm.
   if(tone==='green')nativeMarco(g,left,top+down,w,h,'panel',{borde:0x50cc84});
   else nativeMarco(g,left,top+down,w,h,tone==='gold'?'oro':'azul');
   if(hovered&&!pressed)nativeAro(g,left-2,top+down-2,w+4,h+4,MENU_UI.anillo,6,.75);
   if(pressed)nativeRect(g,left+2,top+down+2,w-4,h-4,0x06121f,4,.18);
   caption.setY(y+down);
   caption.setColor(tone==='gold'?MENU_UI.textoOscuro:hovered?'#fff5cd':'#ffffff');
   caption.setStroke(tone==='gold'?MENU_UI.oroLuz:MENU_UI.bordeTexto,tone==='gold'?0:3);
  };
  const zone=this.add.zone(x,y,w,Math.max(h,27)).setDepth(8)
   .setInteractive({useHandCursor:true})
   .setData('torre2-campaign-button',{label,tone});
  zone.on('pointerover',()=>{hovered=true;paint()});
  zone.on('pointerout',()=>{hovered=false;pressed=false;paint()});
  zone.on('pointerup',()=>{pressed=false;paint()});
  let lastPress=-Infinity;
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   // Preserve duplicate-submit protection for purchases, saves and resets.
   const now=Date.now();
   if(now-lastPress<190)return;
   lastPress=now;
   pressed=true;paint();
   // Native menu click sound (guarded: the Node button harness has no audio).
   if(typeof sfx==='function')try{sfx('seleccion')}catch{}
   callback();
  });
  paint();return zone;
 }
 professorOakIntro(){
  // Full-body FRLG lecture portrait (not the overworld NPC): original crisp
  // pixels, on a native-kit stage with a dialogue box.
  // The starter and save are created only after all four dialogue pages.
  this.backdrop();
  this.screenBanner(20,320,'Pokémon Torre 2 · Kanto','dex');
  const g=this.add.graphics().setDepth(1);
  // Soft lab stage: light gradient, glow and floor band behind Oak.
  const C3=Phaser.Display.Color;
  nativeRect(g,8,40,624,214,MENU_UI.contorno,9);
  for(let i=0;i<210;i++){const c=C3.Interpolate.ColorWithColor(C3.ValueToColor(0xe9f4ef),C3.ValueToColor(0x8fcfc6),100,Math.round(i/209*100));
   g.fillStyle(C3.GetColor(c.r,c.g,c.b),1).fillRect(11,42+i,618,1);}
  g.fillStyle(0xffffff,.35).fillCircle(320,150,86);g.fillStyle(0xffffff,.25).fillCircle(320,150,60);
  g.fillStyle(0x2a8889,.25).fillRect(11,214,618,38);
  nativeAro(g,7,39,626,216,MENU_UI.panelBorde,8);
  // Round lab platform under Oak (drawn: the FRLG platform art is all backdrop colour).
  g.fillStyle(0x1f6f72,.9).fillEllipse(320,236,214,46);
  g.fillStyle(0x5bafab,1).fillEllipse(320,232,204,38);
  g.fillStyle(0xb9dfd2,1).fillEllipse(320,229,176,26);
  g.lineStyle(2,0xffffff,.6).strokeEllipse(320,229,176,26);
  if(this.textures.exists('frlg-oak-intro-oak')){
   const oak=this.add.image(320,232,this.keyedTexture('frlg-oak-intro-oak'))
    .setOrigin(.5,1).setDepth(2);
   oak.setScale(Math.min(2.6,126/oak.width,170/oak.height));
   if(typeof Phaser!=='undefined')
    oak.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
   oak.setData('torre2-professor-oak-lecture',true);
  }else{
   const npc=addFireRedNPC(this,'oak',320,234,{scale:4.9,depth:2});
   npc?.setData('torre2-professor-oak-lecture-fallback',true);
  }
  let player=null;try{player=localStorage.getItem('torre2-trainer-name')}catch{}
  const dialogue=[
   'Olá'+(player?', '+player:'')+'! Bem-vindo ao mundo dos Pokémon!',
   'Sou o Professor Oak. Estudo as criaturas que vivem por toda Kanto.',
   'Você conhecerá treinadores, rotas e os oito líderes de ginásio.',
   'Sua jornada começa agora. Escolha um Pokémon para ser seu parceiro!'
  ];
  // Native dialogue box with the speaker tag and page dots.
  const box=this.add.graphics().setDepth(3);
  nativeMarco(box,14,262,612,90,'panel',{borde:MENU_UI.panelLuz});
  nativeRect(box,28,254,96,18,MENU_UI.oro,5);
  this.uiLabel(76,263,'Prof. Oak',8,MENU_UI.textoOscuro,[.5,.5],4).setData('torre2-oak-dialogue',true);
  let index=0;
  const message=textoMenu(this,36,286,dialogue[index],{tam:10,color:'#ffffff',borde:3,
   colorBorde:MENU_UI.bordeTexto,literal:true}).setOrigin(0,0).setDepth(4);
  message.setWordWrapWidth?.(440);
  const dots=this.add.graphics().setDepth(4);
  const paintDots=()=>{dots.clear();for(let i=0;i<dialogue.length;i++)
   nativeRect(dots,40+i*14,334,9,9,i<=index?MENU_UI.oro:MENU_UI.apagado,3);};
  paintDots();
  this.button(548,328,120,26,'CONTINUAR ▶',()=>{
   index++;
   if(index<dialogue.length){message.setText(dialogue[index]);paintDots();return;}
   this.__torre2OakIntroSeen=true;
   this.children.removeAll(true);
   this.starterSelection();
  },true,10).setData('torre2-oak-continue',true);
 }
 starterSelection(){
  if(!this.__torre2OakIntroSeen)return this.professorOakIntro();
  this.backdrop();
  this.screenBanner(20,330,'Escolha seu primeiro Pokémon','team');
  this.uiLabel(ANCHO/2,46,'O companheiro que o Professor Oak entrega para a sua jornada',8,MENU_UI.suave,[.5,.5]);
  // A blocked first write must not crash Phaser or leave a phantom journey.
  // Keep the three native choices available for retry when storage returns.
  const saveError=text(this,ANCHO/2,326,'NÃO FOI POSSÍVEL SALVAR · TENTE NOVAMENTE',{
   fontSize:'11px',color:'#ff9d9d'
  }).setOrigin(.5).setVisible(false).setData('torre2-starter-save-error',true).setDepth(9);
  const blurbs={bulbasaur:'Resistente e versátil',charmander:'Ataque forte e veloz',squirtle:'Defesa sólida'};
  STARTERS.forEach((id,i)=>{
   const x=125+i*195,y=58;
   let types=[];try{types=buscar(id).def.tipos||[]}catch{}
   const col=TIPOS[types[0]]??0x5f86bd;
   const g=this.add.graphics().setDepth(3);
   nativeRect(g,x-88,y,176,220,MENU_UI.contorno,9);nativeRect(g,x-86,y+2,172,216,col,8,.9);
   nativeRect(g,x-83,y+5,166,210,0x0f2352,7);
   // Type-coloured platform; the Pokémon stands on it (animated, like in battle).
   const lite=Phaser.Display.Color.ValueToColor(col).lighten(18).color;
   g.fillStyle(0xffffff,.06).fillCircle(x,y+70,46);
   g.fillStyle(0x061433,.9).fillEllipse(x,y+118,128,30);
   g.fillStyle(col,1).fillEllipse(x,y+114,120,26);
   g.fillStyle(lite,1).fillEllipse(x,y+112,100,18);
   if(!this.pokemonIdleSprite(id,x,y+114,96,5)){
    const key='torre2-portrait-'+['0001','0004','0007'][i];
    if(this.textures.exists(key))this.add.image(x,y+80,key).setDisplaySize(48,48).setDepth(5);
   }
   const nice=id[0].toUpperCase()+id.slice(1);
   this.uiLabel(x,y+142,nice,13,MENU_UI.amarillo,[.5,.5]);
   types.slice(0,2).forEach((t,k)=>{const n=Math.min(2,types.length),px=x-(n*56-4)/2+k*56;
    pastillaTipo(g,px,y+154,t,52,13);this.uiLabel(px+26,y+161,t[0]+t.slice(1).toLowerCase(),8,'#ffffff',[.5,.5],7)});
   this.uiLabel(x,y+180,blurbs[id]||'',8,MENU_UI.suave,[.5,.5]);
   this.button(x,y+200,150,28,'ESCOLHER',()=>{
    try{
     saveCampaign(createPlayerCampaign(id));
    }catch(error){
     console.warn('Torre 2: starter selection could not be saved',error);
     saveError.setVisible(true);
     return;
    }
    this.scene.restart();
   },true,10).setData('torre2-starter-select',id);
  });
  this.uiLabel(ANCHO/2,294,'Movimentação e golpes: combate original Phaser · progressão: Torre 1',7,MENU_UI.tenue,[.5,.5]);
  this.uiLabel(ANCHO/2,308,'Sua aventura começa somente com o inicial escolhido · Mewtwo fica no laboratório.',7,MENU_UI.tenue,[.5,.5]);
 }
 // FireRed intro art ships with an opaque backdrop colour: key it out once
 // (the corner pixel's colour becomes transparent) so it sits on our stage.
 keyedTexture(key){
  const out=key+'-keyed';
  if(this.textures.exists(out))return out;
  try{
   const src=this.textures.get(key).getSourceImage();
   const cv=document.createElement('canvas');cv.width=src.width;cv.height=src.height;
   const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0);
   const img=cx.getImageData(0,0,cv.width,cv.height),d=img.data;
   const r0=d[0],g0=d[1],b0=d[2];
   for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-r0)<6&&Math.abs(d[i+1]-g0)<6&&Math.abs(d[i+2]-b0)<6)d[i+3]=0;
   cx.putImageData(img,0,0);
   this.textures.addCanvas(out,cv);
   return out;
  }catch{return key}
 }
 backdrop(){
  // Native checkered menu background of the base client.
  nativeBackground(this);
  this.screenFade();
 }
 // Short fade-in whenever a campaign screen is drawn (presentation only).
 screenFade(){
  const cam=this.cameras?.main;
  if(cam&&!cam.fadeEffect?.isRunning)cam.fadeIn(160,4,12,30);
 }
 // Shared noncombat pixel frame. Deliberately inert graphics: input zones,
 // text, saves and battle scenes retain the exact native behavior.
 uiSection(x,y,w,h,accent=0x5ba5c9){
  // Native marco "panel" (League/Gyms look); accent kept for callers.
  const g=this.add.graphics().setDepth(0);
  nativeMarco(g,x,y,w,h,'panel',{alfa:.94});
  return g;
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
  this.screenBanner(20,300,'Casas e lugares','center');
  this.uiLabel(320,46,'Local: '+(location||region.title),8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,250);
  // The city illustration on the left; the places to visit on the right.
  const cityKey=state.stage>=8?'indigo':String(STAGES[state.stage]?.city||'').toLowerCase();
  ownerArt(this,{add:o=>o.setDepth?.(2)},'city-'+cityKey,20,68,230,196);
  const fr=this.add.graphics().setDepth(3);nativeAro(fr,19,67,232,198,MENU_UI.panelBorde,6);
  this.uiLabel(135,282,STAGES[state.stage]?.city||'Kanto',10,MENU_UI.amarillo,[.5,.5]);
  homes.slice(0,8).forEach((h,i)=>{
   const x=268+(i%2)*178,y=70+Math.floor(i/2)*48;
   const g=this.add.graphics().setDepth(3);
   nativeRect(g,x,y,170,42,MENU_UI.panelBorde,6);nativeRect(g,x+2,y+2,166,38,0x0a1a46,5);
   pixelIcon(this,{add:o=>o.setDepth(5)},'center',x+20,y+21,1.2);
   this.button(x+98,y+21,130,30,h.title,()=>this.enterLocalityBuilding(state,location,h),false,8)
    .setData('torre2-house',h.id);
  });
  if(!homes.length){
   const g=this.add.graphics().setDepth(3);nativeRect(g,272,110,340,120,0x081232,8,.75);
   pixelIcon(this,{add:o=>o.setDepth(5)},'center',442,140,2);
   this.uiLabel(442,180,'Nenhuma casa para visitar neste trecho',9,'#ffffff',[.5,.5]).setData('torre2-houses-empty',true);
   this.uiLabel(442,198,'Siga a rota: novas casas aparecem nas próximas cidades.',7,MENU_UI.suave,[.5,.5]);
  }
  this.button(320,334,230,28,'◀ VOLTAR À ROTA',()=>this.scene.restart());
 }
 // Animated full-body PMD Idle sprite (the same art as in battle), facing
 // the player. Loaded on demand and released when the scene shuts down.
 pokemonIdleSprite(id,x,y,maxSize=88,depth=6,onReady=null){
  const dex=portraitId({id});
  const idle=this.registry.get('manifiesto')?.[dex]?.anims?.Idle;
  if(!idle)return null;
  const key='torre2-idle-'+dex,anim=key+'-front';
  const owner=this.add.zone(x,y,1,1).setData('torre2-idle-sprite',id);
  const show=()=>{
   if(!owner.active||!this.textures.exists(key))return;
   this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
   const n=Math.max(1,idle.durations?.length||1);
   if(!this.anims.exists(anim))this.anims.create({key:anim,repeat:-1,
    frames:Array.from({length:n},(_,i)=>({key,frame:i,duration:Math.round((idle.durations?.[i]||8)*1000/60)}))});
   const s=Math.min(3,maxSize/Math.max(idle.fw,idle.fh));
   // y is the GROUND line: measure the lowest visible pixel row of the first
   // frame (the feet) and anchor there, so the Pokémon stands exactly on the
   // same line as the trainer instead of floating or sinking.
   const feet=(this.__torre2Feet??=new Map());
   if(!feet.has(key)){
    let row=idle.fh-1;
    try{
     const src=this.textures.get(key).getSourceImage();
     const cv=document.createElement('canvas');cv.width=idle.fw;cv.height=idle.fh;
     const cx=cv.getContext('2d',{willReadFrequently:true});cx.drawImage(src,0,0,idle.fw,idle.fh,0,0,idle.fw,idle.fh);
     const data=cx.getImageData(0,0,idle.fw,idle.fh).data;
     find:for(let r=idle.fh-1;r>=0;r--)for(let c=0;c<idle.fw;c++)if(data[(r*idle.fw+c)*4+3]>40){row=r;break find}
    }catch{}
    feet.set(key,(row+1)/idle.fh);
   }
   const sprite=this.add.sprite(x,y,key,0).setOrigin(.5,feet.get(key)).setScale(s).setDepth(depth).play(anim)
    .setData('torre2-idle-sprite-image',id);
   onReady?.(sprite);
  };
  if(this.textures.exists(key))show();
  else{
   this.load.once('filecomplete-spritesheet-'+key,show);
   this.load.spritesheet(key,'assets/pmd/'+idle.file,{frameWidth:idle.fw,frameHeight:idle.fh});
   if(!this.load.isLoading())this.load.start();
   this.events.once('shutdown',()=>{if(this.anims.exists(anim))this.anims.remove(anim);
    if(this.textures.exists(key))this.textures.remove(key)});
  }
  return owner;
 }
 // Original FireRed overworld NPC, loaded on demand (front frame).
 npcSprite(id,x,y,scale=2.4,depth=6){
  const key='frlg-npc-'+id;
  const owner=this.add.zone(x,y,1,1);
  const show=()=>{
   if(!owner.active||!this.textures.exists(key))return;
   const t=this.textures.get(key),src=t.getSourceImage();
   const cell=src.height===32&&src.width===320?32:16;
   if(!t.has('torre2-front-'+cell))t.add('torre2-front-'+cell,0,0,0,cell,32);
   t.setFilter(Phaser.Textures.FilterMode.NEAREST);
   this.add.image(x,y,key,'torre2-front-'+cell).setOrigin(.5,1).setScale(scale).setDepth(depth)
    .setData('torre2-npc-sprite',id);
  };
  if(this.textures.exists(key))show();
  else{this.load.once('filecomplete-image-'+key,show);
   this.load.image(key,'assets/ui/frlg/npc/'+id+'.png');
   if(!this.load.isLoading())this.load.start();}
  return owner;
 }
 gymScreen(state){
  const limit=TRAINERS_PER_GYM(state.stage);
  const remaining=Math.max(0,limit-state.trainer);
  const ready=!state.champion&&remaining===0;
  const spec=STAGES[state.stage]||{};
  this.children.removeAll(true);this.backdrop();
  this.screenBanner(20,300,state.stage<8?'Desafio do ginásio':'Desafio da Liga','badges');
  this.uiSection(8,40,624,262);
  // Left: the gym itself, with the leader and the leader's main Pokémon.
  // Left: the leader's room (pixel-art hall in the gym type colour), with the
  // leader and the main Pokémon centred, feet on one ground line, side by side.
  this.leaderRoom(18,50,330,206,state.stage,spec.type||(state.stage>=8?'DRAGON':'NORMAL'));
  const frame=this.add.graphics().setDepth(3);
  nativeAro(frame,17,49,332,208,ready?MENU_UI.oro:MENU_UI.panelBorde,6);
  const cx=183,ground=206;
  frame.fillStyle(0x000000,.28).fillEllipse(cx-26,ground,50,11).fillEllipse(cx+36,ground,58,12);
  const leaderKind=leaderSpriteKind(state.stage);
  this.npcSprite(spriteIdForTrainer(leaderKind),cx-26,ground+2,3.4,5);
  const ace=spec.boss||spec.leaderTeam?.at(-1);
  // Feet on the same ground line as the leader (measured from the sprite).
  if(ace)this.pokemonIdleSprite(ace,cx+36,ground+2,104,5);
  // Right: who you face, the main Pokémon, the full team and the progress.
  const R=360;
  this.uiLabel(R,64,spec.leader||'Líder',14,MENU_UI.amarillo);
  this.uiLabel(R,84,state.stage<8?'Líder do ginásio de '+(spec.city||'Kanto'):'Liga Pokémon · Planalto Índigo',8,MENU_UI.suave);
  if(spec.type){const tg=this.add.graphics().setDepth(5);pastillaTipo(tg,R,94,spec.type,62,13);
   this.uiLabel(R+31,101,spec.type[0]+spec.type.slice(1).toLowerCase(),8,'#ffffff',[.5,.5],7);}
  if(ace){
   const lv=spec.leaderLevels?.at(-1);
   const g=this.add.graphics().setDepth(4);nativeRect(g,R-4,118,266,36,0x081436,6,.85);
   this.uiLabel(R+4,129,'Pokémon principal',7,MENU_UI.tenue);
   const nice=String(ace).replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
   this.uiLabel(R+4,143,nice+(lv?' · Nv '+lv:''),10,'#ffffff');
  }
  const team=spec.leaderTeam||[];
  if(team.length){
   this.uiLabel(R,168,'Equipe do líder',7,MENU_UI.tenue);
   const tg=this.add.graphics().setDepth(4);
   team.slice(0,6).forEach((id,i)=>{
    const x=R+i*44,y=178;
    nativeRect(tg,x,y,38,38,id===ace?MENU_UI.oro:MENU_UI.panelBorde,6);
    nativeRect(tg,x+2,y+2,34,34,0x0a1a46,5);
    const dex=portraitId({id}),key='torre2-portrait-'+dex;
    requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',()=>{
     if(!tg.active)return;this.add.image(x+19,y+19,key).setDisplaySize(32,32).setDepth(6);
    });
    const lv=spec.leaderLevels?.[i];
    if(lv)this.uiLabel(x+19,y+44,'Nv '+lv,6,MENU_UI.suave,[.5,.5]);
   });
  }
  // Route progress towards the leader.
  const done=Math.min(limit,state.trainer||0);
  this.uiLabel(R,240,'Treinadores vencidos',7,MENU_UI.tenue);
  this.uiLabel(R+262,240,done+' / '+limit,8,MENU_UI.amarillo,[1,.5]);
  const bar=this.add.graphics().setDepth(4);
  nativeRect(bar,R,248,262,8,MENU_UI.contorno,3);nativeRect(bar,R+1,249,260,6,MENU_UI.apagado,2);
  if(done>0)nativeRect(bar,R+1,249,Math.max(4,Math.round(260*done/Math.max(1,limit))),6,MENU_UI.oro,2);
  this.uiLabel(R+131,270,ready?'LÍDER DISPONÍVEL PARA BATALHA':
   'DERROTE OS TREINADORES DA ROTA PRIMEIRO.',8,ready?'#9ff0bf':'#ffd47a',[.5,.5]);
  this.uiLabel(R+131,286,ready?'VOCÊ PODE ENTRAR AGORA.':
   'FALTAM '+remaining+' TREINADORES PARA LIBERAR O LÍDER.',7,'#ffffff',[.5,.5]);
  this.button(452,330,330,32,ready?'▶ DESAFIAR LÍDER':'CONTINUAR A ROTA',()=>{
   if(ready)this.enterBattle(state);
   else {this.__torre2CityRoute=true;this.scene.restart();}
  },ready,11);
  this.button(130,330,220,30,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 card(x,y,w,h,accent=0x4b789b){
  // Native marco "panel" card (base client look). The returned rectangle is
  // an invisible anchor so callers keep their approved geometry/handlers.
  const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x13253e,0);
  const g=this.add.graphics().setDepth(0);
  const warn=accent===0x6b5669;
  nativeMarco(g,x,y,w,h,'panel',{alfa:.96,...(warn&&{borde:0x8a5a78})});
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
  // Celebration backdrop: deep royal gradient, golden light rays, sparkles.
  const C3=Phaser.Display.Color;
  for(let yy=0;yy<360;yy++){const c=C3.Interpolate.ColorWithColor(C3.ValueToColor(0x2a1d6e),C3.ValueToColor(0x060f21),100,Math.round(yy/359*100));
   g.fillStyle(C3.GetColor(c.r,c.g,c.b),1).fillRect(0,yy,640,1);}
  for(let k=0;k<9;k++){const a0=Math.PI*(.08+k*.105),a1=a0+.045;
   g.fillStyle(0xffd86b,.07).fillTriangle(320,-10,320+Math.cos(a0)*700,-10+Math.sin(a0)*700,320+Math.cos(a1)*700,-10+Math.sin(a1)*700);}
  for(let k=0;k<46;k++){const sx=(k*137)%640,sy=(k*71)%300+8,big=k%5===0;
   g.fillStyle(k%3?0xfff3c4:0x9fd8ff,big?.9:.55).fillRect(sx,sy,big?2:1,big?2:1);
   if(big){g.fillRect(sx-2,sy,6,1);g.fillRect(sx,sy-2,1,6);}}
  nativeAro(g,6,6,628,348,MENU_UI.oro,10,.85);
  const center=(x,y,label,size=12,color=C.white)=>
   this.uiLabel(x,y,label,Math.max(7,Math.round(size*.8)),color,[.5,.5],7);
  this.campaignMusic('hall');
  this.screenBanner(22,320,'★ SALÃO DA FAMA ★','badges').setData('torre2-hall-title',true);
  center(320,46,'CAMPEÃO DA REGIÃO DE KANTO',10,'#dcf4fb');
  // Left: the champion (the player's own Red/Leaf) on a golden podium.
  let champion=null;try{champion=localStorage.getItem('torre2-trainer-name')}catch{}
  const pod=this.add.graphics().setDepth(4);
  pod.fillStyle(0x000000,.35).fillEllipse(92,178,104,22);
  pod.fillStyle(MENU_UI.oroBorde,1).fillEllipse(92,172,96,20);
  pod.fillStyle(MENU_UI.oro,1).fillEllipse(92,169,84,15);
  pod.fillStyle(MENU_UI.oroLuz,.7).fillEllipse(92,167,60,8);
  pod.fillStyle(0xffffff,.08).fillCircle(92,124,48);
  this.npcSprite(playerSpriteId(),92,171,3.6,6);
  center(92,194,champion||'Campeão',13,MENU_UI.amarillo).setData('torre2-hall-champion',champion||'');
  center(92,210,'Campeão de Kanto',8,'#dcf4fb');
  // The eight original FireRed badges, all earned.
  const bg=this.add.graphics().setDepth(4);nativeRect(bg,22,222,140,56,0x0a1638,7,.85);
  for(let i=0;i<8;i++)drawBadgeIcon(this,i,40+(i%4)*35,238+Math.floor(i/4)*24,hall.badges.includes(HALL_BADGE_ORDER[i]),1.15).setDepth(6);
  const badges=hall.badgeCount+'/8 INSÍGNIAS';
  const honors=hall.honorCount+'/5 LIGA';
  center(92,292,badges+'  ·  '+honors,8,hall.complete?'#b2ffcb':'#ffdfa0');
  center(92,306,hall.wins+' VITÓRIAS',8,'#ffdfa0');
  // Right: the champion party on golden pedestals, animated like in battle.
  const panel=this.add.graphics().setDepth(2);
  nativeRect(panel,176,60,450,250,0x0a1638,10,.55);
  hall.team.forEach((member,i)=>{
   const col=i%3,row=Math.floor(i/3);
   const x=250+col*150,y=60+row*124;
   const info=this.memberInfo(member);
   const p=this.add.graphics().setDepth(4);
   p.fillStyle(0xffffff,.05).fillCircle(x,y+46,34);
   p.fillStyle(0x000000,.35).fillEllipse(x,y+80,92,18);
   p.fillStyle(MENU_UI.oroBorde,1).fillEllipse(x,y+76,84,16);
   p.fillStyle(MENU_UI.oro,1).fillEllipse(x,y+74,72,11);
   p.fillStyle(MENU_UI.oroLuz,.6).fillEllipse(x,y+73,50,5);
   if(!this.pokemonIdleSprite(member.id,x,y+75,66,6))this.drawPortrait(member,x,y+48,44,6);
   // Name plaque, level and types.
   nativeRect(p,x-62,y+88,124,32,MENU_UI.oroBorde,6);nativeRect(p,x-60,y+90,120,28,0x1b1446,5);
   const name=member.id.replace(/-/g,' ').toUpperCase().slice(0,16);
   center(x-6,y+98,name,9,'#f6eed1');
   this.uiLabel(x+56,y+98,'NV '+member.level,7,'#c1e6f3',[1,.5],7).setData('torre2-hall-level',member.level);
   info.types.slice(0,2).forEach((t,k)=>{const n=Math.min(2,info.types.length),px=x-(n*48-2)/2+k*48;
    pastillaTipo(p,px,y+106,t,46,10);this.uiLabel(px+23,y+111,t[0]+t.slice(1).toLowerCase(),6,'#ffffff',[.5,.5],8)});
  });
  if(!hall.team.length)center(400,172,'EQUIPE NÃO ENCONTRADA NO SAVE',11,'#f3c7a7');
  center(400,322,'LIGA CONCLUÍDA · PROGRESSO PRESERVADO NO SEU SAVE',
   8,'#adcbe0');
  this.button(92,332,150,26,'◀ VOLTAR AO MENU',()=>this.scene.start('titulo',{menu:'principal'}),false,8)
   .setData('torre2-hall-back',true);
  this.__torre2HallOfFame={...hall};
 }
 renderCampaign(state,{deferEeveeChoice=false}={}){
  if(new URLSearchParams(location.search).get('qa-legacy-map')==='1')
   return this.renderLegacyCampaign(state,{deferEeveeChoice});
  this.__torre2EeveeChoice=null;
  this.__torre2HallOpen=false;
  if(this.__torre2CityWaterTimer){
   this.time.removeEvent(this.__torre2CityWaterTimer);
   this.__torre2CityWaterTimer=null;
  }
  // No battle-road, overworld maps or hidden hotspots. One card screen.
  this.children.removeAll(true);
  this.__torre2CityHub=null;
  this.__torre2BattlePath=null;
  this.__torre2CardsOnly=true;
  this.__torre2PathData={buscar};
  if(state.champion)return this.hallOfFameScreen(state);
  // The original audio modal remains accessible through MAIS; its small
  // tab sits below the 200-depth cards and never covers card controls.
  installCampaignAudioSettings(this);
  const handlers={
   menu:()=>this.scene.start('titulo',{menu:'principal'}),
   battle:()=>this.enterBattle(state),
   rematch:i=>this.rematchScreen(state,i),
   pokemon:()=>this.teamScreen(state),
   bag:()=>this.bagScreen(state),
   center:()=>this.centerScreen(state),
   mart:()=>this.martScreen(state),
   training:()=>this.enterTraining(state),
   capture:()=>this.grassScreen(state),
   rematchAtlas:()=>this.rematchAtlasScreen(state),
   dex:()=>this.dexScreen(state),
   badges:()=>this.badgeCaseScreen(state),
   trainerCard:()=>this.trainerCardScreen(state),
   audio:()=>this.__torre2AudioSettings?.open(),
   reset:()=>this.confirmResetJourney()
  };
  this.screenFade();
  this.campaignMusic('town');
  const cards=renderTrainerCardHub(this,state,handlers);
  if(!deferEeveeChoice)this.promptPendingEeveeEvolution(state);
  return cards;
 }
 // Only explicitly flagged QA sessions may exercise the old path engine.
 // The public game never paints maps, nor does ?original=1 enable them.
 renderLegacyCampaign(state,{deferEeveeChoice=false}={}){
  this.__torre2EeveeChoice=null;
  this.__torre2HallOpen=false;
  // The image-approved UI is a sequential battle road, not an overworld.
  // Keep all trainer/leader counters and the existing localStorage save IDs.
  // Retain older scene helpers below for PC, Center, Mart and summary only.
  // The Phaser Scene persists across route/city/menu transitions. Stop its
  // prior water clock event before removing visuals or drawing a new city.
  if(this.__torre2CityWaterTimer){
   this.time.removeEvent(this.__torre2CityWaterTimer);
   this.__torre2CityWaterTimer=null;
  }
  this.children.removeAll(true);
  this.__torre2CityHub=null;
  this.__torre2PathData={buscar};
  if(this.__torre2PathStage!==state.stage){
   this.__torre2PathPage=undefined;
   // Explicit original-game route view; normal game links open cards.
   // ?original=1 keeps the old playable map until TREINADORES is selected.
   // ?torre2-cards=1 opts into browser regression of the new cards.
   const query=new URLSearchParams(location.search);
   this.__torre2CardsMapOnly=query.get('original')==='1'&&
    query.get('torre2-cards')!=='1';
   this.__torre2CardPage=undefined;
   this.__torre2CardPortraitQueue=new Set();
   // Preserve native route as default; layered Cerulean is an opt-in view.
   this.__torre2CityRoute=true;
   // Cinnabar renders the town separately from sea routes and caves.
   this.__torre2CinnabarCityView=state.stage===6;
   this.__torre2PathStage=state.stage;
  }
  const movePage=delta=>{
   const current=this.__torre2BattlePath?.offset||0;
   this.__torre2PathPage=Math.max(0,current+delta*(this.__torre2BattlePath?.pageSize||13));
   this.renderCampaign(state);
  };
  const details=()=>{
   const foe=currentOpponent(state);
   if(!foe)return this.gymScreen(state);
   if(foe.leader)return this.gymScreen(state);
   this.__torre2PathDetails(text,this,foe);
  };
  if(state.stage===1&&!this.__torre2CityRoute){
   this.__torre2BattlePath=null;
   const city=renderCityHub(this,state,{
    trainerCount:TRAINERS_PER_GYM(state.stage),badgeDefinitions:GYMS,
    center:()=>this.centerScreen(state),mart:()=>this.martScreen(state),
    gym:()=>this.gymScreen(state),bag:()=>this.bagScreen(state),
    dex:()=>this.dexScreen(state),badges:()=>this.badgeCaseScreen(state),
    capture:()=>this.grassScreen(state),
    pokemon:i=>state.team[i]&&this.showSummary(state,i),
    trainer:(i,status)=>{
     if(status==='current')return this.enterBattle(state);
     if(status==='defeated')return this.rematchScreen(state,i);
     return this.__torre2PathDetails(text,this,null);
    },
    refresh:()=>this.renderCampaign(state),
    route:()=>{this.__torre2CityRoute=true;this.renderCampaign(state)}
   });
   if(!deferEeveeChoice)this.promptPendingEeveeEvolution(state);
   return city;
  }
  const path=renderBattlePath(this,state,{
   showCinnabarCity:state.stage===6&&this.__torre2CinnabarCityView,
   viewRoutes:()=>{this.__torre2CinnabarCityView=false;this.renderCampaign(state)},
   viewCinnabarCity:()=>{this.__torre2CinnabarCityView=true;this.renderCampaign(state)},
   city:()=>{this.__torre2CityRoute=false;this.renderCampaign(state)},
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
  // One visually selectable card per real trainer. Keep the legacy route
  // beneath the new layer so saved checkpoint hit zones and pre-existing
  // native navigation remain intact. Toggling MAPA never changes the save.
  const cardsHandlers={
   map:()=>{this.__torre2CardsMapOnly=true;this.renderCampaign(state)},
   menu:()=>this.scene.start('titulo',{menu:'principal'}),
   battle:()=>this.enterBattle(state),
   rematch:i=>this.rematchScreen(state,i),
   pokemon:()=>this.teamScreen(state),
   bag:()=>this.bagScreen(state),
   center:()=>this.centerScreen(state),
   mart:()=>this.martScreen(state),
   training:()=>this.enterTraining(state),
   capture:()=>this.grassScreen(state),
   rematchAtlas:()=>this.rematchAtlasScreen(state)
  };
  if(!this.__torre2CardsMapOnly)
   renderTrainerCardHub(this,state,cardsHandlers);
  else renderTrainerCardMapTab(this,()=>{
   this.__torre2CardsMapOnly=false;this.renderCampaign(state);
  });
  if(!deferEeveeChoice)this.promptPendingEeveeEvolution(state);
  return path;
 }
 // Evolution cutscene, FireRed style: "What? X is evolving!", the two
 // forms flashing faster and faster, then "Congratulations!". Pure
 // presentation: the evolution was already resolved and saved.
 evolutionScene(list,onDone=null){
  const queue=(list||[]).filter(e=>e?.from&&e?.to&&e.from!==e.to);
  if(!queue.length){onDone?.();return}
  const {from,to}=queue.shift();
  const nice=id=>String(id).replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
  const objs=[];const keep=o=>{if(o)objs.push(o);return o};
  const D=9500;
  keep(this.add.zone(320,180,640,360).setDepth(D).setInteractive().setData('torre2-evolution-scene',true));
  const g=keep(this.add.graphics().setDepth(D+1));
  g.fillStyle(0x020814,.92).fillRect(0,0,640,360);
  nativeMarco(g,110,40,420,280,'panel',{borde:MENU_UI.oro});
  g.fillStyle(0xffffff,.05).fillCircle(320,150,90);g.fillStyle(0xffffff,.05).fillCircle(320,150,62);
  g.fillStyle(0x061433,.9).fillEllipse(320,206,150,30);g.fillStyle(MENU_UI.oro,1).fillEllipse(320,202,138,22);
  g.fillStyle(MENU_UI.oroLuz,.7).fillEllipse(320,200,100,10);
  const line=keep(this.uiLabel(320,244,'O quê? '+nice(from)+' está evoluindo!',11,'#ffffff',[.5,.5],D+4));
  let before=null,after=null,done=false;
  const glow=keep(this.add.graphics().setDepth(D+2));
  const ready=()=>{
   if(!before||!after)return;
   after.setVisible(false);
   let t=0,flip=false,period=420;
   const tick=()=>{
    if(!before.active||!after.active)return;
    flip=!flip;before.setVisible(!flip);after.setVisible(flip);
    before.setTintFill(0xffffff);after.setTintFill(0xffffff);
    t+=period;period=Math.max(60,Math.round(period*.78));
    if(t<2600)this.time.delayedCall(period,tick);
    else finish();
   };
   this.time.delayedCall(500,tick);
  };
  const finish=()=>{
   if(done)return;done=true;
   before.setVisible(false);after.setVisible(true).clearTint();
   glow.fillStyle(0xffffff,.22).fillCircle(320,150,70);
   this.tweens.add({targets:glow,alpha:0,duration:700});
   line.setText('Parabéns! '+nice(from)+' evoluiu para '+nice(to)+'!').setColor(MENU_UI.amarillo);
   this.campaignJingle('victory');
   const btn=this.button(320,288,180,28,'CONTINUAR ▶',()=>{
    objs.forEach(o=>o.active&&o.destroy());btn.active&&btn.destroy();
    this.children.list.filter(o=>o.getData?.('torre2-evolution-ui')).forEach(o=>o.destroy());
    this.evolutionScene(queue,onDone);
   },true,10).setDepth(D+6).setData('torre2-evolution-continue',true);
   // Lift the button visuals above the cutscene too.
   this.children.list.slice(-3).forEach(o=>{if(o!==btn){o.setDepth?.(D+5);o.setData?.('torre2-evolution-ui',true)}});
  };
  const fallback=this.time.delayedCall(6000,()=>{if(!before||!after){
   // Sprites unavailable offline: still announce the evolution.
   line.setText('Parabéns! '+nice(from)+' evoluiu para '+nice(to)+'!').setColor(MENU_UI.amarillo);
   before=before||{active:true,setVisible(){return this},setTintFill(){return this},clearTint(){return this}};
   after=after||before;finish();}});
  keep(fallback);
  keep(this.pokemonIdleSprite(from,320,203,120,D+3,sp=>{if(done){sp.destroy();return}before=keep(sp);ready()}));
  keep(this.pokemonIdleSprite(to,320,203,120,D+3,sp=>{if(done){sp.destroy();return}after=keep(sp);sp.setVisible(false);ready()}));
 }
 // Post-battle evolution: one random legal Kanto form, chosen exactly once
 // per Eevee UID through the existing primary/backup atomic save path.
 promptPendingEeveeEvolution(state){
  const pending=pendingEeveeEvolution(state);
  if(!pending||this.__torre2EeveeResolving||this.__torre2EeveeAttempted===pending.uid)return false;
  this.__torre2EeveeAttempted=pending.uid;
  this.__torre2EeveeResolving=true;
  try{
   const current=readCampaign();
   if(!current)return false;
   const result=chooseEeveeEvolution(current,pending.uid,'random');
   if(!result.ok)return false;
   // Show Eevee's evolution cutscene once the scene has restarted.
   this.__torre2ShowEvolution=[{from:result.from,to:result.to}];
   // Do not restart during Scene.create; defer to the next Phaser frame.
   this.time.delayedCall(0,()=>{if(this.scene.isActive())this.scene.restart()});
   return true;
  }catch(e){
   // Save denied: leave Eevee pending and offer a deliberate retry.
   const warning=text(this,320,327,'EVOLUÇÃO PENDENTE · TOQUE PARA TENTAR NOVAMENTE',{
    fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#ffb9a1'
   }).setOrigin(.5).setDepth(480).setInteractive({useHandCursor:true});
   warning.on('pointerdown',()=>{
    warning.destroy();
    this.__torre2EeveeAttempted=null;
    this.promptPendingEeveeEvolution(readCampaign());
   });
   return false;
  }finally{this.__torre2EeveeResolving=false}
 }
 // Trainer Card, FireRed style: the player's character, name, ID, money,
 // Pokédex, wins and the eight badges. Read-only (never writes the save).
 trainerCardScreen(state){
  this.children.removeAll(true);this.backdrop();
  this.screenBanner(20,300,'Cartão do treinador','badges');
  let name='Treinador';try{name=localStorage.getItem('torre2-trainer-name')||name}catch{}
  const uid=String(state.team?.[0]?.uid||state.starter||'kanto');
  let h=7;for(const ch of uid)h=(h*31+ch.charCodeAt(0))%100000;
  const got=(state.badges||[]).length;
  // Card colour follows progress, like the FRLG card tiers.
  const tier=got>=8?MENU_UI.oro:got>=4?0xc0c8d8:got>=1?0xcd8a4a:0x5f86bd;
  const g=this.add.graphics().setDepth(2);
  nativeRect(g,36,44,568,250,MENU_UI.contorno,12);
  nativeRect(g,38,46,564,246,tier,11);
  nativeRect(g,46,54,548,230,0x0f2352,9);
  g.fillStyle(0xffffff,.05).fillRect(50,58,540,40);
  this.uiLabel(64,76,'CARTÃO DE TREINADOR',11,MENU_UI.amarillo);
  this.uiLabel(580,76,'ID Nº '+String(h).padStart(5,'0'),9,MENU_UI.suave,[1,.5]);
  g.fillStyle(MENU_UI.panelBorde,1).fillRect(56,96,528,1);
  const dexSeen=new Set([...(state.dexSeen||[]),...(state.dexCaught||[])]).size;
  const rows=[['Nome',name],['Dinheiro','₽ '+Number(state.money||0).toLocaleString('pt-BR')],
   ['Pokédex',(state.dexCaught||[]).length+' capturados · '+dexSeen+' vistos'],
   ['Vitórias',(state.wins||0)+' vitórias · '+(state.losses||0)+' derrotas'],
   ['Equipe',(state.team||[]).length+' na equipe · '+(state.box||[]).length+' no PC']];
  rows.forEach(([k,v],i)=>{
   const y=116+i*26;
   nativeRect(g,60,y-10,340,22,i%2?0x0c1d46:0x12285a,5,.9);
   this.uiLabel(70,y+1,k,8,MENU_UI.suave);
   estrechar(this.uiLabel(390,y+1,v,9,i===0?MENU_UI.amarillo:'#ffffff',[1,.5]),220);
  });
  // The player's own FireRed character in a framed window.
  nativeRect(g,420,106,160,130,MENU_UI.contorno,8);nativeRect(g,422,108,156,126,0x1d3c7a,7);
  g.fillStyle(0xffffff,.06).fillCircle(500,160,48);
  g.fillStyle(0x000000,.3).fillEllipse(500,222,70,12);
  this.npcSprite(playerSpriteId(),500,224,3.6,5);
  // Badge strip.
  nativeRect(g,60,250,520,30,0x081436,6,.9);
  this.uiLabel(70,265,'Insígnias',8,MENU_UI.suave);
  for(let i=0;i<8;i++)drawBadgeIcon(this,i,170+i*48,265,state.badges?.includes(HALL_BADGE_ORDER[i]),1.3).setDepth(6);
  this.button(320,330,220,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(state))
   .setData('torre2-trainer-card-back',true);
  this.__torre2TrainerCard={name,id:h,badges:got};
 }
 badgeCaseScreen(state,selected=0){
  this.children.removeAll(true);this.backdrop();
  const index=Math.max(0,Math.min(7,selected));
  const got=GYMS.filter(g=>state.badges.includes(g.badge)).length;
  this.screenBanner(20,300,'Estojo de insígnias','badges');
  this.uiLabel(320,46,'Kanto · '+got+' / 8 insígnias',8,MENU_UI.suave,[.5,.5]);
  // Left: the eight original FireRed badges in a velvet case.
  this.uiSection(8,56,376,246);
  const cards=this.add.graphics().setDepth(2);
  nativeRect(cards,18,66,356,226,0x2a1446,8,.65);
  GYMS.forEach((gym,i)=>{
   const x=62+(i%4)*89,y=120+Math.floor(i/4)*104,earned=state.badges.includes(gym.badge);
   const current=i===index;
   nativeRect(cards,x-41,y-46,82,92,current?MENU_UI.oro:earned?MENU_UI.oroBorde:MENU_UI.apagadoBorde,7);
   nativeRect(cards,x-39,y-44,78,88,current?0x2a3f78:earned?0x1d2f63:0x0a1638,6);
   if(earned){cards.fillStyle(MENU_UI.oroLuz,.18).fillCircle(x,y-10,26);}
   nativeRect(cards,x-26,y-36,52,52,earned?0x3b2a12:0x0c1428,26,earned?.55:.8);
   drawBadgeIcon(this,i,x,y-10,earned,3);
   this.uiLabel(x,y+24,gym.badge,8,earned?'#ffffff':MENU_UI.tenue,[.5,.5]);
   this.uiLabel(x,y+36,earned?'Conquistada':'Bloqueada',7,earned?'#9ff0bf':MENU_UI.apagadoTexto,[.5,.5]);
   this.add.zone(x,y,82,92).setDepth(8).setInteractive({useHandCursor:true})
    .setData('torre2-badge-index',i).on('pointerdown',()=>this.badgeCaseScreen(state,i));
  });
  // Right: the selected gym — city illustration, leader sprite and reward.
  const gym=GYMS[index],earned=state.badges.includes(gym.badge),reward=GYM_TM_REWARDS[index];
  const item=MART_ITEMS.find(i=>i.id===reward),claimed=earned&&!!reward&&state.gymTMClaims?.includes(reward);
  this.uiSection(390,56,242,246);
  const city=String(gym.city).toLowerCase();
  const layer={add:o=>o.setDepth?.(3)};
  ownerArt(this,layer,'city-'+city,400,66,222,108);
  const ring=this.add.graphics().setDepth(4);nativeAro(ring,399,65,224,110,earned?MENU_UI.oro:MENU_UI.panelBorde,6);
  // Big badge medal (no badge-sprite data: the case grid keeps exactly eight).
  const medal=this.add.graphics().setDepth(5);
  nativeRect(medal,408,140,52,52,MENU_UI.contorno,26);nativeRect(medal,410,142,48,48,earned?MENU_UI.oro:MENU_UI.apagado,24);
  this.add.image(434,166,'torre2-frlg-badges',index).setScale(2.4).setDepth(6)
   .setTint(earned?0xffffff:0x718293).setAlpha(earned?1:.6);
  const leaderId=['brock','misty','lt_surge','erika','koga','sabrina','blaine','giovanni'][index];
  const npcKey='frlg-npc-'+leaderId;
  const showLeader=()=>{
   if(!this.scene.isActive()||!this.textures.exists(npcKey)||this.__torre2BadgeCase?.selected!==index)return;
   const t=this.textures.get(npcKey);if(!t.has('torre2-front'))t.add('torre2-front',0,0,0,16,32);
   t.setFilter(Phaser.Textures.FilterMode.NEAREST);
   this.add.image(590,172,npcKey,'torre2-front').setOrigin(.5,1).setScale(2.4).setDepth(6)
    .setData('torre2-badge-leader',leaderId);
  };
  this.uiLabel(511,190,gym.leader,12,MENU_UI.amarillo,[.5,.5]);
  this.uiLabel(511,206,'Ginásio de '+gym.city,8,MENU_UI.suave,[.5,.5]);
  const typeCol=TIPOS[gym.type];
  if(typeCol!==undefined){const tg=this.add.graphics().setDepth(5);pastillaTipo(tg,481,216,gym.type,60,13);
   this.uiLabel(511,223,gym.type[0]+gym.type.slice(1).toLowerCase(),8,'#ffffff',[.5,.5],7);}
  const rewardText=item?item.name+'  ·  '+(claimed?'RECEBIDA':earned?'A RECEBER':'RECOMPENSA DO GINÁSIO'):
   'TM06 TOXIC  ·  INDISPONÍVEL NESTA VERSÃO';
  const rg=this.add.graphics().setDepth(4);nativeRect(rg,400,238,222,40,0x081436,6,.85);
  if(item)this.add.image(418,258,shopItemSprite(this,item)).setDisplaySize(22,22).setDepth(6);
  estrechar(this.uiLabel(item?434:511,252,rewardText,8,'#ffffff',item?[0,.5]:[.5,.5]),item?182:212);
  this.uiLabel(item?434:511,266,'Recompensa do ginásio',7,MENU_UI.tenue,item?[0,.5]:[.5,.5]);
  this.uiLabel(511,292,'Toque numa insígnia para ver o ginásio',7,MENU_UI.tenue,[.5,.5]);
  this.button(320,334,230,28,'◀ VOLTAR AO MAPA',()=>this.renderCampaign(state))
   .setData('torre2-badge-case-back',true);
  this.__torre2BadgeCase={selected:index,earned,claimed,reward:reward||null};
  if(this.textures.exists(npcKey))showLeader();
  else{this.load.once('filecomplete-image-'+npcKey,showLeader);
   this.load.image(npcKey,'assets/ui/frlg/npc/'+leaderId+'.png');
   if(!this.load.isLoading())this.load.start();}
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
  let lastPress=-Infinity;
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   if(!active)return;
   const now=Date.now();
   if(now-lastPress<190)return;
   lastPress=now;
   callback();
  });
  paint();
  return zone;
 }
 captureScreen(state){
  this.children.removeAll(true);this.backdrop();
  this.uiSection(19,72,602,206,0x67aa9a);
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
 // The leader's own room: simple pixel-art gym hall in the gym type colour —
 // panelled wall with banners and the gym badge, tiled battle-court floor.
 leaderRoom(x,y,w,h,stage,type){
  const C3=Phaser.Display.Color,base=C3.ValueToColor(TIPOS[type]??0x5f86bd);
  const shade=n=>base.clone().darken(n).color,light=n=>base.clone().lighten(n).color;
  const g=this.add.graphics().setDepth(2);
  const wallH=Math.round(h*.46),fy=y+wallH;
  // Wall: dark panels, gold trim and baseboard.
  g.fillStyle(shade(38),1).fillRect(x,y,w,wallH);
  for(let px=x+6;px<x+w-6;px+=30){g.fillStyle(shade(30),1).fillRect(px,y+14,24,wallH-26);
   g.fillStyle(shade(22),1).fillRect(px,y+14,24,2);}
  g.fillStyle(MENU_UI.oro,1).fillRect(x,y+8,w,3);g.fillStyle(MENU_UI.oroLuz,1).fillRect(x,y+8,w,1);
  g.fillStyle(shade(55),1).fillRect(x,fy-8,w,8);g.fillStyle(shade(20),1).fillRect(x,fy-8,w,1);
  // Two hanging banners in the type colour.
  for(const bx of [x+34,x+w-34]){
   g.fillStyle(MENU_UI.oroBorde,1).fillRect(bx-14,y+12,28,3);
   g.fillStyle(base.color,1).fillRect(bx-11,y+15,22,wallH-40);
   g.fillTriangle(bx-11,y+wallH-25,bx+11,y+wallH-25,bx,y+wallH-14);
   g.fillStyle(light(25),1).fillRect(bx-11,y+15,3,wallH-40);
   g.fillStyle(0xffffff,.9).fillCircle(bx,y+34,6);g.fillStyle(base.color,1).fillCircle(bx,y+34,3);
  }
  // Badge medallion in the middle of the wall.
  const mx=x+w/2,my=y+Math.round(wallH*.48);
  g.fillStyle(MENU_UI.contorno,1).fillCircle(mx,my,19);g.fillStyle(MENU_UI.oroBorde,1).fillCircle(mx,my,17);
  g.fillStyle(MENU_UI.oro,1).fillCircle(mx,my,15);g.fillStyle(shade(40),1).fillCircle(mx,my,12);
  if(stage<8&&this.textures.exists('torre2-frlg-badges'))
   this.add.image(mx,my,'torre2-frlg-badges',stage).setScale(1.4).setDepth(2.1);
  else originalBallSprite(this,mx,my,'pokeball',18,2.1);
  // Floor: light tiles with a battle-court outline and centre circle.
  // Floor colour: the type colour softened towards warm stone.
  const stone=C3.ValueToColor(0xd9d2c3),mix=t=>{const c=C3.Interpolate.ColorWithColor(base,stone,100,t);return C3.GetColor(c.r,c.g,c.b)};
  g.fillStyle(mix(62),1).fillRect(x,fy,w,h-wallH);
  for(let ty=fy;ty<y+h;ty+=14)for(let tx=x+((ty-fy)/14%2?7:0);tx<x+w;tx+=14)
   g.fillStyle(mix(50),1).fillRect(tx,ty,7,7);
  g.fillStyle(0x000000,.18).fillRect(x,fy,w,5);
  g.lineStyle(2,0xffffff,.55).strokeRect(x+16,fy+10,w-32,h-wallH-18);
  g.lineBetween(x+w/2,fy+10,x+w/2,y+h-8);
  g.strokeEllipse(x+w/2,fy+(h-wallH)/2+1,70,26);
  // Soft spotlight where the leader and the Pokémon stand.
  g.fillStyle(0xffffff,.10).fillEllipse(x+w/2,fy+(h-wallH)*.62,170,46);
  return g;
 }
 // Campaign background music: CC0 chiptune tracks (campaign-music/PROVENANCE).
 // One looping track at a time, kept across campaign screen restarts, volume
 // from the player's music setting (the global bus applies master/mute), and
 // stopped automatically as soon as the campaign scene is not running
 // (battles, title menu). The arena and its sounds are never touched.
 campaignMusic(track){
  const game=this.game,key=track&&'torre2-music-'+track;
  const music=()=>{const p=readAudioSettings();return p.muted?0:p.music};
  const current=game.__torre2Music;
  if(current&&game.__torre2MusicKey===key&&current.isPlaying)return;
  current?.stop();current?.destroy?.();game.__torre2Music=null;game.__torre2MusicKey=key||null;
  if(!key||music()<=0||!this.sound)return;
  const play=()=>{
   if(!this.scene.isActive()||game.__torre2MusicKey!==key||game.__torre2Music)return;
   try{const snd=this.sound.add(key,{loop:true,volume:music()});snd.play();game.__torre2Music=snd}catch{}
  };
  if(this.cache.audio.exists(key))play();
  else{
   this.load.once('filecomplete-audio-'+key,play);
   this.load.audio(key,['assets/audio/torre2-campaign/'+track+'.ogg','assets/audio/torre2-campaign/'+track+'.mp3']);
   if(!this.load.isLoading())this.load.start();
  }
  if(!game.__torre2MusicWatch){
   let frames=0;
   game.__torre2MusicWatch=()=>{
    const snd=game.__torre2Music;if(!snd)return;
    if(!game.scene.isActive('campanha')){snd.stop();snd.destroy?.();game.__torre2Music=null;game.__torre2MusicKey=null;return}
    if(++frames%60===0){const v=music();if(v<=0){snd.stop();snd.destroy?.();game.__torre2Music=null;game.__torre2MusicKey=null}else snd.setVolume?.(v)}
   };
   game.events.on('poststep',game.__torre2MusicWatch);
  }
 }
 // Short one-shot jingle (evolution), over the background music.
 campaignJingle(track){
  const key='torre2-music-'+track,p=readAudioSettings(),v=p.muted?0:p.music;
  if(v<=0||!this.sound)return;
  const play=()=>{try{this.sound.play(key,{volume:v})}catch{}};
  if(this.cache.audio.exists(key))play();
  else{this.load.once('filecomplete-audio-'+key,play);
   this.load.audio(key,['assets/audio/torre2-campaign/'+track+'.ogg','assets/audio/torre2-campaign/'+track+'.mp3']);
   if(!this.load.isLoading())this.load.start();}
 }
 // Neutral stage with one round battle-style platform; returns the ground y.
 stagePlatform(x,y,w,h,tint=0x3f7ad8){
  const fr=this.add.graphics().setDepth(3);
  nativeRect(fr,x,y,w,h,MENU_UI.contorno,7);
  const top=Phaser.Display.Color.ValueToColor(0x2a4a8c),bottom=Phaser.Display.Color.ValueToColor(0x0c1d46);
  for(let i=0;i<h-4;i++){
   const c=Phaser.Display.Color.Interpolate.ColorWithColor(top,bottom,100,Math.round(i/(h-5)*100));
   fr.fillStyle(Phaser.Display.Color.GetColor(c.r,c.g,c.b),1).fillRect(x+3,y+2+i,w-6,1);
  }
  const cx=x+w/2,ground=y+Math.round(h*.74),pw=Math.round(Math.min(w*.62,200)),ph=Math.round(pw*.21);
  fr.fillStyle(0xffffff,.06).fillCircle(cx,ground-Math.round(h*.3),Math.round(h*.3));
  fr.fillStyle(0xffffff,.04).fillCircle(cx,ground-Math.round(h*.3),Math.round(h*.22));
  nativeAro(fr,x-1,y-1,w+2,h+2,MENU_UI.panelBorde,6);
  const lite=Phaser.Display.Color.ValueToColor(tint).lighten(18).color;
  fr.fillStyle(0x061433,.9).fillEllipse(cx,ground+6,pw+8,ph+8);
  fr.fillStyle(tint,1).fillEllipse(cx,ground+2,pw,ph);
  fr.fillStyle(lite,1).fillEllipse(cx,ground,pw-18,ph-8);
  fr.lineStyle(2,0xffffff,.45).strokeEllipse(cx,ground,pw-18,ph-8);
  return {g:fr,cx,ground};
 }
 seekerBattery(x,y,charge){
  const g=this.add.graphics().setDepth(5);
  nativeRect(g,x,y,62,16,MENU_UI.contorno,4);nativeRect(g,x+62,y+4,4,8,MENU_UI.contorno,2);
  for(let i=0;i<3;i++)nativeRect(g,x+3+i*19,y+3,17,10,i<charge?0x50cc84:0x0a1638,2);
  return g;
 }
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
  this.screenBanner(20,300,'VS Seeker · Revanches','seeker');
  const charge=state.rematches?.charge||0;
  this.uiLabel(250,46,'Carga do VS Seeker',8,MENU_UI.suave,[1,.5]);
  this.seekerBattery(258,38,charge);
  this.uiLabel(334,46,charge+'/3 · revanches não dão insígnias',7,MENU_UI.tenue,[0,.5]);
  // Left: cities that already have rematches, with the owner's city art.
  this.uiSection(8,56,206,246);
  this.uiLabel(111,70,'Cidades',9,MENU_UI.amarillo,[.5,.5]);
  const tiles=this.add.graphics().setDepth(3);
  eligible.forEach((entry,i)=>{
   const x=16+(i%3)*64,y=80+Math.floor(i/3)*70,on=entry.stage===mapStage;
   nativeRect(tiles,x,y,60,64,on?MENU_UI.oro:MENU_UI.panelBorde,6);
   nativeRect(tiles,x+2,y+2,56,60,on?0x2a3f78:0x0a1a46,5);
   ownerArt(this,{add:o=>o.setDepth?.(4)},'city-'+(entry.stage>=8?'indigo':String(entry.name).toLowerCase()),x+4,y+4,52,40);
   estrechar(this.uiLabel(x+30,y+53,entry.name,7,on?MENU_UI.amarillo:'#ffffff',[.5,.5]),54);
   this.add.zone(x+30,y+32,60,64).setDepth(8).setInteractive({useHandCursor:true})
    .setData('torre2-rematch-map',entry.stage)
    .on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.rematchAtlasScreen(state,entry.stage,0)});
  });
  // Right: the trainers of the selected city, as cards with FireRed sprites.
  this.uiSection(220,56,412,246);
  this.uiLabel(234,70,(current?.name||'Kanto')+' · '+trainers.length+' treinadores',9,MENU_UI.amarillo);
  if(maxPage>0)this.uiLabel(618,70,'Página '+(page+1)+'/'+(maxPage+1),7,MENU_UI.tenue,[1,.5]);
  const cards=this.add.graphics().setDepth(3);
  trainers.slice(page*6,page*6+6).forEach((index,i)=>{
   const x=230+(i%2)*198,y=82+Math.floor(i/2)*70;
   const foe=rematchOpponent(state,index,mapStage);
   nativeRect(cards,x,y,192,64,MENU_UI.panelBorde,6);nativeRect(cards,x+2,y+2,188,60,0x0a1a46,5);
   nativeRect(cards,x+5,y+5,40,54,0x1d3c7a,5,.7);
   this.npcSprite(spriteIdForTrainer(trainerSpriteKind(mapStage,index)),x+25,y+58,1.6,5);
   estrechar(this.uiLabel(x+52,y+16,'#'+(index+1)+' · '+foe.name,8,'#ffffff'),132);
   this.uiLabel(x+52,y+31,'Nv '+foe.level,8,MENU_UI.suave);
   const dex=portraitId({id:foe.id}),key='torre2-portrait-'+dex;
   nativeRect(cards,x+152,y+24,32,32,TIPOS[(()=>{try{return buscar(foe.id).def.tipos[0]}catch{return ''}})()]??0x5f86bd,5,.55);
   requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',()=>{
    if(!cards.active)return;this.add.image(x+168,y+40,key).setDisplaySize(28,28).setDepth(6);
   });
   this.uiLabel(x+52,y+48,'Disponível',7,'#9ff0bf');
   this.add.zone(x+96,y+32,192,64).setDepth(8).setInteractive({useHandCursor:true})
    .setData('torre2-rematch-trainer',mapStage+':'+index)
    .on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.rematchScreen(state,index,mapStage)});
  });
  if(page>0)this.button(300,322,110,26,'◀ ANTERIOR',()=>
   this.rematchAtlasScreen(state,mapStage,page-1));
  if(page<maxPage)this.button(560,322,110,26,'PRÓXIMA ▶',()=>
   this.rematchAtlasScreen(state,mapStage,page+1));
  this.button(110,322,190,28,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
  this.__torre2RematchAtlas={mapStage,page,count:trainers.length,maps:eligible.map(m=>m.stage)};
 }
 rematchScreen(state,index,mapStage=state.stage){
  const foe=rematchOpponent(state,index,mapStage);if(!foe)return;
  this.children.removeAll(true);this.backdrop();
  this.screenBanner(20,300,'REVANCHE · '+foe.name,'seeker');
  this.uiSection(8,40,624,170);
  // The trainer and their Pokémon on the route, as in the gym challenge.
  // Neutral stage and one round platform under both figures (feet aligned).
  const st=this.stagePlatform(18,50,290,150);
  st.g.fillStyle(0x000000,.25).fillEllipse(st.cx-22,st.ground+1,40,8).fillEllipse(st.cx+24,st.ground+1,44,9);
  this.npcSprite(spriteIdForTrainer(trainerSpriteKind(mapStage,index)),st.cx-22,st.ground+2,3,5);
  // Feet on the same ground line as the trainer (measured from the sprite).
  this.pokemonIdleSprite(foe.id,st.cx+24,st.ground+2,96,5);
  const R=328;
  this.uiLabel(R,64,foe.name,13,MENU_UI.amarillo);
  this.uiLabel(R,84,'Mapa de '+(STAGES[mapStage]?.city||'Kanto')+' · equipe Nv '+foe.level,8,MENU_UI.suave);
  this.uiLabel(R,108,'VS Seeker',8,'#ffffff');
  this.seekerBattery(R+62,100,state.rematches?.charge||0);
  this.uiLabel(R+134,108,(state.rematches?.charge||0)+'/3',8,MENU_UI.amarillo);
  this.uiLabel(R,134,'Recarrega ao vencer 3 outras batalhas.',7,MENU_UI.tenue);
  this.uiLabel(R,150,'Não concede insígnias, TMs ou progresso da história.',7,MENU_UI.tenue);
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
    text(this,320,262,result.reason,{fontSize:'10px',color:C.gold}).setOrigin(.5).setDepth(9);
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
  this.uiSection(20,82,600,210,0x489eaa);
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
   kind:wild?'wild':currentOpponent(state)?.kind,
   leader:!wild&&state.trainer>=TRAINERS_PER_GYM(state.stage)};
  const party=createPartyMatch(state,foe,wild);
  match.torre2.party=party;
  if(!wild){
   const opponent=currentOpponent(state);
   if(opponent)match.torre2.versus=versusOpponentProfile({
    stage:state.stage,trainer:state.trainer,kind:opponent.kind,
    spriteKind:opponent.spriteKind,
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
  const shade=this.add.rectangle(320,180,640,360,0x020c17,.90).setDepth(610);
  this.__torre2GrassOverlay=shade;
  this.add.zone(320,180,640,360).setDepth(611).setInteractive();
  const panel=this.add.graphics().setDepth(612);
  nativeMarco(panel,22,16,596,328,'panel',{borde:MENU_UI.panelLuz});
  const close=()=>{
   const list=this.children.list.slice(start);
   list.forEach(obj=>obj.active&&obj.destroy());
   this.__torre2GrassOverlay=null;
   this.campaignMusic('town');
  };
  const label=(x,y,value,size=9,color='#ffffff',origin=[.5,.5])=>this.uiLabel(x,y,value,size,color,origin,620);
  const modalButton=(x,y,w,h,caption,callback,gold=false,icon=null)=>{
   const g=this.add.graphics().setDepth(622);
   nativeMarco(g,Math.round(x-w/2),Math.round(y-h/2),w,h,gold?'oro':'azul');
   if(icon)originalBallSprite(this,x-w/2+20,y,icon,18,624);
   textoMenu(this,x+(icon?10:0),y,caption,{tam:10,borde:gold?0:3,colorBorde:MENU_UI.bordeTexto,
    color:gold?MENU_UI.textoOscuro:'#ffffff'}).setOrigin(.5).setDepth(623);
   return this.add.zone(x,y,w,h).setDepth(630)
    .setInteractive({useHandCursor:true}).on('pointerdown',callback);
  };
  this.campaignMusic('route');
  const area=wildAvailability(state.stage);
  // Landscape header from the owner's journey art (top strip: forest/town).
  ownerArt(this,{add:o=>o.setDepth?.(613)},'journey-bg',32,26,576,84,null,.5,0);
  const head=this.add.graphics().setDepth(614);
  nativeAro(head,31,25,578,86,MENU_UI.panelBorde,6);
  head.fillStyle(0x061433,.55).fillRect(32,80,576,30);
  label(320,48,'Grama alta · '+area.label,15,MENU_UI.amarillo);
  label(320,94,area.area+'  ·  Encontros regionais (FireRed)',8,'#ffffff');
  // Green means genuinely caught (Pokédex), never merely available in grass.
  const caught=new Set(state.dexCaught||[]);
  const cards=this.add.graphics().setDepth(616);
  [...new Set(area.wild)].slice(0,12).forEach((id,i)=>{
   const x=40+(i%4)*141,y=120+Math.floor(i/4)*46;
   const owned=caught.has(id),available=area.available.includes(id);
   let types=[];try{const {def,etapa}=buscar(id);types=(etapa>0?def.evoluciones?.[etapa-1]?.tipos:def.tipos)||def.tipos||[]}catch{}
   nativeRect(cards,x,y,136,42,owned?0x50cc84:available?MENU_UI.panelBorde:MENU_UI.apagadoBorde,6);
   // Only recorded captures are highlighted (approved green vs navy tile).
   nativeRect(cards,x+1,y+1,134,40,owned?0x24553f:0x223345,5,available?1:.6);
   nativeRect(cards,x+6,y+6,30,30,TIPOS[types[0]]??0x5f86bd,5,available?.55:.3);
   const dex=grassPortraitDex(id),key=dex&&'torre2-portrait-'+dex;
   if(key&&this.textures.exists(key)){
    // Original PMD pixel portrait, with no silhouette substitution or VFX.
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    // Approved size (visual guard): the original 22 px PMD portrait.
    this.add.image(x+21,y+21,key).setDisplaySize(22,22).setAlpha(available?1:.55)
     .setDepth(619).setData('torre2-grass-sprite',id);
   }
   const nice=id.replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
   estrechar(this.uiLabel(x+44,y+13,nice,8,owned?'#d7ffda':available?'#ffffff':MENU_UI.tenue,[0,.5],620),72)
    .setData('torre2-grass-name',id);
   if(owned)originalBallSprite(this,x+126,y+11,'pokeball',11,621);
   if(available)types.slice(0,2).forEach((t,k)=>{pastillaTipo(cards,x+44+k*44,y+24,t,41,11);
    this.uiLabel(x+64+k*44,y+30,t[0]+t.slice(1).toLowerCase(),6,'#ffffff',[.5,.5],620)});
   else this.uiLabel(x+44,y+30,'Aparece mais tarde',7,MENU_UI.apagadoTexto,[0,.5],620);
  });
  label(320,262,'Encontros realizados: '+(state.wildEncountersStage||0)+' · sem limite',8,MENU_UI.amarillo);
  modalButton(174,292,224,30,'◀ VOLTAR AO MAPA',close);
  modalButton(466,292,224,30,'PROCURAR POKÉMON',()=>{
   let found;
   try{found=startWildEncounter(state);}
   catch(error){
    console.warn('Torre 2: wild encounter not saved',error);
    const notice=text(this,320,266,'ENCONTRO NÃO SALVO · TENTE NOVAMENTE',{
     fontSize:'11px',color:'#ff9d9d'
    }).setOrigin(.5).setDepth(625).setData('torre2-wild-save-error',true);
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
  },true,'pokeball');
 }
 // Pokémon Center: the city's real FireRed Center interior, the live team
 // with HP/status, and the native gold heal action. Heal/PC logic unchanged.
 centerInterior(state,x,y,w,h){
  // Every FireRed Pokémon Center interior is the same room. Some composite
  // sheets (Celadon, Saffron) place it at offsets the shared crop table gets
  // wrong, so the Center always uses the verified Viridian room.
  const loc='viridian',rect=ROOM_CROPS[loc].center;
  const key='frlg-location-'+loc,frame='torre2-center-'+loc;
  const nurseKey='frlg-npc-nurse';
  const draw=()=>{
   if(!this.scene.isActive()||!this.textures.exists(key))return;
   const tex=this.textures.get(key);if(!tex.has(frame))tex.add(frame,0,...rect);
   tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
   const k=Math.min(w/rect[2],h/rect[3]),dw=Math.round(rect[2]*k),dh=Math.round(rect[3]*k);
   const left=x+(w-dw)/2,topY=y+(h-dh)/2;
   this.add.image(x+w/2,y+h/2,key,frame).setDisplaySize(dw,dh)
    .setDepth(2).setData('torre2-center-interior',loc);
   // Nurse behind the counter (original FRLG overworld sprite).
   const nurse=()=>{
    if(!this.scene.isActive()||!this.textures.exists(nurseKey))return;
    const t=this.textures.get(nurseKey);if(!t.has('torre2-front'))t.add('torre2-front',0,0,0,16,32);
    t.setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.add.image(left+121*k,topY+50*k,nurseKey,'torre2-front').setOrigin(.5,1)
     .setScale(k).setDepth(2.5).setData('torre2-center-nurse',true);
    // Redraw the counter front over her feet, as in the original room.
    const counter='torre2-center-counter-'+loc;
    if(!tex.has(counter))tex.add(counter,0,rect[0]+64,rect[1]+44,114,16);
    this.add.image(left+64*k,topY+44*k,key,counter).setOrigin(0).setScale(k).setDepth(2.6);
   };
   if(this.textures.exists(nurseKey))nurse();
   else{
    this.load.once('filecomplete-image-'+nurseKey,nurse);
    this.load.image(nurseKey,'assets/ui/frlg/npc/nurse.png');
    if(!this.load.isLoading())this.load.start();
   }
  };
  if(this.textures.exists(key))return draw();
  this.load.once('filecomplete-image-'+key,draw);
  this.load.image(key,'assets/ui/frlg/'+loc+'.png');
  if(!this.load.isLoading())this.load.start();
 }
 centerScreen(state){
  this.__torre2CenterBusy=false;
  this.children.removeAll(true);this.backdrop();
  text(this,320,20,'CENTRO POKÉMON',{...titleStyle,fontSize:'22px'}).setOrigin(.5);
  // Left: the Center itself, with the nurse's welcome.
  this.uiSection(14,40,300,262,0x50a3a4);
  const frame=this.add.graphics().setDepth(1);
  nativeRect(frame,24,50,280,176,0x081436,5);
  this.centerInterior(state,26,52,276,172);
  nativeAro(frame,23,49,282,178,MENU_UI.oro,6);
  const city=STAGES[state.stage]?.city||'Kanto';
  textoMenu(this,164,236,'Centro Pokémon de '+city,{tam:9,color:MENU_UI.amarillo,borde:3,
   colorBorde:MENU_UI.bordeTexto,literal:true}).setOrigin(.5).setDepth(5);
  textoMenu(this,164,256,'Bem-vindo! Posso cuidar dos seus',{tam:8,color:'#ffffff',borde:3,
   colorBorde:MENU_UI.bordeTexto,literal:true}).setOrigin(.5).setDepth(5);
  textoMenu(this,164,272,'Pokémon. É de graça!',{tam:8,color:'#ffffff',borde:3,
   colorBorde:MENU_UI.bordeTexto,literal:true}).setOrigin(.5).setDepth(5);
  // Right: live team (portrait, level, HP bar and status).
  this.uiSection(324,40,302,262,0x50a3a4);
  textoMenu(this,338,58,'Sua equipe',{tam:10,color:'#ffffff',borde:3,colorBorde:MENU_UI.bordeTexto,literal:true})
   .setOrigin(0,.5).setDepth(5);
  const hurt=state.team.filter(m=>(Number(m.hp??100)<100)||m.status?.kind).length;
  textoMenu(this,612,58,hurt?hurt+' precisa(m) de cura':'Todos saudáveis',{tam:8,
   color:hurt?MENU_UI.amarillo:'#9ff0bf',borde:3,colorBorde:MENU_UI.bordeTexto,literal:true})
   .setOrigin(1,.5).setDepth(5);
  const rows=this.add.graphics().setDepth(3);
  for(let i=0;i<6;i++){
   const m=state.team[i],ry=72+i*37;
   nativeRect(rows,334,ry,282,33,0x0a1a46,5,.75);
   if(!m)continue;
   this.drawPortrait(m,352,ry+16,26,5);
   const hp=Math.max(0,Math.min(100,Number(m.hp??100)||0));
   const status=statusLabel({est:{[m.status?.kind]:true}});
   textoMenu(this,372,ry+9,m.id.replace(/-/g,' ').toUpperCase(),{tam:8,color:'#ffffff',borde:3,
    colorBorde:MENU_UI.bordeTexto}).setOrigin(0,.5).setDepth(5);
   textoMenu(this,606,ry+9,'NV '+(m.level??m.progression?.level??'?'),{tam:8,color:MENU_UI.suave,borde:3,
    colorBorde:MENU_UI.bordeTexto}).setOrigin(1,.5).setDepth(5);
   nativeRect(rows,372,ry+18,170,7,MENU_UI.contorno,3);
   if(hp>0)rows.fillStyle(hp>50?0x50cc84:hp>20?0xf2c34b:0xe85050,1)
    .fillRect(373,ry+19,Math.max(1,Math.round(168*hp/100)),5);
   textoMenu(this,606,ry+22,hp<=0?'KO':status||Math.round(hp)+'%',{tam:8,
    color:hp<=0?'#ff8f8f':status?'#ffd47a':'#d8e6ff',borde:3,colorBorde:MENU_UI.bordeTexto})
    .setOrigin(1,.5).setDepth(5);
  }
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
  this.button(475,330,300,38,'CURAR POKÉMON',beginHeal,true)
   .setData('torre2-center-heal',true);
  pixelIcon(this,{add:o=>o.setDepth(9)},'heal',350,330,2);
  this.button(244,330,144,32,'ABRIR PC',()=>this.pcScreen(state))
   .setData('torre2-center-pc',true);
  this.button(88,330,148,32,'◀ VOLTAR',()=>this.scene.restart())
   .setData('torre2-center-back',true);
 }
 martScreen(state,page=0,errorText=''){
  this.children.removeAll(true);this.backdrop();
  this.screenBanner(20,240,'POKÉ MART','shop');
  const top=this.add.graphics().setDepth(4);
  nativeMarco(top,512,8,118,28,'panel',{borde:MENU_UI.oro});
  originalBallSprite(this,530,22,'pokeball',14,6);
  this.uiLabel(620,22,'₽ '+Number(state.money||0).toLocaleString('pt-BR'),10,MENU_UI.amarillo,[1,.5]);
  // Left: the FireRed clerk behind the counter, with a greeting.
  this.uiSection(8,40,180,250,0x478dbb);
  const shop=this.add.graphics().setDepth(3);
  nativeRect(shop,16,48,164,46,MENU_UI.contorno,7);nativeRect(shop,18,50,160,42,0xf4f1e6,6);
  shop.fillStyle(0xf4f1e6,1).fillTriangle(86,92,100,92,93,102);
  // Dark text on the light speech bubble: no outline (it smudged the letters).
  textoMenu(this,98,64,'Bem-vindo!',{tam:9,color:MENU_UI.textoOscuro,borde:0,literal:true}).setOrigin(.5).setDepth(4);
  textoMenu(this,98,79,'Em que posso ajudar?',{tam:7,color:'#36507a',borde:0,literal:true}).setOrigin(.5).setDepth(4);
  shop.fillStyle(0x7fb2e8,.35).fillRect(16,110,164,92);
  for(let sx=22;sx<176;sx+=26)shop.fillStyle(0x5b8bc8,.55).fillRect(sx,116,20,30);
  this.npcSprite('clerk',98,214,3.2,5);
  const counter=this.add.graphics().setDepth(6);
  nativeRect(counter,16,196,164,30,0x1f3f7a,5);nativeRect(counter,16,196,164,8,0x6c9fe8,4);
  counter.fillStyle(0xffffff,.25).fillRect(20,197,156,1);
  pixelIcon(this,{add:o=>o.setDepth(7)},'shop',98,252,2);
  this.uiLabel(98,276,'Poké Mart de '+(STAGES[state.stage]?.city||'Kanto'),7,MENU_UI.suave,[.5,.5],7);
  // Right: six items per page as cards (original FRLG icon at native size).
  this.uiSection(194,40,438,250,0x478dbb);
  const items=MART_ITEMS.filter(i=>martItemUnlocked(state,i));
  const count=Math.max(1,Math.ceil(items.length/6));
  const pageNum=Math.min(count-1,Math.max(0,page));
  const inv=state.inventory||{};
  const cards=this.add.graphics().setDepth(3);
  items.slice(pageNum*6,(pageNum+1)*6).forEach((item,i)=>{
   const x=203+(i%3)*143,y=49+Math.floor(i/3)*120;
   const afford=state.money>=item.price;
   nativeRect(cards,x,y,138,114,afford?MENU_UI.panelBorde:0x5a3a52,7);
   nativeRect(cards,x+2,y+2,134,110,0x0a1a46,6);
   nativeRect(cards,x+50,y+8,38,38,MENU_UI.contorno,6);nativeRect(cards,x+52,y+10,34,34,0x1d3c7a,5);
   const art=this.add.image(x+69,y+27,shopItemSprite(this,item));
   // Original FRLG indexed icon at its native pixel resolution (no serrated
   // fractional upscaling), with GBA palette-zero transparency preserved.
   const w=art.frame?.width||24,h=art.frame?.height||24;
   art.setDisplaySize(Math.min(28,w),Math.min(28,h)).setDepth(5)
    .setData('torre2-mart-item-sprite',item.id);
   estrechar(this.uiLabel(x+69,y+56,item.name,8,'#ffffff',[.5,.5]),128);
   this.uiLabel(x+69,y+70,'₽ '+Number(item.price).toLocaleString('pt-BR'),9,afford?MENU_UI.amarillo:'#ff9daa',[.5,.5]);
   const owned=item.kind==='tm'?(inv.tms||[]).includes(item.id)?'Na bolsa':'TM':'Na bolsa: ×'+(inv[item.id]||0);
   this.uiLabel(x+69,y+83,owned,7,MENU_UI.tenue,[.5,.5]);
   this.button(x+69,y+100,112,20,'COMPRAR',()=>{
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
   },afford,8).setData('torre2-mart-buy',item.id);
  });
  this.button(140,320,177,30,'◀ MAPA',()=>this.scene.restart());
  this.button(346,320,205,30,'ITENS '+(pageNum+1)+'/'+count,()=>this.martScreen(state,(pageNum+1)%count),true);
  this.button(543,320,176,30,'BOLSA / TM',()=>this.bagScreen(state)).setData('torre2-mart-bag',true);
  const notice=text(this,412,298,errorText||state.lastMessage||'Compre Poké Balls, poções e TMs',{
   fontSize:'10px',color:errorText?'#ff9d9d':C.gold,
   wordWrap:{width:420}}).setOrigin(.5).setDepth(7);
  if(errorText)notice.setData('torre2-mart-save-error',true);
 }
 // --- Native-kit helpers shared by EQUIPE / BOLSA / CENTRO (presentation only).
 uiLabel(x,y,value,size=9,color='#ffffff',origin=[0,.5],depth=6){
  return textoMenu(this,x,y,value,{tam:size,color,borde:size>=10?4:3,
   colorBorde:MENU_UI.bordeTexto,literal:true}).setOrigin(...origin).setDepth(depth);
 }
 screenBanner(y,w,title,icon){
  // The banner grows with its title so the side icons never cover the text.
  const label=this.uiLabel(320,y,title,15,MENU_UI.amarillo,[.5,.5]);
  w=Math.max(w,Math.ceil(label.displayWidth)+76);
  const g=this.add.graphics().setDepth(4);
  nativeMarco(g,320-w/2,y-15,w,30,'panel',{borde:MENU_UI.panelLuz});
  const layer={add:o=>o.setDepth(6)};
  pixelIcon(this,layer,icon,320-w/2+20,y,1.5);pixelIcon(this,layer,icon,320+w/2-20,y,1.5);
  return label;
 }
 memberInfo(member){
  let types=[],name=member.id;
  try{const s=pokemonStats(member);types=s.types||[];name=s.name||name}
  catch{try{const {def,etapa}=buscar(member.id);const st=etapa>0?def.evoluciones?.[etapa-1]:def;
   types=st?.tipos||def.tipos||[];name=st?.nombre||def.nombre||name}catch{}}
  const hp=Math.round(Math.max(0,Math.min(100,Number(member.hp??100)||0)));
  const status=statusLabel({est:{[member.status?.kind]:true}});
  const condition=hp===0?'Desmaiado':status||(member.confusion?'Confusão':'Pronto');
  const tone=hp===0?'#ff8f8f':status||member.confusion?'#ffd47a':'#9ff0bf';
  const nice=String(name).replace(/-/g,' ').toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase());
  return {types,name:nice,hp,condition,tone,
   level:member.progression?.level??member.level??'?'};
 }
 hpBar(g,x,y,w,hp,h=6){
  nativeRect(g,x,y,w,h,MENU_UI.contorno,3);
  if(hp>0)g.fillStyle(hp>50?0x50cc84:hp>20?0xf2c34b:0xe85050,1)
   .fillRect(x+1,y+1,Math.max(1,Math.round((w-2)*hp/100)),h-2);
 }
 portraitFrame(g,member,x,y,size,types=[]){
  // Type-tinted "habitat" window behind the PMD portrait.
  const col=TIPOS[types[0]]??0x5f86bd;
  nativeRect(g,x-1,y-1,size+2,size+2,MENU_UI.contorno,6);
  nativeRect(g,x,y,size,size,col,5,.55);
  g.fillStyle(0x061433,.35).fillRect(x+2,y+Math.round(size*.62),size-4,Math.round(size*.34));
  g.fillStyle(0xffffff,.28).fillRect(x+4,y+2,size-8,1);
  this.drawPortrait(member,x+size/2,y+size/2,size-6,6);
 }
 // Same type-tinted window, but with the animated full-body PMD sprite
 // (as in battle) standing inside it; the portrait is the fallback.
 animatedFrame(g,member,x,y,size,types=[]){
  const col=TIPOS[types[0]]??0x5f86bd;
  nativeRect(g,x-1,y-1,size+2,size+2,MENU_UI.contorno,6);
  nativeRect(g,x,y,size,size,col,5,.55);
  g.fillStyle(0x061433,.35).fillRect(x+2,y+Math.round(size*.62),size-4,Math.round(size*.34));
  g.fillStyle(0xffffff,.28).fillRect(x+4,y+2,size-8,1);
  g.fillStyle(0x000000,.25).fillEllipse(x+size/2,y+size-8,size*.6,6);
  if(!this.pokemonIdleSprite(member.id,x+size/2,y+size-7,size-6,6))
   this.drawPortrait(member,x+size/2,y+size/2,size-6,6);
 }
 teamScreen(state){
  // EQUIPE is a full roster, not a shortcut to the active Pokémon's summary.
  this.__torre2SummaryFromTeam=false;
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  this.screenBanner(22,300,'Minha equipe · '+state.team.length+'/6','team')
   .setData('torre2-team-overview',true);
  this.uiLabel(320,49,'Toque em um Pokémon para ver o sumário',8,MENU_UI.suave,[.5,.5]);
  const CW=198,CH=114,G=10,X0=320-(3*CW+2*G)/2;
  this.uiSection(X0-6,56,3*CW+2*G+12,2*CH+20);
  for(let i=0;i<6;i++){
   const member=state.team[i],x=X0+(i%3)*(CW+G),y=62+Math.floor(i/3)*(CH+8);
   const active=i===state.active;
   const g=this.add.graphics().setDepth(3);
   if(!member){
    nativeMarco(g,x,y,CW,CH,'panel',{alfa:.55});
    originalBallSprite(this,x+CW/2,y+CH/2-8,'pokeball',22,5).setAlpha(.35);
    this.uiLabel(x+CW/2,y+CH/2+18,'Espaço livre',8,MENU_UI.tenue,[.5,.5]);
    continue;
   }
   const info=this.memberInfo(member);
   nativeMarco(g,x,y,CW,CH,'panel',active?{borde:MENU_UI.oro}:{});
   if(active)nativeAro(g,x-2,y-2,CW+4,CH+4,MENU_UI.oro,8,.9);
   this.animatedFrame(g,member,x+8,y+10,64,info.types);
   // Slot number medal.
   nativeRect(g,x+4,y+6,18,14,active?MENU_UI.oro:MENU_UI.panelBorde,4);
   this.uiLabel(x+13,y+13,String(i+1),8,active?MENU_UI.textoOscuro:'#ffffff',[.5,.5],7);
   estrechar(this.uiLabel(x+80,y+16,info.name,11,active?MENU_UI.amarillo:'#ffffff'),72);
   this.uiLabel(x+CW-9,y+16,'Nv '+info.level,9,MENU_UI.suave,[1,.5]);
   info.types.slice(0,2).forEach((t,k)=>{
    pastillaTipo(g,x+80+k*55,y+29,t,52,13);
    this.uiLabel(x+106+k*55,y+36,t[0]+t.slice(1).toLowerCase(),8,'#ffffff',[.5,.5],7);
   });
   this.uiLabel(x+80,y+56,'HP',8,MENU_UI.suave);
   this.hpBar(g,x+96,y+53,CW-140,info.hp);
   this.uiLabel(x+CW-9,y+56,info.hp+'%',8,info.hp===0?'#ff8f8f':'#ffffff',[1,.5]);
   // Bottom rail: condition + lead tag.
   nativeRect(g,x+6,y+CH-30,CW-12,22,0x081436,5,.85);
   this.uiLabel(x+14,y+CH-19,info.condition,8,info.tone);
   if(active){
    nativeRect(g,x+CW-92,y+CH-27,84,16,MENU_UI.oro,4);
    estrechar(this.uiLabel(x+CW-50,y+CH-19,'Na frente',7,MENU_UI.textoOscuro,[.5,.5],7),76);
   }
   const tile=this.add.rectangle(x+CW/2,y+CH/2,CW,CH,0x000000,0).setDepth(8)
    .setInteractive({useHandCursor:true})
    .setData('torre2-team-overview-slot',i);
   tile.on('pointerdown',(_p,_x,_y,event)=>{
    event?.stopPropagation?.();
    this.__torre2SummaryFromTeam=true;
    this.showSummary(state,i);
   });
  }
  this.uiLabel(320,309,'No sumário, escolha quem entra primeiro na batalha',8,MENU_UI.tenue,[.5,.5]);
  this.button(320,334,250,30,'◀ VOLTAR AOS CARDS',()=>{
   this.renderCampaign(state);
  }).setData('torre2-team-overview-back',true);
 }
 bagScreen(state,errorText=''){
  this.children.removeAll(true);this.backdrop();
  const inv=state.inventory||{};
  const target=Math.max(0,Math.min(state.team.length-1,
   Number.isInteger(this.bagMemberIndex)?this.bagMemberIndex:state.active));
  this.bagMemberIndex=target;
  this.screenBanner(22,220,'Bolsa','bag');
  // Money chip.
  const top=this.add.graphics().setDepth(4);
  nativeMarco(top,512,8,118,28,'panel',{borde:MENU_UI.oro});
  originalBallSprite(this,530,22,'pokeball',14,6);
  this.uiLabel(620,22,'₽ '+Number(state.money||0).toLocaleString('pt-BR'),10,MENU_UI.amarillo,[1,.5]);
  // Left pocket: inventory with the original FRLG item icons.
  const L=this.add.graphics().setDepth(3);
  this.uiSection(10,44,190,262);
  pixelIcon(this,{add:o=>o.setDepth(6)},'bag',34,58,1.4);
  this.uiLabel(112,58,'Itens',10,MENU_UI.amarillo,[.5,.5]);
  const statusIds=MART_ITEMS.filter(i=>i.kind==='status').map(i=>i.id);
  const pocket=[
   ['pokeball','Poké Ball'],['greatball','Great Ball'],['ultraball','Ultra Ball'],
   ['potion','Poção'],['superpotion','Super Poção'],
   ['status','Remédios',statusIds.reduce((n,id)=>n+(inv[id]||0),0)]];
  pocket.forEach(([id,name,count],k)=>{
   const y=72+k*37,n=count??(inv[id]||0);
   nativeRect(L,18,y,174,32,n?0x0a1a46:0x081232,5,n?.85:.6);
   const item=MART_ITEMS.find(i=>i.id===(id==='status'?'fullheal':id));
   if(item)this.add.image(36,y+16,shopItemSprite(this,item)).setDisplaySize(24,24).setDepth(6).setAlpha(n?1:.45);
   this.uiLabel(54,y+16,name,9,n?'#ffffff':MENU_UI.tenue);
   this.uiLabel(184,y+16,'×'+n,10,n?MENU_UI.amarillo:MENU_UI.tenue,[1,.5]);
  });
  // Right pocket: who receives the item, then actions and TMs.
  const R=this.add.graphics().setDepth(3);
  this.uiSection(208,44,422,262);
  this.uiLabel(220,58,'Usar em',10,MENU_UI.amarillo);
  this.button(584,58,80,20,'SUMÁRIO',()=>this.showSummary(state,target),false,8);
  state.team.slice(0,6).forEach((member,i)=>{
   const x=216+(i%3)*138,y=70+Math.floor(i/3)*44,chosen=i===target;
   const info=this.memberInfo(member);
   const g=this.add.graphics().setDepth(4);
   nativeRect(g,x,y,132,40,chosen?MENU_UI.oro:MENU_UI.panelBorde,6);
   nativeRect(g,x+2,y+2,128,36,chosen?0x2a3f78:0x0a1a46,5);
   this.portraitFrame(g,member,x+5,y+5,30,info.types);
   estrechar(this.uiLabel(x+40,y+12,info.name,8,chosen?MENU_UI.amarillo:'#ffffff'),56);
   this.uiLabel(x+127,y+12,'Nv '+info.level,7,MENU_UI.suave,[1,.5]);
   this.hpBar(g,x+40,y+22,64,info.hp,5);
   this.uiLabel(x+127,y+25,info.hp===0?'KO':info.condition==='Pronto'?info.hp+'%':info.condition,7,info.tone,[1,.5]);
   const hit=this.add.rectangle(x+66,y+20,132,40,0x000000,0).setDepth(8)
    .setInteractive({useHandCursor:true});
   hit.on('pointerdown',()=>{
    this.bagMemberIndex=i;this.bagScreen(state);
   });
  });
  const heal=(kind,label)=>()=>{
   try{
    const result=usePotion(state,kind,target);
    if(!result.ok)state.lastMessage=result.reason;
    this.bagScreen(state);
   }catch(error){
    console.warn('Torre 2: '+label+' not saved',error);
    this.bagScreen(state,'ITEM NÃO SALVO · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
   }
  };
  this.button(286,176,138,30,'POÇÃO +25 HP',heal('potion','Potion'),true,9)
   .setData('torre2-bag-use','potion');
  this.button(430,176,138,30,'SUPER +60 HP',heal('superpotion','Super Potion'),true,9)
   .setData('torre2-bag-use','superpotion');
  this.button(565,176,118,30,'REMÉDIOS',()=>this.statusMedicineScreen(state,target),false,9)
   .setData('torre2-status-medicine-open',true);
  R.fillStyle(MENU_UI.panelBorde,1).fillRect(216,197,406,1);
  const tms=inv.tms||[];
  const pages=Math.max(1,Math.ceil(tms.length/3));
  this.bagTmPage=Math.max(0,Math.min(pages-1,this.bagTmPage||0));
  const who=this.memberInfo(state.team[target]).name;
  if(tms.length)estrechar(this.uiLabel(220,211,'Ensinar TM para '+who,9,MENU_UI.amarillo),300);
  else this.uiLabel(220,211,'Nenhuma TM ainda. Compre na Loja.',9,MENU_UI.tenue);
  if(pages>1)this.button(578,211,92,20,
   'TM '+(this.bagTmPage+1)+'/'+pages+'  ›',()=>{
    this.bagTmPage=(this.bagTmPage+1)%pages;this.bagScreen(state);
   },false,8);
  tms.slice(this.bagTmPage*3,this.bagTmPage*3+3).forEach((id,i)=>{
   const item=MART_ITEMS.find(x=>x.id===id);
   if(!item)return;
   const compatible=!Array.isArray(item.compatible)||
    item.compatible.includes(state.team[target].id);
   const cx=285+i*138;
   const caption=compatible?item.name:item.name.split(' ')[0]+' · NÃO APRENDE';
   this.button(cx,244,132,32,caption,()=>{
    try{
     const result=teachTM(state,id,target);
     if(!result.ok)state.lastMessage=result.reason;
     this.bagScreen(state);
    }catch(error){
     console.warn('Torre 2: TM teaching not saved',error);
     this.bagScreen(state,'TM NÃO SALVA · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
    }
   },compatible,8,null,32).setData('torre2-bag-teach-tm',id);
   this.add.image(cx-50,244,shopItemSprite(this,item)).setDisplaySize(22,22).setDepth(9)
    .setAlpha(compatible?1:.5).setData('torre2-bag-tm-sprite',id);
  });
  if(errorText||state.lastMessage){
   const notice=text(this,419,284,(errorText||state.lastMessage).slice(0,100),{
    fontSize:'9px',color:errorText?'#ff9d9d':C.gold,
    wordWrap:{width:400}}).setOrigin(.5).setDepth(6);
   if(errorText)notice.setData('torre2-bag-save-error',true);
  }
  this.button(320,334,230,28,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
 }
 statusMedicineScreen(state,target,errorText=''){
  this.children.removeAll(true);this.backdrop();
  const member=state.team[target];
  const info=this.memberInfo(member);
  this.screenBanner(20,300,'Remédios de status','bag');
  // Who is being treated, with the problem highlighted.
  this.uiSection(8,42,624,62);
  const top=this.add.graphics().setDepth(3);
  this.portraitFrame(top,member,18,48,50,info.types);
  this.uiLabel(78,62,info.name,12,MENU_UI.amarillo);
  this.uiLabel(78,80,'Nv '+info.level,8,MENU_UI.suave);
  this.hpBar(top,124,77,150,info.hp);
  this.uiLabel(282,80,info.hp+'%',8,'#ffffff');
  const status=statusLabel({est:{[member.status?.kind]:true}})||(member.confusion?'CONFUSÃO':'SEM STATUS');
  const problem=member.hp<=0?'DESMAIADO':status,healthy=problem==='SEM STATUS';
  nativeRect(top,420,58,200,30,healthy?0x1b5a3a:0x6b2430,6);
  this.uiLabel(520,73,healthy?'Sem problemas de status':'Problema: '+problem,9,healthy?'#9ff0bf':'#ffd0d0',[.5,.5]);
  // Six remedies with their original FireRed item sprites.
  this.uiSection(8,108,624,190);
  MART_ITEMS.filter(i=>i.kind==='status').forEach((item,i)=>{
   const x=114+(i%3)*206,y=140+Math.floor(i/3)*76,n=state.inventory[item.id]||0;
   const helps=item.cures.includes(member.status?.kind)||(item.cureConfusion&&member.confusion);
   const g=this.add.graphics().setDepth(2);
   nativeRect(g,x-98,y-26,196,68,helps&&n?MENU_UI.oro:MENU_UI.panelBorde,7);
   nativeRect(g,x-96,y-24,192,64,0x0a1a46,6);
   this.button(x+18,y-6,150,28,item.name+' ×'+n,()=>{
    try{
     const result=useStatusCure(state,item.id,target);
     if(!result.ok)state.lastMessage=result.reason;
     this.statusMedicineScreen(state,target);
    }catch(error){
     console.warn('Torre 2: Status medicine not saved',error);
     this.statusMedicineScreen(state,target,
      'REMÉDIO NÃO SALVO · ARMAZENAMENTO BLOQUEADO · TENTE NOVAMENTE');
    }
   },helps&&n>0,8).setData('torre2-status-medicine',item.id);
   this.add.image(x-76,y-4,shopItemSprite(this,item)).setDisplaySize(28,28).setDepth(9).setAlpha(n?1:.45)
    .setData('torre2-status-medicine-sprite',item.id);
   this.uiLabel(x,y+22,item.cureConfusion?'Cura todos os status e confusão':'Cura '+statusLabel({est:{[item.cures[0]]:true}}),
    7,helps?'#9ff0bf':MENU_UI.tenue,[.5,.5]);
  });
  const notice=text(this,320,306,errorText||state.lastMessage||
   'Selecione o remédio para este Pokémon.',{
   fontSize:'10px',color:errorText?'#ff9d9d':C.gold,wordWrap:{width:570}}).setOrigin(.5);
  if(errorText)notice.setData('torre2-status-save-error',true);
  this.button(175,334,260,28,'◀ VOLTAR À BOLSA',()=>this.bagScreen(state)).setData('torre2-status-medicine-back',true);
  this.button(465,334,260,28,'POKÉ MART',()=>this.martScreen(state));
 }
 showSummary(state,index,slot=0,page=0){
  // Game-native Phaser UI: clear hierarchy, 4 visible attack slots, large
  // touch targets, instant type filtering and search for Mewtwo's large pool.
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  this.uiSection(8,53,624,283,0x4e92bc);
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
  // Native-kit look for every summary panel: rounded pixel frame drawn in a
  // Graphics layer under an (invisible) Rectangle that keeps the original
  // input, depth, hover (setFillStyle) and data contract unchanged.
  const box=(x,y,w,h,fill=0x14243b,stroke=0x375371)=>{
   const g=this.add.graphics();
   const r=Math.max(1,Math.min(6,Math.floor(h/2)));
   const paint=f=>{
    g.clear();
    if(h<12){nativeRect(g,x,y,w,h,MENU_UI.contorno,r);nativeRect(g,x+1,y+1,w-2,h-2,f,Math.max(1,r-1));return}
    nativeRect(g,x,y,w,h,MENU_UI.contorno,r);
    nativeRect(g,x+1,y+1,w-2,h-2,stroke,Math.max(1,r-1));
    nativeRect(g,x+2,y+2,w-4,h-4,f,Math.max(1,r-2));
    g.fillStyle(0xffffff,.08).fillRect(x+r+2,y+3,Math.max(0,w-2*r-4),1);
   };
   paint(fill);
   const rect=this.add.rectangle(x+w/2,y+h/2,w,h,0x000000,.001);
   const setDepth=rect.setDepth.bind(rect);
   rect.setDepth=d=>{g.setDepth(d-.01);return setDepth(d)};
   rect.setFillStyle=f=>{paint(f);return rect};
   rect.once('destroy',()=>g.destroy());
   return rect;
  };
  // Native Cifras font; captions are kept literally (tests read them).
  const label=(x,y,caption,color='#dceaff',size=11)=>textoMenu(this,x,y,String(caption),{
   tam:Math.max(7,Math.round(size*.82)),color,borde:size>=12?4:3,colorBorde:MENU_UI.bordeTexto,literal:true})
   .setDepth(16);
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
  button(494,13,108,27,this.__torre2SummaryFromTeam?'◀ EQUIPE':'◀ CAMPANHA',()=>{
   const backToTeam=this.__torre2SummaryFromTeam===true;
   this.__torre2SummaryFromTeam=false;
   this.summaryFilter='ALL';this.summarySearch='';this.summaryWarning=null;
   this.summaryView='moves';
   if(backToTeam)this.teamScreen(state);
   else this.renderCampaign(state);
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
  // Animated full-body sprite (as in battle); the PMD portrait is the fallback.
  const floor=this.add.graphics().setDepth(17);floor.fillStyle(0x000000,.3).fillEllipse(66,175,50,8);
  if(!this.pokemonIdleSprite(member.id,66,176,74,18)){
   if(this.textures.exists(key))portrait();
   else{
    this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
    this.load.once('complete',portrait);
    if(!this.load.isLoading())this.load.start();
   }
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
   const backToTeam=this.__torre2SummaryFromTeam===true;
   this.__torre2SummaryFromTeam=false;
   this.summaryFilter='ALL';this.summarySearch='';this.summaryView='moves';
   if(backToTeam)this.teamScreen(state);
   else this.renderCampaign(state);
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
 pcRow(member,cx,cy,w,{selected=false,active=false,onTap,dataKey,dataValue}){
  const x=Math.round(cx-w/2),y=Math.round(cy-14),h=29;
  const info=this.memberInfo(member);
  const g=this.add.graphics().setDepth(4);
  nativeRect(g,x,y,w,h,selected?MENU_UI.oro:MENU_UI.panelBorde,6);
  nativeRect(g,x+1,y+1,w-2,h-2,selected?0x2a3f78:0x0a1a46,5);
  // Portrait window (original PMD portrait, loaded on demand).
  const col=TIPOS[info.types[0]]??0x5f86bd;
  nativeRect(g,x+3,y+2,25,25,col,4,.55);
  originalBallSprite(this,x+15,y+15,'pokeball',10,5).setAlpha(.5);
  const key=portraitKey(member);
  requestCardPortrait(this,key,'assets/pmd/'+portraitId(member)+'/portrait.png',()=>{
   if(!g.active)return; // A late request must not paint another screen.
   this.add.image(x+15,y+15,key).setDisplaySize(23,23).setDepth(7);
  });
  const name=(active?'◆ ':'')+info.name+(member.shiny?' ✦':'');
  estrechar(this.uiLabel(x+34,y+10,name,8,selected||active?MENU_UI.amarillo:'#ffffff'),w-104);
  this.uiLabel(x+w-8,y+10,'Nv '+info.level,7,MENU_UI.suave,[1,.5]);
  this.hpBar(g,x+34,y+18,w-110,info.hp,5);
  this.uiLabel(x+w-8,y+21,info.hp===0?'KO':info.condition==='Pronto'?info.hp+'%':info.condition,7,info.tone,[1,.5]);
  const zone=this.add.zone(cx,cy,w,Math.max(h,27)).setDepth(8)
   .setInteractive({useHandCursor:true}).setData(dataKey,dataValue)
   .setData('torre2-pc-caption',pcMemberLabel(member,{active,selected}));
  let last=-Infinity;
  zone.on('pointerdown',(_p,_x,_y,event)=>{
   event?.stopPropagation?.();
   const now=Date.now();if(now-last<190)return;last=now;onTap();
  });
  return zone;
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
  this.screenBanner(20,260,'PC de armazenamento','team');
  this.button(588,20,90,24,'◀ VOLTAR',()=>{
   this.pcSelected=null;this.__torre2PcNotice=null;this.scene.restart()
  },false,8);
  // Two native panels with the same grid: header, a tab/hint row, 6 rows.
  this.uiSection(8,40,312,250);this.uiSection(324,40,308,250);
  const ROW=i=>98+i*34,TEAM_X=164,TEAM_W=290,BOX_X=478,BOX_W=290;
  this.uiLabel(22,55,'Equipe · '+state.team.length+'/6',10,MENU_UI.amarillo);
  this.uiLabel(22,75,Number.isInteger(this.pcSelected)?'Selecionado: toque num Pokémon da caixa para trocar':
   'Toque num Pokémon para selecionar',7,MENU_UI.tenue);
  this.uiLabel(338,55,'Caixa · '+boxView.total+' Pokémon'+(boxView.shiny?' · ✦ '+boxView.shiny:''),10,MENU_UI.amarillo);
  // Filter tabs sit under the box header, never over the rows.
  for(const [i,filter] of PC_FILTERS.entries()){
   const buttonLabel={ALL:'TODOS',SHINY:'✦ SHINY',KO:'KO',STATUS:'STATUS'}[filter];
   this.button(371+i*71,75,67,19,buttonLabel,()=>{
    this.pcFilter=filter;this.__torre2PcNotice=null;this.pcScreen(state,0);
   },boxView.filter===filter,7).setData('torre2-pc-filter',filter);
  }
  const empty=this.add.graphics().setDepth(3);
  for(let i=0;i<6;i++){
   if(!state.team[i]){nativeRect(empty,TEAM_X-TEAM_W/2,ROW(i)-14,TEAM_W,29,0x081232,5,.7);
    this.uiLabel(TEAM_X,ROW(i),'Espaço livre',7,MENU_UI.apagadoTexto,[.5,.5]);}
   if(boxView.rows.length&&!boxView.rows[i]){nativeRect(empty,BOX_X-BOX_W/2,ROW(i)-14,BOX_W,29,0x081232,5,.7);
    this.uiLabel(BOX_X,ROW(i),'Espaço livre',7,MENU_UI.apagadoTexto,[.5,.5]);}
  }
  state.team.forEach((member,i)=>{
   const selected=this.pcSelected===i;
   this.pcRow(member,TEAM_X,ROW(i),TEAM_W,{selected,active:i===state.active,
    dataKey:'torre2-pc-team-index',dataValue:i,onTap:()=>{
     this.pcSelected=i===this.pcSelected?null:i;
     this.__torre2PcNotice=null;this.pcScreen(state,safePage);
    }});
  });
  boxView.rows.forEach(({member,actualIndex},i)=>{
   this.pcRow(member,BOX_X,ROW(i),BOX_W,{dataKey:'torre2-pc-box-index',dataValue:actualIndex,onTap:()=>{
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
   }});
  });
  if(!boxView.rows.length){
   // Empty box: one centred message instead of six empty rows.
   const card=this.add.graphics().setDepth(3);
   nativeRect(card,BOX_X-120,120,240,130,0x081232,8,.75);
   premiumSprite(this,'terminal',BOX_X,160);
   this.uiLabel(BOX_X,200,boxView.total?'Nenhum Pokémon neste filtro':'A caixa está vazia',9,'#ffffff',[.5,.5]);
   this.uiLabel(BOX_X,220,boxView.total?'Escolha outra aba acima':'Capture Pokémon para guardar aqui',7,MENU_UI.suave,[.5,.5]);
  }
  this.button(121,306,195,26,'GUARDAR SELECIONADO',()=>{
   const result=attemptTransfer(()=>storePokemon(state,this.pcSelected));
   if(!result.done&&!result.blocked)
    this.__torre2PcNotice='SELECIONE UM POKÉMON · MANTENHA UM NA EQUIPE';
   if(result.done)this.pcSelected=null;
   this.pcScreen(state,safePage);
  },Number.isInteger(this.pcSelected)).setData('torre2-pc-store',true);
  this.button(337,306,111,26,'◀ ANTERIOR',()=>
   this.pcScreen(state,(safePage-1+totalPages)%totalPages))
   .setData('torre2-pc-prev',true);
  this.button(451,306,104,26,(safePage+1)+' / '+totalPages,()=>
   this.pcScreen(state,0)).setData('torre2-pc-page',safePage);
  this.button(568,306,119,26,'PRÓXIMA ▶',()=>
   this.pcScreen(state,(safePage+1)%totalPages))
   .setData('torre2-pc-next',true);
  const notice=this.__torre2PcSaveError||this.__torre2PcNotice||
   (boxView.filter==='ALL'?
    'EQUIPE CHEIA? SELECIONE À ESQUERDA E TROQUE PELO PC.':
    boxView.matched+' DE '+boxView.total+' NO FILTRO '+boxView.filter);
  text(this,320,340,notice,{
   fontSize:'10px',color:this.__torre2PcSaveError?'#ff9aa8':
    this.__torre2PcNotice?'#ffdb94':C.muted}).setOrigin(.5,.5);
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  const supported=ROSTER.flatMap(p=>[p.id,
   ...(p.evoluciones||[]).map(x=>x.nombre)]);
  // 24 per page (6×4 grid). Page boundaries match the previous list layout
  // for every species that the T25 regression checks (Mr. Mime / Mew).
  const view=kantoDexPageModel(state,KANTO_DEX,supported,this.dexPage||0,24);
  this.dexPage=view.page;
  this.screenBanner(20,330,'Pokédex de Kanto','dex');
  const info=this.uiLabel(view.totals.shinySeen?200:320,46,'Vistos '+view.totals.seen+' · Capturados '+view.totals.caught+
   ' de '+view.totals.all,8,MENU_UI.suave,[.5,.5]);
  info.setData('torre2-dex-totals',view.totals);
  if(view.totals.shinySeen)this.uiLabel(450,46,'✦ SHINY AVISTADOS '+view.totals.shinySeen+
   ' · CAPTURADOS '+view.totals.shinyCaught,8,MENU_UI.amarillo,[.5,.5]);
  this.uiSection(8,56,624,256);
  // 4 × 6 wide cards: portrait, "Nº. Name" with the full Shiny marker,
  // capture state and the Arena tag all stay readable on mobile.
  const CW=152,CH=38,GX=3,GY=3,X0=Math.round(320-(4*CW+3*GX)/2),Y0=62;
  view.rows.forEach((row,i)=>{
   const x=X0+(i%4)*(CW+GX),y=Y0+Math.floor(i/4)*(CH+GY);
   const dex=String(row.index+1).padStart(4,'0'),key='torre2-portrait-'+dex;
   const g=this.add.graphics().setDepth(3);
   const tone=row.shinyCaught?MENU_UI.oro:row.caught?0x50cc84:row.seen?MENU_UI.panelLuz:MENU_UI.apagadoBorde;
   nativeRect(g,x,y,CW,CH,MENU_UI.contorno,6);
   nativeRect(g,x+1,y+1,CW-2,CH-2,tone,5);
   nativeRect(g,x+2,y+2,CW-4,CH-4,row.seen?0x0f2352:0x0a1638,4);
   // Portrait window; unseen species are a silhouette.
   nativeRect(g,x+4,y+4,30,30,row.seen?0x1d3c7a:0x081232,4);
   requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',()=>{
    if(!g.active)return;
    const img=this.add.image(x+19,y+19,key).setDisplaySize(28,28).setDepth(4);
    // PMD portraits are opaque squares: a flat tint becomes a blank box,
    // so unseen species are a darkened portrait with a "?" mark.
    if(!row.seen){img.setTint(0x1b2852).setAlpha(.85);
     this.uiLabel(x+19,y+19,'?',14,'#9fb4e6',[.5,.5],5);}
   });
   const marker=row.shinyCaught?' ✦ SHINY':row.shinySeen?' ✦':'';
   estrechar(this.uiLabel(x+39,y+12,String(row.index+1).padStart(3,'0')+'. '+row.name+marker,8,
    row.shinyCaught?MENU_UI.amarillo:row.seen?'#ffffff':MENU_UI.tenue),CW-56).setData('torre2-dex-id',row.id);
   this.uiLabel(x+39,y+27,row.caught?'Capturado':row.seen?'Visto':'?????',7,
    row.caught?'#9ff0bf':row.seen?MENU_UI.suave:MENU_UI.apagadoTexto);
   if(row.caught)originalBallSprite(this,x+CW-11,y+11,'pokeball',12,6);
   if(row.ready)this.uiLabel(x+CW-6,y+27,'Arena',6,'#9ddcf0',[1,.5]);
  });
  this.button(82,334,140,28,'◀ VOLTAR',()=>this.scene.restart());
  this.button(236,334,133,28,'◀ ANTERIOR',()=>{
   this.dexPage=(view.page-1+view.pages)%view.pages;this.dexScreen(state);
  }).setData('torre2-dex-prev',true);
  this.uiLabel(382,334,'Pág. '+(view.page+1)+'/'+view.pages,9,MENU_UI.amarillo,[.5,.5]);
  this.button(543,334,141,28,'PRÓXIMA ▶',()=>{
   this.dexPage=(view.page+1)%view.pages;this.dexScreen(state);
  }).setData('torre2-dex-next',true);
 }

}
export {Campanha};
