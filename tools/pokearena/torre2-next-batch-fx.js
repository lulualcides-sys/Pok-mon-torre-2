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
 const water=layer(e,1509),foam=layer(e,1511),wake=layer(e,1508);
 const ox=l.x+Math.cos(ang)*10,oy=l.y-l.alto*.34;
 const range=Math.min(h.alcance||255,265);
 let t=0,landed=false,impactTime=0,disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;water.destroy();foam.destroy();wake.destroy()};
 l.animar('Shoot',.58,.18);
 l.accion={hasta:l.t+.47,bloquea:true,lento:.42,angulo:ang};
 return running(e,dt=>{
  t+=dt;
  if(t>1.02){dispose();return false}
  const phase=sat((t-.055)/.76),travel=ease(phase);
  const cx=ox+Math.cos(ang)*range*travel,cy=oy+Math.sin(ang)*range*travel*.77;
  const height=.6+.4*Math.sin(Math.min(1,phase)*PI);
  const alpha=sat(t*12)*sat((1.03-t)*8);
  for(const g of [water,foam,wake])g.clear().setPosition(rnd(cx),rnd(cy)).setRotation(ang).setAlpha(alpha);
  // An OPEN rolling breaker instead of straight bars or a solid kite.
  // Staggered water tongues carve visible gaps behind a curved, foaming crest.
  for(let k=-5;k<=5;k++){
   const row=k*8.7*height;
   const swell=3*Math.sin(k*.94+t*11);
   const front=52-4.2*Math.abs(k)+swell;
   const back=-54-(k%3)*7+5*Math.sin(k*.83+t*18);
   const thick=5+((k+7)%3)*1.4;
   const bend=3*Math.sin(k*.76+t*15);
   water.fillStyle(0x112a48,.86);
   water.fillPoints([
    {x:rnd(back-3),y:rnd(row-thick/2-2)},
    {x:rnd(back+20),y:rnd(row-thick/2-4+bend)},
    {x:rnd(front-22),y:rnd(row-thick/2-3-bend)},
    {x:rnd(front+1),y:rnd(row-3)},
    {x:rnd(front+1),y:rnd(row+3)},
    {x:rnd(front-23),y:rnd(row+thick/2+2+bend)},
    {x:rnd(back+13),y:rnd(row+thick/2-1)},
    {x:rnd(back-3),y:rnd(row+thick/2+1)}
   ],true);
   water.lineStyle(thick,k%3===0?0x2a8fae:k%2===0?0x269dbc:0x206f94,.86);
   water.beginPath();water.moveTo(rnd(back),rnd(row));
   water.lineTo(rnd(back+22),rnd(row+bend));
   water.lineTo(rnd(front-11),rnd(row-bend));
   water.strokePath();
   draw(wake,back+11+(t*43)%13,row+thick/2,12,2,0x4bc3dc,.55);
   draw(foam,front-10,row-5-bend,9,3,0x91e8f0,.88);
   draw(foam,front-2,row-5-bend,5,3,0xe9fdff,.94);
   if(k%2===0)draw(foam,front+5,row-12+Math.sin(t*12+k)*4,3,3,0xf6ffff,.8);
  }
  const crestPts=[
   [-21,-48],[2,-47],[25,-39],[42,-27],[52,-14],[58,0],
   [52,14],[42,27],[25,39],[2,47],[-21,48]
  ].map(([x,y],i)=>({x:rnd(x+Math.sin(t*13+i*.8)*2),
     y:rnd(y*height)}));
  water.lineStyle(11,0x0b2e50,.88);water.strokePoints(crestPts,false);
  foam.lineStyle(6,0x2da8cf,.94);foam.strokePoints(crestPts,false);
  foam.lineStyle(3,0xd6fbff,.95);foam.strokePoints(crestPts,false);
  // White pixel crests break away at intervals instead of one uniform stripe.
  for(let i=0;i<crestPts.length;i+=2){
   const p=crestPts[i];
   draw(foam,p.x+3,p.y-4,5,3,0xffffff,.85);
   draw(foam,p.x+7+Math.sin(t*18+i)*4,p.y-8,3,2,0xc2f5fc,.68);
  }
  // Curved rolling crest above the ribbon field: multiple white curls and
  // turquoise droplets, never one giant flat translucent polygon.
  for(let k=0;k<8;k++){
   const by=(-43+k*12)*height;
   const xx=39+8*Math.sin(k*.63+t*8);
   draw(foam,xx,by-5,7,3,0xc7faff,.88);
   draw(foam,xx+4,by-8-Math.sin(k+t*13)*3,4,2,0xffffff,.9);
   if(k%2===0){
    draw(foam,xx+11+(k*3+t*24)%13,by-12,2,3,0xd9faff,.8);
    draw(wake,-66+(k*13+t*34)%25,by+4,8,2,0x5dbbd7,.5);
   }
  }
  for(let i=0;i<15;i++){
   const px=-76+(i*17+t*37)%61;
   const py=(-43+(i*31)%88)*height;
   draw(wake,px,py,3+(i%4),1+(i%2),i%3?0x6bc7da:0xb4eff7,.45);
  }
  if(!landed&&r&&!r.ko&&phase>.06){
   const dx=r.x-cx,dy=r.y-r.alto*.5-cy;
   const ahead=dx*Math.cos(ang)+dy*Math.sin(ang);
   const aside=-dx*Math.sin(ang)+dy*Math.cos(ang);
   if(Math.abs(ahead-35)<24&&Math.abs(aside)<Math.max(26,46*height)){
    landed=true;
    if(hit(l,h,extra,r,1,88)){
     impactTime=.22;
     sparkle(e,r.x,r.y-r.alto*.5,0x92e9f5,1.25);
    }
   }
  }
  if(impactTime>0){
   impactTime-=dt;
   // Splash only after confirmed damage/contact.
   if(Math.random()<.32)vfx.rafaga(e,'gota',rnd(r.x),rnd(r.y-r.alto*.5),0xc8faff,2);
  }
  return true
 },dispose);
}
function star(g,x,y,phase=0){
 // Tiny recognizable five-point stars, 9 pixel-wide, no glowing yellow orbs.
 // Phaser Graphics uses integer coordinates for a crisp pixel silhouette.
 const poly=(outer,inner)=>Array.from({length:10},(_,i)=>{
  const a=-PI/2+i*PI/5,r=i%2?inner:outer;
  return{x:rnd(x+Math.cos(a)*r),y:rnd(y+Math.sin(a)*r)};
 });
 g.fillStyle(0x2e2943,1);g.fillPoints(poly(5.4,2.55),true);
 g.fillStyle(0xf5ce55,1);g.fillPoints(poly(4.3,2.0),true);
 draw(g,x-1,y-2,2,2,0xfff5c1,.8);
 if(phase%3===0)draw(g,x+3,y-3,1,1,0xffffff,.65);
}
export function swift(l,h,extra){
 const e=l.escena,g=layer(e,1510),tail=layer(e,1509),r=l.rival;
 let age=0,hitDone=false;
 const ox=l.x,oy=l.y-l.alto*.53,ang=direct(l);
 const stars=Array.from({length:5},(_,i)=>({
  delay:i*.073,skew:(i-2)*8,seed:i*1.17
 }));
 l.animar('Shoot',.53,.11);l.accion={hasta:l.t+.23,lento:.64,angulo:ang};
 return running(e,dt=>{
  age+=dt;g.clear();tail.clear();
  for(let i=0;i<stars.length;i++){
   const q=stars[i],t=(age-q.delay)/.63;
   if(t<0||t>=1)continue;
   const target=targetAt(r)||{x:ox+Math.cos(ang)*220,y:oy+Math.sin(ang)*160};
   const f=ease(t),nx=-Math.sin(ang),ny=Math.cos(ang);
   const side=q.skew*Math.sin(PI*f)*.7;
   const x=lerp(ox,target.x,f)+nx*side;
   const y=lerp(oy,target.y,f)+ny*side*.75-9*Math.sin(PI*f);
   star(g,x,y,Math.floor(age*16+q.seed));
   for(let n=1;n<=2;n++){
    const older=ease(sat(t-n*.041));
    draw(tail,lerp(ox,target.x,older)+nx*side*.65,
     lerp(oy,target.y,older)+ny*side*.5,2,2,0xdab857,.38-n*.09);
   }
   if(!hitDone&&r&&!r.ko&&t>.86){
    hitDone=true;
    if(hit(l,h,extra,r,1,34))sparkle(e,r.x,r.y-r.alto*.5,0xf5d876,.65);
   }
  }
  if(age>.96){g.destroy();tail.destroy();return false}
  return true
 },()=>{g.destroy();tail.destroy()});
}
function orb(g,x,y,t){
 // Compact Ghost-type mass: deep violet center and uneven dark outline.
 const r=11+Math.sin(t*17)*1;
 for(let yy=-r;yy<=r;yy+=2){
  const span=Math.sqrt(Math.max(0,r*r-yy*yy)),w=Math.max(1,Math.floor(span));
  draw(g,x-w-2,y+yy-1,2*w+4,3,0x090b1d);
  draw(g,x-w,y+yy,2*w,2,yy%4?0x39204e:0x512c69);
 }
 draw(g,x-6,y-5,5,2,0x8760ad,.7);
 draw(g,x+2,y+4,4,2,0x150d2e,.9);
}
export function shadowball(l,h,extra){
 const e=l.escena,g=layer(e,1511),aura=layer(e,1509),trail=layer(e,1508);
 const r=l.rival,ang=direct(l);
 const ox=l.x+9,oy=l.y-l.alto*.53,range=Math.min(h.alcance||245,255);
 let age=0,burstRemaining=0,impactX=0,impactY=0,disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;g.destroy();aura.destroy();trail.destroy()};
 l.animar('Charge',.59,.15);
 l.accion={hasta:l.t+.29,bloquea:true,lento:.48,angulo:ang};
 return running(e,dt=>{
  age+=dt;
  g.clear();aura.clear();trail.clear();
  if(burstRemaining>0){
   burstRemaining=Math.max(0,burstRemaining-dt);
   if(burstRemaining<=0){dispose();return false}
   const phase=1-burstRemaining/.22,rad=5+27*phase,opacity=1-phase;
   aura.lineStyle(4,0x160d30,opacity);aura.strokeCircle(impactX,impactY,rad+3);
   aura.lineStyle(2,0x8052ab,opacity*.9);aura.strokeCircle(impactX,impactY,rad*.84);
   for(let i=0;i<11;i++){
    const th=i*2*PI/11+age*6;
    draw(g,impactX+Math.cos(th)*rad,impactY+Math.sin(th)*rad,
     2+i%3,2+i%2,i%2?0x412259:0x9165af,opacity*.86);
   }
   return true;
  }
  const flight=ease(sat((age-.08)/.68));
  // Missed projectile expires with no impact rings and no lingering FX.
  if(flight>=1||age>.84||!r||r.ko){dispose();return false}
  const x=ox+Math.cos(ang)*range*flight,y=oy+Math.sin(ang)*range*flight*.75;
  for(let i=0;i<12;i++){
   const th=age*12+i*2.399,radius=13+(i*7)%9;
   draw(aura,x+Math.cos(th)*radius,y+Math.sin(th)*radius*.8,
    2+i%2,2+i%2,i%3===0?0x170e32:0x744c95,.38+.2*(i%2));
  }
  for(let i=1;i<7;i++){
   const dist=i*9,drift=Math.sin(age*18+i*2.1)*4;
   draw(trail,x-Math.cos(ang)*dist-Math.sin(ang)*drift,
    y-Math.sin(ang)*dist*.75+Math.cos(ang)*drift,
    3,2,i%2?0x2d1c48:0x5e387e,.35*(1-i/8));
  }
  orb(g,x,y,age);
  if(Math.hypot(x-r.x,y-(r.y-r.alto*.5))<22){
   // The prior code started an explosion BEFORE knowing if the defender
   // actually took the hit. A blocked/missed ball must simply disappear.
   if(!hit(l,h,extra,r,1,57)){dispose();return false}
   impactX=x;impactY=y;burstRemaining=.22;
   sparkle(e,r.x,r.y-r.alto*.5,0x78519f,.8);
   if(Math.random()<.2)r.ponerEstado('lento',2,{f:.15});
  }
  return true
 },dispose);
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
function heart(g,x,y){
 // One small 9x8 pixel heart with a dark border and a separate highlight.
 const pattern=[
  "..xx.xx..",
  ".xppxppx.",
  "xpppppppx",
  "xpppppppx",
  ".xpppppx.",
  "..xpppx..",
  "...xpx...",
  "....x...."
 ];
 for(let j=0;j<pattern.length;j++)
  for(let i=0;i<pattern[j].length;i++){
   const c=pattern[j][i];
   if(c==='x')draw(g,x+i-4,y+j-4,1,1,0x4b193d);
   else if(c==='p')draw(g,x+i-4,y+j-4,1,1,
    j<3?0xffb1d2:0xe77caf);
  }
}
export function lovelykiss(l,h,extra){
 const e=l.escena,g=layer(e,1510),trail=layer(e,1509),r=l.rival;
 let age=0,statusApplied=false;
 const start={x:l.x+11,y:l.y-l.alto*.55},ang=direct(l);
 l.animar('Shoot',.62,.14);
 l.accion={hasta:l.t+.31,angulo:ang,lento:.7};
 return running(e,dt=>{
  age+=dt;g.clear();trail.clear();
  if(age>1.12){g.destroy();trail.destroy();return false}
  const target=targetAt(r)||{x:start.x+Math.cos(ang)*190,y:start.y+Math.sin(ang)*110};
  const t=ease(sat((age-.14)/.66));
  const x=lerp(start.x,target.x,t),y=lerp(start.y,target.y,t)-8*Math.sin(t*PI);
  // Only release the kiss AFTER the initial charge; no malformed heart at origin.
  if(age>.14&&t>.07&&t<1)lips(g,x,y,1);
  for(let i=0;i<4;i++){
   const delay=.28+i*.12;
   if(age<=delay+.035)continue;
   const f=sat((age-delay)/.54);
   if(f<.11||f>=.91)continue;
   const pt=sat(t-.18-i*.095);
   if(pt<.12)continue;
   const hx=lerp(start.x,target.x,pt)+Math.sin(i*2.4+age*7)*4;
   const hy=lerp(start.y,target.y,pt)-12*Math.sin(PI*pt)-5;
   if(Math.hypot(hx-start.x,hy-start.y)<20)continue;
   heart(trail,hx,hy);
  }
  if(!statusApplied&&t>.97&&r&&!r.ko){
   statusApplied=true;
   if(Math.random()<.75){
    r.ponerEstado('aturdido',2.4,{fuente:l});
    vfx.textoFlotante(e,r.x,r.y-r.alto-11,'Zzz…',{color:'#f8a1d2',dur:1100});
    sparkle(e,r.x,r.y-r.alto*.5,0xffa4d7,.65);
   }else vfx.textoFlotante(e,r.x,r.y-r.alto-10,'MISS',{color:'#ffbfdd',dur:600});
  }
  return true
 },()=>{g.destroy();trail.destroy()});
}
export const TORRE2_NEW_FORMS={
 torre2_surf:surf,torre2_swift:swift,torre2_shadowball:shadowball,
 torre2_lovelykiss:lovelykiss
};
