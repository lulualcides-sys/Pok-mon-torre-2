/* Pokémon Torre 2 — 3 adapted Kanto attacks.
 * Physical collision copied from established hand-drawn projectile and
 * Hyper Fang behaviour; sprites/palettes hand-authored in pixel matrices.
 * Additive only: NEVER edit native Poké Arena or approved attacks.
 * No Canvas2D, vectors, CSS effects, or PNG video sprites.
 */
import {clashAt} from './clash-fx.js';
const PI=Math.PI, clamp=n=>Math.max(0,Math.min(1,n)),round=n=>Math.round(n);
function rect(g,x,y,w,h,c,a=1){g.fillStyle(c,a).fillRect(round(x),round(y),Math.max(1,round(w)),Math.max(1,round(h)))}
function stamp(g,rows,cx,cy,palette,scale=2,alpha=1,flip=false){
 const h=rows.length,w=Math.max(...rows.map(r=>r.length));
 for(let y=0;y<h;y++)for(let x=0;x<rows[y].length;x++){
  const col=palette[rows[y][x]];if(col===undefined)continue;
  const px=flip?(w-1-x):x;
  rect(g,cx+(px-(w-1)/2)*scale,cy+(y-(h-1)/2)*scale,scale,scale,col,alpha);
 }
}
function layers(e){return[e.add.graphics().setDepth(1512),e.add.graphics().setDepth(1513)]}
function effect(e,loop,objs){
 let dead=false;
 const destroy=()=>{if(dead)return;dead=true;if(fx.clashBody)fx.clashBody.live=false;for(const g of objs)g.destroy()};
 const fx={update(dt){if(dead)return false;if(!loop(Math.min(.055,Math.max(dt||0,0)))){destroy();return false}return true},destroy};
 e.efectos.push(fx);return fx;
}
function origin(l){
 return{x:l.x,y:l.y-(l.alto||36)*.5};
}
function angle(l){return Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+100)-l.x)}
function aim(l,anim,seconds){
 const a=angle(l);
 l.animar(anim,seconds,.13);
 l.accion={hasta:l.t+seconds*.78,lento:.60,angulo:a};
 return a;
}
function collision(a,b,r,radius=14){
 if(!r||r.ko)return null;
 const rx=r.x,ry=r.y-(r.alto||36)*.5;
 const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy||1;
 const p=clamp(((rx-a.x)*dx+(ry-a.y)*dy)/len);
 const x=a.x+dx*p,y=a.y+dy*p;
 return Math.hypot(x-rx,y-ry)<=Math.max(radius,(r.alto||36)*.31)?{x,y}:null;
}
function strike(l,r,h,extra,damage,push=8,opts={}){
 const before=r.hp;
 const dx=r.x-l.x,dy=r.y-l.y,dist=Math.hypot(dx,dy)||1;
 const result=r.recibir(l,{
  dano:damage,tipo:h.tipo,slot:extra?.slot,surge:extra?.surge,
  dirX:dx/dist,dirY:dy/dist,empuje:push,...opts
 });
 return{landed:result==='golpe'&&(!Number.isFinite(before)||r.hp<before),damage:Math.max(0,before-r.hp)};
}
const MUD_PALETTE={K:0x282834,D:0x534136,M:0x8b6544,S:0xb68a59,L:0xd6ac76,W:0xf0cea0};
const MUD_PELLET=[
 '.....KKK.....',
 '...KKDMKK....',
 '..KDDMMMMK...',
 '.KDDMMSMMLK..',
 'KDDMMSSSLMLK.',
 'KDMSSSLWSSLK.',
 'KDMSSSSSLMMK.',
 '.KDMMMSSMMK..',
 '..KDDMMMMK...',
 '...KKMMKK....',
 '.....KKK.....'
];
const MUD_SPLASH=[
 '.........K........',
 '...K.....K....K...',
 '..KDK....DK..KSK..',
 '..KMDK...DM.KSLK..',
 '..KMMKK.KDMKMMK...',
 '...KMMMKMMSMMK....',
 '...KKMMSLLSMMKK...',
 '....KMSSSSSMK.....',
 '....KKMMMMKK......',
 '......KKKK........'
];
const DUST=[
 '..K...','.KDK..','KMDMK.','.KSK..','..K...'
];
// Three tiny hand-pixeled mud splashes, separate from the original 5 drops.
// No physics/collision change, particles spawn ONLY on damaging contact.
const MUD_MICRO_SPLASH=[
 '..K.', '.KMK','KMSK','.KK.'
];
// MUD-SLAP: adapted simple native sludge-arc impact into a 10-frame
// SMALL aimed mud pellet with brown droplets + 0.27s pixel splash.
// Actual projectile contact can fail. No giant sludge cloud or poison.
export function mudslap(l,h,extra){
 const e=l.escena,[proj,sparks]=layers(e),r=l.rival;
 const a=aim(l,'Throw',.65),ux=Math.cos(a),uy=Math.sin(a);
 const start=origin(l),sx=start.x+ux*12,sy=start.y;
 const max=Math.min(h.alcance??205,225),speed=300;
 let age=0,prev={x:sx,y:sy},impact=null,didHit=false;
 const body={owner:l,type:h.tipo||'GROUND',radius:12,x:sx,y:sy,live:true};
 const fx=effect(e,dt=>{
  age+=dt;proj.clear();sparks.clear();
  if(l.ko||l.est?.aturdido||age>1.08)return false;
  if(!impact){
   const dist=age*speed;
   if(dist>=max)return false;
   const tip={x:sx+dist*ux,y:sy+dist*uy};
   body.x=tip.x;body.y=tip.y;
   if(clashAt(e,fx,l,tip,12,h.tipo||'GROUND'))return false;
   const on=collision(prev,tip,r,12);prev=tip;
   if(on){
    const result=strike(l,r,h,extra,h.dano??4,13);
    didHit=result.landed;
    // Mud-Slap: Accuracy -1 stage on a successful damaging hit.
    // Stages persist through this fight (unless switched), capped at -6.
    if(didHit&&r.est){
     const old=r.est.torre2MudAccuracy?.stacks??0;
     r.est.torre2MudAccuracy={stacks:Math.min(6,old+1)};
    }
    body.live=false;
    impact={x:on.x,y:on.y,at:age};
   }else{
    // Two original-inspired shades of uneven mud, 10-frame tumbling.
    const rotate=Math.floor(age*19)%2;
    stamp(proj,MUD_PELLET,tip.x,tip.y,MUD_PALETTE,1.6,1,!!rotate);
    for(let j=1;j<4;j++){
     const d=dist-j*13;if(d<0)continue;
     const x=sx+ux*d-uy*Math.sin(age*11+j)*4;
     const y=sy+uy*d+ux*Math.sin(age*11+j)*4;
     // Preserve the original speed and size; three faint, short trail flecks.
     stamp(sparks,DUST,x,y,MUD_PALETTE,j===1?.9:.7,.78-j*.13);
    }
   }
  }
  if(impact&&didHit){
   const t=clamp((age-impact.at)/.27);
   if(t<1){
    // Widen the APPROVED original splash by 12.5% without changing
    // the main pellet's scale, launch timing, power, PP or hit detection.
    stamp(proj,MUD_SPLASH,impact.x,impact.y,MUD_PALETTE,1.8,1-t);
    for(let i=0;i<5;i++){
     const rad=4+t*(11+i%3*4),th=(i/5)*2*PI;
     stamp(sparks,DUST,impact.x+Math.cos(th)*rad,
      impact.y+Math.sin(th)*rad*.65,MUD_PALETTE,1,1-t);
    }
    // Three additional uneven SIDE splashes, each drawn as a tiny
    // 4x4 pixel matrix. Brief lateral arcs, no generic circles.
    for(let i=0;i<3;i++){
     const side=i-1;
     const lateral=side*(7+17*t);
     const lift=Math.sin(t*PI)*(7+(i===1?5:2));
     const x=impact.x+(-uy)*lateral-ux*(2+4*t);
     const y=impact.y+ux*lateral-uy*(2+4*t)-lift;
     stamp(sparks,MUD_MICRO_SPLASH,x,y,MUD_PALETTE,.85,1-t);
    }
   }
  }
  return impact?age<impact.at+.29:true;
 },[proj,sparks]);
 fx.clashBody=body;
 return fx;
}
const SEED_PAL={K:0x1b3329,D:0x395333,G:0x618846,L:0x9abc60,W:0xe7efae,A:0x9b7045};
const BOMB=[
 '......KKK.......',
 '....KKDDDKK.....',
 '...KDDGGDDK.....',
 '..KDGLLGGGDK....',
 '.KDGLLWLLGGDK...',
 'KDGLLWLLLGGGK...',
 'KDGGLWLLGGGDK...',
 'KDDGGLLLGGGDDK..',
 '.KDDGGGGGGDDK...',
 '..KKDDGGDDDK....',
 '....KKDDDKK.....',
 '......KKK.......'
];
const BOMB_CRACK=[
 '......KKK.......',
 '....KKDDDKK.....',
 '...KDDGAGDK.....',
 '..KDGGAGGGDK....',
 '.KDGLWAAAGGDK...',
 'KDGLLWAAGGGGK...',
 'KDGLLWAAAGGDK...',
 'KDDGGAAAGGGDDK..',
 '.KDDGGAAGGDDK...',
 '..KKDDAGDDDK....',
 '....KKDDDKK.....',
 '......KKK.......'
];
const SHARD=[
 '...K....','..KDK...','.KDGGK..','KDGWLK..',
 '.KGLK...','..KK....'
];
const SEED_SPARK=[
 '..K...','.KGK..','KGLGK.','.KWK..','..K...'
];
// Tiny splintered shell pieces; these are NOT additional hits or projectiles.
const SEED_SHELL_CHIP=[
 '..K...', '.KDK..', 'KDGK..', '.KK...'
];
// Readable pale interior of a freshly split seed: short, pixel-only flash.
const SEED_CORE=[
 '..K..','.KLGK','KLLWK','.KLLK','..K..'
];
// SEED BOMB: Bullet Seed's hand-inked seed silhouette enlarged into one
// projectile, Egg Bomb-style delayed crack + just six small seed fragments.
// Aiming is fixed at cast and damage fires ON physical contact only.
export function seedbomb(l,h,extra){
 const e=l.escena,[body,shards]=layers(e),r=l.rival;
 const a=aim(l,'Throw',.75),ux=Math.cos(a),uy=Math.sin(a);
 const pos=origin(l),start={x:pos.x+ux*14,y:pos.y};
 const max=Math.min(h.alcance??225,250),speed=260;
 let age=0,prev=start,impact=null,didHit=false;
 const collisionBody={owner:l,type:h.tipo||'GRASS',radius:13,x:start.x,y:start.y,live:true};
 const fx=effect(e,dt=>{
  age+=dt;body.clear();shards.clear();
  if(l.ko||l.est?.aturdido||age>1.4)return false;
  if(!impact){
   const distance=age*speed;
   if(distance>=max)return false;
   const tip={x:start.x+ux*distance,y:start.y+uy*distance};
   collisionBody.x=tip.x;collisionBody.y=tip.y;
   if(clashAt(e,fx,l,tip,13,h.tipo||'GRASS'))return false;
   const on=collision(prev,tip,r,13);prev=tip;
   if(on){
    const result=strike(l,r,h,extra,h.dano??16,22);
    didHit=result.landed;collisionBody.live=false;impact={x:on.x,y:on.y,at:age};
   }else{
    const frame=Math.floor(age*22)%3;
    // Keep seed INTACT in flight: the crack opens only ON impact.
    stamp(body,BOMB,tip.x,
     tip.y+Math.sin(age*17)*1.5,SEED_PAL,1.8,1,frame===1);
    for(let k=1;k<=3;k++){
     const d=distance-k*12;if(d<0)continue;
     const x=start.x+ux*d-uy*(k%2?3:-3),y=start.y+uy*d+ux*(k%2?3:-3);
     stamp(shards,SEED_SPARK,x,y,SEED_PAL,.8,.65-k*.12);
    }
   }
  }
  if(impact&&didHit){
   const t=clamp((age-impact.at)/.34);
   if(t<1){
    // Impact opens a noticeable crack for ~0.14s (not during flight).
    // Single short pale-green interior flash reveals the seed actually split.
    if(t<.41){
     const crackAlpha=t<.20?1:(.41-t)/.21;
     stamp(body,BOMB_CRACK,impact.x,impact.y,SEED_PAL,1.8,crackAlpha);
    }
    if(t>=.12&&t<.29){
     const glow=Math.sin(((t-.12)/.17)*PI);
     stamp(shards,SEED_CORE,impact.x,impact.y,SEED_PAL,1.15,glow);
    }
    // Preserve the original six shell shards and add three tiny,
    // staggered chips for a dry seed 'pop', without extra damage.
    for(let i=0;i<6;i++){
     const phi=(i*2*PI)/6+.15,dist=5+t*(14+i%2*5);
     stamp(shards,SHARD,
      impact.x+Math.cos(phi)*dist,impact.y+Math.sin(phi)*dist*.75,
      SEED_PAL,1.1,1-t,i%2===0);
    }
    for(let i=0;i<3;i++){
     const travel=clamp((t-i*.065)/.81);
     const phi=(i*2*PI)/3+.75,dist=3+20*travel;
     stamp(shards,SEED_SHELL_CHIP,
      impact.x+Math.cos(phi)*dist,impact.y+Math.sin(phi)*dist*.8,
      SEED_PAL,.85,1-travel,i===1);
    }
   }
  }
  return impact?age<impact.at+.37:true;
 },[body,shards]);
 fx.clashBody=collisionBody;
 return fx;
}
// The following jaw matrices mirror the ALREADY APPROVED Hyper Fang art.
// They are copied into this separate module; Hyper Fang source is untouched.
// Super Fang has a shorter lunge, more restrained sparkle and DIFFERENT damage.
const JAW_COL={K:0x162337,D:0x805344,O:0xc78259,L:0xffc78a,W:0xffffff};
const JAW_TOP=[
 '....KKKKKKKKKKK.....',
 '..KKDDDDDDDDDDKK....',
 '.KDDOOOOOOLLLDDDK...',
 'KDDOOOLLLLLLLLLDDK..',
 'KDDOLLWWWLLWWWLLDDK.',
 'KDDOOLLWWLLWWLLDDK.',
 '.KDDDDKWWDDKWWDDDK..',
 '..KKKK.KWKK.KWKKK...'
];
const JAW_BOTTOM=JAW_TOP.slice().reverse();
const INCISOR=[
 '..KKKK..','.KWWLLK.','KWWWWLLK','KWWWWLLK','KWWWWLLK',
 'KWWWWLLK','KWWWWLLK','.KWWWLK.','.KWWWWK.','..KKKK..'
];
const BITE_FLASH=[
 '.....K.....','...KKWKK...','..KWWW W K..'.replace(/ /g,''),
 '.KWWLW LWWK'.replace(/ /g,''),
 'KWWWLWLWWWK','KWWWLWLWWWK',
 '.KWWLW LWWK'.replace(/ /g,''),'..KWWW W K..'.replace(/ /g,''),
 '...KKWKK...','.....K.....'
];
const FLASH_PAL={K:0x3d2736,W:0xfff0d0,L:0xffc072};
// SUPER FANG: genuine Normal-type contact bite. No projectile, no autoaim.
// Fixed damage = floor(target's CURRENT HP / 2), as in Pokémon games.
// No KO from full HP by itself (1-HP minimum when target has 1 HP).
export function superfang(l,h,extra){
 const e=l.escena,[jaw,flashes]=layers(e),r=l.rival;
 const a=aim(l,'Swing',.62),ux=Math.cos(a),uy=Math.sin(a);
 const pos=origin(l),reach=Math.min(h.alcance??82,87);
 const nx=-uy,ny=ux;
 let age=0,resolved=false,hitAt=-1,contactPt=null,landed=false;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flashes.clear();
  if(l.ko||l.est?.aturdido||age>.76)return false;
  const progress=clamp((age-.06)/.34);
  const dist=reach*progress;
  const cx=pos.x+ux*(8+dist),cy=pos.y+uy*(8+dist);
  const close=clamp((age-.17)/.16),spread=(1-close)*7;
  const opacity=Math.min(1,age*12)*clamp((.74-age)*8);
  if(age<.58){
   // Same approved Hyper Fang jaw silhouette, two large real incisors,
   // but with a tighter stroke, and NO generic circular cut.
   stamp(jaw,JAW_TOP,cx-ux*14-nx*spread,cy-uy*14-ny*spread-8,
     JAW_COL,1.6,opacity);
   stamp(jaw,JAW_BOTTOM,cx-ux*14+nx*spread,cy-uy*14+ny*spread+8,
     JAW_COL,1.6,opacity);
   if(age<.41){
    stamp(jaw,INCISOR,cx+ux*4-nx*(9+spread),
     cy+uy*4-ny*(9+spread),JAW_COL,1.4,opacity);
    stamp(jaw,INCISOR,cx+ux*4+nx*(9+spread),
     cy+uy*4+ny*(9+spread),JAW_COL,1.4,opacity);
   }
  }
  if(!resolved&&age>=.29){
   resolved=true;
   const old=pos;
   // The bite reaches only the manually aimed 90px melee segment.
   const c=collision(old,{x:cx+ux*16,y:cy+uy*16},r,13);
   const ghost=Array.isArray(r?.tipos)&&r.tipos.includes('GHOST');
   // Super Fang retains native 90% accuracy in addition to actual reach.
   if(c&&r&&!r.ko&&!ghost&&!r.invulnerable&&!r.est?.vuelo
      &&Number.isFinite(r.hp)&&r.hp>0
      &&Math.random()<((h.precisao??90)/100)){
    contactPt=c;
    const damage=Math.max(1,Math.floor(r.hp*.5));
    // Pure fixed damage has no unintended multipliers: actual half current HP.
    const done=strike(l,r,{...h,tipo:'NORMAL'},extra,damage,19,{puro:true});
    landed=done.landed;hitAt=age;
   }
  }
  if(landed&&age-hitAt<.24){
   const fade=clamp(1-(age-hitAt)/.24);
   stamp(flashes,BITE_FLASH,contactPt.x,contactPt.y,
    FLASH_PAL,1.5,fade);
   for(let i=0;i<4;i++){
    const th=a+PI/4+i*PI/2,rad=7+(1-fade)*12;
    stamp(flashes,SEED_SPARK,contactPt.x+Math.cos(th)*rad,
     contactPt.y+Math.sin(th)*rad,FLASH_PAL,1,fade);
   }
  }
  return true;
 },[jaw,flashes]);
}
export const TORRE2_ADAPTED_FORMS=Object.freeze({
 torre2_mudslap:mudslap,torre2_seedbomb:seedbomb,torre2_superfang:superfang
});
