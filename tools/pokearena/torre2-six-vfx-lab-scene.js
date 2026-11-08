/* Six new illustrated Pokémon effects — isolated real Phaser training scene.
 * Rendered with actual 96-frame transparent PNG (six 4x4 spritesheets).
 * No core battle or native P2 move kit changes. No rewards or saves.
 * Source assets: reference-assets/vfx-six/atlas.png (sha256 recorded in manifest).
 */
export const SIX_VFX_TRAINING=Object.freeze([
 {id:'gunk-shot',name:'GUNK SHOT',type:'POISON',start:0,power:'TÓXICO'},
 {id:'magnet-bomb',name:'MAGNET BOMB',type:'STEEL',start:16,power:'MAGNÉTICO'},
 {id:'ominous-wind',name:'OMINOUS WIND',type:'GHOST',start:32,power:'ESPECTRAL'},
 {id:'drill-run',name:'DRILL RUN',type:'GROUND',start:48,power:'BROCA'},
 {id:'freeze-dry',name:'FREEZE-DRY',type:'ICE',start:64,power:'CONGELANTE'},
 {id:'head-smash',name:'HEAD SMASH',type:'ROCK',start:80,power:'IMPACTO'}
]);
export const SIX_VFX_ATLAS='torre2-six-original-vfx-20261108';
export const SIX_VFX_ATLAS_FILE='assets/torre2/vfx-six/atlas.png';
export const SIX_VFX_ATLAS_FRAMES=96;
const FRAME_MS=Object.freeze([88,65,51,42,39,36,33,32,93,53,57,69,77,85,97,110]);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const ease=t=>{t=clamp(t,0,1);return 1-(1-t)**3;};

/** A separate visual-review scene, inside the actual Pokémon Torre 2
 * Phaser game. Only the isolated lab can use these prototypes; battle
 * damage, accuracy, statuses and recoil are intentionally NOT mocked.
 */
