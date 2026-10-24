/* Pokémon Torre 2 — Steel FX revisions, 23/10/2026.
 * Flash Cannon: previous Steel Beam metallic pixel ray TRANSFERRED.
 * Steel Beam: delegates actual original Poké Arena 2D Aura Storm/Chorro,
 *             recolored by opt-in metalTorre2 palette in build-preview.
 * Mirror Shot: flashes of polished light, not rotating mirror plates.
 * T2 approved moves untouched; Zarza+Emerald are concept references until
 * their exact assets/routines have been ported with verified permission.
 * Phaser/WebGL only; no Canvas2D/CSS/video.
 */
import {clashAt} from './clash-fx.js';

const PI=Math.PI, clamp=x=>Math.max(0,Math.min(1,x));
const P=Object.freeze({
 K:0x142532,D:0x394d61,S:0x627d8c,M:0x8aa9b6,
 L:0xb9d8e0,W:0xf1fbff,B:0x70f2fa,C:0xd3fbff,
 V:0x90a7cd,T:0x4d719a
});
function rect(g,x,y,w,h,color,a=1){
 g.fillStyle(color,a);
 g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));
}
function stamp(g,rows,x,y,size=1,rotation=0,opacity=1){
 const h=rows.length,w=Math.max(...rows.map(r=>r.length));
 const cs=Math.cos(rotation),sn=Math.sin(rotation);
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<rows[yy].length;xx++){
  const c=P[rows[yy][xx]];if(c===undefined)continue;
  const dx=(xx-(w-1)*.5)*size,dy=(yy-(h-1)*.5)*size;
  rect(g,x+dx*cs-dy*sn,y+dx*sn+dy*cs,size,size,c,opacity);
 }
}
// Authored faceted light nucleus, alternating silver/cyan around a dark rim.
const FLASH_CORE=[
 '......KKK......','....KKSSSKK....','...KSSLLLSSK...',
 '..KSSLLWWWLSK..','.KSSLLWCCWLSK.',
 'KSSLLWCCCCWLSK','KSLWWCCBBCCWLS',
 'KSLWCCBBBBCCWL','KSLWWCCBBCCWLS',
 'KSSLLWCCCCWLSK','.KSSLLWCCWLSK.',
 '..KSSLLWWWLSK..','...KSSLLLSSK...',
 '....KKSSSKK....','......KKK......'
];
// Mirror Shot is a SILVER REFLECTIVE PLATE with sharp triangular highlights,
// not a recoloured Shadow Ball. Its silhouette flips every animation phase.
// Mirror Shot: the CORE-SERIES attack is a FLASH emitted by the user's
// polished body (not a flying metal plate). Twelve-phase reflective energy
// flare, with diagonal mirrored rays and sharp white-silver scintillations.
// Adapted from the approved Metal Claw palette and the native projectile cycle.
const MIRROR_FLASH=[
 '...........K...........',
 '..........KSK..........',
 '.........KSLSK.........',
 '.....K...KSLWSK...K.....',
 '......KKKSLWWLSKKK......',
 '...KKKSSSLWCCWLSSSKKK...',
 '..KSSLLLWWCCCCWWLLLSSK..',
 'KSSLLWWWCCBBBBCCWWWLLSSK',
 '..KSSLLLWWCCCCWWLLLSSK..',
 '...KKKSSSLWCCWLSSSKKK...',
 '......KKKSLWWLSKKK......',
 '.....K...KSLWSK...K.....',
 '.........KSLSK.........',
 '..........KSK..........',
 '...........K...........'
];
const SPARK=[
 '..W..','W.C.W','.CWC.','W.C.W','..W..'
];
const CHARGE=[
 '....K....','..KSSSK..','.KSLWLSK.','KSLWCWLSK',
 'KSWCCCW SK'.replace(' ',''),'KSLWCWLSK','.KSLWLSK.','..KSSSK..','....K....'
];
function center(r){return {x:r.x,y:r.y-(r.alto||36)*.5}}
function hitSegment(from,to,target,radius){
 if(!target||target.ko)return null;
 const at=center(target),dx=to.x-from.x,dy=to.y-from.y;
 const t=clamp(((at.x-from.x)*dx+(at.y-from.y)*dy)/(dx*dx+dy*dy||1));
 const x=from.x+dx*t,y=from.y+dy*t;
 return Math.hypot(at.x-x,at.y-y)<=Math.max(radius,(target.alto||36)*.36)?{x,y}:null;
}
function aim(l){
 const ax=l.ax??(l.x+100),ay=l.ay??l.y;
 return Math.atan2(ay-l.y,ax-l.x);
}
function animate(l,anim,duration,ang){
 l.animar(anim,duration,.14);
 l.accion={hasta:l.t+duration*.68,lento:.55,angulo:ang};
}
function create(l,render){
 const e=l.escena,main=e.add.graphics().setDepth(1513),
 trail=e.add.graphics().setDepth(1512);
 let disposed=false;
 const fx={
  clashBody:null,
  update(dt){
   if(disposed)return false;
   if(render(Math.min(.055,Math.max(0,dt||0)),main,trail,fx))return true;
   this.destroy();return false;
  },
  destroy(){
   if(disposed)return;disposed=true;
   if(this.clashBody)this.clashBody.live=false;
   main.destroy();trail.destroy();
  }
 };
 e.efectos.push(fx);return fx;
}
function strike(l,h,extra,target){
 if(!target||target.ko)return false;
 const before=target.hp;
 const dist=Math.hypot(target.x-l.x,target.y-l.y)||1;
 const result=target.recibir(l,{
  dano:h.dano,tipo:'STEEL',categoria:'SPECIAL',
  dirX:(target.x-l.x)/dist,dirY:(target.y-l.y)/dist,
  empuje:11,slot:extra?.slot,surge:extra?.surge
 });
 return result==='golpe'&&(target.__torre2TrainingDummy===true||!Number.isFinite(before)||target.hp<before);
}
// Reflective impact uses fragment bounce/damping constants from
// the MIT-licensed arena_physics.c by German Burgardt (2026).
function mirrorFragments(g,x,y,age,opacity){
 const q=256,steps=Math.min(15,Math.floor(age*60));
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  let vx=Math.cos(angle)*240,vy=Math.sin(angle)*200;
  let z=(2+i%3)*q,vz=520+i*50,bounces=0,px=0,py=0;
  for(let j=0;j<steps;j++){
   px+=vx;py+=vy;z+=vz;vz-=42;
   if(z<=0){
    z=0;
    vz=vz< -100&&bounces++<3?-vz*150/256:0;
    vx*=180/256;vy*=180/256;
   }else{vx*=251/256;vy*=251/256}
  }
  rect(g,x+px/q,y+py/q-z/q*.3,2,2,i%2?P.C:P.W,opacity);
 }
}
function impact(g,x,y,age,kind){
 const p=clamp(age/.25),fade=1-p;
 for(let i=0;i<8;i++){
  const a=i*PI/4+(kind==='mirror'?.16:0),d=3+p*(kind==='flash'?20:15);
  const c=i%3===0?P.W:i%2===0?P.C:P.S;
  rect(g,x+Math.cos(a)*d,y+Math.sin(a)*d*.73,3,3,c,fade);
 }
 if(p<.68)stamp(g,SPARK,x,y,1.5+p*1.7,0,fade);
 if(kind==='mirror')mirrorFragments(g,x,y,age,fade);
}
function projectile(l,h,extra,kind){
 const a=aim(l),ux=Math.cos(a),uy=Math.sin(a);
 const source={x:l.x+ux*11,y:l.y-(l.alto||36)*.5};
 const e=l.escena,target=l.rival;
 const charge=kind==='flash'?.25:.12;
 const speed=kind==='flash'?340:298;
 const max=Math.min(h.alcance||250,280);
 const accuracy=clamp((h.precisao??(kind==='flash'?100:85))/100);
 // Roll AFTER swept physical intersection. Accurate aim remains mandatory.
 let age=0,prev=source,contact=null,spent=false;
 animate(l,kind==='flash'?'Charge':'Shoot',charge+.43,a);
 return create(l,(dt,g,trail,fx)=>{
  age+=dt;g.clear();trail.clear();
  if((l.ko||l.est?.aturdido)&&age<charge)return false;
  if(contact){
   impact(g,contact.x,contact.y,age-contact.at,kind);
   return age-contact.at<.27;
  }
  if(age<charge){
   const f=clamp(age/charge);
   stamp(g,CHARGE,source.x,source.y,1+f*.45,age*2,.5+.5*f);
   for(let i=0;i<3;i++){
    const rad=i*PI*2/3-age*10;
    rect(trail,source.x+Math.cos(rad)*(12-7*f),source.y+Math.sin(rad)*(12-7*f),2,2,P.L,f);
   }
   return true;
  }
  const dist=(age-charge)*speed;
  if(dist>max+22||age>1.55)return false;
  const point={x:source.x+ux*Math.min(max,dist),y:source.y+uy*Math.min(max,dist)};
  fx.clashBody={owner:l,type:'STEEL',radius:kind==='flash'?13:12,
   x:point.x,y:point.y,live:true};
  if(clashAt(e,fx,l,point,fx.clashBody.radius,'STEEL'))return false;
  const intersection=hitSegment(prev,point,target,kind==='flash'?12:11);
  prev=point;
  if(intersection&&!spent){
   spent=true;fx.clashBody.live=false;
   const accuracyPass=Math.random()<accuracy;
   const landed=accuracyPass&&strike(l,h,extra,target);
   if(landed&&target.est){
    if(kind==='flash'&&Math.random()<.10){
     const previous=target.est.torre2SteelSpDef?.stacks||0;
     target.est.torre2SteelSpDef={stacks:Math.min(6,previous+1)};
    }
    if(kind==='mirror'&&Math.random()<.30){
     const previous=target.est.torre2MudAccuracy?.stacks||0;
     target.est.torre2MudAccuracy={stacks:Math.min(6,previous+1)};
    }
   }
   contact={...intersection,at:age};
   return true;
  }
  if(dist>=max)return false;
  if(kind==='flash'){
   // Sixteen time phases: compact collimated light cannon, not a generic orb.
   const pose=Math.floor(age*24)%16;
   for(let i=3;i>=1;i--){
    const back=dist-i*9,offset=(pose+i)%3-1;
    if(back>0)rect(trail,source.x+ux*back-uy*offset*2,
     source.y+uy*back+ux*offset*2,4+i,2,P.C,.65-i*.11);
   }
   stamp(g,FLASH_CORE,point.x,point.y,1.03,
    a+(pose%4-1.5)*.025);
   if(pose%3===0)stamp(g,SPARK,point.x,point.y,1.75,pose*.1,.65);
  }else{
   // Core-series Mirror Shot: a concentrated luminous metallic FLASH,
   // emerging from a polished body and passing as one aimed projectile.
   // Not a flying mirror, a generic sphere, or a steel-coloured bite.
   const frame=Math.floor(age*24)%12,twinkle=frame%4;
   stamp(g,MIRROR_FLASH,point.x,point.y,twinkle===0?1.07:.86,
     a*.12+(twinkle-1.5)*.05,1);
   for(let i=1;i<=5;i++){
    const back=dist-i*10;if(back<0)continue;
    const phase=age*30-i*.8,side=(i%2?1:-1)*(4+i*1.4);
    const x=source.x+ux*back-uy*(Math.sin(phase)*side);
    const y=source.y+uy*back+ux*(Math.sin(phase)*side);
    stamp(trail,SPARK,x,y,i===1?1.06:.62,phase*.1,.76-i*.10);
    rect(trail,x-1,y-1,3,3,i%3===0?P.W:P.C,.85-i*.08);
   }
   if(frame<4||frame===8){
    for(let k=0;k<4;k++){
     const spin=k*PI/2+frame*.11;
     const rad=11+(frame%4)*2.3;
     rect(g,point.x+Math.cos(spin)*rad,point.y+Math.sin(spin)*rad,
      frame%2?3:2,2,k%2?P.W:P.M,.95);
    }
   }
  }
  return true;
 });
}
// Flash Cannon uses the TRANSFERRED former Steel Beam metallic ray below.
export function mirrorshot(l,h,extra){return projectile(l,h,extra,'mirror')}

