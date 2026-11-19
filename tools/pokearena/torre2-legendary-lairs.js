/* Pokémon Torre 2 — legendary lairs drawn as genuine pixel art.
 * Every lair is painted pixel by pixel on a small canvas (W×H logical pixels,
 * limited palette, 1-px outlines, dithering) and shown at 2× with
 * nearest-neighbour sampling, like a GBA screen. Animated details (sparks,
 * snow, embers, water, fireflies) sit on the same 2-px grid.
 * Original drawing for this project: no third-party map image is used.
 */
export const LAIR_SCALE=2;
const KINDS=['powerplant','seafoam','ember','cave','faraway'];

// ---- low-resolution pixel painter -----------------------------------------
function painter(g){
 const px=(x,y,c)=>g.fillStyle(c,1).fillRect(x|0,y|0,1,1);
 const rect=(x,y,w,h,c)=>{if(w>0&&h>0)g.fillStyle(c,1).fillRect(x|0,y|0,w|0,h|0)};
 // Stepped (pixel) ellipse; the edge rows stay jagged like hand-placed pixels.
 const disc=(cx,cy,rx,ry,c)=>{for(let dy=-ry;dy<=ry;dy++){const hw=Math.round(rx*Math.sqrt(Math.max(0,1-(dy*dy)/(ry*ry+.01))));rect(cx-hw,cy+dy,hw*2+1,1,c)}};
 const outlinedDisc=(cx,cy,rx,ry,outline,body)=>{disc(cx,cy,rx+1,ry+1,outline);disc(cx,cy,rx,ry,body)};
 // 2-colour ordered dither inside a rectangle.
 const dither=(x,y,w,h,a,b,level=.5)=>{const m=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)px(x+i,y+j,(m[(y+j)&3][(x+i)&3]/16)<level?b:a)};
 return {px,rect,disc,outlinedDisc,dither};
}
const seeded=s=>()=>(s=(s*1103515245+12345)%2147483648)/2147483648;

