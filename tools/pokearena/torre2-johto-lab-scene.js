/* Isolated 18-move Mewtwo Training selector. No campaign reads/writes. */
import {JOHTO_18,JOHTO_LAB_SLOTS,JOHTO_LAB_DEFAULT,validateJohtoLabSlots,makeJohtoTrainingKit}
 from "./johto-lab-catalog.js";
import {esTactil} from "../tactil.js";
export class JohtoLab extends Phaser.Scene{
 constructor(){super("johto-lab")}
 init(data={}){this.picks=validateJohtoLabSlots(data.slots)?[...data.slots]:[...JOHTO_LAB_DEFAULT];this.slot=0;}
 create(){
  this.add.rectangle(320,180,640,360,0x071426);
  this.add.text(320,13,"MEWTWO · JOHTO TRAINING LAB",{fontFamily:"Pixelify Sans,monospace",
   fontSize:"19px",color:"#ffe6a4",stroke:"#101f38",strokeThickness:3}).setOrigin(.5);
  this.add.text(320,37,"18 GOLPES EM TESTE · 4 SLOTS · SEM ALTERAR A CAMPANHA",{
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
  this.moveCards=JOHTO_18.map((m,i)=>{
   const x=110+(i%3)*211,y=111+Math.floor(i/3)*30;
   const r=box(x,y,200,26,0x14283e,0x415c7b,()=>{
    const old=this.picks.indexOf(m.id);
    if(old>=0&&old!==this.slot)this.picks[old]=this.picks[this.slot];
    this.picks[this.slot]=m.id;
    this.slot=(this.slot+1)%4;this.refresh();
   });
   const text=this.add.text(x-93,y,m.nombre,{fontFamily:"Pixelify Sans,monospace",
    fontSize:"11px",color:"#e4f0ff"}).setOrigin(0,.5);
   return {r,text,m};
  });
  this.add.text(320,296,"PROTÓTIPO: AMIZADE / IV / ITENS / TROCA / EQUIPE AINDA EM VALIDAÇÃO",{
   fontFamily:"Pixelify Sans,monospace",fontSize:"10px",color:"#ffc987"}).setOrigin(.5);
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
   value.setText(JOHTO_18.find(m=>m.id===this.picks[i]).nombre);
  });
  this.moveCards.forEach(({r,text,m})=>{
   const chosen=this.picks.includes(m.id),active=this.picks[this.slot]===m.id;
   r.setFillStyle(active?0x365d53:chosen?0x273f55:0x14283e);
   r.setStrokeStyle(1,chosen?0xe2bd73:0x415c7b);
   text.setColor(chosen?"#ffe5a2":"#e4f0ff");
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
