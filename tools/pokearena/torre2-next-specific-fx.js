/* Pokemon Torre 2: Metronome, Absorb, X-Scissor.
 * Dedicated, independently animated pixel-art FX. No native Poké Arena FX changed.
 * Phaser Graphics -> WebGL; never Canvas2D, PNG overlays or CSS attacks.
 */
import {TEST_LIBRARY} from './move-pool.js';
const PI=Math.PI;
const sat=x=>Math.max(0,Math.min(1,x));
const px=x=>Math.round(x);
const put=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(px(x),px(y),Math.max(1,px(w)),Math.max(1,px(h)))};
const C={ink:0x172633,deep:0x214b38,green:0x2c9864,light:0x91de81,
 lime:0xc9fb91,white:0xf5ffdc,bug:0x68cbb0,edge:0x2b635c,
 rose:0xffdcab,hand:0xf2b58f,shadow:0xc27d78,gold:0xffdf7a};
const origin=l=>({x:l.x,y:l.y-(l.alto||36)*.5});
const aim=l=>Math.atan2((l.ay??l.y)-l.y,(l.ax??l.x+100)-l.x);
const layer=(e,depth=1512)=>e.add.graphics().setDepth(depth);
function effect(e,draw,graphics){
 let destroyed=false;
 const stop=()=>{
  if(destroyed)return;destroyed=true;
  for(const g of graphics)g.destroy();
 };
 const fx={
  update(dt){
   if(destroyed)return false;
   if(draw(Math.min(.06,Math.max(0,dt)))===false){stop();return false}
   return true;
  },
  destroy:stop
 };
 e.efectos.push(fx);
 return fx;
}
function project(a,b,r,radius=14){
 if(!r||r.ko)return null;
 const cx=r.x,cy=r.y-(r.alto||36)*.5;
 const vx=b.x-a.x,vy=b.y-a.y;
 const t=sat(((cx-a.x)*vx+(cy-a.y)*vy)/(vx*vx+vy*vy||1));
 const x=a.x+vx*t,y=a.y+vy*t;
 if(Math.hypot(cx-x,cy-y)>Math.max(radius,(r.alto||36)*.32))return null;
 return{x,y};
}
function drawSprite(g,rows,palette,cx,cy,scale=2,alpha=1){
 const height=rows.length,width=Math.max(...rows.map(x=>x.length));
 for(let y=0;y<height;y++)for(let x=0;x<rows[y].length;x++){
  const color=palette[rows[y][x]];
  if(color!==undefined)put(g,cx+(x-width/2)*scale,cy+(y-height/2)*scale,
   scale,scale,color,alpha);
 }
}
function sparkle(g,x,y,t,color=C.gold){
 for(let k=0;k<4;k++){
  const a=k*PI/2;
  put(g,x+Math.cos(a)*(3+t*7),y+Math.sin(a)*(3+t*7),2,2,color,1-t);
 }
}
function pointerPose(g,cx,cy,frame){
 // Hand-inked four-frame index-finger wag: curved glove, fingertip and cuff.
 // No geometric cursor or floating generic CSS circle.
 const rows=[
  '..KKKKKK...', '.KHHHHHHK..','.KHLHHHHK..','.KHHHHHHK..',
  '..KKKHHHK..','....KHHHK..','..KKHHHHK..','.KHHHHHHHK.',
  'KHHHHHHHHK.','KHHHHHHHHK.','.KHHHHHHK..','..KKKKKK...'
 ];
 drawSprite(g,rows,{K:C.ink,H:C.hand,L:C.rose},cx,cy+7,2);
 const shift=[-5,-2,4,1][frame%4];
 const baseX=cx+shift;
 put(g,baseX-4,cy-26,10,22,C.ink);
 put(g,baseX-2,cy-25,6,20,C.hand);
 put(g,baseX-1,cy-24,3,14,C.rose);
 put(g,baseX-4,cy-30,10,5,C.ink);
 put(g,baseX-2,cy-29,6,4,C.rose);
 put(g,cx-8,cy+18,16,4,C.ink);
 put(g,cx-6,cy+18,12,3,C.shadow);
}
function start(l,anim,dur){
 const a=aim(l);
 l.animar(anim,dur,.12);
 l.accion={hasta:l.t+dur*.9,lento:.55,angulo:a};
 return a;
}
function choose(registry){
 // Call an actual existing battle renderer, not a fake damage placeholder.
 // Metronome itself, unavailable and system-only effects cannot recurse.
 return TEST_LIBRARY.filter(h=>h.id!=='metronome'&&h.forma!=='torre2_metronome'
  &&!h.pendiente&&typeof registry?.[h.forma]==='function'&&
  !['evolucionar','megaevolucionar','renacer'].includes(h.forma));
}
export function metronome(l,h,extra,registry){
 const e=l.escena;
 const hand=layer(e,1515),stars=layer(e,1516);
 start(l,'Charge',.58);
 let age=0,chosen=false;
 return effect(e,dt=>{
  age+=dt;hand.clear();stars.clear();
  if(l.ko||l.est?.aturdido||age>.82)return false;
  const body=origin(l),cx=body.x+Math.cos(age*8)*3,cy=body.y-12;
  if(age<.57){
   pointerPose(hand,cx,cy,Math.floor(age*16));
   for(let i=0;i<7;i++){
    const a=i*2.39996+age*3,r=14+Math.sin(age*10+i)*4;
    put(stars,cx+Math.cos(a)*r,cy-10+Math.sin(a)*r,2,2,
     i%2?C.gold:C.white,.5+.3*Math.sin(age*14+i)**2);
   }
  }
  if(!chosen&&age>=.47){
   chosen=true;
   const options=choose(registry);
   if(options.length){
    const picked=options[Math.floor(Math.random()*options.length)];
    // The cast has already paid the Metronome cost/cooldown; called move
    // runs through the genuine native/custom renderer with no second charge.
    const move={...picked,coste:0,cd:0};
    registry[picked.forma](l,move,{...extra,metronome:true});
    if(typeof e.add.text==='function'){
     const caption=e.add.text(body.x,body.y-58,picked.nombre,{
      fontFamily:'Pixelify Sans, monospace',fontSize:'11px',color:'#f9e8ae',
      stroke:'#101725',strokeThickness:3
     }).setOrigin(.5).setDepth(1523);
     if(e.time?.delayedCall)e.time.delayedCall(680,()=>caption.destroy());
     else caption.destroy();
    }
   }
  }
  return true;
 },[hand,stars]);
}
function sprout(g,x,y,t=0){
 // Sprout icon with ink outline, a leaf on each side and luminous veins.
 const rows=['.....K.....','..KKGKKKK..','.KGGWGGGK..',
 '..KGGGGK...','....KGK....','....KGK....',
 '...KGGGK...','..KGGGGGK..','...KKKKK...'];
 drawSprite(g,rows,{K:C.ink,G:C.green,W:C.lime},x,y,2,1-t*.25);
}
export function absorb(l,h,extra){
 const e=l.escena,r=l.rival,beam=layer(e,1511),drain=layer(e,1512);
 const a=start(l,'Shoot',.78),ux=Math.cos(a),uy=Math.sin(a);
 const body=origin(l),from={x:body.x+ux*11,y:body.y};
 const reach=Math.min(h.alcance??220,245),speed=265;
 let age=0,previous=from,hit=null,damage=0,restored=false;
 return effect(e,dt=>{
  age+=dt;beam.clear();drain.clear();
  if(l.ko||l.est?.aturdido||age>1.48)return false;
  if(!hit){
   const dist=speed*age;
   if(dist>reach)return false;
   const tip={x:from.x+ux*dist,y:from.y+uy*dist};
   const collision=project(previous,tip,r,12);
   previous=tip;
   if(collision&&r&&!r.ko){
    const before=r.hp;
    const result=r.recibir(l,{
     dano:h.dano??7,tipo:h.tipo||'GRASS',slot:extra?.slot,
     surge:extra?.surge,empuje:5,dirX:ux,dirY:uy
    });
    const after=r.hp;
    // Only genuinely inflicted damage can be drained; no auto-heal on miss.
    damage=Number.isFinite(before)&&Number.isFinite(after)?
     Math.max(0,before-after):0;
    if(result==='golpe'&&damage>0)hit={x:collision.x,y:collision.y,time:age};
    else return false;
   }else{
    sprout(beam,tip.x,tip.y);
    for(let k=1;k<=4;k++){
     const d=Math.max(0,dist-k*11);
     const x=from.x+ux*d,y=from.y+uy*d;
     put(beam,x+Math.sin(age*13-k)*3,y+Math.cos(age*13-k)*3,3,3,
      k%2?C.light:C.lime,.9-k*.13);
    }
   }
  }
  if(hit){
   const progress=sat((age-hit.time)/.50),there={x:hit.x,y:hit.y};
   // Visible return path FROM struck enemy TO caster. HP recovery happens
   // only when the energy completes its journey to the user.
   const home=origin(l);
   const fromX=there.x+(home.x-there.x)*progress;
   const fromY=there.y+(home.y-there.y)*progress;
   for(let k=0;k<6;k++){
    const t=sat(progress-k*.065),x=there.x+(home.x-there.x)*t;
    const y=there.y+(home.y-there.y)*t+Math.sin(t*PI*3+k)*4;
    sprout(drain,x,y,Math.min(.9,k*.12));
    put(drain,x-1,y-1,3,3,k%2?C.white:C.lime);
   }
   sparkle(beam,fromX,fromY,progress*.85,C.light);
   if(progress>=1&&!restored){
    restored=true;
    if(!l.ko&&Number.isFinite(l.hp)&&Number.isFinite(l.hpMax)){
     const heal=Math.max(0,Math.min(l.hpMax-l.hp,Math.floor(damage*.5)));
     l.hp+=heal;
    }
   }
  }
  return hit?age<hit.time+.60:true;
 },[beam,drain]);
}
function scissor(g,cx,cy,angle,phase,opacity=1){
 // Two hand-authored serrated pixel blades crossing as a crisp X, not
 // projectiles. Every cell is discrete; no arcs, circles or vector paths.
 const ca=Math.cos(angle),sa=Math.sin(angle),step=2;
 const twist=phase*1.8;
 for(let arm=-1;arm<=1;arm+=2){
  const rot=arm*(.95-twist*.17);
  for(let j=-15;j<=15;j++){
   const u=j*step;
   const v=(Math.round(Math.sin(rot)*j))*step;
   const xx=cx+u*ca-v*sa,yy=cy+u*sa+v*ca;
   put(g,xx-4,yy-4,8,8,C.ink,opacity);
   put(g,xx-2,yy-3,5,6,C.edge,opacity);
   put(g,xx-1,yy-3,3,4,arm<0?C.light:C.bug,opacity);
   if(j%4===0)put(g,xx,yy-2,2,2,C.white,opacity);
  }
 }
}
export function xscissor(l,h,extra){
 const e=l.escena,slashes=layer(e,1515),impact=layer(e,1516);
 const a=start(l,'Swing',.68),ux=Math.cos(a),uy=Math.sin(a);
 const body=origin(l),reach=Math.min(h.alcance??78,92);
 const center={x:body.x+ux*Math.min(reach,62),y:body.y+uy*Math.min(reach,62)};
 let age=0,resolved=false;
 return effect(e,dt=>{
  age+=dt;slashes.clear();impact.clear();
  if(l.ko||l.est?.aturdido||age>.73)return false;
  const t=sat((age-.11)/.29);
  if(age<.61)scissor(slashes,center.x,center.y,a,t,
   sat(age/.08)*sat((.7-age)/.2));
  if(!resolved&&age>=.37){
   resolved=true;
   // One contact hit after BOTH crossing pixel blades converge.
   // Aiming elsewhere or being too far away must miss.
   const within=r=>{
    const target=origin(r);
    return Math.hypot(r.x-l.x,r.y-l.y)<=reach+16&&
     project({x:center.x-ux*15,y:center.y-uy*15},
             {x:center.x+ux*15,y:center.y+uy*15},r,18);
   };
   const target=l.rival;
   if(target&&!target.ko&&within(target)){
    const dx=target.x-l.x,dy=target.y-l.y,d=Math.hypot(dx,dy)||1;
    target.recibir(l,{dano:h.dano??18,tipo:h.tipo||'BUG',
     surge:extra?.surge,slot:extra?.slot,empuje:24,dirX:dx/d,dirY:dy/d});
    sparkle(impact,center.x,center.y,0,C.white);
   }
  }
  if(age>=.37&&age<.61){
   const t=sat((age-.37)/.24);
   for(let k=0;k<5;k++){
    const th=(k+.5)*PI*2/5;
    put(impact,center.x+Math.cos(th)*(4+18*t),
     center.y+Math.sin(th)*(4+18*t),3,3,
     k%2?C.lime:C.white,1-t);
   }
  }
  return true;
 },[slashes,impact]);
}
export const TORRE2_NEW_SPECIFIC_FORMS=Object.freeze({
 torre2_metronome:metronome,torre2_absorb:absorb,torre2_xscissor:xscissor
});
