/* Torre 2: training without altering approved attacks or campaign saves. */
import {REGLAS} from '../datos.js';
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
 // Native damage display must never cause a practice-round KO even with a
 // very high-power test hit. Keep one HP alive DURING native evaluation.
 const originalHpDescriptor=Object.getOwnPropertyDescriptor(dummy,'hp');
 let transientHp=dummy.hpMax;
 Object.defineProperty(dummy,'hp',{configurable:true,enumerable:true,
  get(){return transientHp},
  set(value){transientHp=Math.max(1,Math.min(dummy.hpMax,Number(value)||1))}
 });
 // Real native damage pipeline produces type effectiveness, numbers, impact
 // feedback and statuses, but HP / KO are restored immediately afterwards.
 // This is TRAINING ONLY: normal opponents still receive real damage.
 dummy.__torre2TrainingDummy=true;
 scene.__torre2TrainingHits=0;
 scene.__torre2TrainingTotalDamage=0;
 scene.__torre2TrainingLastDamage=0;
 dummy.recibir=function(source,hit){
  if(this.ko)return 'nada';
  const old=this.hp,wasKO=this.ko;
  // Avoid KO while still asking the native engine to compute genuine damage.
  // Keep the dummy at maximum HP on EVERY strike.
  this.hp=this.hpMax;
  let result='nada',dealt=0;
  try{
   result=originalReceive.call(this,source,hit);
   dealt=Math.max(0,this.hpMax-Math.max(0,this.hp));
   if(result==='golpe'&&dealt>0&&!hit?.silencioso){
    scene.__torre2TrainingHits++;
    scene.__torre2TrainingTotalDamage+=dealt;
    scene.__torre2TrainingLastDamage=dealt;
   }
  }finally{
   this.hp=this.hpMax;
   this.ko=wasKO;
  }
  return result;
 };
 dummy.ponerEstado=()=>{};
 const energyCap=Number.isFinite(REGLAS.energiaMax)?REGLAS.energiaMax:100;
 const ultiCap=Number.isFinite(REGLAS.ultiMax)?REGLAS.ultiMax:100;
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
  // Player has unlimited energy AND ultimate meter only inside training.
  const fighter=scene.luchadores?.[0];
  if(fighter&&!fighter.ko){
   fighter.energia=energyCap;
   fighter.ulti=ultiCap;
   fighter.calor=0;
  }
  if(scene.__torre2TrainingMeter)
   scene.__torre2TrainingMeter.setText(
    'DANO '+Math.round(scene.__torre2TrainingLastDamage||0)+
    ' · TOTAL '+Math.round(scene.__torre2TrainingTotalDamage||0)+
    ' · ACERTOS '+(scene.__torre2TrainingHits||0));
 };
 freeze();scene.game.events.on('step',freeze);
 scene.game.events.on('poststep',freeze);
 const g=scene.add.graphics().setDepth(3500);
 g.fillStyle(0x06182c,.94);g.fillRoundedRect(170,3,315,26,4);
 g.lineStyle(1,0x83cbe1);g.strokeRoundedRect(170,3,315,26,4);
 scene.add.text(326,16,'TREINO · ENERGIA 100% · HP DO ALVO FIXO',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'12px',color:'#f5df9d',
  stroke:'#061529',strokeThickness:2}).setOrigin(.5).setDepth(3501);
 const meter=scene.add.text(326,43,'DANO 0 · TOTAL 0 · ACERTOS 0',{
  fontFamily:'Pixelify Sans,monospace',fontSize:'11px',color:'#fff4d0',
  stroke:'#061529',strokeThickness:3}).setOrigin(.5).setDepth(3501);
 scene.__torre2TrainingMeter=meter;
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
  scene.game.events.off('poststep',freeze);
  scene.input.keyboard?.off('keydown-ESC',leave);
  dummy.recibir=originalReceive;dummy.ponerEstado=originalStatus;
  if(originalHpDescriptor)Object.defineProperty(dummy,'hp',originalHpDescriptor);
  else{delete dummy.hp;dummy.hp=dummy.hpMax}
  delete dummy.__torre2TrainingDummy;
  scene.__torre2TrainingMeter=null;
  scene.__torre2TrainingInstalled=false;
 });
 scene.__torre2Training={target:dummy,position,exitZone,leave,freeze};
 return true;
}
