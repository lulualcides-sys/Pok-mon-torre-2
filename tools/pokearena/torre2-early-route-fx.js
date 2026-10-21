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
// Bite = one clear, modest-sized chomp, at the manually aimed contact location.
// Attack does NOT home toward the enemy or cause automatic damage on a miss.
export function bite(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.52),reach=Math.min(76,h.alcance??76);
 let age=0,resolved=false,contact=null,contactAge=0;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.54)return false;
  const phase=clamp(age/.46),frame=Math.min(7,Math.floor(phase*8));
  const travel=reach*clamp(age/.245);
  const cx=o.x+o.c*(7+travel),cy=o.y+o.s*(7+travel);
  const opacity=clamp((.54-age)/.1);
  paintChomp(jaw,cx,cy,0,frame,opacity,1.08);
  if(!resolved&&frame>=4){
   resolved=true;
   const on=intersect(o,{x:cx,y:cy},r,14);
   if(on){
    const flinch=Math.random()<.30;
    if(strike(l,r,h,extra,{push:17,status:flinch?{aturde:.32}:{}})){
     contact=on;contactAge=age;
    }
   }
  }
  if(contact)mouthFlash(flash,contact,age-contactAge,0);
  return true;
 },[jaw,flash]);
}
// Crunch = TWO separate actual chomp animations: first straight/horizontal,
// then 90 degrees rotated/vertical, with one single physical damage instance.
// Either timed contact may hit, but never two full-power hits in one attack.
export function crunch(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.82),reach=Math.min(80,h.alcance??80);
 const rotations=[0,PI/2],resolved=[false,false],bursts=[null,null];
 let age=0,landed=false;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.82)return false;
  const turn=age<.38?0:1,elapsed=age-turn*.38;
  const phase=clamp(elapsed/.34),frame=Math.min(7,Math.floor(phase*8));
  const distance=reach*clamp(elapsed/.175);
  const cx=o.x+o.c*(7+distance),cy=o.y+o.s*(7+distance);
  const opacity=clamp((.36-elapsed)/.075);
  paintChomp(jaw,cx,cy,rotations[turn],frame,opacity,1.16);
  if(!resolved[turn]&&frame>=4){
   resolved[turn]=true;
   const on=intersect(o,{x:cx,y:cy},r,16);
   if(on){
    // Crunch is visually two bites, NOT two independent high-power attacks.
    const struck=landed||strike(l,r,h,extra,{push:21});
    if(struck){
     landed=true;bursts[turn]={contact:on,time:age};
    }
   }
  }
  for(let i=0;i<2;i++)if(bursts[i])
   mouthFlash(flash,bursts[i].contact,age-bursts[i].time,rotations[i]);
  return true;
 },[jaw,flash]);
}
export const TORRE2_EARLY_ROUTE_FORMS=Object.freeze({
 torre2_gust:gust,torre2_poisonsting:poisonsting,torre2_bite:bite,torre2_crunch:crunch
});
