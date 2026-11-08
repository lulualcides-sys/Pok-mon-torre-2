/**
 * Six newly illustrated effects — isolated real Phaser/WebGL Training scene.
 *
 * Deliberately not a substitute for the original Poké Arena 2D ability catalog:
 * never touches native species kits, saves, collision, damage or cooldowns.
 * The user can inspect the six 16-frame source arts before any battle integration.
 * Native gameplay and approved effects remain byte-for-byte untouched.
 */
export const VFX_SIX=Object.freeze([
 {id:"gunk-shot",name:"GUNK SHOT",type:"POISON",start:0},
 {id:"magnet-bomb",name:"MAGNET BOMB",type:"STEEL",start:16},
 {id:"ominous-wind",name:"OMINOUS WIND",type:"GHOST",start:32},
 {id:"drill-run",name:"DRILL RUN",type:"GROUND",start:48},
 {id:"freeze-dry",name:"FREEZE-DRY",type:"ICE",start:64},
 {id:"head-smash",name:"HEAD SMASH",type:"ROCK",start:80}
]);
export const VFX_SIX_FRAME_SIZE=56;
export const VFX_SIX_FRAMES_PER_MOVE=16;
export const VFX_SIX_ATLAS="assets/torre2/vfx-six/atlas.png";
export const VFX_SIX_TIMINGS=Object.freeze([85,73,67,57,49,45,43,48,128,69,74,78,85,99,111,125]);
export function sixFrame(moveIndex,index){return moveIndex*16+Math.max(0,Math.min(15,Math.floor(index)))}
export class VfxSixLab extends Phaser.Scene{
 constructor(){super("vfx-six")}
 preload(){
  this.load.spritesheet("torre2-vfx-six-atlas",VFX_SIX_ATLAS,
   {frameWidth:VFX_SIX_FRAME_SIZE,frameHeight:VFX_SIX_FRAME_SIZE,margin:0,spacing:0});
 }
 create(){
  if(!this.textures.exists("torre2-vfx-six-atlas")){
   this.add.text(320,180,"SPRITESHEET VFX 6 INDISPONÍVEL",
    {fontFamily:"monospace",fontSize:"14px",color:"#ffad99"}).setOrigin(.5);
   return;
  }
  this.selected=0;this.frame=0;this.elapsed=0;this.playing=true;this.speed=1;
  this.add.rectangle(320,180,640,360,0x081725).setDepth(0);
  this.add.rectangle(320,179,614,274,0x122b40).setStrokeStyle(1,0x597d95).setDepth(1);
  // The appearance of the attack comes 100% from the 96 PNG frames.
  // No Phaser Graphics or circles used as replacement attack VFX.
  this.add.text(320,13,"POKÉMON TORRE 2 · 6 NOVOS VFX",{
    fontFamily:"Pixelify Sans,monospace",fontSize:"16px",
    color:"#ffdc91",stroke:"#091322",strokeThickness:2
  }).setOrigin(.5).setDepth(20);
  this.add.text(320,33,"TRAINING DE ARTE · SEM ALTERAR BATALHA OU SAVES",{
    fontFamily:"Pixelify Sans,monospace",fontSize:"9px",color:"#97bdd0"
  }).setOrigin(.5).setDepth(20);
  const button=(x,y,w,h,caption,onClick,color=0x17354a)=>{
   const bg=this.add.rectangle(x,y,w,h,color).setStrokeStyle(1,0x648da9)
     .setInteractive({useHandCursor:true}).setDepth(30);
   const text=this.add.text(x,y,caption,{fontFamily:"Pixelify Sans,monospace",
     fontSize:"10px",color:"#f4f6e8"}).setOrigin(.5).setDepth(31);
   bg.on("pointerdown",onClick);
   return {bg,text};
  };
  const tilePositions=[[119,85],[320,85],[521,85],[119,125],[320,125],[521,125]];
  this.tiles=VFX_SIX.map((m,i)=>{
   const [x,y]=tilePositions[i];
   const item=button(x,y,181,32,m.name,()=>this.choose(i));
   item.label=m.name;return item;
  });
  // Backing attack is an image sheet sourced from the six approved illustrations.
  // Nearest-neighbor filtering is inherited from the game renderer.
  this.effect=this.add.sprite(320,221,"torre2-vfx-six-atlas",0)
    .setDepth(19).setOrigin(.5).setScale(2.9);
  this.add.text(194,224,"ATACANTE",{fontFamily:"Pixelify Sans,monospace",fontSize:"9px",color:"#7ea9cb"})
    .setOrigin(.5).setDepth(20);
  this.add.text(448,224,"ALVO",{fontFamily:"Pixelify Sans,monospace",fontSize:"9px",color:"#7ea9cb"})
    .setOrigin(.5).setDepth(20);
  this.frameLabel=this.add.text(320,315,"",{
    fontFamily:"Pixelify Sans,monospace",fontSize:"9px",color:"#c7dcea"
  }).setOrigin(.5).setDepth(20);
  button(88,336,133,28,"VOLTAR",()=>this.scene.start("titulo",{menu:"jugar"}));
  this.pauseButton=button(221,336,116,28,"PAUSAR",()=>{
   this.playing=!this.playing;this.pauseButton.text.setText(this.playing?"PAUSAR":"RETOMAR");
  });
  button(361,336,128,28,"RECOMEÇAR",()=>this.reset());
  this.speedButton=button(522,336,131,28,"0.5× / 1×",()=>{
   this.speed=this.speed===1?.5:1;this.speedButton.text.setText(this.speed===1?"VELOC. 1×":"VELOC. 0.5×");
  });
  this.events.once("shutdown",()=>{this.tiles=[];this.effect=null;});
  this.choose(0);
 }
 choose(index){
  if(!Number.isInteger(index)||index<0||index>=VFX_SIX.length)return;
  this.selected=index;this.reset();
  this.tiles.forEach((b,i)=>{
   b.bg.setFillStyle(index===i?0x38647d:0x17354a);
   b.bg.setStrokeStyle(1,index===i?0xffd98a:0x648da9);
  });
 }
 reset(){
  this.frame=0;this.elapsed=0;this.playing=true;
  if(this.pauseButton?.text)this.pauseButton.text.setText("PAUSAR");
  this.render();
 }
 render(){
  if(!this.effect?.active)return;
  this.effect.setFrame(sixFrame(this.selected,this.frame));
  this.frameLabel.setText(VFX_SIX[this.selected].name+"  ·  FRAME "+
    (this.frame+1)+"/16  ·  PHASER WEBGL");
 }
 update(time,delta){
  if(!this.effect?.active||!this.playing)return;
  this.elapsed+=Math.max(0,Math.min(delta,80))*this.speed;
  let steps=0;
  while(this.elapsed>=VFX_SIX_TIMINGS[this.frame]&&steps++<4){
   this.elapsed-=VFX_SIX_TIMINGS[this.frame];this.frame=(this.frame+1)%16;
  }
  this.render();
 }
}
