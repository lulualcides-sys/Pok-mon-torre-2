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
function assertRasterPNG(bytes,slug){
 if(bytes.length<33||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||
  bytes.toString('ascii',12,16)!=='IHDR')throw new Error('Gym art must be a real PNG: '+slug);
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 if(!((width===1280&&height===720)||(width===640&&height===360)))
  throw new Error('Gym art must be 1280x720 or 640x360, no forced zoom: '+slug);
 if(bytes.length>10*1024*1024)throw new Error('Gym PNG too heavy for mobile: '+slug);
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
