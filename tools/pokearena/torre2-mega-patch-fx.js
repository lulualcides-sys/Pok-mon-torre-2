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
function crystal(g,x,y,scale=1){
 const b=(dx,dy,w,h,c)=>block(g,x+dx*scale,y+dy*scale,w*scale,h*scale,c);
 b(-3,-11,6,21,0x18344e);b(-6,-4,12,8,0x18344e);
 b(-2,-10,4,18,0x65b7df);b(-4,-3,8,5,0x90dcf2);
 b(-1,-8,2,13,0xe0f9ff);b(2,-2,2,4,0xc1f3ff);
}
export function icebeam(l,h,extra){
 const e=begin(l,'Charge',.49),[beam,glints]=layers(e);
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x),r=l.rival;
 const ox=l.x+Math.cos(ang)*12,oy=l.y-(l.alto||36)*.52;
 const distance=Math.min(h.alcance??260,285),duration=.57;
 const ux=Math.cos(ang),uy=Math.sin(ang)*.76;
 let age=0,hit=false,old={x:ox,y:oy};
 return register(e,dt=>{
  age+=dt;beam.clear();glints.clear();
  const front=distance*sat((age-.065)/duration);
  const tip={x:ox+ux*front,y:oy+uy*front};
  if(front>0){
   // Banded icy beam: dark outline, stepped bright core and discrete crystals.
   const back=Math.max(0,front-87);
   for(let d=back;d<=front;d+=5){
    const x=ox+ux*d,y=oy+uy*d;
    const tx=-Math.sin(ang),ty=Math.cos(ang);
    const wobble=(Math.floor(d/14)%3-1)*2;
    block(beam,x-3+tx*wobble,y-3+ty*wobble,8,7,0x182c49,.9);
    block(beam,x-1+tx*wobble,y-2+ty*wobble,5,4,0x64bde5);
    block(beam,x+tx*wobble,y-1+ty*wobble,3,2,0xe0fcff);
   }
   for(let j=0;j<4;j++){
    const d=front-j*17;
    if(d<6)continue;
    const x=ox+ux*d-Math.sin(ang)*((j%2?1:-1)*9);
    const y=oy+uy*d+Math.cos(ang)*((j%2?1:-1)*6);
    crystal(glints,x,y,.55);
   }
   crystal(glints,tip.x,tip.y,.82);
  }
  if(!hit&&front>6&&r&&!r.ko){
   const collision=pathHit(old,tip,r);
   if(collision){
    hit=true;
    if(strike(l,h,extra,r,1)){
     impact(e,collision.x,collision.y,0x9cdefb);
     // The original arena uses a cumulative frost meter.
     if(Math.random()<.10&&!r.tipos?.includes('ICE')&&typeof r.escarchar==='function')
      r.escarchar('torre2-icebeam-'+Math.round(l.t*1000));
    }
   }
  }
  old=tip;
  return age<.86&&!hit;
 },()=>{beam.destroy();glints.destroy()});
}
function rock(g,x,y,rot=0){
 // Faceted 16x14 rock, outlined at the pixel level; no generic colored orb.
 const bits=[
 [-7,-2,14,9,0x1b2734],[-5,-5,10,4,0x1b2734],
 [-6,0,12,6,0x867c71],[-4,-4,8,6,0xb9aa91],
 [-4,-2,4,2,0xdcc8a0],[2,2,4,4,0x554f4d],
 [-3,4,5,2,0x625c57]
 ];
 for(const [dx,dy,w,h,color] of bits){
  const rx=dx*Math.cos(rot)-dy*Math.sin(rot);
  const ry=dx*Math.sin(rot)+dy*Math.cos(rot);
  block(g,x+rx,y+ry,w,h,color);
 }
}
export function rockblast(l,h,extra){
 const e=begin(l,'Throw',.52),[g,trail]=layers(e),r=l.rival;
 const ang=Math.atan2(l.ay-l.y,l.ax-l.x),ox=l.x+Math.cos(ang)*10,oy=l.y-(l.alto||36)*.5;
 const count=(()=>{const x=Math.random();return x<.375?2:x<.75?3:x<.875?4:5})();
 const offsets=[-.095,.075,-.035,.11,-.12];
 const rocks=Array.from({length:count},(_,i)=>({delay:i*.115,last:{x:ox,y:oy},done:false}));
 const range=Math.min(h.alcance??250,270),speed=340;
 let age=0;
 return register(e,dt=>{
  age+=dt;g.clear();trail.clear();
  for(let i=0;i<count;i++){
   const p=rocks[i];if(p.done||age<p.delay)continue;
   const dist=Math.min(range,(age-p.delay)*speed),direction=ang+offsets[i];
   const x=ox+Math.cos(direction)*dist,y=oy+Math.sin(direction)*dist*.76;
   const now={x,y},coll=pathHit(p.last,now,r);
   if(coll){p.done=true;if(strike(l,h,extra,r,.43))impact(e,coll.x,coll.y,0xbbae91);continue}
   p.last=now;
   if(dist>=range){p.done=true;continue}
   rock(g,x,y,age*4+i);
   block(trail,x-Math.cos(direction)*13,y-Math.sin(direction)*8,4,3,0x786f64,.45);
  }
  return age<1.52&&rocks.some(p=>!p.done);
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
   const color=[0xa17eec,0xf3ccfa,0x7754b8][k];
   block(g,xx-3,yy-4,7,8,0x201334);
   block(g,xx-2,yy-3,5,6,color);
   block(g,xx-1,yy-2,2,3,0xfff7ff);
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
     r.ponerEstado('confuso',3.1,{fuente:l});
     impact(e,collision.x,collision.y,0xba8be5);
    }
    return false;
   }
  }
  previous={x,y};
  return age<1.18&&dist<reach;
 },()=>{g.destroy();trail.destroy()});
}
export function softboiled(l,h,extra){
 const e=begin(l,'Charge',.68),[g,shine]=layers(e);
 let age=0,healed=false;
 return register(e,dt=>{
  age+=dt;g.clear();shine.clear();
  const cx=l.x,cy=l.y-(l.alto||36)*.65-14;
  if(age<.34){
   // A readable outlined egg: shell, pale center and a little golden yolk.
   block(g,cx-9,cy-7,18,18,0x253448);
   block(g,cx-6,cy-11,12,25,0x253448);
   block(g,cx-7,cy-6,14,17,0xf6f3dc);
   block(g,cx-5,cy-9,10,21,0xf6f3dc);
   block(g,cx-4,cy-7,5,7,0xffffff);
   block(g,cx+1,cy+3,5,5,0xf0c75e);
  }else{
   block(g,cx-12,cy+2,10,4,0xf6f3dc);
   block(g,cx+3,cy+2,10,4,0xf6f3dc);
   block(g,cx-10,cy+6,7,4,0x253448);
   block(g,cx+5,cy+6,7,4,0x253448);
  }
  if(!healed&&age>=.35){
   healed=true;
   if(!l.ko&&Number.isFinite(l.hpMax)&&Number.isFinite(l.hp)){
    const amount=Math.max(0,Math.min(l.hpMax-l.hp,Math.floor(l.hpMax*.5)));
    l.hp+=amount;
    if(amount>0){
     vfx.textoFlotante(e,l.x,l.y-(l.alto||36)-14,'+'+amount,{color:'#9dffb7'});
     vfx.rafaga(e,'chispa',l.x,l.y-(l.alto||36)*.55,0x91ecad,7);
    }
   }
  }
  if(age>.32&&age<.7)for(let i=0;i<5;i++){
   const a=i*2*PI/5+age*1.4,radius=12+25*(age-.32);
   block(shine,cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,3,3,i%2?0xffefba:0x9cf5b5,.82);
  }
  return age<.76;
 },()=>{g.destroy();shine.destroy()});
}
export const TORRE2_MEGA_FORMS={
 torre2_icebeam:icebeam,torre2_rockblast:rockblast,
 torre2_confuseray:confuseray,torre2_softboiled:softboiled
};