export class VfxSixLab extends Phaser.Scene {
 constructor(){super('vfx-six-lab');}
 preload(){
  this.load.spritesheet(SIX_VFX_ATLAS,SIX_VFX_ATLAS_FILE,{
   frameWidth:56,frameHeight:56,margin:0,spacing:0
  });
 }
 create(){
  const tex=this.textures.get(SIX_VFX_ATLAS);
  if(!tex||!this.textures.exists(SIX_VFX_ATLAS)||
    (tex.frameTotal||0)<SIX_VFX_ATLAS_FRAMES){
   this.add.text(320,180,'SPRITESHEET VFX INCOMPLETA',{fontSize:'18px',color:'#ffb4ae'}).setOrigin(.5);
   return;
  }
  tex.setFilter?.(Phaser.Textures.FilterMode.NEAREST);
  this.add.rectangle(320,180,640,360,0x0b1c2e);
  this.add.rectangle(320,168,624,187,0x173448).setStrokeStyle(1,0x537b8e);
  this.add.rectangle(320,244,620,29,0x1d3b42);
  this.add.ellipse(113,211,148,28,0x466872,.78);
  this.add.ellipse(505,211,148,28,0x466872,.78);
  this.add.text(320,17,'POKÉMON TORRE 2 · LABORATÓRIO DE GOLPES',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'15px',color:'#ffe2a0'
  }).setOrigin(.5);
  this.add.text(320,38,'6 NOVOS EFEITOS · PIXEL ART · PHASER/WEBGL',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#a7d9e9'
  }).setOrigin(.5);
  // Use already-loaded original P2 PMD Pokémon from the TITLE scene.
  // No substitute silhouette, new sprite import or native Pokémon kit mutation.
  // The title has loaded Exeggutor #0103 and Snorlax #0143 on this build.
  // The text fallback only handles incomplete external source captures.
  this.visualActors=[];
  for(const fighter of [
   {dex:'0103',x:113,flip:false,animation:'0103-Idle-2',label:'ATACANTE'},
   {dex:'0143',x:502,flip:true,animation:'0143-Idle-6',label:'ALVO DE TESTE'}
  ]){
   this.add.text(fighter.x,95,fighter.label,{
    fontFamily:'Pixelify Sans,monospace',fontSize:'10px',
    color:fighter.flip?'#f5d9ac':'#c9e7fb'
   }).setOrigin(.5);
   const texture='pmd-'+fighter.dex+'-Idle';
   if(this.textures.exists(texture)){
    const actor=this.add.sprite(fighter.x,214,texture)
     .setOrigin(.5,1).setScale(1.65).setDepth(20);
    if(fighter.flip)actor.setFlipX(true);
    if(this.anims.exists(fighter.animation))actor.play(fighter.animation);
    this.visualActors.push(actor);
   }else{
    this.add.text(fighter.x,166,fighter.flip?'CPU':'P1',{
     fontFamily:'Pixelify Sans,monospace',fontSize:'24px',
     color:fighter.flip?'#e2c59b':'#aecee5'
    }).setOrigin(.5);
   }
  }
  this.explain=this.add.text(320,60,'Selecione um golpe para assistir ao movimento completo.',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#c5e3ee'
  }).setOrigin(.5);
  this.fx=this.add.sprite(180,157,SIX_VFX_ATLAS,0)
   .setScale(2.24).setVisible(false).setDepth(85);
  this.hitText=this.add.text(490,204,'',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'11px',color:'#ffffff',stroke:'#173448',strokeThickness:3
  }).setOrigin(.5).setDepth(90);
  this.frame=0;this.selected=null;this.casting=false;
  this.pending=null;this.cards=[];
  for(let i=0;i<SIX_VFX_TRAINING.length;i++){
   const def=SIX_VFX_TRAINING[i],col=i%3,row=Math.floor(i/3);
   const x=115+col*205,y=274+row*40;
   const rect=this.add.rectangle(x,y,193,34,0x233f52,.98)
    .setStrokeStyle(1,0x708fa6)
    .setInteractive({useHandCursor:true});
   const label=this.add.text(x,y,def.name,{
    fontFamily:'Pixelify Sans,monospace',fontSize:'12px',color:'#eaf6ff'
   }).setOrigin(.5);
   rect.on('pointerdown',()=>this.cast(def.id));
   this.cards.push({id:def.id,rect,label});
  }
  const back=this.add.rectangle(547,17,137,23,0x354561,.96)
    .setStrokeStyle(1,0x92a8c6).setInteractive({useHandCursor:true});
  this.add.text(547,17,'VOLTAR AO JOGO',{
   fontFamily:'Pixelify Sans,monospace',fontSize:'10px',color:'#ffffff'
  }).setOrigin(.5);
  back.on('pointerdown',()=>this.scene.start('titulo',{menu:'jugar'}));
  this.events.once('shutdown',()=>{
   if(this.pending){this.pending.remove(false);this.pending=null;}
   this.fx?.destroy();this.__vfxSixDestroyed=true;
  });
  this.cast('gunk-shot');
 }
 cast(id){
  const def=SIX_VFX_TRAINING.find(m=>m.id===id);
  if(!def)return false;
  if(this.pending){this.pending.remove(false);this.pending=null;}
  this.selected=def.id;
  this.casting=true;
  this.frame=0;
  this.hitText.setText('');
  this.explain.setText(def.name+' · '+def.type+' · '+def.power+' · ANIMAÇÃO VISUAL');
  this.cards.forEach(c=>{
   const active=c.id===id;
   c.rect.setFillStyle(active?0x28615c:0x233f52);
   c.rect.setStrokeStyle(1,active?0xa2ebc7:0x708fa6);
   c.label.setColor(active?'#eaffd8':'#eaf6ff');
  });
  const paint=()=>{
   const f=this.frame;
   this.fx.setFrame(def.start+f).setVisible(true);
   const pos=ease(f/9);
   this.fx.setPosition(Math.round(173+277*pos),Math.round(163-13*Math.sin(Math.PI*clamp(f/9,0,1))));
   // Real painted impact frames are shown at the target, never when a shot misses.
   if(f===9)this.hitText.setText('CONTATO VISUAL');
   if(f>=13)this.hitText.setText('');
   if(f>=15){
    this.casting=false;
    this.pending=null;
    this.explain.setText(def.name+' · 16 QUADROS · PRONTO PARA REPETIR');
    return;
   }
   this.frame++;
   this.pending=this.time.delayedCall(FRAME_MS[f],paint);
  };
  paint();
  return true;
 }
}
