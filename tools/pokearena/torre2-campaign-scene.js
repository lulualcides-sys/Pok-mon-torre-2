/* Pokémon Torre 2 — offline campaign frontend inside original Phaser game.
 * No login, network API or online match dependency.
 */
import {ANCHO,ALTO} from '../config.js';
import {ROSTER} from '../datos.js';
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
  this.add.rectangle(ANCHO/2,ALTO/2,ANCHO,ALTO,0x090d1c);
  const g=this.add.graphics();
  g.lineStyle(2,0x36475f,1);
  g.strokeRect(10,7,ANCHO-20,ALTO-14);
  g.fillStyle(0x142037,.95);g.fillRect(11,8,ANCHO-22,43);
  this.add.text(20,13,'POKÉMON TORRE 2 · KANTO',{...titleStyle,fontSize:'20px'});
  text(this,ANCHO-85,24,'MODO SOLO · PHASER 3',statusStyle).setOrigin(1,.5);
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
 renderCampaign(state){
  const gym=STAGES[state.stage];
  const complete=state.champion||!gym;
  const gymTrainer=state.stage<GYMS.length?TRAINERS_PER_GYM(state.stage):0;
  const progress=complete?'CAMPEÃO DE KANTO':
    state.stage<GYMS.length?gym.city.toUpperCase()+' · '+gym.leader.toUpperCase()+
      ' · Treinadores '+Math.min(state.trainer,gymTrainer)+'/'+gymTrainer:
      'ELITE FOUR · '+gym.leader.toUpperCase();
  text(this,19,60,progress,{color:C.gold,fontSize:'16px'});
  text(this,19,84,'Insígnias: '+(state.badges.length?state.badges.join(' · '):'Nenhuma'),{fontSize:'11px'});
  text(this,19,106,'Vitórias '+state.wins+'  ·  Derrotas '+state.losses+
    '  ·  Equipe '+state.team.length+'/6  ·  PC '+state.box.length,statusStyle);
  text(this,19,136,'EQUIPE (toque para escolher o Pokémon ativo)',{fontSize:'12px',color:C.blue});
  for(let i=0;i<state.team.length&&i<6;i++){
   const member=state.team[i];
   const x=88+(i%3)*192,y=164+Math.floor(i/3)*37;
   this.button(x,y,180,30,(state.active===i?'▶ ':'')+
     member.id.toUpperCase()+' NV.'+member.progression.level,()=>{
      selectTeamMember(state,i);this.scene.restart();
     },state.active===i);
  }
  const primary=state.team[state.active];
  const opponent=currentOpponent(state);
  if(opponent){
   text(this,19,245,'Próximo: '+opponent.name+' · '+opponent.id.toUpperCase()+
     ' Nv.'+opponent.level,{fontSize:'12px',color:C.gold});
  }
  const actY=277;
  this.button(102,actY,182,38,complete?'CAMPEÃO!':'INICIAR BATALHA',()=>{
   if(!complete){
    // The original Phaser scene is reused, including its sprites, hitboxes,
    // effects and original attack logic. Only the campaign loop is new.
    const match=startBattle(state);
    const touch='ontouchstart' in window||navigator.maxTouchPoints>0;
    match.mandos=[touch?'tactil':'kbm','cpu'];
    this.scene.start('combate',match);
   }
  },true);
  this.button(288,actY,169,38,'CURAR EQUIPE',()=>{healTeam(state);this.scene.restart()});
  if(state.pendingCapture){
   this.button(473,actY,182,38,'CAPTURAR '+state.pendingCapture.chance+'%',()=>{
    const out=attemptCapture(state);
    state.lastMessage=out.ok?'Pokémon capturado!':out.reason;
    saveCampaign(state);this.scene.restart();
   },true);
  }else{
   this.button(473,actY,182,38,'POKÉDEX '+KANTO_DEX.length,()=>this.dexScreen(state));
  }
  const msg=state.lastMessage||'Vença, evolua por nível e capture Pokémon.';
  text(this,ANCHO/2,316,msg,{fontSize:'11px',color:C.muted,wordWrap:{width:602}}).setOrigin(.5,0);
  this.button(599,23,53,24,'RESET',()=>{
   if(window.confirm('Apagar o progresso da campanha Kanto?')){
    resetCampaign();this.scene.restart();
   }
  });
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
