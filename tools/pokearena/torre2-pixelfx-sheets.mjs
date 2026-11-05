/* Build-time PixelFX -> Phaser/WebGL nearest-neighbour sprite sheets.
 * Source: https://github.com/patch-gg/pixelfx (MIT, pinned in package.json).
 * NO Canvas 2D attack renderer or network dependency in the deployed game.
 * Effects are VFX-only: do not copy any PixelFX visual semantics into damage/status.
 */
import {createFrame,clearFrame,createFx,composite} from "pixelfx";
import {deflateSync} from "node:zlib";
import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {JOHTO_PIXELFX_43,PIXELFX_PIN} from "./torre2-johto-pixelfx-catalog.js";
import {addJohtoPixelSignature} from "./torre2-johto-signatures.mjs";
import {JOHTO_LAB_REVIEW_4,JOHTO_APPROVED_5} from "./torre2-johto-lab-catalog.js";
const EXCLUDE_NATIVE=new Set([...JOHTO_LAB_REVIEW_4,...JOHTO_APPROVED_5]);

export const PIXELFX_CEL=96;
export const PIXELFX_FRAMES=12;
/* PixelFX source palettes selected for genuine Pokémon move semantics.
 * Recolor at source (not CSS/tinting generic orbs) and keep the true
 * procedural animation/frames distinct for every move.
 */
