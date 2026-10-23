/* Additive 24-move patch. Runtime uses the same actor/contact lifecycle as
 * Arena 2D, with authored pixel matrices; approved renderers are untouched. */
import {BATCH24_MOVES} from './catalog.js';
import {PALETTES,stamp,pixel,impact} from './pixels.js';
import {clashAt} from '../clash-fx.js';
import {contactDash} from '../early-route-fx.js';
import {aleatorio} from '../../azar.js';
const PI=Math.PI,clamp=n=>Math.max(0,Math.min(1,n));
const center=l=>({x:l.x,y:l.y-(l.alto||36)*.5});
export function swept(a,b,r,radius=10){
 if(!r||r.ko)return null;
 const c=center(r),dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 const t=den?clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/den):0;
 const p={x:a.x+dx*t,y:a.y+dy*t};
 return Math.hypot(p.x-c.x,p.y-c.y)<=radius+Math.min(12,(r.alto||36)*.22)?p:null;
}
function start(l,h){
 const a=Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+100)-l.x),o=center(l);
 l.animar(h.anim||'Shoot',h.fazContato?.72:.5,.13);
 l.accion={hasta:l.t+(h.fazContato?.68:.31),lento:h.fazContato?0:.6,angulo:a};
 return {...o,a,c:Math.cos(a),s:Math.sin(a)};
}
function lifecycle(l,loop,release){
 const scene=l.escena,g=scene.add.graphics().setDepth(1513);
 let dead=false;const fx={g,update(dt){
  if(dead)return false;
  if(l.ko||!loop(Math.max(0,Math.min(dt||0,.08)),g,fx)){fx.destroy();return false}
  return true;
 },destroy(){if(dead)return;dead=true;if(fx.clashBody)fx.clashBody.live=false;g.destroy();release?.()}};
 scene.efectos.push(fx);return fx;
}
function state(r,name,duration,data={}){if(!r.ko)r.ponerEstado?.(name,duration,data)}
// Arena durations and debuffs deliberately use existing native state names.
// Official power/accuracy/category remain metadata; dano is arena-normalized.
function secondary(l,r,h){
 const effect=h.secondary;
 if(effect==='slow')state(r,'lento',2.5,{f:.25});
 if(effect==='accuracy'){
  // Same native hit pipeline can consult this only for new attacks, avoiding
  // a monkey-patch of approved original attacks.
  state(r,'batch24Accuracy',4,{mult:.75});
 }
 if(effect==='spdef2'||effect==='spdef10'&&aleatorio()<.1)
  state(r,'defBaja',effect==='spdef2'?5:3);
 if(effect==='poison30'&&aleatorio()<.3&&!r.tipos?.some(t=>['POISON','STEEL'].includes(t)))
  r.envenenar?.({dps:1.2,dur:4},l);
 if(effect==='toxic50'&&aleatorio()<.5&&!r.tipos?.some(t=>['POISON','STEEL'].includes(t)))
  r.envenenar?.({dps:1.8,dur:6},l);
 if(effect==='icefang'){
  if(aleatorio()<.1&&!r.tipos?.includes('ICE'))state(r,'congelado',1.2);
  if(aleatorio()<.1)state(r,'aturdido',.18);
 }
 if(effect==='flinch20'&&aleatorio()<.2)state(r,'aturdido',.18);
 if(effect==='omni10'&&aleatorio()<.1)state(l,'potencia',4,{mult:1.12,vel:1.1,reduce:.1,color:0xe7d6b7});
}
function strike(l,r,h,extra,mult=1){
 const accuracy=(h.precisao??100)/100*(l.est?.batch24Accuracy?.mult??1);
 if(aleatorio()>accuracy)return {landed:false,damage:0};
 let scale=mult;
 if(h.secondary==='critical'&&aleatorio()<.125)scale*=1.5;
 if(h.secondary==='fury'){
  const c=l.__batch24Fury;
  scale*=c&&l.t-c.time<9?Math.min(4,c.mult*2):1;
 }
 const d=Math.hypot(r.x-l.x,r.y-l.y)||1,before=r.hp;
 const result=r.recibir(l,{dano:h.dano*scale,tipo:h.tipo,estado:'BATCH24_MANUAL',
  categoria:h.categoria,slot:extra?.slot,surge:extra?.surge,empuje:4,
  dirX:(r.x-l.x)/d,dirY:(r.y-l.y)/d});
 const damage=Math.max(0,before-r.hp),landed=result==='golpe'&&damage>0;
 if(landed){secondary(l,r,h);if(h.secondary==='fury')l.__batch24Fury={time:l.t,mult:scale};}
 else if(h.secondary==='fury')l.__batch24Fury=null;
 return {landed,damage};
}
export function drawMove(g,h,x,y,frame,angle=0){
 const p=PALETTES[h.palette],f=frame%12,s=h.style;
 const sprite=(shape,dx=0,dy=0,size=1,a=angle,alpha=1,flip=false)=>stamp(g,shape,x+dx,y+dy,p,size,a,alpha,flip);
 if(s==='mudshot'){sprite('pellet',0,0,1);for(let j=1;j<4;j++)sprite('drop',-Math.cos(angle)*(j*8+f%3),-Math.sin(angle)*(j*8+f%3),1,angle-PI/4,.7/j);}
 else if(s==='mudbomb'||s==='sludge'){sprite('glob',0,Math.sin(f*.6)*2,s==='sludge'?2:1);for(let j=0;j<3;j++)sprite('pellet',-Math.cos(angle)*(12+j*7),-Math.sin(angle)*(12+j*7)+j*3,1,0,.45);}
 else if(s==='acid'||s==='spray'){
  const n=s==='spray'?7:4;
  for(let j=0;j<n;j++){const d=(j-n/2)*6,b=s==='spray'?Math.sin(j*2.1+f*.25)*10:Math.sin(j+f*.3)*3;
   sprite('drop',Math.cos(angle)*d-Math.sin(angle)*b,Math.sin(angle)*d+Math.cos(angle)*b,1,angle-PI/4);}
 }
 else if(s==='pin'||s==='spear'||s==='shard'){
  sprite(s==='pin'?'needle':'shard',0,0,s==='spear'?2:1,angle-PI/4);
  for(let j=1;j<4;j++)pixel(g,x-Math.cos(angle)*(j*7+6),y-Math.sin(angle)*(j*7+6),p[3],2,.5/j);
 }
 else if(s==='megadrain'||s==='gigadrain'){
  sprite('sprout',0,0,1);const n=s==='gigadrain'?5:3;
  for(let j=0;j<n;j++){const a=j*2*PI/n+f*.4; sprite('leaf',Math.cos(a)*12,Math.sin(a)*8,1,a,.8);}
 }
 else if(s==='energy'){
  sprite('sprout',0,0,2);
  for(let j=0;j<4;j++){const a=j*PI/2+f*PI/6;sprite('leaf',Math.cos(a)*16,Math.sin(a)*12,1,a);}
  sprite('spark',0,0,1,0,.7);
 }
 else if(s==='dragon'){
  sprite('dragon',0,0,2,angle);sprite('crescent',-Math.cos(angle)*21,-Math.sin(angle)*21,1,angle,f%3===0?.4:.7);
 }
 else if(s==='darkpulse'){
  for(let j=0;j<3;j++)sprite('crescent',-Math.cos(angle)*(j*12),-Math.sin(angle)*(j*12),2,angle+(j%2?PI:0),1-j*.2);
 }
 else if(s==='ancient'){
  for(let j=0;j<3;j++){const a=j*PI*2/3+f*.25;sprite('rock',Math.cos(a)*13,Math.sin(a)*10,1,a*.2);}
  sprite('spark',0,0,1);
 }
 else if(s==='icywind'||s==='silverwind'){
  sprite('curl',0,0,2,angle);
  for(let j=0;j<5;j++){const d=j*9+f%4;sprite(s==='icywind'?'shard':'leaf',-Math.cos(angle)*d-Math.sin(angle)*Math.sin(j*2)*16,-Math.sin(angle)*d+Math.cos(angle)*Math.sin(j*2)*16,1,angle+j,.7);}
 }
 else if(s==='twister'){
  for(let j=0;j<4;j++){const a=f*.4+j*1.7;sprite('crescent',Math.sin(a)*(5+j*2),-j*10+12,1+(j>1?1:0),a,.85);}
  for(let j=0;j<4;j++)pixel(g,x+Math.sin(j*2+f)*19,y-25+j*12,p[3],2,.8);
 }
 else if(s==='fang'||s==='icefang'){
  const gap=[12,11,9,7,4,1,0,2,5,8,10,12][f];
  sprite('fang',Math.sin(angle)*gap,-Math.cos(angle)*gap,2,angle);
  sprite('fang',-Math.sin(angle)*gap,Math.cos(angle)*gap,2,angle,1,true);
  if(f>=5&&f<9)for(let j=0;j<3;j++)sprite(s==='icefang'?'shard':'drop',(j-1)*13,8+f,1,j*.8,.8);
 }
 else if(s==='jab'){sprite('needle',0,0,2,angle-PI/4);sprite('drop',-Math.cos(angle)*15,-Math.sin(angle)*15,1,angle);}
 else if(s==='fury'||s==='blade'||s==='slash'){
  const arc=angle-.9+f*.13;
  sprite(s==='blade'?'leaf':'slash',0,0,2,arc);
  if(f>3&&f<9)sprite('slash',-Math.cos(arc)*8,-Math.sin(arc)*8,1,arc-.3,.45);
 }
 else if(s==='earth'){
  // Opening crack followed by three narrow earthen pillars; height is
  // quantized in 12 poses, never a giant opaque circle hiding the actor.
  stamp(g,'crack',x,y+8,p,3);
  const rise=Math.max(0,Math.sin(Math.min(1,f/9)*PI));
  for(let j=0;j<3;j++){
   const xx=x+(j-1)*18,top=y+5-Math.round(rise*(j===1?42:28));
   for(let yy=y+4;yy>top;yy-=6)stamp(g,'rock',xx,yy,p,1,0);
   stamp(g,'shard',xx,top,p,1,-PI/4);
  }
 }
}
function projectile(l,h,extra){
 const o=start(l,h),p=PALETTES[h.palette],range=h.alcance;
 const count=h.secondary==='multi'?[2,2,2,3,3,3,4,5][Math.floor(aleatorio()*8)]:1;
 const shots=Array.from({length:count},(_,i)=>({delay:i*.12,prev:null,done:false,impact:null,refund:0}));
 let age=0,refundPaid=false,anyHit=false;
 const fx=lifecycle(l,(dt,g,self)=>{
  age+=dt;g.clear();let active=false;
  for(let i=0;i<shots.length;i++){
   const b=shots[i],t=age-b.delay-(h.secondary==='priority'?.035:.1);if(t<0){active=true;continue}
   if(b.impact){
    const since=age-b.impact.time;impact(g,b.impact.x,b.impact.y,p,since);
    if(b.refund>0&&since<.5){
     const k=clamp(since/.48),to=center(l);
     for(let j=0;j<3;j++){const q=clamp(k-j*.07);stamp(g,'leaf',b.impact.x+(to.x-b.impact.x)*q,b.impact.y+(to.y-b.impact.y)*q-Math.sin(q*PI)*18,p,1,q*PI);}
    }
    if(b.refund>0&&since>=.48&&!refundPaid&&!l.ko){l.hp=Math.min(l.hpMax,l.hp+b.refund);refundPaid=true;}
    if(since<.55)active=true;
    continue;
   }
   if(b.done)continue;
   const d=t*h.speed;if(d>range){b.done=true;self.clashBody.live=false;continue}
   active=true;
   const spread=count>1?(i-(count-1)/2)*.018:0,a=o.a+spread;
   const x=o.x+Math.cos(a)*(d+12),y=o.y+Math.sin(a)*(d+12);
   const tip={x,y},prev=b.prev||{x:o.x,y:o.y};b.prev=tip;
   self.clashBody={owner:l,type:h.tipo,radius:8,x,y,live:true};
   if(clashAt(l.escena,self,l,tip,8,h.tipo)){b.done=true;self.clashBody.live=false;continue}
   drawMove(g,h,x,y,Math.floor(t*24),a);
   const r=l.rival,contact=swept(prev,tip,r,['icywind','silverwind','twister','spray'].includes(h.style)?17:8);
   if(contact){
    b.done=true;self.clashBody.live=false;
    const result=strike(l,r,h,extra);anyHit||=result.landed;
    b.impact={...contact,time:age};b.refund=h.secondary==='drain'?result.damage*.5:0;
   }
  }
  if(!active&&h.secondary==='fury'&&!anyHit)l.__batch24Fury=null;
  return active&&age<3;
 });
 fx.clashBody={owner:l,type:h.tipo,radius:8,x:o.x,y:o.y,live:false};return fx;
}
function melee(l,h,extra){
 const o=start(l,h),p=PALETTES[h.palette],dash=contactDash(l,o,h.alcance-12,.21,.36,.65);
 let age=0,checked=false,contact=null,landed=false;
 return lifecycle(l,(dt,g)=>{
  age+=dt;g.clear();
  if(l.est?.aturdido)return false;
  dash.step(age);
  const c=center(l),x=c.x+o.c*17,y=c.y+o.s*17;
  if(age<.48)drawMove(g,h,x,y,Math.min(11,Math.floor(age/.04)),o.a);
  if(!checked&&age>=.22){
   checked=true;const target=l.rival;
   contact=swept(c,{x,y},target,12);
   if(contact)landed=strike(l,target,h,extra).landed;
   if(!landed&&h.secondary==='fury')l.__batch24Fury=null;
  }
  if(contact&&age>=.22)impact(g,contact.x,contact.y,p,age-.22);
  return age<.72;
 },()=>dash.release());
}
function earth(l,h,extra){
 const o=start(l,h),p=PALETTES[h.palette];
 const distance=Math.min(h.alcance,Math.hypot((l.ax??l.x)-l.x,(l.ay??l.y)-l.y));
 const point={x:o.x+o.c*distance,y:o.y+o.s*distance};
 let age=0,checked=false;
 return lifecycle(l,(dt,g)=>{
  age+=dt;g.clear();
  if(age<.27){
   stamp(g,'crack',point.x,point.y+12,p,2,0,.45+age);
   for(let j=0;j<4;j++)pixel(g,point.x+(j-1.5)*9,point.y+10-Math.sin(age*18+j)*3,p[3],2,.7);
  }else{
   drawMove(g,h,point.x,point.y,Math.min(11,Math.floor((age-.27)*24)));
   if(!checked&&age>=.36){checked=true;const r=l.rival;if(swept(point,point,r,22))strike(l,r,h,extra);}
   if(age>.42)impact(g,point.x,point.y,p,age-.42,2);
  }
  return age<.94;
 });
}
export const BATCH24_FORMS=Object.fromEntries(BATCH24_MOVES.map(def=>[def.forma,(l,h,extra={})=>{
 const move={...def,...h};
 if(move.secondary!=='fury')l.__batch24Fury=null;
 return move.fazContato?melee(l,move,extra):move.style==='earth'?earth(l,move,extra):projectile(l,move,extra);
}]));
