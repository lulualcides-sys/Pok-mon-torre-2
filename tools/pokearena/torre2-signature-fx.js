/* Original Pokémon Torre 2 signature attacks: Phaser/WebGL only.
 * No sprites, Canvas2D renderer or attack assets from Pokémon Torre 1.
 * Every impact is resolved at the rendered contact frame.
 */
import * as vfx from '../vfx.js';

const pi=Math.PI, clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=t=>1-(1-clamp(t))**3;
const mix=(a,b,t)=>a+(b-a)*t;
const p=x=>Math.round(x);
const spin=(g,a)=>g.setRotation(a);
const colors={
 outline:0x101725,shadow:0x445466,bone:0xe9e2bf,shine:0xffffff,
 golden:0xf6c54f,goldLit:0xfff2ae,goldDark:0x996023,
 fire:0xff763a,ice:0x8bdbfa,volt:0xffe96a,white:0xf7faff
};
function block(g,x,y,w,h,c,a=1){g.fillStyle(c,a);g.fillRect(p(x),p(y),p(w),p(h))}
function bone(g,size=1){
 g.clear();g.setScale(size);
 // Inky sprite silhouette, pixel joint and white shaft. No generic beam.
 block(g,-23,-5,46,10,colors.outline);
 block(g,-19,-4,38,8,colors.bone);
 block(g,-19,-4,34,3,colors.shine);
 block(g,-19,1,37,3,0xc0bca7);
 for(const dx of [-21,17]){
   block(g,dx,-9,9,8,colors.outline);
   block(g,dx,-11,6,5,colors.outline);
   block(g,dx,2,9,8,colors.outline);
   block(g,dx+1,-8,7,6,colors.bone);
   block(g,dx+1,2,7,5,colors.bone);
   block(g,dx+1,-8,5,3,colors.shine);
 }
}
function flash(e,x,y,tint=colors.white,intensity=1){
 vfx.impacto(e,p(x),p(y),tint,1.15*intensity);
 vfx.rafaga(e,'chispa',p(x),p(y),tint,Math.max(3,Math.round(6*intensity)));
}
function contact(l,h,extra,target,amount=1,options={}){
 if(!target||target.ko)return false;
 const dx=target.x-l.x,dy=target.y-l.y,len=Math.hypot(dx,dy)||1;
 return target.recibir(l,{dano:(h.dano??5)*amount,tipo:h.tipo||'NORMAL',
  surge:extra.surge,slot:extra.slot,empuje:options.push??45,
  aturde:options.stun??0,dirX:dx/len,dirY:dy/len,pesado:!!options.heavy})==='golpe';
}
function shape(e,depth=1510){return e.add.graphics().setDepth(depth)}
function effect(e,fx){e.efectos.push(fx);return fx}
function fadeDestroy(g,other=[]){g.destroy();for(const s of other)s?.destroy?.()}
function impactOnce(l,h,extra,visual,target,power=1,color=colors.white){
 if(!target||target.ko)return false;
 if(Math.hypot(visual.x-target.x,visual.y-target.y)>26)return false;
 const landed=contact(l,h,extra,target,power,{push:50,stun:.1,heavy:power>=1});
 if(landed)flash(l.escena,target.x,target.y-target.alto*.5,color);
 return landed;
}
export function bonemerang(l,h,extra){
 const e=l.escena,ang=Math.atan2(l.ay-l.y,l.ax-l.x),aim=l.rival;
 const ox=l.x+Math.cos(ang)*13,oy=l.y-l.alto*.52+Math.sin(ang)*4;
 const r=aim&&!aim.ko?Math.min(h.alcance??265,Math.hypot(aim.x-ox,aim.y-oy)):Math.min(h.alcance??265,175);
 const go=shape(e),trail=shape(e,1509);let age=0,hits=0;
 l.animar('Throw',.37,.13);l.accion={hasta:l.t+.24,angulo:ang,lento:.65};
 return effect(e,{update(dt){
  age+=dt;const T=age/1.04;
  if(T>=1){fadeDestroy(go,[trail]);return false}
  const outward=T<=.52,phase=outward?ease(T/.52):ease((T-.52)/.48);
  const distance=outward?mix(0,r,phase):mix(r,0,phase);
  const cx=p(ox+Math.cos(ang)*distance),cy=p(oy+Math.sin(ang)*distance*.72-15*Math.sin(pi*T));
  go.setPosition(cx,cy);spin(go,T*25);bone(go,.86+Math.sin(T*pi)*.12);
  trail.clear();trail.lineStyle(2,0x171f2a,.7);
  for(let i=1;i<4;i++){
   const oldT=clamp(T-i*.024),oldPhase=oldT<=.52?ease(oldT/.52):ease((oldT-.52)/.48);
   const d=oldT<=.52?mix(0,r,oldPhase):mix(r,0,oldPhase);
   const x=p(ox+Math.cos(ang)*d),y=p(oy+Math.sin(ang)*d*.72-15*Math.sin(pi*oldT));
   trail.fillStyle(0xcbd4cf,.28*(1-i/4));trail.fillRect(x-7,y-1,12,2);
  }
  const target=l.rival;
  if(target&&!target.ko&&Math.hypot(cx-target.x,cy-(target.y-target.alto*.4))<Math.max(24,target.alto*.85)&&
    (outward?!(hits&1):!(hits&2))){
    const pass=outward?1:2;hits|=pass;
    contact(l,h,extra,target,.52,{push:pass===2?60:28,stun:.08});
    flash(e,target.x,target.y-target.alto*.5,0xe8e3c8,.76);
  }
  return true
 }});
}
export function boneclub(l,h,extra){
 const e=l.escena,r=l.rival;
 const angle=Math.atan2(l.ay-l.y,l.ax-l.x),g=shape(e);
 let age=0,hit=false;
 l.animar('Swing',.44,.16);
 l.accion={hasta:l.t+.49,angulo:angle,lento:.25};
 return effect(e,{update(dt){
  age+=dt;const T=age/.54;if(T>=1){g.destroy();return false}
  const radius=10+20*Math.sin(clamp(T)*pi);
  const theta=angle-1.55+(T<.7?ease(T/.7)*2.6:2.6);
  const cx=p(l.x+Math.cos(theta)*radius),cy=p(l.y-l.alto*.5+Math.sin(theta)*radius*.65);
  g.setPosition(cx,cy);spin(g,theta+pi*.5);bone(g,.68);
  if(!hit&&T>=.42&&T<=.77&&r&&!r.ko){
   const distance=Math.hypot(r.x-l.x,r.y-l.y);
   if(distance<(h.alcance??67)+12){
    hit=true;contact(l,h,extra,r,1,{push:80,stun:.16,heavy:true});
    flash(e,r.x,r.y-r.alto*.55,0xfff2d0,1.15);
    e.cameras.main.shake(70,.004);
   }
  }
  return true
 }});
}
function elemental(g,ox,oy,size,type,t){
 // Three different readable silhouettes: licking flame, crystalline ice,
 // and bent lightning. Not three copies of a generic colored orb.
 const x=p(ox),y=p(oy),a=1;
 if(type===0){
  block(g,x-6,y-5,13,13,colors.outline);
  block(g,x-3,y-11,5,6,colors.outline);
  block(g,x+3,y-9,5,5,colors.outline);
  block(g,x-5,y-4,11,11,0xee5429);
  block(g,x-3,y-8,4,7,0xffa34c);
  block(g,x+2,y-7,3,7,0xffb655);
  block(g,x-2,y-2,6,8,0xffd675);
  block(g,x,y+1,3,5,colors.white);
 }else if(type===1){
  block(g,x-3,y-12,7,4,colors.outline);
  block(g,x-7,y-8,15,15,colors.outline);
  block(g,x-3,y+7,7,5,colors.outline);
  block(g,x-2,y-10,5,4,0xccf6ff);
  block(g,x-5,y-6,11,11,0x69b6e2);
  block(g,x-3,y-6,5,9,0xd5f8ff);
  block(g,x+2,y-5,2,12,0x9ce3fb);
  block(g,x-1,y+5,3,5,0xe9ffff);
 }else{
  block(g,x-3,y-13,10,5,colors.outline);
  block(g,x-1,y-10,7,8,colors.outline);
  block(g,x-7,y-3,13,6,colors.outline);
  block(g,x-5,y+1,8,7,colors.outline);
  block(g,x-5,y+7,5,6,colors.outline);
  block(g,x-1,y-11,5,5,0xfffa96);
  block(g,x-1,y-7,4,5,0xffdb44);
  block(g,x-5,y-1,9,3,0xffec59);
  block(g,x-3,y+2,5,6,0xffea61);
  block(g,x-4,y+8,3,4,colors.white);
 }
}
export function triattack(l,h,extra){
 const e=l.escena,r=l.rival,ang=Math.atan2(l.ay-l.y,l.ax-l.x),g=shape(e),tail=shape(e,1509);
 const start={x:l.x,y:l.y-l.alto*.55};let age=0,applied=false;
 l.animar('Charge',.65,.12);l.accion={hasta:l.t+.35,bloquea:true,lento:.3,angulo:ang};
 return effect(e,{update(dt){
  age+=dt;const T=age/.92;if(T>=1){fadeDestroy(g,[tail]);return false}
  const launched=clamp((T-.18)/.72),d=ease(launched)*Math.min(h.alcance??245,270);
  const cx=p(start.x+Math.cos(ang)*d),cy=p(start.y+Math.sin(ang)*d*.7);
  g.clear();tail.clear();
  const q=Math.min(1,launched*7);
  for(let i=0;i<3;i++){
   const theta=T*15+i*2*pi/3,rad=12+4*Math.sin(T*9+i);
   const x=p(cx+Math.cos(theta)*rad),y=p(cy+Math.sin(theta)*rad*.66);
   elemental(g,x,y,5+Math.round(q*2),i,T);
   const bx=p(x-Math.cos(ang)*14),by=p(y-Math.sin(ang)*9);
   block(tail,bx-2,by-1,10,3,[0xbf4326,0x3c9cc2,0xd9b94a][i],.6*(1-T));
  }
  // Three prongs remain visually distinct until contact.
  if(!applied&&launched>.06&&r&&!r.ko&&Math.hypot(cx-r.x,cy-(r.y-r.alto*.52))<25){
   applied=true;contact(l,h,extra,r,1,{stun:.2,push:70,heavy:true});
   for(const col of [colors.fire,colors.ice,colors.volt])flash(e,r.x,r.y-r.alto*.55,col,.46);
  }
  return true
 }});
}
function coin(g,x,y,size,face){
 const w=p(Math.max(2,size*(.25+.75*Math.abs(Math.cos(face)))));
 block(g,x-w-2,y-size-2,(w+2)*2,(size+2)*2,colors.outline);
 block(g,x-w,y-size,w*2,size*2,colors.goldDark);
 block(g,x-w+2,y-size+1,Math.max(2,w*2-4),size*2-3,colors.golden);
 block(g,x-w+3,y-size+2,Math.max(1,w-1),3,colors.goldLit);
 if(w>=5){block(g,x-1,y-size*.4,2,size*.8,colors.goldDark)}
}
export function payday(l,h,extra){
 const e=l.escena,ang=Math.atan2(l.ay-l.y,l.ax-l.x),g=shape(e),trail=shape(e,1508);
 const ox=l.x+Math.cos(ang)*9,oy=l.y-l.alto*.55;
 const distance=Math.min(h.alcance??260,260);let age=0,hitCount=0;
 l.animar('Shoot',.4,.1);l.accion={hasta:l.t+.32,lento:.7,angulo:ang};
 return effect(e,{update(dt){
  age+=dt;const T=age/1.05;if(T>=1){fadeDestroy(g,[trail]);return false}
  g.clear();trail.clear();
  for(let i=0;i<5;i++){
   const t=clamp((T-i*.084)/.73);
   if(t<=0||t>=1)continue;
   const d=distance*ease(t),offset=(i-2)*8;
   const x=p(ox+Math.cos(ang)*d-Math.sin(ang)*offset),
         y=p(oy+Math.sin(ang)*d*.72+Math.cos(ang)*offset*.6-18*Math.sin(pi*t));
   coin(g,x,y,7,t*19+i);
   block(trail,x-4-Math.cos(ang)*10,y-1,4,3,colors.goldLit,.35);
   const target=l.rival;
   if(!(hitCount&(1<<i))&&target&&!target.ko&&
     Math.hypot(x-target.x,y-(target.y-target.alto*.5))<21){
    hitCount|=1<<i;contact(l,h,extra,target,.24,{push:10,stun:.02});
    flash(e,target.x,target.y-target.alto*.5,colors.golden,.55);
   }
  }
  return true
 }});
}
export const TORRE2_FORMS={
 torre2_bonemerang:bonemerang,torre2_boneclub:boneclub,
 torre2_triattack:triattack,torre2_payday:payday
};
