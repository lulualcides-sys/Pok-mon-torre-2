/* Pokémon Torre 2 — new original effects ONLY when missing from the captured Arena client.
 * Phaser 3 Graphics/WebGL, time-based frame updates, no static attack PNG,
 * no Canvas2D and no edits to the already-approved Arena attacks.
 */
import * as vfx from '../vfx.js';
const PI=Math.PI;
const sat=x=>Math.max(0,Math.min(1,x));
const px=n=>Math.round(n);
const block=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(px(x),px(y),Math.max(1,px(w)),Math.max(1,px(h)))};
function begin(l,animation='Shoot',time=.5){
 const e=l.escena;
 l.animar(animation,time,.15);
 l.accion={hasta:l.t+time*.64,lento:.58,angulo:Math.atan2(l.ay-l.y,l.ax-l.x)};
 return e;
}
function layers(e){return [e.add.graphics().setDepth(1511),e.add.graphics().setDepth(1509)]}
function register(e,update,cleanup){
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;cleanup()};
 const fx={update(dt){if(!update(Math.min(.06,Math.max(0,dt)))){dispose();return false}return true},destroy:dispose};
 e.efectos.push(fx);return fx;
}
function center(r){return{x:r.x,y:r.y-(r.alto||36)*.5}}
function pathHit(from,to,r){
 if(!r||r.ko)return null;
 const t=center(r),dx=to.x-from.x,dy=to.y-from.y;
 const u=sat(((t.x-from.x)*dx+(t.y-from.y)*dy)/(dx*dx+dy*dy||1));
 const x=from.x+u*dx,y=from.y+u*dy;
 return Math.hypot(x-t.x,y-t.y)<=Math.max(12,Math.min(20,(r.alto||36)*.43))?{x,y}:null;
}
function strike(l,h,extra,r,mult=.5){
 if(!r||r.ko)return false;
 const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1;
 return r.recibir(l,{dano:(h.dano??10)*mult,tipo:h.tipo||'NORMAL',
  dirX:dx/d,dirY:dy/d,empuje:22,surge:extra?.surge,slot:extra?.slot})==='golpe';
}
function impact(e,x,y,color){vfx.impacto(e,px(x),px(y),color,.48)}
function iceShard(g,x,y,size=1,tilt=0){
 const q=(dx,dy,w,h,c)=>block(g,x+dx*size,y+dy*size,w*size,h*size,c);
 // A staggered six-point icicle, not a recolored generic projectile.
 q(-2,-8+tilt,5,4,0x102e49);q(-4,-4+tilt,9,9,0x102e49);
 q(-2,5+tilt,5,4,0x102e49);
 q(-1,-7+tilt,3,4,0xd4f9ff);q(-3,-3+tilt,7,7,0x69bde8);
 q(-1,-1+tilt,3,6,0xd7faff);q(2,0+tilt,2,3,0x3a86b6);
}
function iceSphere(g,x,y,t){
 // Aura Sphere-style traveling energy mass rebuilt as angular ice pixel art.
 // Dark outline, blue faceted core and four distinct rotating icy projections.
 const wob=Math.sin(t*16)*1.3;
 block(g,x-8,y-10+wob,16,21,0x102336);
 block(g,x-11,y-6+wob,22,13,0x102336);
 block(g,x-6,y-12+wob,12,25,0x102336);
 block(g,x-8,y-7+wob,16,15,0x317da9);
 block(g,x-6,y-9+wob,12,19,0x67c1ee);
 block(g,x-4,y-7+wob,7,11,0xc5f3ff);
 block(g,x-3,y-4+wob,4,7,0xf2ffff);
 block(g,x+4,y+1+wob,4,5,0x2677ae);
 for(let i=0;i<4;i++){
  const a=t*9+i*PI/2;
  const sx=x+Math.cos(a)*14,sy=y+Math.sin(a)*12;
  iceShard(g,sx,sy,.43,i%2);
 }
}
export function icebeam(l,h,extra){
 const e=begin(l,'Charge',.54),[g,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x),ux=Math.cos(ang),uy=Math.sin(ang)*.76;
 const ox=l.x+ux*12,oy=l.y-(l.alto||36)*.52;
 const reach=Math.min(h.alcance??260,285),speed=320;
 let age=0,previous={x:ox,y:oy},burst=0,impactPoint=null,finished=false;
 return register(e,dt=>{
  age+=dt;g.clear();trail.clear();
  if(burst>0){
   burst-=dt;
   const fade=sat(burst/.18),radius=5+(.18-burst)*85;
   for(let k=0;k<8;k++){
    const a=k*PI/4+age*2;
    iceShard(g,impactPoint.x+Math.cos(a)*radius,
     impactPoint.y+Math.sin(a)*radius,.48+fade*.25,k%2);
   }
   return burst>0;
  }
  const distance=Math.min(reach,Math.max(0,age-.11)*speed);
  const tip={x:ox+ux*distance,y:oy+uy*distance};
  if(age<=.11){
   // Ice gathers at the muzzle during a real wind-up.
   for(let k=0;k<3;k++){
    const a=k*PI*2/3+age*9;
    iceShard(g,ox+Math.cos(a)*8,oy+Math.sin(a)*7,.4);
   }
  }else{
   iceSphere(g,tip.x,tip.y,age);
   for(let k=1;k<=6;k++){
    const d=distance-k*12;
    if(d<=0)continue;
    const x=ox+ux*d-Math.sin(ang)*Math.sin(age*19+k*2.3)*(4+k);
    const y=oy+uy*d+Math.cos(ang)*Math.cos(age*15+k*1.7)*(3+k);
    iceShard(trail,x,y,Math.max(.25,.56-k*.045),k%2);
    block(trail,x+2,y-7,2,2,0xe7fbff,.5);
   }
   const collision=distance>8?pathHit(previous,tip,r):null;
   if(collision){
    finished=true;
    if(strike(l,h,extra,r,1)){
     impactPoint=collision;burst=.18;
     impact(e,collision.x,collision.y,0x91dfff);
     if(Math.random()<.10&&!r.tipos?.includes('ICE')&&typeof r.escarchar==='function')
      r.escarchar('torre2-icebeam-'+Math.round(l.t*1000));
    }
   }
  }
  previous=tip;
  if(finished)return burst>0;
  return distance<reach&&age<1.14;
 },()=>{g.destroy();trail.destroy()});
}
function rock(g,x,y,index,angle){
 // Seven different rough polygon silhouettes with ink outlines,
 // faceted material and cracks. No colored circles and no CSS sprites.
 const shapes=[
  [[-8,-3],[-5,-9],[2,-9],[9,-4],[8,5],[1,9],[-7,5]],
  [[-9,-1],[-6,-7],[3,-10],[9,-5],[7,7],[-1,8],[-8,5]],
  [[-7,-8],[4,-9],[10,-2],[7,6],[-3,9],[-10,3]],
  [[-10,-3],[-5,-8],[5,-7],[9,1],[4,9],[-7,8]],
  [[-7,-7],[1,-10],[9,-3],[8,7],[0,9],[-9,5]],
  [[-10,0],[-4,-9],[5,-8],[10,2],[4,7],[-5,9]],
  [[-8,-5],[0,-10],[8,-6],[10,4],[3,9],[-6,8]]
 ];
 const points=shapes[index%shapes.length];
 const scale=[.88,1.13,.98,1.22,.9,1.08,1.03][index%7];
 const rotated=points.map(([a,b])=>({
  x:px(x+(a*Math.cos(angle)-b*Math.sin(angle))*scale),
  y:px(y+(a*Math.sin(angle)+b*Math.cos(angle))*scale)
 }));
 g.fillStyle(0x17232c,1);g.fillPoints(rotated,true);
 const inner=rotated.map(p=>({x:px(x+(p.x-x)*.79),y:px(y+(p.y-y)*.79)}));
 g.fillStyle([0x887d72,0x988a78,0xa59a88,0x716d69][index%4],1);
 g.fillPoints(inner,true);
 block(g,x-4*scale,y-4*scale,6*scale,3*scale,0xd1bea0,.9);
 block(g,x+2*scale,y+2*scale,4*scale,3*scale,0x4e5253);
 block(g,x-2*scale,y+1*scale,2*scale,4*scale,0x544b44);
}
export function rockblast(l,h,extra){
 const e=begin(l,'Throw',.58),[g,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x);
 const ox=l.x+Math.cos(ang)*10,oy=l.y-(l.alto||36)*.5;
 const count=Math.random()<.5?6:7;
 // Paths lock onto the player's casting aim; each stone can miss separately.
 const offsets=[-.10,.065,-.028,.11,-.074,.022,-.015];
 const stones=Array.from({length:count},(_,i)=>({
  delay:i*.095,last:{x:ox,y:oy},done:false
 }));
 const reach=Math.min(h.alcance??250,270),speed=360;
 let age=0;
 return register(e,dt=>{
  age+=dt;g.clear();trail.clear();
  for(let i=0;i<count;i++){
   const q=stones[i];if(q.done||age<q.delay)continue;
   const distance=Math.min(reach,(age-q.delay)*speed);
   const direction=ang+offsets[i];
   const x=ox+Math.cos(direction)*distance,y=oy+Math.sin(direction)*distance*.76;
   const now={x,y},collision=distance>0?pathHit(q.last,now,r):null;
   if(collision){
    q.done=true;
    if(strike(l,h,extra,r,.18))impact(e,collision.x,collision.y,0xc7b59b);
    continue;
   }
   q.last=now;
   if(distance>=reach){q.done=true;continue}
   rock(g,x,y,i,age*(i%2?-5:4)+i*.5);
   // Sparse individual grit particles, not solid oversized trails.
   for(let k=1;k<=2;k++){
    block(trail,x-Math.cos(direction)*(11+k*8),
     y-Math.sin(direction)*(7+k*5)+(i%3-1)*3,2+k%2,2,
     k===1?0xb09d83:0x655f59,.55-k*.13);
   }
  }
  return age<1.5&&stones.some(q=>!q.done);
 },()=>{g.destroy();trail.destroy()});
}
function specter(g,x,y,t,phase=0){
 // Flickering spectral flame pixels, forked tips, dark contour,
 // a violet center and a pale gold/rose heart. Never a round orb.
 const lift=Math.sin(t*15+phase)*2;
 block(g,x-3,y-10+lift,5,6,0x24122e);
 block(g,x+1,y-7+lift,4,5,0x24122e);
 block(g,x-6,y-3+lift,12,10,0x24122e);
 block(g,x-4,y-7+lift,7,11,0x8e63c1);
 block(g,x-2,y-9+lift,3,6,0xdca4f0);
 block(g,x-3,y-1+lift,7,5,0xe4b6df);
 block(g,x-1,y+1+lift,3,4,0xffe8b0);
 block(g,x+5,y+1+lift,3,3,0x6c3a8f);
}
export function confuseray(l,h,extra){
 const e=begin(l,'Charge',.57),[g,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x),ux=Math.cos(ang),uy=Math.sin(ang)*.76;
 const nx=-Math.sin(ang),ny=Math.cos(ang);
 const ox=l.x+ux*10,oy=l.y-(l.alto||36)*.52;
 const reach=Math.min(h.alcance??230,260),speed=285;
 let age=0,previous={x:ox,y:oy};
 return register(e,dt=>{
  age+=dt;g.clear();trail.clear();
  const distance=Math.min(reach,Math.max(0,age-.12)*speed);
  const tip={x:ox+ux*distance,y:oy+uy*distance};
  if(distance>0){
   for(let k=0;k<3;k++){
    const along=distance-k*15;
    if(along<=0)continue;
    const sway=Math.sin(age*15+k*2.3)*9;
    const x=ox+ux*along+nx*sway,y=oy+uy*along+ny*sway*.72;
    specter(g,x,y,age,k*1.3);
   }
   for(let k=2;k<=7;k++){
    const along=distance-k*11;
    if(along<=0)continue;
    const sway=Math.sin(age*15+k*2.3)*9;
    block(trail,ox+ux*along+nx*sway-2,
     oy+uy*along+ny*sway*.72-1,
     k%2?3:4,2,k%3===0?0xe4c2ea:0x68458e,.28+(7-k)*.07);
   }
   // The foremost spectral flame is the skillshot hitbox; no auto-aim.
   const collision=distance>10?pathHit(previous,tip,r):null;
   if(collision){
    const landed=r.recibir(l,{dano:0,tipo:'GHOST',silencioso:true,slot:extra?.slot})==='golpe';
    if(landed){
     impact(e,collision.x,collision.y,0xb47bcc);
     // Contact is necessary but not sufficient: confusion is 85%, never 100%.
     if(Math.random()<.85&&typeof r.ponerEstado==='function'){
      r.ponerEstado('confuso',3.1,{fuente:l});
     } // No floating HUD text on a failed roll: the contact visual is enough.
       // A projectile can connect without guaranteeing confusion.
    }
    return false;
   }
  }else{
   // Visible preparation rather than an invisible initial delay.
   for(let i=0;i<3;i++)specter(g,ox-5+i*5,oy-5+(i%2)*5,age,i);
  }
  previous=tip;
  return age<1.17&&distance<reach;
 },()=>{g.destroy();trail.destroy()});
}
function pixelEgg(g,x,y,scale=1){
 const b=(dx,dy,w,h,col)=>block(g,x+dx*scale,y+dy*scale,w*scale,h*scale,col);
 // Tall segmented shell with dark ink silhouette and white upper gloss.
 b(-7,-15,14,3,0x26303b);b(-10,-11,20,23,0x26303b);
 b(-7,11,14,4,0x26303b);
 b(-7,-12,14,3,0xfff5da);b(-8,-9,16,20,0xf5e7c4);
 b(-5,-11,10,20,0xfff8e6);b(-5,-8,5,5,0xffffff);
 b(3,4,3,5,0xd0be99);
}
export function softboiled(l,h,extra){
 const e=begin(l,'Charge',.96),[g,glow]=layers(e);
 let age=0,healed=false;
 return register(e,dt=>{
  age+=dt;g.clear();glow.clear();
  const cx=l.x,cy=l.y-(l.alto||36)*.65-12;
  const lift=Math.sin(age*8)*2;
  if(age<.5){
   // Egg gradually forms, floats above the Pokémon, then cracks.
   const scale=Math.max(.35,Math.min(1,age/.23));
   pixelEgg(g,cx,cy-5-lift,scale);
   if(age>.3){
    for(let i=0;i<4;i++){
     block(g,cx-6+i*4,cy-2+(i%2)*3-lift,5,2,0x7c7a77);
    }
   }
  }else{
   // The shell visibly opens into two jagged halves before ANY HP restoration.
   const split=Math.min(1,(age-.5)/.2);
   const left=cx-5-split*10,right=cx+5+split*10;
   block(g,left-10,cy-7-lift,12,15,0x26303b);
   block(g,left-8,cy-6-lift,10,11,0xf6e9ce);
   block(g,right-2,cy-7-lift,12,15,0x26303b);
   block(g,right-1,cy-6-lift,10,11,0xfff4dc);
   for(let k=0;k<5;k++){
    const a=k*PI*2/5+age*2,radius=8+(age-.5)*80;
    const x=cx+Math.cos(a)*radius,y=cy+Math.sin(a)*radius*.75;
    block(glow,x-3,y-1,8,3,0x173f32,.85);
    block(glow,x-1,y-3,3,8,0x8cebb9,.88);
    block(glow,x,y-1,2,3,0xe0ffe9,.93);
   }
  }
  if(!healed&&age>=.77){
   healed=true;
   // An interruptible self-heal is not an aimed attack; no automatic enemy hit.
   // Recover only 30% of max HP, and only after the full shell-breaking cast.
   if(!l.ko&&Number.isFinite(l.hpMax)&&Number.isFinite(l.hp)){
    const amount=Math.max(0,Math.min(l.hpMax-l.hp,Math.floor(l.hpMax*.30)));
    l.hp+=amount;
    if(amount>0){
     vfx.textoFlotante(e,l.x,l.y-(l.alto||36)-14,'+'+amount,
      {color:'#a6f4c1',dur:760});
     vfx.rafaga(e,'chispa',l.x,l.y-(l.alto||36)*.65,0xb9f4d4,5);
    }
   }
  }
  return age<1.06;
 },()=>{g.destroy();glow.destroy()});
}
export const TORRE2_MEGA_FORMS={
 torre2_icebeam:icebeam,torre2_rockblast:rockblast,
 torre2_confuseray:confuseray,torre2_softboiled:softboiled
};
