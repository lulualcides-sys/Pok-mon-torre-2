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
import {ensureDaily,missionProgress,claimDaily,DAILY_BONUS,claimDailyWithPoints,missionPoints,POINT_SHOP,shopItemState,buyWithPoints,POINTS_PER_MISSION,POINTS_BONUS} from './daily-missions.js';
import {filterDexRows,paginate,cycle,DEX_SHOW,DEX_SHOW_LABEL,DEX_TYPES,TYPE_LABEL} from './dex-filter.js';
import {storyFor,markStorySeen,SPEAKERS} from './story.js';
// Native graphics options (light mode). The 0.76.2 publisher exposes the base
// client's calidad.js as globalThis.__torre2NativeGraphics; older clients have
// no such module, so the campaign never requests it.
const nativeGraphicsApi=()=>{const m=globalThis.__torre2NativeGraphics;
 return typeof m?.ponerOpcion==='function'&&typeof m?.opcionElegida==='function'?m:null};
import {readLegacy,saveLegacy,syncLegacy,TITLES,titleById,ACHIEVEMENT_REWARDS,rewardLabel,claimAchievement,
 encodeTrainerCode,decodeTrainerCode,readRanking,saveRanking,addFriend,rankingRows} from './legacy.js';
import {cargarPMD,soloFormas} from '../sprites.js';
import {availableMoves,selectedMoves,resolveLoadout,pokemonStats,isPendingApprovalMove,filterMoveLibrary,canonicalMoveKey,campaignMoveSlotReason,suggestedCampaignMoveSlot,upcomingCampaignMoves} from './move-pool.js';
import {earlyKantoSlotPlan,nativeKantoEvolutionPlan,EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';
import {readCampaign,createPlayerCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,trainerSpeciesForLevel,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,useStatusCure,teachTM,
 ensureConsciousActive,pendingEeveeEvolution,chooseEeveeEvolution,equipCampaignMove,startLegendaryEncounter,
 startSilphBattle,resolveSilphBattle,sendTrade,previewTrade,receiveTrade,kantoTypes,
 startTowerBattle,resolveTowerBattle,currentTowerFloor,startEventBattle,resolveEventBattle} from './campaign-core.js';
import {EVENTS_3X3,eventStatus,eventTeam,battleWeatherRoll,WEATHER_INTRO} from './battle-events.js';
import {installIndividuality,potentialOf,potentialStars,potentialGrade,potentialTotalWord,POTENTIAL_STATS,hiddenAbilityOf,HIDDEN_ABILITIES,HELD_ITEMS,HELD_ICON_DIR,heldIconKey,HOW_TO_GET,heldItemOf,itemDesc,equipItem,rivalsOf,areRivals,partyHasRivalry} from './individuality.js';
// Campaign combat hook for individual Pokémon (potential, ability, item, rivals).
installIndividuality();
import {towerStatus,towerRun,towerBest,towerReward,startTowerRun,endTowerRun,TOWER_REWARD_EVERY,TOWER_ITEM_NAMES} from './challenge-tower.js';
import {routeWeather,ROUTE_WEATHERS,weatherWeight} from './route-weather.js';
import {LEGENDARIES,legendaryById,legendaryStatus,legendaryLevel,SILPH_GIOVANNI,silphStatus,silphTeam} from './legendaries.js';
import {drawLegendaryLair,drawLairAmbient,LAIR_SPOT,drawSilphOfficeArt} from './legendary-lairs.js';
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
  // Original FireRed held-item icons (24x24, torre2-held-items/PROVENANCE.json).
  for(const key of Object.keys(HELD_ITEMS))
   if(!this.textures.exists(heldIconKey(key)))this.load.image(heldIconKey(key),HELD_ICON_DIR+key+'.png');
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
    // Rivalry wins (README item 10): counted with the same battle checkpoint.
    if(completed.won&&partyHasRivalry(marker.party))next.rivalryWins=(Number(next.rivalryWins)||0)+1;
    if(marker.kind==='rematch'){
     if(validRematchResult(next,marker.ticket)){
      applyPartyBattleResult(next,marker.party);
      outcome=resolveRematch(next,marker.ticket,!!completed.won);
      kind='rematch';
     }
    }else if(marker.kind==='event3'){
     applyPartyBattleResult(next,marker.party);
     outcome=resolveEventBattle(next,marker.token,!!completed.won);
     kind='trainer';
    }else if(marker.kind==='tower'){
     applyPartyBattleResult(next,marker.party);
     outcome=resolveTowerBattle(next,marker.token,!!completed.won);
     kind='trainer';
    }else if(marker.kind==='silph'){
     applyPartyBattleResult(next,marker.party);
     outcome=resolveSilphBattle(next,marker.token,!!completed.won);
     kind='trainer';
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
    const towerNext=completed?.marker?.kind==='tower',eventNext=completed?.marker?.kind==='event3';
    this.evolutionScene(battleReport.evolutions,()=>{
     if(!this.scene.isActive())return;
     const cur=readCampaign();
     // Torre de desafios: straight back to the tower (next floor or result).
     if(towerNext&&cur&&!cur.pendingEeveeEvolution)return this.towerScreen(cur);
     if(eventNext&&cur&&!cur.pendingEeveeEvolution)return this.eventsScreen(cur);
     this.promptPendingEeveeEvolution(cur);
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
  this.campaignMusic('title');
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
  this.campaignMusic('title');
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
  // Every drawn screen gets a new token; taps on objects of an older screen
  // (still in Phaser's pending input list this frame) are ignored.
  this.__torre2ScreenToken=(this.__torre2ScreenToken||0)+1;
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
 pokemonIdleSprite(id,x,y,maxSize=88,depth=6,onReady=null,fitContent=false){
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
   let s=Math.min(3,maxSize/Math.max(idle.fw,idle.fh));
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
     // Visible bounding box of the frame, to size small windows by content.
     let x0=idle.fw,x1=-1,y0=idle.fh;
     for(let r=0;r<=row;r++)for(let c=0;c<idle.fw;c++)if(data[(r*idle.fw+c)*4+3]>40){if(c<x0)x0=c;if(c>x1)x1=c;if(r<y0)y0=r}
     (this.__torre2Box??=new Map()).set(key,{w:Math.max(1,x1-x0+1),h:Math.max(1,row-y0+1)});
    }catch{}
    feet.set(key,(row+1)/idle.fh);
   }
   const box=this.__torre2Box?.get(key);
   if(fitContent&&box)s=fitContent==='height'?
    // Same visible height for every species; very wide ones are capped.
    Math.min(3,maxSize/box.h,maxSize*1.6/box.w):
    Math.min(3,maxSize/Math.max(box.w,box.h));
   const sprite=this.add.sprite(x,y,key,0).setOrigin(.5,feet.get(key)).setScale(s).setDepth(depth).play(anim)
    .setData('torre2-idle-sprite-image',id);
   // Closing a window destroys the owner zone: the sprite goes with it
   // (it was left on screen after cancelling a trade).
   owner.once('destroy',()=>{if(sprite.active)sprite.destroy()});
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
  const legacy=this.legacySync(state);
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
  const hallTitle=titleById(legacy.activeTitle);
  center(92,210,(hallTitle?hallTitle.name:'Campeão de Kanto')+' · zerou '+legacy.championRuns.length+'×',8,'#dcf4fb');
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
  center(400,318,'LIGA CONCLUÍDA · PROGRESSO PRESERVADO NO SEU SAVE',
   7,'#adcbe0');
  this.button(92,332,150,26,'◀ VOLTAR AO MENU',()=>this.scene.start('titulo',{menu:'principal'}),false,8)
   .setData('torre2-hall-back',true);
  this.button(250,332,150,26,'HISTÓRICO',()=>this.hallHistoryScreen(state,0,()=>this.hallOfFameScreen(state)),true,8)
   .setData('torre2-hall-history',true);
  this.button(408,332,150,26,'COMPARTILHAR',()=>this.shareHallImage(state),true,8)
   .setData('torre2-hall-share',true);
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
   capture:at=>this.grassScreen(state,Number.isInteger(at)?at:null),
   rematchAtlas:()=>this.rematchAtlasScreen(state),
   dex:()=>this.dexScreen(state),
   badges:()=>this.badgeCaseScreen(state),
   trainerCard:()=>this.trainerCardScreen(state),
   saveExport:()=>this.exportSave(state),
   saveImport:()=>this.importSave(),
   ranking:()=>this.rankingScreen(state),
   legendaries:()=>this.legendaryHub(state),
   tower:()=>this.challengesScreen(state),
   installApp:()=>this.installApp(),
   missions:()=>this.missionsScreen(state),
   trade:()=>this.tradeScreen(state),
   lightMode:()=>{this.toggleLightMode();this.renderCampaign(state)},
   lightLabel:()=>'MODO LEVE: '+(this.lightModeOn()?'ON':'OFF'),
   silph:()=>this.silphScreen(state),
   audio:()=>this.__torre2AudioSettings?.open(),
   reset:()=>this.confirmResetJourney()
  };
  this.legacySync(state);
  this.screenFade();
  // League (Victory Road, Elite Four, Champion): the dungeon theme.
  this.campaignMusic(state.stage>=8?'dungeon':'town');
  const cards=renderTrainerCardHub(this,state,handlers);
  if(!deferEeveeChoice)this.promptPendingEeveeEvolution(state);
  // First visit only: point out the main buttons (never blocks input).
  if(!this.__torre2TipsShown){this.__torre2TipsShown=true;this.time.delayedCall(450,()=>{if(this.scene.isActive())this.campaignTips()});}
  // A newly unlocked Evento 3x3 is announced once (owner 2026-11-22).
  {const fresh=EVENTS_3X3.find(ev=>eventStatus(state,ev).state==='open'&&!(state.events3x3?.announced||[]).includes(ev.id));
   if(fresh){const ann=[...(state.events3x3?.announced||[]),...EVENTS_3X3.filter(ev=>eventStatus(state,ev).state!=='locked').map(ev=>ev.id)];
    try{const cur=readCampaign()||state;saveCampaign({...cur,events3x3:{...(cur.events3x3||{}),announced:[...new Set(ann)]}});state.events3x3={...(state.events3x3||{}),announced:[...new Set(ann)]}}catch{}
    this.time.delayedCall(900,()=>{if(this.scene.isActive())this.campaignNotice('Nova luta 3x3 liberada: '+fresh.name+'! Mais opções → DESAFIOS → EVENTOS 3x3',MENU_UI.amarillo)})}}
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
    capture:at=>this.grassScreen(state,Number.isInteger(at)?at:null),
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
   capture:at=>this.grassScreen(state,Number.isInteger(at)?at:null),
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
   capture:at=>this.grassScreen(state,Number.isInteger(at)?at:null),
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
 // First-visit tips on the campaign hub: a speech bubble and a gold ring on
 // one button at a time. Never blocks the screen (only the bubble itself is
 // interactive), remembered on this device, and — like the base client's
 // account prompt — skipped under browser automation unless forced.
 campaignTips(force=false){
  const KEY='torre2-tips-v1';
  try{if(!force&&(localStorage.getItem(KEY)==='done'||navigator.webdriver))return false}catch{return false}
  const steps=[
   [422,320,210,36,'Batalhar','Toque aqui para enfrentar o próximo treinador da rota.'],
   [166,56,464,246,'Cards da rota','Cada card é um treinador. Vença todos para desafiar o líder.'],
   [8,324,80,30,'Equipe','Veja seus Pokémon, o HP e escolha quem luta primeiro.'],
   [92,324,80,30,'Bolsa','Use Poções, remédios de status e ensine TMs.'],
   [176,324,80,30,'Centro','O Centro Pokémon cura toda a equipe de graça.'],
   [344,324,70,30,'Mais','Pokédex, insígnias, mapa, cartão do treinador e cópia do save.']
  ];
  const D=9200;let i=0,objs=[];
  const clear=()=>{objs.forEach(o=>o?.active&&o.destroy());objs=[]};
  const finish=()=>{clear();try{localStorage.setItem(KEY,'done')}catch{};this.__torre2Tips=null};
  const show=()=>{
   clear();
   if(i>=steps.length)return finish();
   const [x,y,w,h,title,body]=steps[i];
   const ring=this.add.graphics().setDepth(D);objs.push(ring);
   nativeAro(ring,x-3,y-3,w+6,h+6,MENU_UI.oro,8,1);
   this.tweens.add({targets:ring,alpha:.35,duration:520,yoyo:true,repeat:-1});
   const bw=270,bh=58,bx=Math.max(8,Math.min(632-bw,x+w/2-bw/2)),by=y>200?y-bh-12:y+h+12;
   const b=this.add.graphics().setDepth(D+1);objs.push(b);
   nativeRect(b,bx,by,bw,bh,MENU_UI.contorno,8);nativeRect(b,bx+2,by+2,bw-4,bh-4,0xf4f1e6,7);
   const tx=Math.max(bx+16,Math.min(bx+bw-16,x+w/2));
   if(y>200)b.fillStyle(0xf4f1e6,1).fillTriangle(tx-7,by+bh-2,tx+7,by+bh-2,tx,by+bh+8);
   else b.fillStyle(0xf4f1e6,1).fillTriangle(tx-7,by+2,tx+7,by+2,tx,by-8);
   const t=(px,py,s,c,o,txt)=>{const l=textoMenu(this,px,py,txt,{tam:s,color:c,borde:0,literal:true}).setOrigin(...o).setDepth(D+2);objs.push(l);return l};
   t(bx+12,by+13,9,MENU_UI.textoOscuro,[0,.5],title);
   t(bx+bw-12,by+13,7,'#36507a',[1,.5],(i+1)+' / '+steps.length);
   estrechar(t(bx+12,by+31,7,'#24365a',[0,.5],body),bw-24);
   const mk=(px,label,fn,gold)=>{const z=this.add.zone(px,by+bh-11,74,18).setDepth(D+3)
     .setInteractive({useHandCursor:true}).setData('torre2-tip-'+(gold?'next':'skip'),true);
    const g=this.add.graphics().setDepth(D+2);nativeRect(g,px-37,by+bh-20,74,17,gold?MENU_UI.oro:0xc9d4e6,5);
    const l=t(px,by+bh-11,7,MENU_UI.textoOscuro,[.5,.5],label);
    z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();fn()});objs.push(z,g,l)};
   mk(bx+bw-48,i<steps.length-1?'Próxima ▶':'Entendi',()=>{i++;show()},true);
   mk(bx+48,'Pular',finish,false);
  };
  this.__torre2Tips={steps:steps.length,next:()=>{i++;show()},skip:finish};
  show();
  return true;
 }
 // Short on-screen notice (save export/import feedback).
 campaignNotice(message,color=MENU_UI.amarillo){
  const t=this.uiLabel(320,346,message,9,color,[.5,.5],9600).setData('torre2-campaign-notice',true);
  this.time.delayedCall(2600,()=>t.active&&t.destroy());
  return t;
 }
 // Backup: download the whole campaign (plus trainer name / character) as a
 // JSON file the player keeps outside the browser. Read-only for the save.
 exportSave(state){
  let name=null,gender=null;try{name=localStorage.getItem('torre2-trainer-name');gender=localStorage.getItem('torre2-trainer-gender')}catch{}
  const campaign=readCampaign()||state;
  const data={format:'torre2-save',version:1,exportedAt:new Date().toISOString(),trainer:{name,gender},campaign,legacy:readLegacy()};
  try{
   const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
   const a=document.createElement('a');a.href=URL.createObjectURL(blob);
   a.download='torre2-save-'+new Date().toISOString().slice(0,10)+'.json';
   document.body.appendChild(a);a.click();
   setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
   this.campaignNotice('Cópia do save baixada: '+a.download,'#9ff0bf');
  }catch{this.campaignNotice('Não foi possível baixar a cópia','#ff9d9d')}
  return data;
 }
 // Restore: pick a file, validate it, confirm in two steps, then write it
 // through saveCampaign (which refuses broken snapshots before touching
 // storage, and keeps the previous save as its rotating backup).
 importSave(){
  const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
  input.style.display='none';document.body.appendChild(input);
  input.addEventListener('change',async()=>{
   const file=input.files?.[0];input.remove();
   if(!file)return;
   if(file.size>2_000_000)return this.campaignNotice('Arquivo grande demais para um save','#ff9d9d');
   let data;try{data=JSON.parse(await file.text())}catch{return this.campaignNotice('Arquivo inválido: não é JSON','#ff9d9d')}
   this.confirmImport(data);
  },{once:true});
  input.click();
 }
 confirmImport(data){
  if(data?.format!=='torre2-save'||!data.campaign||typeof data.campaign!=='object')
   return this.campaignNotice('Este arquivo não é um save do Pokémon Torre 2','#ff9d9d');
  const c=data.campaign,D=9400,objs=[];const keep=o=>{if(o)objs.push(o);return o};
  const close=()=>{objs.forEach(o=>o?.active&&o.destroy());this.children.list.filter(o=>o.getData?.('torre2-import-ui')).forEach(o=>o.destroy())};
  keep(this.add.zone(320,180,640,360).setDepth(D).setInteractive().setData('torre2-import-confirm',true));
  const g=keep(this.add.graphics().setDepth(D+1));
  g.fillStyle(0x020814,.88).fillRect(0,0,640,360);
  nativeMarco(g,120,70,400,210,'panel',{borde:MENU_UI.oro});
  const L=(y,t,s,col)=>keep(this.uiLabel(320,y,t,s,col,[.5,.5],D+2));
  L(96,'Restaurar cópia do save?',13,MENU_UI.amarillo);
  L(122,(data.trainer?.name?'Treinador: '+data.trainer.name+' · ':'')+'Insígnias: '+((c.badges||[]).length)+' · Equipe: '+((c.team||[]).length),9,'#ffffff');
  L(140,'Cópia de '+String(data.exportedAt||'').slice(0,10),8,MENU_UI.suave);
  L(170,'Isso substitui o progresso atual neste aparelho.',8,'#ffd47a');
  L(186,'O save atual fica guardado como reserva automática.',7,MENU_UI.tenue);
  const lift=btn=>{this.children.list.slice(-3).forEach(o=>{if(o!==btn){o.setDepth?.(D+3);o.setData?.('torre2-import-ui',true)}});btn.setDepth(D+4);return keep(btn)};
  lift(this.button(232,240,150,28,'CANCELAR',close,false,9).setData('torre2-import-cancel',true));
  lift(this.button(408,240,150,28,'RESTAURAR',()=>{
   try{saveCampaign(c)}catch{close();return this.campaignNotice('Save inválido: nada foi alterado','#ff9d9d')}
   try{if(data.trainer?.name)localStorage.setItem('torre2-trainer-name',String(data.trainer.name).slice(0,12));
    if(data.trainer?.gender==='leaf'||data.trainer?.gender==='red')localStorage.setItem('torre2-trainer-gender',data.trainer.gender)}catch{}
   // Merge the permanent legacy (titles and completions only ever grow).
   if(data.legacy&&typeof data.legacy==='object'){const l=readLegacy();
    l.championRuns=[...new Set([...l.championRuns,...(Array.isArray(data.legacy.championRuns)?data.legacy.championRuns.filter(x=>typeof x==='string'):[])])];
    for(const [k,v] of Object.entries(data.legacy.titles||{}))if(titleById(k)&&!l.titles[k])l.titles[k]=v;
    l.bestShiny=Math.max(l.bestShiny||0,Number(data.legacy.bestShiny)||0);l.bestCaught=Math.max(l.bestCaught||0,Number(data.legacy.bestCaught)||0);
    l.flawlessRuns=Math.max(l.flawlessRuns||0,Number(data.legacy.flawlessRuns)||0);
    const known=new Set(l.champions.map(c=>c.run));
    for(const c of Array.isArray(data.legacy.champions)?data.legacy.champions:[])if(c&&typeof c.run==='string'&&Array.isArray(c.team)&&!known.has(c.run))l.champions.push(c);
    l.champions.sort((a,b)=>(a.at||0)-(b.at||0));saveLegacy(l);}
   close();this.scene.restart();
  },true,9).setData('torre2-import-apply',true));
 }
 // Permanent legacy (titles, completions): synced from the live campaign,
 // stored apart from the save so "Reiniciar jornada" never erases it.
 legacySync(state){
  if(!state)return readLegacy();
  let name=null;try{name=localStorage.getItem('torre2-trainer-name')}catch{}
  const {legacy,earned}=syncLegacy(state,readLegacy(),Date.now(),{name});
  saveLegacy(legacy);
  if(earned.length)this.time?.delayedCall(700,()=>{if(this.scene.isActive())
   this.campaignNotice('Novo título: '+earned.map(t=>t.name).join(', ')+'!',MENU_UI.amarillo)});
  return legacy;
 }
 rarityColor(r){return r==='rainbow'?0xd06ad8:r==='gold'?MENU_UI.oro:r==='silver'?0xc0c8d8:MENU_UI.panelBorde}
 titlesScreen(state){
  this.children.removeAll(true);this.backdrop();
  const legacy=this.legacySync(state);
  const got=TITLES.filter(t=>legacy.titles[t.id]).length;
  this.screenBanner(20,300,'Títulos','badges');
  this.uiLabel(320,46,got+' de '+TITLES.length+' títulos · ficam com você mesmo ao reiniciar a jornada',8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  const g=this.add.graphics().setDepth(3);
  TITLES.forEach((t,i)=>{
   const x=16+(i%4)*154,y=64+Math.floor(i/4)*60,on=!!legacy.titles[t.id],active=legacy.activeTitle===t.id;
   const col=on?this.rarityColor(t.rarity):MENU_UI.apagadoBorde;
   nativeRect(g,x,y,150,56,active?0xffffff:col,7);nativeRect(g,x+2,y+2,146,52,on?0x1d2a5e:0x0a1638,6);
   if(on&&t.rarity==='rainbow'){for(let k=0;k<6;k++)g.fillStyle([0xe85050,0xf2c34b,0x50cc84,0x6fb7f0,0x9b8ec5,0xe997bf][k],1).fillRect(x+6+k*23,y+52,22,2);}
   estrechar(this.uiLabel(x+10,y+16,on?t.name:'???',9,on?(active?'#ffffff':MENU_UI.amarillo):'#8ea2c8'),130);
   estrechar(this.uiLabel(x+10,y+31,t.secret&&!on?'Conquista secreta':t.desc,7,on?'#dcf4fb':MENU_UI.tenue),130);
   this.uiLabel(x+10,y+45,on?(active?'◆ Em uso':'Toque para usar'):'Bloqueado',6,on?'#9ff0bf':MENU_UI.apagadoTexto);
   if(on){const z=this.add.zone(x+75,y+28,150,56).setDepth(8).setInteractive({useHandCursor:true}).setData('torre2-title-pick',t.id);
    z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();const l=readLegacy();l.activeTitle=t.id;saveLegacy(l);this.titlesScreen(state)});}
  });
  this.button(320,334,220,28,'◀ CARTÃO',()=>this.trainerCardScreen(state)).setData('torre2-titles-back',true);
 }
 // Offline ranking: your code + friends' codes, ordered by completions.
 rankingScreen(state){
  this.children.removeAll(true);this.backdrop();
  const legacy=this.legacySync(state);
  let name='Treinador',gender='red';try{name=localStorage.getItem('torre2-trainer-name')||name;gender=localStorage.getItem('torre2-trainer-gender')||gender}catch{}
  const self={name,completions:legacy.championRuns.length,titles:Object.keys(legacy.titles).length,activeTitle:legacy.activeTitle,gender};
  const friends=readRanking(),rows=rankingRows(self,friends);
  this.screenBanner(20,300,'Ranking de treinadores','badges');
  this.uiLabel(320,46,'Quem zerou a campanha mais vezes · troque códigos com seus amigos',8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,236);
  const g=this.add.graphics().setDepth(3);
  this.uiLabel(30,70,'#',8,MENU_UI.tenue);this.uiLabel(60,70,'Treinador',8,MENU_UI.tenue);
  this.uiLabel(400,70,'Título',8,MENU_UI.tenue);this.uiLabel(600,70,'Zerou',8,MENU_UI.tenue,[1,.5]);
  rows.slice(0,8).forEach((r,i)=>{
   const y=84+i*26,medal=[MENU_UI.oro,0xc0c8d8,0xcd8a4a][i];
   nativeRect(g,18,y,604,22,r.self?MENU_UI.oro:MENU_UI.panelBorde,5);nativeRect(g,19,y+1,602,20,r.self?0x2a3f78:0x0a1a46,4);
   if(medal!==undefined){g.fillStyle(medal,1).fillCircle(32,y+11,8)}
   this.uiLabel(32,y+11,String(i+1),8,medal!==undefined?MENU_UI.textoOscuro:'#ffffff',[.5,.5],5);
   this.npcSprite(r.gender==='leaf'?'green_normal':'red_normal',52,y+21,.62,5);
   estrechar(this.uiLabel(66,y+11,r.name+(r.self?' (você)':''),9,r.self?MENU_UI.amarillo:'#ffffff'),300);
   const t=titleById(r.activeTitle);
   estrechar(this.uiLabel(400,y+11,t?t.name:'—',8,t?'#f6dd9a':MENU_UI.tenue),150);
   this.uiLabel(600,y+11,r.completions+'×',10,'#9ff0bf',[1,.5]);
   if(!r.self){const z=this.add.zone(612,y+11,20,20).setDepth(8).setInteractive({useHandCursor:true}).setData('torre2-ranking-remove',r.name);
    this.uiLabel(612,y+11,'✕',8,'#ff9daa',[.5,.5],6);
    z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();saveRanking(readRanking().filter(f=>f.name!==r.name));this.rankingScreen(state)});}
  });
  if(rows.length===1)this.uiLabel(320,150,'Adicione o código de um amigo para ver quem zerou mais!',8,MENU_UI.suave,[.5,.5]);
  this.button(118,320,200,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(state));
  this.button(330,320,196,28,'MEU CÓDIGO',()=>this.showTrainerCode(self),true).setData('torre2-ranking-mycode',true);
  this.button(530,320,186,28,'ADICIONAR AMIGO',()=>{
   const code=window.prompt('Cole o código de treinador do seu amigo (começa com T2-):','');
   if(code===null)return;
   const friend=decodeTrainerCode(code);
   if(!friend)return this.campaignNotice('Código inválido ou incompleto','#ff9d9d');
   if(friend.name===self.name)return this.campaignNotice('Esse é o seu próprio código','#ffd47a');
   saveRanking(addFriend(readRanking(),friend,self.name));this.rankingScreen(state);
   this.campaignNotice(friend.name+' entrou no ranking!','#9ff0bf');
  }).setData('torre2-ranking-add',true);
  this.__torre2Ranking={rows:rows.map(r=>({name:r.name,completions:r.completions,self:!!r.self}))};
 }
 showTrainerCode(self){
  const code=encodeTrainerCode(self),D=9400,objs=[];const keep=o=>{if(o)objs.push(o);return o};
  const close=()=>{objs.forEach(o=>o?.active&&o.destroy());this.children.list.filter(o=>o.getData?.('torre2-code-ui')).forEach(o=>o.destroy())};
  keep(this.add.zone(320,180,640,360).setDepth(D).setInteractive());
  const g=keep(this.add.graphics().setDepth(D+1));g.fillStyle(0x020814,.88).fillRect(0,0,640,360);
  nativeMarco(g,90,80,460,190,'panel',{borde:MENU_UI.oro});
  keep(this.uiLabel(320,104,'Seu código de treinador',12,MENU_UI.amarillo,[.5,.5],D+2));
  keep(this.uiLabel(320,124,'Mande para seus amigos: eles colam em "Adicionar amigo"',7,MENU_UI.suave,[.5,.5],D+2));
  nativeRect(g,110,140,420,40,0xf4f1e6,6);
  const t=keep(textoMenu(this,320,160,code,{tam:9,color:MENU_UI.textoOscuro,borde:0,literal:true}).setOrigin(.5).setDepth(D+2));
  estrechar(t,400);t.setData('torre2-trainer-code',code);
  keep(this.uiLabel(320,194,self.name+' · zerou '+self.completions+'× · '+self.titles+' títulos',8,'#ffffff',[.5,.5],D+2));
  const lift=btn=>{this.children.list.slice(-3).forEach(o=>{if(o!==btn){o.setDepth?.(D+3);o.setData?.('torre2-code-ui',true)}});btn.setDepth(D+4);return keep(btn)};
  lift(this.button(230,240,160,28,'COPIAR',async()=>{
   try{await navigator.clipboard.writeText(code);this.campaignNotice('Código copiado!','#9ff0bf')}
   catch{window.prompt('Copie o código:',code)}
  },true,9).setData('torre2-code-copy',true));
  lift(this.button(410,240,160,28,'FECHAR',close,false,9));
 }
 // Hall of Fame history: every completed journey with its champion team.
 // Read from the permanent legacy, so it survives "Reiniciar jornada".
 hallHistoryScreen(state,page=0,back=null){
  this.children.removeAll(true);this.backdrop();
  const legacy=this.legacySync(state);
  const entries=[...legacy.champions].reverse();
  const per=2,pages=Math.max(1,Math.ceil(entries.length/per));
  page=Math.max(0,Math.min(pages-1,page));
  this.screenBanner(20,330,'Histórico do Salão da Fama','badges');
  this.uiLabel(320,46,'Campanha zerada '+legacy.championRuns.length+'× · times registrados: '+entries.length,8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  const g=this.add.graphics().setDepth(3);
  if(!entries.length){
   this.uiLabel(320,160,'Nenhum time registrado ainda',11,'#ffffff',[.5,.5]);
   this.uiLabel(320,180,'Zere a campanha: o time campeão fica guardado aqui para sempre.',8,MENU_UI.suave,[.5,.5]);
  }
  entries.slice(page*per,page*per+per).forEach((c,k)=>{
   const y=64+k*120,n=entries.length-(page*per+k);
   const t=titleById(c.title);
   nativeRect(g,16,y,608,114,MENU_UI.oroBorde,8);nativeRect(g,18,y+2,604,110,0x1b1446,7);
   g.fillStyle(MENU_UI.oroLuz,.12).fillRect(20,y+4,600,22);
   this.uiLabel(30,y+15,'Vitória nº '+n,10,MENU_UI.amarillo);
   const date=c.at?new Date(c.at).toLocaleDateString('pt-BR'):'';
   estrechar(this.uiLabel(612,y+15,[c.name,t?.name,date].filter(Boolean).join(' · ')+(c.losses===0?' · Invicto':''),8,'#dcf4fb',[1,.5]),420);
   (c.team||[]).slice(0,6).forEach((m,i)=>{
    const x=24+i*100,cy=y+34;
    nativeRect(g,x,cy,96,72,MENU_UI.panelBorde,6);nativeRect(g,x+2,cy+2,92,68,0x0f2352,5);
    g.fillStyle(MENU_UI.oro,.9).fillEllipse(x+48,cy+50,64,10);g.fillStyle(MENU_UI.oroLuz,.5).fillEllipse(x+48,cy+49,44,5);
    if(!this.pokemonIdleSprite(m.id,x+48,cy+51,40,6,null,true)){
     try{const dex=portraitId({id:m.id}),key='torre2-portrait-'+dex;
      requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',()=>{if(g.active)this.add.image(x+48,cy+28,key).setDisplaySize(34,34).setDepth(6)})}catch{}
    }
    const nice=String(m.id).replace(/-/g,' ').replace(/(^|\s)\S/g,ch=>ch.toUpperCase());
    estrechar(this.uiLabel(x+48,cy+60,nice+(m.shiny?' ✦':''),7,m.shiny?MENU_UI.amarillo:'#ffffff',[.5,.5]),90);
    this.uiLabel(x+90,cy+10,'Nv '+m.level,6,MENU_UI.suave,[1,.5]);
   });
  });
  if(pages>1){
   this.button(450,334,110,26,'◀ ANTERIOR',()=>this.hallHistoryScreen(state,(page-1+pages)%pages,back),false,8);
   this.uiLabel(520,334,(page+1)+'/'+pages,8,MENU_UI.amarillo,[.5,.5]);
   this.button(590,334,96,26,'PRÓXIMA ▶',()=>this.hallHistoryScreen(state,(page+1)%pages,back),false,8);
  }
  this.button(150,334,240,28,'◀ VOLTAR',()=>back?back():this.trainerCardScreen(state)).setData('torre2-hall-history-back',true);
  this.__torre2HallHistory={count:entries.length,page,pages};
 }
 // Legendary lairs are genuine pixel art (legendary-lairs.js): painted on a
 // small canvas and shown at 2× with nearest-neighbour, like the GBA screen.
 legendaryStatusFor(state,id){return legendaryStatus(state,id,currentLevelCap(state.stage))}
 // List of the five legendaries and where they wait.
 legendaryHub(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  this.screenBanner(20,300,'Lendários','badges');
  this.uiLabel(320,46,'Um encontro único em cada lugar · lute, enfraqueça e capture',8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,250);
  const g=this.add.graphics().setDepth(3);
  const colors={ELECTRIC:0xf2c232,ICE:0x7fd0f0,FIRE:0xf07030,PSYCHIC:0xd070c0};
  // Card width follows the number of legendaries (5 in Kanto, 7 after Lugia/Ho-Oh).
  const step=Math.floor(616/LEGENDARIES.length),cw=step-4,mid=Math.round(cw/2);
  LEGENDARIES.forEach((leg,i)=>{
   const x=16+i*step,y=64,st=this.legendaryStatusFor(state,leg.id),locked=st.state==='locked';
   const col=colors[leg.type]??MENU_UI.panelBorde;
   nativeRect(g,x,y,cw,234,locked?MENU_UI.apagadoBorde:col,8);nativeRect(g,x+2,y+2,cw-4,230,locked?0x0a1638:0x1b1446,7);
   // A slice of the lair illustration behind the legendary (darker if locked).
   const art=this.add.container(0,0).setDepth(4);
   ownerArt(this,art,'lair-'+leg.scene,x+3,y+3,cw-6,140,null,.5,.5);
   const veil=this.add.graphics().setDepth(4.5);veil.fillStyle(0x0a0a20,locked?.62:.18).fillRect(x+3,y+3,cw-6,140);
   veil.fillStyle(locked?MENU_UI.apagadoBorde:col,1).fillRect(x+3,y+143,cw-6,2);
   const seen=(state.dexSeen||[]).includes(leg.id)||!locked;
   const ground=Math.round(y+3+140*(LAIR_SPOT[leg.scene]??.82));
   const spr=this.pokemonIdleSprite(leg.id,x+mid,ground,Math.min(58,cw-30),6,s=>{if(!seen)s.setTint(0x101828)},'height');
   if(spr&&!seen)spr.setTint?.(0x101828);
   if(!seen)this.uiLabel(x+mid,ground-30,'?',22,'#4a5f8c',[.5,.5],7);
   estrechar(this.uiLabel(x+mid,y+152,seen?leg.name:'???',11,locked?'#8ea2c8':MENU_UI.amarillo,[.5,.5]),cw-8);
   estrechar(this.uiLabel(x+mid,y+170,leg.place,7,'#dcf4fb',[.5,.5]),cw-8);
   const label={caught:'✔ CAPTURADO',available:'DISPONÍVEL · '+st.reason,locked:'BLOQUEADO',gone:'FOI EMBORA'}[st.state]||'';
   estrechar(this.uiLabel(x+mid,y+190,label,7,st.state==='caught'?'#9ff0bf':st.state==='available'?'#ffe08a':'#ff9daa',[.5,.5]),cw-8);
   if(st.state!=='available'&&st.state!=='caught')estrechar(this.uiLabel(x+mid,y+206,st.reason,6,MENU_UI.tenue,[.5,.5]),cw-8);
   const z=this.add.zone(x+mid,y+117,cw,234).setDepth(8).setInteractive({useHandCursor:true}).setData('torre2-legendary-card',leg.id);
   z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();sfx('seleccion');this.legendaryLair(state,leg.id)});
  });
  this.button(150,330,240,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(state)).setData('torre2-legendary-back',true);
  const mb=state.inventory?.masterball||0;
  originalBallSprite(this,420,330,'masterball',18,9);
  this.uiLabel(436,330,'Master Ball ×'+mb,8,mb?'#e8c8ff':MENU_UI.tenue,[0,.5]);
  this.button(566,330,120,26,'SILPH CO.',()=>this.silphScreen(state),!state.masterBallGiven,8).setData('torre2-hub-silph',true);
  this.__torre2LegendaryHub=LEGENDARIES.map(l=>({id:l.id,...this.legendaryStatusFor(state,l.id)}));
 }
 // The lair itself: the place drawn, the legendary waiting, and the challenge.
 legendaryLair(state,id){
  const leg=legendaryById(id);if(!leg)return this.legendaryHub(state);
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  const st=this.legendaryStatusFor(state,id),locked=st.state==='locked';
  this.screenBanner(20,300,leg.place,'badges');
  // The owner's illustration of the place (campaign-art lair-*.png, cover
  // fit); the original pixel-art drawing is only shown while it loads.
  const LX=14,LY=44,LW=612,LH=190;
  const fr=this.add.graphics().setDepth(1.5);nativeRect(fr,LX-4,LY-4,LW+8,LH+8,MENU_UI.contorno,8);
  const layer=this.add.container(0,0).setDepth(2);
  ownerArt(this,layer,'lair-'+leg.scene,LX,LY,LW,LH,slot=>{
   const fallback=drawLegendaryLair(this,leg.scene,LX,LY,LW,LH);
   fallback.objects.forEach(o=>slot.add(o));
  });
  drawLairAmbient(this,leg.scene,LX,LY,LW,LH);
  const spot={x:LX+LW/2,y:Math.round(LY+LH*(LAIR_SPOT[leg.scene]??.82))};
  nativeAro(this.add.graphics().setDepth(2.8),LX-2,LY-2,LW+4,LH+4,MENU_UI.panelBorde,7);
  if(st.state==='available'){
   const s=this.pokemonIdleSprite(id,spot.x,spot.y,78,6,null,'height');
   if(s&&['zapdos','articuno','moltres','mew','lugia','hooh'].includes(id))this.tweens.add({targets:s,y:s.y-6,duration:900,yoyo:true,repeat:-1,ease:'Sine.inOut'});
  }else{
   const note={caught:'Você já capturou '+leg.name+'.',gone:leg.name+' foi embora. '+st.reason+'.',locked:'Algo poderoso vive aqui… '+st.reason+'.'}[st.state];
   const box=this.add.graphics().setDepth(5);nativeRect(box,spot.x-170,spot.y-40,340,34,MENU_UI.panelBorde,7);nativeRect(box,spot.x-168,spot.y-38,336,30,0x0a1a46,6);
   estrechar(this.uiLabel(spot.x,spot.y-23,note,9,'#ffffff',[.5,.5],6),320);
  }
  this.uiSection(10,244,620,32);
  const show=!locked;
  this.uiLabel(24,260,show?leg.name+' · Nv '+legendaryLevel(state,leg,currentLevelCap(state.stage))+(state.champion?'':' (limite da sua etapa)'):'???',10,MENU_UI.amarillo,[0,.5],4);
  const inv=state.inventory||{};
  estrechar(this.uiLabel(616,260,'Ultra ×'+(inv.ultraball||0)+' · Great ×'+(inv.greatball||0)+' · Poké ×'+(inv.pokeball||0)+' · Master ×'+(inv.masterball||0)+' · Dica: sono/paralisia e HP baixo',7,'#dcf4fb',[1,.5],4),360);
  const LORE={powerplant:'Uma usina abandonada onde a eletricidade nunca para de estalar.',seafoam:'Ilhas geladas no meio do mar, varridas por neve o ano inteiro.',ember:'Dizem que o pico deste vulcão brilha em chamas durante a noite.',cave:'A caverna mais profunda de Kanto. Só os campeões podem entrar.',faraway:'Uma ilha escondida, coberta de mata e grama alta.','navel-base':'Uma gruta inundada pelo mar, na base da Rocha Navel. Algo enorme dorme sob as ondas.','navel-peak':'O cume da Rocha Navel, acima das nuvens. Penas brilhantes cobrem o chão.'};
  estrechar(this.uiLabel(320,296,LORE[leg.scene]||'',9,'#dcf4fb',[.5,.5],4),600);
  this.button(130,334,220,28,'◀ VOLTAR',()=>this.legendaryHub(state)).setData('torre2-lair-back',true);
  if(st.state==='available')
   this.button(470,334,260,28,'ENFRENTAR '+leg.name.toUpperCase(),()=>{
    const r=startLegendaryEncounter(state,id);
    if(!r.ok)return this.campaignNotice(r.reason,'#ff9daa');
    this.enterBattle(state,true);
   },true).setData('torre2-lair-fight',id);
  this.__torre2Lair={id,state:st.state,scene:leg.scene};
 }
 // Desafios (Mais opções): Torre de desafios + Eventos 3x3 (+ future modes).
 challengesScreen(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  this.screenBanner(20,300,'Desafios','badges');
  this.uiSection(60,60,520,220);
  const won=(state.events3x3?.won||[]).length;
  this.uiLabel(320,84,'Escolha um desafio',11,MENU_UI.amarillo,[.5,.5],4);
  this.button(320,130,360,34,'TORRE DE DESAFIOS',()=>this.towerScreen(readCampaign()||state),true).setData('torre2-challenges-tower',true);
  this.uiLabel(320,154,'Andares seguidos sem curar · prêmio a cada 5',8,'#dcf4fb',[.5,.5],4);
  this.button(320,196,360,34,'EVENTOS 3x3 · '+won+'/'+EVENTS_3X3.length,()=>this.eventsScreen(readCampaign()||state),true).setData('torre2-challenges-events',true);
  this.uiLabel(320,220,'Seis treinadores especiais · seus 3 contra os 3 deles',8,'#dcf4fb',[.5,.5],4);
  this.button(320,334,240,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(readCampaign()||state)).setData('torre2-challenges-back',true);
 }
 // Eventos 3x3 (owner 2026-11-22, item 2): six special trainers.
 eventsScreen(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  this.screenBanner(20,300,'Eventos 3x3','badges');
  this.uiLabel(320,46,'Seus 3 primeiros Pokémon com HP contra os 3 do desafiante · prêmio na 1ª vitória',8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  const g=this.add.graphics().setDepth(3);
  EVENTS_3X3.forEach((ev,i)=>{
   const x=16+(i%3)*206,y=64+Math.floor(i/3)*122,st=eventStatus(state,ev),locked=st.state==='locked';
   nativeRect(g,x,y,202,118,st.state==='won'?0x50cc84:locked?MENU_UI.apagadoBorde:MENU_UI.oro,8);
   nativeRect(g,x+2,y+2,198,114,locked?0x0a1638:0x1b2a5e,7);
   if(!locked)this.npcSprite(spriteIdForTrainer(ev.sprite),x+28,y+70,2.2,5);
   this.uiLabel(x+52,y+16,locked?'???':ev.name,9,locked?'#8ea2c8':MENU_UI.amarillo,[0,.5],5);
   this.uiLabel(x+52,y+32,st.reason,7,st.state==='won'?'#9ff0bf':locked?'#ff9daa':'#dcf4fb',[0,.5],5);
   if(!locked)ev.team.forEach((id,k)=>this.pokemonIdleSprite(id,x+76+k*42,y+84,30,5,null,'height'));
   if(!locked)this.button(x+150,y+104,90,18,'LUTAR',()=>this.eventIntro(readCampaign()||state,ev.id),st.state!=='won',7).setData('torre2-event-fight',ev.id);
  });
  this.button(320,334,240,28,'◀ DESAFIOS',()=>this.challengesScreen(readCampaign()||state)).setData('torre2-events-back',true);
  this.__torre2Events=EVENTS_3X3.map(e=>({id:e.id,state:eventStatus(state,e).state}));
 }
 // The challenger's 3x3 line, then the fight.
 eventIntro(state,id){
  const ev=EVENTS_3X3.find(e=>e.id===id);if(!ev)return;
  const st=eventStatus(state,ev);if(st.state==='locked')return this.campaignNotice(st.reason,'#ff9daa');
  this.playStory(state,{key:'event3-'+id,place:'Evento especial 3x3',speaker:ev.sprite,speakerName:ev.name.toUpperCase(),bg:{room:true},entrance:false,
   lines:[[ev.sprite,ev.line],[ev.sprite,'Regras: 3 contra 3. Quem derrubar os três do outro primeiro, vence!']]},
   next=>this.enterEventBattle(next,id));
 }
 enterEventBattle(state,id){
  const r=startEventBattle(state,id);
  if(!r.ok){this.campaignNotice(r.reason,'#ff9daa');return this.eventsScreen(readCampaign()||state)}
  const cur=readCampaign()||state;
  const ace=r.team.at(-1),base={...cur,stage:Math.min(cur.stage,STAGES.length-1)};
  const party=createPartyMatch(base,{id:ace.id,level:ace.level,leader:false,kind:'trainer'},false);
  // The player's three: the first three healthy Pokémon of the team.
  party.friend=r.trio.map(i=>party.friend[i]).filter(Boolean);party.playerIndex=0;
  party.foes=r.team.map(({id,level})=>({id,level,hp:100,shiny:false,
   loadout:resolveLoadout({id,progression:{species:id,level}})}));
  party.enemyIndex=0;party.strategic=true;
  const p=party.friend[0],e=party.foes[0];
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  this.launchBattle({p1:p.id,p2:e.id,modo:'cpu',nivel:'dificil',arena:'estadio',mandos:[touch?'tactil':'kbm','cpu'],
   torre2:{stage:cur.stage,trainer:cur.trainer,kind:'event3',token:r.token,party,
    versus:{name:r.event.name.toUpperCase(),city:'EVENTO ESPECIAL 3x3',kind:r.event.sprite,
     texture:'frlg-npc-'+spriteIdForTrainer(r.event.sprite),title:'DESAFIO 3 CONTRA 3'},
    playerLevel:p.level,enemyLevel:e.level,hardCap:currentLevelCap(cur.stage)},
   torre2Loadout:p.loadout,torre2OpponentLoadout:e.loadout},false);
 }
 // Torre de desafios (owner list item 14): floors in a row, no healing
 // between them, a reward every 5 floors. Separate from the trainer ladder.
 towerScreen(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  const st=towerStatus(state),run=towerRun(state),best=towerBest(state);
  this.screenBanner(20,300,'Torre de desafios','badges');
  // Tower drawn in pixel blocks on the left.
  const g=this.add.graphics().setDepth(2);
  nativeRect(g,14,44,196,244,MENU_UI.contorno,8);nativeRect(g,16,46,192,240,0x101c3c,7);
  for(let i=0;i<9;i++){const y=258-i*24,w=112-i*6,x=112-w/2,lit=run&&i<Math.min(9,run.floor-1);
   g.fillStyle(lit?0x2f5aa8:0x223152,1).fillRect(x,y,w,22);g.fillStyle(0x0a1430,1).fillRect(x,y+20,w,2);
   for(let k=0;k<3;k++)g.fillStyle(lit?0xffe08a:0x3a4a6c,1).fillRect(x+10+k*(w-28)/2,y+7,8,8)}
  g.fillStyle(0xf2c232,1).fillTriangle(112,40+12,82,66+4,142,66+4);
  this.uiLabel(112,276,run?'Andar '+run.floor:'Melhor: andar '+best,9,MENU_UI.amarillo,[.5,.5],3);
  this.uiSection(220,44,406,244);
  const label=(x,y,t,size=9,color='#ffffff',o=[0,.5])=>this.uiLabel(x,y,t,size,color,o,4);
  label(236,62,'Lute andar por andar sem curar a equipe entre as lutas.',8,'#dcf4fb');
  label(236,78,'Curar fora da Torre, perder ou sair encerra a sequência.',8,'#dcf4fb');
  label(236,94,'A cada '+TOWER_REWARD_EVERY+' andares: prêmio em dinheiro e itens.',8,'#dcf4fb');
  label(236,116,'Melhor marca: andar '+best,10,MENU_UI.amarillo);
  this.__torre2Tower={state:st.state,active:!!run,floor:run?.floor||0,best};
  if(st.state==='locked'){label(236,150,st.reason,10,'#ff9daa');
   this.button(130,334,220,28,'◀ DESAFIOS',()=>this.challengesScreen(readCampaign()||state)).setData('torre2-tower-back',true);return}
  if(!run){
   this.button(130,334,220,28,'◀ DESAFIOS',()=>this.challengesScreen(readCampaign()||state)).setData('torre2-tower-back',true);
   this.button(470,334,260,28,'COMEÇAR NO ANDAR 1',()=>{
    const r=startTowerRun(readCampaign()||state);if(!r.ok)return this.campaignNotice(r.reason,'#ff9daa');
    try{saveCampaign(r.state)}catch{return this.campaignNotice('Não foi possível salvar.','#ff9daa')}
    this.towerScreen(r.state);
   },true).setData('torre2-tower-start',true);
   return;
  }
  const floor=currentTowerFloor(state),next=Math.ceil(run.floor/TOWER_REWARD_EVERY)*TOWER_REWARD_EVERY,rw=towerReward(next);
  label(236,140,'Andar '+run.floor+(floor?.boss?' · ANDAR DE PRÊMIO':'')+' · Próximo prêmio no andar '+next,10,'#9ff0bf');
  if(rw)label(236,158,'Prêmio: $'+rw.money+' + '+Object.entries(rw.items).map(([k,v])=>v+'× '+(TOWER_ITEM_NAMES[k]||k)).join(', '),8,'#ffe08a');
  if(floor){
   this.npcSprite(spriteIdForTrainer(floor.trainer),270,262,3,5);
   floor.team.forEach((m,i)=>{const x=340+i*92;
    this.pokemonIdleSprite(m.id,x,250,46,5,null,'height');
    label(x,272,m.id.replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase())+' Nv '+m.level,7,'#ffffff',[.5,.5])});
  }
  this.button(110,334,180,28,'SAIR DA TORRE',()=>{
   const cur=readCampaign()||state,ended=endTowerRun(cur,'Você saiu da Torre no andar '+run.floor+'.');
   try{saveCampaign(ended)}catch{}
   this.towerScreen(ended);this.campaignNotice(ended.lastMessage);
  }).setData('torre2-tower-leave',true);
  this.button(470,334,260,28,'LUTAR · ANDAR '+run.floor,()=>this.enterTowerBattle(state),true).setData('torre2-tower-fight',run.floor);
 }
 enterTowerBattle(state){
  const r=startTowerBattle(state);
  if(!r.ok){this.campaignNotice(r.reason,'#ff9daa');return this.towerScreen(readCampaign()||state)}
  const ace=r.floor.team.at(-1),base={...state,stage:Math.min(state.stage,STAGES.length-1)};
  const party=createPartyMatch(base,{id:ace.id,level:ace.level,leader:false,kind:'trainer'},false);
  party.foes=r.floor.team.map(({id,level})=>({id,level,hp:100,shiny:false,
   loadout:resolveLoadout({id,progression:{species:id,level}})}));
  party.enemyIndex=0;party.strategic=true;
  const p=party.friend[party.playerIndex],e=party.foes[0];
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  this.launchBattle({p1:p.id,p2:e.id,modo:'cpu',nivel:r.floor.floor>=10?'dificil':'normal',arena:'estadio',mandos:[touch?'tactil':'kbm','cpu'],
   torre2:{stage:state.stage,trainer:state.trainer,kind:'tower',token:r.token,party,
    versus:{name:'ANDAR '+r.floor.floor,city:'TORRE DE DESAFIOS',kind:r.floor.trainer,
     texture:'frlg-npc-'+spriteIdForTrainer(r.floor.trainer),title:r.floor.boss?'ANDAR DE PRÊMIO':'DESAFIANTE'},
    playerLevel:p.level,enemyLevel:e.level,hardCap:currentLevelCap(state.stage)},
   torre2Loadout:p.loadout,torre2OpponentLoadout:e.loadout},false);
 }
 // Silph Co., president's office: beat Giovanni to get the Master Ball.
 // The owner's room art (campaign-art silph-office.png) with Giovanni and his
 // ace on the rug; a separate battle that never moves the trainer ladder.
 silphScreen(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  const st=silphStatus(state),team=silphTeam(state,currentLevelCap(state.stage));
  this.screenBanner(20,330,'Silph Co. · Sala do presidente','badges');
  const AX=12,AY=44,AW=360,AH=203;
  const fr=this.add.graphics().setDepth(1.5);nativeRect(fr,AX-4,AY-4,AW+8,AH+8,MENU_UI.contorno,8);
  const layer=this.add.container(0,0).setDepth(2);
  ownerArt(this,layer,'silph-office',AX,AY,AW,AH,slot=>{slot.add(drawSilphOfficeArt(this,AX,AY,AW,AH).image);});
  nativeAro(this.add.graphics().setDepth(2.8),AX-2,AY-2,AW+4,AH+4,MENU_UI.panelBorde,7);
  const gx=AX+AW/2,gy=Math.round(AY+AH*.63);
  const sh=this.add.graphics().setDepth(4);sh.fillStyle(0x000000,.3).fillEllipse(gx-26,gy+1,30,7).fillEllipse(gx+30,gy+1,40,8);
  if(st.state!=='done'){
   this.npcSprite(spriteIdForTrainer('giovanni'),gx-26,gy+2,2,5).setData?.('torre2-silph-giovanni',true);
   this.pokemonIdleSprite(team.at(-1).id,gx+30,gy+2,52,5,null,'height');
  }else{
   originalBallSprite(this,gx,gy-14,'masterball',28,6);
  }
  // Right panel: who, his team and the prize.
  this.uiSection(384,44,246,203);
  const g=this.add.graphics().setDepth(3);
  this.uiLabel(398,62,'Giovanni',13,MENU_UI.amarillo);
  this.uiLabel(398,80,'Chefe da Equipe Rocket',8,MENU_UI.suave);
  estrechar(this.uiLabel(398,98,'A Equipe Rocket tomou a Silph Co. para roubar a Master Ball!',7,'#dcf4fb'),222);
  team.forEach((m,i)=>{
   const x=398+i*57,y=114;
   nativeRect(g,x,y,53,58,MENU_UI.panelBorde,6);nativeRect(g,x+1,y+1,51,56,0x0f2352,5);
   this.pokemonIdleSprite(m.id,x+26,y+42,30,5,null,'height');
   this.uiLabel(x+26,y+51,'Nv '+m.level,6,'#ffffff',[.5,.5],6);
  });
  nativeRect(g,394,182,226,52,MENU_UI.oroBorde,7);nativeRect(g,396,184,222,48,0x2a1d52,6);
  originalBallSprite(this,416,208,'masterball',24,5);
  this.uiLabel(436,198,'Recompensa',8,MENU_UI.suave);
  this.uiLabel(436,214,'MASTER BALL + $'+SILPH_GIOVANNI.money,10,'#e8c8ff');
  const note={available:'Vença os 4 Pokémon do Giovanni. Se perder, pode tentar de novo.',locked:st.reason,
   done:'O presidente da Silph Co. agradece: a Master Ball é sua!'}[st.state];
  estrechar(this.uiLabel(320,268,note,9,st.state==='done'?'#9ff0bf':st.state==='locked'?'#ff9daa':'#ffffff',[.5,.5],4),600);
  this.button(130,334,220,28,'◀ VOLTAR',()=>this.renderCampaign(state)).setData('torre2-silph-back',true);
  if(st.state==='available')
   this.button(470,334,260,28,'Enfrentar Giovanni',()=>this.enterSilphBattle(state),true).setData('torre2-silph-fight',true);
  this.__torre2Silph={state:st.state,team:team.map(m=>m.id+':'+m.level)};
 }
 enterSilphBattle(state){
  const r=startSilphBattle(state);
  if(!r.ok)return this.campaignNotice(r.reason,'#ff9daa');
  const ace=r.team.at(-1),base={...state,stage:Math.min(state.stage,STAGES.length-1)};
  const party=createPartyMatch(base,{id:ace.id,level:ace.level,leader:false,kind:'rocket'},false);
  party.foes=r.team.map(({id,level})=>({id,level,hp:100,shiny:false,
   loadout:resolveLoadout({id,progression:{species:id,level}})}));
  party.enemyIndex=0;party.strategic=true;
  const p=party.friend[party.playerIndex],e=party.foes[0];
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  this.launchBattle({p1:p.id,p2:e.id,modo:'cpu',nivel:'dificil',arena:'neon',mandos:[touch?'tactil':'kbm','cpu'],
   torre2:{stage:state.stage,trainer:state.trainer,kind:'silph',token:r.token,party,
    versus:{name:'GIOVANNI',city:'SILPH CO. · SAFFRON',kind:'giovanni',
     texture:'frlg-npc-'+spriteIdForTrainer('giovanni'),title:'CHEFE DA EQUIPE ROCKET'},
    playerLevel:p.level,enemyLevel:e.level,hardCap:currentLevelCap(state.stage)},
   torre2Loadout:p.loadout,torre2OpponentLoadout:e.loadout},false);
 }
 // Hall of Fame picture to share (WhatsApp etc.): the screen above the button
 // bar plus a caption strip. Uses the share sheet on phones, else downloads.
 shareHallImage(state){
  const game=this.game,cv=game.canvas;if(!cv||!game.renderer?.snapshotArea)return;
  const h=Math.round(cv.height*(312/360));
  game.renderer.snapshotArea(0,0,cv.width,h,img=>{
   try{
    let name='Treinador';try{name=localStorage.getItem('torre2-trainer-name')||name}catch{}
    const legacy=readLegacy(),t=titleById(legacy.activeTitle);
    const out=document.createElement('canvas');out.width=cv.width;out.height=h+Math.round(cv.height*.09);
    const c=out.getContext('2d');c.imageSmoothingEnabled=false;c.fillStyle='#0b1336';c.fillRect(0,0,out.width,out.height);
    c.drawImage(img,0,0);
    const fs=Math.round(out.height*.045);c.font='bold '+fs+'px monospace';c.textBaseline='middle';
    c.fillStyle='#ffd23c';c.fillText('Pokémon Torre 2 · Salão da Fama',fs,h+(out.height-h)/2);
    c.fillStyle='#ffffff';c.textAlign='right';
    c.fillText(name+(t?' · '+t.name:'')+' · zerou '+legacy.championRuns.length+'×',out.width-fs,h+(out.height-h)/2);
    out.toBlob(async blob=>{
     if(!blob)return;
     const file=new File([blob],'torre2-salao-da-fama.png',{type:'image/png'});
     try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Pokémon Torre 2 · Salão da Fama'});return}}catch(e){if(e?.name==='AbortError')return}
     const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=file.name;document.body.appendChild(a);a.click();
     setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
     if(this.scene.isActive())this.campaignNotice('Imagem salva: torre2-salao-da-fama.png');
    },'image/png');
   }catch(e){console.warn('Torre 2: hall image failed',e)}
  });
 }
 // Light mode (Mais): the base client's own graphics options. Turns off the
 // ground marks and the glow, and lowers particles; switching off restores them.
 lightModeOn(){const Q=nativeGraphicsApi();return !!Q&&Q.opcionElegida('marcas')==='no'&&Q.opcionElegida('particulas')==='baja'}
 toggleLightMode(){
  const Q=nativeGraphicsApi();
  if(!Q){this.campaignNotice('Modo leve indisponível nesta versão.','#ff9daa');return false}
  const on=!this.lightModeOn();
  Q.ponerOpcion('marcas',on?'no':'si');Q.ponerOpcion('particulas',on?'baja':'auto');Q.ponerOpcion('brillo',on?'no':'auto');
  this.campaignNotice(on?'Modo leve LIGADO: sem marcas no chão, menos partículas e brilho.':'Modo leve DESLIGADO: gráficos normais.',on?'#9ff0bf':MENU_UI.amarillo);
  return on;
 }
 // Daily missions (Mais → MISSÕES): three per day, claimed once each, bonus.
 speciesTypes(id){try{const {def,etapa}=buscar(id);return (etapa>0?def.evoluciones?.[etapa-1]?.tipos:def.tipos)||def.tipos||[]}catch{return []}}
 missionsScreen(state){
  this.children.removeAll(true);this.backdrop();
  let cur=readCampaign()||state;const today=ensureDaily(cur);
  if(today!==cur){try{saveCampaign(today)}catch{}cur=today}
  const d=cur.daily,typesOf=id=>this.speciesTypes(id);
  this.screenBanner(20,300,'Missões do dia','badges');
  this.uiLabel(320,46,'Novas missões todo dia · '+d.day.split('-').reverse().join('/'),8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  const g=this.add.graphics().setDepth(3);
  const claim=id=>{const now=readCampaign()||cur,next=claimDailyWithPoints(now,id,typesOf);
   if(!next)return this.missionsScreen(now);
   try{saveCampaign(next)}catch{return this.campaignNotice('Recompensa não salva: tente de novo','#ff9d9d')}
   const r=id==='bonus'?DAILY_BONUS:now.daily.missions.find(m=>m.id===id)?.reward;
   this.missionsScreen(next);this.campaignNotice('Recompensa: '+rewardLabel(r)+' · +'+(id==='bonus'?POINTS_BONUS:POINTS_PER_MISSION)+' pontos','#9ff0bf')};
  d.missions.forEach((m,i)=>{
   const y=66+i*58,p=missionProgress(cur,m,typesOf),done=p>=m.goal,claimed=(d.claimed||[]).includes(m.id);
   nativeRect(g,18,y,604,52,done?MENU_UI.oro:MENU_UI.panelBorde,7);nativeRect(g,20,y+2,600,48,claimed?0x183a2e:done?0x2a3f78:0x0a1a46,6);
   g.fillStyle(MENU_UI.contorno,1).fillCircle(44,y+26,15);g.fillStyle(done?MENU_UI.oroBorde:0x3a4a6a,1).fillCircle(44,y+26,13);
   this.uiLabel(44,y+26,claimed?'★':String(i+1),10,done?MENU_UI.textoOscuro:'#c8d6f0',[.5,.5],5);
   estrechar(this.uiLabel(70,y+16,m.text,10,done?MENU_UI.amarillo:'#ffffff'),360);
   // Progress bar.
   nativeRect(g,70,y+30,250,10,MENU_UI.contorno,4);
   g.fillStyle(done?0x5ad86a:0x4a8ad8,1).fillRect(72,y+32,Math.round(246*p/m.goal),6);
   this.uiLabel(332,y+35,p+'/'+m.goal,8,'#dcf4fb',[0,.5]);
   estrechar(this.uiLabel(470,y+16,'Prêmio: '+rewardLabel(m.reward),8,'#ffd47a',[.5,.5]),190);
   if(done&&!claimed)this.button(470,y+36,150,20,'Resgatar',()=>claim(m.id),true,8).setData('torre2-daily-claim',m.id);
   else if(claimed)this.uiLabel(470,y+36,'Resgatado',8,'#9ff0bf',[.5,.5]);
  });
  const all=d.missions.every(m=>missionProgress(cur,m,typesOf)>=m.goal);
  nativeRect(g,18,242,604,58,MENU_UI.oroBorde,8);nativeRect(g,20,244,600,54,0x2a1d52,7);
  originalBallSprite(this,46,271,'ultraball',24,5);
  this.uiLabel(70,262,'Bônus: complete as 3 missões',10,MENU_UI.amarillo);
  this.uiLabel(70,280,rewardLabel(DAILY_BONUS),8,'#e8c8ff');
  if(d.bonus)this.uiLabel(540,271,'Resgatado',9,'#9ff0bf',[.5,.5]);
  else if(all)this.button(540,271,140,24,'Resgatar bônus',()=>claim('bonus'),true,8).setData('torre2-daily-claim','bonus');
  else this.uiLabel(540,271,(d.missions.filter(m=>missionProgress(cur,m,typesOf)>=m.goal).length)+'/3',11,'#8ea2c8',[.5,.5]);
  this.button(150,330,240,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(readCampaign()||cur)).setData('torre2-daily-back',true);
  this.button(470,330,240,28,'LOJA DE PONTOS · '+missionPoints(cur),()=>this.pointShopScreen(readCampaign()||cur),true).setData('torre2-daily-shop',true);
  this.__torre2Daily={day:d.day,missions:d.missions.map(m=>({kind:m.kind,goal:m.goal,progress:missionProgress(cur,m,typesOf)})),bonus:d.bonus};
 }
 // Install as an app (owner list item 25): the browser's own install prompt
 // (kept by the page hook), or instructions where there is none (iPhone).
 installApp(){
  const installed=navigator.standalone===true||matchMedia?.('(display-mode: standalone)').matches||
   (matchMedia?.('(display-mode: fullscreen)').matches&&!document.fullscreenElement);
  if(installed)return this.campaignNotice('O jogo já está instalado neste aparelho.','#9ff0bf');
  const p=window.__torre2Install;
  if(p){p.prompt();p.userChoice?.then(c=>{window.__torre2Install=null;
   if(this.scene.isActive())this.campaignNotice(c?.outcome==='accepted'?'Instalando o Pokémon Torre 2...':'Instalação cancelada.')}).catch(()=>{});return}
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  this.campaignNotice(ios?'No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".':
   'Abra o menu do navegador (⋮) e toque em "Instalar app" ou "Adicionar à tela inicial".',MENU_UI.amarillo);
 }
 // Points shop (owner list item 19): mission points → existing items.
 pointShopScreen(state){
  this.children.removeAll(true);this.backdrop();
  const cur=readCampaign()||state,pts=missionPoints(cur);
  this.screenBanner(20,300,'Loja de pontos','badges');
  this.uiLabel(320,46,'Cada missão dá '+POINTS_PER_MISSION+' pontos · o bônus do dia dá '+POINTS_BONUS,8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  this.uiLabel(320,74,'Seus pontos: '+pts,12,MENU_UI.amarillo,[.5,.5]);
  const g=this.add.graphics().setDepth(3);
  const ball={master:'masterball',ultra5:'ultraball',great10:'greatball'};
  POINT_SHOP.forEach((it,i)=>{
   const y=92+i*42,st=shopItemState(cur,it);
   nativeRect(g,24,y,592,38,st.ok?MENU_UI.oro:MENU_UI.panelBorde,7);nativeRect(g,26,y+2,588,34,st.ok?0x2a3f78:0x0a1a46,6);
   if(ball[it.id])originalBallSprite(this,48,y+19,ball[it.id],20,5);
   else this.uiLabel(48,y+19,'✚',12,'#9ff0bf',[.5,.5],5);
   this.uiLabel(72,y+13,it.name+(it.oncePerJourney?' (1 por jornada)':''),10,'#ffffff',[0,.5],5);
   this.uiLabel(72,y+28,st.ok?it.cost+' pontos':st.reason,8,st.ok?'#ffd47a':'#8ea2c8',[0,.5],5);
   if(st.ok)this.button(540,y+19,130,24,'Trocar · '+it.cost,()=>{
    const now=readCampaign()||cur,next=buyWithPoints(now,it.id,Math.random,Object.keys(HELD_ITEMS));
    if(!next)return this.pointShopScreen(now);
    try{saveCampaign(next)}catch{return this.campaignNotice('Compra não salva: tente de novo','#ff9d9d')}
    this.pointShopScreen(next);this.campaignNotice('Você trocou: '+(it.heldRandom&&next.lastHeldItem?HELD_ITEMS[next.lastHeldItem].name+' (equipe na Ficha do Pokémon)':it.name),'#9ff0bf');
   },true,8).setData('torre2-shop-buy',it.id);
  });
  this.button(320,334,240,28,'◀ MISSÕES',()=>this.missionsScreen(readCampaign()||cur)).setData('torre2-shop-back',true);
  this.__torre2PointShop={points:pts,items:POINT_SHOP.map(it=>({id:it.id,ok:shopItemState(cur,it).ok}))};
 }
 // Pokémon trade by code (Mais → TROCA). Send moves the Pokémon out of this
 // save into a code; Receive pastes a friend's code once.
 tradeOverlay(build){
  const D=9400,objs=[];const keep=o=>{if(o)objs.push(o);return o};
  const close=()=>{objs.forEach(o=>o?.active&&o.destroy())};
  keep(this.add.zone(320,180,640,360).setDepth(D).setInteractive());
  const g=keep(this.add.graphics().setDepth(D+1));g.fillStyle(0x020814,.88).fillRect(0,0,640,360);
  nativeMarco(g,90,70,460,214,'panel',{borde:MENU_UI.oro});
  const lift=btn=>{this.children.list.slice(-3).forEach(o=>{if(o!==btn)o.setDepth?.(D+3)});btn.setDepth(D+4);
   this.children.list.slice(-3).forEach(o=>keep(o));return keep(btn)};
  build({D,g,keep,lift,close});
  return close;
 }
 tradeScreen(state,mode='send',page=0){
  this.children.removeAll(true);this.backdrop();
  const cur=readCampaign()||state;
  let name='Treinador';try{name=localStorage.getItem('torre2-trainer-name')||name}catch{}
  this.screenBanner(20,300,'Troca de Pokémon','bag');
  this.uiLabel(320,46,'Troque com seus amigos por código · o Pokémon enviado sai do seu save',8,MENU_UI.suave,[.5,.5]);
  this.button(220,72,180,24,'ENVIAR',()=>this.tradeScreen(cur,'send'),mode==='send',9).setData('torre2-trade-tab','send');
  this.button(420,72,180,24,'RECEBER',()=>this.tradeScreen(cur,'receive'),mode==='receive',9).setData('torre2-trade-tab','receive');
  this.uiSection(8,90,624,218);
  const g=this.add.graphics().setDepth(3);
  if(mode==='send'){
   const all=[...(cur.team||[]).map(m=>({m,where:'Equipe'})),...(cur.box||[]).map(m=>({m,where:'PC'}))];
   const per=12,pages=Math.max(1,Math.ceil(all.length/per));page=Math.max(0,Math.min(pages-1,page));
   all.slice(page*per,page*per+per).forEach(({m,where},i)=>{
    const x=18+(i%6)*101,y=98+Math.floor(i/6)*104,lv=m.progression?.level||5;
    nativeRect(g,x,y,97,98,m.shiny?MENU_UI.oro:MENU_UI.panelBorde,7);nativeRect(g,x+2,y+2,93,94,0x0f2352,6);
    g.fillStyle(0x000000,.25).fillEllipse(x+48,y+60,46,9);
    this.pokemonIdleSprite(m.id,x+48,y+61,44,5,null,'height');
    const nice=String(m.id).replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
    estrechar(this.uiLabel(x+48,y+74,nice+(m.shiny?' ✦':''),8,m.shiny?MENU_UI.amarillo:'#ffffff',[.5,.5]),90);
    this.uiLabel(x+48,y+88,'Nv '+lv+' · '+where,6,MENU_UI.suave,[.5,.5]);
    const z=this.add.zone(x+48,y+49,97,98).setDepth(8).setInteractive({useHandCursor:true}).setData('torre2-trade-pick',m.uid);
    z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();this.confirmSendTrade(cur,m,name)});
   });
   if(!all.length)this.uiLabel(320,190,'Nenhum Pokémon para enviar.',10,'#ffffff',[.5,.5]);
   if(pages>1){
    this.button(470,334,100,26,'◀',()=>this.tradeScreen(cur,'send',(page-1+pages)%pages),false,9);
    this.uiLabel(530,334,(page+1)+'/'+pages,8,MENU_UI.amarillo,[.5,.5]);
    this.button(590,334,80,26,'▶',()=>this.tradeScreen(cur,'send',(page+1)%pages),false,9);
   }
  }else{
   originalBallSprite(this,320,150,'pokeball',40,5);
   this.uiLabel(320,190,'Peça para seu amigo enviar um Pokémon',11,'#ffffff',[.5,.5]);
   this.uiLabel(320,208,'Ele toca em ENVIAR, copia o código e te manda (WhatsApp etc.)',8,MENU_UI.suave,[.5,.5]);
   this.uiLabel(320,224,'O nível fica no limite da sua etapa, como na obediência do FireRed.',7,MENU_UI.tenue,[.5,.5]);
   this.button(320,268,240,30,'COLAR CÓDIGO',()=>{
    const code=window.prompt('Cole o código de troca (começa com T2P-):','');
    if(code)this.confirmReceiveTrade(readCampaign()||cur,code.trim());
   },true,10).setData('torre2-trade-paste',true);
  }
  this.button(150,334,240,28,'◀ VOLTAR AOS CARDS',()=>this.renderCampaign(readCampaign()||cur)).setData('torre2-trade-back',true);
  this.__torre2Trade={mode,count:(cur.team||[]).length+(cur.box||[]).length};
 }
 confirmSendTrade(state,m,name){
  const lv=m.progression?.level||5,nice=String(m.id).replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
  this.tradeOverlay(({D,g,keep,lift,close})=>{
   keep(this.uiLabel(320,94,'Enviar '+nice+' Nv '+lv+'?',13,MENU_UI.amarillo,[.5,.5],D+2));
   keep(this.pokemonIdleSprite(m.id,320,170,60,D+2,null,'height'));
   keep(this.uiLabel(320,196,'Ele sai do seu save e vira um código para o seu amigo.',8,'#ffffff',[.5,.5],D+2));
   keep(this.uiLabel(320,212,'Só envie se for mesmo trocar: o código vale uma vez.',7,'#ffb0b0',[.5,.5],D+2));
   lift(this.button(230,252,160,28,'CANCELAR',close,false,9));
   lift(this.button(410,252,160,28,'ENVIAR',()=>{
    const r=sendTrade(readCampaign()||state,m.uid,name);close();
    if(!r.ok)return this.campaignNotice(r.reason,'#ff9daa');
    this.tradeScreen(readCampaign()||state,'send');this.showTradeCode(r.code,nice,lv);
   },true,9).setData('torre2-trade-send',m.uid));
  });
 }
 showTradeCode(code,nice,lv){
  this.tradeOverlay(({D,g,keep,lift,close})=>{
   keep(this.uiLabel(320,94,'Código de troca: '+nice+' Nv '+lv,12,MENU_UI.amarillo,[.5,.5],D+2));
   keep(this.uiLabel(320,114,'Mande para seu amigo: ele cola em TROCA → RECEBER',7,MENU_UI.suave,[.5,.5],D+2));
   nativeRect(g,110,130,420,52,0xf4f1e6,6);
   const t=keep(textoMenu(this,320,156,code,{tam:8,color:MENU_UI.textoOscuro,borde:0,literal:true}).setOrigin(.5).setDepth(D+2));
   estrechar(t,400);t.setData('torre2-trade-code',code);
   keep(this.uiLabel(320,198,'Guarde o código até seu amigo receber.',7,'#ffd47a',[.5,.5],D+2));
   lift(this.button(230,252,160,28,'COPIAR',async()=>{
    try{await navigator.clipboard.writeText(code);this.campaignNotice('Código copiado!','#9ff0bf')}
    catch{window.prompt('Copie o código:',code)}
   },true,9).setData('torre2-trade-copy',true));
   lift(this.button(410,252,160,28,'FECHAR',close,false,9));
  });
 }
 confirmReceiveTrade(state,code){
  const p=previewTrade(state,code);
  if(!p.ok)return this.campaignNotice(p.reason,'#ff9daa');
  const nice=String(p.id).replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
  this.tradeOverlay(({D,g,keep,lift,close})=>{
   keep(this.uiLabel(320,94,nice+(p.shiny?' ✦':'')+' Nv '+p.level,13,p.shiny?MENU_UI.amarillo:'#ffffff',[.5,.5],D+2));
   keep(this.pokemonIdleSprite(p.id,320,170,60,D+2,null,'height'));
   keep(this.uiLabel(320,196,'Enviado por '+p.from,9,MENU_UI.amarillo,[.5,.5],D+2));
   if(p.originalLevel>p.level)keep(this.uiLabel(320,212,'Nível '+p.originalLevel+' → '+p.level+' (limite da sua etapa)',7,'#ffd47a',[.5,.5],D+2));
   lift(this.button(230,252,160,28,'CANCELAR',close,false,9));
   lift(this.button(410,252,160,28,'RECEBER',()=>{
    const r=receiveTrade(readCampaign()||state,code);close();
    if(!r.ok)return this.campaignNotice(r.reason,'#ff9daa');
    this.tradeScreen(readCampaign()||state,'receive');this.campaignNotice(nice+' chegou! Foi para: '+r.dest,'#9ff0bf');
   },true,9).setData('torre2-trade-receive',true));
  });
 }
 // Full-screen FireRed map slice for a story scene (bg from story.js
 // storyCrop). Loads the location sheet on demand; false when no place.
 storyBackdrop(bg,depth){
  if(!(bg?.loc||bg?.art)||!Array.isArray(bg.crop))return false;
  // FireRed map sheets are nearest-filtered; owner illustrations smooth.
  const key=bg.art?'torre2-art-'+bg.art:'frlg-location-'+bg.loc,frame='torre2-story-'+bg.crop.join('-');
  const url=bg.art?'assets/ui/torre2-campaign/'+bg.art+'.png':'assets/ui/frlg/'+bg.loc+'.png';
  const slot=this.add.container(0,0).setDepth(depth);
  const draw=()=>{
   if(!slot.active||!this.textures.exists(key))return;
   const tex=this.textures.get(key),src=tex.getSourceImage(),[x,y,w,h]=bg.crop;
   if(x+w>src.width||y+h>src.height)return;
   if(!tex.has(frame))tex.add(frame,0,x,y,w,h);
   tex.setFilter(bg.art?Phaser.Textures.FilterMode.LINEAR:Phaser.Textures.FilterMode.NEAREST);
   slot.removeAll(true);
   slot.add(this.add.image(0,0,key,frame).setOrigin(0).setDisplaySize(640,360));
   // Soft shade: light over the room, darker under the title and the
   // dialogue box so the text stays readable.
   const s=this.add.graphics();
   s.fillStyle(0x0a1424,.18).fillRect(0,0,640,360);
   for(let i=0;i<8;i++){s.fillStyle(0x0a1424,.07).fillRect(0,0,640,56-i*6);s.fillStyle(0x0a1424,.06).fillRect(0,200+i*14,640,160-i*14)}
   slot.add(s);
  };
  if(this.textures.exists(key)){draw();return true}
  // Plain night-blue until the sheet arrives (cached after the first time).
  slot.add(this.add.graphics().fillStyle(0x16243a,1).fillRect(0,0,640,360));
  this.load.once('filecomplete-image-'+key,draw);
  const queued=[this.load.list,this.load.inflight].some(set=>(set?.entries||[]).some(f=>f?.key===key));
  if(!queued){this.load.image(key,url);if(!this.load.isLoading())this.load.start()}
  return true;
 }
 // Story scene before a battle: first Rival / Team Rocket battle of a stage,
 // gym leaders, Elite Four and Champion (intro, type reaction, retry line).
 // Tap: finish the line / next line. PULAR skips.
 playStory(state,scene,onDone){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('dungeon');
  const D=50,who=scene.speaker||scene.lines[0][0];
  const tone=who==='rocket'?[0x5a2a3a,0xb83a4a]:who==='rival'?[0x2a4a8c,0x4a7ad8]:[0x6a4a1a,0xc8962a];
  // The real place behind them: a slice of its FireRed map (gym room,
  // Elite Four room, S.S. Anne deck, Silph lobby...), as on the gym cards.
  // Leaders: their own pixel-art room in the gym type colour (as on the gym
  // challenge screen), full screen, with a soft shade under the text.
  let hasPlace=false;
  if(scene.bg?.room){
   const st=Number(state?.stage)||0,spec=STAGES[st]||{};
   this.leaderRoom(0,0,640,360,st,spec.type||(st>=8?'DRAGON':'NORMAL'));
   const sh=this.add.graphics().setDepth(D-1);
   for(let i=0;i<8;i++)sh.fillStyle(0x0a1424,.06).fillRect(0,200+i*14,640,160-i*14);
   hasPlace=true;
  }else hasPlace=this.storyBackdrop(scene.bg,2);
  const g=this.add.graphics().setDepth(D);
  if(!hasPlace)g.fillStyle(0x000000,.35).fillRect(0,0,640,360);
  this.screenBanner(20,300,scene.place,'badges');
  // Two figures facing each other, standing on the floor of the place.
  g.fillStyle(0x000000,.38).fillEllipse(200,238,84,16).fillEllipse(440,238,84,16);
  if(!hasPlace){
   g.fillStyle(tone[0],.9).fillEllipse(200,232,104,16);
   g.fillStyle(0x2a4a8c,.9).fillEllipse(440,232,104,16);
  }
  this.npcSprite(spriteIdForTrainer(who),200,234,4,D+1);
  this.npcSprite(playerSpriteId(),440,234,4,D+1);
  // FireRed dialogue box.
  const box=this.add.graphics().setDepth(D+2);
  box.fillStyle(0x283c68,1).fillRoundedRect(16,256,608,90,10);
  box.fillStyle(0x6a8ad0,1).fillRoundedRect(20,260,600,82,8);
  box.fillStyle(0xf8f8f8,1).fillRoundedRect(25,265,590,72,6);
  const tag=this.add.graphics().setDepth(D+2);
  tag.fillStyle(0x283c68,1).fillRoundedRect(28,240,150,24,6);tag.fillStyle(tone[1],1).fillRoundedRect(30,242,146,20,5);
  this.uiLabel(103,252,scene.speakerName||SPEAKERS[who]||'RIVAL',9,'#ffffff',[.5,.5],D+3);
  const txt=textoMenu(this,40,282,'',{tam:11,color:'#303030',borde:0,literal:true}).setOrigin(0,0).setDepth(D+3);
  txt.setWordWrapWidth?.(560);
  const arrow=this.uiLabel(598,326,'▼',9,'#d04848',[.5,.5],D+3);
  this.tweens.add({targets:arrow,y:330,duration:400,yoyo:true,repeat:-1});
  let line=0,shown=0,timer=null,finished=false;
  const finish=()=>{if(finished)return;finished=true;timer?.remove();
   const cur=readCampaign()||state,next=markStorySeen(cur,scene.key);
   try{saveCampaign(next)}catch{}
   onDone(next)};
  const show=()=>{const full=scene.lines[line][1];shown=0;arrow.setVisible(false);timer?.remove();
   timer=this.time.addEvent({delay:24,repeat:full.length-1,callback:()=>{shown++;txt.setText(full.slice(0,shown));
    if(shown>=full.length)arrow.setVisible(true)}})};
  const advance=()=>{const full=scene.lines[line][1];
   if(shown<full.length){timer?.remove();shown=full.length;txt.setText(full);arrow.setVisible(true);return}
   line++;if(line>=scene.lines.length)return finish();show()};
  const z=this.add.zone(320,180,640,360).setDepth(D+4).setInteractive({useHandCursor:true}).setData('torre2-story-next',true);
  let entering=!!scene.entrance;
  z.on('pointerdown',()=>{if(entering)return;sfx('seleccion');advance()});
  this.button(580,64,90,22,'PULAR',()=>finish(),false,8).setDepth?.(D+6);
  this.children.list.slice(-3).forEach(o=>{o.setDepth?.(D+6);o.setData?.('torre2-story-skip',true)});
  // First meeting with a leader / Elite Four / Champion (owner list item 18):
  // FireRed-style entrance, the leader slides in and a band with the name
  // crosses the screen; the dialogue starts after it (a tap skips it).
  if(entering)this.storyEntrance(who,tone,D,()=>{entering=false;show()},z);else show();
  this.__torre2Story={key:scene.key,lines:scene.lines.length,entrance:!!scene.entrance};
 }
 storyEntrance(who,tone,D,start,zone){
  const id=spriteIdForTrainer(who);
  // Band across the top (above both figures, below the place banner).
  const band=this.add.container(640,40).setDepth(D+5).setData('torre2-story-entrance',true);
  const g=this.add.graphics();
  g.fillStyle(0x000000,.55).fillRect(0,-4,640,72);
  g.fillStyle(tone[1],1).fillRect(0,0,640,64);g.fillStyle(tone[0],1).fillRect(0,0,640,6).fillRect(0,58,640,6);
  const title=['lorelei','bruno','agatha','lance'].includes(who)?'ELITE FOUR':who==='rival'?'CAMPEÃO':'LÍDER DE GINÁSIO';
  band.add([g,this.uiLabel(320,20,title,9,'#ffe9a8',[.5,.5],0),this.uiLabel(320,42,SPEAKERS[who]||'',20,'#ffffff',[.5,.5],0)]);
  let ended=false;
  const end=()=>{if(ended)return;ended=true;zone.off('pointerdown',skip);
   this.tweens.add({targets:band,alpha:0,duration:220,onComplete:()=>band.destroy()});
   const img=this.children.list.find(o=>o.getData?.('torre2-npc-sprite')===id);
   if(img){this.tweens.killTweensOf(img);img.x=200}
   start()};
  const skip=()=>end();
  zone.on('pointerdown',skip);
  this.tweens.add({targets:band,x:0,duration:380,ease:'Cubic.easeOut'});
  // The leader walks in from the left edge (once the sprite is loaded).
  this.time.delayedCall(0,()=>{
   const img=this.children.list.find(o=>o.getData?.('torre2-npc-sprite')===id);
   if(img&&!ended){img.x=-60;this.tweens.add({targets:img,x:200,duration:700,ease:'Quad.easeOut'})}
  });
  sfx('confirmar');
  this.time.delayedCall(1500,end);
  // Slow phones run the game clock behind real time: never wait more than 2 s.
  const t=setTimeout(()=>{if(this.scene.isActive())end()},2000);
  this.events.once('shutdown',()=>clearTimeout(t));
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
  const legacy=this.legacySync(state),title=titleById(legacy.activeTitle);
  // Card colour: the active permanent title's rarity, else badge progress.
  const tier=title?this.rarityColor(title.rarity):got>=8?MENU_UI.oro:got>=4?0xc0c8d8:got>=1?0xcd8a4a:0x5f86bd;
  const g=this.add.graphics().setDepth(2);
  nativeRect(g,36,44,568,250,MENU_UI.contorno,12);
  nativeRect(g,38,46,564,246,tier,11);
  nativeRect(g,46,54,548,230,0x0f2352,9);
  g.fillStyle(0xffffff,.05).fillRect(50,58,540,40);
  this.uiLabel(64,76,'CARTÃO DE TREINADOR',11,MENU_UI.amarillo);
  this.uiLabel(580,76,'ID Nº '+String(h).padStart(5,'0'),9,MENU_UI.suave,[1,.5]);
  g.fillStyle(MENU_UI.panelBorde,1).fillRect(56,96,528,1);
  const dexSeen=new Set([...(state.dexSeen||[]),...(state.dexCaught||[])]).size;
  const rows=[['Nome',name],['Título',title?title.name:'—'],['Campanha zerada',legacy.championRuns.length+'×'],
   ['Dinheiro','₽ '+Number(state.money||0).toLocaleString('pt-BR')],
   ['Pokédex',(state.dexCaught||[]).length+' capturados · '+dexSeen+' vistos'],
   ['Vitórias',(state.wins||0)+' vitórias · '+(state.losses||0)+' derrotas'],
   ['Equipe',(state.team||[]).length+' na equipe · '+(state.box||[]).length+' no PC'],
   ['Shiny',(state.dexShinyCaught||[]).length+' capturados · '+(state.dexShinySeen||[]).length+' avistados']];
  rows.forEach(([k,v],i)=>{
   const y=108+i*19;
   nativeRect(g,60,y-9,340,18,i%2?0x0c1d46:0x12285a,5,.9);
   this.uiLabel(70,y+1,k,8,MENU_UI.suave);
   estrechar(this.uiLabel(390,y+1,v,9,i===0||(i===1&&title)?MENU_UI.amarillo:'#ffffff',[1,.5]),220);
  });
  // The player's own FireRed character in a framed window.
  nativeRect(g,420,106,160,130,MENU_UI.contorno,8);nativeRect(g,422,108,156,126,0x1d3c7a,7);
  g.fillStyle(0xffffff,.06).fillCircle(500,160,48);
  g.fillStyle(0x000000,.3).fillEllipse(500,222,70,12);
  this.npcSprite(playerSpriteId(),500,224,3.6,5);
  // Pokédex medal (owner list item 21): bronze 50, silver 100, gold 151.
  const caughtN=new Set(state.dexCaught||[]).size,medal=caughtN>=151?[MENU_UI.oro,'OURO']:caughtN>=100?[0xc0c8d8,'PRATA']:caughtN>=50?[0xcd8a4a,'BRONZE']:null;
  if(medal){g.fillStyle(MENU_UI.contorno,1).fillCircle(556,130,15);g.fillStyle(medal[0],1).fillCircle(556,130,13);
   g.fillStyle(0xffffff,.35).fillCircle(552,126,5);
   this.uiLabel(556,131,'★',10,MENU_UI.textoOscuro,[.5,.5],6).setData('torre2-dex-medal',medal[1]);
   this.uiLabel(556,152,medal[1],6,'#ffffff',[.5,.5],6);}
  // Badge strip.
  nativeRect(g,60,250,520,30,0x081436,6,.9);
  this.uiLabel(70,265,'Insígnias',8,MENU_UI.suave);
  for(let i=0;i<8;i++)drawBadgeIcon(this,i,170+i*48,265,state.badges?.includes(HALL_BADGE_ORDER[i]),1.3).setDepth(6);
  this.button(86,330,150,28,'◀ VOLTAR',()=>this.renderCampaign(state),false,9)
   .setData('torre2-trainer-card-back',true);
  const won=this.achievementList(state).filter(a=>a.done).length;
  this.button(242,330,150,28,'CONQUISTAS '+won,()=>this.achievementsScreen(state),true,9)
   .setData('torre2-trainer-card-achievements',true);
  this.button(398,330,150,28,'TÍTULOS '+Object.keys(legacy.titles).length,()=>this.titlesScreen(state),true,9)
   .setData('torre2-trainer-card-titles',true);
  this.button(554,330,150,28,'MUSEU',()=>this.museumScreen(state),true,9)
   .setData('torre2-trainer-card-hall',true).setData('torre2-trainer-card-museum',true);
  this.__torre2TrainerCard={name,id:h,badges:got};
 }
 // Museu de conquistas (owner 2026-11-22, item 4): one gallery of everything
 // earned. Read-only: badges, League honours, legendaries, records, titles;
 // the Hall of Fame, Achievements and Titles screens open from here.
 museumScreen(state){
  this.children.removeAll(true);this.backdrop();this.campaignMusic('town');
  this.screenBanner(20,300,'Museu de conquistas','badges');
  const legacy=this.legacySync(state),g=this.add.graphics().setDepth(2);
  const hall=(x,y,w,h,title)=>{nativeRect(g,x,y,w,h,MENU_UI.contorno,8);nativeRect(g,x+2,y+2,w-4,h-4,0x14234f,7);
   g.fillStyle(MENU_UI.oro,1).fillRect(x+8,y+20,w-16,1);this.uiLabel(x+10,y+12,title,9,MENU_UI.amarillo,[0,.5],4)};
  // Badges and League honours on pedestals.
  hall(10,42,300,92,'Insígnias e Liga');
  for(let i=0;i<8;i++){const x=30+i*35,y=78;g.fillStyle(0x0a1430,1).fillRect(x-13,y+12,26,6);
   drawBadgeIcon(this,i,x,y,state.badges?.includes(HALL_BADGE_ORDER[i]),1.2).setDepth(6)}
  const honors=(state.leagueHonors||[]).length;
  this.uiLabel(160,116,'Liga: '+honors+'/5 honras · '+(state.champion?'CAMPEÃO ★':'ainda não campeão'),8,state.champion?MENU_UI.amarillo:'#dcf4fb',[.5,.5],4);
  // Legendaries: coloured if caught, silhouette if not.
  hall(316,42,314,92,'Lendários');
  LEGENDARIES.forEach((leg,i)=>{const x=342+i*43,caught=(state.dexCaught||[]).includes(leg.id);
   const sp=this.pokemonIdleSprite(leg.id,x,120,30,5,sp2=>{if(!caught)sp2.setTint(0x101828)},'height');if(sp&&!caught)sp.setTint?.(0x101828);
   if(caught)this.uiLabel(x,128,'★',7,MENU_UI.amarillo,[.5,.5],6)});
  // Records.
  hall(10,140,620,142,'Recordes');
  let mp={w:0,l:0};try{const h=JSON.parse(localStorage.getItem('torre2-multiplayer-historico')||'[]');if(Array.isArray(h))mp={w:h.filter(m=>m.won).length,l:h.filter(m=>!m.won).length}}catch{}
  const caught=new Set(state.dexCaught||[]).size;
  const rows=[
   ['Pokédex',caught+'/151 capturados'+(caught>=151?' · OURO':caught>=100?' · PRATA':caught>=50?' · BRONZE':'')],
   ['Shiny capturados',String((state.dexShinyCaught||[]).length)],
   ['Campanha zerada',legacy.championRuns.length+'×'],
   ['Torre de desafios','melhor andar '+(Number(state.tower?.best)||0)],
   ['Eventos 3x3',((state.events3x3?.won||[]).length)+'/'+EVENTS_3X3.length+' vencidos'],
   ['Batalhas',(state.wins||0)+' vitórias · '+(state.losses||0)+' derrotas'],
   ['Multiplayer',mp.w+' vitórias · '+mp.l+' derrotas'],
   ['Títulos',Object.keys(legacy.titles||{}).length+' de '+TITLES.length],
   ['Rivalidades vencidas',String(Number(state.rivalryWins)||0)],
   ['Itens de batalha',String(Object.values(state.inventory?.held||{}).reduce((a,b)=>a+(Number(b)||0),0)+[...(state.team||[]),...(state.box||[])].filter(m=>m?.heldItem).length)]];
  rows.forEach(([k,v],i)=>{const x=24+(i%2)*306,y=172+Math.floor(i/2)*21;
   nativeRect(g,x-6,y-10,296,19,i%4<2?0x12285a:0x0c1d46,5,.9);
   this.uiLabel(x,y,k,8,MENU_UI.suave,[0,.5],4);estrechar(this.uiLabel(x+282,y,v,9,'#ffffff',[1,.5],4),170)});
  this.button(86,330,150,28,'◀ CARTÃO',()=>this.trainerCardScreen(state),false,9).setData('torre2-museum-back',true);
  this.button(242,330,150,28,'SALÃO DA FAMA',()=>this.hallHistoryScreen(state),true,9).setData('torre2-museum-hall',true);
  this.button(398,330,150,28,'CONQUISTAS',()=>this.achievementsScreen(state),true,9).setData('torre2-museum-achievements',true);
  this.button(554,330,150,28,'TÍTULOS',()=>this.titlesScreen(state),true,9).setData('torre2-museum-titles',true);
  this.__torre2Museum={caught,legendaries:LEGENDARIES.filter(l=>(state.dexCaught||[]).includes(l.id)).length,events:(state.events3x3?.won||[]).length};
 }
 // Achievements computed only from the existing save (read-only).
 achievementList(state){
  const caught=(state.dexCaught||[]).length,seen=new Set([...(state.dexSeen||[]),...(state.dexCaught||[])]).size;
  const owned=(state.team||[]).length+(state.box||[]).length,badges=(state.badges||[]).length,wins=state.wins||0;
  const shiny=(state.dexShinyCaught||[]).length;
  return [
   ['Primeiro parceiro','Recebeu o Pokémon inicial',owned,1],
   ['Primeira captura','Capturou um Pokémon selvagem',owned,2],
   ['Colecionador','Capture 10 espécies',caught,10],
   ['Pesquisador','Veja 50 espécies',seen,50],
   ['Mestre da Pokédex','Capture as 151 espécies',caught,151],
   ['Equipe completa','Tenha 6 Pokémon na equipe',(state.team||[]).length,6],
   ['Primeira insígnia','Vença o primeiro líder',badges,1],
   ['Meio caminho','Conquiste 4 insígnias',badges,4],
   ['Todas as insígnias','Conquiste as 8 insígnias',badges,8],
   ['Campeão de Kanto','Vença a Liga Pokémon',state.champion?1:0,1],
   ['Veterano','Vença 10 batalhas',wins,10],
   ['Lenda','Vença 50 batalhas',wins,50],
   ['Brilho raro','Capture um Pokémon shiny',shiny,1]
  ].map(([name,desc,value,goal])=>({name,desc,value:Math.min(value,goal),goal,done:value>=goal}));
 }
 achievementsScreen(state){
  this.children.removeAll(true);this.backdrop();
  const list=this.achievementList(state),done=list.filter(a=>a.done).length;
  this.screenBanner(20,300,'Conquistas','badges');
  this.uiLabel(320,46,done+' de '+list.length+' conquistadas',8,MENU_UI.suave,[.5,.5]);
  this.uiSection(8,56,624,252);
  const g=this.add.graphics().setDepth(3);
  list.forEach((a,i)=>{
   const x=16+(i%4)*154,y=64+Math.floor(i/4)*60;
   nativeRect(g,x,y,150,56,a.done?MENU_UI.oro:MENU_UI.apagadoBorde,7);
   nativeRect(g,x+2,y+2,146,52,a.done?0x2a3f78:0x0a1638,6);
   // Medal.
   g.fillStyle(MENU_UI.contorno,1).fillCircle(x+22,y+28,15);
   g.fillStyle(a.done?MENU_UI.oroBorde:0x3a4a6a,1).fillCircle(x+22,y+28,13);
   g.fillStyle(a.done?MENU_UI.oro:0x26324a,1).fillCircle(x+22,y+28,10);
   this.uiLabel(x+22,y+28,a.done?'★':'?',10,a.done?MENU_UI.textoOscuro:'#5f7099',[.5,.5],5);
   estrechar(this.uiLabel(x+42,y+16,a.name,8,a.done?MENU_UI.amarillo:'#c8d6f0'),102);
   estrechar(this.uiLabel(x+42,y+30,a.desc,6,a.done?'#dcf4fb':MENU_UI.tenue),102);
   const reward=ACHIEVEMENT_REWARDS[a.name],claimed=(state.achievementClaims||[]).includes(a.name);
   if(a.done&&reward&&!claimed){
    nativeRect(g,x+94,y+36,52,17,MENU_UI.contorno,5);nativeRect(g,x+95,y+37,50,15,MENU_UI.oro,4);
    textoMenu(this,x+120,y+45,'Resgatar',{tam:7,color:MENU_UI.textoOscuro,borde:0,literal:true}).setOrigin(.5).setDepth(6);
    const z=this.add.zone(x+120,y+45,54,20).setDepth(8).setInteractive({useHandCursor:true}).setData('torre2-achievement-claim',a.name);
    z.on('pointerdown',(_p,_x,_y,e)=>{e?.stopPropagation?.();
     const cur=readCampaign()||state,next=claimAchievement(cur,a.name);
     if(!next)return this.achievementsScreen(cur);
     try{saveCampaign(next)}catch{return this.campaignNotice('Recompensa não salva: tente de novo','#ff9d9d')}
     this.achievementsScreen(next);this.campaignNotice('Recompensa: '+rewardLabel(reward),'#9ff0bf');
    });
    estrechar(this.uiLabel(x+42,y+45,rewardLabel(reward),6,'#ffd47a'),48);
   }else if(a.done&&reward&&claimed){this.uiLabel(x+42,y+45,'✓ '+rewardLabel(reward),6,'#9ff0bf');}
   else if(!a.done&&a.goal>1){
    nativeRect(g,x+42,y+40,80,6,MENU_UI.contorno,3);
    if(a.value>0)nativeRect(g,x+43,y+41,Math.max(2,Math.round(78*a.value/a.goal)),4,0x50cc84,2);
    this.uiLabel(x+140,y+43,a.value+'/'+a.goal,6,MENU_UI.suave,[1,.5]);
   }else if(a.done&&!reward)this.uiLabel(x+42,y+43,'Concluída',6,'#9ff0bf');
  });
  this.button(220,334,190,28,'◀ CARTÃO',()=>this.trainerCardScreen(state)).setData('torre2-achievements-back',true);
  this.button(430,334,190,28,'VOLTAR AOS CARDS',()=>this.renderCampaign(state));
  this.__torre2Achievements={done,total:list.length};
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
 enterBattle(state,wild=false,{skipStory=false}={}){
  // Rival / Team Rocket / leader: FireRed-style story scene first.
  if(!wild&&!skipStory){const story=storyFor(state,currentOpponent(state),{leadTypes:this.speciesTypes(state.team?.[state.active]?.id)});
   if(story)return this.playStory(state,story,next=>this.enterBattle(next,false,{skipStory:true}));}
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
  // Battle weather by chance (owner 2026-11-22): low chance of the leader's
  // type weather (Blaine sun, Misty rain...) or today's route weather.
  match.torre2.weather=battleWeatherRoll({leader:!!foe.leader,wild,
   stageType:STAGES[Math.min(state.stage,STAGES.length-1)]?.type,routeSky:routeWeather(Math.min(state.stage,8))});
  if(match.torre2.weather!=='none')this.campaignNotice(WEATHER_INTRO[match.torre2.weather]||'',MENU_UI.amarillo);
  else if(!wild&&partyHasRivalry(party))this.campaignNotice('Rivalidade! Pokémon rivais nesta luta lutam com mais garra (+10%).','#ffb37a');
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
 // Light weather animation over a header strip (rain, sun, sand, hail, fog).
 routeWeatherFx(kind,x,y,w,h,depth){
  if(kind==='clear')return;
  const rnd=(a,b)=>a+Math.random()*(b-a),objs=[];
  const add=o=>{o.setDepth(depth).setData('torre2-weather-fx',kind);objs.push(o);return o};
  if(kind==='sun'){
   const g=add(this.add.graphics());g.fillStyle(0xfff0a0,.16);
   for(let i=0;i<5;i++)g.fillTriangle(x+40+i*30,y,x+120+i*70,y+h,x+150+i*70,y+h);
   this.tweens.add({targets:g,alpha:{from:.6,to:1},duration:1400,yoyo:true,repeat:-1});
   return;
  }
  if(kind==='fog'){
   for(let i=0;i<3;i++){const b=add(this.add.rectangle(x+rnd(0,w),y+18+i*24,w*.7,14,0xdfe6f2,.22));
    this.tweens.add({targets:b,x:b.x+120*(i%2?1:-1),duration:5000+i*900,yoyo:true,repeat:-1,ease:'Sine.inOut'})}
   return;
  }
  const n=kind==='rain'?36:kind==='sand'?44:26;
  const col=kind==='rain'?0x9cc8ff:kind==='sand'?0xe0c080:0xffffff;
  for(let i=0;i<n;i++){
   const px=x+rnd(0,w),py=y+rnd(0,h);
   const o=add(kind==='rain'?this.add.rectangle(px,py,2,8,col,.75):this.add.rectangle(px,py,kind==='hail'?3:2,kind==='hail'?3:2,col,.85));
   const dur=kind==='rain'?rnd(380,620):kind==='sand'?rnd(900,1500):rnd(1100,1800);
   const dx=kind==='rain'?-10:kind==='sand'?140:-12;
   this.tweens.add({targets:o,y:{from:y,to:y+h},x:{from:px,to:Math.min(x+w,Math.max(x,px+dx))},duration:dur,repeat:-1,delay:rnd(0,dur)});
  }
 }
 grassScreen(state,areaStage=null){
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
   list.forEach(obj=>{this.tweens.killTweensOf(obj);obj.active&&obj.destroy()});
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
  // areaStage: a completed city chosen on the Kanto map (hunt there again).
  const revisit=Number.isInteger(areaStage)&&areaStage!==state.stage;
  const area=wildAvailability(revisit?areaStage:state.stage);
  // Landscape header from the owner's journey art (top strip: forest/town).
  ownerArt(this,{add:o=>o.setDepth?.(613)},'journey-bg',32,26,576,84,null,.5,0);
  const head=this.add.graphics().setDepth(614);
  nativeAro(head,31,25,578,86,MENU_UI.panelBorde,6);
  head.fillStyle(0x061433,.55).fillRect(32,80,576,30);
  label(320,48,'Grama alta · '+area.label,15,MENU_UI.amarillo);
  if(revisit)label(320,70,'Voltando a '+(STAGES[areaStage]?.city||'Kanto')+' para caçar',9,'#9ff0bf');
  // Route weather (owner list item 16): visual + how often each species of
  // this route's own table appears. Never battle weather, never new species.
  const sky=routeWeather(revisit?areaStage:state.stage),SKY=ROUTE_WEATHERS[sky];
  this.routeWeatherFx(sky,32,26,576,84,613.5);
  estrechar(label(320,94,area.area+'  ·  '+SKY.name+(sky==='clear'?'':': '+SKY.hint),8,'#ffffff'),560)
   .setData('torre2-route-weather',sky);
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
   const putPortrait=()=>{
    if(!cards.active||!this.textures.exists(key))return;
    // Original PMD pixel portrait, with no silhouette substitution or VFX.
    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    // Approved size (visual guard): the original 22 px PMD portrait.
    this.add.image(x+21,y+21,key).setDisplaySize(22,22).setAlpha(available?1:.55)
     .setDepth(619).setData('torre2-grass-sprite',id);
   };
   if(key&&this.textures.exists(key))putPortrait();
   // A revisited city's portraits are not preloaded: fetch them now.
   else if(key)requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',putPortrait);
   const nice=id.replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
   estrechar(this.uiLabel(x+44,y+13,nice,8,owned?'#d7ffda':available?'#ffffff':MENU_UI.tenue,[0,.5],620),72)
    .setData('torre2-grass-name',id);
   if(owned)originalBallSprite(this,x+126,y+11,'pokeball',11,621);
   if(available)types.slice(0,2).forEach((t,k)=>{pastillaTipo(cards,x+44+k*44,y+24,t,41,11);
    this.uiLabel(x+64+k*44,y+30,t[0]+t.slice(1).toLowerCase(),6,'#ffffff',[.5,.5],620)});
   else this.uiLabel(x+44,y+30,'Aparece mais tarde',7,MENU_UI.apagadoTexto,[0,.5],620);
   const ww=available?weatherWeight(sky,kantoTypes(id)):1;
   if(ww!==1)this.uiLabel(x+131,y+33,ww>1?'▲':'▼',8,ww>1?'#7dff8a':'#ff8a7a',[.5,.5],621)
    .setData('torre2-weather-mark',ww>1?'more':'less');
  });
  label(320,262,'Encontros realizados: '+(state.wildEncountersStage||0)+' · sem limite',8,MENU_UI.amarillo);
  modalButton(174,292,224,30,'◀ VOLTAR AO MAPA',close);
  modalButton(466,292,224,30,'PROCURAR POKÉMON',()=>{
   let found;
   try{found=startWildEncounter(state,Math.random,revisit?areaStage:null,sky);}
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
  if(!this.pokemonIdleSprite(member.id,x+size/2,y+size-7,size-12,6,null,true))
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
 // Ficha individual (README 5/9/1/10): potential, hidden ability, held item
 // and rival species of one Pokémon. Items equip from inventory.held.
 individualScreen(state,index){
  this.children.removeAll(true);this.backdrop();
  const cur=readCampaign()||state,member=cur.team[index];if(!member)return this.showSummary(cur,0);
  this.screenBanner(20,300,'Ficha do Pokémon','badges');
  const g=this.add.graphics().setDepth(2);
  nativeRect(g,12,44,200,250,MENU_UI.contorno,8);nativeRect(g,14,46,196,246,0x13233b,7);
  const p=potentialOf(member),stars=potentialStars(p);
  // Card glow by rating (1 star grey … 5 stars gold).
  const glow=[0,0x5d6b80,0x4e92bc,0x5fbf8f,0xb57cf0,0xf2c14e][stars];
  g.fillStyle(glow,.16).fillRoundedRect(18,50,188,130,6);
  g.fillStyle(0x000000,.3).fillEllipse(112,158,90,14);
  this.pokemonIdleSprite(member.id,112,158,80,5,null,'height');
  const nice=member.id.replace(/-/g,' ').replace(/(^|\s)\S/g,c=>c.toUpperCase());
  this.uiLabel(112,64,nice+' · Nv '+(member.progression?.level||5),11,MENU_UI.amarillo,[.5,.5],4);
  // Potential: five drawn pixel stars (filled gold / empty slate) popping in.
  this.uiLabel(112,176,'POTENCIAL',8,'#ffe08a',[.5,.5],4);
  const starPts=r=>Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,q=i%2?r*.45:r;return new Phaser.Geom.Point(Math.cos(a)*q,Math.sin(a)*q)});
  for(let i=0;i<5;i++){
   const on=i<stars,sg=this.add.graphics({x:64+i*24,y:194}).setDepth(4);
   if(on){sg.fillStyle(0x7a4a00,1).fillPoints(starPts(10),true);sg.fillStyle(0xffd23f,1).fillPoints(starPts(8.5),true);
    sg.fillStyle(0xfff3b0,1).fillPoints(starPts(3.5).map(pt=>new Phaser.Geom.Point(pt.x-1.5,pt.y-2)),true)}
   else{sg.fillStyle(0x0c1725,1).fillPoints(starPts(10),true);sg.fillStyle(0x34465f,1).fillPoints(starPts(8),true)}
   sg.setScale(on?0:1).setData('torre2-ficha-star',on?'on':'off');
   if(on)this.tweens.add({targets:sg,scale:1,duration:260,delay:120+i*90,ease:'Back.Out'});
   if(on&&stars===5)this.tweens.add({targets:sg,alpha:.65,duration:700,delay:700+i*120,yoyo:true,repeat:-1});
  }
  this.uiLabel(112,212,potentialTotalWord(p),9,'#'+glow.toString(16).padStart(6,'0'),[.5,.5],4).setData('torre2-ficha-stars',stars);
  // Stats: segmented bar (31 points) + FireRed-style judge word.
  POTENTIAL_STATS.forEach(([k,label],i)=>{const v=p[k],y=232+i*20,c=[0x64cb9c,0xf6a268,0x7ab3f5][i];
   this.uiLabel(22,y,label,8,MENU_UI.suave,[0,.5],4);
   nativeRect(g,46,y-5,84,10,0x0c1725,3);
   const seg=Math.round(v/31*12);
   for(let j=0;j<12;j++){g.fillStyle(j<seg?c:0x22324a,1).fillRect(48+j*6.7,y-3,5.4,6)}
   if(v>=31)g.fillStyle(0xffffff,.45).fillRect(48,y-3,80,2);
   this.uiLabel(142,y,v+'',7,'#ffffff',[.5,.5],4);
   this.uiLabel(206,y,potentialGrade(v),6,v>=26?'#ffe08a':'#b9c8e0',[1,.5],4);
  });
  // Right column: ability, item, bag, rivals (one card each).
  nativeRect(g,222,44,406,250,MENU_UI.contorno,8);nativeRect(g,224,46,402,246,0x13233b,7);
  const card=(y,h,color,a=.14)=>{g.fillStyle(color,a).fillRoundedRect(230,y,390,h,5);g.lineStyle(1,color,.55).strokeRoundedRect(230,y,390,h,5)};
  const ha=hiddenAbilityOf(member);
  card(50,50,ha?0xb57cf0:0x4e6a8f,ha?.18:.08);
  this.uiLabel(240,62,'HABILIDADE OCULTA',8,MENU_UI.amarillo,[0,.5],4);
  this.uiLabel(240,78,ha?'✦ '+HIDDEN_ABILITIES[ha].name:'Nenhuma',10,ha?'#e8c8ff':'#8ea2c8',[0,.5],4).setData('torre2-ficha-ability',ha||'none');
  estrechar(this.uiLabel(240,92,ha?HIDDEN_ABILITIES[ha].desc:'Só cerca de 5% dos Pokémon nascem com uma das 25 habilidades raras.',7,'#dcf4fb',[0,.5],4),370);
  const item=heldItemOf(member);
  const icon=(key,x,y,scale=1)=>this.textures.exists(heldIconKey(key))?
   this.add.image(x,y,heldIconKey(key)).setScale(scale).setDepth(5).setData('torre2-held-icon',key):null;
  const equip=key=>{
   const now=readCampaign()||cur,next=equipItem(now,member.uid,key);
   if(!next)return this.individualScreen(now,index);
   try{saveCampaign(next)}catch{return this.campaignNotice('Não foi possível salvar.','#ff9d9d')}
   this.individualScreen(next,index);
  };
  card(104,56,item?0x5fbf8f:0x4e6a8f,item?.16:.08);
  nativeRect(g,238,112,40,40,0x0c1725,4);g.lineStyle(1,item?0x9ff0bf:0x34465f,1).strokeRoundedRect(238,112,40,40,4);
  if(item)icon(item,258,132,1.5);else this.uiLabel(258,132,'—',10,'#34465f',[.5,.5],4);
  this.uiLabel(288,116,'ITEM EQUIPADO',8,MENU_UI.amarillo,[0,.5],4);
  this.uiLabel(288,131,item?HELD_ITEMS[item].name:'Nenhum',10,item?'#9ff0bf':'#8ea2c8',[0,.5],4).setData('torre2-ficha-item',item||'none');
  const only=item&&HELD_ITEMS[item].only&&!HELD_ITEMS[item].only.includes(member.id);
  estrechar(this.uiLabel(288,146,item?itemDesc(item)+(only?' · sem efeito neste Pokémon':''):HOW_TO_GET,7,only?'#ffb3b3':'#dcf4fb',[0,.5],4),item?240:326);
  if(item)this.button(572,132,84,20,'TIRAR',()=>equip(null),true,8).setData('torre2-ficha-equip','none');
  // Bag: original FRLG icons, 2 rows of 14, pages when there are more.
  const owned=Object.entries(cur.inventory?.held||{}).filter(([k,n])=>n>0&&HELD_ITEMS[k]);
  const per=28,pages=Math.max(1,Math.ceil(owned.length/per));
  const page=Math.min(pages-1,Math.max(0,this.__torre2BagPage|0));
  card(164,72,0x4e92bc,.08);
  this.uiLabel(240,174,owned.length?'BOLSA · toque para equipar ('+owned.length+')':'BOLSA VAZIA',8,MENU_UI.amarillo,[0,.5],4);
  owned.slice(page*per,page*per+per).forEach(([k,n],i)=>{const x=250+(i%14)*26,y=196+Math.floor(i/14)*26;
   const zone=this.add.rectangle(x,y,24,24,0x0c1725,1).setDepth(4).setStrokeStyle(1,0x4e92bc).setInteractive({useHandCursor:true});
   zone.on('pointerup',()=>equip(k));zone.setData('torre2-ficha-equip',k);
   icon(k,x,y);if(n>1)this.uiLabel(x+11,y+9,String(n),6,'#ffffff',[1,.5],6);
  });
  if(pages>1)this.button(588,174,52,16,(page+1)+'/'+pages+' ▶',()=>{this.__torre2BagPage=(page+1)%pages;this.individualScreen(readCampaign()||cur,index)},true,7);
  const rivals=rivalsOf(member.id);
  card(240,48,rivals.length?0xf6a268:0x4e6a8f,rivals.length?.12:.06);
  this.uiLabel(240,252,'RIVAIS',8,MENU_UI.amarillo,[0,.5],4);
  this.uiLabel(612,252,'Vitórias em rivalidade: '+(Number(cur.rivalryWins)||0),7,'#dcf4fb',[1,.5],4);
  estrechar(this.uiLabel(240,272,rivals.length?rivals.map(r=>r.charAt(0).toUpperCase()+r.slice(1)).join(', ')+' e evoluções · +10% de dano entre rivais':'Sem rival conhecido',8,rivals.length?'#ffb37a':'#8ea2c8',[0,.5],4),370);
  this.button(320,330,240,28,'◀ SUMÁRIO',()=>this.showSummary(readCampaign()||cur,index)).setData('torre2-ficha-back',true);
  this.__torre2Ficha={id:member.id,stars,ability:ha,item,rivals};
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
  if(!this.pokemonIdleSprite(member.id,66,176,64,18,null,true)){
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
  if(member.id==='mewtwo')label(25,289,'TESTE · GOLPES LIBERADOS','#ffcd7b',10);
  // Individual Pokémon (README 5/9/1/10): potential, hidden ability, item.
  else button(24,280,174,24,'FICHA '+'★'.repeat(potentialStars(potentialOf(member)))+(hiddenAbilityOf(member)?' ✦':''),
   ()=>this.individualScreen(state,index)).setData('torre2-summary-ficha',true);
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
 // Pokédex entry: animated sprite on a platform, number, types, where it
 // appears in the campaign's tall grass and the evolution line. Unseen
 // species show only a silhouette and "???". Read-only.
 dexDetail(state,row){
  const D=9000,objs=[];const keep=o=>{if(o)objs.push(o);return o};
  const close=()=>{objs.forEach(o=>o?.active&&o.destroy());this.children.list
   .filter(o=>o.getData?.('torre2-dex-detail-ui')).forEach(o=>o.destroy());};
  keep(this.add.zone(320,180,640,360).setDepth(D).setInteractive().setData('torre2-dex-detail',row.id));
  const g=keep(this.add.graphics().setDepth(D+1));
  g.fillStyle(0x020814,.85).fillRect(0,0,640,360);
  nativeMarco(g,40,30,560,280,'panel',{borde:row.caught?0x50cc84:row.seen?MENU_UI.panelLuz:MENU_UI.apagadoBorde});
  const nice=String(row.name).replace(/-/g,' ');
  let types=[],chain=[],dexNo=String(row.index+1).padStart(3,'0');
  try{
   const {def,etapa}=buscar(row.id);
   const stage=etapa>0?def.evoluciones?.[etapa-1]:def;
   types=stage?.tipos||def.tipos||[];
   chain=[{nombre:def.nombre,dex:def.dex,tipos:def.tipos},...(def.evoluciones||[])];
  }catch{}
  // Left: platform + animated sprite (dark silhouette while unseen).
  const col=TIPOS[types[0]]??0x5f86bd,cx=170,ground=210;
  g.fillStyle(0xffffff,.05).fillCircle(cx,150,70);
  g.fillStyle(0x061433,.9).fillEllipse(cx,ground+6,170,34);
  g.fillStyle(row.seen?col:0x24386e,1).fillEllipse(cx,ground+2,160,28);
  g.fillStyle(0xffffff,.18).fillEllipse(cx,ground,130,18);
  const ok=this.pokemonIdleSprite(row.id,cx,ground+1,130,D+3,sp=>{
   keep(sp);if(!row.seen)sp.setTintFill(0x0a1638);
  });
  keep(ok);
  if(!ok){const key='torre2-portrait-'+String(row.index+1).padStart(4,'0');
   requestCardPortrait(this,key,'assets/pmd/'+String(row.index+1).padStart(4,'0')+'/portrait.png',()=>{
    if(!g.active)return;const im=keep(this.add.image(cx,150,key).setDisplaySize(72,72).setDepth(D+3));
    if(!row.seen)im.setTint(0x1b2852);});}
  const L=(x,y,t,s,c,o=[0,.5])=>keep(this.uiLabel(x,y,t,s,c,o,D+4));
  // Right: identity.
  L(300,58,'Nº '+dexNo,9,MENU_UI.suave);
  L(300,80,row.seen?nice:'???',16,row.shinyCaught?MENU_UI.amarillo:'#ffffff');
  if(row.seen)types.slice(0,2).forEach((t,k)=>{pastillaTipo(g,300+k*64,96,t,60,14);
   L(330+k*64,103,t[0]+t.slice(1).toLowerCase(),8,'#ffffff',[.5,.5])});
  const status=row.shinyCaught?'Capturado ✦ Shiny':row.caught?'Capturado':row.seen?'Visto':'Ainda não visto';
  nativeRect(g,300,120,140,20,row.caught?0x1b5a3a:row.seen?0x2a3f78:0x1a2140,5);
  L(370,130,status,8,row.caught?'#9ff0bf':row.seen?'#dcf4fb':MENU_UI.tenue,[.5,.5]);
  if(row.ready&&row.seen)L(452,130,'Disponível na Arena',7,'#9ddcf0');
  // Where it appears (tall grass of each city route in the campaign).
  const where=[];
  for(let st=0;st<=8;st++){try{if(wildAvailability(st).wild.includes(row.id))where.push(STAGES[st]?.city||'Kanto')}catch{}}
  L(300,158,'Onde aparece',8,MENU_UI.amarillo);
  estrechar(L(300,174,row.seen?(where.length?'Grama alta: '+[...new Set(where)].join(', '):'Não aparece na grama alta'):'???',8,'#ffffff'),280);
  // Evolution line.
  L(300,200,'Linha evolutiva',8,MENU_UI.amarillo);
  if(chain.length>1&&row.seen){
   chain.slice(0,4).forEach((st,i)=>{
    const x=300+i*72,dex=String(st.dex||'').padStart(4,'0'),key='torre2-portrait-'+dex;
    nativeRect(g,x,212,40,40,MENU_UI.panelBorde,6);nativeRect(g,x+2,214,36,36,0x0a1a46,5);
    requestCardPortrait(this,key,'assets/pmd/'+dex+'/portrait.png',()=>{
     if(!g.active)return;keep(this.add.image(x+20,232,key).setDisplaySize(32,32).setDepth(D+3));});
    estrechar(L(x+20,260,String(st.nombre||'').toLowerCase().replace(/(^|\s)\S/g,c=>c.toUpperCase()),7,'#dcf4fb',[.5,.5]),64);
    if(i<Math.min(chain.length,4)-1)L(x+56,232,'▶',8,MENU_UI.amarillo,[.5,.5]);
   });
  }else L(300,220,row.seen?'Não evolui':'???',8,MENU_UI.tenue);
  const btn=this.button(320,290,180,26,'◀ FECHAR',close,false,9).setDepth(D+6).setData('torre2-dex-detail-close',true);
  this.children.list.slice(-3).forEach(o=>{if(o!==btn){o.setDepth?.(D+5);o.setData?.('torre2-dex-detail-ui',true)}});
  keep(btn);
 }
 // Campaign stages whose tall grass has this species (Pokédex route filter).
 dexRoutesOf(id){
  if(!this.__torre2DexRoutes){const m=new Map();
   for(let st=0;st<=8;st++)for(const sp of wildAvailability(st).wild||[]){if(!m.has(sp))m.set(sp,[]);m.get(sp).push(st)}
   this.__torre2DexRoutes=m}
  return this.__torre2DexRoutes.get(id)||[];
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  const supported=ROSTER.flatMap(p=>[p.id,
   ...(p.evoluciones||[]).map(x=>x.nombre)]);
  // 24 per page (6×4 grid). Page boundaries match the previous list layout
  // for every species that the T25 regression checks (Mr. Mime / Mew).
  // Filters (owner list item 22): show caught/seen/missing, one type, one route.
  const F=this.dexFilter||(this.dexFilter={show:'all',type:null,route:null});
  const full=kantoDexPageModel(state,KANTO_DEX,supported,0,9999);
  const filtered=filterDexRows(full.rows,F,id=>kantoTypes(id),id=>this.dexRoutesOf(id));
  const pg=paginate(filtered,this.dexPage||0,24);
  const view={...pg,totals:full.totals};
  this.dexPage=view.page;
  this.screenBanner(20,330,'Pokédex de Kanto','dex');
  const info=this.uiLabel(150,46,'Vistos '+view.totals.seen+' · Capturados '+view.totals.caught+
   ' de '+view.totals.all+(view.totals.shinySeen?' · ✦ '+view.totals.shinyCaught+'/'+view.totals.shinySeen:''),8,MENU_UI.suave,[.5,.5]);
  info.setData('torre2-dex-totals',view.totals);
  const chip=(x,w,label,fn,key)=>this.button(x,46,w,16,label,()=>{fn();this.dexPage=0;this.dexScreen(state)},false,7).setData('torre2-dex-filter',key);
  chip(352,92,DEX_SHOW_LABEL[F.show],()=>{F.show=cycle(DEX_SHOW,F.show)},'show');
  chip(446,92,F.type?TYPE_LABEL[F.type]:'Tipo: todos',()=>{F.type=F.type===DEX_TYPES.at(-1)?null:cycle(DEX_TYPES,F.type||DEX_TYPES.at(-1))},'type');
  chip(554,120,F.route===null?'Rota: todas':(STAGES[F.route]?.city||'Rota '+F.route),()=>{F.route=F.route===null?0:F.route>=8?null:F.route+1},'route');
  if(!view.rows.length)this.uiLabel(320,180,'Nenhum Pokémon com esse filtro.',10,MENU_UI.tenue,[.5,.5],4);
  this.__torre2DexFilter={...F,count:filtered.length};
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
  // Tap a card to open its Pokédex entry. One scene-level listener (no
  // per-card zones: Phaser keeps destroyed zones in its input list for a
  // while and they could steal taps from the next screen). It is valid only
  // while this exact Dex page is on screen and never over a real button.
  const token=this.__torre2ScreenToken,rows=view.rows;
  const onTap=(pointer,over)=>{
   if(token!==this.__torre2ScreenToken||!this.scene.isActive()){this.input.off('pointerdown',onTap);return}
   if((over||[]).some(o=>this.children.exists(o)))return;
   const px=pointer.worldX,py=pointer.worldY,col=Math.floor((px-X0)/(CW+GX)),rw=Math.floor((py-Y0)/(CH+GY));
   if(col<0||col>3||rw<0||rw>5||px-X0-col*(CW+GX)>CW||py-Y0-rw*(CH+GY)>CH)return;
   const row=rows[rw*4+col];if(row)this.dexDetail(state,row);
  };
  this.input.on('pointerdown',onTap);
  this.__torre2DexTap={X0,Y0,CW,CH,GX,GY};
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
