/* Pokémon Torre 2 original Phaser/WebGL attack art.
 * Pixel primitives and frame-updated Phaser graphics; no old Torre 1 VFX,
 * static PNG or fake CSS projectiles. Damage/status occurs at contact.
 */
import * as vfx from '../vfx.js';
const PI=Math.PI, sat=t=>Math.max(0,Math.min(1,t)), ease=t=>1-(1-sat(t))**3;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=x=>Math.round(x);
const draw=(g,x,y,w,h,color,alpha=1)=>{g.fillStyle(color,alpha);g.fillRect(rnd(x),rnd(y),Math.max(1,rnd(w)),Math.max(1,rnd(h)))};
const layer=(e,z=1509)=>e.add.graphics().setDepth(z);
const direct=l=>Math.atan2(l.ay-l.y,l.ax-l.x);
function hit(l,h,extra,r,power=1,push=38){
 if(!r||r.ko)return false;
 const len=Math.hypot(r.x-l.x,r.y-l.y)||1;
 const was=r.hp;
 const outcome=r.recibir(l,{dano:(h.dano||10)*power,tipo:h.tipo||'NORMAL',
  empuje:push,dirX:(r.x-l.x)/len,dirY:(r.y-l.y)/len,
  surge:extra?.surge,slot:extra?.slot,pesado:power>=.8});
 return outcome==='golpe'||r.hp<was;
}
function sparkle(e,x,y,color,volume=1){
 vfx.impacto(e,rnd(x),rnd(y),color,volume);
 vfx.rafaga(e,'chispa',rnd(x),rnd(y),color,Math.round(4+3*volume));
}
function targetAt(r){return r?{x:r.x,y:r.y-r.alto*.5}:null}
function running(e,update,dispose){
 const fx={update(dt){return update(dt)},destroy(){dispose?.()}};
 e.efectos.push(fx);return fx;
}
function drawFoam(g,x,y,t,seed){
 draw(g,x,y,5,3,0x0e4064);
 draw(g,x+1,y,4,2,0xe5fbff);
 draw(g,x+2,y-2-Math.sin(t*13+seed)*2,2,2,0xa6f2fd);
}
export function surf(l,h,extra){
 const e=l.escena,r=l.rival,ang=direct(l),g=layer(e,1510),foam=layer(e,1511);
 const start={x:l.x+Math.cos(ang)*9,y:l.y-l.alto*.33};
 const speed=h.alcance||255;
 let time=0,damaged=false,burst=0;
 l.animar('Shoot',.65,.2);
 l.accion={hasta:l.t+.55,bloquea:true,lento:.35,angulo:ang};
 return running(e,dt=>{
  time+=dt;const t=time/1.13;
  if(t>=1.18){g.destroy();foam.destroy();return false}
  const flight=ease(sat((t-.1)/.8))*speed;
  const x=start.x+Math.cos(ang)*flight,y=start.y+Math.sin(ang)*flight*.73;
  g.clear();foam.clear();g.setPosition(rnd(x),rnd(y)).setRotation(ang);
  foam.setPosition(rnd(x),rnd(y)).setRotation(ang);
  // Broad stepped water wall with a curved crest; *not* Water Gun scaled up.
  const swell=(.7+.3*Math.sin(Math.min(1,t)*PI))*Math.min(1,t*6);
  const span=34*swell,crest=7+5*Math.sin(t*11);
  for(let k=-9;k<=9;k++){
   const side=k/9,dy=side*span;
   const ridge=11*Math.cos(side*PI*.5)+crest*Math.pow(1-Math.abs(side),2);
   const depth=11+ridge;
   draw(g,-12-ridge*.35,dy-5,depth+15,11,0x0d2b4b,.95);
   draw(g,-9-ridge*.28,dy-4,depth+11,8,0x22759e,.97);
   draw(g,1,dy-3,Math.max(4,11+ridge*.5),4,0x66c9e3,.85);
   if(k%2===0){
    drawFoam(foam,7+ridge*.4,dy-4,time,k);
    draw(foam,9+ridge*.4,dy-6,2,2,0xffffff,.75);
   }
  }
  // Foaming spray and trailing droplets travel with the water front.
  for(let i=0;i<9;i++){
   const seed=i*12.989,offset=Math.sin(seed)*18;
   const fx=-24-(i*7+Math.floor(time*70))%37;
   draw(foam,fx,offset,2+i%2,2,0x8dddf2,.55);
  }
  if(!damaged&&r&&!r.ko&&t>.1){
   const tx=r.x-x,ty=r.y-r.alto*.5-y;
   const forward=tx*Math.cos(ang)+ty*Math.sin(ang);
   const side=-tx*Math.sin(ang)+ty*Math.cos(ang);
   if(Math.abs(forward)<21&&Math.abs(side)<Math.max(25,span)){
    damaged=true;burst=.3;
    if(hit(l,h,extra,r,1,90))sparkle(e,r.x,r.y-r.alto*.5,0x81e9f8,1.3);
   }
  }
  if(burst>0){
   burst-=dt;
   vfx.rafaga(e,'gota',rnd(x),rnd(y),0x84dff7,2);
  }
  return true
 },()=>{g.destroy();foam.destroy()});
}
function star(g,x,y,size=1,phase=0){
 const c=0xffe368,bright=0xfff9c1,outline=0x17233e;
 const s=Math.max(1,Math.round(size));
 draw(g,x-3*s,y-s,7*s,3*s,outline);
 draw(g,x-s,y-4*s,3*s,9*s,outline);
 draw(g,x-2*s,y-2*s,5*s,5*s,c);
 draw(g,x-s,y-3*s,3*s,7*s,c);
 draw(g,x-3*s,y-s,7*s,3*s,c);
 draw(g,x-s,y-s,2*s,2*s,bright);
 if(phase%2===0){draw(g,x+3*s,y-2*s,s,2*s,bright,.6)}
}
export function swift(l,h,extra){
 const e=l.escena,g=layer(e,1510),tail=layer(e,1509),r=l.rival;
 let time=0,done=false;
 const ox=l.x,oy=l.y-l.alto*.56,angle=direct(l);
 const stars=Array.from({length:7},(_,i)=>({
  i,delay:i*.057,turn:(i%2?1:-1)*(8+((i*13)%22)),
  phase:i*.77,hit:false
 }));
 l.animar('Shoot',.55,.1);l.accion={hasta:l.t+.26,lento:.6,angulo:angle};
 return running(e,dt=>{
  time+=dt;g.clear();tail.clear();
  let rendered=0;
  for(const q of stars){
   const t=(time-q.delay)/.68;
   if(t<0||t>1)continue;
   rendered++;
   const to=targetAt(r)||{x:ox+Math.cos(angle)*240,y:oy+Math.sin(angle)*150};
   const progress=ease(t),wiggle=Math.sin(progress*PI)*q.turn;
   const nx=-Math.sin(angle),ny=Math.cos(angle);
   const x=lerp(ox,to.x,progress)+nx*wiggle,y=lerp(oy,to.y,progress)+ny*wiggle*.75-18*Math.sin(progress*PI);
   star(g,x,y,1+(q.i%3===0?1:0),Math.floor(time*12+q.phase));
   for(let k=1;k<=2;k++){
    const px=lerp(ox,to.x,ease(sat(t-.035*k)))+nx*wiggle*.8,
          py=lerp(oy,to.y,ease(sat(t-.035*k)))+ny*wiggle*.75;
    draw(tail,px-2,py-1,4,2,0xffd96f,.35);
   }
   if(!q.hit&&!done&&t>.83&&r&&!r.ko){
    q.hit=true;done=true; // Swift's synchronized single attack never misses.
    if(hit(l,h,extra,r,1,42))sparkle(e,r.x,r.y-r.alto*.5,0xffed84,1.1);
   }
  }
  if(time>1.13){g.destroy();tail.destroy();return false}
  return true
 },()=>{g.destroy();tail.destroy()});
}
function orb(g,x,y,t){
 const bands=[[-12,8,0x101027],[-10,5,0x352052],[-8,3,0x643c96],[-5,0,0x9e6bd1]];
 for(const [radius,shift,col] of bands){
  const r=radius<0?-radius:radius;
  for(let yy=-r;yy<=r;yy+=3){
   const xx=Math.floor(Math.sqrt(Math.max(0,r*r-yy*yy)));
   draw(g,x-xx+shift*.13,y+yy+shift*.11,xx*2,3,col,.93);
  }
 }
 draw(g,x-5,y-6,5,4,0xbda6ed,.8);
 draw(g,x+7,y+6,5,3,0x0b0b23);
}
export function shadowball(l,h,extra){
 const e=l.escena,g=layer(e,1510),aura=layer(e,1508),r=l.rival;
 const ox=l.x+7,oy=l.y-l.alto*.55,ang=direct(l);
 let t=0,landed=false,explode=0,ix=0,iy=0;
 l.animar('Charge',.6,.16);l.accion={hasta:l.t+.3,bloquea:true,lento:.44,angulo:ang};
 return running(e,dt=>{
  t+=dt;
  if(t>1.25){g.destroy();aura.destroy();return false}
  g.clear();aura.clear();
  if(explode){
   explode-=dt;
   const rad=(1-Math.max(0,explode)/.31)*37;
   aura.lineStyle(4,0x130f2f,.95);aura.strokeCircle(ix,iy,rad+4);
   aura.lineStyle(2,0xa48adc,.88);aura.strokeCircle(ix,iy,rad);
   for(let i=0;i<8;i++){
    const theta=i*PI/4+t*9;
    draw(g,ix+Math.cos(theta)*rad,iy+Math.sin(theta)*rad,5,4,i%2?0x6f4ca3:0x2c2256,.8);
   }
   return true;
  }
  const flight=ease(sat((t-.09)/.74));
  const range=Math.min(h.alcance||245,250);
  const x=ox+Math.cos(ang)*range*flight,y=oy+Math.sin(ang)*range*flight*.73-4*Math.sin(t*13);
  orb(g,x,y,t);
  for(let i=0;i<13;i++){
   const theta=(i*2.4+t*17),rad=17+(i*7)%14;
   draw(aura,x+Math.cos(theta)*rad,y+Math.sin(theta)*rad*.9,3+(i%3),3,
    i%2?0x8456b0:0x392862,(.35+.4*(i%3)/3));
   draw(aura,x-Math.cos(ang)*(i*7+10),y-Math.sin(ang)*(i*4+5),3,2,0x593c87,.4);
  }
  if(!landed&&r&&!r.ko&&Math.hypot(x-r.x,y-(r.y-r.alto*.5))<24){
   landed=true;explode=.31;ix=x;iy=y;
   if(hit(l,h,extra,r,1,65)){
    sparkle(e,r.x,r.y-r.alto*.5,0x9b6ad3,1.22);
    // Shadow Ball: 20% chance to weaken Special Defence in the original.
    // Simplified Arena combat: 20% slow/debuff; no false permanent stat loss.
    if(Math.random()<.2)r.ponerEstado('lento',2,{f:.15});
   }
  }
  return true
 },()=>{g.destroy();aura.destroy()});
}
function lips(g,x,y,size=1){
 const s=Math.max(1,Math.round(size));
 // Two pink pixel lobes with a dark central mouth line; no emoji or PNG.
 draw(g,x-9*s,y-2*s,7*s,5*s,0x230d30);
 draw(g,x+2*s,y-2*s,7*s,5*s,0x230d30);
 draw(g,x-8*s,y-4*s,16*s,6*s,0xe98abb);
 draw(g,x-6*s,y-5*s,5*s,3*s,0xffc0e4);
 draw(g,x+2*s,y-5*s,5*s,3*s,0xffb5dc);
 draw(g,x-7*s,y+1*s,14*s,4*s,0xbc518b);
 draw(g,x-5*s,y+3*s,10*s,2*s,0x84295b);
 draw(g,x-4*s,y,8*s,2*s,0x3c153c);
}
function heart(g,x,y,scale=1){
 draw(g,x-5*scale,y,4*scale,4*scale,0xffb5d8);
 draw(g,x+2*scale,y,4*scale,4*scale,0xffa0cb);
 draw(g,x-6*scale,y+3*scale,12*scale,3*scale,0xe97eae);
 draw(g,x-4*scale,y+6*scale,8*scale,3*scale,0xdf679f);
 draw(g,x-2*scale,y+9*scale,4*scale,2*scale,0xd25698);
}
export function lovelykiss(l,h,extra){
 const e=l.escena,g=layer(e,1510),trail=layer(e,1509),r=l.rival;
 let t=0,hitStatus=false,burst=0;
 const origin={x:l.x+10,y:l.y-l.alto*.58},ang=direct(l);
 l.animar('Shoot',.63,.12);
 l.accion={hasta:l.t+.31,angulo:ang,lento:.7};
 return running(e,dt=>{
  t+=dt;g.clear();trail.clear();
  if(t>1.22){g.destroy();trail.destroy();return false}
  const progress=ease(sat((t-.12)/.75));
  const target=targetAt(r)||{x:origin.x+Math.cos(ang)*190,y:origin.y+Math.sin(ang)*110};
  const x=lerp(origin.x,target.x,progress),y=lerp(origin.y,target.y,progress)-10*Math.sin(progress*PI);
  lips(g,x,y,progress>.4?1:1);
  for(let i=0;i<6;i++){
   const f=sat((t-i*.09)/.78);
   const sx=lerp(origin.x,target.x,f),sy=lerp(origin.y,target.y,f)-19*Math.sin(f*PI);
   const sideways=Math.sin(i*3.2+t*6)*9;
   heart(trail,sx-sideways,sy-14+Math.cos(i+t*8)*8,1);
  }
  if(!hitStatus&&progress>.96&&r&&!r.ko){
   hitStatus=true;burst=.48;
   if(Math.random()<.75){
    r.ponerEstado('aturdido',2.4,{fuente:l});
    vfx.textoFlotante(e,r.x,r.y-r.alto-11,'Zzz…',{color:'#f8a1d2',dur:1100});
    sparkle(e,r.x,r.y-r.alto*.5,0xffa4d7,.92);
   }else{
    vfx.textoFlotante(e,r.x,r.y-r.alto-10,'MISS',{color:'#ffbfdd',dur:600});
   }
  }
  if(burst>0)burst-=dt;
  return true
 },()=>{g.destroy();trail.destroy()});
}
export const TORRE2_NEW_FORMS={
 torre2_surf:surf,torre2_swift:swift,torre2_shadowball:shadowball,
 torre2_lovelykiss:lovelykiss
};
