import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
// Original indexed GBA sheet: palette index zero is transparent in-game.
// Add PNG metadata only; all palette and compressed pixel bytes are preserved.
export function badgeSheetForWeb(source){
 if(createHash('sha256').update(source).digest('hex')!=='213fcf06d1125b42df17c9de249fa8cd76a428da2b38582a04c9b1f52b2130c1')throw new Error('Unrecognized FRLG badge sheet');
 let end=8;
 while(end<source.length){const n=source.readUInt32BE(end),type=source.toString('ascii',end+4,end+8);end+=n+12;if(type==='PLTE')break;}
 const chunk=Buffer.alloc(13);chunk.writeUInt32BE(1);chunk.write('tRNS',4);chunk[8]=0;
 let crc=0xffffffff;for(const b of chunk.subarray(4,9)){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}chunk.writeUInt32BE((crc^0xffffffff)>>>0,9);
 return Buffer.concat([source.subarray(0,end),chunk,source.subarray(end)]);
}
export async function installBadgeSprites(dest){
 const source=await readFile(new URL('../../reference-assets/kanto/ui/badges/frlg-badges.png',import.meta.url));
 const dir=path.join(dest,'assets/ui/frlg');await mkdir(dir,{recursive:true});await writeFile(path.join(dir,'badges.png'),badgeSheetForWeb(source));
}
