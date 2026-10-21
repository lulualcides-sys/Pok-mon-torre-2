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
 // Same deliberately scattered fan as the approved Pay Day, with STARS.
 // Seven independently aimed rays, staggered launches and real swept
 // collision: no homing, auto-hit or full damage when the target dodges.
 const e=l.escena,g=layer(e,1510),trail=layer(e,1509),r=l.rival;
 const ang=direct(l),speed=355,reach=Math.min(h.alcance||250,270);
 const origin={x:l.x+Math.cos(ang)*9,y:l.y-l.alto*.52};
 const spread=[-.29,.18,-.115,.055,.30,-.18,0];
 const heights=[-8,5,-4,8,-6,3,0];
 const stars=spread.map((offset,i)=>({
  delay:i*.067,angle:ang+offset,skew:heights[i],
  position:null,done:false,impact:false
 }));
 let age=0,disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;g.destroy();trail.destroy()};
 l.animar('Shoot',.52,.12);
 l.accion={hasta:l.t+.29,lento:.62,angulo:ang};
 return running(e,dt=>{
  age+=dt;g.clear();trail.clear();
  for(let i=0;i<stars.length;i++){
   const q=stars[i];
   if(q.done||age<q.delay)continue;
   const elapsed=age-q.delay,travel=Math.min(speed*elapsed,reach);
   // The small perpendicular displacement creates the Pay Day-like spray.
   // The star's ballistic path is locked at launch, NOT recalculated from r.
   const sway=q.skew*Math.min(1,travel/90);
   const nx=-Math.sin(ang),ny=Math.cos(ang);
   const x=origin.x+Math.cos(q.angle)*travel+nx*sway;
   const y=origin.y+Math.sin(q.angle)*travel*.76+ny*sway*.8;
   const previous=q.position||{x:origin.x,y:origin.y};
   q.position={x,y};
   if(r&&!r.ko){
    const center={x:r.x,y:r.y-r.alto*.5};
    const dx=x-previous.x,dy=y-previous.y;
    const div=dx*dx+dy*dy||1;
    const along=sat(((center.x-previous.x)*dx+(center.y-previous.y)*dy)/div);
    const cx=previous.x+dx*along,cy=previous.y+dy*along;
    const radius=Math.max(11,Math.min(18,(r.alto||30)*.4));
    if(Math.hypot(cx-center.x,cy-center.y)<=radius){
     q.done=true;
     q.impact=hit(l,h,extra,r,.16,8); // Seven hits ~= old 5-hit total.
     if(q.impact)sparkle(e,cx,cy,0xffd979,.42);
     continue;
    }
   }
   if(travel>=reach){q.done=true;continue}
   star(g,x,y,Math.floor(elapsed*13+i));
   draw(trail,x-Math.cos(q.angle)*7,y-Math.sin(q.angle)*5,2,2,
    0xbe983a,.36);
  }
  if(stars.every(q=>q.done)||age>1.4){dispose();return false}
  return true;
 },dispose);
}
function orb(g,x,y,t){
 // A shadow-energy knot with uneven inked edges and a dark purple spiral.
 // Deliberately not a simple purple ball or a translucent circular PNG.
 const phase=t*17,R=11+Math.sin(phase)*1.2;
 const contour=Array.from({length:13},(_,i)=>{
  const a=i*2*PI/13,rough=(i%3===0?2:i%4===0?-1:0);
  const rad=R+rough+Math.sin(phase+i*2.7)*1.3;
  return {x:rnd(x+Math.cos(a)*rad),y:rnd(y+Math.sin(a)*rad)};
 });
 g.fillStyle(0x070919,1);g.fillPoints(contour,true);
 const interior=contour.map(p=>({x:rnd(x+(p.x-x)*.81),y:rnd(y+(p.y-y)*.81)}));
 g.fillStyle(0x332048,1);g.fillPoints(interior,true);
 // Rotating claw-shaped slashes instead of bright rings.
 const a=phase*.5;
 for(let i=0;i<7;i++){
  const theta=a+i*.71,radius=4+i*.76;
  const px=x+Math.cos(theta)*radius,py=y+Math.sin(theta)*radius;
  draw(g,px-1,py-1,i%3?3:4,2,
   i%3===0?0x76508c:i%2?0x180d31:0x58356d,.92);
 }
 draw(g,x-4,y-6,3,2,0xa083b8,.78);
 draw(g,x+3,y+4,3,2,0x080b19,1);
}
export function shadowball(l,h,extra){
 const e=l.escena,g=layer(e,1511),aura=layer(e,1509),trail=layer(e,1508);
 const r=l.rival,ang=direct(l);
 const ox=l.x+Math.cos(ang)*9,oy=l.y-l.alto*.54;
 const range=Math.min(h.alcance||245,255),speed=285;
 let age=0,burst=0,impactX=0,impactY=0,disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;g.destroy();aura.destroy();trail.destroy()};
 l.animar('Charge',.61,.16);
 l.accion={hasta:l.t+.32,bloquea:true,lento:.43,angulo:ang};
 return running(e,dt=>{
  age+=dt;g.clear();aura.clear();trail.clear();
  if(burst>0){
   burst=Math.max(0,burst-dt);
   if(burst===0){dispose();return false}
   // A fast *collapsing* spectral burst. No lingering purple ring.
   const f=1-burst/.16,opacity=(1-f),radius=7+12*f;
   for(let i=0;i<8;i++){
    const a=i*2*PI/8+.4,rr=radius+(i%3)*3;
    const px=impactX+Math.cos(a)*rr,py=impactY+Math.sin(a)*rr;
    draw(g,px-3,py-2,3+i%2,3,
     i%3===0?0x0a0719:i%2?0x493063:0x8d69a4,opacity);
   }
   return true;
  }
  const travel=Math.max(0,age-.085)*speed;
  if(travel>=range||age>1.04||!r||r.ko){dispose();return false}
  const x=ox+Math.cos(ang)*travel,y=oy+Math.sin(ang)*travel*.76;
  // Only four short dark smoke wisps. The compact orb remains the main shape.
  for(let i=0;i<5;i++){
   const theta=age*13+i*2.5,rad=14+(i%2)*4;
   draw(aura,x+Math.cos(theta)*rad,y+Math.sin(theta)*rad*.7,
    2+i%2,2, i%2?0x201336:0x725089,.58);
  }
  for(let i=1;i<5;i++){
   const d=i*7;
   const px=x-Math.cos(ang)*d,py=y-Math.sin(ang)*d*.75;
   draw(trail,px,py,3,2,i%2?0x271939:0x4e315f,.44-i*.07);
  }
  orb(g,x,y,age);
  const center=targetAt(r);
  if(center&&Math.hypot(x-center.x,y-center.y)<22){
   // Deal damage first; a shield/invalid target cannot generate a hit VFX.
   if(!hit(l,h,extra,r,1,55)){dispose();return false}
   impactX=center.x;impactY=center.y;burst=.16;
   sparkle(e,center.x,center.y,0x684084,.67);
   if(Math.random()<.2)r.ponerEstado('lento',2,{f:.15});
  }
  return true;
 },dispose);
}
function lips(g,x,y){
 // Single compact pixel-art kiss, not a large decorative pink disk.
 const rows=["..pp..pp..",".pLLppLLp.","pLLLLLLLLp",".pLLLLLLp.","..pLLLLp..","...pppp..."];
 for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
  const c=rows[j][i];
  if(c==='p')draw(g,x+i-5,y+j-3,1,1,0x451b37);
  if(c==='L')draw(g,x+i-5,y+j-3,1,1,j<3?0xf7a4cb:0xd867a4);
 }
 draw(g,x-2,y+1,5,1,0x632143);
}
function heart(g,x,y){
 const pixels=[
  ".pp.pp.",
  "pPPpPPp",
  "pPPPPpp",
  ".pPPPP.",
  "..pPP..",
  "...p..."
 ];
 for(let yy=0;yy<pixels.length;yy++)for(let xx=0;xx<pixels[yy].length;xx++){
  const c=pixels[yy][xx];
  if(c==='p')draw(g,x+xx-3,y+yy-3,1,1,0x5c2147);
  else if(c==='P')draw(g,x+xx-3,y+yy-3,1,1,yy<3?0xffaed4:0xda72aa);
 }
}
export function lovelykiss(l,h,extra){
 const e=l.escena,g=layer(e,1510),trail=layer(e,1509),r=l.rival;
 let age=0,applied=false,disposed=false;
 const start={x:l.x+11,y:l.y-l.alto*.55};
 const angle=direct(l),distance=Math.min(h.alcance||225,230);
 const dispose=()=>{if(disposed)return;disposed=true;g.destroy();trail.destroy()};
 l.animar('Shoot',.58,.12);l.accion={hasta:l.t+.27,angulo:angle,lento:.68};
 return running(e,dt=>{
  age+=dt;g.clear();trail.clear();
  if(age>.96){dispose();return false}
  const progress=ease(sat((age-.13)/.65));
  const travelled=distance*progress;
  const x=start.x+Math.cos(angle)*travelled;
  const y=start.y+Math.sin(angle)*travelled*.75-5*Math.sin(progress*PI);
  if(age>.15&&progress>.045&&progress<1)lips(g,x,y);
  // Exactly three very small hearts. Each one is emitted only after the
  // leading kiss has moved at least 35 pixels away from its caster.
  for(let i=0;i<3;i++){
   const emittedAt=.30+i*.115;
   const life=age-emittedAt;
   if(life<0||life>.32)continue;
   const behind=distance*ease(sat((emittedAt-.13)/.65))-12;
   if(behind<35)continue;
   const slide=life*53;
   const dist=behind+slide;
   const hx=start.x+Math.cos(angle)*dist-Math.sin(angle)*(i-1)*5;
   const hy=start.y+Math.sin(angle)*dist*.75+Math.cos(angle)*(i-1)*4-3-life*8;
   heart(trail,hx,hy);
  }
  if(!applied&&progress>.96&&r&&!r.ko){
   applied=true;
   const center=targetAt(r);
   const touches=center&&Math.hypot(x-center.x,y-center.y)<Math.max(20,r.alto*.5);
   if(touches&&Math.random()<.75){
    r.ponerEstado('aturdido',2.4,{fuente:l});
    vfx.textoFlotante(e,r.x,r.y-r.alto-11,'Zzz…',{color:'#f8a1d2',dur:850});
    sparkle(e,r.x,r.y-r.alto*.5,0xfa8fc2,.55);
   }else if(touches){
    vfx.textoFlotante(e,r.x,r.y-r.alto-10,'MISS',{color:'#ffbfdd',dur:570});
   }
  }
  return true;
 },dispose);
}
export const TORRE2_NEW_FORMS={
 torre2_swift:swift,torre2_shadowball:shadowball,
 torre2_lovelykiss:lovelykiss
};
