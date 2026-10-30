/* Install non-destructive, native-pattern league icon fallbacks.
 * The current original Phaser client requests eight assets/ui/ligas/*.png
 * images at boot but no longer ships those files. Draw the seven badges from
 * that SAME client's ICONOS patterns; for Retos use its native CAMPEON pattern.
 * Never replace an original PNG, approved sprite, or its existing renderer.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {deflateSync} from 'node:zlib';

const NAMES=['l1','l2','l3','l4','l5','l6','l7','retos'];
const SIZE=56;
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function readPalette(raw){
 const colors={};
 for(const m of raw.matchAll(/(?:"([^"]+)"|([a-z])):"(#[0-9a-fA-F]{6})"/g))
  colors[m[1]||m[2]]=m[3];
 if(!Object.keys(colors).length)throw Error('No original league icon palette');
 return colors;
}
function readPattern(rowsRaw,paletteRaw){
 const rows=JSON.parse(rowsRaw),colors=readPalette(paletteRaw);
 if(rows.length!==8||rows.some(row=>typeof row!=='string'||row.length!==8))
  throw Error('Unrecognized native 8x8 league icon pattern');
 for(const row of rows)for(const ch of row)
  if(ch!=='.'&&!colors[ch])throw Error('Missing native icon color '+ch);
 return {rows,colors};
}
export function nativeLeagueIconPatterns(source){
 const found=source.match(/const ICONOS=\{([\s\S]*?)\};const CAMPEON=\{([\s\S]*?)\};const iconoLiga=/);
 if(!found)throw Error('Native league graphics changed; do not fabricate sprites');
 const icons={};
 const re=/(?:^|,)l([1-7]):\{p:(\[[^\]]+\]),c:(\{[^}]+\})\}/g;
 for(const match of found[1].matchAll(re))
  icons['l'+match[1]]=readPattern(match[2],match[3]);
 const champion=found[2].match(/p:(\[[^\]]+\]),c:(\{[^}]+\})/);
 if(!champion)throw Error('Native challenge/champion art missing');
 icons.retos=readPattern(champion[1],champion[2]);
 if(NAMES.some(name=>!icons[name])||Object.keys(icons).length!==8)
  throw Error('Not all seven native league icons and challenges were identified');
 return icons;
}
function crc32(buf){
 let c=0xffffffff;
 for(const b of buf){
  c^=b;
  for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);
 }
 return (c^0xffffffff)>>>0;
}
function chunk(type,data){
 const t=Buffer.from(type,'ascii'),size=Buffer.alloc(4),crc=Buffer.alloc(4);
 size.writeUInt32BE(data.length);
 crc.writeUInt32BE(crc32(Buffer.concat([t,data])));
 return Buffer.concat([size,t,data,crc]);
}
export function pngFromNativePattern({rows,colors}){
 const stride=SIZE*4,raw=Buffer.alloc((stride+1)*SIZE);
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){
  const ch=rows[Math.floor(y/7)][Math.floor(x/7)];
  if(ch==='.')continue;
  const color=colors[ch],offset=y*(stride+1)+1+x*4;
  for(let c=0;c<3;c++)raw[offset+c]=parseInt(color.slice(1+c*2,3+c*2),16);
  raw[offset+3]=255;
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(SIZE,0);ihdr.writeUInt32BE(SIZE,4);
 ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),
  chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
export async function installMissingNativeLeagueIcons(dest,clientSource){
 const dir=path.join(dest,'assets/ui/ligas');
 await fs.mkdir(dir,{recursive:true});
 const missing=[];
 for(const name of NAMES){
  try{
   const existing=await fs.readFile(path.join(dir,name+'.png'));
   if(!existing.subarray(0,8).equals(SIGNATURE))
    throw Error('Existing native league icon is not a PNG: '+name);
  }catch(error){
   if(error.code!=='ENOENT')throw error;
   missing.push(name);
  }
 }
 if(!missing.length)return {native:NAMES.length,recovered:0,names:[]};
 const source=await fs.readFile(path.join(dest,clientSource,'insignias.js'),'utf8');
 const icons=nativeLeagueIconPatterns(source);
 for(const name of missing)
  await fs.writeFile(path.join(dir,name+'.png'),pngFromNativePattern(icons[name]),{flag:'wx'});
 console.log('Recovered missing native-pattern league icons',missing.join(', '));
 return {native:NAMES.length-missing.length,recovered:missing.length,names:missing};
}
