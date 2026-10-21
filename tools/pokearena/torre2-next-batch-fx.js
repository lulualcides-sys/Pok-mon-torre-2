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
function waveShape(g,points,color,alpha=1){
 g.fillStyle(color,alpha);
 g.fillPoints(points.map(([x,y])=>({x:rnd(x),y:rnd(y)})),true);
}
export function surf(l,h,extra){
 const e=l.escena,r=l.rival,ang=direct(l);
 const water=layer(e,1509),highlights=layer(e,1510),spray=layer(e,1511);
 const ox=l.x+Math.cos(ang)*11,oy=l.y-l.alto*.3,range=Math.min(265,h.alcance||255);
 let time=0,damaged=false,impactSplash=0;
 l.animar('Shoot',.65,.2);
 l.accion={hasta:l.t+.55,bloquea:true,lento:.34,angulo:ang};
 return running(e,dt=>{
  time+=dt;const t=time/1.14;
  if(t>1.17){water.destroy();highlights.destroy();spray.destroy();return false}
  const travel=ease(sat((t-.06)/.80));
  const x=ox+Math.cos(ang)*range*travel,y=oy+Math.sin(ang)*range*travel*.74;
  const opacity=sat(t*10)*sat((1.19-t)*6);
  const swell=Math.max(.35,Math.min(1,t*6));
  for(const g of [water,highlights,spray]){
   g.clear().setPosition(rnd(x),rnd(y)).setRotation(ang).setAlpha(opacity);
  }
  const s=swell,crest=Math.sin(time*13)*2;
  // A SINGLE continuous large body, inky silhouette and layered water.
  // All positions are local pixel coordinates, so the wave rotates with aim.
  waveShape(water,[[-99,-18*s],[-72,-34*s],[-37,-47*s],[-7,-49*s],
   [14,-46*s],[35,-33*s],[41,-23*s],[53,-21*s],[65,-9*s],
   [61,4*s],[43,16*s],[36,31*s],[8,47*s],[-28,48*s],
   [-74,30*s],[-100,18*s],[-71,13*s],[-41,7*s],[-32,-1*s],
   [-43,-9*s],[-73,-14*s]],0x0b2441);
  waveShape(water,[[-94,-15*s],[-66,-29*s],[-34,-42*s],[-4,-44*s],
   [17,-41*s],[34,-29*s],[38,-17*s],[51,-16*s],
   [57,-7*s],[53,3*s],[38,12*s],[32,28*s],[6,42*s],
   [-26,42*s],[-69,27*s],[-94,15*s],[-71,11*s],
   [-35,4*s],[-26,-2*s],[-43,-12*s]],0x175b8a);
  waveShape(water,[[-86,-11*s],[-64,-26*s],[-31,-39*s],[4,-39*s],
   [26,-31*s],[32,-22*s],[20,-11*s],[-4,-5*s],
   [-14,7*s],[20,16*s],[27,25*s],[7,38*s],
   [-26,37*s],[-68,23*s],[-84,12*s],[-49,7*s],
   [-30,-2*s],[-48,-11*s]],0x269bc3,.94);
  waveShape(highlights,[[-53,-30*s],[-33,-43*s],[-8,-46*s],
   [17,-43*s],[36,-34*s],[49,-32*s],[62,-20*s],
   [54,-9*s],[40,-7*s],[32,-16*s],[9,-21*s],
   [-8,-18*s],[-29,-24*s]],0xc7faff);
  waveShape(highlights,[[12,-27*s],[31,-30*s],[48,-22*s],
   [55,-9*s],[45,2*s],[31,8*s],[22,-1*s],[33,-12*s],
   [24,-18*s]],0x76d9ef);
  // Breaking front of Surf: foam, white spouts, water curls and droplets.
  const front=[[-49,-37],[-31,-42],[-7,-43],[14,-39],[35,-33],
   [48,-27],[57,-20],[59,-10],[52,2],[44,18],[27,33],
   [4,41],[-24,40],[-55,27]];
  for(let i=0;i<front.length;i++){
   const [px,py]=front[i],shake=Math.sin(time*18+i*2.1)*(i%3+1);
   draw(highlights,px+shake,py*s,5+(i%3)*2,3,0xf3feff,.95);
   if(i%2===0)draw(spray,px+8+Math.sin(time*16+i)*7,
     py*s-8-Math.sin(time*12+i)*7,3,3,0x9cecf5,.82);
  }
  for(let i=0;i<18;i++){
   const ripple=(time*39+i*11)%72;
   const py=-31*s+(i%9)*8*s;
   const px=-84+ripple*.95;
   draw(highlights,px,py+Math.sin(time*14+i)*3,4+(i%3)*2,
    2+(i%2),i%3?0x8be6f8:0xe0fbff,.67);
  }
  for(let i=0;i<12;i++){
   const px=-99-(i*8+time*35)%51,py=((i*29)%83-41)*s;
   draw(spray,px,py,2+i%3,2+i%2,i%3?0x64c9df:0xe5fbff,.45);
  }
  if(!damaged&&r&&!r.ko&&t>.08){
   const tx=r.x-x,ty=r.y-r.alto*.5-y;
   const ahead=tx*Math.cos(ang)+ty*Math.sin(ang);
   const side=-tx*Math.sin(ang)+ty*Math.cos(ang);
   if(Math.abs(ahead-39)<27&&Math.abs(side)<Math.max(29,48*s)){
    damaged=true;impactSplash=.27;
    if(hit(l,h,extra,r,1,88))sparkle(e,r.x,r.y-r.alto*.5,0x83e7fa,1.35);
   }
  }
  if(impactSplash>0){
   impactSplash-=dt;
   if(Math.random()<.5)vfx.rafaga(e,'gota',r.x,r.y-r.alto*.4,0xa2eaf7,2);
  }
  return true;
 },()=>{water.destroy();highlights.destroy();spray.destroy()});
}
function star(g,x,y,size=1,phase=0){
 // A proper FIVE-POINTED star, not a cross, yellow orb or thin spark.
 // Discrete pixel-rounded vertices with a dark outside contour.
 const outer=8.6*size,inner=3.35*size;
 const polygon=(R,r)=>Array.from({length:10},(_,i)=>{
  const a=-PI/2+i*PI/5;
  const radius=i%2?r:R;
  return{x:rnd(x+Math.cos(a)*radius),y:rnd(y+Math.sin(a)*radius)};
 });
 g.fillStyle(0x17182f,1);g.fillPoints(polygon(outer+2.1,inner+1.5),true);
 g.fillStyle(0xffd24d,1);g.fillPoints(polygon(outer,inner),true);
 g.fillStyle(0xfff1a3,1);g.fillPoints(polygon(outer*.68,inner*.69),true);
 draw(g,x-1*size,y-3*size,2*size,3*size,0xffffff);
 if(phase%2===0)draw(g,x+5*size,y-6*size,2,2,0xffffce,.7);
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
 // Dark, dense Ghost-type sphere, layered pixel rings and asymmetrical core.
 const pulse=Math.sin(t*18),R=15+pulse*1.5;
 const paintRing=(radius,color,offset=0)=>{
  for(let yy=-radius;yy<=radius;yy+=2){
   const widest=Math.sqrt(Math.max(0,radius*radius-yy*yy));
   const turbulent=Math.sin(t*22+yy*1.1+offset)*1.8;
   const width=Math.max(1,Math.floor(widest+turbulent));
   draw(g,x-width,y+yy,2*width,2,color,.98);
  }
 };
 paintRing(R+3,0x080c19);
 paintRing(R,0x291a42,1.4);
 paintRing(R-3,0x533075,2.2);
 paintRing(R-6,0x2a184b,3.1);
 paintRing(R-9,0x140c2c);
 // Dark animated spiral should stay darker than the aura.
 const swirl=t*7;
 for(let i=0;i<11;i++){
  const angle=swirl+i*.59,rr=3+(i*1.7)%11;
  draw(g,x+Math.cos(angle)*rr,y+Math.sin(angle)*rr,
   i%3?3:5,i%2?2:4,i%3?0x0d0b25:0x8154a8,.7);
 }
 draw(g,x-7,y-10,5,3,0xa68cce,.83);
 draw(g,x+6,y+5,5,3,0x0b0a1e,.95);
}
export function shadowball(l,h,extra){
 const e=l.escena,g=layer(e,1511),aura=layer(e,1509),trail=layer(e,1508),r=l.rival;
 const ox=l.x+9,oy=l.y-l.alto*.55,ang=direct(l);
 let t=0,landed=false,explode=0,ix=0,iy=0;
 l.animar('Charge',.61,.16);
 l.accion={hasta:l.t+.32,bloquea:true,lento:.43,angulo:ang};
 return running(e,dt=>{
  t+=dt;
  if(t>1.37){g.destroy();aura.destroy();trail.destroy();return false}
  g.clear();aura.clear();trail.clear();
  if(explode>0){
   explode=Math.max(0,explode-dt);
   const u=1-explode/.39,rad=7+44*u;
   aura.lineStyle(7,0x0e0a23,1-u);aura.strokeCircle(ix,iy,rad+6);
   aura.lineStyle(3,0x573181,.92*(1-u));aura.strokeCircle(ix,iy,rad);
   aura.lineStyle(2,0x986cbd,.85*(1-u));aura.strokeCircle(ix,iy,rad*.73);
   for(let i=0;i<23;i++){
    const th=i*2.4+t*4+Math.sin(i*8)*.3;
    const rr=rad*(.42+(i%5)*.13);
    const xx=ix+Math.cos(th)*rr,yy=iy+Math.sin(th)*rr*.8;
    draw(g,xx,yy,3+(i%3)*2,3+(i%2)*2,
     i%4===0?0x0b081e:i%2?0x4a276e:0x7b56a6,1-u);
   }
   return true;
  }
  const flight=ease(sat((t-.07)/.72));
  const range=Math.min(h.alcance||245,260);
  const x=ox+Math.cos(ang)*range*flight,y=oy+Math.sin(ang)*range*flight*.73-3*Math.sin(t*15);
  const lateral={x:-Math.sin(ang),y:Math.cos(ang)};
  for(let i=1;i<=11;i++){
   const off=i*10+(t*24)%14,d=t-i*.024;
   const wobble=Math.sin(t*20+i*2.7)*9;
   draw(trail,x-Math.cos(ang)*off+lateral.x*wobble,
    y-Math.sin(ang)*off*.75+lateral.y*wobble*.6,4+i%4,4+i%3,
    i%4===0?0x090e21:i%2?0x39235c:0x683d8c,.62*(1-i/13));
  }
  for(let i=0;i<26;i++){
   const theta=(i*2.4+t*(i%2?10:-9)),rad=18+(i*11)%19;
   const px=x+Math.cos(theta)*rad,py=y+Math.sin(theta)*rad*.8;
   draw(aura,px,py,2+(i%3),2+(i%3),
    i%4===0?0x090d1d:i%2?0x9864bb:0x442268,.55+.3*(i%3)/3);
  }
  aura.lineStyle(2,0x130e27,.75);
  aura.strokeCircle(x,y,19+Math.sin(t*15)*3);
  orb(g,x,y,t);
  if(!landed&&r&&!r.ko&&Math.hypot(x-r.x,y-(r.y-r.alto*.5))<27){
   landed=true;explode=.39;ix=x;iy=y;
   if(hit(l,h,extra,r,1,65)){
    sparkle(e,r.x,r.y-r.alto*.5,0x6b3f96,1.35);
    if(Math.random()<.2)r.ponerEstado('lento',2,{f:.15});
   }
  }
  return true;
 },()=>{g.destroy();aura.destroy();trail.destroy()});
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
   // Never draw future hearts at f=0: the old code stacked six shapes
   // over frame one and looked like one broken heart.
   const delay=.12+i*.11;
   if(t<delay+.025)continue;
   const f=sat((t-delay)/.66);
   if(f>=1)continue;
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
