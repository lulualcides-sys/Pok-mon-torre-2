/* Pokémon Torre 2 — 12-frame, hand-drawn pixel art VFX for new moves.
 * Only three unapproved attacks are affected. Approved / native VFX are frozen.
 * Rendered through Phaser Graphics/WebGL, not Canvas2D, CSS or images.
 */
import {TEST_LIBRARY} from './move-pool.js';
const PI=Math.PI, sat=x=>Math.max(0,Math.min(1,x));
const px=x=>Math.round(x);
const put=(g,x,y,w,h,c,a=1)=>{
 g.fillStyle(c,a).fillRect(px(x),px(y),Math.max(1,px(w)),Math.max(1,px(h)));
};
const PAL={
 K:0x182d35,D:0x704652,H:0xc9877c,L:0xf2baa0,W:0xffe6c6,
 P:0xfbeec8,Y:0xffd766,F:0xfff8e5,
 B:0x16332c,G:0x368b62,E:0x66bd79,N:0xa5eb91,Q:0xe3ffc1,
 S:0x1c4c49,T:0x399b82,A:0x63c6aa,C:0xc2fce2
};
// Each individual cell is an authored 2x2 opaque tile, like the approved
// Petal Dance / Crabhammer matrices. No thick auto-generated stroke geometry.
function stencil(g,rows,x,y,palette=PAL,scale=2,opacity=1,angle=0){
 const w=Math.max(...rows.map(row=>row.length)),h=rows.length;
 const cos=Math.cos(angle),sin=Math.sin(angle),rotated=angle!==0;
 for(let j=0;j<h;j++)for(let i=0;i<rows[j].length;i++){
  const col=palette[rows[j][i]];
  if(col===undefined)continue;
  const dx=(i-(w-1)/2)*scale,dy=(j-(h-1)/2)*scale;
  const rx=rotated?dx*cos-dy*sin:dx;
  const ry=rotated?dx*sin+dy*cos:dy;
  put(g,x+rx,y+ry,scale,scale,col,opacity);
 }
}
const HAND_PAL={K:PAL.K,D:PAL.D,H:PAL.H,L:PAL.L,W:PAL.W};
const HAND_PALM=[
 '......KKKKK......',
 '....KKHHHHHKK....',
 '...KHHLLLLHHHK...',
 '..KHHLLLLLLHHHK..',
 '.KHHHLLLLLLLHHK..',
 'KHHLLLLLLLDDHHHK.',
 'KHHHLLLLLDDDDHK..',
 '.KHHHLLLDDDDHHK..',
 '..KHHHDDDDHHHK...',
 '...KKHHHHHHKK....',
 '.....KHHHHK......',
 '.....KHHHHK......',
 '.....KHHHHK......',
 '......KKKK.......'
];
// Waving index finger — FOUR handmade silhouettes, twelve playback poses.
// Color key K is a real dark outline; H/L/W are shade and highlight.
const FINGER_FRAMES=[
 [
  '......KKK..........','.....KWWK..........','.....KLLK..........',
  '.....KLLK..........','......KLLK.........','......KLLK.........',
  '.......KLLK........','.......KLLK........','........KKK........'
 ],
 [
  '.......KKK.........','......KWWK.........','......KLLK.........',
  '......KLLK.........','......KLLK.........','.......KLLK........',
  '.......KLLK........','.......KLLK........','........KKK........'
 ],
 [
  '........KKK........','........KWWK.......','........KLLK.......',
  '........KLLK.......','........KLLK.......','........KLLK.......',
  '........KLLK.......','........KLLK.......','........KKK........'
 ],
 [
  '..........KKK......','.........KWWK......','.........KLLK......',
  '........KLLK.......','........KLLK.......','........KLLK.......',
  '.......KLLK........','.......KLLK........','........KKK........'
 ]
];
const WAG=[0,1,2,3,3,2,1,0,0,1,2,3];
const GOLD_STAR=[
 '...Y...','.Y.Y.Y.','..YFY..','YYFFFYY','..YFY..','.Y.Y.Y.','...Y...'
];
const GREEN_STAR=[
 '...E...','.E.E.E.','..EN E..'.replace(' ',''),'EEQNQEE',
 '..ENE..','.E.E.E.','...E...'
];
const ABSORB_HEAD=[
 '.....BBB.......',
 '...BBGGGB......',
 '..BGGEEGGB.....',
 '.BGEE NEEGB....'.replace(' ',''),
 'BG EENNNEEGB...'.replace(' ',''),
 'BGEENNQQNEEGB..',
 '.BGEENQQNEGB...',
 '..BGEE NNEGB....'.replace(' ',''),
 '...BGEENGGB....',
 '....BGGBB......',
 '.....BB........'
];
const ABSORB_MOTE=[
 '..B B..'.replace(' ',''),'.BGEGB.','BGENEGB','BGEQEBB',
 '.BGEGB.','..BBB..'
];
const ABSORB_TAIL=[
 '..B...','BEGB..','BGENB.','.BEGB.','..BB..'
];
// Genuine pixel blade sprite (individual jagged silhouette, dark bevel,
// brighter sharpened edge). Two blades cross in combat; NO traced lines.
const SCISSOR_BLADE=[
 '...........................KKKK.....',
 '.........................KKSTTKK...',
 '......................KKSSTAACCK...',
 '..................KKSSSTAAAACCK...',
 '............KKKSSSTAAAAACCCKK....',
 '.....KKKSSSSSTAAAACCCCCCWCK......',
 'KKKSSSTTTAAAAACCCCWWWWCCK........',
 '.KKSSSTTAAAAACCCCWWWCCKK.........',
 '.....KKSSSTAAAACCCCWWCKK..........',
 '..........KKSSSTAAAACCKK..........',
 '..............KKSSSTACK............',
 '..................KKKK.............'
];
const SCISSOR_PALETTE={K:0x183736,S:0x2e635d,T:0x368b74,
 A:0x66bfa0,C:0xa1efd1,W:0xf1fff1};
