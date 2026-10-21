/* Torre 2 — Kanto premium UI. Native Phaser Graphics/WebGL pixel art,
 * never a pasted mockup, CSS effects or Canvas 2D.
 */
const px=(g,x,y,w,h,c,a=1)=>{g.fillStyle(c,a);g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))};
const edge=(g,x,y,w,h,c)=>{g.lineStyle(1,c,1);g.strokeRect(x,y,w,h)};
const rand=(seed)=>{let x=seed>>>0;return ()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296)};
export function ball(g,x,y,r=9){
 g.fillStyle(0x05162a);g.fillCircle(x+1,y+2,r+2);
 g.fillStyle(0xffffff);g.fillCircle(x,y,r);
 // Render the red half as native pixel strips, preserving the black seam.
 for(let yy=-r;yy<0;yy++){
  const ww=Math.floor(Math.sqrt(r*r-yy*yy));
  px(g,x-ww,y+yy,ww*2,1,0xef514a);
 }
 px(g,x-r,y-1,r*2,3,0x14243b);
 g.fillStyle(0x14243b);g.fillCircle(x,y,Math.max(3,r*.4));
 g.fillStyle(0xffffff);g.fillCircle(x,y,Math.max(2,r*.23));
 px(g,x-4,y-r+3,3,2,0xffffff);
}
export function panel(g,x,y,w,h,gold=false){
 const trim=gold?0xeac16e:0x67b9e8;
 px(g,x+3,y+4,w,h,0x020b1b,.8);
 px(g,x,y,w,h,trim);px(g,x+2,y+2,w-4,h-4,0x061b33);
 px(g,x+5,y+5,w-10,h-10,gold?0x09423e:0x0b2543);
 px(g,x+7,y+6,w-14,2,gold?0xffec9b:0x8edcff);
 px(g,x+7,y+h-9,w-14,2,gold?0x936f3a:0x1a4d7b);
 for(const [a,b] of [[x,y],[x+w-4,y],[x,y+h-4],[x+w-4,y+h-4]]){
  px(g,a,b,4,4,gold?0xffdb80:0x9eddfc);
  px(g,a+1,b+1,2,2,gold?0xc8923d:0x286c9c);
 }
}
export function header(scene){
 const g=scene.add.graphics().setDepth(0),r=rand(19);
 px(g,0,0,640,53,0x06192e);
 for(let i=0;i<80;i++){
  const x=i*8,h=4+Math.floor(r()*21);
  px(g,x,46-h,9,h,0x13314d,.7);
  px(g,x,46-h,9,1,0x2a5884);
 }
 panel(g,8,5,380,42,false);
 ball(g,30,26,11);
 px(g,48,11,2,30,0x3672a3);
 px(g,0,49,640,4,0x1f5a95);
 px(g,0,51,640,1,0x70bee9);
}
export function backdrop(scene){
 const g=scene.add.graphics().setDepth(0),r=rand(98);
 px(g,0,52,640,308,0x08192f);
 for(let y=55;y<360;y+=12)for(let x=4;x<640;x+=12){
  const k=r();px(g,x,y,5,5,k<.4?0x16395f:0x0e2946,.45);
 }
 px(g,0,352,640,8,0x0e3157);
}
export function buttonFrame(g,x,y,w,h,tone='blue',hover=false){
 const opts=tone==='gold'?[0xefd06d,0xfff4aa,0xd48929,0xffcb52]:
  tone==='green'?[0x6ae0a2,0xc0ffd6,0x086b42,0x1a9f67]:
  [0x65bbf6,0xd8f6ff,0x103e86,0x2066b2];
 const [trim,hi,deep,base]=opts;
 px(g,x+2,y+4,w,h,0x020b17,.8);
 px(g,x,y,w,h,0x030b1e);
 px(g,x+1,y+1,w-2,h-2,trim);
 px(g,x+3,y+3,w-6,h-6,deep);
 px(g,x+4,y+4,w-8,h-9,base);
 px(g,x+4,y+4,w-8,4,hover?hi:trim);
 px(g,x+5,y+8,2,h-15,hi,.4);
 px(g,x+5,y+h-6,w-10,2,deep);
 for(const [cx,cy] of [[x+1,y+1],[x+w-5,y+1],[x+1,y+h-5],[x+w-5,y+h-5]])
  px(g,cx,cy,4,4,hi);
}
function tree(g,x,y,k=1){
 const p=(a,b,w,h,c)=>px(g,x+a*k,y+b*k,w*k,h*k,c);
 p(-2,8,5,8,0x6d5335);p(-8,4,17,7,0x1c613c);
 p(-7,-2,15,9,0x277d43);p(-5,-7,11,8,0x319a4d);
 p(-2,-9,5,3,0x73c76b);p(2,-3,4,3,0x9bdc7e);
 p(-8,9,16,2,0x194c39);
}
const grass=(g,x,y)=>{px(g,x,y,8,2,0x3e9852);px(g,x+2,y-3,2,5,0x51a953);px(g,x+6,y-4,2,6,0x6aba57)};
function house(g,x,y,red){
 px(g,x+2,y+11,42,33,0x685338);
 px(g,x+5,y+13,36,29,0xf7e4b6);
 px(g,x-2,y+4,50,10,0x20446c);
 px(g,x,y,46,10,red?0xd85155:0x3c91d5);
 px(g,x+2,y+1,42,2,red?0xff9988:0x91e5fb);
 px(g,x+9,y+19,10,10,0x88c7d8);px(g,x+30,y+19,10,10,0x88c7d8);
 px(g,x+21,y+27,8,16,0x684935);px(g,x+22,y+29,2,2,0xffdb9b);
 if(red)ball(g,x+23,y+5,6);
 else px(g,x+14,y+5,18,3,0xffffff);
}
function nearPath(x,y,pts){
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dx=b.x-a.x,dy=b.y-a.y;
  const z=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
  if(Math.hypot(x-a.x-z*dx,y-a.y-z*dy)<27)return true;
 }
 return false;
}
export function map(scene,stage,points){
 const g=scene.add.graphics().setDepth(1),r=rand(213+stage*71);
 panel(g,10,56,388,257,true);
 px(g,19,89,372,177,0x8fcb65);
 for(let i=0;i<680;i++){
  const x=22+Math.floor(r()*366),y=92+Math.floor(r()*172);
  px(g,x,y,1+r()*3,1+r()*2,r()<.55?0xafe380:0x74b94f,.42);
 }
 // Pixel river and sandy coast on right.
 for(let y=91;y<266;y+=3){
  const shore=379+Math.sin(y*.08)*6;
  px(g,shore-6,y,8,3,0xf0dfa0);
  px(g,shore,y,11,3,0x348cce);
  px(g,shore+1+Math.sin(y*.22)*2,y+1,4,1,0x9ef0f1,.8);
 }
 // A rocky cave mouth gives the scene geographic character.
 for(let i=0;i<16;i++){
  const x=20+i*9,y=93+Math.sin(i)*4;
  px(g,x,y,10,24+r()*13,0x777a68);px(g,x+1,y+1,8,5,0xb2ae94);
 }
 px(g,60,112,20,18,0x283d35);px(g,64,114,12,13,0x142c25);
 // Wide multi-tonal tracks connect real, interactive route stops.
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  for(const [width,color] of [[23,0x536a41],[19,0x907247],[15,0xf2c781],[9,0xffdfa0]]){
   g.lineStyle(width,color);g.lineBetween(a.x,a.y,b.x,b.y);
  }
  g.lineStyle(1,0xffebbb,.8);g.lineBetween(a.x-2,a.y-3,b.x-2,b.y-3);
 }
 // Seeded forest avoids the path and all navigable nodes.
 for(let i=0;i<145;i++){
  const x=27+Math.floor(r()*350),y=107+Math.floor(r()*150);
  if(nearPath(x,y,points)||Math.hypot(x-66,y-210)<45||Math.hypot(x-326,y-133)<43)continue;
  if(r()<.57)tree(g,x,y,.55+r()*.58);
  else if(r()<.5)grass(g,x,y);
  else{
   const col=r()<.5?0xf3d5ee:0xffb79d;
   px(g,x,y,3,3,col);px(g,x+1,y+1,1,1,0xfff9cb);
  }
 }
 house(g,45,201,true);house(g,302,118,false);
 px(g,19,63,373,26,0x064354);
 px(g,20,64,371,3,0x197c87);
 px(g,20,86,371,3,0xdfc471);
 px(g,19,266,373,42,0x053b3a);
 px(g,20,267,371,2,0x207c73);
 px(g,20,306,372,2,0xdbb45e);
 for(let x of [27,358,371])tree(g,x,298,.35);
 return g;
}
export function node(g,x,y,kind='future'){
 const r=13;
 g.fillStyle(0x173a38,.7);g.fillCircle(x+2,y+4,r+5);
 g.fillStyle(0xf7e6b2);g.fillCircle(x,y,r+3);
 g.fillStyle(0x192a42);g.fillCircle(x,y,r+1);
 g.fillStyle(kind==='done'?0x23754d:kind==='current'?0x2872bf:0x8a9391);
 g.fillCircle(x,y,r-1);
 g.lineStyle(kind==='current'?3:2,kind==='current'?0xffd25e:0xe8e4cc);
 g.strokeCircle(x,y,r+1);
 if(kind==='current'){
  g.lineStyle(2,0xffdb74);g.strokeCircle(x,y,r+4);
 }
 g.fillStyle(0xffffff,.2);g.fillEllipse(x-3,y-6,12,5);
}
export function team(scene){
 const g=scene.add.graphics().setDepth(1);
 panel(g,407,56,225,238);
 px(g,413,62,213,35,0x852c36);
 px(g,414,63,211,29,0xc54d49);
 px(g,414,63,211,5,0xee8163);
 px(g,414,94,211,2,0xf4ba82);
 ball(g,425,78,9);
 px(g,414,98,210,34,0x071e39);
 px(g,415,131,208,1,0x3c7694);
}
export function teamCard(scene,x,y,member,chosen){
 const g=scene.add.graphics().setDepth(2);
 px(g,x+2,y+3,100,44,0x061329,.7);
 px(g,x,y,100,44,chosen?0xffd980:member?0x75b9e5:0x315e83);
 px(g,x+2,y+2,96,40,member?0x162f49:0x0e2a47);
 px(g,x+4,y+4,92,2,chosen?0xffe7a8:0x36799e);
 if(member){
  px(g,x+4,y+5,30,31,0x0a233d);
  edge(g,x+4,y+5,30,31,chosen?0xe6be73:0x538fae);
  const hp=Math.max(0,Math.min(100,Number(member.hp??100)));
  px(g,x+36,y+35,57,5,0x071629);
  px(g,x+37,y+36,55,3,0x24556a);
  px(g,x+37,y+36,55*hp/100,3,hp>50?0x49e68b:hp>20?0xf7d46a:0xf07565);
 }else{
  g.fillStyle(0x214265);g.fillCircle(x+50,y+20,10);
  px(g,x+40,y+19,20,3,0x0b2745);
  g.fillStyle(0x0b2745);g.fillCircle(x+50,y+20,4);
  g.fillStyle(0x50759b);g.fillCircle(x+50,y+20,2);
 }
}
export function progress(g,x,y,active,num=6){
 for(let i=0;i<num;i++){
  const xx=x+i*16;
  g.fillStyle(0x071e35);g.fillCircle(xx,y,5);
  g.lineStyle(1,0x9ad5ec);g.strokeCircle(xx,y,5);
  g.fillStyle(i===active?0xffdf65:i<active?0x45c58a:0x325878);
  g.fillCircle(xx,y,3);
 }
}
