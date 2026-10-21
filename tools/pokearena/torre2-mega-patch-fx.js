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
// Ice Beam is a BEAM, never a floating Aura Sphere. Three layered
// continuous pixel ribbons, snapped to whole pixels like Poké Arena 2D.
function iceFacet(g,x,y,s=1){
 const b=(dx,dy,w,h,c)=>block(g,x+dx*s,y+dy*s,w*s,h*s,c);
 b(-2,-5,4,2,0x0e324e);b(-4,-3,8,6,0x0e324e);b(-2,3,4,2,0x0e324e);
 b(-1,-4,2,3,0xd1f7ff);b(-3,-2,6,4,0x5dbadd);
 b(-1,-1,3,3,0xedffff);b(2,1,2,2,0x337fae);
}
function iceBand(g,ox,oy,ux,uy,nx,ny,begin,end,halfA,halfB,color,alpha=1){
 if(end<=begin)return;
 g.fillStyle(color,alpha);
 g.fillPoints([
  {x:px(ox+ux*begin+nx*halfA),y:px(oy+uy*begin+ny*halfA)},
  {x:px(ox+ux*end+nx*halfB),y:px(oy+uy*end+ny*halfB)},
  {x:px(ox+ux*end-nx*halfB),y:px(oy+uy*end-ny*halfB)},
  {x:px(ox+ux*begin-nx*halfA),y:px(oy+uy*begin-ny*halfA)}
 ],true);
}
export function icebeam(l,h,extra){
 const e=begin(l,'Charge',.65),[beam,dust]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x);
 const ux=Math.cos(ang),uy=Math.sin(ang)*.76,normal=Math.hypot(ux,uy)||1;
 const nx=-uy/normal,ny=ux/normal;
 const ox=l.x+ux*12,oy=l.y-(l.alto||36)*.52;
 const range=Math.min(h.alcance??260,285),speed=495;
 let age=0,attempted=false,contactTime=-1,stopDistance=range,hitPoint=null;
 return register(e,dt=>{
  age+=dt;beam.clear();dust.clear();
  const front=Math.min(stopDistance,Math.max(0,age-.14)*speed);
  if(front<1){
   // Audible/visible charging by jagged ice shards gathering at the muzzle.
   for(let i=0;i<4;i++){
    const a=i*PI/2+age*16,rad=10-6*sat(age/.14);
    iceFacet(dust,ox+Math.cos(a)*rad,oy+Math.sin(a)*rad,.45);
   }
   return age<.98;
  }
  // The beam extends forward then remains a solid icy jet for a brief moment.
  // No orb, no circle sprites and no row of square "projectiles".
  const end=front,breath=Math.sin(age*26)*.6;
  iceBand(beam,ox,oy,ux,uy,nx,ny,0,end,3.6,8.5+breath,0x10283f);
  iceBand(beam,ox,oy,ux,uy,nx,ny,2,end,2.8,6.4+breath*.5,0x2483ac);
  iceBand(beam,ox,oy,ux,uy,nx,ny,4,end-1,1.5,4.1,0x8cddf5);
  iceBand(beam,ox,oy,ux,uy,nx,ny,7,end-2,1,2.1,0xf0ffff);
  // Uneven serrated ice edges, blue frost chips and white embers fly along
  // both sides; draw only ~12 low-cost pixel facets total per frame.
  for(let i=0;i<9;i++){
   const d=14+((i*31+age*90)%(Math.max(18,end-12)));
   if(d>=end-7)continue;
   const side=i%2?-1:1;
   const spread=7+2*Math.sin(age*12+i*2.7);
   const x=ox+ux*d+nx*spread*side;
   const y=oy+uy*d+ny*spread*side;
   iceFacet(dust,x,y,i%3===0?.48:.34);
   block(dust,x+nx*side*5,y+ny*side*5,2,2,i%2?0xb9f4ff:0x3a99c5,.65);
  }
  // The far edge shows a pronged frozen splash, not a projectile sphere.
  const tx=ox+ux*end,ty=oy+uy*end;
  for(let i=-1;i<=1;i++){
   const dx=nx*i*7,dy=ny*i*7;
   iceFacet(dust,tx+dx,ty+dy,i===0?.65:.46);
  }
  if(!attempted&&r&&!r.ko&&front>12){
   // Skillshot: ray remains fixed to the CAST direction, so sidestepping
   // avoids its corridor. Collision is tested against visible beam segment.
   const collision=pathHit({x:ox,y:oy},{x:tx,y:ty},r);
   if(collision){
    attempted=true;
    const t=Math.max(0,((collision.x-ox)*ux+(collision.y-oy)*uy)/(normal*normal||1));
    stopDistance=Math.min(stopDistance,Math.max(14,t));
    contactTime=age;
    if(strike(l,h,extra,r,1)){
     hitPoint=collision;
     impact(e,collision.x,collision.y,0x9fe5f8);
     if(Math.random()<.10&&!r.tipos?.includes('ICE')&&typeof r.escarchar==='function')
      r.escarchar('torre2-icebeam-'+Math.round(l.t*1000));
    }
   }
  }
  if(hitPoint){
   const pulse=sat((age-contactTime)/.22);
   for(let i=0;i<7;i++){
    const a=i*PI*2/7+age*8,rad=6+pulse*17;
    iceFacet(dust,hitPoint.x+Math.cos(a)*rad,hitPoint.y+Math.sin(a)*rad,
     Math.max(.32,.72-pulse*.4));
   }
  }
  if(attempted)return age<contactTime+.21;
  // Complete full-range beam even on a miss; do not cause phantom damage.
  return age<.92;
 },()=>{beam.destroy();dust.destroy()});
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
function drawEerieBeam(g,ox,oy,ux,uy,nx,ny,extent,age){
 // Narrow SINISTER RAY made from connected, oscillating pixel segments;
 // spectral pink, lavender and pale-gold center rather than flames/orbs.
 const segment=9;
 for(let d=0;d<extent;d+=segment){
  const next=Math.min(extent,d+segment);
  const sway=t=>4.5*Math.sin(age*12-t*.067)*Math.sin(PI*sat(t/extent));
  const a=sway(d),b=sway(next);
  for(const [width,color] of [[5,0x1c1538],[3,0x8556af],[1.7,0xf6d4ab]]){
   g.fillStyle(color,1);
   const pt=(t,offset,size)=>({x:px(ox+ux*t+nx*(offset+size)),
    y:px(oy+uy*t+ny*(offset+size))});
   g.fillPoints([
    pt(d,a,width),pt(next,b,width),pt(next,b,-width),pt(d,a,-width)
   ],true);
  }
 }
}
function confuseImpact(g,x,y,t){
 // Three widening, six-point hypnotic rings around the actual contact.
 for(let ring=0;ring<3;ring++){
  const radius=6+ring*6+t*36;
  const sides=12,points=[];
  for(let j=0;j<sides;j++){
   const a=j*PI*2/sides+t*4+ring*.38;
   points.push({x:px(x+Math.cos(a)*radius),y:px(y+Math.sin(a)*radius*.75)});
  }
  g.lineStyle(ring===1?3:2,[0xf7dfa3,0x9a6fcb,0xddb5f2][ring],Math.max(.1,.95-t*3));
  g.strokePoints(points,true);
 }
 for(let i=0;i<6;i++){
  const a=i*PI/3+t*12;
  const radius=4+30*t;
  block(g,x+Math.cos(a)*radius,y+Math.sin(a)*radius,3,3,0xffe5ac,1-t);
 }
}
export function confuseray(l,h,extra){
 const e=begin(l,'Charge',.57),[ray,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x);
 const ux=Math.cos(ang),uy=Math.sin(ang)*.76,len=Math.hypot(ux,uy)||1;
 const nx=-uy/len,ny=ux/len;
 const ox=l.x+ux*10,oy=l.y-(l.alto||36)*.52;
 const reach=Math.min(h.alcance??230,260),speed=335;
 let age=0,attempted=false,impactAge=-1,impactAt=null;
 return register(e,dt=>{
  age+=dt;ray.clear();trail.clear();
  if(impactAge>=0){
   impactAge+=dt;
   confuseImpact(ray,impactAt.x,impactAt.y,sat(impactAge/.24));
   return impactAge<.24;
  }
  const distance=Math.min(reach,Math.max(0,age-.12)*speed);
  if(distance<2){
   // Charged streaks gather around the hands/eyes before firing.
   for(let i=-2;i<=2;i++){
    const t=age*19+i*2;
    block(ray,ox+i*3,oy+Math.sin(t)*6-1,3,3,i%2?0x9c69cd:0xffe4a8);
   }
  }else{
   drawEerieBeam(ray,ox,oy,ux,uy,nx,ny,distance,age);
   for(let j=0;j<7;j++){
    const d=distance-13-j*15;
    if(d<=0)continue;
    const offset=(j%2?1:-1)*(8+Math.sin(age*17+j)*2);
    const x=ox+ux*d+nx*offset,y=oy+uy*d+ny*offset;
    block(trail,x-2,y-2,4,4,j%3===0?0xffe7aa:0xb290d8,.64);
    block(trail,x+nx*3,y+ny*3,2,2,0x3a224e,.5);
   }
   // Beam tip is the collision point. Fixed initial aim, target can dodge.
   const tip={x:ox+ux*distance,y:oy+uy*distance};
   const collision=distance>10?pathHit({x:ox,y:oy},tip,r):null;
   if(collision&&!attempted){
    attempted=true;
    const landed=r.recibir(l,{dano:0,tipo:'GHOST',silencioso:true,slot:extra?.slot})==='golpe';
    if(landed){
     impactAt=collision;impactAge=0;
     impact(e,collision.x,collision.y,0xc69be4);
     if(Math.random()<.85&&typeof r.ponerEstado==='function')
      r.ponerEstado('confuso',3.1,{fuente:l});
    }else return false;
   }
  }
  return age<1.12&&distance<reach;
 },()=>{ray.destroy();trail.destroy()});
}
function pixelEgg(g,x,y,s=1){
 // Large upright egg, 22x30 pixel template, opaque shell and dark contour.
 const b=(dx,dy,w,h,col)=>block(g,x+dx*s,y+dy*s,w*s,h*s,col);
 b(-7,-17,14,3,0x2b2933);b(-10,-14,20,5,0x2b2933);
 b(-12,-9,24,17,0x2b2933);b(-10,8,20,6,0x2b2933);
 b(-6,14,12,3,0x2b2933);
 b(-7,-14,14,3,0xfff9df);b(-9,-11,18,5,0xfff3d9);
 b(-10,-7,20,15,0xffeed1);b(-8,8,16,4,0xf4deaf);
 b(-5,12,10,2,0xe7d3af);
 b(-7,-8,8,14,0xfffdf0);b(-5,-11,5,5,0xffffff);
 b(4,3,4,6,0xdfc997);
}
function eggFlare(g,cx,cy,t){
 // A petite outline of golden healing light that climbs the creature's body.
 const radius=12+9*t;
 for(let i=0;i<10;i++){
  const a=i*PI*2/10;
  const x=cx+Math.cos(a)*radius;
  const y=cy+Math.sin(a)*radius*.65;
  block(g,x-2,y-2,4,4,i%3?0xf9e3a0:0xffffff,1-t*.7);
 }
 for(let k=0;k<6;k++){
  const phase=(t*1.7+k/6)%1;
  const x=cx+Math.sin(k*3.4)*16;
  const y=cy+12-phase*39;
  block(g,x-2,y-2,3,5,0x92e2b1,Math.max(.2,.95-phase));
  block(g,x,y-4,2,2,0xf5ffe5,.85);
 }
}
export function softboiled(l,h,extra){
 const e=begin(l,'Charge',1.01),[egg,glow]=layers(e);
 let age=0,healed=false;
 return register(e,dt=>{
  age+=dt;egg.clear();glow.clear();
  const body=l.y-(l.alto||36)*.55;
  // Egg rises from the user's body, hovers, then becomes healing light.
  const cx=l.x,cy=body-17-13*sat(age/.37)-2*Math.sin(age*9);
  if(age<.61){
   const s=.65+.5*sat(age/.23);
   pixelEgg(egg,cx,cy,s);
   if(age>.32){
    // Sharp hairline crack zigzags across shell over successive frames.
    const f=sat((age-.32)/.29),count=Math.ceil(f*6);
    for(let i=0;i<count;i++)
     block(egg,cx-8+i*3,cy+((i%2)*4-2),4,2,0x876e6d);
   }
   const halo=5+Math.sin(age*16)*3;
   for(let i=0;i<6;i++){
    const a=age*3+i*PI/3;
    block(glow,cx+Math.cos(a)*(16+halo),cy+Math.sin(a)*(16+halo),3,3,
     i%2?0xffe8a0:0xfbfdf0,.75);
   }
  }else{
   const dissolve=sat((age-.61)/.24);
   // Egg dissolves into bright, angular pixel shards instead of vanishing.
   for(let i=0;i<10;i++){
    const a=i*PI*2/10+(.5*i%2);
    const dist=7+28*dissolve;
    const x=cx+Math.cos(a)*dist,y=cy+Math.sin(a)*dist*.7+12*dissolve;
    block(egg,x-3,y-3,5,5,0x302a35,1-dissolve*.85);
    block(egg,x-2,y-2,3,3,i%2?0xf5e3af:0xfffcdf,1-dissolve*.65);
   }
   // Healing aura envelops the Pokémon, not the empty position of the egg.
   eggFlare(glow,cx,body,sat((age-.61)/.43));
  }
  if(!healed&&age>=.82){
   healed=true;
   // Self-target recovery is not an offensive auto-hit. 30% max HP is
   // intentional Torre 2 balance, and starts only after egg animation.
   if(!l.ko&&Number.isFinite(l.hpMax)&&Number.isFinite(l.hp)){
    const amount=Math.max(0,Math.min(l.hpMax-l.hp,Math.floor(l.hpMax*.30)));
    l.hp+=amount;
    if(amount>0){
     vfx.textoFlotante(e,l.x,l.y-(l.alto||36)-14,'+'+amount,
      {color:'#a9edc1',dur:780});
     vfx.rafaga(e,'chispa',l.x,body,0xf0e9b9,5);
    }
   }
  }
  return age<1.12;
 },()=>{egg.destroy();glow.destroy()});
}
export const TORRE2_MEGA_FORMS={
 torre2_icebeam:icebeam,torre2_rockblast:rockblast,
 torre2_confuseray:confuseray,torre2_softboiled:softboiled
};
