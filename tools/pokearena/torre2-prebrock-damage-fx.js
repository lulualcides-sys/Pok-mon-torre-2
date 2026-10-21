/* Pokémon Torre 2 — four missing early Kanto damaging attacks.
 * New sprites only. Never override captured native or approved animations.
 * Pixel matrices in Phaser/WebGL (no Canvas2D, CSS effects or static PNG).
 * Aimed manually. Hit checks happen during the rendered attack frame.
 */
import {clashAt} from './clash-fx.js';
const PI=Math.PI,cap=n=>Math.max(0,Math.min(1,n));
function stamp(g,rows,cx,cy,palette,scale=1,alpha=1,angle=0){
 const w=Math.max(...rows.map(s=>s.length)),c=Math.cos(angle),s=Math.sin(angle);
 for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
  const color=palette[rows[j][i]];if(color===undefined)continue;
  const x=(i-(w-1)/2)*scale,y=(j-(rows.length-1)/2)*scale;
  g.fillStyle(color,alpha).fillRect(Math.round(cx+x*c-y*s),
   Math.round(cy+x*s+y*c),Math.max(1,Math.round(scale)),Math.max(1,Math.round(scale)));
 }
}
function begin(l,anim,dur){
 const a=Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+120)-l.x);
 l.animar(anim,dur,.13);
 l.accion={hasta:l.t+dur,lento:0,angulo:a};
 return {x:l.x,y:l.y-(l.alto||36)/2,a,c:Math.cos(a),s:Math.sin(a)};
}
function emit(l,layers,fn){
 const fx={dead:false,update(dt){
  if(this.dead)return false;
  if(fn(Math.min(.05,Math.max(0,dt||0)),fx))return true;
  this.destroy();return false;
 },destroy(){
  if(this.dead)return;this.dead=true;
  if(this.clashBody)this.clashBody.live=false;
  for(const g of layers)g.destroy();
 }};
 l.escena.efectos.push(fx);return fx;
}
function lineHit(a,b,r,reach=13){
 if(!r||r.ko)return null;
 const x=r.x,y=r.y-(r.alto||36)/2;
 const vx=b.x-a.x,vy=b.y-a.y,len=Math.max(.01,vx*vx+vy*vy);
 const t=cap(((x-a.x)*vx+(y-a.y)*vy)/len);
 const px=a.x+vx*t,py=a.y+vy*t;
 return Math.hypot(x-px,y-py)<=reach+(r.alto||36)*.25?{x:px,y:py}:null;
}
function hit(l,r,h,extra,push=10){
 if(!r||r.ko)return false;
 const dx=r.x-l.x,dy=r.y-l.y,d=Math.hypot(dx,dy)||1;
 const before=r.hp;
 const result=r.recibir(l,{dano:h.dano??9,tipo:h.tipo,
  dirX:dx/d,dirY:dy/d,empuje:push,slot:extra?.slot,surge:extra?.surge});
 return result==='golpe'&&(!Number.isFinite(before)||r.hp<before);
}
function dashActor(l,o,reach,advance,hold,finish){
 let travelled=0;
 return {step(t){
  const ease=x=>Math.sin(PI*.5*cap(x));
  const distance=Math.max(0,Math.min(74,reach));
  const wanted=t<advance?distance*ease(t/advance):
   t<hold?distance:distance*(1-ease((t-hold)/(finish-hold)));
  const x=l.x,y=l.y,delta=wanted-travelled;
  l.x+=o.c*delta;l.y+=o.s*delta;l.limitar?.();
  travelled+=(l.x-x)*o.c+(l.y-y)*o.s;
 },reset(){
  if(Math.abs(travelled)>.01){
   l.x-=o.c*travelled;l.y-=o.s*travelled;l.limitar?.();travelled=0;
  }
 }};
}
function melee(l,o,r,radius=12){
 const y=l.y-(l.alto||36)/2;
 return lineHit({x:l.x-o.c*9,y:y-o.s*9},
 {x:l.x+o.c*18,y:y+o.s*18},r,radius);
}
const HORN={K:0x21212d,D:0x5e6373,M:0xaab5ba,L:0xe3e7dc,W:0xffffff};
const HORN_TIP=[
 '..............K',
 '............KKW',
 '.........KKMLWK',
 '......KKDMLWWK.',
 '...KKDDMLLWWK..',
 'KKDDMMLLWWK....',
 'KDDMLLWWK.......',
 'KKKKKK...........'
],HORN_SPARK=['....K....','..KLWK...','KLWWWLK..','..KLWK...','....K....'];
// Horn Attack: one aimed physical horn jab, one real damage event.
export function hornattack(l,h,extra){
 const e=l.escena,r=l.rival,g=e.add.graphics().setDepth(1514),flash=e.add.graphics().setDepth(1515);
 const o=begin(l,'Swing',.76),dash=dashActor(l,o,(h.alcance??76)-9,.24,.41,.68);
 let age=0,resolved=false,contact=null,at=0;
 return emit(l,[g,flash],dt=>{
  age+=dt;g.clear();flash.clear();
  if(l.ko||l.est?.aturdido||age>.77){dash.reset();return false;}
  dash.step(age);
  const x=l.x+o.c*17,y=l.y-(l.alto||36)*.5+o.s*17;
  if(age<.56)stamp(g,HORN_TIP,x,y,HORN,
   .94,cap((.59-age)/.1),o.a);
  if(!resolved&&age>=.29){
   resolved=true;const on=melee(l,o,r,13);
   if(on&&hit(l,r,h,extra,17)){contact=on;at=age;}
  }
  if(contact&&age-at<.17)
   stamp(flash,HORN_SPARK,contact.x,contact.y,HORN,1.15,1-(age-at)/.17,o.a);
  return true;
 });
}
const FOOT={K:0x1b2425,D:0x4b5351,M:0x8f9c8f,L:0xdce3c5,W:0xf8ffe7};
const FOOT_SPRITE=[
 '...KKKKKK....',
 '.KKDMMMMKK...',
 'KDDMLLLWWLK..',
 'KDMLWWWWWWLK.',
 'KDMLWWWWWWLK.',
 '.KDDMLLLWWK..',
 '..KKDDDDKK...',
 '....KKKK.....'
],FOOT_FLASH=['..K...K..','.KLMKMLK.','KLMWWWMLK','.KLMKMLK.','..K...K..'];
// Double Kick: two separately timed melee collisions; actor advances and returns.
// Power 30 on each distinct strike, NOT one doubled damage event.
export function doublekick(l,h,extra){
 const e=l.escena,r=l.rival,feet=e.add.graphics().setDepth(1514),flashes=e.add.graphics().setDepth(1515);
 const o=begin(l,'Kick',1.03),dash=dashActor(l,o,(h.alcance??76)-10,.26,.71,.95);
 const done=[false,false],contacts=[null,null],hitsAt=[0,0];
 let age=0;
 return emit(l,[feet,flashes],dt=>{
  age+=dt;feet.clear();flashes.clear();
  if(l.ko||l.est?.aturdido||age>1.05){dash.reset();return false;}
  dash.step(age);
  const k=age<.45?0:1,local=age-.45*k;
  const x=l.x+o.c*17,y=l.y-(l.alto||36)*.5+o.s*17;
  if(age<.81){
   const offset=k?5:-5;
   stamp(feet,FOOT_SPRITE,x-o.s*offset,y+o.c*offset,FOOT,
    .94,cap((.85-age)/.07),o.a+(k?-.22:.22));
  }
  if(local>=.30&&!done[k]){
   done[k]=true;const on=melee(l,o,r,14);
   if(on&&hit(l,r,h,extra,11)){contacts[k]=on;hitsAt[k]=age;}
  }
  for(let i=0;i<2;i++)if(contacts[i]&&age-hitsAt[i]<.16)
   stamp(flashes,FOOT_FLASH,contacts[i].x,contacts[i].y,FOOT,
    1,1-(age-hitsAt[i])/.16,o.a);
  return true;
 });
}
const FURY={K:0x28212d,D:0x735e52,M:0xbf9574,L:0xf4ce93,W:0xfff3d0};
const FURY_POINT=['.......KK','.....KKW','...KKLWK','.KKMLWK.','KDDMLWK..','.KKK.....'];
// Fury Attack: real 2-5 timed contact hits, 85% initial accuracy, not a
// single auto-hit projectile. The same manual aim vector is used throughout.
export function furyattack(l,h,extra){
 const e=l.escena,r=l.rival,stabs=e.add.graphics().setDepth(1514),flashes=e.add.graphics().setDepth(1515);
 const o=begin(l,'Jab',1.25),dash=dashActor(l,o,(h.alcance??76)-10,.22,.97,1.19);
 const rnd=Math.random(),count=rnd<.375?2:rnd<.75?3:rnd<.875?4:5;
 const enabled=Math.random()<((h.precisao??85)/100);
 let age=0,done=0,burst=null;
 return emit(l,[stabs,flashes],dt=>{
  age+=dt;stabs.clear();flashes.clear();
  if(l.ko||l.est?.aturdido||age>1.27){dash.reset();return false;}
  dash.step(age);
  const progress=Math.max(0,age-.22),index=Math.floor(progress/.14);
  if(age<1.08){
   const impulse=(progress%(.14))/.14;
   const x=l.x+o.c*(11+impulse*8),y=l.y-(l.alto||36)*.5+o.s*(11+impulse*8);
   stamp(stabs,FURY_POINT,x,y,FURY,.96,cap((1.12-age)/.09),o.a);
  }
  if(enabled&&index>=0&&index<count&&index>=done&&age>=.29){
   done=index+1;const on=melee(l,o,r,13);
   if(on&&hit(l,r,h,extra,5))burst={...on,t:age};
  }
  if(burst&&age-burst.t<.12)
   stamp(flashes,HORN_SPARK,burst.x,burst.y,FURY,.75,1-(age-burst.t)/.12,o.a);
  return true;
 });
}
const ROCK={K:0x24262d,D:0x56565b,M:0x89878a,L:0xc1beb4,W:0xe8e5d8};
const ROCK_BODY=[
 '....KKKKK....',
 '..KKDDMMKK...',
 '.KDDMMMMLK...',
 'KDDMMMLLLWK..',
 'KDMMMLLWWLK..',
 'KDMMMMMLWK...',
 '.KKDDDDDKK...',
 '...KKKKK.....'
],ROCK_CHIP=['..K..','.KML.','KMLWK','.KKK.'],ROCK_DUST=['....K....','..KMLK...','KMLWLMDK.','..KMLK...','....K....'];
// Rock Tomb: manually aimed boulder projectile. A physical collision spawns
// short pixel-rock fall around the hit, with one damage event and Slow.
export function rocktomb(l,h,extra){
 const e=l.escena,r=l.rival,g=e.add.graphics().setDepth(1513),dust=e.add.graphics().setDepth(1514);
 const o=begin(l,'Throw',.68),reach=Math.min(245,h.alcance??245),speed=310;
 const first={x:o.x+o.c*12,y:o.y+o.s*12};
 const body={owner:l,type:'ROCK',x:first.x,y:first.y,radius:11,live:true};
 let age=0,previous=first,impact=null,success=false;
 const fx=emit(l,[g,dust],(dt,self)=>{
  age+=dt;g.clear();dust.clear();
  if(l.ko||l.est?.aturdido||age>1.25){body.live=false;return false;}
  if(!impact){
   const distance=age*speed;
   if(distance>reach){body.live=false;return false;}
   const tip={x:first.x+o.c*distance,y:first.y+o.s*distance};
   body.x=tip.x;body.y=tip.y;
   if(clashAt(e,self,l,tip,11,'ROCK')){body.live=false;return false;}
   const on=lineHit(previous,tip,r,12);previous=tip;
   if(on){
    body.live=false;
    success=hit(l,r,h,extra,13);
    impact={...on,t:age};
    if(success&&typeof r.ponerEstado==='function')r.ponerEstado('lento',2.7,{f:.21,fonte:l});
   }else{
    stamp(g,ROCK_BODY,tip.x,tip.y,ROCK,1.35,1,o.a+age*8);
    for(let i=1;i<=2;i++){
     const d=distance-i*13;if(d<=0)continue;
     stamp(dust,ROCK_CHIP,first.x+o.c*d,first.y+o.s*d,ROCK,.57,.64-i*.13);
    }
   }
  }
  if(impact&&success){
   const t=cap((age-impact.t)/.32);
   if(t<1){
    for(let i=0;i<5;i++){
     const theta=2*PI*i/5,dist=8+t*(12+i%2*5);
     stamp(g,i%2?ROCK_CHIP:ROCK_BODY,impact.x+Math.cos(theta)*dist,
      impact.y+Math.sin(theta)*dist-(1-t)*10,ROCK,.65+t*.25,1-t,theta);
    }
    stamp(dust,ROCK_DUST,impact.x,impact.y,ROCK,1.3,1-t);
   }
  }
  return impact?age<impact.t+.34:true;
 });
 fx.clashBody=body;return fx;
}
export const TORRE2_PREBROCK_DAMAGE_FORMS=Object.freeze({
 torre2_hornattack:hornattack,torre2_doublekick:doublekick,
 torre2_furyattack:furyattack,torre2_rocktomb:rocktomb
});
