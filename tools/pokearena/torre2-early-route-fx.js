/* Pokémon Torre 2 — early-route, UNAPPROVED pixel attacks.
 * Gust, Poison Sting, Bite. Entirely new VFX, no client-original or
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
const BITE={K:0x1c2433,D:0x5b3951,M:0xa36e7b,L:0xd29d9a,W:0xfff3dd};
const JAW_UP=[
 '..KKKKKKKKKK.....',
 '.KDDDDMMMMDKK....',
 'KDDMMMMMLLMDK....',
 'KDMLLLWWLLMDK....',
 'KDMWWWWWWLMDK....',
 '.KDMMKKMMMK......',
 '..KKK.KK.KKK......'
];
const JAW_DOWN=JAW_UP.slice().reverse();
const BITE_TOOTH=[
 '..KK...','.KWWK..','KWWWWK.','KWWWWK.','.KWWK..','..KK...'
];
const BITE_SHOCK=[
 '.....K.....',
 '...KWWK....',
 '.KWWLLWWK..',
 'KWWLWWLWWK.',
 '.KWWLLWWK..',
 '...KWWK....',
 '.....K.....'
];
// Bite = DARK contact, one tight rat-sized jaw that closes at the
// manual aim location; 30% flinch ON contact, never a homing projectile.
export function bite(l,h,extra){
 const e=l.escena,r=l.rival,jaw=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=start(l,'Swing',.54),reach=Math.min(76,h.alcance??76);
 const nx=-o.s,ny=o.c;
 let age=0,resolved=false,hit=false,contact=null;
 return effect(e,dt=>{
  age+=dt;jaw.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.65)return false;
  const frame=Math.min(11,Math.floor(age/.05)),close=clamp((age-.07)/.24);
  const travel=clamp(age/.30),distance=reach*travel,spread=11*(1-close);
  const cx=o.x+o.c*(8+distance),cy=o.y+o.s*(8+distance),alpha=clamp((.65-age)/.16);
  if(frame<=10){
   sprite(jaw,JAW_UP,cx-nx*spread,cy-ny*spread-9,BITE,1.65,alpha,o.a);
   sprite(jaw,JAW_DOWN,cx+nx*spread,cy+ny*spread+9,BITE,1.65,alpha,o.a);
   if(frame<8){
    sprite(jaw,BITE_TOOTH,cx+o.c*4-nx*(8+spread),cy+o.s*4-ny*(8+spread),BITE,1.3,alpha,o.a);
    sprite(jaw,BITE_TOOTH,cx+o.c*4+nx*(8+spread),cy+o.s*4+ny*(8+spread),BITE,1.3,alpha,o.a);
   }
  }
  if(!resolved&&frame>=5){
   resolved=true;
   const contactRadius=13;
   const on=intersect(o,{x:cx+o.c*10,y:cy+o.s*10},r,contactRadius);
   if(on){
    const stunChance=Math.random()<.30;
    hit=strike(l,r,h,extra,{push:18,
     status:stunChance?{aturde:.32}:{}});
    contact=on;
   }
  }
  if(hit&&contact&&frame>=5&&frame<=9){
   const t=(frame-5)/5;
   sprite(flash,BITE_SHOCK,contact.x,contact.y,BITE,1.15,1-t,o.a);
  }
  return true;
 },[jaw,flash]);
}
export const TORRE2_EARLY_ROUTE_FORMS=Object.freeze({
 torre2_gust:gust,torre2_poisonsting:poisonsting,torre2_bite:bite
});
