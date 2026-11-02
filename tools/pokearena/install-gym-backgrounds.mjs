/* T38 raster gym installer — no external fetch and no graphics generation.
 * Images must be intentionally placed in the repository's approved/ folder.
 * The default empty folder generates an empty manifest and keeps the last
 * functioning visual renderer, without requesting nonexistent PNG files.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inflateSync} from 'node:zlib';
const GYMS=Object.freeze(['brock','misty','surge','erika','koga','sabrina','blaine','giovanni']);
const SOURCE='reference-assets/kanto/gym-interiors/approved';
const OUT='assets/ui/gym-interiors';
const CRC_TABLE=Uint32Array.from({length:256},(_,i)=>{
 let c=i;
 for(let j=0;j<8;j++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
 return c>>>0;
});
function crc32(bytes,start,end){
 let c=0xffffffff;
 for(let i=start;i<end;i++)c=CRC_TABLE[(c^bytes[i])&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
function assertRasterPNG(bytes,slug){
 if(bytes.length<57||bytes.length>10*1024*1024||
  bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
  throw new Error('Gym artwork must be a valid, bounded PNG: '+slug);
 let offset=8,sawIHDR=false,sawIDAT=false,sawIEND=false;
 let width=0,height=0,color=0,idatClosed=false;
 const idat=[];
 while(offset+12<=bytes.length){
  const len=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
  const end=offset+12+len;
  if(len>bytes.length||end>bytes.length)
   throw new Error('Truncated gym PNG: '+slug);
  const checksum=bytes.readUInt32BE(end-4);
  if(crc32(bytes,offset+4,end-4)!==checksum)
   throw new Error('Invalid gym PNG chunk CRC: '+slug);
  if(!sawIHDR){
   if(type!=='IHDR'||len!==13)throw new Error('Invalid gym PNG header: '+slug);
   width=bytes.readUInt32BE(offset+8);height=bytes.readUInt32BE(offset+12);
   const [depth,pixelColor,compression,filter,interlace]=bytes.subarray(offset+16,offset+21);
   color=pixelColor;
   if(depth!==8||![2,6].includes(color)||compression!==0||filter!==0||
    interlace!==0)throw new Error('Gym PNG must be noninterlaced RGB/RGBA8: '+slug);
   sawIHDR=true;
  }else if(type==='IHDR')throw new Error('Duplicate gym PNG header: '+slug);
  else if(type==='IDAT'){
   if(idatClosed)throw new Error('Noncontiguous gym PNG IDAT: '+slug);
   sawIDAT=true;idat.push(bytes.subarray(offset+8,end-4));
  }else if(type==='IEND'){
   idatClosed=true;
   if(len!==0||end!==bytes.length)throw new Error('Invalid gym PNG end: '+slug);
   sawIEND=true;break;
  }else if(sawIDAT)idatClosed=true;
  offset=end;
 }
 if(!sawIHDR||!sawIDAT||!sawIEND)
  throw new Error('Incomplete gym PNG: '+slug);
 if(!((width===1280&&height===720)||(width===640&&height===360)))
  throw new Error('Gym art must be 1280x720 or 640x360, no forced zoom: '+slug);
 // CRC alone cannot prove that IDAT contains a decodable image. Limit the
 // inflated stream before allocation, then check every PNG scanline filter.
 const stride=width*(color===6?4:3)+1;
 const expected=stride*height;
 let pixels;
 try{pixels=inflateSync(Buffer.concat(idat),{maxOutputLength:expected+1})}
 catch(error){throw new Error('Invalid gym PNG IDAT stream: '+slug,{cause:error})}
 if(pixels.length!==expected)
  throw new Error('Invalid gym PNG pixel length: '+slug);
 for(let row=0;row<height;row++){
  if(pixels[row*stride]>4)throw new Error('Invalid gym PNG scanline filter: '+slug);
 }
 return {width,height};
}
export async function installGymBackgrounds(dest,{source=SOURCE}={}){
 const folder=path.join(dest,OUT);
 // Preflight every input before copying any image. A malformed later PNG
 // must never leave a partially refreshed set of approved backgrounds.
 const verified=new Map();
 for(const [stage,slug] of GYMS.entries()){
  const name=slug+'-interior.png',file=path.join(source,name);
  let bytes;
  try{bytes=await fs.readFile(file)}catch(e){
   if(e?.code==='ENOENT')continue;
   throw e;
  }
  const {width,height}=assertRasterPNG(bytes,slug);
  verified.set(slug,{bytes,entry:Object.freeze({stage,slug,
   key:'torre2-gym-scene-'+slug,path:OUT+'/'+name,width,height,
   sha256:createHash('sha256').update(bytes).digest('hex')})});
 }
 await fs.mkdir(folder,{recursive:true});
 const scenes=[];
 for(const slug of GYMS){
  const name=slug+'-interior.png',target=path.join(folder,name);
  const asset=verified.get(slug);
  if(asset){
   await fs.writeFile(target,asset.bytes);
   scenes.push(asset.entry);
  }else{
   // Reused preview roots must not keep a removed/unapproved old PNG.
   await fs.rm(target,{force:true});
  }
 }
 const manifest={version:1,scenes};
 // Publish manifest last, after all referenced PNGs have been installed.
 await fs.writeFile(path.join(folder,'manifest.json'),
  JSON.stringify(manifest,null,2)+'\n','utf8');
 return manifest;
}