// ---- the five places ------------------------------------------------------
function drawPowerPlant(p,W,H,rnd){
 const back=44;
 // Floor: cream tiles with a 1-px grout line and a light top-left edge.
 p.rect(0,back,W,H-back,0xe4d6b4);
 for(let ty=back;ty<H;ty+=8)for(let tx=0;tx<W;tx+=8){
  p.rect(tx,ty+7,8,1,0xccbb94);p.rect(tx+7,ty,1,8,0xccbb94);p.rect(tx,ty,7,1,0xf2e8cf);
 }
 // Back wall: dark band, generator panels with colour stripes, pipes and lights.
 p.rect(0,0,W,back,0x464a60);p.rect(0,0,W,5,0x2c2e3e);
 for(let x=4;x+40<=W-2;x+=44){
  p.rect(x,6,40,32,0x262838);p.rect(x+1,7,38,30,0x8e95b2);p.rect(x+1,7,38,1,0xb8bed6);p.rect(x+38,8,1,29,0x6a7090);
  [0x7a5cc8,0x4a7ad8,0xd85a5a].forEach((c,i)=>{p.rect(x+4,11+i*4,32,2,c);p.rect(x+4,11+i*4,32,1,0xffffff&(c|0x303030))});
  for(let i=0;i<6;i++)p.rect(x+6+i*5,25,3,6,0x3a3d52);
  p.px(x+33,26,0x5ae06a);p.px(x+33,29,0xff5050);p.px(x+35,26,0xf2c232);
  p.rect(x+41,8,2,30,0x6c7088);p.rect(x+41,14,2,2,0x9aa0bc);p.rect(x+41,28,2,2,0x9aa0bc);
 }
 // Hazard skirting board.
 for(let y=back-5;y<back;y++)for(let x=0;x<W;x++)p.px(x,y,((x+y)>>2)&1?0x2d2a24:0xf2c232);
 p.rect(0,back,W,2,0xb8a882);
 // Cables winding across the floor.
 for(let x=0;x<W;x++){const y=back+14+Math.round(Math.sin(x/17)*3);p.px(x,y,0x5a5446);p.px(x,y+1,0x8a8270)}
 // Generator drums (cylinders), the centre left clear for Zapdos.
 const drum=(cx,cy)=>{p.rect(cx-6,cy+6,13,2,0xb8a882);
  p.rect(cx-6,cy-7,13,14,0x5a4a1c);p.rect(cx-5,cy-6,11,12,0xd8b23a);p.rect(cx-4,cy-6,2,12,0xf2d878);p.rect(cx+3,cy-6,1,12,0xa8862a);
  p.rect(cx-5,cy-2,11,1,0x8a6c22);p.rect(cx-5,cy+2,11,1,0x8a6c22);p.outlinedDisc(cx,cy-7,5,1,0x5a4a1c,0xf6e08a);p.px(cx,cy-7,0x8a6c22)};
 for(const y of [back+28,H-10])for(let x=12;x<W-8;x+=20)if(Math.abs(x-W/2)>44)drum(x,y);
 // Metal platform with a hazard ring.
 const cx=W/2,cy=back+44;
 p.disc(cx,cy+2,46,12,0x9a8c6c);
 for(let a=0;a<48;a++){const t=a/48*Math.PI*2;p.rect(Math.round(cx+Math.cos(t)*44)-1,Math.round(cy+Math.sin(t)*11),3,2,a%4<2?0xf2c232:0x2d2a24)}
 p.outlinedDisc(cx,cy,38,8,0x3c3f52,0x7a809c);p.disc(cx,cy-1,34,6,0x9aa0bc);p.rect(cx-20,cy-4,22,1,0xc4c9dc);
 return {spot:{x:cx,y:cy-2},anim:'sparks',back};
}
function drawSeafoam(p,W,H,rnd){
 const back=40;
 // Icy floor with dithered frost and sparkles.
 p.dither(0,back,W,H-back,0xc6d8f2,0xb2c8ec,.28);
 for(let i=0;i<90;i++)p.px(rnd()*W,back+rnd()*(H-back),rnd()<.5?0xffffff:0xe2ecfa);
 // Back wall: dark ice with vertical streaks.
 p.rect(0,0,W,back,0x3a5ea0);
 for(let x=0;x<W;x+=5)p.rect(x+(x%3),0,1,back-6,0x4a70b4);
 for(let x=2;x<W;x+=11)p.rect(x,0,2,6+(x%5),0x2c4c88);
 // Waterfall (static body, animated streaks are added on top) and its pool.
 const wx=Math.round(W*.74);p.rect(wx-12,0,24,back+2,0x2c5aa8);p.rect(wx-12,0,1,back+2,0x1e4488);p.rect(wx+11,0,1,back+2,0x1e4488);
 p.outlinedDisc(wx,back+16,40,11,0x1e3c84,0x2f62bc);p.disc(wx,back+15,34,8,0x4a82d4);
 for(let i=0;i<8;i++)p.rect(wx-28+i*8,back+14+(i%2)*3,4,1,0x9cc8f4);
 p.rect(wx-12,back,24,2,0xffffff);
 // Row of ice boulders along the wall.
 const boulder=(cx,cy,r)=>{p.outlinedDisc(cx,cy,r,Math.round(r*.8),0x1e3c78,0x4c78c0);p.disc(cx-2,cy-2,Math.round(r*.55),Math.round(r*.4),0x86aee6);p.rect(cx-3,cy-4,2,1,0xffffff)};
 for(let x=4;x<W;x+=13)if(Math.abs(x-wx)>16)boulder(x,back-3+(x%2),6);
 for(const [bx,by,r] of [[22,back+28,8],[54,H-14,7],[W-30,H-12,8],[96,back+16,6],[W-78,back+40,6],[130,H-8,5]])boulder(bx,by,r);
 // Snow platform with little ice crystals.
 const cx=Math.round(W*.5),cy=back+46;
 p.outlinedDisc(cx,cy+2,38,9,0x5a86c8,0x9ec0ec);p.disc(cx,cy,34,7,0xeaf4ff);p.rect(cx-16,cy-3,18,1,0xffffff);
 for(let i=0;i<7;i++){const x=cx-30+i*10;p.rect(x,cy+2,1,4,0x7aa8e0);p.px(x,cy+1,0xffffff);p.rect(x-1,cy+4,3,1,0x9cc4f0)}
 return {spot:{x:cx,y:cy-3},anim:'snow',back,waterfall:{x:wx,top:0,bottom:back}};
}
function drawEmber(p,W,H,rnd){
 const back=46;
 // Night sky of the volcano: dithered bands from maroon to burning red.
 const bands=[0x2a1020,0x3e1424,0x5a1c22,0x7a2a1e,0x9a3a1a];
 for(let i=0;i<bands.length-1;i++)p.dither(0,i*back/4|0,W,Math.ceil(back/4)+1,bands[i],bands[i+1],.35);
 // Two volcano silhouettes with a glowing crater.
 const mountain=(cx,top,hw,dark,rim)=>{for(let y=top;y<back;y++){const k=(y-top)/(back-top),w=Math.round(hw*k)+3;p.rect(cx-w,y,w*2,1,dark);p.px(cx-w,y,rim)}};
 mountain(Math.round(W*.3),8,96,0x3a2420,0x6a3a2c);mountain(Math.round(W*.72),16,90,0x4a2c24,0x7a4434);
 const c=Math.round(W*.3);p.rect(c-5,8,11,2,0xff7a2a);p.rect(c-3,7,7,1,0xffd040);p.rect(c-1,4,3,3,0xff9a3a);
 // Basalt ground with rocks.
 p.rect(0,back,W,H-back,0x5a3428);p.rect(0,back,W,1,0x7a4a34);
 for(let i=0;i<80;i++){const x=rnd()*W|0,y=back+2+rnd()*(H-back-2)|0;p.rect(x,y,2,1,rnd()<.5?0x6e4232:0x46281e)}
 // Basalt outcrops and cracks glowing with heat.
 for(const [x,y,r] of [[40,back+12,9],[W-46,back+14,10],[70,H-10,7],[W-70,H-8,8],[118,back+8,6],[W-118,back+10,6]]){
  p.outlinedDisc(x,y,r,Math.round(r*.6),0x24140e,0x4a2a20);p.disc(x-2,y-2,Math.round(r*.6),Math.round(r*.3),0x6a3e2c);p.rect(x-3,y-Math.round(r*.6)+1,4,1,0x8a5238)}
 for(let i=0;i<7;i++){let x=20+rnd()*(W-40)|0,y=back+6+rnd()*(H-back-12)|0;
  for(let k=0;k<10;k++){p.px(x,y,0x2a1410);if(k%3===1)p.px(x,y+1,0xd8481a);x+=1;y+=rnd()<.5?1:-1;if(y<back+2)y=back+2}}
 // Lava rivers: outline, molten body, hot core and highlights.
 const river=(sx,sy,ex,ey,ph)=>{for(let k=0;k<=80;k++){const t=k/80,x=sx+(ex-sx)*t+Math.sin(t*6+ph)*8,y=sy+(ey-sy)*t;
  p.disc(Math.round(x),Math.round(y),5,2,0x7a1808)};for(let k=0;k<=80;k++){const t=k/80,x=sx+(ex-sx)*t+Math.sin(t*6+ph)*8,y=sy+(ey-sy)*t;
  p.disc(Math.round(x),Math.round(y),4,1,0xe2481a);p.rect(Math.round(x)-2,Math.round(y),4,1,0xffa030);if(k%9===0)p.px(Math.round(x),Math.round(y),0xfff070)}};
 river(14,back+6,92,H-2,0);river(W-14,back+8,W-100,H-1,2);
 // Stone summit nest.
 const cx=Math.round(W/2),cy=back+42;
 p.outlinedDisc(cx,cy+3,44,11,0x2e1a14,0x6a4030);p.disc(cx,cy+1,38,8,0x8a5638);p.disc(cx,cy,30,5,0x9e6844);
 for(let i=0;i<10;i++){const t=i/10*Math.PI*2,x=Math.round(cx+Math.cos(t)*40),y=Math.round(cy+2+Math.sin(t)*9);p.outlinedDisc(x,y,3,2,0x2e1a14,0x7a5040);p.px(x-1,y-1,0xa87454)}
 return {spot:{x:cx,y:cy-1},anim:'embers',back};
}
function drawCave(p,W,H,rnd){
 const back=42;
 // Back wall: stacked rock faces in three shades, stalactites hanging down.
 p.rect(0,0,W,back,0x1a1624);
 // Irregular boulders piled into the wall, each with a lit top edge.
 for(let row=0;row<4;row++)for(let x=-6+(row%2)*9;x<W+8;x+=18){const y=4+row*10+(rnd()*3|0),rx=8+(rnd()*4|0),ry=5+(rnd()*2|0);
  p.outlinedDisc(x,y,rx,ry,0x0e0b14,row%2?0x2a2436:0x302a3e);p.disc(x-2,y-2,rx-4,ry-3,0x3c3450);p.rect(x-3,y-ry+1,4,1,0x4e4664)}
 for(let x=3;x<W;x+=13+(x%5)){const l=4+(x%7);for(let k=0;k<l;k++)p.rect(x+(k>>1),k,Math.max(1,4-(k>>1)),1,k===0?0x3c3450:0x221d2e)}
 p.rect(0,back-2,W,2,0x120f19);
 // Floor with grit.
 p.rect(0,back,W,H-back,0x3a3448);
 for(let i=0;i<110;i++)p.px(rnd()*W,back+rnd()*(H-back),rnd()<.5?0x4a4260:0x2c2638);
 // Flooded channels on both sides, with a darker shore line.
 const pool=(x,w)=>{p.rect(x,back+6,w,H-back-6,0x16213c);p.rect(x+1,back+7,w-2,H-back-7,0x22408a);
  p.rect(x+1,back+7,w-2,1,0x3a62b0);for(let i=x;i<x+w;i+=3)p.px(i,back+5+(i%2),0x5a5070);
  for(let i=0;i<14;i++)p.rect(x+3+(rnd()*(w-10)|0),back+10+(rnd()*(H-back-14)|0),4,1,0x4a74c4)};
 pool(0,Math.round(W*.27));pool(Math.round(W*.73),W-Math.round(W*.73));
 // Rock Smash boulders.
 const rock=(x,y)=>{p.outlinedDisc(x,y,5,4,0x2a1e14,0x6a5440);p.disc(x-1,y-1,3,2,0x8a7058);p.px(x,y-2,0x3a2c20);p.px(x+1,y-1,0x3a2c20);p.px(x,y,0x3a2c20)};
 for(const [x,y] of [[Math.round(W*.34),back+12],[Math.round(W*.64),H-12],[Math.round(W*.37),H-10],[Math.round(W*.62),back+16]])rock(x,y);
 // Raised platform with violet crystals for Mewtwo.
 const cx=Math.round(W/2),cy=back+42;
 p.outlinedDisc(cx,cy+3,40,10,0x120f19,0x4e4466);p.disc(cx,cy+1,34,7,0x625882);p.rect(cx-18,cy-3,20,1,0x7a70a0);
 for(const [dx,h] of [[-30,9],[-24,6],[26,8],[32,5]]){const x=cx+dx,y=cy+2;
  for(let k=0;k<h;k++)p.rect(x-(k<h-2?1:0),y-k,k<h-2?3:1,1,k<2?0x5a2a9a:0xb070ff);p.px(x,y-h+1,0xf0d8ff)}
 return {spot:{x:cx,y:cy-1},anim:'ripples',back,pools:[[0,Math.round(W*.27)],[Math.round(W*.73),W-Math.round(W*.73)]]};
}
function drawFaraway(p,W,H,rnd){
 const back=46;
 // Jungle wall: layered tree crowns with light and shade, trunks below.
 p.rect(0,0,W,back+6,0x123a1c);
 const crown=(x,y,r)=>{p.outlinedDisc(x,y,r,Math.round(r*.85),0x0e2e16,0x1e5a2a);p.disc(x-2,y-2,Math.round(r*.7),Math.round(r*.55),0x2c7a36);p.disc(x-4,y-4,Math.round(r*.35),Math.round(r*.3),0x4a9a48);p.px(x-5,y-5,0x7ac060)};
 for(let x=-4;x<W+10;x+=18){p.rect(x+4,back-10,4,18,0x4a2e16);p.rect(x+4,back-10,1,18,0x6a4422)}
 for(let i=0;i<34;i++)crown(rnd()*W|0,rnd()*(back-6)|0,9+rnd()*6|0);
 // Tall grass everywhere: three-tone tufts on an 8-px grid.
 p.rect(0,back,W,H-back,0x2a7a34);
 const cx=Math.round(W/2),cy=back+40;
 const inClearing=(x,y)=>((x-cx)/62)**2+((y-cy)/17)**2<1;
 for(let y=back;y<H;y+=6)for(let x=(y/6%2?0:4);x<W;x+=8){if(inClearing(x+3,y+3))continue;
  p.rect(x,y+4,7,2,0x1e5e28);p.rect(x+1,y+1,1,4,0x3aa040);p.rect(x+3,y,1,5,0x4ac050);p.rect(x+5,y+2,1,3,0x3aa040);p.px(x+3,y,0x8ae070)}
 // Sunny clearing with flowers.
 p.outlinedDisc(cx,cy,62,17,0x2a7a34,0x7cc45a);p.disc(cx,cy-1,54,13,0x96d868);p.dither(cx-40,cy-6,80,10,0x96d868,0xa8e47a,.3);
 for(let i=0;i<18;i++){const t=rnd()*Math.PI*2,r=.3+rnd()*.6,x=Math.round(cx+Math.cos(t)*54*r),y=Math.round(cy+Math.sin(t)*13*r);
  const c=rnd()<.5?0xf890c0:0xfff070;p.px(x,y,c);p.px(x-1,y,c);p.px(x+1,y,c);p.px(x,y-1,c);p.px(x,y,0xffffff)}
 return {spot:{x:cx,y:cy-2},anim:'fireflies',back};
}
const DRAW={powerplant:drawPowerPlant,seafoam:drawSeafoam,ember:drawEmber,cave:drawCave,faraway:drawFaraway};

