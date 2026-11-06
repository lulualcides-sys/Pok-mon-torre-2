/* Pokémon Torre 2 — early-route pixel attacks.
 * Approved (frozen): Gust and Poison Sting. Bite/Crunch under visual revision. Entirely new VFX, no client-original or
 * approved VFX altered. Phaser Graphics/WebGL; matrices, not circles/CSS.
 * Directional manual aiming, real hitbox, no auto-hit or extra damage.
 */
import {clashAt} from './clash-fx.js';
const PI=Math.PI, clamp=n=>Math.max(0,Math.min(1,n)),round=Math.round;
const ink=(g,x,y,size,color,alpha=1)=>g.fillStyle(color,alpha).fillRect(round(x),round(y),Math.max(1,round(size)),Math.max(1,round(size)));
function sprite(g,shape,cx,cy,colors,scale=1,alpha=1,angle=0){
 const width=Math.max(...shape.map(s=>s.length)),height=shape.length;
 const ca=Math.cos(angle),sa=Math.sin(angle);
 for(let y=0;y<height;y++)for(let x=0;x<shape[y].length;x++){
  const col=colors[shape[y][x]];
  if(col===undefined)continue;
  const dx=(x-(width-1)/2)*scale,dy=(y-(height-1)/2)*scale;
  ink(g,cx+dx*ca-dy*sa,cy+dx*sa+dy*ca,scale,col,alpha);
 }
}
function effect(e,cycle,parts){
 let dead=false;
 const fx={update(dt){
  if(dead)return false;
  if(cycle(Math.min(.05,Math.max(0,dt||0))))return true;
  this.destroy();return false;
 },destroy(){
  if(dead)return;dead=true;
  if(fx.clashBody)fx.clashBody.live=false;
  for(const p of parts)p.destroy();
 }};
 e.efectos.push(fx);return fx;
}
function start(l,name,duration=.4){
 const a=Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+120)-l.x);
 l.animar(name,duration,.13);
 l.accion={hasta:l.t+duration*.7,lento:.7,angulo:a};
 return{x:l.x,y:l.y-(l.alto||36)*.5,a,c:Math.cos(a),s:Math.sin(a)};
}
function intersect(before,after,r,radius){
 if(!r||r.ko)return null;
 const cx=r.x,cy=r.y-(r.alto||36)*.5,dx=after.x-before.x,dy=after.y-before.y;
 const len=Math.max(1,dx*dx+dy*dy),k=clamp(((cx-before.x)*dx+(cy-before.y)*dy)/len);
 const x=before.x+dx*k,y=before.y+dy*k;
 return Math.hypot(x-cx,y-cy)<=Math.max(radius,(r.alto||36)*.31)?{x,y}:null;
}
function strike(l,r,h,extra,opts={}){
 const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1,old=r.hp;
 const hit=r.recibir(l,{dano:h.dano??8,tipo:h.tipo,
  slot:extra?.slot,surge:extra?.surge,
  dirX:dx/d,dirY:dy/d,empuje:opts.push??12,...opts.status});
 return hit==='golpe'&&(!Number.isFinite(old)||r.hp<old);
}
const WIND={K:0x1a344c,D:0x467394,M:0x77afcb,L:0xb6e4ee,W:0xf2fbfc};
const WIND_CURL=[
 '.........KKKKK...........',
 '......KKKDDDDDKKK.......',
 '....KKDMMMMMLLMMKK......',
 '...KDMLLWWWWLLMMDK......',
 '..KDMWLLL...KLWMDDK.....',
 '.KDMLW......KMLWWMDK....',
 '.KMLL.....KKLWDMLDK.....',
 'KDLW......KMLLDMDDK.....',
 'KDLW......KMWWLLDK......',
 '.KMLL.....KDDDDKK.......',
 '..KKLMMKKKDDD...K.......',
 '....KKKDDDD...KK........',
 '.......KKKKKKK..........'
];
const WIND_BLADE=[
 '.....KKK........',
 '...KKDMLKK......',
 '.KKMLLWWLKK.....',
 'KDLLWWWWLLDK....',
 '.KDLLLMMLLDK....',
 '...KKDMMMMKK....',
 '......KKKK......'
];
const WIND_FLECK=['..K..','.KML.','KMLWK','.KKK.'];
const WIND_IMPACT=[
 '..........K..........',
 '.....K...KMK...K.....',
 '..KKMLK.KLWL.KLMKK...',
 '.KMLLWKWWLWKWWLMLDK..',
 'KMLWWWLLWWLLWWWLMDLK.',
 '.KMLLWKWWLWKWWLMLDK..',
 '..KKMLK.KLWL.KLMKK...',
 '.....K...KMK...K.....',
 '..........K..........'
];
// Gust = one moving, curled FLYING wind pulse, not an energy orb.
// 12 directional poses + a short ruffled feathery impact.
export function gust(l,h,extra){
 const e=l.escena,r=l.rival,main=e.add.graphics().setDepth(1512),trail=e.add.graphics().setDepth(1513);
 const o=start(l,'Shoot',.46),max=Math.min(h.alcance??235,255),speed=340;
 const first={x:o.x+o.c*12,y:o.y+o.s*12},hitbox={owner:l,type:'FLYING',radius:15,x:first.x,y:first.y,live:true};
 let age=0,prev=first,impact=null,hit=false;
 const fx=effect(e,dt=>{
  age+=dt;main.clear();trail.clear();
  if(l.ko||l.est?.aturdido||age>1.25)return false;
  if(!impact){
   const dist=age*speed;if(dist>=max)return false;
   const tip={x:first.x+o.c*dist,y:first.y+o.s*dist};
   hitbox.x=tip.x;hitbox.y=tip.y;
   if(clashAt(e,fx,l,tip,15,'FLYING'))return false;
   const contact=intersect(prev,tip,r,15);prev=tip;
   if(contact){
    hitbox.live=false;
    const power=r?.est?.vuelo?2:1;
    hit=strike(l,r,{...h,dano:(h.dano??8)*power},extra,{push:13});
    impact={...contact,t:age};
   }else{
    const frame=Math.floor(age*20)%12,angle=o.a+(frame%4-1.5)*.036;
    sprite(main,frame%3?WIND_CURL:WIND_BLADE,tip.x,tip.y,WIND,.82,1,angle);
    for(let k=1;k<=3;k++){
     const d=dist-k*12;if(d<0)continue;
     const sideways=(k%2?1:-1)*(4+Math.sin(age*25+k)*2);
     sprite(trail,WIND_FLECK,first.x+o.c*d-o.s*sideways,
      first.y+o.s*d+o.c*sideways,WIND,.8,Math.max(0,.7-k*.16),o.a);
    }
   }
  }
  if(impact&&hit){
   const t=clamp((age-impact.t)/.29);
   if(t<1){
    sprite(main,WIND_IMPACT,impact.x,impact.y,WIND,1.35,(1-t),o.a);
    for(let i=0;i<5;i++){
     const theta=o.a+i*2*PI/5,d=6+t*(13+i%2*5);
     sprite(trail,WIND_FLECK,impact.x+Math.cos(theta)*d,
      impact.y+Math.sin(theta)*d,WIND,.7,1-t);
    }
   }
  }
  return impact?age<impact.t+.32:true;
 },[main,trail]);
 fx.clashBody=hitbox;return fx;
}
const STING={K:0x25172d,D:0x70437d,M:0xad68ac,L:0xdfa8e1,W:0xf9e6f6};
const NEEDLE=[
 '..................K',
 '...............KKDK',
 'KKKKKKKDDDDKKKMLWK',
 'KDDDMMMMMLLLLWWWWWK',
 'KKKKKKKDDDDKKKMLWK',
 '...............KKDK',
 '..................K'
];
const BARB=['....K..','..KKDK.','KKMLLWK','..KDDK.','....K..'];
const STING_IMPACT=[
 '.....K.....',
 '...KKMK....',
 '.KKMLLKK...',
 'KMLLWWLMDK.',
 '.KKMLLKK...',
 '...KKMK....',
 '.....K.....'
];
// Poison Sting = ONE thin pointed barb, 30% chance of poison only on
// a damaging contact. No extra hits from its tiny trail/impact.
export function poisonsting(l,h,extra){
 const e=l.escena,r=l.rival,main=e.add.graphics().setDepth(1513),motes=e.add.graphics().setDepth(1512);
 const o=start(l,'Shoot',.42),max=Math.min(h.alcance??235,260),speed=430;
 const first={x:o.x+o.c*13,y:o.y+o.s*13},body={owner:l,type:'POISON',radius:6,x:first.x,y:first.y,live:true};
 let age=0,prev=first,impact=null,hit=false;
 const fx=effect(e,dt=>{
  age+=dt;main.clear();motes.clear();
  if(l.ko||l.est?.aturdido||age>1.0)return false;
  if(!impact){
   const dist=age*speed;if(dist>=max)return false;
   const tip={x:first.x+o.c*dist,y:first.y+o.s*dist};
   body.x=tip.x;body.y=tip.y;
   if(clashAt(e,fx,l,tip,6,'POISON'))return false;
   const on=intersect(prev,tip,r,9);prev=tip;
   if(on){
    body.live=false;
    const immune=Array.isArray(r?.tipos)&&r.tipos.some(x=>x==='POISON'||x==='STEEL');
    const poison=!immune&&Math.random()<.30;
    hit=strike(l,r,h,extra,{push:8,
     status:poison?{veneno:{dps:1.2,dur:4}}:{}});
    impact={...on,t:age};
   }else{
    sprite(main,NEEDLE,tip.x,tip.y,STING,1.15,1,o.a);
    for(let k=1;k<=2;k++){
     const d=dist-k*13;if(d<0)continue;
     sprite(motes,BARB,first.x+o.c*d,first.y+o.s*d,STING,.55,.6-k*.16,o.a);
    }
   }
  }
  if(impact&&hit){
   const t=clamp((age-impact.t)/.19);
   if(t<1)sprite(main,STING_IMPACT,impact.x,impact.y,STING,1.25,1-t,o.a);
  }
  return impact?age<impact.t+.23:true;
 },[main,motes]);
 fx.clashBody=body;return fx;
}

