/* v0.6 — authored continuous-flame animation:
 * 12 WebGL-generated pixel-art frames; no extracted Poké Arena assets or Canvas2D.
 * Keeps independently constructed impact atlases, Fire Blast glyph and rock battle.
 */
import {buildAtlases as baseBuild,buildImpactAtlases,createImpact,renderImpact} from './effects-v03.js';
export {buildImpactAtlases,createImpact,renderImpact};
const INK=0x170f17,RIM=0x9b2b1b,ORANGE=0xf45a19,GOLD=0xffa02b,
 YELLOW=0xffdd57,WHITE=0xfff6b5;
function box(g,x,y,w,h,c,a=1){g.beginFill(c,a).drawRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))).endFill()}
function tongue(P,frame){
 const g=new P.Graphics(),f=frame%12;
 const L=190,mid=41;
 const top=[],bottom=[];
 // Every column connects to its neighbours, forming one fluid jet.
 for(let x=0;x<=L;x+=3){
  const t=x/L;
  const taper=Math.max(0.06,Math.min(1,x/28, (L-x)/21));
  const ripple=Math.sin(x*.115+f*.58)*3+Math.sin(x*.28-f*.66)*2;
  const belly=11+14*Math.sin(Math.PI*t)+ripple;
  const yShift=3*Math.sin(x*.077+f*.52)+2*Math.sin(x*.18-f*.43);
  const w=Math.max(3,belly*taper);
  top.push(Math.round(mid+yShift-w));
  bottom.push(Math.round(mid+yShift+w));
 }
 // Thick irregular black silhouette: x-by-x pixel blocks avoid smooth CSS appearance.
 for(let i=0;i<top.length;i++){
  const x=i*3,t=top[i],b=bottom[i];
  box(g,x,t-3,4,b-t+7,INK);
 }
 for(let i=0;i<top.length;i++){
  const x=i*3,t=top[i],b=bottom[i],w=b-t;
  if(w<5)continue;
  box(g,x+1,t+1,3,w-1,RIM);
  box(g,x+1,t+3,3,Math.max(2,w-5),ORANGE);
  if(w>16){box(g,x+1,t+7,3,w-13,GOLD);}
  if(w>25){
   const noise=(Math.floor(x/9)+f*3)%7;
   box(g,x+2,t+11+noise%3,2,Math.max(3,w-25),noise>4?WHITE:YELLOW);
  }
 }
 // Animated licks shoot out of the shared outer contour, never five spheres.
 for(let i=0;i<13;i++){
  const x=12+i*13+((f+i)%4)*2;
  const idx=Math.min(top.length-1,Math.floor(x/3));
  const flip=(i+f)%2===0;
  const y=flip?top[idx]-2:bottom[idx]+1;
  const len=5+((i*7+f*3)%11);
  const pos=flip?y-len:y;
  box(g,x-2,pos-2,9,len+5,INK);
  box(g,x,pos,6,Math.max(3,len),RIM);
  box(g,x+1,pos+2,4,Math.max(2,len-4),i%2?ORANGE:GOLD);
  box(g,x+2,pos+3,2,Math.max(2,len-7),YELLOW);
 }
 // Sparse embers break off at the leading edges, not along the entire stream.
 for(let i=0;i<5;i++){
  const xx=97+i*17+(f*3+i*5)%9;
  const yy=mid+(i%2?1:-1)*(22+(f+i)%7);
  box(g,xx-1,yy-1,8,6,INK);
  box(g,xx,yy,5,4,i%2?ORANGE:GOLD);
  box(g,xx+2,yy+1,2,2,YELLOW);
 }
 // Small bright nozzle, physically connected to the mouth.
 box(g,0,35,13,13,INK);box(g,1,37,11,9,ORANGE);
 box(g,3,39,10,5,YELLOW);box(g,5,40,7,3,WHITE);
 return g;
}
export function buildAtlases(P,app){
 const all=baseBuild(P,app);
 for(const t of all.flamethrower||[])t.destroy(true);
 all.flamethrower=[];
 for(let f=0;f<12;f++){
  const gfx=tongue(P,f);
  all.flamethrower.push(app.renderer.generateTexture(gfx,{
   resolution:1,scaleMode:P.SCALE_MODES.NEAREST
  }));
  gfx.destroy();
 }
 return all;
}
