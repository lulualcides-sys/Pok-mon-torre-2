/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO,texto as textoMenu,estrechar} from '../config.js';
import {UI as MENU_UI} from '../ui.js';
import {header,backdrop as richBackdrop,buttonFrame,team as richTeam,
 ball,progress} from './campaign-art.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats,isPendingApprovalMove,filterMoveLibrary} from './move-pool.js';
import {earlyKantoSlotPlan,EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,teachTM} from './campaign-core.js';
import {MART_ITEMS} from './route-data.js';
import {installWildCapture} from './capture-arena.js';
import {createPartyMatch,applyPartyBattleResult,installPartyBattle} from './party-battle.js';
import {drawTrainer,drawShopItem} from './campaign-sprites.js';
import {campaignRegion} from './kanto-regions.js';
import {currentLevelCap} from './kanto-levels.js';
import {AVAILABLE_FRLG,AVAILABLE_FRLG_NPCS,AVAILABLE_FRLG_FILES,HAS_CUSTOM_BROCK} from './frlg-available.js';
import {buildingInteractions} from './kanto-hotspots.js';
import {spriteIdForTrainer} from './frlg-npc.js';
import {renderInteriorScene} from './frlg-interiors.js';
import {locationForCampaign} from './frlg-location.js';
import {getCampaignMapSpec,renderUnifiedCampaignMap} from './campaign-map-unified.js';