const PIXELFX_PALETTES=Object.freeze({
 "octazooka":["#101024","#1d1a35","#302644","#4a375e","#665080","#8d75a5","#b5a3ce","#e1d8ed"],
 "thief":["#111225","#26243f","#43335e","#65508a","#8970b2","#baa0d8","#e1cdef","#fff1ff"],
 "steel-wing":["#0c1f32","#1c3b53","#315b75","#547e99","#86abc1","#b9d7e4","#dceef3","#ffffff"],
 "return":["#351b39","#68406b","#9e5c91","#c97fa6","#eaa9c4","#ffcddd","#ffe8ee","#ffffff"],
 "frustration":["#391916","#733027","#af4a2b","#d95c31","#f18a42","#ffb65b","#ffe18d","#fff5c0"],
 "present":["#472335","#8a3555","#bc446e","#ea6081","#f3a366","#fdd182","#fff1b9","#ffffff"],
 "hidden-power":["#1a2140","#353969","#52569d","#6f74bb","#9d9bdf","#cbbeef","#e6dcfb","#ffffff"],
 "pursuit":["#151323","#29223d","#493361","#6e4885","#9b64ae","#bf8dce","#e6c5f1","#ffffff"]
});
const FRAME=256;
const BAND=PIXELFX_CEL*PIXELFX_FRAMES;
const PNG_HEADER=Buffer.from([137,80,78,71,13,10,26,10]);
function crc(bytes){
 let c=0xffffffff;
 for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1}
 return(c^0xffffffff)>>>0;
}
function pngChunk(kind,payload){
 const type=Buffer.from(kind),length=Buffer.alloc(4),sum=Buffer.alloc(4);
 length.writeUInt32BE(payload.length);
 sum.writeUInt32BE(crc(Buffer.concat([type,payload])));
 return Buffer.concat([length,type,payload,sum]);
}
function png(data,w,h){
 const raw=Buffer.alloc(h*(1+w*4));
 for(let y=0;y<h;y++)Buffer.from(data.buffer,data.byteOffset+y*w*4,w*4)
  .copy(raw,y*(1+w*4)+1);
 const head=Buffer.alloc(13);
 head.writeUInt32BE(w,0);head.writeUInt32BE(h,4);head[8]=8;head[9]=6;
 return Buffer.concat([PNG_HEADER,pngChunk("IHDR",head),
  pngChunk("IDAT",deflateSync(raw,{level:9})),pngChunk("IEND",Buffer.alloc(0))]);
}
function cropFrames(frames){
 let x0=FRAME,y0=FRAME,x1=-1,y1=-1;
 // Ignore translucent bloom fringe when deciding the common stable viewport.
 for(const f of frames)for(let y=0;y<FRAME;y++)for(let x=0;x<FRAME;x++){
  const k=(y*FRAME+x)*4;
  if(f[k+3]<90)continue;
  if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
 }
 if(x1<0)throw Error("PixelFX emitted no visible pixels");
 const side=Math.min(FRAME,Math.max(76,Math.ceil(Math.max(x1-x0+1,y1-y0+1)*1.2)));
 const mx=(x0+x1)/2,my=(y0+y1)/2,scale=side/PIXELFX_CEL;
 const strip=new Uint8Array(BAND*PIXELFX_CEL*4);
 let painted=0;
 frames.forEach((f,frame)=>{
  for(let y=0;y<PIXELFX_CEL;y++)for(let x=0;x<PIXELFX_CEL;x++){
   const sx=Math.max(0,Math.min(FRAME-1,Math.floor(mx-side/2+(x+.5)*scale)));
   const sy=Math.max(0,Math.min(FRAME-1,Math.floor(my-side/2+(y+.5)*scale)));
   const src=(sy*FRAME+sx)*4,dst=(y*BAND+frame*PIXELFX_CEL+x)*4;
   strip[dst]=f[src];strip[dst+1]=f[src+1];strip[dst+2]=f[src+2];
   strip[dst+3]=f[src+3];if(strip[dst+3]>60)painted++;
  }
 });
 if(painted<12)throw Error("PixelFX cropped to empty strip");
 return {strip,painted,side};
}
export async function generateJohtoPixelFXSheets(folder){
 await mkdir(folder,{recursive:true});
 const results=[];
 for(const m of JOHTO_PIXELFX_43){
  // No generated static PNG for review-active moves OR already approved
  // techniques. All six use independent real-time P2 native sprite layers.
  if(EXCLUDE_NATIVE.has(m.id))continue;
  // Uses the actual upstream PixelFX module and its draw/particle simulation.
  const mod=await import("pixelfx/fx/"+m.fx);
  if(typeof mod.draw!=="function"&&typeof mod.create!=="function")
   throw Error("PixelFX module lacks renderer: "+m.fx);
  const duration=Math.max(.7,Math.min(3.2,mod.meta?.duration??1.8));
  const fx=createFx(mod,{x:0,y:0,seed:7,light:.72,
   ...(PIXELFX_PALETTES[m.id]?{palette:PIXELFX_PALETTES[m.id]}:{})});
  const f=createFrame(FRAME,FRAME,-FRAME/2,-FRAME/2);
  const out=new Uint8ClampedArray(FRAME*FRAME*4),captures=[];
  for(let i=0;i<PIXELFX_FRAMES;i++){
   fx.update(duration/PIXELFX_FRAMES);
   clearFrame(f);fx.draw(f);
   composite(f,out,null,.72);
   captures.push(out.slice());
  }
  const {strip,painted,side}=cropFrames(captures);
  // Add move-specific eight-bit shapes directly to PixelFX frames at build time.
  // 3 approved original animations are absent from this list, by design.
  addJohtoPixelSignature(strip,m.id);
  const image=png(strip,BAND,PIXELFX_CEL);
  const file=join(folder,m.id+".png");
  await writeFile(file,image);
  results.push({id:m.id,fx:m.fx,frames:PIXELFX_FRAMES,
   frameWidth:PIXELFX_CEL,frameHeight:PIXELFX_CEL,
   bytes:image.length,painted,sourceCrop:side,visualOnly:true});
 }
 await writeFile(join(folder,"manifest.json"),JSON.stringify({
  generator:"torre2-pixelfx-sheets.mjs",engine:"P2-native-fourteen-live-plus-PixelFX-unapproved-backlog",upstreamCommit:PIXELFX_PIN,
  license:"MIT",approved:false,mode:"visual-only",files:results
 },null,2)+"\n");
 return results;
}
if(process.argv[1]?.endsWith("torre2-pixelfx-sheets.mjs"))
 generateJohtoPixelFXSheets(process.argv[2]||"_site/arena2d/assets/torre2/johto-pixelfx")
 .then(files=>console.log("Generated PixelFX Johto VFX:",files.length))
 .catch(e=>{console.error(e);process.exitCode=1});
