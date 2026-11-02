/* Pokémon Torre 2 V0.8 — original four-element pixel spellbook.
 * 12/16 explicit WebGL keyframes baked at boot. No copied Poké Arena assets,
 * Canvas2D draw calls, CSS fire animations, or runtime texture regeneration.
 */
import {buildAtlases as fireAtlases,buildImpactAtlases as fireImpacts,
  createImpact,renderImpact} from './effects-v06.js';
export {createImpact,renderImpact};
const INK=0x10243b,DEEP=0x173e60,BLUE=0x2788bc,AZURE=0x38b9ec,
 CYAN=0x65e6fb,FOAM=0xd5fff8,FOREST=0x103c31,GREEN=0x2b8c50,
 LEAF=0x59ca67,LIME=0xb6f176,DARK=0x453324,AMBER=0xb46a15,
 SUN=0xffdb4a,PALE=0xfffaa1;
function px(g,x,y,w,h,color,alpha=1){g.lineStyle(0).beginFill(color,alpha)
  .drawRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))).endFill();}
function disc(g,x,y,r,colors){
 const [rim,body,shine]=colors;
 for(let dy=-r;dy<=r;dy+=3){
  const width=Math.floor(Math.sqrt(Math.max(0,r*r-dy*dy))/3)*3;
  px(g,x-width,y+dy,width*2+3,3,rim);
  if(width>=5)px(g,x-width+3,y+dy,Math.max(3,width*2-3),3,body);
 }
 px(g,x-r*.48,y-r*.50,Math.max(3,r*.52),Math.max(3,r*.36),shine);
}
function waterJet(P,frame){
 const g=new P.Graphics(),f=frame%12,length=205,cy=46;
 // Uninterrupted water pressure stream with turbulent rim and two-tone core.
 for(let x=0;x<length;x+=3){
  const q=x/length,taper=Math.min(1,(x+8)/24,(length-x)/24);
  const wave=2.4*Math.sin(x*.16+f*.60)+1.7*Math.sin(x*.43-f*.32);
  const half=(7+6*Math.sin(Math.PI*q))*taper;
  const y=Math.round(cy+wave-half),h=Math.max(4,Math.ceil(half*2));
  px(g,x,y-2,4,h+4,INK);px(g,x+1,y,3,h,BLUE);
  if(h>8)px(g,x+1,y+3,3,h-6,AZURE);
  if(h>12)px(g,x+2,y+6,2,h-12,CYAN);
  if(h>17&&((f+Math.floor(x/9))%5!==0))px(g,x+2,y+8,1,h-15,FOAM);
 }
 for(let j=0;j<5;j++){
  const x=48+j*30+(f*3+j)%9,y=cy+(j%2?1:-1)*(12+j%4*3);
  px(g,x-2,y-3,7,8,INK);px(g,x,y-2,4,5,CYAN);
 }
 return g;
}
function bubbles(P,frame){
 const g=new P.Graphics(),f=frame%12;
 const layers=[{x:30,y:57,r:13},{x:66,y:34,r:15},{x:110,y:56,r:20},
  {x:156,y:28,r:12},{x:190,y:55,r:15}];
 for(let i=0;i<layers.length;i++){
  const b=layers[i],x=b.x+((f*5+i*3)%13)-6,y=b.y+Math.sin(f*.45+i*2)*6;
  disc(g,x,y,b.r,[INK,AZURE,FOAM]);
  px(g,x+b.r/3,y+b.r/4,5,4,BLUE);
  if(i%2===0)px(g,x-b.r-4,y+b.r,3,3,FOAM);
 }
 return g;
}
function vine(P,frame){
 const g=new P.Graphics(),f=frame%12;
 const cx=42;
 // Braided stem with dark silhouette; vine grows continuously toward target.
 for(let x=0;x<199;x+=4){
  const y=cx+Math.sin(x*.046+f*.31)*9;
  px(g,x,Math.round(y)-7,6,16,FOREST);
  px(g,x+1,Math.round(y)-5,4,12,GREEN);
  px(g,x+2,Math.round(y)-3,3,7,LEAF);
  if(x%24===0){
   const u=x+2,v=y-8-(f%3);
   px(g,u-2,v-11,6,16,FOREST);
   px(g,u,v-10,4,12,LEAF);
   px(g,u+1,v-8,2,7,LIME);
  }
  if((x+f*4)%32<4){
   px(g,x+3,y+7,8,12,FOREST);px(g,x+4,y+9,6,8,LEAF);
  }
 }
 // Forked tip / leaf whip, not a green energy beam.
 for(const s of [-1,1]){
  const y=42+s*19;
  px(g,184,y-6,18,11,FOREST);px(g,186,y-4,15,7,LEAF);
  px(g,194,y-2,8,3,LIME);
 }
 return g;
}
function lightning(P,frame){
 const g=new P.Graphics(),f=frame%16;
 const points=[[0,40],[29,37],[47,23],[67,54],[95,27],[121,44],[152,20],[173,50],[207,39]];
 // Vary sharp bends every keyframe, maintaining one conductive connected bolt.
 for(let n=0;n<points.length-1;n++){
  const [x1,y1]=points[n],[x2,y2]=points[n+1];
  const shift=(n%2?1:-1)*((f*3+n*5)%9-4);
  const middleX=Math.round((x1+x2)/2),midY=Math.round((y1+y2)/2+shift);
  const seq=[[x1,y1],[middleX,midY],[x2,y2]];
  for(let k=0;k<2;k++){
   const [a,b]=seq[k], [c,d]=seq[k+1],step=3,nSteps=Math.ceil(Math.max(Math.abs(c-a),Math.abs(d-b))/step);
   for(let t=0;t<=nSteps;t++){
    const x=a+(c-a)*t/nSteps,y=b+(d-b)*t/nSteps;
    px(g,x-4,y-5,10,11,DARK);px(g,x-2,y-3,6,7,AMBER);
    px(g,x-1,y-2,4,5,SUN);px(g,x,y-1,2,3,PALE);
   }
  }
 }
 for(let i=0;i<6;i++){
  const x=28+(i*31+f*11)%162,y=18+(i*19+f*7)%54;
  px(g,x,y,4,4,SUN);
 }
 return g;
}
const generators={watergun:waterJet,bubblebeam:bubbles,vinewhip:vine,thunderbolt:lightning};
export function buildAtlases(P,app){
 const atlases=fireAtlases(P,app);
 for(const [id,generator] of Object.entries(generators)){
  atlases[id]=[];
  const count=id==='thunderbolt'?16:12;
  for(let i=0;i<count;i++){
   const shape=generator(P,i);
   atlases[id].push(app.renderer.generateTexture(shape,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST}));
   shape.destroy();
  }
 }
 return atlases;
}
function waterSplash(P,f){
 const g=new P.Graphics(),q=(f+1)/12;
 for(let i=0;i<13;i++){
  const a=i*Math.PI*2/13+.13*f,d=8+q*53+(i%3)*4;
  const x=75+Math.cos(a)*d,y=72+Math.sin(a)*d*.79;
  const r=4+i%3;px(g,x-r,y-r,r*2+4,r*2+3,INK);
  px(g,x-r+2,y-r+2,r*2,r*2,AZURE);px(g,x-r+3,y-r+3,r,r,FOAM);
 }
 return g;
}
function vineHit(P,f){
 const g=new P.Graphics(),q=(f+1)/12;
 // Slash arcs: sharp green leaves, no generic radial plasma.
 for(let i=0;i<5;i++){
  const a=-1.25+i*.62+f*.085,d=18+q*30;
  const x=75+Math.cos(a)*d,y=75+Math.sin(a)*d;
  for(let k=0;k<6;k++){
   const xx=x+k*6,yy=y-k*4;
   px(g,xx-5,yy-5,12,10,FOREST);px(g,xx-3,yy-3,8,6,LEAF);
   px(g,xx,yy-2,3,3,LIME);
  }
 }
 return g;
}
function electricImpact(P,f){
 const g=new P.Graphics(),q=(f+1)/12;
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4+.20*f;
  const d=11+q*48,x=78+Math.cos(a)*d,y=76+Math.sin(a)*d;
  for(let k=0;k<7;k++){
   const dx=Math.cos(a)*(k*5),dy=Math.sin(a)*(k*5);
   px(g,x+dx-3+((k%2)*4),y+dy-3,9,9,DARK);
   px(g,x+dx-1+((k%2)*4),y+dy-1,5,5,SUN);
  }
 }
 return g;
}
export function buildImpactAtlases(P,app){
 const all=fireImpacts(P,app),constructors={watergun:waterSplash,bubblebeam:waterSplash,
  vinewhip:vineHit,thunderbolt:electricImpact};
 for(const [id,create] of Object.entries(constructors)){
  const frames=[];
  for(let f=0;f<12;f++){
   const g=create(P,f);
   frames.push(app.renderer.generateTexture(g,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST}));
   g.destroy();
  }
  all[id]=frames;
 }
 return all;
}
