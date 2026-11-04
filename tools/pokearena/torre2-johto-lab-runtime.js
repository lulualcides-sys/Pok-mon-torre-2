/* Mewtwo Johto laboratory: 18 original, additive Phaser Graphics VFX.
 * Uses P2-style timed action + native real-contact receiving and T2 particle FX.
 * This is a battle prototype, not complete Gen II status/item/IV parity.
 */
import * as vfx from "../vfx.js";
import {JOHTO_18} from "./johto-lab-catalog.js";
const tones={
 "triple-kick":[0xedb555,0xfff0b9],"thief":[0x715298,0xd5b8ed],
 "snore":[0x6ed0de,0xc9f8ff],"powder-snow":[0x79c6ed,0xf1ffff],
 "octazooka":[0x3b4482,0xb2a1ed],"zap-cannon":[0xe5bc38,0xf9f3b7],
 "false-swipe":[0x75dcb1,0xcafce2],"steel-wing":[0x83a5ba,0xeaf8ff],
 "return":[0xcfac86,0xffe7c7],"present":[0xd84f78,0xffd3a5],
 "frustration":[0xd44b48,0xffb26b],"magnitude":[0xa38958,0xffe3a1],
 "pursuit":[0x5d489c,0xd5cbf7],"vital-throw":[0xd88e4f,0xffebcc],
 "hidden-power":[0x7db8ed,0xf9dafd],"rock-smash":[0xa18d6d,0xffe5bd],
 "whirlpool":[0x2087a9,0xb8f1ff],"beat-up":[0x786080,0xf2e1fb]
};
const projectile=new Set(["snow","ink","electric","gift","orb","sound","vortex"]);
const adjacent=new Set(["kick","slash","wing","dash","throw","rock"]);
const near=(a,b,r)=>Math.hypot(a.x-b.x,a.y-b.y)<=r;
function artwork(g,style,x,y,age,[base,light]){
 g.clear();
 if(style==="quake"){
  for(let n=0;n<3;n++){g.lineStyle(2,n%2?light:base,.8);
   g.strokeEllipse(x,y,(14+age*150-n*15)*2,(5+age*35-n*4)*2);}
  for(let i=0;i<6;i++){g.fillStyle(i%2?light:base);
   g.fillRect(x+Math.cos(i*1.4)*55,y+Math.sin(i*2)*18,4,5);}
 }else if(style==="vortex"||style==="sound"){
  for(let i=0;i<4;i++){g.lineStyle(style==="vortex"?3:2,i%2?base:light,.8);
   const radius=Math.max(2,9+age*85-i*10);
   g.strokeCircle(x,y,radius);}
 }else if(style==="snow"||style==="ink"){
  for(let i=0;i<10;i++){const a=i*2.4+age*9,r=5+i%4*5;
   g.fillStyle(i%2?base:light,.9);
   g.fillRect(x+Math.cos(a)*r,y+Math.sin(a)*r,style==="snow"?3:5,style==="snow"?3:5);}
 }else if(style==="electric"||style==="orb"){
  g.fillStyle(base,.5);g.fillCircle(x,y,15);
  g.lineStyle(2,light,1);g.strokeCircle(x,y,18+Math.sin(age*23)*3);
  for(let i=0;i<6;i++){const a=i*Math.PI/3+age*4;
   g.lineBetween(x+Math.cos(a)*11,y+Math.sin(a)*11,x+Math.cos(a)*31,y+Math.sin(a)*31);}
 }else if(style==="gift"){
  g.fillStyle(base);g.fillRect(x-11,y-10,22,20);
  g.fillStyle(light);g.fillRect(x-2,y-11,4,22);g.fillRect(x-12,y-2,24,4);
 }else if(style==="kick"||style==="slash"||style==="wing"){
  for(let i=0;i<3;i++){g.lineStyle(4,i%2?base:light);
   const angle=age*11+i*1.7;
   g.lineBetween(x-12,y-12,x+Math.cos(angle)*30,y+Math.sin(angle)*24);}
 }else{
  g.fillStyle(base,.75);g.fillCircle(x,y,13);
  g.lineStyle(2,light);g.strokeCircle(x,y,19);
  g.lineBetween(x-18,y-12,x+16,y+16);
 }
}
function cast(l,h,extra){
 if(!l?.escena?.datos?.johtoLab||!l.rival)return false;
 if(h.id==="snore"&&!l.est?.dormido)return false;
 const e=l.escena,r=l.rival,angle=Math.atan2(l.ay-l.y,l.ax-l.x),dx=Math.cos(angle),dy=Math.sin(angle);
 const style=h.style,palette=tones[h.id];if(!palette)return false;
 const g=e.add.graphics().setDepth(1520);
 const sx=l.x+dx*12,sy=l.y-l.alto*.5+dy*8;
 const beam=projectile.has(style),melee=adjacent.has(style);
 const duration=style==="vortex"?1.65:style==="quake"?1.05:beam?1.1:.75;
 const windows=h.id==="triple-kick"?[.17,.34,.51]:
  h.id==="beat-up"?[.12,.23,.34,.45,.56]:
  h.id==="whirlpool"?[.4,.7,1,1.3]:[.31];
 let age=0,hits=0,stopped=false;
 l.animar(h.anim||"Attack",.53,.13);
 l.accion={hasta:l.t+.38,angulo:angle,lento:.65};
 const receiver=(x,y)=>{
  const center={x:r.x,y:r.y-r.alto*.5};
  const range=style==="quake"?160:style==="vortex"?78:
   style==="sound"?120:melee?Math.max(30,h.alcance):27;
  return near({x,y},center,range+Math.max(3,r.alto*.2));
 };
 const hit=()=>{
  if(r.ko||stopped)return;
  if(Math.random()>h.precisao/100){if(h.id==="triple-kick")stopped=true;return;}
  let damage=h.dano;
  if(h.id==="triple-kick")damage*=hits+1;
  if(h.id==="beat-up")damage*=.52; // preview until team is modeled
  if(h.id==="magnitude")damage*=[.7,1,1.4,1.8][Math.floor(Math.random()*4)];
  if(h.id==="present"){
   if(Math.random()<.2){r.hp=Math.min(r.hpMax,r.hp+r.hpMax*.25);return;}
   damage*=.7+Math.floor(Math.random()*3)*.45;
  }
  const oldKo=r.ko;
  const outcome=r.recibir(l,{dano:damage,tipo:h.tipo,slot:extra?.slot,
   surge:extra?.surge,dirX:dx,dirY:dy,empuje:18});
  if(h.id==="false-swipe"&&outcome==="golpe"&&(r.ko||r.hp<1)){
   r.hp=Math.max(1,r.hp);r.ko=oldKo;
  }
  if(outcome==="golpe"){
   vfx.rafaga(e,"chispa",r.x,r.y-r.alto*.5,palette[1],8);
   if(h.id==="zap-cannon")r.ponerEstado("paralizado",2.5);
   if(h.id==="whirlpool")r.ponerEstado("lento",.7,{f:.25});
  }
 };
 const fx={update(dt){
  age+=Math.max(0,Math.min(.05,dt||0));
  if(age>=duration){g.destroy();return false;}
  const travel=Math.min(h.alcance,age*360);
  const x=beam?sx+dx*travel:style==="quake"?l.x+dx*80:melee?l.x+dx*37:r.x;
  const y=beam?sy+dy*travel:style==="quake"?l.y-7:melee?l.y-l.alto*.5+dy*12:r.y-r.alto*.5;
  artwork(g,style,x,y,age,palette);
  if(hits<windows.length&&age>=windows[hits]){
   if(receiver(x,y))hit();
   hits++; // independent hit windows; only triple-kick stops after miss
  }
  return true;
 },destroy(){g.destroy()}};
 e.efectos.push(fx);return true;
}
export const TORRE2_JOHTO_LAB_FORMS=Object.freeze(Object.fromEntries(
 JOHTO_18.map(m=>[m.forma,(l,h,extra)=>cast(l,h,extra)])));
