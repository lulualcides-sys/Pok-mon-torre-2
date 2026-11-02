/* Pokémon Torre 2 — introdução VS da campanha, somente apresentação.
 * Phaser/WebGL; sprites FRLG e Pokébolas já aprovados, sem alterar gameplay.
 */
import {trainerClass,drawTrainer} from './campaign-sprites.js';
import {spriteIdForTrainer,addRedPlayer,addFireRedNPC} from './frlg-npc.js';
import {originalBallSprite} from './ball-sprites.js';
import {scheduleVsEntry} from './versus-transition.js';

const LEADERS=Object.freeze([
 'brock','misty','surge','erika','koga','sabrina','blaine',
 'giovanni','lorelei','bruno','agatha','lance','rival'
]);
export const VERSUS_DURATION_MS=2500;

export function versusOpponentProfile({
 stage=0,trainer=0,kind='trainer',leader=false,name='Treinador',
 city='Kanto',rematch=false
}={}){
 const stageNo=Number.isInteger(stage)&&stage>=0?stage:0;
 const index=Number.isInteger(trainer)&&trainer>=0?trainer:0;
 const opponentKind=leader?(LEADERS[stageNo]||'rival'):
  kind==='rival'||kind==='rocket'?kind:
  trainerClass(stageNo,index,kind,stageNo===0?'forest':'route');
 return {
  name:String(name||'Treinador').toUpperCase().slice(0,24),
  city:String(city||'Kanto').toUpperCase().slice(0,27),
  kind:opponentKind,
  texture:'frlg-npc-'+spriteIdForTrainer(opponentKind),
  title:rematch?'REVANCHE':leader?
   stageNo>=12?'CAMPEÃO':stageNo>=8?'ELITE FOUR':'LÍDER DE GINÁSIO':
   kind==='rival'?'RIVAL':kind==='rocket'?'EQUIPE ROCKET':'DESAFIO DE TREINADOR'
 };
}

const font=(size,color='#f8f3db',extra={})=>({
 fontFamily:'Pixelify Sans,monospace',fontSize:size+'px',
 fontStyle:'bold',color,stroke:'#060b1b',strokeThickness:3,...extra
});
function text(scene,overlay,x,y,label,size,color='#f8f3db',extra={}){
 const node=scene.add.text(x,y,label,font(size,color,extra)).setOrigin(.5);
 overlay.add(node);
 return node;
}
function cap(value){return Math.max(0,Math.min(6,Math.trunc(Number(value)||0)))}