/* Hand-pixeled jaw silhouette inspired by the approved 8-frame Bite sheet.
 * Phaser/WebGL graphics only: no Canvas 2D, CSS or pasted video sprites.
 * The two jaw halves move separately and meet at the contact frame.
 */
const BITE={K:0x161621,D:0x49444d,M:0x948781,L:0xd7cec0,W:0xfff9e9};
const JAW_UP=[
 '.........KKKKKKKKK.........',
 '......KKKDDDDDDDDDKKK......',
 '....KKDDMMMMMMMMMDDKK......',
 '...KDDMMLLLLLLLLLMMDDK.....',
 '..KDDMLLWWWWWWWWWLLMDDK....',
 '.KDDMLWWWWWWWWWWWWWLMDDK...',
 'KDDMLWWWWWWWWWWWWWWWLMDDK..',
 'KDMWWWWWWWWWWWWWWWWWWWMDK..',
 '.KKWWKWWKWWKWWKWWKWWKKK...',
 '...KWWKWWKWWKWWKWWKWWK....',
 '....K..K..K..K..K..K.K.....'
];
// Pad symmetrically before pixel drawing so the arch never drifts sideways.
const JAW_WIDTH=Math.max(...JAW_UP.map(row=>row.length));
for(let i=0;i<JAW_UP.length;i++){
 const pad=JAW_WIDTH-JAW_UP[i].length;
 JAW_UP[i]='.'.repeat(Math.floor(pad/2))+JAW_UP[i]+'.'.repeat(Math.ceil(pad/2));
}
const JAW_DOWN=JAW_UP.slice().reverse();
const BITE_SHOCK=[
 '.....K.....',
 '...KWWK....',
 '.KWWLLWWK..',
 'KWWLWWLWWK.',
 '.KWWLLWWK..',
 '...KWWK....',
 '.....K.....'
];
// Eight discrete pixel-art poses; frame four closes on the opponent.
export const CHOMP_POSES=Object.freeze([13,11,8,5,1,2,6,10]);
function paintChomp(g,cx,cy,rotation,frame,opacity=1,scale=1.08){
 const idx=Math.min(7,Math.max(0,frame|0));
 const spread=CHOMP_POSES[idx]*scale,ox=-Math.sin(rotation),oy=Math.cos(rotation);
 sprite(g,JAW_UP,cx-ox*spread,cy-oy*spread,BITE,scale,opacity,rotation);
 sprite(g,JAW_DOWN,cx+ox*spread,cy+oy*spread,BITE,scale,opacity,rotation);
}
function mouthFlash(g,contact,age,rotation){
 const t=clamp(age/.16);
 if(t<1)sprite(g,BITE_SHOCK,contact.x,contact.y,BITE,1.1,1-t,rotation);
}