const C={gold:'#f8c448',blue:'#6bc4ff',ink:'#090d1c',panel:'#15233a',muted:'#9cb4cd',white:'#f0f5ff'};
const titleStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'23px',fontStyle:'bold',color:C.gold,stroke:'#000',strokeThickness:3};
const textStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:C.white};
const statusStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'12px',color:C.muted};
function text(scene,x,y,content,style={}){return scene.add.text(x,y,content,{...textStyle,...style})}
function campaignSceneWidth(scene){
 // Some upstream Phaser builds report the browser-sized gameSize even while
 // the Kanto interface still uses its fixed 640x360 logical coordinates.
 // Only the explicit fullscreen panorama flag may widen its layout.
 return scene.registry?.get('torre2-wide-map')===true?
  Math.max(640,Number(scene.scale.gameSize?.width)||640):640;
}
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
  const state=readCampaign();
  // Mobile performance: the old loader uploaded every Kanto map and all
  // 41 trainer sheets to the GPU even though only one city is visible.
  // Load JUST the current gym world + the FireRed characters it displays.
  const stage=state?.stage??0;
  const world=getCampaignMapSpec(stage,0).id;
  if(stage===0&&HAS_CUSTOM_BROCK&&
      !this.textures.exists('torre2-brock-custom'))
   this.load.image('torre2-brock-custom','assets/ui/torre2-brock-custom.webp');
  if(AVAILABLE_FRLG.includes(world)){
   const key='frlg-location-'+world;
   if(!this.textures.exists(key))
    this.load.image(key,AVAILABLE_FRLG_FILES[world]||'assets/ui/frlg/'+world+'.webp');
  }else if(!this.textures.exists('torre2-cc0-world')){
   this.load.image('torre2-cc0-world','assets/ui/kanto-cc0-world.png');
  }
  const boss=['brock','misty','surge','erika','koga','sabrina',
   'blaine','giovanni','lorelei','lorelei','lorelei','lorelei','lorelei'][stage]||'brock';
  const archetypes=stage===0?
   ['youngster','lass','bugcatcher','hiker']:
   ['youngster','lass','bugcatcher','hiker','ace','rocket'];
  const needed=new Set(['red_normal',spriteIdForTrainer(boss),
   ...archetypes.map(spriteIdForTrainer)]);
  // Across gyms, old campaign-specific GPU textures used to accumulate.
  // Prune only our private FRLG resources, never PMD battle sprites/effects.
  const desired='frlg-location-'+world;
  for(const key of this.textures.getTextureKeys()){
   if(key.startsWith('frlg-location-')&&key!==desired)
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
  // Battles always run at 640x360. Restore the user's panoramic campaign
  // preference when returning from a battle while browser fullscreen stays on.
  if(this.scale.isFullscreen&&this.registry.get('torre2-wide-map')===true&&
     (this.scale.gameSize?.width||640)===640){
   const ratio=(window.innerWidth||640)/Math.max(1,window.innerHeight||360);
   this.scale.resize(Math.min(860,Math.max(640,Math.round(360*ratio))),360);
  }
  if(consumeCampaignResetLink())this.result=null;
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  this.__campaignPanelCollapsed=this.registry.get('torre2-panel-collapsed')===true;
  const sceneWidth=campaignSceneWidth(this);
  const wideExtra=Math.max(0,sceneWidth-ANCHO);
  this.add.rectangle(sceneWidth/2,ALTO/2,sceneWidth,ALTO,0x090d1c);
  header(this);
  // Extend the original Kanto backdrop, not a black browser letterbox.
  if(wideExtra>0)this.add.rectangle(640+wideExtra/2,180,wideExtra,360,0x0b233b)
   .setDepth(-8);
  this.add.text(52,14,'POKÉMON TORRE 2 / KANTO',{...titleStyle,
   fontSize:'17px',stroke:'#020b1b',strokeThickness:4});
  this.button(345+wideExtra*.25,24,84,29,'MAPA',()=>{
   const state=readCampaign();if(state)this.mapScreen(state);
  },false,12);
  // Fullscreen must be requested on pointerup on Android Chrome.
  // The right sidebar already contains Centro, so its duplicate top button
  // is replaced by this new control without shrinking the battle UI.
  const fullButton=this.button(447+wideExtra*.48,24,100,29,'TELA CHEIA',()=>{},false,9);
  fullButton.setData('torre2-fullscreen',true);
  fullButton.on('pointerup',()=>{
   if(this.scale.isFullscreen){this.scale.stopFullscreen();return;}
   this.scale.startFullscreen({navigationUI:'hide'});
   // A 640x360 FIT canvas creates black bars on wide Android displays.
   // Expand the actual Phaser game viewport while keeping the combat scene
   // at its native resolution and reflowing Kanto map + party positions.
   const ratio=(window.innerWidth||640)/Math.max(1,window.innerHeight||360);
   const target=Math.min(860,Math.max(640,Math.round(360*ratio)));
   if(target>665&&typeof this.scale.resize==='function'){
    this.registry.set('torre2-panel-collapsed',false);
    this.registry.set('torre2-wide-map',true);
    this.scale.resize(target,360);
    this.scene.restart();
   }else if(this.__campaignMapObjects?.length){
    this.setCampaignPanelCollapsed(true);
   }
   if(screen.orientation?.lock){
    try{Promise.resolve(screen.orientation.lock('landscape')).catch(()=>{});}
    catch(_){}
   }
  });
  // Restore the native aspect ratio on exiting fullscreen. No other Arena
  // 2D mode inherits the campaign's optional ultrawide viewport.
  const leaveWide=()=>{
   const wasWide=this.registry.get('torre2-wide-map')===true;
   this.registry.set('torre2-wide-map',false);
   if(wasWide){
    this.scale.resize(640,360);
    if(this.scene.isActive())this.scene.restart();
   }
  };
  this.scale.on('leavefullscreen',leaveWide);
  this.events.once('shutdown',()=>this.scale.off('leavefullscreen',leaveWide));
  this.button(537+wideExtra*.65,24,76,29,'MENU',()=>{
   const wasWide=campaignSceneWidth(this)>640;
   this.registry.set('torre2-wide-map',false);
   if(wasWide)this.scale.resize(640,360);
   this.scene.start('titulo',{menu:'principal'});
  });
  let state=readCampaign();
  if(this.result&&state){
   // Return to the same gym map. Stage changes only after the leader.
   const marker=this.result.marker||{};
   if(marker.stage===state.stage&&marker.trainer===state.trainer){
    applyPartyBattleResult(state,marker.party);
    const summary=marker.kind==='wild'&&state.pendingWild?.id===marker.id?
     resolveWildBattle(state,!!this.result.won):resolveBattle(state,!!this.result.won);
    state.lastMessage=summary.message;
    saveCampaign(state);
   }else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';
  }
  if(!state)return this.starterSelection();
  this.renderCampaign(state);
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
 // In-place UI switch: no reloading the Phaser scene, no lost map
 // checkpoint, and no extra WebGL textures on low-memory Android phones.
 setCampaignPanelCollapsed(collapsed){
  const hidden=!!collapsed;
  this.__campaignPanelCollapsed=hidden;
  this.registry.set('torre2-panel-collapsed',hidden);
  // Scale the map into the freed sidebar width while keeping character
  // sprites/text at pixel-perfect sizes, with interactive hit areas relocated.
  for(const item of this.__campaignMapObjects||[]){
   const {obj,x,y,sx,sy}=item;
   if(!obj.active)continue;
   const chrome=obj.getData?.('torre2-map-chrome')===true;
   obj.setVisible(!hidden||!chrome);
   if(!hidden){
    obj.setPosition(x,y);obj.setScale(sx,sy);
   }else{
    // Fit the entire FireRed artwork into the available screen, including
    // height. Old layout expanded only WIDTH, leaving the map short and
    // distorted with large unusable bands on mobile.
    const zx=606/372,zy=256/211;
    const tx=14-20*zx,ty=56-85*zy;
    const nativeSprite=obj.type==='Text'||(obj.type==='Image'&&
      (String(obj.texture?.key||'').startsWith('frlg-npc-')||
       String(obj.texture?.key||'').startsWith('torre2-portrait-')));
    obj.setPosition(tx+zx*x,ty+zy*y);
    obj.setScale(sx*(nativeSprite?1:zx),sy*(nativeSprite?1:zy));
   }
  }
  for(const obj of this.__campaignSidebarObjects||[]){
   if(!obj.active)continue;
   obj.setVisible(!hidden);
   if(obj.input)obj.input.enabled=!hidden;
  }
  for(const obj of this.__campaignDockObjects||[]){
   if(!obj.active)continue;
   obj.setVisible(hidden);
   if(obj.input)obj.input.enabled=hidden;
  }
  if(this.__campaignArrowLabel?.active)
   this.__campaignArrowLabel.setText(hidden?'▲':'▼');
  if(this.__campaignWideLabel?.active)
   this.__campaignWideLabel.setVisible(hidden);
  if(this.__campaignArrowBg?.active){
   this.__campaignArrowBg.clear();
   buttonFrame(this.__campaignArrowBg,586,56,41,27,'blue');
  }
  if(campaignSceneWidth(this)>640)
   this.applyWidescreenCampaignLayout();
 }
 // The screen has a flexible 16:9-to-ultrawide Phaser viewport. Move native
 // GameObjects and hitzones in the same transform, never stretch the whole
 // WebGL canvas or the Pokémon's battle sprites.
 applyWidescreenCampaignLayout(){
  const extra=Math.max(0,campaignSceneWidth(this)-640);
  if(!extra)return;
  const collapsed=this.__campaignPanelCollapsed;
  const mapX=20+extra*.26,zoomX=1+extra/640*.9,zoomY=1+extra/640*.66;
  const shift=extra*.82;
  for(const {obj,x,y,sx,sy} of this.__campaignMapObjects||[]){
   if(!obj.active)continue;
   if(collapsed){
    // The collapsed map already spans 606 original units. Center it
    // within the extra width instead of stretching the tile pixels.
    const zx=606/372,zy=256/211;
    const tx=14-20*zx,ty=56-85*zy;
    const native=obj.type==='Text'||(obj.type==='Image'&&
     String(obj.texture?.key||'').startsWith('frlg-npc-'));
    obj.setPosition(tx+zx*x+extra/2,ty+zy*y);
    obj.setScale(sx*(native?1:zx),sy*(native?1:zy));
   }else{
    const native=obj.type==='Text'||(obj.type==='Image'&&
     String(obj.texture?.key||'').startsWith('frlg-npc-'));
    obj.setPosition(mapX+(x-20)*zoomX,59+(y-85)*zoomY);
    obj.setScale(sx*(native?zoomY:zoomX),sy*zoomY);
   }
  }
  for(const item of this.__campaignSidebarBaseline||[]){
   if(item.obj.active)item.obj.setPosition(item.x+shift,item.y);
  }
  for(const item of this.__campaignDockBaseline||[]){
   if(item.obj.active)item.obj.setPosition(item.x+extra/2,item.y);
  }
  this.__campaignArrowLabel?.setPosition(607+shift,69);
  this.__campaignArrowBg?.setPosition(shift,0);
  this.__campaignArrowZone?.setPosition(606+shift,69);
  this.__campaignWideLabel?.setPosition(320+extra/2,61);
 }
 renderCampaign(state){
  this.backdrop();
  const finished=state.champion||!STAGES[state.stage];
  const limit=finished?0:TRAINERS_PER_GYM(state.stage);
  const message=notice=>{
   if(this.__routeNotice?.active)this.__routeNotice.destroy();
   this.__routeNotice=text(this,207,291,notice,{
    fontSize:'9px',color:'#ffe8ad',fontStyle:'bold',
    stroke:'#071827',strokeThickness:3}).setOrigin(.5).setDepth(48);
   this.time.delayedCall(1550,()=>{
    if(this.__routeNotice?.active)this.__routeNotice.destroy();
   });
  };
  // These objects alone expand when the panel is hidden. The sprites
  // and trainer hitzones all remain native Phaser objects with their
  // original index and callback. No scene restart is involved.
  const mapStart=this.children.list.length;
  this.__campaignMap=renderUnifiedCampaignMap(this,state,{
   limit,
   onTrainer:index=>{
    if(!finished&&index===state.trainer)this.enterBattle(state);
   },
   onGym:()=>this.gymScreen(state),
   onCenter:()=>this.centerScreen(state),
   onMart:()=>this.martScreen(state),
   onGrass:()=>this.grassScreen(state),
   onLocked:message
  });
  this.__campaignMapObjects=this.children.list.slice(mapStart).map(obj=>({
   obj,x:obj.x,y:obj.y,sx:obj.scaleX,sy:obj.scaleY
  }));
  this.__campaignWideLabel=text(this,327,61,
    this.__campaignMap.spec.short+' · '+Math.min(state.trainer,limit)+'/'+limit,{
    fontSize:'9px',fontStyle:'bold',color:'#fff2c5',
    stroke:'#0a273a',strokeThickness:3
   }).setOrigin(.5).setDepth(67).setVisible(false);
  const sideStart=this.children.list.length;
  richTeam(this);
  text(this,443,67,'SUA EQUIPE',{fontSize:'15px',fontStyle:'bold',
   color:'#fff8e0',stroke:'#682f32',strokeThickness:2}).setDepth(5);
  text(this,416,102,'INSÍGNIAS '+Math.min(8,state.badges.length)+'/8',{
   fontSize:'10px',fontStyle:'bold',color:'#ffe1a1'}).setDepth(5);
  text(this,621,102,'$ '+(state.money||0),{
   fontSize:'11px',fontStyle:'bold',color:'#ffda74'}).setOrigin(1,0).setDepth(5);
  const menu=[
   ['BOLSA',()=>this.bagScreen(state)],
   ['POKÉMON',()=>state.team.length&&this.showSummary(state,state.active)],
   ['CENTRO',()=>this.centerScreen(state)],
   ['LOJA',()=>this.martScreen(state)],
   ['GINÁSIO',()=>this.gymScreen(state)],
   ['CAPTURA',()=>this.grassScreen(state)]
  ];
  menu.forEach(([label,action],i)=>{
   this.button(466+(i%2)*110,137+Math.floor(i/2)*27,
    102,24,label,action,false,9);
  });
  text(this,416,210,'POKÉMON · TOQUE PARA VER GOLPES',{
   fontSize:'8px',color:'#bde7ec'}).setDepth(6);
  const mini=this.add.graphics().setDepth(3);
  for(let i=0;i<6;i++){
   const x=416+(i%2)*107,y=222+Math.floor(i/2)*25;
   const member=state.team[i],selected=i===state.active;
   mini.fillStyle(member?(selected?0x37585b:0x15394d):0x10283b,1);
   mini.fillRect(x,y,100,23);
   mini.lineStyle(1,selected?0xffd77c:member?0x7dc0a4:0x3a6279);
   mini.strokeRect(x,y,100,23);
   if(!member)continue;
   this.drawPortrait(member,x+13,y+11,22,5);
   const name=member.id.toUpperCase().slice(0,11);
   text(this,x+27,y+2,name,{
    fontSize:name.length>9?'7px':'9px',
    color:selected?'#ffe5a9':'#f7fbff',fontStyle:'bold'}).setDepth(6);
   text(this,x+27,y+13,'NV.'+(member.progression?.level??'—')+
    ' · HP '+(member.hp??100)+'%',{
    fontSize:'7px',color:'#baf8d0'}).setDepth(6);
   const hp=Math.max(0,Math.min(100,Number(member.hp??100)));
   mini.fillStyle(0x192e44);
   mini.fillRect(x+79,y+18,18,3);
   mini.fillStyle(hp>50?0x70e8a0:hp>20?0xf1d067:0xe7776c);
   mini.fillRect(x+79,y+18,18*hp/100,3);
   this.add.zone(x+50,y+11,100,23).setDepth(10)
    .setInteractive({useHandCursor:true})
    .on('pointerdown',()=>this.showSummary(state,i));
  }
  this.__campaignSidebarObjects=this.children.list.slice(sideStart);
  this.__campaignSidebarBaseline=this.__campaignSidebarObjects.map(obj=>({
   obj,x:obj.x,y:obj.y
  }));
  // Bottom-center battle/capture button remains accessible with either UI
  // state. Placed in the map footer instead of the bulky right-side card.
  const cta=state.pendingCapture?'CAPTURAR POKÉMON ▶':
   finished?'★ CAMPEÃO DE KANTO':
   state.trainer>=limit?'▶ ENFRENTAR O LÍDER':'▶ TREINADOR '+(state.trainer+1);
  this.battleButton(campaignSceneWidth(this)/2,322,224,22,cta,()=>{
   if(state.pendingCapture)return this.captureScreen(state);
   if(finished)return;
   if(state.trainer>=limit)this.gymScreen(state);
   else this.enterBattle(state);
  },!finished||!!state.pendingCapture).setData('torre2-central-cta',true);
  // Compact six-slot pixel-art party dock with portrait, name, level and
  // health. Hidden side menu remains touch-free; no card overlaps the CTA.
  const dockStart=this.children.list.length;
  const dockBg=this.add.graphics().setDepth(51);
  dockBg.fillStyle(0x071d30,.98);dockBg.fillRect(15,273,612,34);
  dockBg.lineStyle(1,0x719eab,1);dockBg.strokeRect(15.5,273.5,611,33);
  for(let i=0;i<6;i++){
   const member=state.team[i],x=27+i*99,y=276;
   dockBg.fillStyle(member?(i===state.active?0x37504c:0x18384a):0x0c2736);
   dockBg.fillRect(x,y,94,29);
   dockBg.lineStyle(1,i===state.active?0xffd574:member?0x537c8c:0x24495b);
   dockBg.strokeRect(x+.5,y+.5,93,28);
   if(!member)continue;
   this.drawPortrait(member,x+14,y+13,23,54);
   const name=member.id.toUpperCase().slice(0,10);
   text(this,x+28,y+4,name,{
    fontSize:name.length>8?'7px':'8px',
    color:i===state.active?'#ffe7ad':'#e9f9f7',fontStyle:'bold'
   }).setDepth(55);
   text(this,x+28,y+13,'NV.'+(member.progression?.level??'?')+
    (Number(member.hp??100)<=0?' · K.O.':''),{
    fontSize:'7px',color:'#b7e1d3'}).setDepth(55);
   const hp=Math.max(0,Math.min(100,Number(member.hp??100)));
   dockBg.fillStyle(0x091724);dockBg.fillRect(x+30,y+24,56,3);
   dockBg.fillStyle(hp>50?0x5ce4a1:hp>20?0xf2c859:0xf06b70);
   dockBg.fillRect(x+30,y+24,56*hp/100,3);
   this.add.zone(x+47,y+14,94,29).setDepth(58)
    .setInteractive({useHandCursor:true})
    .on('pointerdown',()=>this.showSummary(state,i));
  }
  this.__campaignDockObjects=this.children.list.slice(dockStart);
  this.__campaignDockBaseline=this.__campaignDockObjects.map(obj=>({
   obj,x:obj.x,y:obj.y
  }));
  // A visible down-arrow at the top of the right panel toggles it on
  // touch and mouse. Tap it again (up arrow) to restore the full menu.
  this.__campaignArrowBg=this.add.graphics().setDepth(80);
  this.__campaignArrowLabel=text(this,607,69,'▼',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'15px',
   color:'#ffffff',stroke:'#092238',strokeThickness:2
  }).setOrigin(.5).setDepth(82);
  const arrowZone=this.add.zone(606,69,44,34).setDepth(83)
   .setInteractive({useHandCursor:true})
   .setData('torre2-panel-toggle',true);
  this.__campaignArrowZone=arrowZone;
  arrowZone.on('pointerdown',()=>
   this.setCampaignPanelCollapsed(!this.__campaignPanelCollapsed));
  this.setCampaignPanelCollapsed(this.__campaignPanelCollapsed);
  this.button(607+Math.max(0,campaignSceneWidth(this)-640)*.9,26,56,30,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){
    resetCampaign();this.scene.restart();
   }
  });
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
  const zone=this.button(x,y,w,h,label,callback,active,13,'gold');
  const icon=this.add.graphics().setDepth(6);
  ball(icon,x-w/2+20,y,10);
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
 enterBattle(state,wild=false){
  // The combat renderer uses its native 640x360 collision/input coordinates.
  // Only the campaign map is panoramically resized.
  if(campaignSceneWidth(this)>640)this.scale.resize(640,360);
  if(state.pendingCapture){state.lastMessage='Resolva a captura antes de continuar.';saveCampaign(state);return this.scene.restart()}
  const match=wild?startWildBattle(state):startBattle(state);
  const foe={id:match.p2,level:match.torre2.enemyLevel,
   leader:state.trainer>=TRAINERS_PER_GYM(state.stage)};
  const party=createPartyMatch(state,foe,wild);
  match.torre2.party=party;
  match.p1=party.friend[party.playerIndex].id;
  match.torre2Loadout=party.friend[party.playerIndex].loadout;
  match.torre2OpponentLoadout=party.foes[0].loadout;
  if(earlyKantoSlotPlan(match.p2)){
   const level=wild?(state.pendingWild?.level??5):(currentOpponent(state)?.level??5);
   match.torre2OpponentLoadout=resolveLoadout({
    id:match.p2,progression:{species:match.p2,level}
   });
  }
  const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
  match.mandos=[touch?'tactil':'kbm','cpu'];
  // Campaign-only level HUD, using the real saved levels and leader cap.
  // The original Arena 2D sprites, attacks and other modes remain untouched.
  const game=this.game;let frames=0;
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
    if(wild)installWildCapture(battle);
    // Phaser restarts the SAME battle scene to send out the next Pokémon.
    // Keep this ONE listener while battling so every replacement gets a HUD.
   }
   if(game.scene.isActive('campanha')&&frames>60)
    game.events.off('step',attach);
   if(++frames>18000)game.events.off('step',attach);
  };
  game.events.on('step',attach);
  this.scene.start('combate',match);
 }
 grassScreen(state){
  // Do not destroy the loaded overworld when entering tall grass. Removing
  // all scene children invalidated the map and its hotspot/hover references.
  // This modal uses separate high-depth Phaser objects, so Close restores
  // precisely the same map, sprites, and panel state without a scene restart.
  if(this.__torre2GrassOverlay?.active)return;
  const start=this.children.list.length;
  const wideOffset=Math.max(0,campaignSceneWidth(this)-640)/2;
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
  this.children.removeAll(true);this.backdrop();
  text(this,320,41,'CENTRO POKÉMON',{...titleStyle,fontSize:'24px'}).setOrigin(.5);
  text(this,320,96,'CURAR TODA A EQUIPE · SEM CUSTO',{
   fontSize:'16px',color:'#a4f6dc'}).setOrigin(.5);
  this.button(320,154,275,46,'CURAR POKÉMON',()=>{
   healTeam(state);this.scene.restart()},true);
  this.button(320,219,275,40,'ABRIR PC',()=>this.pcScreen(state));
  this.button(320,298,275,32,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
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
   },state.money>=item.price);
  });
  this.button(140,315,177,33,'◀ MAPA',()=>this.scene.restart());
  this.button(346,315,205,33,'ITENS '+(pageNum+1)+'/'+count,()=>this.martScreen(state,(pageNum+1)%count),true);
  this.button(543,315,176,33,'BOLSA / TM',()=>this.bagScreen(state));
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
  text(this,320,92,'ESCOLHA QUEM RECEBE TM OU POÇÃO:',{
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
    ' · HP '+(member.hp??100)+'%',{fontSize:'9px',color:C.muted});
  });
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
   const compatible=state.team[target].id==='mewtwo'||
    !Array.isArray(item.compatible)||
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
  const earlyPlan=earlyKantoSlotPlan(member.id);
  this.summaryFilter??='ALL';this.summarySearch??='';
  const slotCodes=['LMB','RMB','Q','E / ULT'];
  const slotNames=earlyPlan?['BÁSICO FRACO','GOLPE 1','GOLPE 2','ULTIMATE']:
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
  label(231,78,earlyPlan?'ESPAÇO = ESQUIVA · Q 2º GOLPE · E ULTIMATE':
   'TOQUE NO SLOT QUE DESEJA ALTERAR',C.muted,9);
  chosen.forEach((id,i)=>{
   const move=pool.find(m=>m.id===id);
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
   label(x+8,y+18,move?.nombre??(upcoming?
    upcoming+' · LV '+(need??'EVO'):'—'),move?C.white:'#f5c578',move?12:10);
   label(x+180,y+4,move?.tipo??'',hex(move?.tipo),9).setOrigin(1,0);
   label(x+180,y+21,'CD '+(move?.cd??0)+'s',C.muted,9).setOrigin(1,0);
  });
  // Separated library with filters and paging: can navigate 137 Mewtwo moves.
  this.add.rectangle(424,183,384,1,0x446580);
  label(230,192,'BIBLIOTECA · '+pool.length+' GOLPES',C.gold,12);
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
