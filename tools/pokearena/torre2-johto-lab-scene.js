/* Isolated 18-move Mewtwo Training selector. No campaign reads/writes. */
import {JOHTO_LAB_ALL,JOHTO_LAB_SLOTS,JOHTO_LAB_DEFAULT,validateJohtoLabSlots,makeJohtoTrainingKit}
 from "./johto-lab-catalog.js";
import {JOHTO_GEN3_SPEC} from "./torre2-johto-gen3-research.js";
import {esTactil} from "../tactil.js";
export class JohtoLab extends Phaser.Scene{
 constructor(){super("johto-lab")}
 init(data={}){this.picks=validateJohtoLabSlots(data.slots)?[...data.slots]:[...JOHTO_LAB_DEFAULT];this.slot=0;this.page=0;}
 preload(){
  // Artist-editable PNG strips built offline; only the isolated test lab loads them.
  // Browser nearest-neighbor preserves crisp pixel art on 16:9/WebGL displays.
  for(const m of JOHTO_LAB_ALL.filter(m=>m.visualOnly||!['zap-cannon','powder-snow','whirlpool'].includes(m.id)))
   this.load.spritesheet('torre2-johto-pixelfx-'+m.id,
    'assets/torre2/johto-pixelfx/'+m.id+'.png',
    {frameWidth:96,frameHeight:96});
  for(const id of ['zap-cannon','powder-snow','whirlpool'])
   this.load.spritesheet('torre2-johto-pilot-'+id,
    'assets/torre2/johto-pilot/'+id+'.png',
    {frameWidth:64,frameHeight:64});
 }

 create(){
  this.add.rectangle(320,180,640,360,0x071426);
  this.add.text(320,13,"MEWTWO · JOHTO TRAINING LAB",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"19px",color:"#ffe6a4",stroke:"#101f38",strokeThickness:3}).setOrigin(.5);
  this.add.text(320,37,"46 GOLPES: 3 APROVADOS + 43 PIXELFX · SEM CAMPANHA",{
   fontFamily:"Pixelify Sans,monospace",fontSize:"10px",color:"#a7bfdc"}).setOrigin(.5);
  const box=(x,y,w,h,fill,stroke,action)=>{
   const r=this.add.rectangle(x,y,w,h,fill,.96).setStrokeStyle(1,stroke);
   r.setInteractive({useHandCursor:true}).on("pointerdown",action);
   return r;
  };
  const labels=["ATK · LMB","HAB 2 · RMB","HAB 3 · Q","ULT · E"];
  this.slotBoxes=JOHTO_LAB_SLOTS.map((slot,i)=>{
   const x=86+i*156;
   const r=box(x,68,145,31,0x183049,0x6383ae,()=>{this.slot=i;this.refresh();});
   const title=this.add.text(x,61,labels[i],{fontFamily:"Pixelify Sans,monospace",
    fontSize:"9px",color:"#acc5e4"}).setOrigin(.5);
   const value=this.add.text(x,73,"",{fontFamily:"Pixelify Sans,monospace",
    fontSize:"10px",color:"#fff1c2"}).setOrigin(.5);
   return {r,title,value};
  });
  // 15 visible entries per page, preserving native 640x360 mobile controls.
  const pageSize=15;
  this.moveCards=Array.from({length:pageSize},(_,i)=>{
   const x=110+(i%3)*211,y=111+Math.floor(i/3)*30;
   const r=box(x,y,200,26,0x14283e,0x415c7b,()=>{
    const m=this.moveCards[i].m;if(!m)return;
    const old=this.picks.indexOf(m.id);
    if(old>=0&&old!==this.slot)this.picks[old]=this.picks[this.slot];
    this.picks[this.slot]=m.id;
    this.slot=(this.slot+1)%4;this.refresh();
   });
   const text=this.add.text(x-93,y,"",{fontFamily:"Pixelify Sans,monospace",
    fontSize:"11px",color:"#e4f0ff"}).setOrigin(0,.5);
   return {r,text,m:null};
  });
  box(185,280,108,25,0x30405c,0x91a4cf,()=>{
   this.page=(this.page+Math.ceil(JOHTO_LAB_ALL.length/pageSize)-1)
    %Math.ceil(JOHTO_LAB_ALL.length/pageSize);this.refresh();
  });
  this.add.text(185,280,"< ANTERIOR",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"10px",color:"#fff2d5"}).setOrigin(.5);
  box(457,280,108,25,0x30405c,0x91a4cf,()=>{
   this.page=(this.page+1)%Math.ceil(JOHTO_LAB_ALL.length/pageSize);
   this.refresh();
  });
  this.add.text(457,280,"PRÓXIMA >",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"10px",color:"#fff2d5"}).setOrigin(.5);
  this.pageLabel=this.add.text(320,280,"",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"10px",color:"#ffe0a0"}).setOrigin(.5);
  this.infoLabel=this.add.text(320,297,"",{
   fontFamily:"Pixelify Sans,monospace",fontSize:"9px",color:"#ffc987"
  }).setOrigin(.5);
  box(419,330,232,37,0x225a46,0x89e5ab,()=>this.startPractice());
  this.add.text(419,330,"TESTAR NO TRAINING",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"15px",color:"#e6ffdf"}).setOrigin(.5);
  box(131,330,197,37,0x30405c,0x91a4cf,()=>this.scene.start("titulo",{menu:"jugar"}));
  this.add.text(131,330,"VOLTAR",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"14px",color:"#f2f5fa"}).setOrigin(.5);
  this.refresh();
 }
 refresh(){
  this.slotBoxes.forEach(({r,value},i)=>{
   r.setFillStyle(i===this.slot?0x305e7b:0x183049);
   r.setStrokeStyle(1,i===this.slot?0xffdf92:0x6383ae);
   value.setText(JOHTO_LAB_ALL.find(m=>m.id===this.picks[i]).nombre);
  });
  const pages=Math.ceil(JOHTO_LAB_ALL.length/15);
  this.pageLabel.setText((this.page+1)+" / "+pages);
  const selected=JOHTO_LAB_ALL.find(m=>m.id===this.picks[(this.slot+3)%4]);
  const description=JOHTO_GEN3_SPEC[selected?.id]?.effect||"Escolha um golpe";
  this.infoLabel.setText((selected?.nombre||"")+" · "+
   (description.length>74?description.slice(0,71)+"...":description));
  this.moveCards.forEach((card,i)=>{
   const {r,text}=card,m=JOHTO_LAB_ALL[this.page*15+i]||null;
   card.m=m;
   r.setVisible(!!m);text.setVisible(!!m);
   if(!m){r.disableInteractive();return;}
   r.setInteractive({useHandCursor:true});
   const chosen=this.picks.includes(m.id),active=this.picks[this.slot]===m.id;
   r.setFillStyle(active?0x365d53:chosen?0x273f55:0x14283e);
   r.setStrokeStyle(1,chosen?0xe2bd73:0x415c7b);
   text.setText(m.nombre+(m.visualOnly?" [VFX]":['zap-cannon','powder-snow','whirlpool'].includes(m.id)?" [OK]":" [FX]"))
    .setColor(chosen?"#ffe5a2":m.visualOnly?"#aadceb":"#e4f0ff");
  });
 }
 startPractice(){
  const slots=[...this.picks],kit=makeJohtoTrainingKit(slots);
  this.scene.start("combate",{
   p1:"mewtwo",p2:"onix",modo:"entreno",nivel:"facil",arena:"crater",
   mandos:[esTactil()?"tactil":"kbm","muneco"],
   johtoLab:{slots,kit}
  });
 }
}