const CRACK=[
 '..K.K..','.K.C.K.','K.CWC.K','.CWWW C.'.replace(' ',''),
 'K.CWC.K','.K.C.K.','..K.K..'
];
const angle=l=>Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+100)-l.x);
const pos=l=>({x:l.x,y:l.y-(l.alto||36)*.5});
const layer=(e,z)=>e.add.graphics().setDepth(z);
function run(e,loop,graphics){
 let disposed=false;
 const destroy=()=>{if(disposed)return;disposed=true;for(const g of graphics)g.destroy()};
 const fx={update(dt){
  if(disposed)return false;
  if(!loop(Math.min(.055,Math.max(0,dt)))){destroy();return false}
  return true;
 },destroy};
 e.efectos.push(fx);
 return fx;
}
function start(l,move,seconds){
 const a=angle(l);
 l.animar(move,seconds,.12);
 l.accion={hasta:l.t+seconds*.85,lento:.55,angulo:a};
 return a;
}
function intersection(a,b,target,radius=13){
 if(!target||target.ko)return null;
 const x=target.x,y=target.y-(target.alto||36)*.5;
 const dx=b.x-a.x,dy=b.y-a.y;
 const t=sat(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1));
 const u=a.x+t*dx,v=a.y+t*dy;
 return Math.hypot(x-u,y-v)<=Math.max(radius,(target.alto||36)*.32)?{x:u,y:v}:null;
}
function selection(registry){
 return TEST_LIBRARY.filter(m=>m.id!=='metronome'&&
  m.forma!=='torre2_metronome'&&
  !m.pendiente&&typeof registry?.[m.forma]==='function'&&
  !['evolucionar','megaevolucionar','renacer'].includes(m.forma));
}
export function metronome(l,h,extra,registry){
 const e=l.escena,palm=layer(e,1515),stars=layer(e,1516);
 start(l,'Charge',.64);
 let age=0,called=false;
 return run(e,dt=>{
  age+=dt;palm.clear();stars.clear();
  if(l.ko||l.est?.aturdido||age>.79)return false;
  const p=pos(l),cx=p.x,cy=p.y-19;
  if(age<.54){
   const frame=Math.min(11,Math.floor(age*23));
   // Two overlapping hand-drawn sprites are an actual wagging glove,
   // not a slab of rectangles or a cursor outline.
   stencil(palm,HAND_PALM,cx,cy+10,HAND_PAL,3);
   stencil(palm,FINGER_FRAMES[WAG[frame]],cx,cy-20,HAND_PAL,3);
   for(let i=0;i<4;i++){
    const th=(i*PI/2)+age*2.4;
    const sx=cx+Math.cos(th)*(25+i%2*5),sy=cy-16+Math.sin(th)*17;
    stencil(stars,GOLD_STAR,sx,sy,PAL,1,i%2?.75:1);
   }
  }
  if(!called&&age>=.47){
   called=true;
   const moves=selection(registry);
   if(moves.length){
    const chosen=moves[Math.floor(Math.random()*moves.length)];
    // Invoke existing real renderer; never fake the random result.
    registry[chosen.forma](l,{...chosen,coste:0,cd:0},{
     ...extra,metronome:true
    });
   }
  }
  return true;
 },[palm,stars]);
}
export function absorb(l,h,extra){
 const e=l.escena,r=l.rival,leaf=layer(e,1511),essence=layer(e,1512);
 const a=start(l,'Shoot',.83),ux=Math.cos(a),uy=Math.sin(a);
 const body=pos(l),from={x:body.x+ux*12,y:body.y};
 const reach=Math.min(h.alcance??225,245);
 let age=0,prev=from,hit=null,dealt=0,restored=false;
 return run(e,dt=>{
  age+=dt;leaf.clear();essence.clear();
  if(l.ko||l.est?.aturdido||age>1.5)return false;
  if(!hit){
   const dist=age*262;
   if(dist>=reach)return false;
   const tip={x:from.x+ux*dist,y:from.y+uy*dist};
   const contact=intersection(prev,tip,r,13);
   prev=tip;
   if(contact&&r&&!r.ko){
    const before=r.hp;
    const landed=r.recibir(l,{dano:h.dano??7,tipo:h.tipo||'GRASS',
     surge:extra?.surge,slot:extra?.slot,empuje:5,dirX:ux,dirY:uy});
    dealt=Number.isFinite(before)&&Number.isFinite(r.hp)?
     Math.max(0,before-r.hp):0;
    if(landed==='golpe'&&dealt>0){
     hit={x:contact.x,y:contact.y,time:age};
    }else return false;
   }else{
    // Small asymmetrical LEAF, a cluster of veins and a handful of seeds.
    // Twelve distinct pixel frames come from the two authored leaf silhouettes
    // flipping + three staggered hand-drawn motes.
    const flip=Math.floor(age*18)%2;
    stencil(leaf,ABSORB_HEAD,tip.x,tip.y+Math.sin(age*12)*2,
     PAL,3,1,a*.4);
    for(let j=1;j<=3;j++){
     const back=dist-j*15;
     if(back<1)continue;
     const x=from.x+ux*back-uy*Math.sin(age*14+j)*5;
     const y=from.y+uy*back+ux*Math.sin(age*14+j)*5;
     stencil(essence,j%2?ABSORB_MOTE:ABSORB_TAIL,x,y,PAL,2,.8-j*.18);
    }
   }
  }
  if(hit){
   const progress=sat((age-hit.time)/.53);
   const home=pos(l);
   // Thin sequenced ABSORB energy pearls travel enemy -> user, never a
   // thick neon beam or a wall of full-size sprout icons.
   for(let k=0;k<5;k++){
    const t=sat(progress-k*.075);
    const x=hit.x+(home.x-hit.x)*t;
    const y=hit.y+(home.y-hit.y)*t+Math.sin(t*PI*2+k*.7)*5;
    stencil(essence,k%2?ABSORB_TAIL:ABSORB_MOTE,x,y,PAL,
     2,1-k*.13);
   }
   if(progress<.23){
    stencil(leaf,GREEN_STAR,hit.x,hit.y,PAL,2,1-progress*2.8);
   }else if(progress>.74){
    const flare=sat((progress-.74)/.26);
    stencil(leaf,GREEN_STAR,home.x,home.y,PAL,2,flare);
   }
   if(progress>=1&&!restored){
    restored=true;
    if(!l.ko&&Number.isFinite(l.hpMax)&&Number.isFinite(l.hp))
     l.hp+=Math.max(0,Math.min(l.hpMax-l.hp,Math.floor(dealt*.5)));
   }
  }
  return hit?age<hit.time+.65:true;
 },[leaf,essence]);
}
export function xscissor(l,h,extra){
 const e=l.escena,blades=layer(e,1514),chips=layer(e,1515);
 const a=start(l,'Swing',.72),ux=Math.cos(a),uy=Math.sin(a);
 const body=pos(l),reach=Math.min(h.alcance??78,90);
 const cx=body.x+ux*Math.min(reach,62),cy=body.y+uy*Math.min(reach,62);
 let age=0,resolved=false,landed=false;
 return run(e,dt=>{
  age+=dt;blades.clear();chips.clear();
  if(l.ko||l.est?.aturdido||age>.74)return false;
  // 12 animation frames: fast windup, two sharp PIXEL blades sweep across
  // independently, then stagger and break apart at the crossing.
  const f=Math.min(11,Math.floor(age/.065));
  const progress=sat((age-.12)/.27);
  const opacity=sat(age*13)*sat((.75-age)*6);
  if(age<.64){
   const spread=(1-progress)*17;
   const sideX=-uy,sideY=ux;
   const sx=sideX*spread,sy=sideY*spread;
   // Sprite source pixels are rotated IN INTEGER CELLS, no SVG line or
   // automatically drawn X. Distinct serrated outlines stay visible.
   stencil(blades,SCISSOR_BLADE,cx+sx,cy+sy,SCISSOR_PALETTE,2,
    opacity,a+PI/4);
   stencil(blades,SCISSOR_BLADE,cx-sx,cy-sy,SCISSOR_PALETTE,2,
    opacity,a-PI/4);
  }
  if(!resolved&&age>=.37){
   resolved=true;
   const rival=l.rival;
   const close=rival&&!rival.ko&&
    Math.hypot(rival.x-l.x,rival.y-l.y)<=reach+16;
   const contact=close&&intersection(
    {x:cx-ux*29,y:cy-uy*29},{x:cx+ux*29,y:cy+uy*29},rival,15);
   if(contact){
    const dx=rival.x-l.x,dy=rival.y-l.y,d=Math.hypot(dx,dy)||1;
    const old=rival.hp;
    const outcome=rival.recibir(l,{dano:h.dano??19,tipo:h.tipo||'BUG',
     surge:extra?.surge,slot:extra?.slot,empuje:24,dirX:dx/d,dirY:dy/d});
    landed=outcome==='golpe'||rival.hp<old;
   }
  }
  if(landed&&age>=.37&&age<.61){
   const impact=sat((age-.37)/.23);
   // Inked impact splinters in 4 directions, only after a REAL hit.
   for(let k=0;k<4;k++){
    const th=k*PI/2+a;
    const d=6+21*impact;
    stencil(chips,k%2?GOLD_STAR:GREEN_STAR,cx+Math.cos(th)*d,
     cy+Math.sin(th)*d,k%2?PAL:PAL,1,1-impact);
   }
   if(age<.45)stencil(chips,CRACK,cx,cy,SCISSOR_PALETTE,2,.85);
  }
  return true;
 },[blades,chips]);
}
export const TORRE2_NEW_SPECIFIC_FORMS=Object.freeze({
 torre2_metronome:metronome,torre2_absorb:absorb,torre2_xscissor:xscissor
});
