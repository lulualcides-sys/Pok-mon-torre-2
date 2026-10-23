/* Pokémon Torre 2 — three ORIGINAL Steel special-move visuals, October 2026.
 * Sources of technique: Poké Arena 2D Chorro/projectiles; approved Ice Beam,
 * Shadow Ball, Metal Claw and Rock Blast; Zarza VFX phase/impact design.
 * Emerald Arena serves as a reference for recoil/terrain interactions only.
 * Pixel cells rendered with Phaser Graphics/WebGL; NO Canvas2D, CSS or video.
 * All native and user-approved attack modules remain unchanged.
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
const MIRROR_PLATE=[
 '.......KK.......','.....KKSSKK.....','...KKSDLLDSKK...',
 '..KSDLLWWWLDSK..','.KSDLLWCWWLDSK.',
 'KSDLLWWCCWWLDSK','KDLLWCCWWCCWLDK',
 'KLLWCCWBBWWCCLK','KDLLWCCWWCCWLDK',
 'KSDLLWWCCWWLDSK','.KSDLLWCWWLDSK.',
 '..KSDLLWWWLDSK..','...KKSDLLDSKK...',
 '.....KKSSKK.....','.......KK.......'
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
 return result==='golpe'&&(!Number.isFinite(before)||target.hp<before);
}
function impact(g,x,y,age,kind){
 const p=clamp(age/.25),fade=1-p;
 for(let i=0;i<8;i++){
  const a=i*PI/4+(kind==='mirror'?.16:0),d=3+p*(kind==='flash'?20:15);
  const c=i%3===0?P.W:i%2===0?P.C:P.S;
  rect(g,x+Math.cos(a)*d,y+Math.sin(a)*d*.73,3,3,c,fade);
 }
 if(p<.68)stamp(g,SPARK,x,y,1.5+p*1.7,0,fade);
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
   // Twelve visible orientations: turning flat mirrored-metal diamond.
   const frame=Math.floor(age*18)%12;
   const rotation=a+frame*PI/18;
   stamp(g,MIRROR_PLATE,point.x,point.y,1.02,rotation);
   for(let i=1;i<4;i++){
    const back=dist-i*13;if(back<0)continue;
    const x=source.x+ux*back-uy*Math.sin(age*14+i)*5;
    const y=source.y+uy*back+ux*Math.sin(age*14+i)*5;
    stamp(trail,SPARK,x,y,.55+(i===1?.25:0),0,.72-i*.16);
   }
  }
  return true;
 });
}
export function flashcannon(l,h,extra){return projectile(l,h,extra,'flash')}
export function mirrorshot(l,h,extra){return projectile(l,h,extra,'mirror')}

export function steelbeam(l,h,extra){
 const e=l.escena,target=l.rival,a=aim(l),ux=Math.cos(a),uy=Math.sin(a);
 const nx=-uy,ny=ux,charge=.38,duration=.76;
 const reach=Math.min(h.alcance||315,335);
 const accuracy=clamp((h.precisao??95)/100);
 let age=0,charged=false,hit=false,failed=false,resolved=false;
 animate(l,'Charge',1.22,a);
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
   // Steel Beam consumes exactly one half MAXIMUM HP per use, hit OR miss.
   // Native pure damage permits the canonical self-KO and HP/KO handling.
   const recoil=Math.max(1,Math.ceil((l.hpMax||l.hp||1)*.5));
   l.recibir(l,{dano:recoil,tipo:'NORMAL',puro:true,tick:true});
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
    }
   }
  }
  if(hit&&fx.__hitPoint&&age-fx.__hitAt<.24)
   impact(glint,fx.__hitPoint.x,fx.__hitPoint.y,age-fx.__hitAt,'flash');
  return true;
 });
}
export const TORRE2_STEEL_FORMS=Object.freeze({
 torre2_flashcannon:flashcannon,
 torre2_steelbeam:steelbeam,
 torre2_mirrorshot:mirrorshot
});