export function flashcannon(l,h,extra){
 const e=l.escena,target=l.rival,a=aim(l),ux=Math.cos(a),uy=Math.sin(a);
 const nx=-uy,ny=ux,charge=.29,duration=.68;
 const reach=Math.min(h.alcance||265,280);
 const accuracy=clamp((h.precisao??100)/100);
 let age=0,charged=false,hit=false,failed=false,resolved=false;
 animate(l,'Charge',.92,a);
 return create(l,(dt,g,glint,fx)=>{
  age+=dt;g.clear();glint.clear();
  const origin={x:l.x+ux*10,y:l.y-(l.alto||36)*.5};
  if(age<charge){
   if(l.ko||l.est?.aturdido)return false;
   const f=clamp(age/charge),phase=Math.floor(age*36)%16;
   stamp(g,CHARGE,origin.x,origin.y,1+f*1.1,phase*PI/16,.6+f*.4);
   for(let k=0;k<8;k++){
    const rad=k*PI/4+phase*.09,d=21*(1-f)+4;
    rect(glint,origin.x+Math.cos(rad)*d,origin.y+Math.sin(rad)*d,
     3,3,k%3===0?P.W:P.M,f);
   }
   return true;
  }
  if(!charged){
   charged=true;
   // Flash Cannon inherits the former Steel Beam's metallic beam VISUAL.
   // It must not inherit Steel Beam's user recoil.
   failed=Math.random()>=accuracy;
  }
  if(age>charge+duration)return false;
  const t=age-charge;
  const extent=Math.min(reach,t*820+16);
  fx.clashBody={owner:l,type:'STEEL',radius:12,
   x:origin.x+ux*extent,y:origin.y+uy*extent,live:true};
  // Metallic articulated beam with independent shadow/steel/core segments.
  const phase=Math.floor(t*28)%16;
  const fade=clamp((charge+duration-age)/.22);
  for(let s=0;s<extent;s+=7){
   const x=origin.x+ux*s,y=origin.y+uy*s;
   const width=(s<20?4+s*.36: s>extent-24?4+(extent-s)*.38:13);
   for(let band=-3;band<=3;band++){
    const off=band*(width/3.7);
    const col=Math.abs(band)===3?P.K:
     Math.abs(band)===2?(phase+s/7)%3<1?P.S:P.M:
     Math.abs(band)===1?P.L:((phase+s/7)%4===0?P.W:P.C);
    rect(g,x+nx*off-3,y+ny*off-2,7,4,col,fade);
   }
   if((Math.floor(s/7)+phase)%5===0){
    rect(glint,x+nx*(width+2),y+ny*(width+2),3,3,P.B,fade*.8);
    rect(glint,x-nx*(width+2),y-ny*(width+2),2,3,P.L,fade*.65);
   }
  }
  // New projectiles cancel on actual overlap with the metallic beam; native
  // effects and their approved sprite data are never modified.
  for(let along=12;along<=extent;along+=24){
   const point={x:origin.x+ux*along,y:origin.y+uy*along};
   if(clashAt(e,fx,l,point,12,'STEEL'))return false;
  }
  // Sweep the *visible* extension; moving enemies can enter after launch.
  // A shielded contact is resolved ONCE instead of dealing damage later.
  if(!resolved&&target&&!target.ko){
   const intersection=hitSegment(origin,
    {x:origin.x+ux*extent,y:origin.y+uy*extent},target,10);
   if(intersection){
    resolved=true;
    if(!failed&&strike(l,h,extra,target)){
     hit=true;fx.__hitAt=age;fx.__hitPoint=intersection;
     if(target.est&&Math.random()<.10){
      const prev=target.est.torre2SteelSpDef?.stacks||0;
      target.est.torre2SteelSpDef={stacks:Math.min(6,prev+1)};
     }
    }
   }
  }
  if(hit&&fx.__hitPoint&&age-fx.__hitAt<.24)
   impact(glint,fx.__hitPoint.x,fx.__hitPoint.y,age-fx.__hitAt,'flash');
  return true;
 });
}

