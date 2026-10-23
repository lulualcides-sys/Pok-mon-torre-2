/* Torre 2: training without altering approved attacks or campaign saves. */
import * as vfx from '../vfx.js';
import {createPartyMatch} from './party-battle.js';
import {resolveLoadout} from './move-pool.js';
import {currentLevelCap} from './kanto-levels.js';
export const TRAINING_TARGET='onix';
export function prepareTrainingMatch(state){
 const selected=state.team[state.active]||state.team[0];
 if(!selected)throw Error('Sem Pokémon na equipe.');
 const party=createPartyMatch(state,{id:TRAINING_TARGET,level:50,leader:false},true);
 for(const member of party.friend)member.hp=100;
 party.playerIndex=Number.isInteger(state.active)&&state.active>=0&&state.active<party.friend.length?state.active:0;
 const target=party.foes[0];
 target.level=50;target.hp=100;
 target.loadout=resolveLoadout({id:TRAINING_TARGET,progression:{species:TRAINING_TARGET,level:50}});
 return {p1:party.friend[party.playerIndex].id,p2:TRAINING_TARGET,
  modo:'cpu',nivel:'facil',arena:'crater',mandos:['kbm','cpu'],
  torre2:{stage:state.stage,trainer:state.trainer,kind:'training',training:true,
   playerLevel:party.friend[party.playerIndex].level,
   enemyLevel:50,hardCap:currentLevelCap(state.stage),party},
  torre2Loadout:party.friend[party.playerIndex].loadout,
  torre2OpponentLoadout:target.loadout};
}
export function installTrainingDummy(scene){
 if(!scene.datos?.torre2?.training||scene.__torre2TrainingInstalled||!scene.luchadores?.[1])return false;
 scene.__torre2TrainingInstalled=true;
 const dummy=scene.luchadores[1],position={x:dummy.x,y:dummy.y};
 const originalReceive=dummy.recibir,originalStatus=dummy.ponerEstado;
 dummy.recibir=function(source,hit){
  if(this.ko)return 'nada';
  if(!hit?.silencioso){
   vfx.impacto(scene,Math.round(this.x),Math.round(this.y-(this.alto||38)*.5),0xc6dae5,.34);
   scene.__torre2TrainingHits=(scene.__torre2TrainingHits||0)+1;
  }
  return 'golpe';
 };
 dummy.ponerEstado=()=>{};
 const freeze=()=>{
  if(!scene.scene.isActive())return;
  const ai=scene.controles?.[1];
  if(ai&&!ai.__torre2TrainingPassive){
   ai.leer=()=>({mx:0,my:0,ax:position.x,ay:position.y});
   ai.__torre2TrainingPassive=true;
  }
  dummy.x=position.x;dummy.y=position.y;dummy.vx=0;dummy.vy=0;
  dummy.empX=0;dummy.empY=0;dummy.hp=dummy.hpMax;dummy.ko=false;
  dummy.est={};dummy.escudo=0;
 };
 freeze();scene.game.events.on('step',freeze);
 const g=scene.add.graphics().setDepth(3500);
 g.fillStyle(0x06182c,.94);g.fillRoundedRect(170,3,315,26,4);
 g.lineStyle(1,0x83cbe1);g.strokeRoundedRect(170,3,315,26,4);
 scene.add.text(326,16,'TREINAMENTO · ONIX INVULNERÁVEL',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'12px',color:'#f5df9d',
  stroke:'#061529',strokeThickness:2}).setOrigin(.5).setDepth(3501);
 const bg=scene.add.graphics().setDepth(3502);
 bg.fillStyle(0x205477,.98);bg.fillRoundedRect(519,3,116,28,4);
 bg.lineStyle(1,0x8fdaea);bg.strokeRoundedRect(519,3,116,28,4);
 scene.add.text(577,17,'VOLTAR À ROTA',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#fff0cf',
  stroke:'#081a31',strokeThickness:2}).setOrigin(.5).setDepth(3503);
 const exitZone=scene.add.zone(577,17,116,29).setDepth(3504)
  .setInteractive({useHandCursor:true}).setData('torre2-training-exit',true);
 const leave=()=>{if(scene.scene.isActive())scene.scene.start('campanha')};
 exitZone.on('pointerdown',leave);
 scene.input.keyboard?.on('keydown-ESC',leave);
 scene.events.once('shutdown',()=>{
  scene.game.events.off('step',freeze);
  scene.input.keyboard?.off('keydown-ESC',leave);
  dummy.recibir=originalReceive;dummy.ponerEstado=originalStatus;
  scene.__torre2TrainingInstalled=false;
 });
 scene.__torre2Training={target:dummy,position,exitZone,leave};
 return true;
}
