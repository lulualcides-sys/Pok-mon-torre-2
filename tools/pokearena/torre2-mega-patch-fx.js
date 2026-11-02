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
// Inspired by the captured Poké Arena 2D Chorro.pintarHaz (Hyper Beam /
// Aura Storm): animated jagged multi-layer flow, thin blazing nucleus,
// luminous muzzle and wandering streaks. All colors/art are ICE, while
// damage is handled by our own physically aimed collision.
const FROST={halo:0x246e9c,outline:0x0b243f,edge:0x2f93c5,body:0x77d7ef,
 nucleus:0xe8fdff,shine:0xffffff};
function iceNoise(s,t,i=0){
 return Math.sin(s*.145-t*33+i*1.3)*.91+
  Math.sin(s*.31+t*19+i*.69)*.48;
}
function freezeFlake(g,x,y,size=.75,alpha=1){
 const b=(dx,dy,w,h,color)=>block(g,x+dx*size,y+dy*size,w*size,h*size,color,alpha);
 b(-2,-4,4,8,0x183b5b);b(-4,-2,8,4,0x183b5b);
 b(-1,-4,2,8,0xe2fcff);b(-4,-1,8,2,0x79d2ec);
 b(-2,-2,4,4,0xf4ffff);b(3,1,2,2,0x2987ad);
}
function frostStream(g,x,y,ux,uy,nx,ny,front,age){
 const step=5,n=Math.max(1,Math.ceil(front/step));
 const point=(s,offset)=>({x:px(x+ux*s+nx*offset),
  y:px(y+uy*s+ny*offset)});
 const layers=[
  {width:13.5,color:FROST.halo,opacity:.27,rough:3.9,seed:1},
  {width:10.9,color:FROST.outline,opacity:.96,rough:2.4,seed:2},
  {width:9.3,color:FROST.edge,opacity:1,rough:2.2,seed:3},
  {width:6.4,color:FROST.body,opacity:1,rough:1.5,seed:4},
  {width:3.1,color:FROST.nucleus,opacity:1,rough:.75,seed:5}
 ];
 // Every layer is a *single connected* irregular stream, not stacked
 // circles, rectangles, or a four-corner trapezoid.
 for(const layer of layers){
  const upper=[],lower=[];
  for(let k=0;k<=n;k++){
   const s=Math.min(front,k*step),grow=Math.min(1,.21+s/23);
   const pulse=.94+.07*Math.sin(age*30-s*.17+layer.seed);
   const radius=layer.width*grow*pulse;
   const drift=iceNoise(s,age,0)*(.7+Math.min(1,s/90)*1.15);
   const jagA=iceNoise(s,age,layer.seed)*layer.rough;
   const jagB=iceNoise(s,age,layer.seed+9)*layer.rough;
   upper.push(point(s,drift+radius+jagA));
   lower.unshift(point(s,drift-radius+jagB));
  }
  g.fillStyle(layer.color,layer.opacity);
  g.fillPoints([...upper,...lower],true);
 }
 // Hyper Beam's luminous mouth/base glow, rebuilt from small ice pixels.
 for(let k=0;k<8;k++){
  const a=age*13+k*PI/4,radius=9+Math.sin(age*22+k)*2;
  const xx=x+Math.cos(a)*radius, yy=y+Math.sin(a)*radius;
  if(k%2===0)freezeFlake(g,xx,yy,.52,.95);
 }
 for(let k=0;k<13;k++){
  const distance=8+((k*27+age*210)%Math.max(12,front-5));
  if(distance>=front-3)continue;
  const side=k%2===0?1:-1;
  const drift=iceNoise(distance,age,k)*2;
  const xx=x+ux*distance+nx*(drift+side*(10+k%4)*.8);
  const yy=y+uy*distance+ny*(drift+side*(10+k%4)*.8);
  if(k%3===0)freezeFlake(g,xx,yy,.45,.82);
  else block(g,xx,yy,2+k%2,2,k%4===0?FROST.shine:FROST.body,.75);
 }
 // Sharp small muzzle streaks, copied structurally from chorro's streak
 // accents, not big cartoon triangles.
 const tip={x:x+ux*front,y:y+uy*front};
 for(let k=-2;k<=2;k++){
  const xx=tip.x+nx*k*3.2,yy=tip.y+ny*k*3.2;
  block(g,xx,yy,2,2,k%2===0?FROST.shine:FROST.body,.9);
 }
}
// Ice terminal inspired by the constantly flowing Aura Storm muzzle:
 // a pointed, faceted glacier lance and two narrow side wings, never
 // a flat or dry/truncated end of an otherwise animated beam.
