/* Pokémon Torre 2 — Toxic (TM06) status-only ink-cloud attack.
 * This is a NEW, unapproved visual pending user review, not a replacement
 * for Smog/Poison Sting or any frozen Poké Arena 2D renderer.
 * No HTML/Canvas2D overlays. Phaser WebGL Graphics only.
 */
import {applyGen3Status} from './torre2-gen3-status.js';
const PI=Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
const COL={edge:0x130c24,dark:0x351246,middle:0x78258e,hot:0xbc5bd4,shine:0xe7b4f2};
const pixel=(g,x,y,w,h,c,a=1)=>g.fillStyle(c,a).fillRect(
 Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
function contactSegment(a,b,foe){
 if(!foe||foe.ko||foe.hp<=0)return false;
 const tx=foe.x,ty=foe.y-(foe.alto??36)*.46;
 const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((tx-a.x)*dx+(ty-a.y)*dy)/Math.max(1,dx*dx+dy*dy));
 return Math.hypot(a.x+dx*t-tx,a.y+dy*t-ty)<Math.max(15,(foe.alto??36)*.42);
}
export function toxic(l,h,extra={}){
 const e=l.escena;
 if(!e?.add?.graphics||!Array.isArray(e.efectos))
  throw Error('Toxic requires an active native Phaser battle');
 const aura=e.add.graphics().setDepth(1514),
  dust=e.add.graphics().setDepth(1516);
 const angle=Math.atan2((l.ay??l.y)-(l.y-(l.alto??36)*.45),(l.ax??l.x)-l.x);
 const dir={x:Math.cos(angle),y:Math.sin(angle)};
 const origin={x:l.x+dir.x*15,y:l.y-(l.alto??36)*.45+dir.y*15};
 const speed=295,reach=Math.min(h.alcance??225,250);
 const projectile={x:origin.x,y:origin.y};
 const particles=Array.from({length:13},(_,i)=>({
  phase:(i*7%13)/13*PI*2,radius:5+i%4*3,spin:(i%2?1:-1)*(2+i%3)*.85
 }));
 let elapsed=0,last=origin,hitAt=-1,finished=false;
 const fx={update(dt){
  elapsed+=Math.max(0,Number(dt)||0);aura.clear();dust.clear();
  if(l.ko||l.est?.aturdido||elapsed>1.3){aura.destroy();dust.destroy();return false;}
  const travel=elapsed*speed;
  if(hitAt<0&&travel>reach){aura.destroy();dust.destroy();return false;}
  if(hitAt<0){
   projectile.x=origin.x+dir.x*travel;
   projectile.y=origin.y+dir.y*travel;
   const r=l.rival;
   if(contactSegment(last,projectile,r)){
    hitAt=elapsed;finished=true;
    // Gen III Toxic is 85% accurate and only affects the target on contact;
    // never replace an existing major status or poison Poison/Steel types.
    if(Math.random() < (h.precisao??85)/100)
     applyGen3Status(r,'toxic',{fuente:l});
   } else last={...projectile};
  }
  const cx=hitAt<0?projectile.x:l.rival?.x??projectile.x;
  const cy=hitAt<0?projectile.y:(l.rival?.y??projectile.y)-(l.rival?.alto??36)*.46;
  const age=hitAt<0?elapsed:elapsed-hitAt;
  const alpha=hitAt<0?Math.min(1,elapsed*12):1-clamp(age/.40);
  const swell=hitAt<0?1:1+age*1.5;
  if(alpha>0){
   // Black-rimmed violet pixel-art nucleus with bright toxic quadrants.
   const size=6*swell;
   pixel(aura,cx-size-2,cy-size-2,2*size+4,2*size+4,COL.edge,alpha*.83);
   pixel(aura,cx-size,cy-size,2*size,2*size,COL.middle,alpha);
   pixel(aura,cx-size+2,cy-size+2,Math.max(1,size*.85),Math.max(1,size*.8),COL.shine,alpha*.8);
   for(let i=0;i<particles.length;i++){
    const p=particles[i],t=p.phase+elapsed*p.spin;
    const radius=(p.radius+(hitAt<0?0:age*23))*swell;
    const x=cx+Math.cos(t)*radius,y=cy+Math.sin(t)*radius*.70;
    const q=i%3===0?COL.shine:i%2?COL.dark:COL.hot;
    pixel(dust,x-2,y-2,3+i%2,3+i%2,COL.edge,alpha*.70);
    pixel(dust,x-1,y-2,2+i%2,2+i%2,q,alpha);
   }
  }
  if(finished&&age>=.40){aura.destroy();dust.destroy();return false;}
  return true;
 }};
 e.efectos.push(fx);
 l.animar?.('Charge',.35,.16);
 return fx;
}
export const TORRE2_TOXIC_FORMS=Object.freeze({torre2_toxic:toxic});
