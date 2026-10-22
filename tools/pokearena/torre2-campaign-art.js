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

/* Each rock, tree, fence, flower, trail and building is drawn as Phaser
 * Graphics on the WebGL renderer. No image, mockup or Canvas overlay. */
function stone(g,x,y,s=1){
 const q=(a,b,w,h,c)=>px(g,x+a*s,y+b*s,w*s,h*s,c);
 q(-6,0,12,6,0x4c5351);q(-5,-3,10,7,0x878c78);
 q(-3,-4,6,2,0xc8c7a4);q(3,0,2,3,0x585e5a);q(-4,4,11,2,0x435949);
}
function pine(g,x,y,s=1){
 const q=(a,b,w,h,c)=>px(g,x+a*s,y+b*s,w*s,h*s,c);
 q(-4,8,8,10,0x5c4835);q(-2,9,4,7,0x9a7950);
 q(-11,6,22,6,0x123a2c);q(-9,0,18,12,0x1b6238);
 q(-12,-1,24,7,0x237345);q(-8,-8,16,11,0x24874b);
 q(-6,-11,13,8,0x3eab59);q(-3,-14,7,6,0x78c56c);
 q(-10,5,5,3,0x439c56);q(3,-6,5,3,0x9ee786);
 q(4,0,7,3,0x2c9c56);q(-6,-3,3,2,0xa6ed89);
 q(-10,11,22,2,0x153d31);
}
function flower(g,x,y,pink=false){
 const c=pink?0xf78ba8:0xf8f5d1;
 px(g,x,y,2,2,c);px(g,x+4,y,2,2,c);
 px(g,x+2,y-2,2,2,c);px(g,x+2,y+2,2,2,c);
 px(g,x+2,y,2,2,0xf4c958);px(g,x+3,y+4,1,3,0x25874c);
}
function tallGrass(g,x,y){
 px(g,x-7,y+5,15,3,0x235f38);px(g,x-6,y,2,7,0x277d3e);
 px(g,x-4,y-4,3,11,0x2b9349);px(g,x,y-1,2,8,0x55b94f);
 px(g,x+3,y-5,3,12,0x207e41);px(g,x+6,y-2,2,8,0x72be55);
 px(g,x-3,y-1,2,2,0x9fe37c);
}
function fence(g,x,y){
 for(let k=0;k<3;k++){
  const a=x+11*k;
  px(g,a+1,y+3,7,13,0x513a2e);px(g,a,y,7,13,0xab7846);
  px(g,a+1,y,5,2,0xffd28b);px(g,a+5,y+3,1,8,0xe0a66a);
  px(g,a,y+12,8,3,0x483b2c);
 }
}
function routeBuilding(g,x,y,pc=false){
 const roof=pc?0xd94843:0x247ed6,light=pc?0xff9c8f:0x9edbff;
 // shadow, foundation, cream masonry and roof bevels
 px(g,x+3,y+36,58,5,0x244b3b);px(g,x+1,y+14,56,23,0x795c47);
 px(g,x+4,y+15,50,22,0xe5cb91);px(g,x+6,y+18,46,16,0xffebba);
 px(g,x,y+7,58,10,0x14293e);px(g,x+2,y+2,54,14,roof);
 px(g,x+5,y,48,7,light);px(g,x+4,y+8,50,3,pc?0xf16058:0x389ceb);
 px(g,x+7,y+15,13,13,0x254a69);px(g,x+9,y+17,9,9,0xa6e2ff);
 px(g,x+38,y+15,13,13,0x254a69);px(g,x+40,y+17,9,9,0xa6e2ff);
 px(g,x+24,y+23,10,14,0x5d433b);px(g,x+26,y+25,6,12,0x987254);
 px(g,x+30,y+31,1,2,0xffdc86);
 px(g,x+3,y+35,52,2,0x8b7551);
 if(pc)ball(g,x+29,y+9,6);
 else{
  px(g,x+20,y+5,20,8,0x104985);
  px(g,x+22,y+6,17,2,0xffffff);
 }
}
function panelMap(g){
 // Hand-pixeled metal-and-gold frame, each element drawn in game.
 px(g,8,55,391,260,0x031522);px(g,10,56,386,257,0xcba65a);
 px(g,13,59,380,251,0x093d49);px(g,16,61,374,247,0x0e2038);
 px(g,19,89,372,177,0x82bc67);
 px(g,13,57,376,3,0x9febc1);px(g,13,308,376,3,0x6b481f);
 for(const [x,y] of [[10,56],[385,56],[10,301],[385,301]]){
  px(g,x,y,11,11,0x5f4627);px(g,x+1,y+1,9,9,0xffe29a);
  px(g,x+3,y+3,7,3,0xfff4c2);
 }
}
function pathStroke(g,points){
 const route=[{x:82,y:243},...points,{x:333,y:149}];
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b.x-a.x,dy=b.y-a.y;
  for(const [w,c] of [[22,0x606b42],[20,0x977b48],[16,0xdfad6a],
    [12,0xf4d28c],[6,0xffe2a0]]){
   g.lineStyle(w,c,1);g.lineBetween(a.x,a.y,b.x,b.y);
  }
  const steps=Math.max(1,Math.floor(Math.hypot(dx,dy)/7));
  for(let j=1;j<steps;j++){
   const t=j/steps,xx=Math.round(a.x+dx*t),yy=Math.round(a.y+dy*t);
   px(g,xx-2,yy+5,3,1,0xb88f59,.45);
   px(g,xx+2,yy-3,3,1,0xffe4a0,.7);
  }
 }
}
function pathDistance(x,y,points){
 const p=[{x:82,y:243},...points,{x:333,y:149}];
 let d=999;
 for(let i=1;i<p.length;i++){
  const a=p[i-1],b=p[i],dx=b.x-a.x,dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1)));
  d=Math.min(d,Math.hypot(x-a.x-t*dx,y-a.y-t*dy));
 }
 return d;
}
export function map(scene,stage,points){
 const g=scene.add.graphics().setDepth(1);
 const r=rand(301+(stage*7381));panelMap(g);
 const bright=stage===0;
 const meadow=[0x8dcb66,0x80be58,0x97d36c,0x79b958];
 for(let y=90;y<266;y+=6)for(let x=19;x<391;x+=6){
  px(g,x,y,6,6,meadow[Math.floor(r()*meadow.length)]);
  if(r()<.21)px(g,x+1,y+1,2,1,0xc5ea83,.65);
  if(r()<.18)px(g,x+4,y+4,2,1,0x3f9750,.6);
 }
 // Coast is built out of waves, foam and rocks, never a stretched photo.
 for(let y=90;y<266;y+=2){
  const coast=375+Math.floor(Math.sin((y+stage*11)*.085)*5);
  px(g,coast-4,y,7,2,0xefdda2);
  px(g,coast,y,391-coast,2,0x399ad8);
  px(g,coast+5,y+1,10,1,0x1972c4);
  if(Math.floor(y/2)%4===0){
   px(g,coast+1,y,5,1,0xe8ffff);px(g,coast+8,y,4,1,0x9fe7f4);
  }
 }
 // Rock plateau above Pewter and Mt. Moon approach.
 for(let x=19;x<155;x+=10){
  const span=26+Math.floor(11*Math.sin((x-19)*.067))+(x<90?8:0);
  for(let y=90;y<90+span;y+=8){
   const dark=r()<.5?0x666e64:0x8b8774;
   px(g,x,y,10,9,dark);px(g,x+1,y+1,7,3,0xb0a993);
   px(g,x+7,y+4,2,4,0x4b6252);
   px(g,x+1,y+7,9,2,0x505c50);
  }
  px(g,x,89+span,10,4,0x344f3d);
 }
 px(g,59,111,29,18,0x283c36);px(g,64,113,20,16,0x0c2429);
 px(g,68,114,11,16,0x040e1c);
 for(let j=0;j<4;j++){
  px(g,63-j*2,130+j*4,32+j*4,3,0xa9a08b);
  px(g,65-j*2,131+j*4,27+j*4,1,0xe4d0a8);
 }
 pathStroke(g,points);
 // Green patches stay out of the passable trail, facilities and stage markers.
 for(let k=0;k<270;k++){
  const x=25+Math.floor(r()*350),y=109+Math.floor(r()*149);
  if(x>366||pathDistance(x,y,points)<15||Math.hypot(x-76,y-229)<41
    ||Math.hypot(x-331,y-153)<37||x<135&&y<139)continue;
  const p=r();
  if(p<.18)tallGrass(g,x,y);
  else if(p<.43)px(g,x,y,2,2,0x5baf51);
  else if(p<.57)flower(g,x,y,r()<.52);
  else if(p<.72){px(g,x,y,4,2,0x4a8b44);px(g,x+4,y-1,2,3,0x6cbb62)}
  else if(p<.80)stone(g,x,y,.45);
 }
 // Deterministic arbor sprites built from layered pixel cells.
 const trees=[];
 for(let i=0;i<120;i++){
  const x=27+Math.floor(r()*346),y=109+Math.floor(r()*144);
  if(pathDistance(x,y,points)<24||Math.hypot(x-76,y-228)<39
    ||Math.hypot(x-331,y-145)<40||x<145&&y<145||x>364)continue;
  if(r()>.63)continue;
  trees.push({x,y,s:r()<.25?.48:.58+r()*.2});
 }
 trees.sort((a,b)=>a.y-b.y);
 for(const t of trees)pine(g,t.x,t.y,t.s);
 // Foreground props and buildings overlay foliage, with functional UI zones
 // supplied by the campaign scene separately.
 fence(g,22,224);fence(g,116,244);fence(g,279,196);
 routeBuilding(g,43,208,true);routeBuilding(g,297,131,false);
 // Storefront signs are live Phaser text, not words painted in a bitmap.
 scene.add.text(67,229,'PC',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'11px',fontStyle:'bold',color:'#d83c3e',stroke:'#ffefc6',strokeThickness:2})
  .setOrigin(.5).setDepth(2);
 scene.add.text(326,139,'MART',{fontFamily:'Pixelify Sans,monospace',
  fontSize:'9px',fontStyle:'bold',color:'#ffffff',stroke:'#15538a',strokeThickness:2})
  .setOrigin(.5).setDepth(2);
 // Keep the map art separate from interactive Phaser nodes / information.
 px(g,17,62,376,27,0x054553);
 px(g,19,64,372,23,0x064558);
 px(g,19,86,372,2,0x60c5bc);
 px(g,19,267,373,41,0x073c38);
 px(g,19,268,373,2,0x51bc9c);
 px(g,19,307,373,1,0xf1ca6e);
 for(const x of [29,36,382])pine(g,x,300,.37);
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
