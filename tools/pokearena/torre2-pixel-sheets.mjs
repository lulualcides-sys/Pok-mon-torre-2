/* Authored Torre 2 pixel sprite strips (pilot only). No copied third-party art.
 * Deterministic 12 x 64 x 64 RGBA PNG, nearest-neighbor, alpha transparency.
 * Pixelorama/LibreSprite can import the PNG frames for artist refinements.
 */
import {deflateSync} from 'node:zlib';
import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const N=32,S=2,T=12,W=N*S*T,H=N*S;
const COLOR={ink:'#17243d',navy:'#254967',blue:'#4092ba',cyan:'#81dbe9',
 white:'#f6ffff',pale:'#b9ecf8',ice:'#73c4ec',frost:'#d3f4ff',steel:'#4c789e',
 deep:'#6a4b18',ochre:'#aa7423',gold:'#edb42b',lemon:'#ffe35f',bright:'#fff9ce',
 waterink:'#143b65',water:'#267daf',crest:'#49b7d1',foam:'#bef6f2',shadow:'#234e7b'};
const rgb=c=>{const h=COLOR[c]||c;return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16))};
class PixelArt{
 constructor(){this.bytes=new Uint8Array(N*N*4)}
 dot(x,y,color,thick=1){
  const [r,g,b]=rgb(color),X=Math.round(x),Y=Math.round(y);
  for(let dy=0;dy<thick;dy++)for(let dx=0;dx<thick;dx++){
   const xx=X+dx,yy=Y+dy;if(xx<0||xx>=N||yy<0||yy>=N)continue;
   const i=(yy*N+xx)*4;this.bytes[i]=r;this.bytes[i+1]=g;this.bytes[i+2]=b;this.bytes[i+3]=255;
  }
 }
 line(x1,y1,x2,y2,color,thick=1){
  const steps=1+Math.ceil(Math.max(Math.abs(x2-x1),Math.abs(y2-y1))*2);
  for(let j=0;j<=steps;j++){const t=j/steps;
   this.dot(x1+(x2-x1)*t,y1+(y2-y1)*t,color,thick)}
 }
 bolt(points,color,thick=1){for(let i=1;i<points.length;i++)
  this.line(...points[i-1],...points[i],color,thick)}
 flake(x,y,arm=2){
  this.dot(x,y,'ink',2);this.dot(x+1,y+1,'white');
  for(let d=1;d<=arm;d++)for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d]])
   this.dot(x+dx,y+dy,d===arm?'white':'ice');
  for(const [dx,dy] of [[-1,-1],[1,1],[1,-1],[-1,1]])
   this.dot(x+dx*arm,y+dy*arm,'pale');
 }
}
function zap(f,p){
 const impact=f>=8,flight=f>=4&&f<8,phase=f%4,x=flight?19:16,y=16;
 if(impact){
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4+.14*(phase%2),dx=Math.cos(angle),dy=Math.sin(angle);
   const near=3+phase,far=14+(3-phase)*2;
   const points=[[x+Math.round(dx*near),y+Math.round(dy*near)],
    [x+Math.round(dx*far*.55),y+Math.round(dy*far*.55)],
    [x+Math.round(dx*far+Math.sin(i*5)*3),y+Math.round(dy*far)]];
   p.bolt(points,'ink',3);p.bolt(points,i%2?'bright':'gold',1);
  }
  p.dot(x-3,y-3,'ochre',7);p.dot(x-2,y-2,'lemon',5);p.dot(x,y,'white',3);
  return;
 }
 const hull=[[x-8,y],[x-4,y-7],[x-1,y-5],[x+3,y-9],[x+5,y-4],
  [x+9,y-1],[x+6,y+3],[x+7,y+7],[x+1,y+6],[x-3,y+9],[x-4,y+4]];
 for(let i=0;i<hull.length;i++)p.line(...hull[i],...hull[(i+1)%hull.length],'ink',2);
 for(const [dx,dy] of [[0,0],[-3,0],[2,-1],[-1,-3],[2,3],[-3,3]])
  p.dot(x+dx,y+dy,'ochre',3);
 for(const [dx,dy] of [[-2,-2],[1,-3],[3,0],[-1,2],[1,3]])
  p.dot(x+dx,y+dy,'gold',3);
 p.dot(x,y,'lemon',5);p.dot(x+1,y,'bright',2);
 const n=phase%2?1:-1;
 for(const [coords,tint,width] of [
  [[[x-3,y-5],[x-6,y-10],[x-4,y-13+n]],'gold',2],
  [[[x+5,y-3],[x+10,y-7],[x+13,y-5+n]],'lemon',2],
  [[[x+3,y+4],[x+7,y+10],[x+5,y+12-n]],'gold',2],
  [[[x-5,y+4],[x-11,y+7],[x-14,y+4+n]],'bright',1]])
  p.bolt(coords,tint,width);
 if(flight)for(let i=0;i<4;i++)
  p.bolt([[x-7,y-5+i*3],[x-13-i%2,y-4+i*3],[1+i%3,y-9+i*3]],i%2?'gold':'lemon');
 if(phase>=2){p.dot(x-12,y-11,'lemon',2);p.dot(x+13,y+8,'white')}
}
const FLAKES=[[6,15,2],[12,9,3],[19,16,2],[25,12,2],[10,23,1],[22,24,2],
 [27,4,1],[15,28,1],[3,26,1],[19,3,1],[29,20,1],[7,5,1],[24,29,1]];
