/* V0.2 — GPU-rendered, original pixel-metal battle arena; no Poké Arena assets. */
const C={ink:0x10142b,a:0x374474,b:0x3f4d7e,c:0x303d69,cyan:0x72e8fc};
const hash=(x,y)=>{let n=Math.imul(x+13,374761393)^Math.imul(y+29,668265263);n^=n>>>13;return(n>>>0)%1024};
function rect(g,x,y,w,h,c,a=1){g.beginFill(c,a).drawRect(x,y,w,h).endFill()}
function line(g,x,y,u,v,col,alpha=1,width=1){g.lineStyle(width,col,alpha).moveTo(x,y).lineTo(u,v)}
function poly(g,c,p){g.beginFill(c).drawPolygon(p).endFill()}
function vent(P,root,x,y,rot=0){const g=new P.Graphics();rect(g,0,0,82,47,0x090e23);rect(g,3,3,76,41,0x8294ad);rect(g,7,7,68,33,0x17243e);for(let i=0;i<6;i++){rect(g,12,10+i*5,57,2,0x070c21);rect(g,12,12+i*5,57,1,0x8399ba,.48)}g.position.set(x,y);g.rotation=rot;root.addChild(g)}
function monster(P,type){
 const root=new P.Container(),g=new P.Graphics();root.addChild(g);
 const ink=0x121323,rock=0x828cad,shade=0x54658b,bright=0xd1d6dd,orange=0xf58135;
 if(type==='hero'){
  // Winged fire lizard; pixel-grid silhouettes with black outlines and distinct wings.
  poly(g,ink,[-18,-3,-37,-27,-52,-21,-42,-8,-41,9,-17,10]);
  poly(g,ink,[12,-5,30,-27,47,-20,40,-8,41,9,19,10]);
  poly(g,shade,[-20,-6,-36,-22,-47,-19,-35,-6,-34,3,-20,4]);
  poly(g,shade,[14,-7,28,-22,42,-18,34,-4,35,3,20,4]);
  poly(g,0x87b9cf,[-23,-7,-36,-19,-42,-17,-31,-6,-28,0]);
  poly(g,0x87b9cf,[17,-8,28,-19,37,-17,31,-5,31,0]);
  poly(g,ink,[-6,17,-29,16,-39,10,-34,2,-17,12]);poly(g,0xce572b,[-7,14,-26,15,-34,10,-28,7,-13,10]);
  poly(g,ink,[-14,11,-17,27,-8,31,1,16]);poly(g,ink,[7,11,7,31,19,31,23,26,16,13]);
  poly(g,orange,[-12,12,-12,25,-7,27,-2,15]);poly(g,orange,[10,13,11,26,17,28,17,16]);
  poly(g,ink,[-10,-14,-20,-4,-23,12,-8,20,13,16,20,3,7,-12]);
  poly(g,orange,[-10,-10,-17,0,-14,11,-3,16,11,11,15,0,6,-9]);
  poly(g,0xffd59d,[-6,0,-11,9,1,13,9,8,4,0]);
  poly(g,ink,[-11,-10,-18,-27,-9,-38,6,-40,18,-30,19,-17,10,-8]);
  poly(g,orange,[-9,-14,-11,-25,-5,-34,7,-36,15,-29,15,-20,9,-12]);
  poly(g,ink,[-14,-28,-17,-44,-7,-35]);poly(g,ink,[4,-38,10,-47,13,-36]);
  rect(g,8,-28,6,6,ink);rect(g,9,-28,4,4,0xffffff);rect(g,11,-27,2,3,0x172335);
  rect(g,12,-14,10,3,ink);rect(g,18,-14,3,2,0xffd7a4);
  poly(g,ink,[-36,8,-48,2,-49,-14,-55,-8,-58,5,-50,16,-39,16]);
  poly(g,0xd64725,[-45,7,-54,-7,-49,-22,-42,-11,-43,8]);poly(g,0xffa128,[-47,4,-51,-9,-48,-16,-45,-7,-44,5]);
  rect(g,-46,-7,3,8,0xfff2a0);
  for(const x of [-13,9])rect(g,x,27,5,4,0xf1ead9);
  root.scale.set(.68);
 }else if(type==='geodude'){
  poly(g,ink,[-30,-9,-17,-30,18,-33,35,-12,31,24,9,32,-20,25]);
  poly(g,shade,[-27,-10,-15,-27,12,-29,29,-9,24,18,7,26,-17,20]);
  poly(g,rock,[-13,-24,12,-26,24,-8,18,13,0,20,-17,12,-22,-8]);
  poly(g,bright,[-13,-24,5,-28,15,-16,-2,-15,-17,-11]);
  poly(g,ink,[-24,0,-42,-10,-50,2,-41,19,-24,17]);
  poly(g,rock,[-28,-1,-39,-6,-44,3,-38,11,-28,13]);
  poly(g,ink,[24,0,40,-13,49,4,39,18,26,15]);
  poly(g,rock,[30,2,40,-8,43,3,38,11,29,10]);
  for(const x of [-9,9]){rect(g,x-4,-3,10,9,ink);rect(g,x-2,-3,7,7,0xfff5e1);rect(g,x+2,-2,3,5,ink)}
  poly(g,ink,[-7,16,7,16,0,21]);root.scale.set(.75);
 }else{
  for(let n=4;n>=0;n--){const x=-36+n*14,y=28-n*17,r=20-(n%2)*2;
   poly(g,ink,[x-r,y-6,x-r+7,y-r,x+r-7,y-r,x+r,y-3,x+r-7,y+r,x-r+5,y+r]);
   poly(g,rock,[x-r+3,y-6,x-r+9,y-r+4,x+r-8,y-r+4,x+r-4,y-3,x+r-9,y+r-5,x-r+7,y+r-5]);
   poly(g,bright,[x-r+9,y-r+4,x+r-10,y-r+4,x+r-6,y-8,x-r+6,y-9]);}
  const x=36,y=-49;
  poly(g,ink,[x-21,y-8,x-11,y-26,x+10,y-26,x+24,y-7,x+18,y+18,x-14,y+18]);
  poly(g,rock,[x-18,y-8,x-10,y-23,x+9,y-23,x+19,y-6,x+15,y+14,x-11,y+15]);
  poly(g,bright,[x-12,y-20,x+7,y-20,x+14,y-10,x+2,y-9,x-15,y-13]);
  for(const e of [x-11,x+9]){rect(g,e-5,y-3,10,9,ink);rect(g,e-3,y-2,7,6,0xf3e9d7)}
  poly(g,ink,[x-10,y+8,x+10,y+8,x+6,y+12,x-7,y+12]);root.scale.set(.64);
 }
 return root;
}
export function makeArena(P){
 const root=new P.Container(),g=new P.Graphics();root.addChild(g);
 rect(g,0,0,960,540,0x090d20);rect(g,9,9,942,522,0x15203b);
 // Irregular large steel panels with stone-like abrasion and subtle bevels.
 // Compared with previous grid this avoids a homogeneous 'blue chessboard'.
 const STEEL=[0x333b59,0x343e60,0x394262,0x2d3755,0x39415f];
 for(let row=-1;row<9;row++)for(let col=-1;col<11;col++){
  const xx=18+col*93+(row%2)*38,yy=19+row*74,n=hash(col,row),c=STEEL[n%STEEL.length];
  rect(g,xx-1,yy-1,91,72,0x0c142e);
  rect(g,xx+2,yy+2,86,67,c);
  rect(g,xx+3,yy+3,84,2,0xc3d1e7,.14);
  rect(g,xx+3,yy+5,2,60,0x9fb4cd,.105);
  rect(g,xx+4,yy+65,83,3,0x111b33,.45);
  rect(g,xx+86,yy+4,2,62,0x11182e,.55);
  if(n%4===0){
   rect(g,xx+14,yy+13,57,3,0x6d7899,.075);
   rect(g,xx+17,yy+17,52,1,0x0a1026,.22);
  }
  for(let k=0;k<28;k++){
   const u=(hash(n,k+row)%78)+5,v=(hash(k+col,n)%56)+7;
   rect(g,xx+u,yy+v,1+(k%3===0?2:0),1,n%3===0?0xb6b9d4:0x10182f,
    k%5===0?.18:.095);
  }
  for(let k=0;k<3;k++){
   const u=15+(hash(n+k,22)%57),v=14+(hash(n+k,41)%40);
   rect(g,xx+u,yy+v,5+(n+k)%9,1,0xd9e0ed,.075);
   rect(g,xx+u+3,yy+v+2,3+(n+k)%5,1,0x0b142c,.16);
  }
  // Fastening bolts: dark recess, steel lip, tiny directional light.
  for(const [bx,by] of [[6,6],[83,6],[6,62],[83,62]]){
   rect(g,xx+bx-3,yy+by-3,7,7,0x131c32,.68);
   rect(g,xx+bx-2,yy+by-2,5,5,0x6d7897,.48);
   rect(g,xx+bx-1,yy+by-1,2,2,0xc6d1e3,.20);
  }
  if(n%5===0)for(let w=0;w<2;w++)rect(g,xx+38,yy+23+w*3,24,1,0x91a8c1,.10);
 }
 // Narrow neon seams are intermittent and embedded within floor, not wide light stripes.
 for(let row=0;row<8;row++)for(let col=0;col<10;col++){
  const n=hash(row*3,col+4);
  if(n%3!==0)continue;
  const x=24+col*94+(row%2)*36,y=20+row*74;
  rect(g,x-3,y+45,7,27,0x0d1c36,.7);
  rect(g,x,y+48,2,21,0x83def7,.66);
  rect(g,x+1,y+50,1,17,0xa7fcff,.38);
 }
 const rim=new P.Graphics();root.addChild(rim);
 for(let k=0;k<5;k++){line(rim,10+k*3,11+k*3,949-k*3,11+k*3,0x85b4dc,k===0?.44:.12,2);
  line(rim,11+k*3,528-k*3,947-k*3,528-k*3,0x0a1124,.75,3);}
 for(const side of [0,1]){const x=side?930:22;rect(rim,x,20,8,499,0x050b20);
  rect(rim,x+(side?0:5),30,3,463,0x61c5e2,.54);
  for(let y=45;y<515;y+=66){rect(rim,x-3,y,16,11,0x101b36);rect(rim,x,y+2,10,7,0x798ab4);}}
 vent(P,root,80,77);vent(P,root,875,472,Math.PI);
 vent(P,root,716,82);vent(P,root,235,486,Math.PI);
 const ring=new P.Graphics();root.addChild(ring);
 for(const [rx,ry,c,a,w] of [[154,102,0x111c3a,.7,11],[154,102,0x19cbee,.13,8],
   [152,100,0x8fefff,.69,2],[148,97,0x31b6d5,.22,7],[50,34,0x6bd8fa,.45,3],
   [45,31,0x223f59,.66,10],[29,21,0xc1ffff,.75,2]]){
  ring.lineStyle(w,c,a);ring.drawEllipse(480,266,rx,ry);
 }
 line(ring,480,31,480,504,0x2395c9,.22,8);line(ring,480,32,480,503,0xa7fbff,.41,2);
 line(ring,46,266,914,266,0x79d7ff,.11,1);
 const shadow=new P.Graphics();shadow.beginFill(0x04091b,.30).drawEllipse(0,0,23,6).endFill();
 const player=monster(P,'hero'),enemyRock=monster(P,'geodude'),enemyOnix=monster(P,'onix');
 const vfx=new P.Container();root.addChild(shadow,enemyRock,enemyOnix,player,vfx);
 return {root,player,enemyRock,enemyOnix,shadow,vfx};
}