function frostCrown(g,x,y,ux,uy,nx,ny,front,age,opacity=1){
 const p=(d,w)=>({x:px(x+ux*d+nx*w),y:px(y+uy*d+ny*w)});
 const tremble=Math.sin(age*27)*1.1;
 // Solid dark outline encloses the whole forward spear head.
 const outline=[p(front-14,-8),p(front-3,-11-tremble),p(front+8,-5),
  p(front+17,0),p(front+8,5),p(front-3,11+tremble),p(front-14,8)];
 g.fillStyle(0x0b2843,opacity);g.fillPoints(outline,true);
 g.fillStyle(0x338ebd,opacity);g.fillPoints([
  p(front-12,-6),p(front-2,-8),p(front+12,0),p(front-2,8),p(front-12,6)
 ],true);
 g.fillStyle(0xa2eaff,opacity);g.fillPoints([
  p(front-11,-3),p(front+1,-5),p(front+14,0),p(front+2,3),p(front-11,3)
 ],true);
 g.fillStyle(0xf6ffff,opacity);g.fillPoints([
  p(front-9,-1),p(front+12,0),p(front-9,2)
 ],true);
 for(const side of [-1,1]){
  // Two ice spurs grow and retract out of phase as the blast runs.
  const spur=2+3*Math.sin(age*18+side*2);
  g.fillStyle(0x133f62,opacity);
  g.fillPoints([p(front-13,side*7),p(front-1,side*(13+spur)),
   p(front+9,side*(10+spur*.6)),p(front+3,side*5)],true);
  g.fillStyle(0x83dded,opacity);
  g.fillPoints([p(front-9,side*8),p(front+3,side*(11+spur)),
   p(front+6,side*7)],true);
 }
 // A little continuous ice spray flows FORWARD beyond the shaped point.
 for(let i=0;i<6;i++){
  const adv=2+((i*7+age*95)%20),side=(i%3-1)*7;
  const xx=x+ux*(front+adv)+nx*(side+Math.sin(age*16+i)*2);
  const yy=y+uy*(front+adv)+ny*(side+Math.sin(age*16+i)*2);
  block(g,xx,yy,i%2+1,i%3===0?3:2,
   i%3===0?0xffffff:0x81d7f2,opacity*.85);
 }
}
export function icebeam(l,h,extra){
 const e=begin(l,'Charge',.72),[g,glints]=layers(e),r=l.rival;
 const initialAngle=Math.atan2(l.ay-l.y,l.ax-l.x);
 let angle=initialAngle,age=0,hitDone=false,hitPoint=null,hitAt=0;
 const range=Math.min(h.alcance??260,285),speed=560,charge=.15;
 const duration=1.16,release=1.0,steerRate=h.giro??2.8;
 // Aura Storm's Chorro holds a channeling action for the entire beam
 // and reads aiming input every frame instead of freezing the cast angle.
 l.accion={hasta:l.t+duration,bloquea:true,lento:.35,angulo:angle};
 return register(e,dt=>{
  age+=dt;g.clear();glints.clear();
  if(l.ko||l.est?.aturdido)return false;
  // Original Chorro update: aim toward the current controller/cursor target,
  // rotate by at most "giro * dt". This works on touch and keyboard/mouse.
  const target=Math.atan2(l.ay-l.y,l.ax-l.x);
  const diff=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));
  angle+=Math.max(-steerRate*dt,Math.min(steerRate*dt,diff));
  if(l.accion)l.accion.angulo=angle;
  const ux=Math.cos(angle),uy=Math.sin(angle)*.76,normal=Math.hypot(ux,uy)||1;
  const nx=-uy/normal,ny=ux/normal;
  const ox=l.x+ux*12,oy=l.y-(l.alto||36)*.52;
  const rising=Math.min(range,Math.max(0,age-charge)*speed);
  const fade=sat((duration-age)/(duration-release));
  const front=rising*fade;
  if(front<2){
   if(age<charge)for(let i=0;i<6;i++){
    const a=i*PI/3+age*11,radius=15-8*sat(age/charge);
    freezeFlake(g,ox+Math.cos(a)*radius,oy+Math.sin(a)*radius,.48);
   }
   return age<duration;
  }
  // Same flowing, imperfect layered beam silhouette as Hyper Beam/Aura
  // Storm. The source never changes: just rotate its drawing each frame.
  frostStream(g,ox,oy,ux,uy,nx,ny,front,age);
  frostCrown(g,ox,oy,ux,uy,nx,ny,front,age,Math.max(.2,fade));
  if(!hitDone&&r&&!r.ko&&age>=charge&&age<=release){
   // A player must SWEEP the live beam over the moving enemy. No
   // auto-targeting, no repeat damage, no guaranteed freeze.
   const end={x:ox+ux*front,y:oy+uy*front};
   const collision=pathHit({x:ox,y:oy},end,r);
   if(collision){
    hitDone=true;
    if(strike(l,h,extra,r,1)){
     hitPoint=collision;hitAt=age;
     impact(e,collision.x,collision.y,0x98e6fc);
     if(Math.random()<.1&&!r.tipos?.includes('ICE')&&typeof r.escarchar==='function')
      r.escarchar('torre2-icebeam-'+Math.round(l.t*1000));
    }
   }
  }
  // The channel REMAINS active after first impact. Swiping the aim
  // continues to move the visible jet, just like Aura Storm.
  if(hitPoint){
   const elapsed=age-hitAt;
   if(elapsed<=.24)for(let i=0;i<10;i++){
    const a=i*PI/5+age*5,radius=6+sat(elapsed/.24)*24;
    freezeFlake(glints,hitPoint.x+Math.cos(a)*radius,
     hitPoint.y+Math.sin(a)*radius,.47+.3*(1-sat(elapsed/.24)));
   }
  }
  return age<duration;
 },()=>{g.destroy();glints.destroy()});
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
export function confuseray(l,h,extra){
 const e=begin(l,'Charge',.57),[g,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x),ox=l.x+Math.cos(ang)*10,oy=l.y-(l.alto||36)*.52;
 const reach=Math.min(h.alcance??230,260),speed=275;
 let age=0,previous={x:ox,y:oy};
 return register(e,dt=>{
  age+=dt;g.clear();trail.clear();
  const dist=Math.min(reach,Math.max(0,age-.10)*speed);
  const x=ox+Math.cos(ang)*dist,y=oy+Math.sin(ang)*dist*.76;
  // Three intertwined flickering spectral rays, not one colored circle.
  for(let k=0;k<3;k++){
   const phase=k*PI*2/3+age*12,xx=x+Math.cos(phase)*10,yy=y+Math.sin(phase)*7;
   const color=[0xe1a31b,0xffe47a,0xc98612][k];
   block(g,xx-3,yy-4,7,8,0x4a3511);
   block(g,xx-2,yy-3,5,6,color);
   block(g,xx-1,yy-2,2,3,0xfffeeb);
   if(dist>22){
    block(trail,xx-Math.cos(ang)*13,yy-Math.sin(ang)*9,3,2,color,.45);
   }
  }
  if(dist>9&&r&&!r.ko){
   const collision=pathHit(previous,{x,y},r);
   if(collision){
    // Silent 0-damage collision honors shields/invulnerability.
    const landed=r.recibir(l,{dano:0,tipo:'GHOST',silencioso:true,slot:extra?.slot})==='golpe';
    if(landed){
     if(Math.random()<.85&&typeof r.ponerEstado==='function')
      r.ponerEstado('confuso',3.1,{fuente:l});
     impact(e,collision.x,collision.y,0xffdc57);
    }
    return false;
   }
  }
  previous={x,y};
  return age<1.18&&dist<reach;
 },()=>{g.destroy();trail.destroy()});
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
     // Keep the cure in Phaser Graphics: an animated green-gold healing
     // halo already surrounds the Pokemon. Avoid spawning canvas-backed
     // text objects that break in headless/WebGL battle scenes.
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
