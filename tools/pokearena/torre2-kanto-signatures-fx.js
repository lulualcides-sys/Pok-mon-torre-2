/* Pokémon Torre 2: Kanto species signature VFX, WebGL Phaser Graphics.
 * Hyper Fang / Guillotine / Petal Dance.
 * Entire file additive: do not change original Poké Arena 2D or approved VFX.
 */
const PI=Math.PI;
const clamp=v=>Math.max(0,Math.min(1,v));
const pixel=v=>Math.round(v);
const rect=(g,x,y,w,h,tint,alpha=1)=>{
 g.fillStyle(tint,alpha);
 g.fillRect(pixel(x),pixel(y),Math.max(1,pixel(w)),Math.max(1,pixel(h)));
};
const COLORS={
 ink:0x162337,shadow:0x634248,enamel:0xf4e8cb,shine:0xffffff,
 jaw:0xc78259,jawLight:0xffc78a,jawDark:0x805344,
 steel:0x687b83,steelLight:0xb6d2d4,
 pink:0xd85b94,rose:0xec8eb6,petalLight:0xffcbe4,leaf:0x67aa6c
};
// Hand-authored pixel tiles: the silhouette is discretized BEFORE rendering,
// not synthesized by large smooth polygons or CSS/Canvas effects.
const FANG_UP=[
 '....KKKKKKKKKKK.....',
 '..KKDDDDDDDDDDKK....',
 '.KDDOOOOOOLLLDDD K..'.replace(' ',''),
 'KDDOOOLLLLLLLLLDDK..',
 'KDDOLLWWWLLWWWLLDDK.',
 'KDDOOLLWWLLWWLLDDK.',
 '.KDDDDKWWDDKWWDDDK..',
 '..KKKK.KWKK.KWKKK...'
];
const FANG_DOWN=[
 '..KKKK.KWKK.KWKKK...',
 '.KDDDDKWWDDKWWDDDK..',
 'KDDOOLLWWLLWWLLDDK.',
 'KDDOLLWWWLLWWWLLDDK.',
 'KDDOOOLLLLLLLLLDDK..',
 '.KDDOOOOOOLLLDDD K..'.replace(' ',''),
 '..KKDDDDDDDDDDKK....',
 '....KKKKKKKKKKK.....'
];
const MANDIBLE=[
 '......KKKKKKKK.......',
 '....KKSSSSSSSSKK.....',
 '..KKSSSMMMMSSSSSKK...',
 '.KSSSSMMMMMMMMMSSSK..',
 'KSSSMMMMLLLLMMMMSSSK.',
 'KSSMMMMMLLLLMMMMSSSK.',
 '.KSSSMMMMMMMMMMSSSK..',
 '...KKSSSSSSSSSSKK....',
 '......KKKKKKKK.......'
];
const PINCER=[
 '..KKKKKKKKK..........',
 '.KSSSSMMMMMK.........',
 'KSSSSMMLLLMMKK.......',
 'KSSSSMLLWWLMMMMKK....',
 'KSSSSMMMLLLMMMMMMKK..',
 '.KSSSSMMMMMMKKKKWWWK.',
 '..KKKSSSSKKK....KKK..'
];
const PETAL=[
 '....KK...',
 '..KKPPKK.',
 '.KPPPLPK.',
 'KPRRLLPPK',
 'KPRRLLPPK',
 '.KPRRRPK.',
 '..KKPPK..',
 '....KK...'
];
const FANG_COL={K:COLORS.ink,D:COLORS.jawDark,O:COLORS.jaw,L:COLORS.jawLight,W:COLORS.shine};
const PINCER_COL={K:COLORS.ink,S:0x4d5662,M:COLORS.steel,L:COLORS.steelLight,W:COLORS.shine};
const PETAL_COL={K:0x683b65,P:COLORS.pink,R:COLORS.rose,L:COLORS.petalLight};
function stamp(g,rows,table,x,y,scale=2,flip=false,alpha=1){
 // Axis-aligned integer sprites. Each tile gets a true pixel boundary.
 for(let j=0;j<rows.length;j++){
  const str=rows[j];
  for(let i=0;i<str.length;i++){
   const col=table[str[i]];if(col===undefined)continue;
   const dx=(flip?str.length-1-i:i)*scale,dy=j*scale;
   rect(g,x+dx,y+dy,scale,scale,col,alpha);
  }
 }
}
function sceneLayer(e,depth=1510){return e.add.graphics().setDepth(depth)}
function register(e,draw,graphics){
 let disposed=false;
 const clean=()=>{if(disposed)return;disposed=true;for(const g of graphics)g.destroy()};
 const fx={update(dt){
  if(disposed)return false;
  const still=draw(Math.min(.055,Math.max(0,dt)));
  if(!still)clean();
  return !!still;
 },destroy:clean};
 e.efectos.push(fx);return fx;
}
function setup(l,animation,actionTime){
 const angle=Math.atan2(l.ay-l.y,l.ax-l.x);
 l.animar(animation,actionTime,.14);
 l.accion={hasta:l.t+actionTime*.75,lento:.48,angulo:angle};
 return angle;
}
function strike(l,h,extra,amount=1,push=20){
 const r=l.rival;if(!r||r.ko)return false;
 const oldHp=r.hp;
 const dx=r.x-l.x,dy=r.y-l.y,mag=Math.hypot(dx,dy)||1;
 const result=r.recibir(l,{
  dano:Math.max(0,h.dano??12)*amount,tipo:h.tipo||'NORMAL',
  empuje:push,dirX:dx/mag,dirY:dy/mag,
  surge:extra?.surge,slot:extra?.slot
 });
 return result==='golpe'||r.hp<oldHp;
}
function segmentHit(a,b,target,radius=16){
 if(!target||target.ko)return null;
 const cx=target.x,cy=target.y-(target.alto||36)*.5;
 const vx=b.x-a.x,vy=b.y-a.y;
 const t=clamp(((cx-a.x)*vx+(cy-a.y)*vy)/(vx*vx+vy*vy||1));
 const px=a.x+vx*t,py=a.y+vy*t;
 const close=Math.hypot(px-cx,py-cy);
 if(close>Math.max(radius,(target.alto||36)*.38))return null;
 return {x:px,y:py};
}
function pixelspark(g,x,y,k,t=1){
 const p=k*PI/4,dist=3+(1-t)*13;
 rect(g,x+Math.cos(p)*dist,y+Math.sin(p)*dist,2,3,
  k%3===0?COLORS.shine:k%2?COLORS.petalLight:COLORS.jawLight,t);
}
function aim(l,angle){
 return {ux:Math.cos(angle),uy:Math.sin(angle)*.76};
}
function jawPixels(g,x,y,closure,t=1){
 const rowGap=7*(1-clamp(closure));
 stamp(g,FANG_UP,FANG_COL,x-22,y-25-rowGap,2,false,t);
 stamp(g,FANG_DOWN,FANG_COL,x-22,y+4+rowGap,2,false,t);
 // A few glints stay tiny and crisp, not a huge glowing bite ring.
 rect(g,x+15,y-12,3,3,COLORS.shine,t);
}
export function hyperfang(l,h,extra){
 const e=l.escena,r=l.rival,g=sceneLayer(e,1513),flecks=sceneLayer(e,1514);
 const angle=setup(l,'Swing',.56),{ux,uy}=aim(l,angle);
 const x0=l.x+ux*13,y0=l.y-(l.alto||36)*.5;
 const reach=Math.min(h.alcance??84,90);
 let time=0,applied=false,contactAt=-1,contactPos=null;
 return register(e,dt=>{
  time+=dt;g.clear();flecks.clear();
  if(l.ko||l.est?.aturdido||time>.74)return false;
  const slide=clamp((time-.065)/.32);
  const dist=slide*reach;
  const x=x0+ux*dist,y=y0+uy*dist;
  const close=clamp((time-.20)/.145);
  if(time<.55)jawPixels(g,x,y,close,Math.min(1,time*13));
  if(!applied&&time>=.25&&time<=.42&&r&&!r.ko){
   const tip={x:x+ux*19,y:y+uy*19};
   const collision=segmentHit({x:x0,y:y0},tip,r,13);
   if(collision){
    applied=true;
    contactPos=collision;
    contactAt=time;
    // Hyper Fang: 90% accuracy / 10% flinch on a successful bite.
    if(Math.random()<.9&&strike(l,h,extra,1,42)){
     if(Math.random()<.1&&typeof r.ponerEstado==='function')
      r.ponerEstado('aturdido',.3,{fuente:l});
    }
   }
  }
  if(contactPos&&time-contactAt<.22){
   const remain=clamp(1-(time-contactAt)/.22);
   for(let k=0;k<8;k++)pixelspark(flecks,contactPos.x,contactPos.y,k,remain);
  }
  return true;
 },[g,flecks]);
}
function pincerPair(g,x,y,close,t=1){
 const span=16*(1-clamp(close));
 stamp(g,MANDIBLE,PINCER_COL,x-25,y-23,2,false,t);
 // The two pincers approach the enemy from above and below, opposing arcs.
 stamp(g,PINCER,PINCER_COL,x+5,y-30-span,2,false,t);
 stamp(g,PINCER.slice().reverse(),PINCER_COL,x+5,y+5+span,2,false,t);
 // Original King's silver/steel shell, with a gold critical focal spark.
 if(close>.7){
  rect(g,x+40,y-2,4,4,0xffffff,t);
  rect(g,x+36,y-2,3,4,0xffddb0,t);
 }
}
export function guillotine(l,h,extra){
 const e=l.escena,r=l.rival,main=sceneLayer(e,1514),impact=sceneLayer(e,1515);
 const angle=setup(l,'Swing',.72),{ux,uy}=aim(l,angle);
 const x0=l.x+ux*9,y0=l.y-(l.alto||36)*.5;
 const reach=Math.min(h.alcance??80,90);
 let age=0,resolved=false,contactAt=-1,where=null;
 return register(e,dt=>{
  age+=dt;main.clear();impact.clear();
  if(l.ko||l.est?.aturdido||age>.91)return false;
  const rush=clamp((age-.09)/.31),snap=clamp((age-.32)/.15);
  const x=x0+ux*reach*rush,y=y0+uy*reach*rush;
  if(age<.7)pincerPair(main,x,y,snap,Math.min(1,age*12));
  if(!resolved&&age>=.33&&age<=.51&&r&&!r.ko){
   const tip={x:x+ux*23,y:y+uy*23};
   const collision=segmentHit({x:x0,y:y0},tip,r,11);
   if(collision){
    resolved=true;where=collision;contactAt=age;
    // Original Guillotine: one-hit KO only with ~30% precision.
    // On enemy of higher level it automatically fails when both levels
    // are known. No invisible reach and no guaranteed finish.
    const userLevel=l.nivel??l.progresso?.level??l.level;
    const foeLevel=r.nivel??r.progresso?.level??r.level;
    const mismatch=userLevel!=null&&foeLevel!=null&&userLevel<foeLevel;
    const chance=clamp((30+Math.max(0,(userLevel??50)-(foeLevel??50)))/100);
    if(!mismatch&&Math.random()<chance){
     const amount=Math.max(160,(r.hp??r.hpMax??120)*5);
     strike(l,{...h,dano:amount},extra,1,58);
    }
   }
  }
  if(where&&age-contactAt<.22){
   const fade=clamp(1-(age-contactAt)/.22);
   for(let k=0;k<8;k++)pixelspark(impact,where.x,where.y,k,fade);
   rect(impact,where.x-10*fade,where.y,20*fade,2,0xffe5aa,fade);
  }
  return true;
 },[main,impact]);
}
function petal(g,x,y,rotation,shade=0,alpha=1){
 // Hand-indexed 8x8 sprite frames. Leaf reflections use square pixels.
 const widths=[2,2,2,1,2,3,3,2];
 const rows=PETAL;
 // Rotate only in 90-degree discrete steps: crisp sprite silhouettes.
 const phase=((Math.floor(rotation/ (PI/2))%4)+4)%4;
 if(phase===0)stamp(g,rows,PETAL_COL,x-11,y-12,3,false,alpha);
 else if(phase===2)stamp(g,rows.slice().reverse(),PETAL_COL,x-11,y-12,3,true,alpha);
 else{
  for(let j=0;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
   const col=PETAL_COL[rows[j][i]];if(col===undefined)continue;
   const u=phase===1?rows.length-1-j:j;
   const v=phase===1?i:rows[j].length-1-i;
   rect(g,x+(u-4)*3,y+(v-4)*3,3,3,col,alpha);
  }
 }
}
export function petaldance(l,h,extra){
 const e=l.escena,r=l.rival,blooms=sceneLayer(e,1510),trail=sceneLayer(e,1511);
 const angle=setup(l,'Charge',1.5),{ux,uy}=aim(l,angle);
 const nx=-uy,ny=ux;
 const x0=l.x+ux*8,y0=l.y-(l.alto||36)*.5;
 const reach=Math.min(h.alcance??215,240),speed=220;
 const lanes=[-9,7,0,15,-15,5,-4,22,-19,0,11,-10,-2,17,-16,3];
 const petals=lanes.map(()=>({before:null,spent:false}));
 let age=0,landed=0,confused=false;
 return register(e,dt=>{
  age+=dt;blooms.clear();trail.clear();
  if(l.ko||l.est?.aturdido)return false;
  for(let i=0;i<lanes.length;i++){
   const p=petals[i],elapsed=age-.035-i*.067;
   if(elapsed<=0||p.spent)continue;
   const d=speed*elapsed;
   if(d>=reach){p.spent=true;continue}
   // Sixteen petals swirl in a two-lobed spiral. No auto-targeting.
   const sway=(Math.sin(age*13-i*.93)*8+lanes[i]*(.55+.35*clamp(d/reach)));
   const x=x0+ux*d+nx*sway;
   const y=y0+uy*d+ny*sway*.74-Math.sin(age*8+i)*3;
   const prior=p.before||{x:x0,y:y0};
   p.before={x,y};
   if(r&&!r.ko&&landed<3&&d>10){
    const collision=segmentHit(prior,{x,y},r,15);
    if(collision){
     p.spent=true;
     // Three sequential contacts (Petal Dance), never hit outside petals.
     if(strike(l,h,extra,.42,9)){
      landed++;
      for(let k=0;k<4;k++)pixelspark(trail,collision.x,collision.y,k,1);
     }
     continue;
    }
   }
   petal(blooms,x,y,age*10+i*.87,i,.9);
   for(let k=0;k<2;k++){
    const back=8+k*7;
    rect(trail,x-ux*back,y-uy*back,2,2,
     k===0?COLORS.petalLight:COLORS.leaf,.55-k*.17);
   }
  }
  // Like the original move, finishing the dance confuses the caster.
  if(!confused&&age>1.42){
   confused=true;
   if(typeof l.ponerEstado==='function')
    l.ponerEstado('confuso',2.2,{fonte:l});
  }
  return age<1.62&&petals.some(p=>!p.spent);
 },[blooms,trail]);
}
export const TORRE2_KANTO_FORMS=Object.freeze({
 torre2_hyperfang:hyperfang,torre2_guillotine:guillotine,
 torre2_petaldance:petaldance
});
