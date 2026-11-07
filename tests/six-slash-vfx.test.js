import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {SIX_SLASH_IDS,SLASH_FRAMES,SLASH_FRAME_SIZE,SLASH_FPS} from '../tools/pokearena/torre2-six-slash-vfx.js';
const base='reference-assets/vfx/six-slashes/';
const manifest=JSON.parse(readFileSync(base+'manifest.json','utf8'));
test('six independent visually-unapproved 12-frame source sheets',()=>{
 assert.equal(SIX_SLASH_IDS.length,6);
 assert.equal(new Set(SIX_SLASH_IDS).size,6);
 assert.equal(SLASH_FRAMES,12);assert.equal(SLASH_FRAME_SIZE,96);assert.equal(SLASH_FPS,24);
 assert.equal(manifest.status,'pending_visual_review');assert.equal(manifest.approved,false);
 assert.equal(manifest.mode,'visual-only');assert.equal(manifest.noNativeOrApprovedEffectOverrides,true);
 assert.deepEqual(manifest.sprites.map(s=>s.id),SIX_SLASH_IDS);
 const sigs=new Set();
 for(const id of SIX_SLASH_IDS){
  const file=readFileSync(base+id+'.png');
  assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(file.readUInt32BE(16),96*12);assert.equal(file.readUInt32BE(20),96);
  assert.equal(file[24],8);assert.equal(file[25],3,'indexed color PNG required');
  const chunks=[];let p=8,transparent=false;
  while(p<file.length){
   const len=file.readUInt32BE(p),kind=file.toString('ascii',p+4,p+8);
   if(kind==='IDAT')chunks.push(file.subarray(p+8,p+8+len));
   if(kind==='tRNS'){transparent=true;assert.equal(file[p+8],0)}
   p+=12+len;
  }
  assert.ok(transparent,id+' missing transparent background');
  const raw=inflateSync(Buffer.concat(chunks));
  assert.equal(raw.length,96*(96*12+1));
  const pixels=[];
  for(let f=0;f<12;f++){
   let colored=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++)
    colored+=raw[y*(1153)+1+f*96+x]!==0;
   pixels.push(colored);
  }
  assert.ok(pixels.every(x=>x>=25),id+': blank animation frame '+pixels);
  assert.ok(new Set(pixels).size>=6,id+': static/stalled effect');
  assert.ok(file.length>5000,id+' unexpectedly empty file');
  const signature=file.toString('base64');assert.ok(!sigs.has(signature),id+' duplicate sheet');
  sigs.add(signature);
 }
});
test('adapter remains opt-in and never modifies native battle mechanics',()=>{
 const code=readFileSync('tools/pokearena/torre2-six-slash-vfx.js','utf8');
 assert.match(code,/preloadSixSlashVfx/);assert.match(code,/playSixSlashVfx/);
 assert.match(code,/setFilter/);
 assert.doesNotMatch(code,/recibir\(|\.hp\s*=|\.dano\s*=|\.estatus\s*=|Math\.random\(/);
 assert.ok(!code.includes('getContext('));
 const lab=readFileSync('slash-lab.html','utf8');
 for(const id of SIX_SLASH_IDS)assert.ok(lab.includes(id));
});
