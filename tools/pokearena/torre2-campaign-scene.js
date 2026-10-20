/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO} from '../config.js';
import {ROSTER,buscar} from '../datos.js';
import {availableMoves,selectedMoves,equipMove,resolveLoadout,pokemonStats} from './move-pool.js';
import {readCampaign,createCampaign,saveCampaign,resetCampaign,
 GYMS,STAGES,TRAINERS_PER_GYM,STARTERS,currentOpponent,startBattle,
 resolveBattle,attemptCapture,selectTeamMember,healTeam,KANTO_DEX} from './campaign-core.js';

const C={gold:'#f8c448',blue:'#6bc4ff',ink:'#090d1c',panel:'#15233a',muted:'#9cb4cd',white:'#f0f5ff'};
const titleStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'23px',fontStyle:'bold',color:C.gold,stroke:'#000',strokeThickness:3};
const textStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'13px',color:C.white};
const statusStyle={fontFamily:'Pixelify Sans, monospace',fontSize:'12px',color:C.muted};
function text(scene,x,y,content,style={}){return scene.add.text(x,y,content,{...textStyle,...style})}
class Campanha extends Phaser.Scene{
 constructor(){super('campanha')}
 init(input){this.result=input?.finished?input:null}
 create(){
  this.cameras.main.setBackgroundColor(C.ink);
  this.summaryIndex=null;this.movePage=0;this.editSlot=0;
  this.add.rectangle(ANCHO/2,ALTO/2,ANCHO,ALTO,0x090d1c);
  const g=this.add.graphics();
  g.lineStyle(2,0x36475f,1);
  g.strokeRect(10,7,ANCHO-20,ALTO-14);
  g.fillStyle(0x142037,.95);g.fillRect(11,8,ANCHO-22,43);
  this.add.text(20,13,'POKÉMON TORRE 2 · KANTO',{...titleStyle,fontSize:'20px'});
  this.button(526,23,62,24,'MENU',()=>this.scene.start('titulo',{menu:'principal'}));
  let state=readCampaign();
  if(this.result&&state){
   const marker=this.result.marker||{};
   if(marker.stage===state.stage&&marker.trainer===state.trainer){
    const summary=resolveBattle(state,!!this.result.won);
    state.lastMessage=summary.message;
    saveCampaign(state);
   }else state.lastMessage='Resultado antigo ignorado. Progresso preservado.';
  }
  if(!state)return this.starterSelection();
  this.renderCampaign(state);
 }
 button(x,y,w,h,label,callback,emphasis=false){
  const color=emphasis?0x3677a8:0x253b5a;
  const bg=this.add.rectangle(x,y,w,h,color,.98).setStrokeStyle(1,0x6ba9cc);
  bg.setInteractive({useHandCursor:true});
  bg.on('pointerdown',()=>{bg.setFillStyle(0x385f8b);callback()});
  bg.on('pointerover',()=>bg.setFillStyle(0x38648b));
  bg.on('pointerout',()=>bg.setFillStyle(color));
  text(this,x,y,label,{fontSize:'12px',color:emphasis?C.white:C.gold}).setOrigin(.5);
  return bg;
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
  text(this,ANCHO/2,294,'Sem conta, login, ranking, compras ou multiplayer.',statusStyle).setOrigin(.5);
 }
 backdrop(){
  const g=this.add.graphics().setDepth(0);
  g.fillGradientStyle(0x101f3a,0x101f3a,0x070b1b,0x070b1b,1);
  g.fillRect(0,51,ANCHO,ALTO-51);
  for(let i=0;i<12;i++){
   g.lineStyle(1,i%3===0?0x2b456c:0x192940,.25);
   g.lineBetween(0,60+i*23,ANCHO,60+i*23);
  }
 }
 card(x,y,w,h,accent=0x4b789b){
  const bg=this.add.rectangle(x+w/2,y+h/2,w,h,0x13253e,.98).setStrokeStyle(1,accent);
  const line=this.add.rectangle(x+2,y+2,4,h-4,accent,.9).setOrigin(0,0);
  return bg;
 }
 renderCampaign(state){
  this.backdrop();
  const gym=STAGES[state.stage],complete=state.champion||!gym;
  const limit=state.stage<GYMS.length?TRAINERS_PER_GYM(state.stage):0;
  const progress=complete?'CAMPEÃO DE KANTO':state.stage<GYMS.length?
   gym.city.toUpperCase()+' · '+gym.leader.toUpperCase():
   'ELITE FOUR · '+gym.leader.toUpperCase();
  text(this,18,62,progress,{fontSize:'16px',color:C.gold});
  text(this,18,85,'INSÍGNIAS '+state.badges.length+' / 12   ·   VITÓRIAS '+state.wins+
   '   ·   DERROTAS '+state.losses,{fontSize:'10px',color:C.muted});
  const progressFraction=complete?1:state.stage<GYMS.length?Math.min(1,state.trainer/limit):1;
  this.add.rectangle(320,107,604,5,0x0c1929);
  this.add.rectangle(18+600*progressFraction/2,107,600*progressFraction,5,0x4bb6ff);
  text(this,18,120,'EQUIPE  '+state.team.length+'/6  ·  PC '+state.box.length+
   '    ·    TOQUE EM UM POKÉMON PARA VER O SUMÁRIO E TROCAR GOLPES',
   {fontSize:'10px',color:C.blue});
  state.team.slice(0,6).forEach((member,i)=>{
   const x=18+(i%3)*205,y=146+Math.floor(i/3)*58;
   const active=i===state.active;
   this.card(x,y,198,50,active?0xf5ca5d:0x345879);
   const stats=pokemonStats(member);
   text(this,x+12,y+8,(active?'◆ ':'')+stats.name,{fontSize:'13px',color:active?C.gold:C.white});
   text(this,x+12,y+28,'NV.'+stats.level+'  '+stats.types.join('/')+(member.id==='mewtwo'?' · TESTE':''),{fontSize:'10px',color:C.muted});
   const hit=this.add.zone(x+100,y+25,198,50).setInteractive({useHandCursor:true});
   hit.on('pointerdown',()=>this.showSummary(state,i));
  });
  const enemy=currentOpponent(state);
  if(enemy){
   text(this,18,271,'PRÓXIMO: '+enemy.name.toUpperCase()+'  ·  '+enemy.id.toUpperCase()+
    ' NV.'+enemy.level,{fontSize:'11px',color:C.gold});
  }
  this.button(106,310,174,35,complete?'CAMPEÃO!':'INICIAR BATALHA',()=>{
   if(complete)return;
   const match=startBattle(state);
   match.torre2Loadout=resolveLoadout(state.team[state.active]);
   const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
   match.mandos=[touch?'tactil':'kbm','cpu'];
   this.scene.start('combate',match);
  },true);
  this.button(291,310,176,35,'CURAR EQUIPE',()=>{healTeam(state);this.scene.restart()});
  if(state.pendingCapture){
   this.button(501,310,185,35,'CAPTURAR '+state.pendingCapture.chance+'%',()=>{
    attemptCapture(state);this.scene.restart();
   },true);
  }else this.button(501,310,185,35,'POKÉDEX '+KANTO_DEX.length,()=>this.dexScreen(state));
  this.button(599,23,53,24,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){
    resetCampaign();this.scene.restart();
   }
  });
  const notice=state.lastMessage||'Batalhe, capture e evolua por nível.';
  text(this,320,350,notice,{fontSize:'10px',color:C.muted,wordWrap:{width:550}}).setOrigin(.5,1);
 }
 showSummary(state,index,slot=0,page=0){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  this.backdrop();
  const member=state.team[index];
  if(!member)return this.scene.restart();
  const stats=pokemonStats(member);
  const pool=availableMoves(member);
  const chosen=selectedMoves(member);
  const ids=['LMB','RMB','Q','ULT'];
  text(this,18,13,'SUMÁRIO · '+stats.name,{fontSize:'18px',color:C.gold});
  this.button(584,23,84,28,'◀ VOLTAR',()=>this.scene.restart());
  this.card(15,56,235,288,0x4f82b6);
  this.card(260,56,365,288,0x46668b);
  // Portrait is loaded directly from the captured PMD resource; original game
  // stays Phaser/WebGL and needs no Canvas2D/copy from Torre 1.
  const {def,etapa}=buscar(member.id);
  const dex=(etapa>0?def.evoluciones[etapa-1]?.dex:def.dex)||'0150';
  const key='torre2-portrait-'+dex;
  if(!this.textures.exists(key)){
   this.load.image(key,'assets/pmd/'+dex+'/portrait.png');
   this.load.once('complete',()=>{
    if(!this.scene.isActive()||!this.textures.exists(key))return;
    const img=this.add.image(72,124,key).setDisplaySize(76,76).setDepth(2);
   });
   this.load.start();
  }else this.add.image(72,124,key).setDisplaySize(76,76);
  text(this,129,88,'NV. '+stats.level,{fontSize:'15px',color:C.gold});
  text(this,129,109,stats.types.join('/'),{fontSize:'11px',color:C.blue});
  text(this,129,126,stats.role||'POKÉMON',{fontSize:'10px',color:C.muted});
  const statRows=[['HP',stats.hp,160],['ATK',stats.attack,190],['DEF',stats.defense,190],['SPD',stats.speed,200]];
  statRows.forEach(([label,value,cap],i)=>{
   const y=178+i*28;
   text(this,29,y,label,{fontSize:'10px',color:C.muted});
   this.add.rectangle(133,y+7,123,6,0x0a1421);
   this.add.rectangle(72+(118*Math.min(1,value/cap))/2,y+7,118*Math.min(1,value/cap),6,
    i===0?0x6fdbb8:i===1?0xffa869:i===2?0x90b3ff:0x75d9f5);
   text(this,210,y,String(value),{fontSize:'10px',color:C.white});
  });
  this.button(131,317,188,29,index===state.active?'◆ ATIVO':'USAR NA BATALHA',()=>{
   selectTeamMember(state,index);this.scene.restart();
  },index===state.active);
  text(this,273,69,'GOLPES EQUIPADOS   ·   SELECIONE UM SLOT',{fontSize:'12px',color:C.gold});
  chosen.forEach((id,i)=>{
   const m=pool.find(x=>x.id===id);
   const y=89+i*28;
   this.button(439,y,328,24,(slot===i?'▶ ':'')+ids[i]+'  '+(m?.nombre||'—')+
    '   '+(m?.tipo||''),()=>this.showSummary(state,index,i,0),slot===i);
  });
  text(this,273,201,'BANCO DE GOLPES '+pool.length+
   (member.id==='mewtwo'?' · TODOS LIBERADOS PARA TESTE':''),
   {fontSize:'10px',color:C.blue});
  const pages=Math.max(1,Math.ceil(pool.length/4));
  const safePage=((page%pages)+pages)%pages;
  pool.slice(safePage*4,safePage*4+4).forEach((move,i)=>{
   const y=220+i*22;
   const active=chosen.includes(move.id);
   const bg=this.add.rectangle(445,y+8,335,19,active?0x214d60:0x182d44)
    .setStrokeStyle(1,active?0x6aa59c:0x30516b).setInteractive({useHandCursor:true});
   text(this,278,y,(active?'✓ ':'+ ')+move.nombre+'  · '+move.tipo,{fontSize:'10px',color:active?0xa5ecd3:C.white});
   bg.on('pointerdown',()=>{
    if(equipMove(member,slot,move.id)){
     saveCampaign(state);
     this.showSummary(state,index,slot,safePage);
    }else text(this,273,308,'Já equipado noutro slot.',{fontSize:'10px',color:C.gold});
   });
  });
  this.button(546,329,130,23,'BANCO '+(safePage+1)+'/'+pages,()=>this.showSummary(state,index,slot,safePage+1));
  this.button(331,329,120,23,'◀ PÁGINA',()=>this.showSummary(state,index,slot,safePage-1));
 }
 dexScreen(state){
  this.children.removeAll(true);
  this.cameras.main.setBackgroundColor(C.ink);
  text(this,ANCHO/2,18,'POKÉDEX DE KANTO · '+KANTO_DEX.length+' ESPÉCIES',
    {...titleStyle,fontSize:'18px'}).setOrigin(.5,0);
  const supported=new Set(ROSTER.flatMap(p=>[p.id,...(p.evoluciones||[]).map(x=>x.nombre.toLowerCase())]));
  text(this,ANCHO/2,47,'Apenas espécies com animação e golpes integrados entram em batalha.',statusStyle).setOrigin(.5);
  const page=Math.min(this.dexPage||0,6);
  for(let i=0;i<22;i++){
   const index=page*22+i;if(index>=KANTO_DEX.length)break;
   const raw=KANTO_DEX[index],slug=raw.toLowerCase();
   const ready=supported.has(slug);
   const x=35+(i>=11?295:0),y=75+(i%11)*21;
   text(this,x,y,String(index+1).padStart(3,'0')+'. '+raw+(ready?' ✓':''),{
    fontSize:'11px',color:ready?C.blue:C.muted});
  }
  this.button(91,329,140,31,'◀ VOLTAR',()=>this.scene.restart());
  this.button(360,329,160,31,'PÁGINA '+(page+1)+'/7',()=>{
   this.dexPage=(page+1)%7;this.dexScreen(state);
  });
 }
}
export {Campanha};
