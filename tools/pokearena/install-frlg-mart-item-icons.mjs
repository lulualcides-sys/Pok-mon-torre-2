/* Build-only original FireRed/LeafGreen shop icons + item-specific GBA
 * palettes from pinned pret/pokefirered. Personal fangame asset use.
 * No web request happens during gameplay. Preserve indexed pixels exactly.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
export const FRLG_ICON_COMMIT='ce6406d8c2eaf46d543c8a2606de0c3cb1951982';
export const FRLG_MART_ORIGIN='https://raw.githubusercontent.com/pret/pokefirered/'+FRLG_ICON_COMMIT+'/graphics/items/';
const spec=(image,palette=image)=>Object.freeze({image,palette});
export const FRLG_MART_ITEMS=Object.freeze({
 antidote:spec('antidote'),paralyzeheal:spec('status_heal','paralyze_heal'),
 awakening:spec('status_heal','awakening'),burnheal:spec('status_heal','burn_heal'),
 iceheal:spec('status_heal','ice_heal'),fullheal:spec('full_heal'),
 pokeball:spec('poke_ball'),greatball:spec('great_ball'),
 ultraball:spec('ultra_ball'),potion:spec('potion'),
 superpotion:spec('large_potion','super_potion'),
 'tm-rock-tomb':spec('tm_hm','rock_tm_hm'),
 'tm-thunderbolt':spec('tm_hm','electric_tm_hm'),
 'tm-water-pulse':spec('tm_hm','water_tm_hm'),
 'tm-flamethrower':spec('tm_hm','fire_tm_hm'),
 'tm-ice-beam':spec('tm_hm','ice_tm_hm'),
 'tm-shock-wave':spec('tm_hm','electric_tm_hm'),
 'tm-giga-drain':spec('tm_hm','grass_tm_hm'),
 'tm-calm-mind':spec('tm_hm','psychic_tm_hm'),
 'tm-fire-blast':spec('tm_hm','fire_tm_hm'),
 'tm-earthquake':spec('tm_hm','ground_tm_hm')
});
export const FRLG_MART_ICONS=Object.freeze([...new Set(
 Object.values(FRLG_MART_ITEMS).map(s=>s.image))]);
export const FRLG_MART_PALETTES=Object.freeze([...new Set(
 Object.values(FRLG_MART_ITEMS).map(s=>s.palette))]);
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
function crc32(bytes){
 let crc=0xffffffff;
 for(const b of bytes){crc^=b;for(let i=0;i<8;i++)
  crc=(crc>>>1)^((crc&1)?0xedb88320:0)}
 return (crc^0xffffffff)>>>0;
}
function pngChunk(type,payload){
 const chunk=Buffer.alloc(payload.length+12);
 chunk.writeUInt32BE(payload.length,0);
 chunk.write(type,4);payload.copy(chunk,8);
 chunk.writeUInt32BE(crc32(chunk.subarray(4,-4)),chunk.length-4);
 return chunk;
}
export function paletteFromJASC(source){
 const lines=String(source).trim().split(/\r?\n/).map(x=>x.trim());
 if(lines[0]!=='JASC-PAL'||lines[1]!=='0100')throw Error('Unrecognized FRLG item palette');
 const colors=Number(lines[2]);
 if(!Number.isInteger(colors)||colors<2||colors>256)throw Error('Invalid GBA palette size');
 const bytes=Buffer.alloc(colors*3);
 for(let i=0;i<colors;i++){
  const channels=lines[3+i]?.split(/\s+/).map(Number);
  if(channels?.length!==3||channels.some(x=>!Number.isInteger(x)||x<0||x>255))
   throw Error('Invalid original FRLG RGB palette');
  for(let c=0;c<3;c++)bytes[i*3+c]=channels[c];
 }
 return bytes;
}
export function gbaItemPNGForWeb(input,palette=null){
 const png=Buffer.from(input);
 if(png.length<57||!png.subarray(0,8).equals(SIGNATURE))
  throw Error('Invalid FireRed item icon PNG');
 const chunks=[];let pos=8,colorType=null,paletteLen=0,hasAlpha=false,ended=false;
 while(pos+12<=png.length){
  const size=png.readUInt32BE(pos),next=pos+size+12;
  if(size>65536||next>png.length)throw Error('Invalid FRLG PNG chunk bounds');
  const type=png.toString('ascii',pos+4,pos+8);
  const data=png.subarray(pos+8,pos+8+size);
  if(type==='IHDR'){
   if(png.readUInt32BE(pos+8)>64||png.readUInt32BE(pos+12)>64||
      !png.readUInt32BE(pos+8)||!png.readUInt32BE(pos+12))
    throw Error('Unexpected FRLG item dimensions');
   colorType=png[pos+17];
  }
  if(type==='PLTE')paletteLen=size;
  if(type==='tRNS')hasAlpha=true;
  chunks.push({type,data,original:png.subarray(pos,next)});
  if(type==='IEND'){ended=true;break}
  pos=next;
 }
 if(!ended||colorType!==3||paletteLen<6||paletteLen%3)
  throw Error('Expected indexed FireRed palette PNG');
 if(palette&&(!Buffer.isBuffer(palette)||palette.length<paletteLen))
  throw Error('Original item palette does not match PNG indices');
 const output=[SIGNATURE];let hasPalette=false;
 for(const chunk of chunks){
  if(chunk.type==='PLTE'){
   const rgb=palette?palette.subarray(0,paletteLen):chunk.data;
   output.push(palette?pngChunk('PLTE',rgb):chunk.original);
   hasPalette=true;
   if(!hasAlpha){
    const alpha=Buffer.alloc(paletteLen/3,255);
    alpha[0]=0;
    output.push(pngChunk('tRNS',alpha));
   }
  }else output.push(chunk.original);
 }
 if(!hasPalette)throw Error('Missing FireRed indexed palette');
 return Buffer.concat(output);
}
async function download(part,name){
 const url=FRLG_MART_ORIGIN+part+'/'+name;
 let lastError;
 for(let i=0;i<2;i++){
  try{
   const response=await fetch(url,{signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error(response.status+' '+name);
   return Buffer.from(await response.arrayBuffer());
  }catch(e){lastError=e}
 }
 throw Error('Unavailable pinned FireRed item art: '+name+' ('+lastError+')');
}
export async function installFRLGMartItems(dest){
 const dir=path.join(dest,'assets/ui/frlg/items');
 await mkdir(dir,{recursive:true});
 const [icons,palettes]=await Promise.all([
  Promise.all(FRLG_MART_ICONS.map(async name=>
   [name,await download('icons',name+'.png')])),
  Promise.all(FRLG_MART_PALETTES.map(async name=>
   [name,paletteFromJASC((await download('icon_palettes',name+'.pal')).toString('utf8'))]))
 ]);
 const originals=new Map(icons),colors=new Map(palettes),digest=createHash('sha256');
 for(const [id,entry]of Object.entries(FRLG_MART_ITEMS)){
  const png=gbaItemPNGForWeb(originals.get(entry.image),colors.get(entry.palette));
  await writeFile(path.join(dir,id+'.png'),png);
  digest.update(id);digest.update(png);
 }
 return{count:Object.keys(FRLG_MART_ITEMS).length,source:'pret/pokefirered',
  commit:FRLG_ICON_COMMIT,sha256:digest.digest('hex')};
}
