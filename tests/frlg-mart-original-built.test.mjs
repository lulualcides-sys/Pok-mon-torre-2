import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {FRLG_MART_ITEMS} from '../tools/pokearena/install-frlg-mart-item-icons.mjs';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d','assets/ui/frlg/items');
function chunks(buf){
 assert.equal(buf.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const out=[];let offset=8;
 while(offset+12<=buf.length){
  const len=buf.readUInt32BE(offset),type=buf.toString('ascii',offset+4,offset+8);
  assert.ok(len<65536&&offset+len+12<=buf.length,'malformed original GBA PNG');
  out.push({type,data:buf.subarray(offset+8,offset+8+len)});
  offset+=12+len;if(type==='IEND')break;
 }
 return out;
}
test('built offline game includes all exact FireRed original item icons with GBA alpha',()=>{
 for(const [id]of Object.entries(FRLG_MART_ITEMS)){
  const file=path.join(root,id+'.png');
  assert.ok(existsSync(file),id+' original sprite missing from deploy');
  const cs=chunks(readFileSync(file));
  const ihdr=cs.find(c=>c.type==='IHDR')?.data;
  assert.equal(ihdr?.[9],3,id+' sprite must preserve original indexed art');
  assert.ok(cs.some(c=>c.type==='PLTE')&&cs.some(c=>c.type==='tRNS'),
   id+' must preserve original palette and transparent background');
  assert.equal(cs.find(c=>c.type==='tRNS').data[0],0,'GBA background index transparent');
 }
});
test('built originals use different genuine FireRed palettes for status medicines and TM types',()=>{
 const palette=id=>chunks(readFileSync(path.join(root,id+'.png')))
  .find(c=>c.type==='PLTE').data.toString('hex');
 assert.notEqual(palette('paralyzeheal'),palette('burnheal'));
 assert.notEqual(palette('awakening'),palette('iceheal'));
 assert.notEqual(palette('tm-rock-tomb'),palette('tm-thunderbolt'));
 assert.notEqual(palette('tm-water-pulse'),palette('tm-fire-blast'));
});