// ---- public: draw a lair into the scene ------------------------------------
// x,y,w,h are screen (logical 640×360) coordinates. Returns the screen spot
// where the legendary stands, plus every object/tween so they can be cleaned.
export function drawLegendaryLair(scene,kind,x,y,w,h){
 const draw=DRAW[KINDS.includes(kind)?kind:'cave'];
 const W=Math.floor(w/LAIR_SCALE),H=Math.floor(h/LAIR_SCALE),key='torre2-lair-'+kind+'-'+W+'x'+H;
 let info=null;
 const g=scene.make.graphics({x:0,y:0,add:false});
 info=draw(painter(g),W,H,seeded(kind.length*977+31));
 if(!scene.textures.exists(key))g.generateTexture(key,W,H);
 g.destroy();
 const tex=scene.textures.get(key);
 if(typeof Phaser!=='undefined')tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
 const img=scene.add.image(Math.round(x),Math.round(y),key).setOrigin(0,0).setScale(LAIR_SCALE).setDepth(2).setData('torre2-lair-art',kind);
 const objects=[img],tweens=[],S=LAIR_SCALE,rnd=seeded(kind.length*131+7);
 const dot=(c,size=1)=>{const d=scene.add.rectangle(0,0,size*S,size*S,c).setOrigin(0,0).setDepth(2.5);objects.push(d);return d};
 const at=(lx,ly)=>({x:Math.round(x+lx*S),y:Math.round(y+ly*S)});
 const tw=cfg=>{const t=scene.tweens.add(cfg);tweens.push(t);return t};
 if(info.anim==='sparks'){
  // Small 2-px electric sparks flicker over the generators.
  for(let i=0;i<9;i++){const p=at(6+rnd()*(W-12),8+rnd()*(info.back-14));
   const s=scene.add.graphics().setDepth(2.5);objects.push(s);
   s.fillStyle(0xfff26a,1);for(const [a,b] of [[0,0],[1,1],[1,2],[0,3],[1,4],[2,5]])s.fillRect(p.x+a*S,p.y+b*S,S,S);
   s.setAlpha(0);tw({targets:s,alpha:1,duration:90,yoyo:true,repeat:-1,repeatDelay:500+rnd()*1500,delay:rnd()*1500})}
 }else if(info.anim==='snow'){
  const wf=info.waterfall;
  for(let i=0;i<7;i++){const d=dot(0xe8f4ff,1).setAlpha(.9),p=at(wf.x-10+i*3,wf.top);d.setPosition(p.x,p.y);
   tw({targets:d,y:at(0,wf.bottom-2).y,duration:650,repeat:-1,delay:i*95})}
  for(let i=0;i<22;i++){const d=dot(0xffffff,1),p=at(rnd()*W,0);d.setPosition(p.x,p.y);
   tw({targets:d,y:y+h-S,x:p.x+S*8,duration:3800+rnd()*2400,repeat:-1,delay:rnd()*4000})}
 }else if(info.anim==='embers'){
  for(let i=0;i<20;i++){const d=dot(i%2?0xffd040:0xff8a2a,1),p=at(rnd()*W,H-2-rnd()*20);d.setPosition(p.x,p.y);
   tw({targets:d,y:y+S*6,alpha:{from:1,to:0},duration:2600+rnd()*2200,repeat:-1,delay:rnd()*2600})}
 }else if(info.anim==='ripples'){
  for(const [px0,pw] of info.pools)for(let i=0;i<5;i++){const d=scene.add.rectangle(0,0,4*S,S,0x7aa4e8).setOrigin(0,0).setDepth(2.5);objects.push(d);
   const p=at(px0+4+rnd()*(pw-12),info.back+12+rnd()*(H-info.back-18));d.setPosition(p.x,p.y);
   tw({targets:d,x:p.x+3*S,alpha:{from:.2,to:.9},duration:1400,yoyo:true,repeat:-1,delay:rnd()*1400})}
  // Violet aura pulsing around the platform.
  const a=scene.add.ellipse(at(info.spot?.x??W/2,0).x,0,1,1,0xb070ff,.18).setDepth(2.4);objects.push(a);
 }else{
  for(let i=0;i<12;i++){const d=dot(0xfff0a0,1),p=at(20+rnd()*(W-40),info.back+6+rnd()*(H-info.back-10));d.setPosition(p.x,p.y);
   tw({targets:d,x:p.x+S*10,y:p.y-S*6,alpha:{from:.15,to:1},duration:1600+rnd()*1400,yoyo:true,repeat:-1,delay:rnd()*1600})}
 }
 // Keep animated pixels inside the frame.
 const m=scene.make.graphics({add:false});m.fillStyle(0xffffff,1).fillRect(x,y,W*S,H*S);
 const mask=m.createGeometryMask();objects.forEach(o=>o.setMask?.(mask));
 scene.events.once('shutdown',()=>{tweens.forEach(t=>t.stop?.());m.destroy()});
 return {spot:at(info.spot.x,info.spot.y),objects,tweens,size:{W,H}};
}

