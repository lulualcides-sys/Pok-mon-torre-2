import fs from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
import {premiumPixels,PREMIUM_PALETTE} from '../pokearena/torre2-premium-art.js';
const names=['tree','planter','bench','terminal'],w=128,h=32;
const raw=Buffer.alloc(h*(w*4+1));
for(const [i,kind]of names.entries())premiumPixels(kind).forEach((row,y)=>row.forEach((c,x)=>{
 if(!c)return;const off=y*(w*4+1)+1+(i*32+x)*4,col=PREMIUM_PALETTE[c];
 raw[off]=col>>16;raw[off+1]=col>>8&255;raw[off+2]=col&255;raw[off+3]=255;
}));
function chunk(type,data){const t=Buffer.from(type),n=Buffer.alloc(4),sum=Buffer.alloc(4);n.writeUInt32BE(data.length);let c=0xffffffff;for(const b of Buffer.concat([t,data])){c^=b;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1}sum.writeUInt32BE((c^0xffffffff)>>>0);return Buffer.concat([n,t,data,sum])}
const header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;
const dir='reference-assets/premium-campaign';await fs.mkdir(dir,{recursive:true});
await fs.writeFile(dir+'/motifs.png',Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]));
await fs.writeFile(dir+'/motifs.tsj',JSON.stringify({type:'tileset',version:'1.10',tiledversion:'1.11.2',name:'premium-external',tilewidth:32,tileheight:32,tilecount:4,columns:4,image:'motifs.png',imagewidth:w,imageheight:h,tiles:names.map((name,id)=>({id,type:name,properties:[{name:'combat',type:'bool',value:false}]}))},null,2));
console.log('Exported 128x32 RGBA atlas: '+names.join(', '));
