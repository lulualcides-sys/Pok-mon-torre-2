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


test('T38 rejects CRC-valid PNG files with invalid compressed pixel streams',async t=>{
 const {source,dest}=await sandbox(t),file=path.join(source,'brock-interior.png');
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(640,0);ihdr.writeUInt32BE(360,4);ihdr[8]=8;ihdr[9]=6;
 const wrap=compressed=>Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),
  chunk('IDAT',compressed),chunk('IEND',Buffer.alloc(0))]);
 const badDeflate=wrap(Buffer.from([0x78,0x9c,0,0,0]));
 const shortPixels=wrap(deflateSync(Buffer.alloc(16)));
 const invalidFilter=Buffer.alloc((640*4+1)*360);
 invalidFilter[0]=5;
 for(const bytes of [badDeflate,shortPixels,wrap(deflateSync(invalidFilter))]){
  await fs.writeFile(file,bytes);
  await assert.rejects(installGymBackgrounds(dest,{source}),/PNG|IDAT|pixels|filter/i);
 }
});

test('T38 preflights all eight images before writing any asset',async t=>{
 const {source,dest}=await sandbox(t);
 await fs.writeFile(path.join(source,'brock-interior.png'),png());
 await fs.writeFile(path.join(source,'misty-interior.png'),Buffer.from('bad'));
 await assert.rejects(installGymBackgrounds(dest,{source}),/PNG/);
 await assert.rejects(fs.access(path.join(dest,'assets/ui/gym-interiors/brock-interior.png')),
  {code:'ENOENT'},'a bad later gym must not leave an earlier copied asset');
});

test('T38 rebuild removes a withdrawn gym image rather than shipping stale art',async t=>{
 const {source,dest}=await sandbox(t);
 const original=path.join(source,'brock-interior.png');
 const built=path.join(dest,'assets/ui/gym-interiors/brock-interior.png');
 await fs.writeFile(original,png());
 assert.equal((await installGymBackgrounds(dest,{source})).scenes.length,1);
 await fs.access(built);
 await fs.unlink(original);
 assert.deepEqual((await installGymBackgrounds(dest,{source})).scenes,[]);
 await assert.rejects(fs.access(built),{code:'ENOENT'});
});

test('T38 rejects CRC-valid unknown critical chunks and misplaced PNG palettes',async t=>{
 const {source,dest}=await sandbox(t);
 const file=path.join(source,'brock-interior.png');
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(640,0);ihdr.writeUInt32BE(360,4);
 ihdr[8]=8;ihdr[9]=6;
 const idat=chunk('IDAT',deflateSync(Buffer.alloc((640*4+1)*360)));
 const palette=chunk('PLTE',Buffer.from([0,0,0]));
 const wrap=parts=>Buffer.concat([
  SIGNATURE,chunk('IHDR',ihdr),...parts,chunk('IEND',Buffer.alloc(0))
 ]);
 for(const invalid of [
  wrap([chunk('ABCD',Buffer.alloc(0)),idat]),
  wrap([idat,palette]),
  wrap([palette,palette,idat]),
  wrap([chunk('abca',Buffer.alloc(0)),idat])
 ]){
  await fs.writeFile(file,invalid);
  await assert.rejects(installGymBackgrounds(dest,{source}),
   /critical|palette|reserved/i);
  await assert.rejects(fs.access(path.join(dest,
   'assets/ui/gym-interiors/brock-interior.png')),{code:'ENOENT'});
 }
 // A normal optional ancillary text chunk remains compatible.
 await fs.writeFile(file,wrap([chunk('tEXt',Buffer.from([83,111,117,114,99,101,0,97,112,112,114,111,118,101,100])),idat]));
 assert.equal((await installGymBackgrounds(dest,{source})).scenes.length,1);
});
