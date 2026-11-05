/* FIRST FOUR Johto revisions — original 24-frame OFFLINE pixel-art sprites.
 * Earlier PixelFX shape stamps were static and looked like blocks.
 * Comparative design references: Pixelbolt slash-hit / shadow-spells (MIT),
 * Pixel Ability FX Generator magicAura / smokePuff (Apache-2.0),
 * P2 spatial/timing principles; all raster pixels here are original.
 * No runtime Canvas2D/CSS and NO APPROVED Johto technique modified.
 */
import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {deflateSync} from "node:zlib";
export const FIRST_FOUR=Object.freeze(["triple-kick","thief","snore","octazooka"]);
export const FRAME_COUNT=24,FRAME_WIDTH=96,FRAME_HEIGHT=96;
const W=96,H=96,FRAMES=24,STRIP=W*FRAMES,PI=Math.PI;
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{let x=clamp(v);return x*x*(3-2*x)};
const lerp=(a,b,t)=>a+(b-a)*t;
const T={
 black:[16,20,37],sun:[255,196,72],light:[255,247,201],orange:[239,132,70],
 purple0:[26,17,48],purple1:[65,39,98],purple2:[117,68,166],purple3:[208,158,237],
 aqua0:[27,75,110],aqua1:[63,158,185],aqua2:[120,225,227],aqua3:[231,255,245],
 ink0:[14,15,34],ink1:[40,31,72],ink2:[85,54,121],ink3:[151,89,170],ink4:[229,169,227]
};
function canvas(strip,frame){
 function dot(x,y,c,a=255){
  x=Math.round(x);y=Math.round(y);if(x<0||x>=W||y<0||y>=H||a<=0)return;
  const k=(y*STRIP+x+frame*W)*4;
  strip[k]=c[0];strip[k+1]=c[1];strip[k+2]=c[2];strip[k+3]=a;
 }
 function disc(x,y,r,c,a=255){
  const R=Math.max(.7,r),left=Math.ceil(x-R),top=Math.ceil(y-R);
  for(let yy=top;yy<=y+R;yy++)for(let xx=left;xx<=x+R;xx++)
   if((xx-x)**2+(yy-y)**2<R*R)dot(xx,yy,c,a);
 }
 function line(x,y,X,Y,c,thick=1,alpha=255){
  const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));
  for(let i=0;i<=n;i++){const t=i/n;disc(lerp(x,X,t),lerp(y,Y,t),thick/2,c,alpha)}
 }
 function arc(x,y,rx,ry,a,b,c,thick=1,alpha=255){
  const n=Math.max(8,Math.ceil((b-a)*Math.max(rx,ry)*1.3));
  for(let i=0;i<=n;i++){const th=lerp(a,b,i/n);
   disc(x+Math.cos(th)*rx,y+Math.sin(th)*ry,thick/2,c,alpha);}
 }
 function star(x,y,r,c,alpha=255){
  for(let k=0;k<8;k++){const a=k*PI/4;
   line(x+Math.cos(a)*2,y+Math.sin(a)*2,
    x+Math.cos(a)*r*(k%2?.55:1),y+Math.sin(a)*r*(k%2?.55:1),
    c,k%2?1:2,alpha);}
  disc(x,y,2,T.light,alpha);
 }
 return {dot,disc,line,arc,star};
}
function kick(p,t){
 const n=Math.min(2,Math.floor(t*3)),phase=t*3-n,
  angle=[-1,.08,.9][n]+phase*.21,
  bx=47+[-9,11,0][n],by=48+[-11,-3,12][n],
  anX=bx+11*Math.cos(angle)-5*Math.sin(angle),
  anY=by+11*Math.sin(angle)+5*Math.cos(angle),
  xx=bx+(24+n*2)*Math.cos(angle),yy=by+(24+n*2)*Math.sin(angle);
 p.line(bx-21,by+8,anX,anY,T.black,8);
 p.line(bx-21,by+8,anX,anY,T.sun,4);
 p.line(anX,anY,xx,yy,T.black,10);
 p.line(anX,anY,xx,yy,T.sun,6);
 p.line(anX-1,anY-2,xx-1,yy-2,T.light,2);
 const bang=ease((phase-.16)/.23)*(1-ease((phase-.63)/.28));
 if(bang>0){
  p.star(xx+4,yy,Math.max(2,(9+n*5+bang*10)*bang),T.light,Math.floor(255*bang));
  p.arc(xx+4,yy,12+n*4,9+n*3,angle-.85,angle+.85,T.orange,2,Math.floor(225*bang));
 }
 for(let j=0;j<6;j++){
  const a=angle+PI+(j-3)*.12,dist=(1-phase)*22+j;
  p.line(bx+Math.cos(a)*dist,by+Math.sin(a)*dist,
   bx+Math.cos(a)*(dist+8),by+Math.sin(a)*(dist+8),
   j%2?T.orange:T.light,1,Math.floor(165*(1-phase)));
 }
}
function thief(p,t){
 const back=t>.46,phase=back?clamp((t-.46)/.54):clamp(t/.46);
 const strength=back?1-ease(phase*.9):ease(phase*2);
 const cx=48+Math.sin(t*PI*2)*6,cy=45-Math.sin(t*PI)*4;
 for(let n=0;n<3;n++){
  const offset=(n-1)*8;let prev=null;
  for(let j=0;j<=36;j++){
   const u=j/36,ang=lerp(-1.2,1.02,u)+(back?-.25:.24)*phase;
   const radius=12+19*u+n;
   const x=cx+Math.cos(ang)*radius+offset*.45;
   const y=cy+Math.sin(ang)*radius+offset*.7;
   if(prev){p.line(prev.x,prev.y,x,y,T.purple0,5);
    p.line(prev.x,prev.y,x,y,n===1?T.purple3:T.purple2,2.4,Math.floor(strength*255));}
   prev={x,y};
  }
 }
 for(let k=0;k<15;k++){
  const u=(k/15+t*.85)%1;
  p.disc(17+u*63,52+Math.sin(k*1.7+t*9)*14,1.2,
   k%2?T.purple2:T.purple3,Math.floor((1-u)*180));
 }
 if(back){const x=48+Math.cos(phase*8)*13,y=46+Math.sin(phase*8)*13;
  p.star(x,y,5,T.light,Math.floor((1-phase)*230));}
}
function snore(p,t){
 // Three consecutive expanding acoustic wavefronts, no solid disc/orb.
 for(let i=0;i<3;i++){
  const u=t*3-i;if(u<0||u>1)continue;
  const alpha=ease(u/.24)*(1-ease((u-.73)/.27));
  const x=32+u*26,y=47+Math.sin(u*PI*4+i)*2;
  const rx=6+u*18,ry=11+u*19;
  p.arc(x,y,rx,ry,-PI*.7,PI*.7,T.aqua0,4,Math.floor(alpha*170));
  p.arc(x+1,y,rx,ry,-PI*.7,PI*.7,T.aqua2,2,Math.floor(alpha*250));
  p.arc(x+4,y,rx*.5,ry*.56,-PI*.5,PI*.5,T.aqua3,1,Math.floor(alpha*225));
  for(let j=0;j<5;j++){const a=-1.3+j*.6;
   p.disc(x+rx*Math.cos(a),y+ry*Math.sin(a),1.2,T.aqua3,Math.floor(alpha*235));}
 }
 for(let i=0;i<12;i++){
  const u=(i*7+t*25)%38;
  p.dot(17+u,54+Math.sin(t*PI*2+i)*13,i%2?T.aqua1:T.aqua2,132);
 }
}
function octazooka(p,t){
 if(t<.7){
  const u=t/.7,pulse=1+Math.sin(u*PI*6)*.1;
  p.disc(45,47,14*pulse,T.ink0);
  p.disc(45,46,11*pulse,T.ink1);
  p.disc(43,44,8*pulse,T.ink2);
  p.disc(39,40,4,T.ink3);
  p.disc(39,39,2,T.ink4);
  for(let i=0;i<8;i++)
   p.disc(54+i*3+u*5,47+Math.sin(i*1.9+u*8)*5,
    Math.max(1,4-i*.4),i%2?T.ink1:T.ink2,Math.floor(220*(1-i/9)));
 }else{
  const u=clamp((t-.7)/.3),fade=1-ease(u),r=5+29*ease(u);
  for(let k=0;k<19;k++){
   const a=k*2.399+Math.sin(k*17)*.2,reach=r*(.65+(k%5)*.1);
   const x=48+Math.cos(a)*reach,y=48+Math.sin(a)*reach*.8+5*u*u;
   p.disc(x,y,Math.max(.9,3.5-u*2.7),
    k%4===0?T.ink4:k%2?T.ink3:T.ink1,Math.floor(255*fade));
   if(k%4===0)p.line(48+Math.cos(a)*reach*.4,48+Math.sin(a)*reach*.3,
     x,y,T.ink2,1,Math.floor(170*fade));
  }
  p.arc(48,48,12+20*u,9+16*u,-PI*.9,PI*.9,T.ink3,1.5,Math.floor(190*fade));
 }
}
const RENDER=Object.freeze({"triple-kick":kick,thief,snore,octazooka});
export function drawBatchFourFrames(id){
 const draw=RENDER[id];if(!draw)throw Error("Not an unapproved first-batch move: "+id);
 const rgba=new Uint8Array(STRIP*H*4),hashes=[];
 for(let frame=0;frame<FRAMES;frame++){
  draw(canvas(rgba,frame),(frame+.5)/FRAMES);
  let hash=2166136261,occupied=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const k=(y*STRIP+frame*W+x)*4;if(rgba[k+3]){
    hash=Math.imul(hash^rgba[k]^rgba[k+1]^rgba[k+2]^rgba[k+3],16777619);occupied++;
   }
  }
  if(occupied<16)throw Error("Blank VFX frame "+id+":"+frame);
  hashes.push(hash>>>0);
 }
 if(new Set(hashes).size!==FRAMES)throw Error("Static VFX frames rejected "+id);
 return {rgba,hashes};
}
function crc(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)
 c=c&1?0xedb88320^(c>>>1):c>>>1}return(c^0xffffffff)>>>0}