// Ambient animation over the owner's lair illustration (campaign-art lair-*.png):
// the same 2-px pixel grid, nothing that depends on the drawing's layout.
export function drawLairAmbient(scene,kind,x,y,w,h){
 const S=LAIR_SCALE,rnd=seeded(kind.length*53+11),objects=[],tweens=[];
 const tw=cfg=>{const t=scene.tweens.add(cfg);tweens.push(t);return t};
 const dot=(c,px,py,size=1)=>{const d=scene.add.rectangle(Math.round(px),Math.round(py),size*S,size*S,c).setOrigin(0,0).setDepth(2.6);objects.push(d);return d};
 if(kind==='powerplant'){
  for(let i=0;i<10;i++){const sx=x+12+rnd()*(w-24),sy=y+6+rnd()*h*.42;
   const s=scene.add.graphics().setDepth(2.6);objects.push(s);s.fillStyle(0xfff26a,1);
   for(const [a,b] of [[0,0],[1,1],[1,2],[0,3],[1,4],[2,5]])s.fillRect(Math.round(sx+a*S),Math.round(sy+b*S),S,S);
   s.setAlpha(0);tw({targets:s,alpha:1,duration:90,yoyo:true,repeat:-1,repeatDelay:500+rnd()*1500,delay:rnd()*1500})}
 }else if(kind==='seafoam'){
  for(let i=0;i<26;i++){const sx=x+rnd()*w,d=dot(0xffffff,sx,y);d.setAlpha(.9);
   tw({targets:d,y:y+h-S,x:sx+S*10,duration:4200+rnd()*2600,repeat:-1,delay:rnd()*4200})}
 }else if(kind==='ember'){
  for(let i=0;i<24;i++){const sx=x+rnd()*w,sy=y+h-4-rnd()*24,d=dot(i%2?0xffd040:0xff8a2a,sx,sy);
   tw({targets:d,y:y+S*4,x:sx+(rnd()-.5)*S*12,alpha:{from:1,to:0},duration:2800+rnd()*2400,repeat:-1,delay:rnd()*2800})}
 }else if(kind==='cave'){
  for(let i=0;i<14;i++){const d=dot(i%3?0x9ad8ff:0xffffff,x+rnd()*w,y+rnd()*h*.7);d.setAlpha(0);
   tw({targets:d,alpha:{from:0,to:1},duration:500,yoyo:true,repeat:-1,repeatDelay:900+rnd()*2200,delay:rnd()*2400})}
  for(let i=0;i<10;i++){const sx=x+rnd()*w,sy=y+h*.25+rnd()*h*.4,d=dot(0xb8e4ff,sx,sy);d.setAlpha(.5);
   tw({targets:d,y:sy-S*14,alpha:{from:.6,to:0},duration:3000+rnd()*2000,repeat:-1,delay:rnd()*3000})}
 }else{
  for(let i=0;i<14;i++){const sx=x+20+rnd()*(w-40),sy=y+h*.35+rnd()*h*.55,d=dot(0xfff0a0,sx,sy);
   tw({targets:d,x:sx+S*10,y:sy-S*6,alpha:{from:.15,to:1},duration:1600+rnd()*1400,yoyo:true,repeat:-1,delay:rnd()*1600})}
  for(let i=0;i<6;i++){const sx=x+rnd()*w,d=dot(0x5ab040,sx,y,1);
   tw({targets:d,y:y+h-S,x:sx+S*20,duration:5200+rnd()*2400,repeat:-1,delay:rnd()*5000})}
 }
 const m=scene.make.graphics({add:false});m.fillStyle(0xffffff,1).fillRect(x,y,w,h);
 const mask=m.createGeometryMask();objects.forEach(o=>o.setMask?.(mask));
 scene.events.once('shutdown',()=>{tweens.forEach(t=>t.stop?.());m.destroy()});
 return {objects,tweens};
}
// Where the platform sits in each lair illustration (fraction of the frame).
export const LAIR_SPOT=Object.freeze({cave:.80,ember:.80,seafoam:.86,powerplant:.84,faraway:.84});