// This is the ACTUAL original Poké Arena 2D Chorro implementation used
// by Lucario's Aura Storm, reusing its native physics, sprite pipeline,
// aiming, pulses, clashes, status/damage, stage depth and release timing.
// Only the opt-in metallic palette and Steel Beam's canonical recoil differ.
// Chorro is injected from habilidades.js, never copied or overwritten.
export function steelbeam(l,h,extra,nativeChorro){
 if(typeof nativeChorro!=='function')
  throw new Error('Steel Beam requires the ORIGINAL Aura Storm / Chorro');
 const cast={...h,forma:'chorro',tipo:'STEEL',paleta:'metalTorre2',
  haz:true,trozos:undefined,desdeBoca:true,
  ancho:h.ancho??24,anchoVisual:h.anchoVisual??38,
  largo:h.largo??320,carga:h.carga??.38,dur:h.dur??.80,
  pulsos:h.pulsos??5,giro:h.giro??2.4,giroCarga:h.giroCarga??2.4,
  velTrozos:h.velTrozos??700,empuje:h.empuje??18,
  empujePulso:h.empujePulso??3};
 const scene=l.escena;
 // Exact half maximum HP ONCE, on use, whether aim hits or misses.
 // Queue at beam release just as native Chorro enters its firing phase.
 let paid=false;
 const recoil=()=>{
  if(paid)return;
  paid=true;
  l.recibir(l,{dano:Math.max(1,Math.ceil((l.hpMax||l.hp||1)*.5)),
   tipo:'NORMAL',puro:true,tick:true});
 };
 const result=nativeChorro(l,cast,extra);
 if(typeof scene.programar==='function')scene.programar(cast.carga,recoil);
 else if(scene.time?.delayedCall)scene.time.delayedCall(cast.carga*1000,recoil);
 else recoil();
 return result;
}

export const TORRE2_STEEL_FORMS=Object.freeze({
 torre2_flashcannon:flashcannon,
 torre2_steelbeam:steelbeam,
 torre2_mirrorshot:mirrorshot
});
