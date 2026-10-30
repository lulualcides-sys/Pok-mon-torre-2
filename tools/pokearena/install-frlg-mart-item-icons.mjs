/* Build-only original FireRed/LeafGreen item icons, sourced from the
 * pinned pret/pokefirered decompilation. No runtime external requests.
 * GBA palette index zero is transparent; preserve all other pixel bytes.
 * These Nintendo/Game Freak assets are for the existing personal fan project.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

export const FRLG_ICON_COMMIT='ce6406d8c2eaf46d543c8a2606de0c3cb1951982';
export const FRLG_MART_ICONS=Object.freeze([
 'antidote','status_heal','full_heal','potion','large_potion',
 'poke_ball','great_ball','ultra_ball','tm_hm'
]);
export const FRLG_MART_ORIGIN='https://raw.githubusercontent.com/pret/pokefirered/'+FRLG_ICON_COMMIT+'/graphics/items/icons/';
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
export function gbaItemPNGForWeb(input){
 const png=Buffer.from(input);
 if(png.length<57||png.subarray(0,8).compare(PNG_SIGNATURE)!==0)
  throw Error('Invalid FireRed item icon PNG');
 let pos=8,plteEnd=-1,colors=0,indexed=false,hasTransparency=false,ended=false;
 while(pos+12<=png.length){
  const size=png.readUInt32BE(pos),next=pos+12+size;
  if(size>65536||next>png.length)throw Error('Invalid FRLG PNG chunk bounds');
  const type=png.toString('ascii',pos+4,pos+8);
  if(type==='IHDR'){
   const width=png.readUInt32BE(pos+8),height=png.readUInt32BE(pos+12);
   if(width>64||height>64||!width||!height)throw Error('Unexpected FRLG item dimensions');
   indexed=png[pos+17]===3;
  }else if(type==='PLTE'){plteEnd=next;colors=size/3;
  }else if(type==='tRNS')hasTransparency=true;
  if(type==='IEND'){ended=true;break}
  pos=next;
 }
 if(!ended)throw Error('Incomplete FRLG item icon PNG');
 if(!indexed||hasTransparency)return png;
 if(plteEnd<0||colors<2||colors>256||!Number.isInteger(colors))
  throw Error('Invalid original GBA item palette');
 const alpha=Buffer.alloc(colors,255);alpha[0]=0;
 const type=Buffer.from('tRNS'),body=Buffer.concat([type,alpha]);
 let crc=0xffffffff;
 for(const b of body){crc^=b;for(let j=0;j<8;j++)
  crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 const chunk=Buffer.alloc(12+colors);
 chunk.writeUInt32BE(colors,0);type.copy(chunk,4);alpha.copy(chunk,8);
 chunk.writeUInt32BE((crc^0xffffffff)>>>0,8+colors);
 return Buffer.concat([png.subarray(0,plteEnd),chunk,png.subarray(plteEnd)]);
}
async function download(name){
 const url=FRLG_MART_ORIGIN+name+'.png';
 let error;
 for(let attempt=0;attempt<2;attempt++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(name+' HTTP '+response.status);
   return gbaItemPNGForWeb(Buffer.from(await response.arrayBuffer()));
  }catch(e){error=e}
 }
 throw Error('Original FireRed sprite unavailable: '+name+' ('+String(error)+')');
}
export async function installFRLGMartItems(dest){
 const folder=path.join(dest,'assets/ui/frlg/items');
 await mkdir(folder,{recursive:true});
 const files=await Promise.all(FRLG_MART_ICONS.map(async name=>({name,data:await download(name)})));
 for(const {name,data} of files)await writeFile(path.join(folder,name+'.png'),data);
 const digest=createHash('sha256');
 for(const {name,data} of files){digest.update(name);digest.update(data)}
 return{count:files.length,source:'pret/pokefirered',commit:FRLG_ICON_COMMIT,
  sha256:digest.digest('hex')};
}