// Shared manual-aim contact movement. The Pokémon itself lunges and retreats;
// approved Bite/Crunch matrices are not changed or turned into projectiles.
export function contactDash(l,o,reach,advanceAt,retreatAt,finishAt){
 let moved=0;const distance=Math.min(74,Math.max(0,reach));
 const ease=x=>Math.sin(clamp(x)*PI/2);
 return {step(t){
  const goal=t<advanceAt?distance*ease(t/advanceAt):t<retreatAt?distance:
   distance*(1-ease((t-retreatAt)/(finishAt-retreatAt)));
  const x=l.x,y=l.y,d=goal-moved;
  l.x+=o.c*d;l.y+=o.s*d;l.limitar?.();
  moved+=(l.x-x)*o.c+(l.y-y)*o.s;
 },release(){
  if(moved>.01){l.x-=o.c*moved;l.y-=o.s*moved;l.limitar?.();moved=0;}
 }};
}
function physicalHit(l,o,r,radius=14){
 const x=l.x,y=l.y-(l.alto||36)*.5;
 return intersect({x:x-o.c*9,y:y-o.s*9},{x:x+o.c*17,y:y+o.s*17},r,radius);
}
export function bite(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.85),reach=Math.min(76,h.alcance??76);
 l.accion.hasta=l.t+.83;l.accion.lento=0;
 const dash=contactDash(l,o,reach-10,.23,.43,.75);
 let age=0,resolved=false,hit=null,hitAt=0;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.83){dash.release();return false;}
  dash.step(age);
  const frame=Math.min(7,Math.floor(clamp((age-.09)/.41)*8));
  const cx=l.x+o.c*13,cy=l.y-(l.alto||36)*.5+o.s*13;
  if(age<.66)paintChomp(jaw,cx,cy,0,frame,clamp((.66-age)/.12),1.08);
  if(!resolved&&age>=.28){
   resolved=true;
   const on=physicalHit(l,o,r);
   if(on&&strike(l,r,h,extra,{push:17,status:Math.random()<.30?{aturde:.32}:{}})){
    hit=on;hitAt=age;
   }
  }
  if(hit)mouthFlash(flash,hit,age-hitAt,0);
  return true;
 },[jaw,flash]);
}
export function crunch(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',1.12),reach=Math.min(80,h.alcance??80);
 l.accion.hasta=l.t+1.09;l.accion.lento=0;
 const dash=contactDash(l,o,reach-11,.23,.77,1.03);
 const rotations=[0,PI/2],resolved=[false,false],bursts=[null,null];
 let age=0,landed=false;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>1.09){dash.release();return false;}
  dash.step(age);
  const turn=age<.43?0:1,elapsed=age-turn*.43;
  const frame=Math.min(7,Math.floor(clamp((elapsed-.09)/.34)*8));
  const cx=l.x+o.c*13,cy=l.y-(l.alto||36)*.5+o.s*13;
  if(age<.86)paintChomp(jaw,cx,cy,rotations[turn],frame,clamp((.88-age)/.12),1.16);
  if(!resolved[turn]&&elapsed>=.29){
   resolved[turn]=true;const on=physicalHit(l,o,r,15);
   if(on){
    const struck=landed||strike(l,r,h,extra,{push:21});
    if(struck){landed=true;bursts[turn]={contact:on,time:age};}
   }
  }
  for(let i=0;i<2;i++)if(bursts[i])
   mouthFlash(flash,bursts[i].contact,age-bursts[i].time,rotations[i]);
  return true;
 },[jaw,flash]);
}
const PECK_PAL={K:0x222431,D:0x825833,M:0xca8b3e,L:0xf0c061,W:0xffedaf};
const SMALL_BEAK=[
 '...........KK',
 '.........KKLK',
 '.......KKLWWK',
 '....KKLLWWMK.',
 '..KKDMLWWMK..',
 '.KDMMMLWMK...',
 'KDDMMMKK.....',
 '.KKKKK.......'
],BEAK_FLASH=['....K....','..KLLK...','KLLWWLLK.','..KLLK...','....K....'];
export function peck(l,h,extra){
 const e=l.escena,r=l.rival,beak=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.68),reach=Math.min(76,h.alcance??76);
 l.accion.hasta=l.t+.65;l.accion.lento=0;
 const dash=contactDash(l,o,reach-9,.18,.33,.57);
 let age=0,checked=false,hit=null,at=0;
 return effect(e,dt=>{
  age+=dt;beak.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.66){dash.release();return false;}
  dash.step(age);
  const x=l.x+o.c*14,y=l.y-(l.alto||36)*.5+o.s*14;
  if(age<.48)sprite(beak,SMALL_BEAK,x,y,PECK_PAL,age<.18?.86:1.03,clamp((.50-age)/.10),o.a);
  if(!checked&&age>=.22){
   checked=true;const on=physicalHit(l,o,r,13);
   if(on&&strike(l,r,h,extra,{push:8})){hit=on;at=age;}
  }
  if(hit&&age-at<.15)sprite(flash,BEAK_FLASH,hit.x,hit.y,PECK_PAL,1.1,1-(age-at)/.15,o.a);
  return true;
 },[beak,flash]);
}
const BUG_PAL={K:0x14271b,D:0x365e41,M:0x6ba052,L:0xb7df7e,W:0xf0ffbb};
const BUG_TOP=['..KKKKKKKK.....','.KDDMMMMDKK....','KDDMLLLLWWMK...',
 'KDMLWWWWWWMK...','.KKWKWKWKDK....','...K.K.K.K.....'];