// In the reference clip the opposing trainers enter before the combat itself.
// This scene is decorative only: the match payload/save/levels remain identical.
export function playVersusIntro(scene,match,onComplete){
 const meta=match?.torre2;
 if(!meta?.versus||meta.kind==='wild'||meta.training||meta.laboratory)return false;
 if(!scene?.scene?.isActive?.()||!scene.add?.container||!scene.tweens?.add||
    !scene.time?.delayedCall||typeof onComplete!=='function')return false;

 const overlay=scene.add.container(0,0).setDepth(6500).setAlpha(0);
 overlay.setData('torre2-versus-intro',true);
 const g=scene.add.graphics();overlay.add(g);
 // Dark, asymmetrical split with restrained pixel-art accents.
 g.fillStyle(0x060e20).fillRect(0,0,640,360);
 g.fillStyle(0x14385a).fillTriangle(0,0,367,0,258,360);
 g.fillStyle(0x102c46).fillTriangle(0,360,258,360,0,0);
 g.fillStyle(0x581e37).fillTriangle(367,0,640,0,640,360);
 g.fillStyle(0x872c46).fillTriangle(367,0,640,360,258,360);
 g.lineStyle(6,0x050d1b,1).lineBetween(367,-4,258,364);
 g.lineStyle(2,0xfbd777,1).lineBetween(373,0,264,360);
 for(let i=0;i<11;i++){
  const y=i*36+11;
  g.fillStyle(0xffffff,.04).fillRect(0,y,640,2);
 }
 for(let i=0;i<8;i++){
  const lx=38+i*20;
  g.fillStyle(0x9ed8ff,.11).fillRect(lx,40+i*5,10,3);
  g.fillStyle(0xffa5a5,.10).fillRect(602-i*21,295-i*5,10,3);
 }
 g.fillStyle(0x030a15,.80).fillRect(0,0,640,37);
 g.fillStyle(0x030a15,.87).fillRect(0,299,640,61);
 g.lineStyle(2,0xe3ba69,.85).lineBetween(0,298,640,298);
 g.lineStyle(1,0x88c0ec,.65).lineBetween(0,37,640,37);
 g.fillStyle(0x193e5c).fillRoundedRect(32,226,242,57,4);
 g.fillStyle(0x572c40).fillRoundedRect(366,226,242,57,4);
 g.lineStyle(2,0x79bdea,.85).strokeRoundedRect(32,226,242,57,4);
 g.lineStyle(2,0xffa6a1,.9).strokeRoundedRect(366,226,242,57,4);
 // Crisp character art from the same FRLG overworld texture as the Kanto map.
 const red=addRedPlayer(scene,154,228,{scale:4.2,depth:0});
 if(red){overlay.add(red);red.x=-70;}
 else drawTrainer(g,150,155,'rival',4.5);
 const enemy=addFireRedNPC(scene,meta.versus.kind,487,228,{scale:4.2,depth:0});
 if(enemy){overlay.add(enemy);enemy.x=710;enemy.setFlipX(true);}
 else drawTrainer(g,488,155,meta.versus.kind,4.5);
 // Two high-contrast layers on VS, with a short impact bounce.
 const shadow=text(scene,overlay,320,156,'VS',80,'#121a2b',{stroke:'#10101c',strokeThickness:10});
 const vs=text(scene,overlay,320,148,'VS',70,'#ffe9a5',{stroke:'#9c492e',strokeThickness:7});
 vs.setScale(2.1);
 const flash=scene.add.rectangle(320,178,640,356,0xfff1ce,0);
 overlay.add(flash);
 text(scene,overlay,320,18,'POKÉMON TORRE 2  ◆  KANTO',15,'#ffe5a2');
 text(scene,overlay,152,247,'VOCÊ',19,'#ffffff');
 text(scene,overlay,488,247,meta.versus.name,meta.versus.name.length>15?14:18,'#ffffff');
 text(scene,overlay,152,271,'SEU TREINADOR',9,'#9ce3ff');
 text(scene,overlay,488,271,meta.versus.title,9,'#ffc9bf');
 text(scene,overlay,320,319,meta.versus.city,14,'#fff0cd');
 text(scene,overlay,320,342,'PREPARE-SE PARA A BATALHA!',9,'#cad9ef');

 // Actual party size, not a made-up six-monster lineup.
 const friend=cap(meta.party?.friend?.length??1);
 const foes=cap(meta.party?.foes?.length??1);
 for(let i=0;i<6;i++){
  for(const [x,count] of [[75+i*29,friend],[420+i*29,foes]]){
   const active=i<count;
   const circle=scene.add.circle(x,291,9,active?0x355e72:0x142335,active?.9:.55);
   circle.setStrokeStyle(1,active?0xf1d790:0x58647a);
   overlay.add(circle);
   if(active){
    const img=originalBallSprite(scene,x,291,'pokeball',17,6500);
    overlay.add(img);
   }
  }
 }
 // Transparent hit zone prevents the originating touch from hitting map items
 // again while the presentation is on screen.
 const shield=scene.add.zone(320,180,640,360).setInteractive();
 overlay.add(shield);
 let done=false,transition=null;
 const cleanup=()=>{
  if(done)return false;
  done=true;
  // Both the Phaser timer and the fallback are owned by one cancellation.
  transition?.cancel();
  scene.events.off('shutdown',cleanup);
  if(overlay.active)overlay.destroy(true);
  return true;
 };
 const advance=()=>{
  if(!scene.scene.isActive())return cleanup();
  if(!cleanup())return;
  onComplete();
 };
 scene.events.once('shutdown',cleanup);
 scene.tweens.add({targets:overlay,alpha:1,duration:120,ease:'Sine.Out'});
 if(red)scene.tweens.add({targets:red,x:154,duration:440,ease:'Cubic.Out'});
 if(enemy)scene.tweens.add({targets:enemy,x:487,duration:440,ease:'Cubic.Out'});
 scene.tweens.add({targets:vs,scaleX:1,scaleY:1,duration:400,ease:'Back.Out'});
 scene.tweens.add({targets:shadow,alpha:.7,duration:270,yoyo:true,repeat:2});
 scene.tweens.add({targets:flash,alpha:{from:0,to:.40},
  duration:65,yoyo:true,delay:410});
 scene.tweens.add({targets:overlay,alpha:0,duration:180,delay:VERSUS_DURATION_MS-210});
 transition=scheduleVsEntry(scene,advance,VERSUS_DURATION_MS);
 return true;
}