function chunk(type,payload){const t=Buffer.from(type),len=Buffer.alloc(4),sum=Buffer.alloc(4);
 len.writeUInt32BE(payload.length);sum.writeUInt32BE(crc(Buffer.concat([t,payload])));
 return Buffer.concat([len,t,payload,sum]);}
function encodePNG(data,w,h){
 const raw=Buffer.alloc(h*(1+w*4));
 for(let y=0;y<h;y++)Buffer.from(data.buffer,data.byteOffset+y*w*4,w*4)
  .copy(raw,y*(1+w*4)+1);
 const header=Buffer.alloc(13);header.writeUInt32BE(w,0);header.writeUInt32BE(h,4);
 header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
 chunk("IHDR",header),chunk("IDAT",deflateSync(raw,{level:9})),
 chunk("IEND",Buffer.alloc(0))]);
}
export async function renderBatchFourFile(id,folder){
 const {rgba}=drawBatchFourFrames(id),png=encodePNG(rgba,STRIP,H);
 await mkdir(folder,{recursive:true});await writeFile(join(folder,id+".png"),png);
 return {id,fx:"review-batch-1/original-24-frame-"+id,
  frames:FRAMES,frameWidth:W,frameHeight:H,bytes:png.length,
  visualOnly:false,approved:false,reviewBatch:1,reviewState:"pending-visual-approval"};
}
