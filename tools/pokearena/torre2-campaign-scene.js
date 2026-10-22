/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO,texto as textoMenu,estrechar} from '../config.js';
import {marco,UI as MENU_UI} from '../ui.js';
import {header,backdrop as richBackdrop,buttonFrame,map as richMap,node as richNode,
 team as richTeam,teamCard,ball,progress} from './campaign-art.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats,isPendingApprovalMove,filterMoveLibrary} from './move-pool.js';
import {earlyKantoSlotPlan,EARLY_KANTO_LEARNSETS} from './early-kanto-species.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX,
 storePokemon,withdrawPokemon,swapPokemon,wildAvailability,startWildEncounter,
 startWildBattle,resolveWildBattle,purchaseItem,usePotion,teachTM} from './campaign-core.js';
import {routeNode,MART_ITEMS} from './route-data.js';
import {installWildCapture} from './capture-arena.js';
import {trainerClass,trainerClassName,drawTrainer,drawShopItem} from './campaign-sprites.js';
import {campaignRegion,KANTO_CHAPTERS} from './kanto-regions.js';
import {drawKantoWorldMap,mapVisitInfo} from './kanto-world-map.js';
import {currentLevelCap} from './kanto-levels.js';
import {AVAILABLE_FRLG,AVAILABLE_FRLG_NPCS,AVAILABLE_FRLG_FILES} from './frlg-available.js';
import {attachBuildingInteractions} from './kanto-hotspots.js';
import {addFireRedNPC,addRedPlayer} from './frlg-npc.js';
import {renderInteriorScene} from './frlg-interiors.js';
import {zigzagRoutePoints} from './kanto-route-layout.js';

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
class Campanha extends Phaser.Scene{
 constructor(){super('campanha')}
 init(input){this.result=input?.finished?input:null}
 preload(){
  const state=readCampaign();
  if(!this.textures.exists('torre2-cc0-world'))
   this.load.image('torre2-cc0-world','assets/ui/kanto-cc0-world.png');
  // Local FireRed reference tiles; do not change the Poké Arena Pokémon art.
  for(const id of AVAILABLE_FRLG){
   const key='frlg-location-'+id;
   if(!this.textures.exists(key))
    this.load.image(key,AVAILABLE_FRLG_FILES[id]||'assets/ui/frlg/'+id+'.webp');
  }
  for(const id of AVAILABLE_FRLG_NPCS){
   const key='frlg-npc-'+id;
   if(!this.textures.exists(key))
    this.load.image(key,'assets/ui/frlg/npc/'+id+'.png');
  }
  const toLoad=new Set(state?.team?.map(p=>portraitId(p))||[]);
  if(state?.box)for(const p of state.box.slice(0,12))toLoad.add(portraitId(p));
  for(const dex of toLoad){
   const key='torre2-portrait-'+dex;
   if(!this.textures.exists(key))this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
  }
 }
 create(){
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  this.add.rectangle(ANCHO/2,ALTO/2,ANCHO,ALTO,0x090d1c);
  header(this);
  this.add.text(52,14,'POKÉMON TORRE 2 / KANTO',{...titleStyle,
   fontSize:'17px',stroke:'#020b1b',strokeThickness:4});
  this.button(345,24,84,29,'MAPA',()=>{
   const state=readCampaign();if(state)this.mapScreen(state);
  },false,12);
  this.button(447,24,100,29,'CENTRO / PC',()=>{const state=readCampaign();if(state)this.centerScreen(state)});
  this.button(537,24,76,29,'MENU',()=>this.scene.start('titulo',{menu:'principal'}));
  let state=readCampaign();
  if(this.result&&state){
   this.mapPage=null; // Follow the newly unlocked route node after battle.
   const marker=this.result.marker||{};
   if(marker.stage===state.stage&&marker.trainer===state.trainer){
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
  text(this,ANCHO/2,294,'Sem conta e sem multiplayer. Itens são comprados com Poké Dollars do jogo.',statusStyle).setOrigin(.5);
 }
 backdrop(){
  richBackdrop(this);
 }
 mapScreen(state){
  this.children.removeAll(true);
  const stage=state.stage??0,limit=TRAINERS_PER_GYM(stage);
  drawKantoWorldMap(this,state,{trainerLimit:limit,onBack:()=>this.scene.restart()});
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
     'DESAFIAR O LÍDER':'ENFRENTAR TREINADOR',
    ()=>this.enterBattle(state),true);
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
 card(x,y,w,h,accent=0x4b789b){
  const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x13253e,.98).setStrokeStyle(1,accent);
  const line=this.add.rectangle(x+2,y+2,4,h-4,accent,.9).setOrigin(0,0);
  return bg;
 }
 renderCampaign(state){
  this.backdrop();
  const stage=STAGES[state.stage],finished=state.champion||!stage;
  const gymStage=state.stage<=GYMS.length; // Victory Road retains wild encounters and Poké Mart
  const limit=finished?0:TRAINERS_PER_GYM(state.stage);
  const perPage=state.stage===0?3:5,
   totalPages=Math.max(1,Math.ceil((limit+1)/perPage));
  const activePage=Math.min(totalPages-1,Math.floor(state.trainer/perPage));
  const page=this.mapPage==null?activePage:Math.max(0,Math.min(totalPages-1,this.mapPage));
  this.mapPage=page;
  const next=currentOpponent(state),area=wildAvailability(state.stage);
  const first=page*perPage,count=Math.min(perPage,limit+1-first);
  // Fixed serpentine map route: left -> right -> left, anchored to the art.
  // Each checkpoint keeps its original saved trainer index.
  const points=zigzagRoutePoints(count).map((pos,i)=>({
   index:first+i,x:pos.x,y:pos.y,
   kind:routeNode(state.stage,first+i,limit).type
  }));
  const region=campaignRegion(state.stage,page,totalPages,finished);
  richMap(this,state.stage,points,page,region);
  // Functional world objects. Tap the actual rendered building or tall grass,
  // not an invisible fullscreen mockup hotspot.
  const worldZone=(x,y,w,h,action)=>{
   const zone=this.add.zone(x,y,w,h).setDepth(9)
    .setInteractive({useHandCursor:true});
   zone.on('pointerdown',action);
   return zone;
  };
  const locationView=this.__torre2FRLGView;
  if(locationView){
   attachBuildingInteractions(this,locationView,
    hotspot=>this.enterLocalityBuilding(state,locationView.id,hotspot));
  }else if(region.biome==='city'){
   // Old generic fallback only when an authentic locality file is missing.
   worldZone(160,237,75,52,()=>this.centerScreen(state));
   worldZone(314,134,82,55,()=>this.martScreen(state));
  }else if(region.biome==='forest'||region.biome==='safari'){
   if(gymStage)worldZone(329,169,81,65,()=>this.grassScreen(state));
  }else if(region.biome.endsWith('-gym')||region.biome==='hall'){
   if(!finished&&state.trainer===limit)
    worldZone(319,153,84,52,()=>this.enterBattle(state));
  }
  const art=this.add.graphics().setDepth(2);
  ball(art,32,75,8);
  text(this,46,68,region.title,{
   fontSize:region.title.length>19?'12px':'14px',color:'#fff4d3',
   fontStyle:'bold',stroke:'#072e3d',strokeThickness:2}).setDepth(4);
  text(this,380,69,region.subtitle,{
   fontSize:region.subtitle.length>21?'8px':'9px',
   color:'#baf4e9'}).setOrigin(1,0).setDepth(4);
  const trainers=this.add.graphics().setDepth(6);
  for(const p of points){
   const current=p.index===state.trainer,won=p.index<state.trainer;
   if(!won){
    const trainerKind=trainerClass(state.stage,p.index,p.kind,region.biome);
    // Feet line up with the route marker, not floating 20px to the right.
    if(!addFireRedNPC(this,trainerKind,p.x,p.y-4,{depth:7,scale:.82}))
     drawTrainer(trainers,p.x,p.y-13,trainerKind,.72);
    if(current)addRedPlayer(this,p.x-18,p.y+5,{depth:8,scale:.85});
   }
   richNode(art,p.x,p.y,won?'done':current?'current':'future');
   if(won)text(this,p.x,p.y-1,'✓',{fontSize:'9px',
    color:'#ffffff',fontStyle:'bold'}).setOrigin(.5).setDepth(5);
   else if(current){
    text(this,p.x+12,p.y-25,'!',{
     fontSize:'12px',color:'#ffe5a0',fontStyle:'bold',
     stroke:'#20333f',strokeThickness:2}).setOrigin(.5).setDepth(9);
    this.add.zone(p.x,p.y-10,34,45).setInteractive({useHandCursor:true})
     .setDepth(25).on('pointerdown',()=>this.enterBattle(state));
   }
  }
  const kind=next?.kind==='leader'?'LÍDER DO GINÁSIO':
   next?.kind==='rocket'?'EQUIPE ROCKET':next?.kind==='rival'?'RIVAL':'TREINADOR';
  const nextTrainer=trainerClass(state.stage,state.trainer,next?.kind,region.biome);
  // Clear two-line travel HUD; player's location stays visible without
  // opening the regional Town Map. Real saved state drives the position.
  text(this,54,267,'VOCÊ ESTÁ: '+region.subtitle.toUpperCase().slice(0,35),{
   fontSize:'8px',color:'#a5eed1',fontStyle:'bold'}).setDepth(5);
  if(!addFireRedNPC(this,nextTrainer,35,297,{depth:7}))
   drawTrainer(trainers,35,285,nextTrainer,1);
  text(this,55,281,finished?'★ JORNADA DE KANTO CONCLUÍDA':
   'PRÓXIMO: '+(next?.leader?String(next.name).toUpperCase():trainerClassName(nextTrainer))+
   ' · '+(next?.id||'').toUpperCase(),{
   fontSize:'10px',fontStyle:'bold',color:'#ffebc1'}).setDepth(5);
  ball(art,45,299,6);
  progress(art,64,299,Math.max(0,state.trainer-first),6);
  text(this,363,292,'TRILHA '+(page+1)+'/'+totalPages+' · '+(state.trainer+1)+'/'+(limit+1),{
   fontSize:'10px',fontStyle:'bold',color:'#c0eacb'}).setOrigin(1,0).setDepth(5);
  const navigate=delta=>{
   this.mapPage=Math.max(0,Math.min(totalPages-1,page+delta));
   this.scene.restart();
  };
  this.add.zone(26,299,22,22).setDepth(9).setInteractive({useHandCursor:true})
   .on('pointerdown',()=>navigate(-1));
  this.add.zone(380,299,20,22).setDepth(9).setInteractive({useHandCursor:true})
   .on('pointerdown',()=>navigate(1));
  text(this,25,291,'‹',{fontSize:'19px',color:'#ffdfa4'}).setOrigin(.5,0).setDepth(5);
  text(this,380,291,'›',{fontSize:'19px',color:'#ffdfa4'}).setOrigin(.5,0).setDepth(5);
  this.button(53,331,85,30,'◀ VOLTAR',()=>navigate(-1),false,10);
  if(gymStage){
   this.button(145,331,89,30,'GRAMA ALTA',()=>this.grassScreen(state),false,9,'green');
   this.button(249,331,109,30,'CENTRO POK.',()=>this.centerScreen(state),false,9);
   this.button(352,331,91,30,'POKÉ MART',()=>this.martScreen(state),false,9);
  }else this.button(240,331,187,30,'AVANÇAR ▶',()=>navigate(1));
  richTeam(this);
  text(this,443,67,'MINHA EQUIPE',{fontSize:'15px',fontStyle:'bold',
   color:'#fff8e0',stroke:'#682f32',strokeThickness:2}).setDepth(5);
  text(this,417,101,'INSÍGNIAS '+Math.min(8,state.badges.length)+'/8',{
   fontSize:'11px',fontStyle:'bold',color:'#ffdf95'}).setDepth(5);
  text(this,617,101,'$ '+(state.money||0),{
   fontSize:'12px',fontStyle:'bold',color:'#ffdc71'}).setOrigin(1,0).setDepth(5);
  text(this,417,117,'LIMITE NV. '+currentLevelCap(state.stage)+'   ·   TOQUE NO POKÉMON',{
   fontSize:'9px',color:'#a9daf1'}).setDepth(5);
  // The first four slots are genuinely live; page two exposes slots 5-6.
  const teamPages=Math.max(1,Math.ceil(state.team.length/4));
  this.teamPage=Math.min(teamPages-1,this.teamPage||0);
  for(let i=0;i<4;i++){
   const x=413+i%2*107,y=136+Math.floor(i/2)*69;
   const index=this.teamPage*4+i;
   const member=state.team[index],selected=index===state.active;
   teamCard(this,x,y,member,selected);
   if(member){
    const portrait=this.drawPortrait(member,x+18,y+21,30);
    if(portrait?.texture?.setFilter)
     portrait.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const name=member.id.toUpperCase().slice(0,11);
    text(this,x+36,y+7,name,{fontSize:name.length>=9?'8px':'10px',
     fontStyle:'bold',color:selected?'#ffe4a2':'#f8faff'}).setDepth(6);
    text(this,x+36,y+23,'NV.'+(member.progression?.level??'—'),{
     fontSize:'9px',color:'#acdff7'}).setDepth(6);
    text(this,x+36,y+37,'HP '+(member.hp??100)+'%',{
     fontSize:'9px',color:'#b3f7cc'}).setDepth(6);
    this.add.zone(x+50,y+30,100,62).setDepth(9)
     .setInteractive({useHandCursor:true}).on('pointerdown',()=>this.showSummary(state,index));
   }else text(this,x+50,y+41,'— VAZIO —',{fontSize:'9px',
    color:'#7298ba'}).setOrigin(.5).setDepth(5);
  }
  if(teamPages>1)this.button(567,124,107,19,
   'EQUIPE '+(this.teamPage+1)+'/'+teamPages+' ›',()=>{
    this.teamPage=(this.teamPage+1)%teamPages;
    this.scene.restart();
   },false,8);
  this.button(582,79,80,25,'BOLSA',()=>this.bagScreen(state),false,9);
  // CTA stays at the original clickable location with richer gold chrome.
  const g=this.add.graphics().setDepth(2);
  g.fillStyle(0xf4b94b,.2);g.fillRoundedRect(406,301,225,49,4);
  for(const [x,y] of [[420,312],[609,311],[426,337],[603,341]]){
   g.fillStyle(0xfff6b9);g.fillRect(x,y,4,1);g.fillRect(x+1,y-1,1,4);
  }
  if(state.pendingCapture)this.battleButton(518,326,218,44,
   'CAPTURAR POKÉMON ▶',()=>this.captureScreen(state),true);
  else this.battleButton(518,326,218,44,
   finished?'★ CAMPEÃO DE KANTO':'▶ INICIAR BATALHA',()=>{
    if(!finished)this.enterBattle(state);
   },!finished);
  this.button(607,26,56,30,'RESET',()=>{
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
  if(state.pendingCapture){state.lastMessage='Resolva a captura antes de continuar.';saveCampaign(state);return this.scene.restart()}
  const match=wild?startWildBattle(state):startBattle(state);
  match.torre2Loadout=resolveLoadout(state.team[state.active]);
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
   if(battle.scene.isActive()&&battle.luchadores?.length===2){
    game.events.off('step',attach);
    const levelPanel=battle.add.graphics().setDepth(1170);
    levelPanel.fillStyle(0x071a2b,.92);
    levelPanel.fillRoundedRect(189,5,262,24,3);
    levelPanel.lineStyle(1,0xd3ac60);
    levelPanel.strokeRoundedRect(189,5,262,24,3);
    text(battle,199,10,'SEU NV.'+match.torre2.playerLevel+
     '   RIVAL NV.'+match.torre2.enemyLevel+
     '   TETO NV.'+match.torre2.hardCap,{
     fontSize:'11px',fontStyle:'bold',color:'#fff0c6'}).setDepth(1171);
    if(wild)installWildCapture(battle);
   }else if(++frames>900||(!battle.scene.isActive()&&frames>180)){
    game.events.off('step',attach);
   }
  };
  game.events.on('step',attach);
  this.scene.start('combate',match);
 }
 grassScreen(state){
  this.children.removeAll(true);this.backdrop();
  const area=wildAvailability(state.stage);
  text(this,320,23,'GRAMA ALTA · '+area.label,{
   ...titleStyle,fontSize:'18px'}).setOrigin(.5);
  text(this,320,63,area.area.toUpperCase(),{fontSize:'15px',color:C.gold}).setOrigin(.5);
  text(this,320,95,'ENCONTROS REGIONAIS (REFERÊNCIA FIRE RED):',{
   fontSize:'12px',color:C.blue}).setOrigin(.5);
  area.wild.forEach((id,i)=>{
   const x=66+(i%4)*153,y=132+Math.floor(i/4)*32;
   const ok=area.available.includes(id);
   this.add.rectangle(x+62,y+11,140,26,ok?0x24553f:0x233243)
    .setStrokeStyle(1,ok?0x7dd597:0x445468);
   text(this,x+5,y+3,id.toUpperCase()+(ok?' ✓':' · FUTURO'),{
    fontSize:'9px',color:ok?'#d7ffda':'#8ca9bb'});
  });
  text(this,320,227,'Encontros explorados nesta área: '+(state.wildEncountersStage||0)+'/5',
   {fontSize:'12px',color:C.gold}).setOrigin(.5);
  text(this,320,253,'Espécies sem batalha integrada ainda não surgem. Nunca trocamos por Pokémon de outra rota.',
   {fontSize:'10px',color:C.muted,wordWrap:{width:550},align:'center'}).setOrigin(.5);
  this.button(192,315,230,34,'◀ VOLTAR AO MAPA',()=>this.scene.restart());
  this.button(447,315,235,34,'PROCURAR POKÉMON',()=>{
   const found=startWildEncounter(state);
   if(found.ok)this.enterBattle(state,true);
   else this.scene.restart();
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
