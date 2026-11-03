import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {APPROVED_MAPS_ATLAS} from '../tools/pokearena/torre2-approved-maps-atlas.js';

const manifest=JSON.parse(readFileSync('assets/ui/kanto-approved-maps/approved-maps-atlas.json','utf8'));
const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');

function webpDimensions(b){
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.equal(b.readUInt32LE(4)+8,b.length,'RIFF byte length');
 const format=b.toString('ascii',12,16);
 if(format==='VP8 '){
  assert.equal(b.toString('hex',23,26),'9d012a');
  return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];
 }
 if(format==='VP8L'){
  assert.equal(b[20],0x2f);
  const bits=b.readUInt32LE(21);
  return [(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1];
 }
 if(format==='VP8X')return [b.readUIntLE(24,3)+1,b.readUIntLE(27,3)+1];
 throw Error('Unsupported WebP frame: '+format);
}

test('T46 exact sixty approved map blobs exist, match manifest SHA-256 and 1280x720',()=>{
 assert.equal(manifest.maps.length,60);
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(new Set(manifest.maps.map(m=>m.id)).size,60);
 const byId=new Map(manifest.maps.map(m=>[m.id,m]));
 for(const scene of APPROVED_MAPS_ATLAS.maps){
  const approved=byId.get(scene.id);
  assert.ok(approved,scene.id);
  assert.equal(approved.image,scene.image);
  assert.equal(approved.approved,true);
  const data=readFileSync(scene.image);
  assert.equal(data.length,approved.bytes,scene.id);
  assert.deepEqual(webpDimensions(data),[1280,720],scene.id);
  assert.equal(sha256(data),approved.optimized_sha256,scene.id);
 }
});

test('T46 altered WebP cannot match approved SHA-256',()=>{
 const m=manifest.maps.find(x=>x.id==='cerulean-city');
 assert.ok(m);
 const original=readFileSync(m.image);
 const tampered=Buffer.from(original);
 tampered[tampered.length-1]^=1;
 assert.notEqual(sha256(tampered),m.optimized_sha256);
});

test('T46 build refuses unapproved map bytes before copying into native Phaser',()=>{
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.ok(build.includes("approved-maps-atlas.json"));
 assert.ok(build.includes("createHash('sha256').update(pixels).digest('hex')"));
 assert.ok(build.includes("Approved map SHA-256 mismatch"));
 assert.ok(build.includes("Approved map is not 1280x720"));
});
