import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {deflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {installGymBackgrounds} from '../tools/pokearena/install-gym-backgrounds.mjs';

const SIGNATURE=Buffer.from('89504e470d0a1a0a','hex');
const CRC=Uint32Array.from({length:256},(_,i)=>{
 let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;
 return c>>>0;
});
function crc32(data){
 let c=0xffffffff;
 for(const b of data)c=CRC[(c^b)&255]^(c>>>8);
 return (c^0xffffffff)>>>0;
}
function chunk(name,data){
 const typed=Buffer.concat([Buffer.from(name),data]);
 const prefix=Buffer.alloc(4),tail=Buffer.alloc(4);
 prefix.writeUInt32BE(data.length);
 tail.writeUInt32BE(crc32(typed));
 return Buffer.concat([prefix,typed,tail]);
}
function png(w=640,h=360){
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);
 ihdr[8]=8;ihdr[9]=6;
 const row=Buffer.alloc((w*4+1)*h);
 return Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),
  chunk('IDAT',deflateSync(row,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
async function sandbox(t){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-gym-bg-'));
 t.after(()=>fs.rm(root,{recursive:true,force:true}));
 const source=path.join(root,'source'),dest=path.join(root,'preview');
 await fs.mkdir(source,{recursive:true});
 return {source,dest};
}
test('T38 empty asset directory produces valid empty manifest; no invalid fetches',async t=>{
 const {source,dest}=await sandbox(t);
 const manifest=await installGymBackgrounds(dest,{source});
 assert.deepEqual(manifest,{version:1,scenes:[]});
 const file=path.join(dest,'assets/ui/gym-interiors/manifest.json');
 assert.deepEqual(JSON.parse(await fs.readFile(file,'utf8')),manifest);
});

test('T38 valid source PNG is copied bit-exactly, with correct SHA and original aspect',async t=>{
 const {source,dest}=await sandbox(t);
 const original=png(1280,720);
 await fs.writeFile(path.join(source,'misty-interior.png'),original);
 const manifest=await installGymBackgrounds(dest,{source});
 assert.equal(manifest.scenes.length,1);
 const scene=manifest.scenes[0];
 assert.equal(scene.slug,'misty');assert.equal(scene.stage,1);
 assert.equal(scene.width,1280);assert.equal(scene.height,720);
 assert.equal(scene.path,'assets/ui/gym-interiors/misty-interior.png');
 assert.equal(scene.sha256,createHash('sha256').update(original).digest('hex'));
 const built=await fs.readFile(path.join(dest,scene.path));
 assert.deepEqual(built,original);
});

test('T38 malformed, mismatched or corrupted PNG fails build instead of drawing',async t=>{
 const {source,dest}=await sandbox(t),file=path.join(source,'brock-interior.png');
 for(const bad of [Buffer.from('not an image'),png(1024,768),
  png(640,360).subarray(0,65)]){
  await fs.writeFile(file,bad);
  await assert.rejects(installGymBackgrounds(dest,{source}),/PNG|1280x720|640x360/);
 }
 const tampered=png(640,360);tampered[40]^=1;
 await fs.writeFile(file,tampered);
 await assert.rejects(installGymBackgrounds(dest,{source}),/CRC/);
});

test('T38 file list is fixed to canonical Kanto gyms, never all routes/cities',async t=>{
 const {source,dest}=await sandbox(t);
 await fs.writeFile(path.join(source,'nonexistent-interior.png'),png());
 const manifest=await installGymBackgrounds(dest,{source});
 assert.equal(manifest.scenes.length,0);
 await fs.writeFile(path.join(source,'giovanni-interior.png'),png());
 const next=await installGymBackgrounds(dest,{source});
 assert.deepEqual(next.scenes.map(v=>[v.stage,v.slug]),[[7,'giovanni']]);
});
