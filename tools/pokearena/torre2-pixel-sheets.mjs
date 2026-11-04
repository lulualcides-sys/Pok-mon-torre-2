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
// 12 animation cels: charge (0-3), heavy electric projectile (4-7),
// fragmented lightning impact (8-11). Every outline is hard pixel art.
function zap(f,p){
 const impact=f>=8,phase=impact?f-8:f%4,cx=16,cy=16;
 if(!impact){
  const radius=f<4?4+Math.floor(f/2):7+Math.floor((f-4)/2);
  const jump=f%2?1:-1;
  // Ink silhouette; broken amber edge, deep-blue interior and glowing core.
  for(let yy=-radius-1;yy<=radius+1;yy++)for(let xx=-radius-1;xx<=radius+1;xx++){
   const wobble=(Math.sin(xx*2.7+f*.8)+Math.cos(yy*1.9-f*.6))*.6;
   const distance=Math.hypot(xx*1.05,yy*.94)+wobble;
   if(distance>radius+.7)continue;
   const color=distance>radius-1.1?'ink':distance>radius-2.4?'ochre':
    distance>radius-4?'gold':distance>1.6?'lemon':'white';
   p.dot(cx+xx,cy+yy,color);
  }
  // Lightning arcs break the silhouette into a charged, jagged outline.
  const arms=[
   [[-6,-4],[-10,-9],[-8,-14],[-13,-17]],
   [[6,-3],[11,-6],[10,-10],[15,-12]],
   [[3,6],[6,10],[5,13],[9,16]],
   [[-6,4],[-12,5],[-11,9],[-16,11]]
  ];
  for(let i=0;i<arms.length;i++){
   const vertices=arms[i].map(([x,y],j)=>
    [cx+x+(j===2?jump:0),cy+y+(j===1?-jump:0)]);
   if(f<4&&i>=2)continue;
   p.bolt(vertices,'ink',3);
   p.bolt(vertices,i%2?'lemon':'gold',1);
  }
  // Bright internal lightning notch and an asymmetric energetic corona.
  p.bolt([[12,14],[17,11],[15,16],[20,18],[17,22]],'bright');
  p.dot(15,15,'white',2);p.dot(19,17,'bright',2);
  if(f>=4){
   for(let j=0;j<4;j++){
    const x=3+(j*7+f*3)%26,y=4+(j*9+f)%23;
    p.dot(x,y,j%2?'lemon':'bright',j===1?2:1);
   }
  }
  return;
 }
 // Contact: branching discharge fragments extend out of a central flash.
 const spread=[11,15,14,9][phase];
 for(let i=0;i<8;i++){
  const angle=(i/8)*Math.PI*2+((f%2)*.12);
  const dir=[Math.cos(angle),Math.sin(angle)];
  const tx=cx+Math.round(dir[0]*spread),ty=cy+Math.round(dir[1]*spread);
  const mid=[cx+Math.round(dir[0]*spread*.47+Math.sin(i+f)*2),
   cy+Math.round(dir[1]*spread*.47-Math.cos(i+f)*2)];
  const branch=[cx+Math.round(dir[0]*spread*.8-dir[1]*3),
   cy+Math.round(dir[1]*spread*.8+dir[0]*3)];
  p.bolt([[cx,cy],mid,[tx,ty]],'ink',3);
  p.bolt([[cx,cy],mid,[tx,ty]],i%2?'gold':'lemon');
  if(phase<3)p.bolt([mid,branch],i%3?'bright':'gold');
 }
 for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++){
  const distance=Math.hypot(x,y);
  if(distance>5-phase*.5)continue;
  p.dot(cx+x,cy+y,distance>3.5?'gold':distance>1.9?'lemon':'white');
 }
 for(let j=0;j<10;j++){
  const a=j*2.4+phase*.8;
  const r=9+(j%3)*2+phase;
  p.dot(cx+Math.cos(a)*r,cy+Math.sin(a)*r,j%2?'bright':'gold');
 }
}
// Snow is a wind-driven cluster of individually legible six-point crystals.
// Deliberately leaves plenty of transparency around the enemy sprite.
const FLAKES=[
 [1,4,1],[5,20,2],[11,8,1],[19,24,2],[26,12,1],
 [3,29,1],[15,17,2],[28,29,2],[23,3,1],[8,12,1],
 [14,28,1],[29,21,1],[21,13,2]
];
function snow(f,p){
 const density=f<3?5:f<7?9:13;
 for(let i=0;i<density;i++){
  const [seedX,seedY,arm]=FLAKES[i];
  const x=((seedX+f*(2+i%3))%37)-2;
  const y=seedY+Math.round(Math.sin((f+i)*.65)*2);
  if(x<2||x>30||y<2||y>30)continue;
  const tint=i%3===0?'frost':i%3===1?'pale':'white';
  // Ice crystal with separated thin arms (never a filled white rectangle).
  p.dot(x,y,'white',2);
  p.dot(x-arm-1,y,tint);p.dot(x+arm+1,y,tint);
  p.dot(x,y-arm-1,'ice');p.dot(x,y+arm+1,'ice');
  if(arm===2){
   for(const [dx,dy] of [[-2,-2],[-2,2],[2,-2],[2,2]])
    p.dot(x+dx,y+dy,'pale');
  }
  // Two diagonal cold-air wisps trailing left of each crystal.
  if(i%2===0){
   p.line(x-6,y+2,x-3,y+2,'steel');
   p.line(x-8,y+4,x-5,y+4,'ice');
  }
 }
 if(f>=7){
  // Short shattering-ice burst at contact, no fullscreen snow cloud.
  const grow=3+Math.min(4,f-7);
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3+f*.15;
   const x=16+Math.round(Math.cos(angle)*grow);
   const y=16+Math.round(Math.sin(angle)*grow);
   p.dot(x,y,'frost',2);
   p.dot(x+Math.round(Math.cos(angle)*3),
    y+Math.round(Math.sin(angle)*3),'ice');
  }
  p.dot(15,15,'white',2);
 }
}
// Hollow three-level whirlpool with rotating whitecaps: the Pokémon stays
// legible through the center. No large opaque blue square at contact.
function whirlpool(f,p){
 const rotation=f*Math.PI/7;
 const layers=[
  {y:8,rx:7,ry:3},{y:17,rx:10,ry:4},{y:26,rx:13,ry:4}
 ];
 for(let level=0;level<layers.length;level++){
  const {y,rx,ry}=layers[level];
  for(let i=0;i<36;i++){
   const a=i*Math.PI/18+rotation*(level===1?-.8:1);
   const x=16+Math.round(Math.cos(a)*rx);
   const yy=y+Math.round(Math.sin(a)*ry);
   const front=Math.sin(a)>0;
   p.dot(x,yy,front?'water':'shadow',2);
   if((i+2*f+level)%5<3)p.dot(x,yy,front?'foam':'crest');
   if(front&&(i+f)%8===0)p.dot(x+1,yy-1,'white');
  }
  // An animated brighter lip at one side of each ellipse.
  const a=rotation*(level%2?-1:1)+level*1.8;
  const x=16+Math.round(Math.cos(a)*rx);
  const yy=y+Math.round(Math.sin(a)*ry);
  p.line(x-2,yy,x+2,yy,'foam');
 }
 // Sidewall flowing upward and curling into the rings. No center filler.
 for(const side of [-1,1]){
  for(let i=0;i<10;i++){
   const y=10+i*1.7,osc=Math.sin(rotation+y*.38)*2;
   const x=16+side*(8+i*.36)+osc;
   p.dot(x,y,'waterink',2);
   if(i%2===0)p.dot(x+side,y-1,'crest');
   if(i%3===0)p.dot(x+side,y,'foam');
  }
 }
 // Foam particles fly off the outer rim at staggered positions.
 for(let i=0;i<7;i++){
  const a=i*2.4+rotation;
  const r=11+(i%3)*2;
  p.dot(16+Math.cos(a)*r,5+(i*5+f*2)%23,
   i%2?'pale':'foam',i%3===0?2:1);
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
