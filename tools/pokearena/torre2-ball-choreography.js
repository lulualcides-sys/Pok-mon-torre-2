/* Pokémon Torre 2 — reusable Phaser/WebGL Pokéball choreography.
 * Kinematic phases inspired by the MIT-licensed arena controller in
 * GBurgardt/pokemon-emerald-arena. Pixel-cell ball art is owned by Torre 2.
 * No canvas, video composites, DOM animation or original-game C code.
 * Source: https://github.com/GBurgardt/pokemon-emerald-arena
 * See credits and per-asset license conditions in docs.
 */
export const clamp01=v=>Math.max(0,Math.min(1,Number(v)||0));
export function ballArc(from,to,t,height=52){
 const p=clamp01(t);
 return {x:from.x+(to.x-from.x)*p,
  y:from.y+(to.y-from.y)*p-4*height*p*(1-p)};
}
export function captureImpact(aim,target,radius=24){
 return Number.isFinite(aim?.x)&&Number.isFinite(aim?.y)&&
  Number.isFinite(target?.x)&&Number.isFinite(target?.y)&&
  Math.hypot(aim.x-target.x,aim.y-target.y)<=radius;
}
export function drawCaptureReticle(g,x,y,valid=true){
 const color=valid?0x91ffe5:0xffaa75;
 g.lineStyle(2,0x091d33,.88);
 g.strokeCircle(Math.round(x),Math.round(y),19);
 g.lineStyle(2,color,.97);
 g.strokeCircle(Math.round(x),Math.round(y),16);
 g.lineBetween(x-25,y,x-8,y);
 g.lineBetween(x+8,y,x+25,y);
 g.lineBetween(x,y-25,x,y-8);
 g.lineBetween(x,y+8,x,y+25);
 g.fillStyle(0xfff2cc,1);g.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);
}
export function drawRedBeam(g,origin,target,strength=1){
 const a=clamp01(strength);
 const dx=target.x-origin.x,dy=target.y-origin.y;
 const dist=Math.max(1,Math.hypot(dx,dy));
 const nx=-dy/dist,ny=dx/dist;
 g.lineStyle(12,0x9e1b48,.32*a);g.lineBetween(origin.x,origin.y,target.x,target.y);
 g.lineStyle(6,0xf73d67,.7*a);g.lineBetween(origin.x,origin.y,target.x,target.y);
 g.lineStyle(2,0xffecd1,.98*a);g.lineBetween(origin.x,origin.y,target.x,target.y);
 g.fillStyle(0xff456e,.27*a);
 g.fillTriangle(origin.x,origin.y,target.x+nx*12,target.y+ny*12,target.x-nx*12,target.y-ny*12);
 for(let i=1;i<6;i++){
  const p=i/6;
  const x=origin.x+dx*p,y=origin.y+dy*p;
  g.fillStyle(i%2?0xffedb5:0xff4d78,.7*a);
  g.fillRect(Math.round(x+nx*((i%3)-1)*3)-2,Math.round(y+ny*((i%3)-1)*3)-1,4,3);
 }
}
export function drawReleaseBurst(g,x,y,progress=0){
 const t=clamp01(progress),radius=4+24*t,alpha=(1-t)*.95;
 g.lineStyle(3,0xffe4a7,alpha);g.strokeCircle(x,y,radius);
 g.lineStyle(2,0xff5279,alpha*.75);g.strokeCircle(x,y,radius*.55);
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+t*.2,r=radius*(.7+i%2*.2);
  g.fillStyle(i%2?0xffffff:0xffbb72,alpha);
  g.fillRect(Math.round(x+Math.cos(a)*r)-2,Math.round(y+Math.sin(a)*r)-2,4,4);
 }
}
