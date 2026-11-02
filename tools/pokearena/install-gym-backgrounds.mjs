/* T38 raster gym installer — no external fetch and no graphics generation.
 * Images must be intentionally placed in the repository's approved/ folder.
 * The default empty folder generates an empty manifest and keeps the last
 * functioning visual renderer, without requesting nonexistent PNG files.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
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
 let width=0,height=0;
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
   const [depth,color,compression,filter,interlace]=bytes.subarray(offset+16,offset+21);
   if(depth!==8||![2,6].includes(color)||compression!==0||filter!==0||
    interlace!==0)throw new Error('Gym PNG must be noninterlaced RGB/RGBA8: '+slug);
   sawIHDR=true;
  }else if(type==='IDAT')sawIDAT=true;
  else if(type==='IEND'){
   if(len!==0||end!==bytes.length)throw new Error('Invalid gym PNG end: '+slug);
   sawIEND=true;break;
  }
  offset=end;
 }
 if(!sawIHDR||!sawIDAT||!sawIEND)
  throw new Error('Incomplete gym PNG: '+slug);
 if(!((width===1280&&height===720)||(width===640&&height===360)))
  throw new Error('Gym art must be 1280x720 or 640x360, no forced zoom: '+slug);
 return {width,height};
}
export async function installGymBackgrounds(dest,{source=SOURCE}={}){
 const folder=path.join(dest,OUT);
 await fs.mkdir(folder,{recursive:true});
 const scenes=[];
 for(const [stage,slug] of GYMS.entries()){
  const name=slug+'-interior.png',file=path.join(source,name);
  let bytes;
  try{bytes=await fs.readFile(file)}catch(e){
   if(e?.code==='ENOENT')continue;
   throw e;
  }
  const {width,height}=assertRasterPNG(bytes,slug);
  await fs.writeFile(path.join(folder,name),bytes);
  scenes.push(Object.freeze({stage,slug,key:'torre2-gym-scene-'+slug,
   path:OUT+'/'+name,width,height,
   sha256:createHash('sha256').update(bytes).digest('hex')}));
 }
 const manifest={version:1,scenes};
 await fs.writeFile(path.join(folder,'manifest.json'),
  JSON.stringify(manifest,null,2)+'\n','utf8');
 return manifest;
}
