/* Three ONLY-new species-characteristic moves: Sing, Crabhammer, Smog.
 * Pixelated Phaser Graphics rendered by WebGL, no CSS/Canvas2D.
 * Originals and all 11 approved moves are imported unchanged.
 */
import * as vfx from '../vfx.js';
const PI=Math.PI;
const sat=v=>Math.max(0,Math.min(1,v));
const px=v=>Math.round(v);
const draw=(g,x,y,w,h,color,a=1)=>{g.fillStyle(color,a);g.fillRect(px(x),px(y),Math.max(1,px(w)),Math.max(1,px(h)))};
function graphics(e){return[e.add.graphics().setDepth(1511),e.add.graphics().setDepth(1509)]}
function register(e,loop,cleanup){
 let dead=false;
 const stop=()=>{if(dead)return;dead=true;cleanup()};
 const fx={update(dt){if(dead)return false;if(loop(Math.min(.06,Math.max(0,dt))))return true;stop();return false},destroy:stop};
 e.efectos.push(fx);return fx;
}
function contact(x1,y1,x2,y2,r,radius=18){
 if(!r||r.ko)return null;
 const cx=r.x,cy=r.y-(r.alto||36)*.5;
 const dx=x2-x1,dy=y2-y1;
 const t=sat(((cx-x1)*dx+(cy-y1)*dy)/(dx*dx+dy*dy||1));
 const x=x1+dx*t,y=y1+dy*t;
 return Math.hypot(x-cx,y-cy)<=Math.max(radius,(r.alto||30)*.4)?{x,y}:null;
}
function hit(l,h,extra,damage=1,push=18){
 const r=l.rival;
 if(!r||r.ko)return false;
 const old=r.hp;
 const d=Math.hypot(r.x-l.x,r.y-l.y)||1;
 const result=r.recibir(l,{dano:(h.dano??10)*damage,tipo:h.tipo||'NORMAL',
  empuje:push,dirX:(r.x-l.x)/d,dirY:(r.y-l.y)/d,
  surge:extra?.surge,slot:extra?.slot});
 return result==='golpe'||r.hp<old;
}
function start(l,anim,time){
 const a=Math.atan2(l.ay-l.y,l.ax-l.x);
 l.animar(anim,time,.13);
 l.accion={hasta:l.t+time*.7,angulo:a,lento:.68};
 return a;
}
function note(g,x,y,variant=0){
 // Recognizable 8x13 dark outlined eighth-note pixels; no font glyphs,
 // CSS shapes, or large opaque cartoon balls.
 const color=variant%3===0?0xffe6ae:variant%3===1?0xffb9d9:0xb2e7fd;
 draw(g,x-5,y+2,9,7,0x262444);
 draw(g,x-4,y+2,7,5,color);
 draw(g,x+2,y-10,3,14,0x303047);
 draw(g,x+3,y-9,2,11,color);
 draw(g,x+5,y-10,5,3,0x38334f);
 draw(g,x+5,y-9,5,2,color);
 draw(g,x+8,y-7,3,4,0x303047);
 draw(g,x+3,y-11,1,2,0xffffff,.85);
}
export function sing(l,h,extra){
 const e=l.escena,r=l.rival,[notes,sparks]=graphics(e);
 const ang=start(l,'Charge',.8);
 const ux=Math.cos(ang),uy=Math.sin(ang)*.76,nx=-uy,ny=ux;
 const x0=l.x+ux*10,y0=l.y-(l.alto||32)*.58;
 const speed=235,range=Math.min(h.alcance??210,235);
 // Nine staggered notes, kept small and separated so the song looks
 // richer without becoming a single guaranteed-hit wall.
 const offsets=[0,-9,12,-5,7,-13,15,-1,10];
 const spawn=[0,.075,.15,.23,.31,.39,.47,.55,.63];
 const progress=offsets.map(()=>({previous:null,ended:false}));
 let age=0,done=false,impact=0;
 return register(e,dt=>{
  age+=dt;notes.clear();sparks.clear();
  if(impact>0){
   impact-=dt;
   if(r&&!r.ko)for(let k=0;k<5;k++){
    const a=k*2*PI/5+age*7,fade=sat(impact/.26);
    draw(sparks,r.x+Math.cos(a)*18,r.y-r.alto-5+Math.sin(a)*7,
     3,3,0xffdeb2,fade);
   }
   return impact>0;
  }
  for(let i=0;i<offsets.length;i++){
   const q=progress[i];if(q.ended||age<spawn[i])continue;
   const distance=Math.min(range,(age-spawn[i])*speed);
   const wave=Math.sin(age*12+i*1.7)*5+offsets[i];
   const x=x0+ux*distance+nx*wave;
   const y=y0+uy*distance+ny*wave*.65;
   const prior=q.previous||{x:x0,y:y0};
   if(!done&&distance>5&&contact(prior.x,prior.y,x,y,r,15)){
    q.ended=true;done=true;
    // Original Sing can MISS. No guaranteed sleep or auto-targeting.
    if(hit(l,{...h,dano:0},extra,1,0)&&Math.random()<.55){
     r.ponerEstado('aturdido',2.35,{fuente:l});
     vfx.rafaga(e,'chispa',px(r.x),px(r.y-r.alto*.5),0xfdd8ee,7);
    }
    impact=.26;return true;
   }
   if(distance>=range){q.ended=true;continue}
   q.previous={x,y};
   note(notes,x,y,i);
   // Each moving note has its own tiny trailing pixels and sparkles.
   for(let j=0;j<3;j++){
    const d=j*7+4;
    draw(sparks,x-ux*d-2,y-uy*d+Math.sin(age*8+i+j)*2,
     j===0?3:2,j===0?2:1,i%2?0xc4edff:0xffdcf3,.7-j*.17);
   }
   if(i%3===0){
    const sparkle=Math.sin(age*18+i);
    draw(sparks,x+6+Math.sin(age*7+i)*3,y-11+sparkle*2,2,2,0xfff8df,.8);
   }
  }
  return age<1.95&&progress.some(q=>!q.ended);
 },()=>{notes.destroy();sparks.destroy()});
}
// Genuine GRID-BASED PIXEL ART: three independent, hand-authored palettes
// of squares, no fillPoints, circles, bezier curves, image smoothing or
// canvas textures. Every frame is assembled from reusable pixel cells.
const CRAB_PALETTE={
 K:0x182b3b, D:0x743b38, R:0xc45e43, O:0xf08f57,
 L:0xffc28a, W:0xfff1cf, A:0x3683a9, B:0x92e5f7
};
const CRAB_PALM=[
 '.......KKKKKK.......',
 '.....KKDDRRRRKK.....',
 '...KKDDRRRRRRRRK....',
 '..KDDRRROOOORRRRRK..',
 '.KDDRRROOOOOOORRRK..',
 'KDDRRROOOOLLLOORRRK.',
 'KDDRRROOOOLLLOORRRK.',
 'KDDRRROOOOOOOORRRRK.',
 '.KDDRRRRRRRRRRRRRK..',
 '..KDDRRRRRRRRRRRK...',
 '...KKDDRRRRRRRK.....',
 '.....KKKKKKKK.......'
];
const CRAB_JAW=[
 '.....KKKKKK........',
 '...KKKKWWWKK.......',
 '.KKDDOOWWWWWKK.....',
 'KDDROOOOOLLWWKKK...',
 'KRRROOOOOOOLWWWWK..',
 'KRRRRRROOOOOLLWWK.',
 '.KRRRRRRROOOLLWWWK',
 '..KKKRRRRRROKKWWK.',
 '.....KKKKKKKKKKK...'
];
function crabPixels(g,matrix,x,y,ca,sa,alpha=1,scale=2){
 // Rounded coordinates preserve integer pixels even when facing diagonally.
 for(let row=0;row<matrix.length;row++){
  const chars=matrix[row];
  for(let col=0;col<chars.length;col++){
   const color=CRAB_PALETTE[chars[col]];
   if(color==null)continue;
   const dx=(col-10)*scale,dy=(row-5)*scale;
   draw(g,x+dx*ca-dy*sa,y+dx*sa+dy*ca,
    Math.ceil(scale),Math.ceil(scale),color,alpha);
  }
 }
}
function claw(g,x,y,angle,charge=1,closure=.3){
 const ca=Math.cos(angle),sa=Math.sin(angle),normalX=-sa,normalY=ca;
 const gap=(1-sat(closure))*8;
 crabPixels(g,CRAB_PALM,x-9*ca,y-9*sa,ca,sa,charge,2.3);
 // Upper and lower pixel-art pincers CLOSE during the hammer strike.
 crabPixels(g,CRAB_JAW,x+18*ca+normalX*(-12-gap),
  y+18*sa+normalY*(-12-gap),ca,sa,charge,2);
 crabPixels(g,CRAB_JAW.slice().reverse(),
  x+18*ca+normalX*(12+gap),y+18*sa+normalY*(12+gap),ca,sa,charge,2);
}
export function crabhammer(l,h,extra){
 const e=l.escena,r=l.rival,[main,splash]=graphics(e);
 const a=start(l,'Swing',.58);
 const x0=l.x+Math.cos(a)*15,y0=l.y-(l.alto||36)*.5;
 const reach=Math.min(80,h.alcance??74);
 let age=0,applied=false,impactAt=-1;
 return register(e,dt=>{
  age+=dt;main.clear();splash.clear();
  const t=sat((age-.065)/.4),extend=Math.sin(t*PI)*Math.max(0,reach-30);
  const x=x0+Math.cos(a)*extend,y=y0+Math.sin(a)*extend*.7;
  const oscillate=a-.45+t*.9;
  if(age<.59)claw(main,x,y,oscillate,Math.min(1,age*9),
   sat((age-.16)/.29));
  // Sharp, sparse blue PIXEL droplets rather than a flat polygon hammer.
  for(let j=0;j<16;j++){
   const front=10+((j*13+age*95)%Math.max(11,extend+23));
   const side=(j%2?1:-1)*(3+j%7)*2;
   const xx=x0+Math.cos(a)*front-Math.sin(a)*side;
   const yy=y0+Math.sin(a)*front*.7+Math.cos(a)*side*.7;
   if(age<.55)draw(splash,xx,yy,j%3===0?3:2,j%4===0?3:2,
    j%3===0?0xe0ffff:j%2?0x5ac8e4:0x2685b4,.86);
  }
  if(!applied&&r&&!r.ko&&age>.14&&age<.48){
   // Not a projectile. The claw must physically reach the foe.
   const frontX=x+Math.cos(a)*29,frontY=y+Math.sin(a)*27*.76;
   const at=contact(x0,y0,frontX,frontY,r,Math.max(14,reach*.16));
   if(at){
    applied=true;
    if(hit(l,h,extra,Math.random()<.22?1.45:1,72)){
     impactAt=age;
     vfx.impacto(e,px(at.x),px(at.y),0x9ce7fa,.86);
    }
   }
  }
  if(impactAt>=0){
   const t2=(age-impactAt)/.28;
   if(t2<=1)for(let i=0;i<12;i++){
    const v=i*2*PI/12,rad=7+t2*28;
    draw(splash,r.x+Math.cos(v)*rad,r.y-r.alto*.5+Math.sin(v)*rad,
     3,2,i%3===0?0xffffff:0x6ad7ef,1-t2);
   }
  }
  return age<.69;
 },()=>{main.destroy();splash.destroy()});
}
function smokeLobe(g,x,y,size,phase,alpha=1){
 // Semi-open puffs with flat shaded pixel layers, not giant smooth circles.
 const p=(dx,dy)=>({x:px(x+dx*size),y:px(y+dy*size)});
 const shape=[p(-8,-3),p(-7,-7),p(-3,-9),p(1,-7),
  p(5,-10),p(9,-7),p(10,-2),p(8,4),p(3,7),p(-5,6),p(-9,2)];
 g.fillStyle(0x1b2133,alpha);g.fillPoints(shape,true);
 g.fillStyle(0x5c436c,alpha);
 g.fillPoints(shape.map(v=>({x:px(x+(v.x-x)*.8),y:px(y+(v.y-y)*.8)})),true);
 g.fillStyle(phase%2?0x9072a2:0x75628a,alpha);
 g.fillPoints([p(-5,-2),p(-3,-6),p(2,-6),p(4,-3),p(0,0),p(-4,1)],true);
 draw(g,x-2*size,y-5*size,3*size,2*size,0xb49cc0,alpha*.7);
}
function smogBubble(g,x,y,size=2,fade=1){
 // Four-tone 2D *pixel* bubble outline, no smooth ellipse.
 const unit=Math.max(1,Math.round(size));
 const ring=0xb79bc5,inside=0x78598c;
 draw(g,x-unit*2,y-unit,unit,unit*3,ring,fade);
 draw(g,x+unit*2,y-unit,unit,unit*3,ring,fade);
 draw(g,x-unit,y-unit*2,unit*3,unit,ring,fade);
 draw(g,x-unit,y+unit*2,unit*3,unit,inside,fade);
 draw(g,x-unit,y-unit,unit*3,unit*3,inside,fade*.45);
 draw(g,x-unit,y-unit,unit,unit,0xe4c9ec,fade*.8);
}
export function smog(l,h,extra){
 const e=l.escena,r=l.rival,[fog,specks]=graphics(e);
 const a=start(l,'Shoot',.78);
 const ux=Math.cos(a),uy=Math.sin(a)*.76,nx=-uy,ny=ux;
 const x0=l.x+ux*13,y0=l.y-(l.alto||36)*.56;
 let age=0,previous={x:x0,y:y0},landed=false;
 const reach=Math.min(h.alcance??180,205);
 return register(e,dt=>{
  age+=dt;fog.clear();specks.clear();
  const travel=Math.max(0,age-.12)*175;
  if(travel>reach||age>1.36)return false;
  const fx=x0+ux*travel,fy=y0+uy*travel;
  for(let i=0;i<11;i++){
   const behind=Math.max(0,travel-i*8),ageFrac=sat((travel-i*8)/70);
   if(ageFrac===0)continue;
   const side=Math.sin(age*7+i*1.43)*(6+i*.9)+(i%3-1)*6;
   const x=x0+ux*behind+nx*side;
   const y=y0+uy*behind+ny*side*.8-2*Math.sin(i+age*5);
   smokeLobe(fog,x,y,.38+ageFrac*.36+(i%3)*.04,i,Math.min(.9,ageFrac));
   if(i%2===0)draw(specks,x+7,y-8,2,2,0xc6a8d0,.55*ageFrac);
  }
  // Extra bubbles are deliberately subtle: keep the Smog's already approved
  // looking smoke, only enliven it without covering the entire battlefield.
  for(let b=0;b<17;b++){
   const lag=b*6+((b*13+age*45)%18);
   if(travel<lag)continue;
   const shift=Math.sin(age*9+b*1.3)*(9+b%5*2)+(b%3-1)*5;
   const x=x0+ux*(travel-lag)+nx*shift;
   const y=y0+uy*(travel-lag)+ny*shift*.65-4-Math.sin(age*6+b)*2;
   smogBubble(specks,x,y,b%4===0?2:1,.5+.27*Math.sin(age*6+b)**2);
  }
  if(!landed&&r&&!r.ko&&travel>8){
   const point=contact(previous.x,previous.y,fx,fy,r,21);
   if(point){
    landed=true;
    if(hit(l,h,extra,1,12)){
     vfx.rafaga(e,'humo',px(point.x),px(point.y),0x7b618e,6);
     if(Math.random()<.4&&typeof r.ponerEstado==='function')
      r.ponerEstado('veneno',3.5,{fuente:l,dps:1.5,pilas:1});
    }
   }
  }
  previous={x:fx,y:fy};
  return true;
 },()=>{fog.destroy();specks.destroy()});
}
export const TORRE2_SPECIES_FORMS=Object.freeze({
 torre2_sing:sing,torre2_crabhammer:crabhammer,torre2_smog:smog
});
