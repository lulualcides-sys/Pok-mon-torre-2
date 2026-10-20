/* V0.6 — original outdoor pixel stadium inspired by the publicly observed
 * stadium composition and layout of Poké Arena 2D. NO extracted tiles,
 * sprites, stadium frames, screenshots or source from that game.
 * All geometry is batched by PixiJS/WebGL Graphics, no Canvas2D.
 */
import {makeArena as makeFallbackActors} from './arena-v02.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const seed=(a,b,c=0)=>{
 let n=(Math.imul(a+29,73856093)^Math.imul(b+47,19349663)^Math.imul(c+7,83492791))>>>0;
 n=Math.imul(n^(n>>>15),2246822519)>>>0;
 return(n^(n>>>13))>>>0;
};
function rect(g,x,y,w,h,color,alpha=1){
 g.lineStyle(0).beginFill(color,alpha).drawRect(Math.floor(x),Math.floor(y),Math.max(1,w),Math.max(1,h)).endFill();
}
function poly(g,c,points,a=1){g.lineStyle(0).beginFill(c,a).drawPolygon(points).endFill()}
function line(g,c,a,width,pts){
 g.lineStyle(width,c,a);
 for(let i=0;i<pts.length;i+=2){if(i===0)g.moveTo(pts[i],pts[i+1]);else g.lineTo(pts[i],pts[i+1]);}
}
function field(P){
 const g=new P.Graphics();
 rect(g,0,0,960,540,0x315f3c);
 // Parallel mowing stripes: stadium green, not metallic slate flooring.
 const stripes=[0x77a74b,0x78a94e,0x6fa248,0x81ad4f,0x77a34a,0x86b252,0x78aa48,0x72a249,0x7eaf4d,0x6fa345];
 for(let x=0;x<960;x+=96)rect(g,x,47,96,493,stripes[Math.floor(x/96)%stripes.length]);
 // Subtle dark rolling shadow at stadium top and side rail, using non-blended strips.
 for(let j=0;j<13;j++){
  rect(g,0,58+j*8,960,8,0x183b2c,.13*(1-j/14));
 }
 // Sparse pixel tufts and three-tone grass noise: deterministic & stable at 60 FPS.
 for(let y=82;y<527;y+=7){
  for(let x=5;x<957;x+=9){
   const n=seed(x,y);
   if(n%100<56)continue;
   const xx=x+(n%8),yy=y+((n>>>3)%6);
   rect(g,xx,yy,(n%3)+1,1,n%2?0x426f3a:0x9ec05a,n%4===0?.28:.16);
   if(n%31===0){rect(g,xx+4,yy-3,1,3,0x3c763b,.25);rect(g,xx+6,yy-2,2,2,0xc3cb78,.19)}
  }
 }
 // Grassy tufts at readable mobile scale, with individual three-blade silhouettes.
 // The visual reference has uneven turf rather than a flat solid green surface.
 for(let y=92;y<521;y+=14)for(let x=12;x<947;x+=15){
  const n=seed(x,y,58);
  if(n%100<34)continue;
  const xx=x+((n>>>7)%9),yy=y+((n>>>11)%6);
  const dark=(n%3===0),c=dark?0x2d6b36:0xbed57a;
  const opacity=dark?.33:.25;
  if(n%11===0){
   rect(g,xx-4,yy+3,14,3,0x306d36,.14);
   rect(g,xx,yy+1,9,3,c,.18);
  }
  line(g,c,opacity,1,[xx,yy+5,xx-3,yy+1]);
  line(g,c,opacity,1,[xx+1,yy+5,xx+1,yy]);
  line(g,c,opacity,1,[xx+3,yy+5,xx+6,yy+2]);
  if(n%7===0){
   rect(g,xx-3,yy+7,4,2,0xcbdc88,.22);
   rect(g,xx+6,yy+6,3,2,0x327541,.25);
  }
 }
 // Irregular warm/cool patches break up rectangular mowing stripes.
 for(let j=0;j<115;j++){
  const n=seed(j,57,19),x=23+n%910,y=85+((n>>>9)%420),r=4+((n>>>17)%14);
  rect(g,x,y,r*2,r, (n%3===0)?0xa9c85f:0x376f3d,.034);
  rect(g,x+3,y+3,Math.max(3,r-2),4,(n%2)?0xa1ce68:0x2a6940,.057);
 }
 // Center court and Poké Ball emblem — vector-painted original geometry.
 // Real source stadium visibly has white vertical division and a circular emblem.
 rect(g,475,55,9,478,0xd5e2bf,.28);
 rect(g,478,58,3,475,0xf0f4df,.77);
 g.lineStyle(12,0xc6e3c3,.85).drawCircle(480,303,87);
 g.lineStyle(4,0xe7f7e4,.83).drawCircle(480,303,89);
 g.lineStyle(0).beginFill(0xecf0e6,.91).drawCircle(480,303,76).endFill();
 g.lineStyle(0).beginFill(0xd85d61,.93).arc(480,303,76,Math.PI,0).lineTo(480,303).closePath().endFill();
 rect(g,403,298,154,10,0x293d35,.94);
 rect(g,404,300,152,4,0xe9f2e8,.9);
 g.lineStyle(7,0x527a50).beginFill(0xe5e9db).drawCircle(480,303,22).endFill();
 g.lineStyle(4,0xeff8dd).drawCircle(480,303,14);
 // White border and fine court markings.
 line(g,0xd5f0cf,.48,3,[16,68,944,68,944,537,16,537,16,68]);
 // Short white turf accents at corners: not a texture image.
 for(const [x,y] of [[36,90],[895,90],[36,507],[895,507]]){
  rect(g,x,y,22,2,0xd2e4c4,.49);
  rect(g,x,y,2,19,0xd2e4c4,.48);
 }
 return g;
}
function crowd(P){
 const root=new P.Container(),g=new P.Graphics();
 root.addChild(g);
 // Elevated stands, deep seating shadow, red/blue facing stadium rail.
 rect(g,0,0,960,63,0x0a1526);
 rect(g,0,1,960,30,0x1c2b4a);
 rect(g,0,32,960,29,0x0d2436);
 for(let r=0;r<3;r++)for(let x=0;x<957;x+=10){
  const n=seed(x,r,34);
  rect(g,x+1,5+r*9,8,8,0x0b1725);
  rect(g,x+2+(n%2),8+r*9,4,4,[0xbfa79c,0xc8c9b5,0xedd8c4,0x849eac][n%4],.83);
  rect(g,x+2,13+r*9,6,3,[0xc94439,0x3c6895,0xe3d064,0x416e54][(n>>>3)%4],.8);
 }
 // Outer stadium fencing and top parapet.
 rect(g,0,35,960,4,0x111d2f);
 rect(g,0,40,960,8,0x718498);
 rect(g,0,48,960,3,0xbbc7cf);
 for(let i=0;i<14;i++){
  const x=i*74-6,n=seed(i,4);
  poly(g,i%2===0?0x204d98:0xa53537,[x,45,x+69,43,x+67,61,x+5,65]);
  poly(g,i%2===0?0x3b6fc4:0xdb4847,[x+5,48,x+64,46,x+60,53,x+7,55]);
  rect(g,x+67,45,5,18,0x121e33);
  rect(g,x+69,46,2,13,0x9dabb5,.76);
  if(n%3===0){rect(g,x+17,48,25,2,0xeaf9f6,.10)}
 }
 // Clip-edge diagonal supports create raised arc illusion.
 for(let i=0;i<10;i++){
  const x=i*115-40;
  poly(g,0x141f30,[x+9,51,x+12,59,x+19,67,x+9,63]);
  rect(g,x+15,53,5,5,0x9badc0,.77);
 }
 rect(g,0,63,960,5,0x143b38,.95);
 rect(g,0,67,960,2,0xf5fae7,.18);
 return root;
}
function seatsAndBottom(P){
 const g=new P.Graphics();
 // Very small perimeter at the edges; the playable floor stays uncluttered.
 for(const side of [0,953]){
  rect(g,side,68,7,469,0x112c24,.84);
  rect(g,side+(side?0:3),72,2,460,0x7dbc7d,.22);
 }
 rect(g,0,531,960,9,0x183628,.75);
 rect(g,0,530,960,2,0x9ccb8e,.47);
 return g;
}
export function makeArena(P){
 const old=makeFallbackActors(P);
 const root=new P.Container();
 const grass=field(P),stands=crowd(P),edge=seatsAndBottom(P);
 root.addChild(grass,stands,edge);
 // Use licensed multi-action actors when available; old pixel meshes are
 // fallback ONLY. This stage itself uses no copied assets.
 const actorLayer=new P.Container();actorLayer.sortableChildren=true;
 root.addChild(actorLayer);
 actorLayer.addChild(old.shadow,old.enemyRock,old.enemyOnix,old.player);
 const lighting=new P.Graphics();root.addChild(lighting);
 const vfx=new P.Container();root.addChild(vfx);
 const stage={root,shadow:old.shadow,enemyRock:old.enemyRock,enemyOnix:old.enemyOnix,
  player:old.player,actorLayer,vfx,lighting,
  arenaStyle:'grass-stadium-v06'};
 stage.updateLighting=(time,shots=[])=>{
  lighting.clear();
  // Moving stadium floodlights are restrained so grass texture is readable.
  const pulse=.020+.008*Math.sin(time*1.5);
  lighting.beginFill(0xc8f7c5,pulse).drawEllipse(480,312,315,183).endFill();
  for(const shot of shots.slice(0,3)){
   lighting.beginFill(0xffa841,.029).drawEllipse(shot.x,shot.y,51,35).endFill();
  }
 };
 return stage;
}
