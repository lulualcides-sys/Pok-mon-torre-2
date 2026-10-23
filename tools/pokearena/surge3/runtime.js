/* Pokémon Torre 2 / Lt. Surge move VFX — pixel matrices on Phaser/WebGL.
 * All three hits use independent manual swept collision and occur AFTER the
 * drawn effect reaches its target. Never touch user-approved 24 moves.
 */
import {SURGE3_MOVES} from './catalog.js';
import {stamp,pixel} from '../batch24/pixels.js';
import {FRAGMENT_POSES} from '../batch24/emerald-fragments.js';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x));
const COLORS=Object.freeze({
 thunder:Object.freeze([0x17233a,0x34658f,0x62c8e9,0xf6e44e,0xffffff]),
 sonic:Object.freeze([0x1b2636,0x52687e,0x8da9c2,0xcbe9f4,0xffffff]),
 screech:Object.freeze([0x231c34,0x665075,0xa77bb6,0xf0bddb,0xffffff])
});
const center=l=>({x:l.x,y:l.y-(l.alto||36)*.5});
// Port of the EXACT segment-swept contact geometry already used by the
// Torre 2 batch24 runtime. Copied into this standalone three-move module so
// pre-publish unit tests run without the captured Phaser client.
export function swept(a,b,r,radius=10){
 if(!r||r.ko)return null;
 const c=center(r),dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 const t=den?clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/den):0;
 const p={x:a.x+dx*t,y:a.y+dy*t};
 return Math.hypot(p.x-c.x,p.y-c.y)<=
  radius+Math.min(12,(r.alto||36)*.22)?p:null;
}
const sideways=(a,normal,tangential)=>({
 x:Math.cos(a)*tangential-Math.sin(a)*normal,
 y:Math.sin(a)*tangential+Math.cos(a)*normal
});
export function paintSurge3(g,style,x,y,frame,angle=0){
 const f=((Math.floor(frame)%12)+12)%12;
 const kind=style==='thunder-wave'?'thunder':
  style==='sonic-boom'?'sonic':'screech';
 const p=COLORS[kind];
 if(kind==='thunder'){
  // One winding bolt made of eight 2x2 electrical joints, alternating
  // direction by frame. Gold core, cyan corona, black outline.
  for(let i=0;i<8;i++){
   const along=i*4-14;
   const lateral=(i%2?1:-1)*(3+Math.sin(f*.7+i*.9)*2);
   const v=sideways(angle,lateral,along);
   pixel(g,x+v.x-2,y+v.y-2,p[0],6,.95);
   pixel(g,x+v.x-1,y+v.y-1,p[i%3===0?2:3],4,.95);
   pixel(g,x+v.x,y+v.y,p[4],2,i%3===0?.96:.64);
  }
  for(let i=0;i<4;i++){
   const v=sideways(angle,(i%2?1:-1)*(9+i*2),Math.sin(f*.6+i)*7);
   stamp(g,'p2star',x+v.x,y+v.y,p,.48,angle,.55);
  }
 }else if(kind==='sonic'){
  // Concentric metallic-blue sound fronts, crisp 8x8 P2 ring mask.
  // Three offsets and a tiny stagger yield twelve distinct wave poses.
  for(let j=0;j<3;j++){
   const offset=sideways(angle,0,-10-j*12);
   const size=.92+j*.26+(f%4)*.095;
   stamp(g,'p2darkring',x+offset.x,y+offset.y,p,size,angle,.90-j*.2);
  }
  for(let j=0;j<5;j++){
   const off=sideways(angle,Math.sin(f*.55+j)*5,-j*9);
   pixel(g,x+off.x,y+off.y,p[j%2?4:3],j%2?2:3,.75-j*.1);
  }
 }else{
  // Jagged violet audio waveform; deliberately NOT an attacking beam.
  // Five staggered crescent wavefronts with visibly shifting frequency.
  for(let j=0;j<4;j++){
   const ahead=sideways(angle,0,-j*11);
   const scale=.64+(f%4)*.055+j*.10;
   stamp(g,'curl',x+ahead.x,y+ahead.y,p,scale,angle+Math.sin(f*.36+j)*.15,.85-j*.17);
  }
  for(let j=0;j<6;j++){
   const v=sideways(angle,Math.cos(f*.63+j)*(6+j*2),-j*8);
   pixel(g,x+v.x,y+v.y,p[j%3+2],2,.8-j*.10);
  }
 }
 return true;
}
export function paintSurge3Impact(g,style,x,y,elapsed){
 if(elapsed<0||elapsed>=.38)return false;
 const frame=Math.min(11,Math.floor(elapsed*32)),k=clamp(elapsed/.38);
 const p=COLORS[style==='thunder-wave'?'thunder':
  style==='sonic-boom'?'sonic':'screech'];
 const arms=style==='screech'?5:7;
 for(let j=0;j<arms;j++){
  const a=TAU*j/arms+frame*.07,d=(4+j%2*2)+(frame*1.25);
  const size=frame<5?3:2;
  // Shared Emerald physics trajectories (MIT): no generic static circles.
  const debris=FRAGMENT_POSES[j][frame];
  pixel(g,x+Math.cos(a)*d+debris.x*.25,
   y+Math.sin(a)*d*.65+debris.y*.25,
   p[j%3+2],size,1-k);
 }
 stamp(g,style==='thunder-wave'?'p2star':'p2darkring',
  x,y,p,Math.max(.35,1-k)*1.2,frame*.06,1-k);
 return true;
}
export function surgeTargetEffect(target,move){
 if(!target||target.ko||!Array.isArray(target.tipos))return false;
 if(move.id==='thunder-wave'){
  // FireRed Gen III permits paralysis of Electric-types; immunity to
  // paralysis by Electric typing was introduced in Gen VI. Ground-type
  // immunity still applies to the aimed Electric attack.
  // FireRed Electric Wave is a pure status move, not an attack.
  if(target.tipos.includes('GROUND')||
     target.est?.paralizado)return false;
  target.ponerEstado?.('paralizado',7);
  return true;
 }
 if(move.id==='screech'){
  // The original Phaser battle has one Defense stat: -2 stages means
  // its divisor is halved. Maximum -6 stages gives one quarter Defense.
  // A custom Torre 2-only state is consumed by the Kanto patched getter.
  if(target.est?.blindaje||target.est?.bloqueo)return false;
  const stages=Math.min(6,(target.est?.torre2Screech?.stages||0)+2);
  target.ponerEstado?.('torre2Screech',7,{stages});
  return true;
 }
 return false;
}
export function surgeFixedHit(actor,target,move,extra={}){
 if(!target||target.ko||move.id!=='sonic-boom')return false;
 // FRLG: Normal-type immunity still protects Ghosts. This game's damage
 // engine already supports pure, defense-ignoring fixed HP damage. Puro
 // bypasses defense, level, STAB and type effectiveness; check guard first.
 if(target.tipos?.includes('GHOST')||target.invulnerable||
    target.est?.bloqueo||target.est?.invul)return false;
 const before=target.hp;
 const result=target.recibir(actor,{dano:move.fixedDamage,tipo:'NORMAL',
  puro:true,categoria:'SPECIAL',slot:extra.slot,empuje:0});
 return result==='golpe'&&
  (before>target.hp||target.__torre2TrainingDummy===true);
}
function cast(actor,move,extra){
 const scene=actor.escena;
 const angle=Math.atan2((actor.ay??actor.y)-actor.y,
  (actor.ax??actor.x+100)-actor.x);
 const origin=center(actor),speed=move.speed,range=move.alcance;
 actor.animar?.(move.anim||'Shoot',.47,.14);
 actor.accion={hasta:actor.t+.48,lento:.57,angulo:angle};
 const g=scene.add.graphics().setDepth(1514);
 let age=0,prev=null,hitAt=null,hit=null,dead=false,checked=false;
 const fx={
  update(dt){
   if(dead)return false;
   if(actor.ko){this.destroy();return false}
   age+=Math.max(0,Math.min(.08,dt||0));
   g.clear();
   if(hitAt!==null){
    if(!paintSurge3Impact(g,move.style,hit.x,hit.y,age-hitAt)){
     this.destroy();return false;
    }
    return true;
   }
   const flight=age-.11;
   if(flight<0)return true;
   const distance=flight*speed;
   if(distance>range){this.destroy();return false}
   const x=origin.x+Math.cos(angle)*distance;
   const y=origin.y+Math.sin(angle)*distance;
   paintSurge3(g,move.style,x,y,Math.min(11,Math.floor(flight*24)),angle);
   const target=actor.rival;
   const next={x,y};
   const contact=swept(prev||origin,next,target,move.id==='screech'?19:14);
   prev=next;
   if(contact&&!checked){
    checked=true;
    if(Math.random()>(move.precisao/100)){
     this.destroy();return false;
    }
    const success=move.id==='sonic-boom'?
     surgeFixedHit(actor,target,move,extra):surgeTargetEffect(target,move);
    if(success){hitAt=age;hit=contact;}
    else{this.destroy();return false;}
   }
   return true;
  },
  destroy(){
   if(dead)return;dead=true;g.destroy();
  }
 };
 scene.efectos.push(fx);
 return fx;
}
export const SURGE3_FORMS=Object.fromEntries(
 SURGE3_MOVES.map(move=>[move.forma,(actor,h,extra={})=>
  cast(actor,{...move,...h},extra)]));