const BUG_BOTTOM=BUG_TOP.slice().reverse();
const BUG_FLASH=['..K...K..','.KLMKMLK.','KLMWWWMLK','.KLMKMLK.','..K...K..'];
export function bugbite(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.76),reach=Math.min(74,h.alcance??74);
 l.accion.hasta=l.t+.74;l.accion.lento=0;
 const dash=contactDash(l,o,reach-9,.23,.41,.67),poses=[10,8,6,4,1,2,5,9];
 let age=0,checked=false,hit=null,at=0;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.75){dash.release();return false;}
  dash.step(age);
  const frame=Math.min(7,Math.floor(clamp((age-.075)/.42)*8));
  const gap=poses[frame],nx=-o.s,ny=o.c;
  const x=l.x+o.c*12,y=l.y-(l.alto||36)*.5+o.s*12;
  if(age<.57){
   sprite(jaw,BUG_TOP,x-nx*gap,y-ny*gap,BUG_PAL,.87,clamp((.59-age)/.1),o.a);
   sprite(jaw,BUG_BOTTOM,x+nx*gap,y+ny*gap,BUG_PAL,.87,clamp((.59-age)/.1),o.a);
  }
  if(!checked&&age>=.28){
   checked=true;const on=physicalHit(l,o,r,13);
   if(on&&strike(l,r,h,extra,{push:11})){hit=on;at=age;}
  }
  if(hit&&age-at<.18)sprite(flash,BUG_FLASH,hit.x,hit.y,BUG_PAL,1,1-(age-at)/.18,o.a);
  return true;
 },[jaw,flash]);
}
export const TORRE2_EARLY_ROUTE_FORMS=Object.freeze({
 torre2_gust:gust,torre2_poisonsting:poisonsting,torre2_bite:bite,torre2_crunch:crunch,
  torre2_peck:peck,torre2_bugbite:bugbite
});
