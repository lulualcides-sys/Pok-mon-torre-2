import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inflateSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {generateJohtoPilotSheets} from '../tools/pokearena/torre2-pixel-sheets.mjs';
function frames(png){
 assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 const w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 assert.equal(w,768);assert.equal(h,64);
 let pos=8;const packs=[];
 while(pos<png.length){
  const n=png.readUInt32BE(pos),type=png.toString('ascii',pos+4,pos+8);
  if(type==='IDAT')packs.push(png.subarray(pos+8,pos+8+n));
  pos+=n+12;
 }
 const raw=inflateSync(Buffer.concat(packs));
 assert.equal(raw.length,(w*4+1)*h);
 const checks=[];
 for(let frame=0;frame<12;frame++){
  const pixels=Buffer.alloc(64*64*4);let opaque=0;
  for(let y=0;y<64;y++){
   assert.equal(raw[y*(w*4+1)],0,'Expected PNG filter 0 for editable exact pixels');
   const chunk=raw.subarray(y*(w*4+1)+1+frame*64*4,
    y*(w*4+1)+1+(frame+1)*64*4);
   chunk.copy(pixels,y*64*4);
   for(let x=0;x<64;x++)if(chunk[x*4+3])opaque++;
  }
  assert.ok(opaque>=15,'Frame '+frame+' is blank or trivial');
  checks.push(createHash('sha256').update(pixels).digest('hex'));
 }
 assert.ok(new Set(checks).size>=8,'Frames must genuinely animate, not reuse one image');
}
test('all three pilots export animated transparent PNG sheets',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'pt2-pixel-test-'));
 try{
  const list=await generateJohtoPilotSheets(dir);
  assert.deepEqual(list.map(x=>x.id),['zap-cannon','powder-snow','whirlpool']);
  const signatures=new Set();
  for(const entry of list){
   frames(await readFile(entry.file));signatures.add((await readFile(entry.file)).toString('base64'));
  }
  assert.equal(signatures.size,3,'Each move needs its own original pixel vocabulary');
  const manifest=JSON.parse(await readFile(join(dir,'manifest.json'),'utf8'));
  assert.equal(manifest.approved,false,'No automatic aesthetic approval');
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('pilot sheets load in isolated Mewtwo scene, not regular Arena or campaign',async()=>{
 const scene=await readFile('tools/pokearena/torre2-johto-lab-scene.js','utf8');
 const runtime=await readFile('tools/pokearena/torre2-johto-lab-runtime.js','utf8');
 const build=await readFile('tools/pokearena/build-preview.mjs','utf8');
 assert.ok(scene.includes("this.load.spritesheet('torre2-johto-pilot-'"));
 assert.ok(runtime.includes("e.textures.exists(pilotKey)"));
 assert.ok(runtime.includes('pilotSprite?.destroy()'));
 assert.ok(build.includes("generateJohtoPilotSheets(path.join(dest,'assets/torre2/johto-pilot'))"));
});