// Silph Co. president's office (Saffron), the Giovanni battle that gives the
// Master Ball. Same pixel painter: night windows, Silph plaque, shelves, desk.
function drawSilphOffice(p,W,H,rnd){
 const back=46;
 // Wall: dark navy panels above warm wood wainscot.
 p.rect(0,0,W,back,0x262c4a);p.rect(0,back-12,W,12,0x5a3a22);p.rect(0,back-12,W,1,0x8a5a34);p.rect(0,back-1,W,1,0x2a1a10);
 for(let x=0;x<W;x+=12)p.rect(x,back-11,1,10,0x4a2e1a);
 // Three tall windows with Saffron at night.
 const win=(x,w)=>{p.rect(x-1,3,w+2,back-15,0x9aa0bc);p.dither(x,4,w,back-17,0x0c1430,0x16224a,.45);
  for(let b=0;b<6;b++){const bx=x+1+b*Math.floor(w/6),bh=6+(rnd()*14|0),bw=Math.floor(w/6)-1;p.rect(bx,back-13-bh,bw,bh,0x1c2648);
   for(let k=0;k<5;k++)p.px(bx+1+(rnd()*(bw-2)|0),back-12-bh+(rnd()*(bh-2)|0),rnd()<.6?0xf2d860:0x8ab0e8)}
  p.rect(x+Math.floor(w/2),4,1,back-17,0x9aa0bc);p.rect(x,4+Math.floor((back-17)/2),w,1,0x9aa0bc);p.px(x+3,7,0xffffff)};
 win(24,58);win(W-82,58);
 // Silph Co. plaque in the middle of the wall.
 const cx=Math.round(W/2);p.outlinedDisc(cx,17,11,10,0x6a5428,0xd8b84a);p.disc(cx,17,8,7,0x2a2f52);
 for(const [x,y] of [[-2,-4],[-1,-4],[0,-4],[1,-4],[-3,-3],[-3,-2],[-2,-1],[-1,-1],[0,-1],[1,0],[2,1],[2,2],[1,3],[0,3],[-1,3],[-2,3]])p.px(cx+x,17+y,0xe84850);
 // Bookshelves at both ends.
 const shelf=x=>{p.rect(x,4,18,back-6,0x3a2412);p.rect(x+1,5,16,back-8,0x5a3a20);
  for(let r=0;r<3;r++){const y=8+r*11;p.rect(x+1,y+8,16,1,0x2a1a10);for(let b=0;b<6;b++)p.rect(x+2+b*2+(b>2?1:0),y+1+(b%2),2,7-(b%2),[0xc84848,0x4878c8,0xd8b84a,0x58a058,0x9a58c8,0xe8e0c8][b])}};
 shelf(2);shelf(W-20);
 // Floor: polished wood planks.
 p.rect(0,back,W,H-back,0x7a4e2c);
 for(let y=back;y<H;y+=5){p.rect(0,y+4,W,1,0x5e3a20);for(let x=(y/5%2?0:14);x<W;x+=28)p.rect(x,y,1,4,0x5e3a20)}
 for(let i=0;i<40;i++)p.px(rnd()*W,back+rnd()*(H-back),0x8e5c36);
 // President's desk with a computer, behind the battle spot.
 const dx=cx-34;p.rect(dx,back-6,68,14,0x2e1c0e);p.rect(dx+1,back-6,66,3,0x8a5a34);p.rect(dx+1,back-3,66,10,0x5a3a20);
 p.rect(dx+4,back-2,16,8,0x4a2e1a);p.rect(dx+48,back-2,16,8,0x4a2e1a);p.px(dx+12,back+2,0xd8b84a);p.px(dx+56,back+2,0xd8b84a);
 p.rect(dx+28,back-14,14,9,0x2a2f3e);p.rect(dx+29,back-13,12,7,0x4ab0d8);p.rect(dx+33,back-5,4,1,0x2a2f3e);p.px(dx+30,back-12,0xc8f0ff);
 // Potted plants.
 const plant=(x,y)=>{p.rect(x-4,y-1,9,7,0x6a3a20);p.rect(x-4,y-1,9,1,0x9a5a30);for(const [a,b,r] of [[0,-6,4],[-3,-4,3],[3,-4,3]])p.outlinedDisc(x+a,y+b,r,r,0x1a4a22,0x3a8a40);p.px(x-1,y-8,0x7ac060)};
 plant(30,back+6);plant(W-30,back+6);
 // Red carpet with gold trim where Giovanni and his Pokémon stand.
 const cy=back+34;p.outlinedDisc(cx,cy,74,13,0xb88a2a,0x8a1e2a);p.disc(cx,cy,68,10,0xa82838);
 for(let a=0;a<36;a++){const t=a/36*Math.PI*2;p.px(Math.round(cx+Math.cos(t)*71),Math.round(cy+Math.sin(t)*11.5),0xf0d070)}
 p.disc(cx,cy,24,4,0xb83848);
 return {spot:{x:cx,y:cy-1},anim:'none',back};
}
export function drawSilphOfficeArt(scene,x,y,w,h){
 const W=Math.floor(w/LAIR_SCALE),H=Math.floor(h/LAIR_SCALE),key='torre2-silph-office-'+W+'x'+H;
 if(!scene.textures.exists(key)){const g=scene.make.graphics({x:0,y:0,add:false});
  drawSilphOffice(painter(g),W,H,seeded(4242));g.generateTexture(key,W,H);g.destroy()}
 const info=drawSilphOffice(painter({fillStyle(){return this},fillRect(){return this}}),W,H,seeded(4242));
 if(typeof Phaser!=='undefined')scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
 const image=scene.add.image(Math.round(x),Math.round(y),key).setOrigin(0,0).setScale(LAIR_SCALE).setDepth(2).setData('torre2-silph-office',true);
 return {image,spot:{x:Math.round(x+info.spot.x*LAIR_SCALE),y:Math.round(y+info.spot.y*LAIR_SCALE)}};
}