function snow(f,p){
 for(let i=0;i<FLAKES.length;i++){
  let [x,y,arm]=FLAKES[i];
  x=(x+Math.round(f*.65*(1+i%3))+32)%32;
  y+=Math.round(Math.sin((f+i)*.58)*(i%3===0?2:1));
  if(y<2||y>30)continue;
  if((f+i)%4===0)arm=Math.min(3,arm+1);
  p.flake(x,y,arm);
  const tint=i%3===0?'frost':i%3===1?'pale':'ice';
  p.dot(x-4,y+2,tint,2);p.dot(x-8,y+3,'steel');
  if(i%2===0){p.dot(x-6,y,tint);p.dot(x-10,y+1,'pale')}
 }
 for(let i=0;i<3;i++){
  const y=6+i*8+(f+i)%3;
  p.line(1+i*2,y,7+i*2,y,'steel');
  p.line(4+i*2,y-1,12+i*2,y-1,i%2?'frost':'pale');
 }
}
function whirlpool(f,p){
 // Three visibly different water belts wrap the target vertically.
 // Keep the center transparent: Pokémon sprite must stay readable.
 const phase=f*Math.PI/6;
 const rings=[
  {y:8,rx:8,ry:3},{y:17,rx:11,ry:4},{y:26,rx:14,ry:4}
 ];
 for(let tier=0;tier<rings.length;tier++){
  const {y,rx,ry}=rings[tier];
  for(let n=0;n<42;n++){
   const angle=n*Math.PI/21+phase*(tier%2?-.74:1);
   const px=16+Math.round(Math.cos(angle)*rx);
   const py=y+Math.round(Math.sin(angle)*ry);
   const front=Math.sin(angle)>=0;
   p.dot(px-1,py,front?'waterink':'shadow',3);
   p.dot(px,py,front?'water':'blue',2);
   if(front&&((n+f*3+tier*5)%4<2))p.dot(px,py,'foam');
   else if(!front&&n%5<2)p.dot(px,py,'crest');
  }
  // A crescent of moving foam on each ring's forward lip.
  const crestX=16+Math.round(Math.cos(phase+tier*2.2)*rx*.74);
  p.line(crestX-3,y+ry-1,crestX+2,y+ry-1,'foam',2);
 }
 // Opposing helical strands connect the three belts (a continuous vortex,
 // not disconnected circular splash symbols).
 for(let i=0;i<17;i++){
  const h=6+i*1.25,turn=phase+h*.37;
  const radius=7+(h-6)*.33;
  for(const a of [turn,turn+Math.PI]){
   const px=16+Math.cos(a)*radius;
   const py=h+Math.sin(a)*1.5;
   p.dot(px-1,py,'waterink',3);
   p.dot(px,py,'crest',2);
   if(i%3===0)p.dot(px+1,py,'foam');
  }
 }
 for(let i=0;i<6;i++){
  const angle=(i*.95+phase*1.3);
  const x=16+Math.round(Math.cos(angle)*(10+i%3*3));
  const y=3+(i*7+f*2)%8;
  p.dot(x,y,i%2?'pale':'foam',i%3===0?2:1);
 }
}
function crc(b){
 let c=0xffffffff;
 for(const byte of b){c^=byte;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1}
 return (c^0xffffffff)>>>0;
}
function pngChunk(type,payload){
 const label=Buffer.from(type),n=Buffer.alloc(4),check=Buffer.alloc(4);
 n.writeUInt32BE(payload.length);
 check.writeUInt32BE(crc(Buffer.concat([label,payload])));
 return Buffer.concat([n,label,payload,check]);
}
function toPng(bytes){
 const raw=Buffer.alloc(H*(W*4+1));
 for(let y=0;y<H;y++)Buffer.from(bytes.buffer,bytes.byteOffset+y*W*4,W*4).copy(raw,y*(W*4+1)+1);
 const head=Buffer.alloc(13);head.writeUInt32BE(W,0);head.writeUInt32BE(H,4);
 head[8]=8;head[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  pngChunk('IHDR',head),pngChunk('IDAT',deflateSync(raw,{level:9})),
  pngChunk('IEND',Buffer.alloc(0))]);
}
export async function generateJohtoPilotSheets(folder){
 await mkdir(folder,{recursive:true});
 const files=[];
 for(const [id,draw] of [['zap-cannon',zap],['powder-snow',snow],['whirlpool',whirlpool]]){
  const bytes=new Uint8Array(W*H*4);
  for(let frame=0;frame<T;frame++){
   const a=new PixelArt();draw(frame,a);
   for(let y=0;y<N;y++)for(let x=0;x<N;x++){
    const src=(y*N+x)*4;
    if(!a.bytes[src+3])continue;
    for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
     const dst=((y*S+dy)*W+frame*N*S+x*S+dx)*4;
     bytes[dst]=a.bytes[src];bytes[dst+1]=a.bytes[src+1];
     bytes[dst+2]=a.bytes[src+2];bytes[dst+3]=255;
    }
   }
  }
  const file=join(folder,id+'.png'),image=toPng(bytes);
  await writeFile(file,image);
  files.push({id,file,frames:T,frameWidth:N*S,frameHeight:N*S,bytes:image.length});
 }
 await writeFile(join(folder,'manifest.json'),
  JSON.stringify({schemaVersion:1,approved:false,mode:'pilot',frames:T,
   authoredSource:'tools/pokearena/torre2-pixel-sheets.mjs',
   files:files.map(({file,...rest})=>rest)},null,2)+'\n');
 return files;
}
if(process.argv[1]?.endsWith('torre2-pixel-sheets.mjs'))
 generateJohtoPilotSheets(process.argv[2]||'_site/arena2d/assets/torre2/johto-pilot')
 .then(files=>console.log(JSON.stringify(files))).catch(err=>{console.error(err);process.exitCode=1});
