/* V0.3 — hit-specific 12-frame pixellated impact atlases.
 * Original Pixi Graphics baked once to WebGL textures, not static PNGs.
 * Wisp details, layered light and black silhouette maintained through contact.
 */
export {buildAtlases} from './effects-v02.js';
const K=0x15111c,R=0xa72e20,O=0xf66b1e,G=0xffb033,Y=0xffe36c,W=0xfff7b2;
const C=[K,R,O,G,Y,W];
function box(g,x,y,w,h,c){g.beginFill(c).drawRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))).endFill()}
function dot(g,x,y,r,c){g.beginFill(c).drawRect(Math.round(x-r),Math.round(y-r),r*2,r*2).endFill()}
const phi=2.399963229728653; // golden-angle deterministic emission, no Math.random.
function embers(g,t,intensity,radius,centerX=80,centerY=80){
 for(let i=0;i<intensity;i++){
  const angle=i*phi+t*.12,rad=(9+(i*13)%radius)*(0.48+t*.078);
  const x=centerX+Math.cos(angle)*rad,y=centerY+Math.sin(angle)*rad*.79;
  const s=t>8?3:4+(i%2);
  box(g,x,y,s,s,[O,G,Y,W][(i+Math.floor(t/3))%4]);
 }
}
function jagged(g,t,radius,id){
 const max=Math.max(6,Math.round(radius*(.32+t*.12))),cx=80,cy=80;
 for(let j=0;j<9;j++){
  const angle=j*Math.PI*2/9+t*.09;
  const x=cx+Math.cos(angle)*max,y=cy+Math.sin(angle)*max;
  dot(g,x,y,6, K);
  dot(g,x,y,4,j%3===0?Y:O);
 }
 for(let j=0;j<24;j++){
  const a=j*Math.PI/12+Math.sin(t+j)*.028;
  const r=max*(.42+(j%4)*.12);
  const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.84;
  dot(g,x,y,7,K);dot(g,x,y,5,R);dot(g,x,y,3,G);
 }
 dot(g,cx,cy,Math.max(5,15-t*.7),t<4?W:Y);
 embers(g,t,12+Math.floor(t/2),Math.max(18,max+10));
}
function radialSpokes(g,t,arms,outer,fill){
 const alpha=1-t/12,cx=80,cy=80;
 for(let a=0;a<arms;a++){
  const angle=a*Math.PI*2/arms+.1*Math.sin(t+a);
  for(let radius=8;radius<outer*(.30+t*.079);radius+=6){
   const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
   box(g,x-6,y-6,12,12,K);
   box(g,x-5,y-5,10,10,R);
   box(g,x-3,y-3,6,6,fill);
   if(a%2===0)box(g,x-1,y-1,3,3,W);
  }
 }
 embers(g,t,18,55);
 if(t<5){dot(g,cx,cy,15-t, Y);dot(g,cx,cy,6,W)}
}
function frame(P,type,n){
 const g=new P.Graphics(),t=n+1;
 if(type==='ember'){
  jagged(g,t,24,type);
 }else if(type==='flamethrower'){
  // An asymmetric forward splash like a wave of heat hitting the target.
  const radius=22+t*3;
  for(let j=0;j<29;j++){
   const a=-Math.PI*.72+j*Math.PI*1.44/28;
   const r=radius*(.72+(j%5)*.07);
   const x=77+Math.cos(a)*r,y=82+Math.sin(a)*r;
   dot(g,x,y,7,K);dot(g,x,y,5,O);
   if(j%3!==0)dot(g,x,y,3,Y);
  }
  for(let i=0;i<15;i++){
   const x=61+i*4-(t*2)%9,y=79+(i%2?1:-1)*(10+(i*3+t)%24);
   box(g,x,y,12,7,K);box(g,x+2,y+1,9,5,[R,O,G][i%3]);
  }
  embers(g,t,18,49,76,82);
 }else if(type==='firespin'){
  // Rising rotating fire vortex retains negative-space centre.
  const angle=t*.34,r=24+t*2;
  for(let ring=0;ring<3;ring++){
   for(let j=0;j<24;j++){
    const a=j*Math.PI/12+angle*(ring%2?-1:1);
    const x=80+Math.cos(a)*(r+ring*8),y=80+Math.sin(a)*(r+ring*8)*.65-ring*3;
    box(g,x-4,y-5,9,10,K);box(g,x-2,y-3,6,7,[R,O,G,Y][(ring+j)%4]);
   }
  }
  embers(g,t,16,46);
 }else{
  // Fire Blast ends in five separated arms, still echoing its original 大 pose.
  radialSpokes(g,t,5,61,G);
 }
 return g;
}
export function buildImpactAtlases(P,app){
 const atlases={};
 for(const type of ['ember','flamethrower','firespin','fireblast']){
  const frames=[];
  for(let i=0;i<12;i++){
   const gfx=frame(P,type,i);
   frames.push(app.renderer.generateTexture(gfx,{resolution:1,scaleMode:P.SCALE_MODES.NEAREST}));
   gfx.destroy();
  }
  atlases[type]=frames;
 }
 return atlases;
}
export function createImpact(P,type,atlases){
 const frames=atlases[type]||atlases.ember;
 const sprite=new P.Sprite(frames[0]);
 sprite.anchor.set(.5);sprite.scale.set(type==='fireblast'?1.25:.95);
 sprite.roundPixels=true;
 return {graphics:sprite,frames,age:0,life:type==='fireblast'?.56:.43,type};
}
export function renderImpact(imp,delta){
 imp.age+=Math.max(0,delta);
 imp.graphics.texture=imp.frames[Math.min(imp.frames.length-1,Math.floor(imp.age/imp.life*imp.frames.length))];
 imp.graphics.alpha=Math.max(0,1-imp.age/imp.life)*.94;
 imp.graphics.scale.set((imp.type==='fireblast'?1.25:.95)*(1+.25*imp.age/imp.life));
 return imp.age<imp.life;
}
export function createAura(P){
 const g=new P.Graphics();
 for(let s=34;s>10;s-=6){
  g.beginFill(0xff9935,.020).drawEllipse(0,0,s,s*.58).endFill();
 }
 return g;
}
