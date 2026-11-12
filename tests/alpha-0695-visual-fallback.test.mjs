import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {stageApprovedVisualFallbacks} from '../tools/pokearena/stage-approved-visual-fallbacks.mjs';

const px=(w,h)=>{const b=Buffer.alloc(128,0);Buffer.from('89504e470d0a1a','hex').copy(b,0);
 b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b};
const meta=(dex,anim,fw,fh,count=2)=>({file:dex+'/'+anim+'-Anim.png',
 fw,fh,durations:Array(count).fill(2),hitFrame:-1,returnFrame:-1});
async function fixture(fn){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'site-capture-0695-'));
 const candidate=path.join(root,'site-capture/candidate'),approved=path.join(root,'legacy');
 const put=async(dir,rel,contents)=>{const target=path.join(dir,rel);
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,contents)};
 const old={
 '0007':{anims:{Idle:meta('0007','Idle',32,32)}},
 '0146':{anims:{Idle:meta('0146','Idle',80,96),
  Attack:meta('0146','Attack',104,136),
  Shoot:meta('0146','Shoot',96,96)}}
 };
 const current={
 '0007-squad':{anims:{Idle:meta('0007-squad','Idle',32,32)}},
 '0146':{anims:{Idle:meta('0146','Idle',80,96),
  Attack:meta('0146','Attack',104,136),
  Shoot:meta('0146','Shoot',96,96),
  Strike:meta('0146','Strike',104,104),
  Double:meta('0146','Double',96,120)}}
 };
 try{
 await put(candidate,'version.json',JSON.stringify({src:'src-0123456789',modules:'src-0123456789',officialAlpha:'0.69.5'}));
 await put(candidate,'src-0123456789/config.js','const VERSION="0.69.5";');
 await put(candidate,'index.html','<script id="paq" type="application/json">'+JSON.stringify({
  comun:'0'.repeat(20),formas:Object.fromEntries(Object.keys(current).map((dex,i)=>[dex,String(i+1).padStart(20,'0')]))
 })+'</script>');
 await put(candidate,'assets/p/'+'0'.repeat(20)+'.bin',Buffer.alloc(64));
 await put(candidate,'assets/pmd/manifest.json',JSON.stringify(current));
 await put(approved,'arena2d/assets/pmd/manifest.json',JSON.stringify(old));
 for(const [dex,model] of Object.entries(old)){
  await put(approved,'arena2d/assets/pmd/'+dex+'/portrait.png',px(32,32));
  for(const info of Object.values(model.anims))
   await put(approved,'arena2d/assets/pmd/'+info.file,px(info.fw*2,info.fh));
 }
 return await fn({candidate,approved,put,current});
 }finally{await fs.rm(root,{force:true,recursive:true})}
}
const verify=async()=>({alpha:'0.65.8',prebuilt:true,modules:'src-oldsource'});
test('unavailable squad sprite uses real same-species approved pixels, no unknown artist art',()=>fixture(async({candidate,approved})=>{
 const r=await stageApprovedVisualFallbacks(candidate,approved,verify);
 assert.equal(r.beforeMissing,2);assert.equal(r.afterMissing,0);
 assert.ok(r.files.some(f=>f.dex==='0007-squad'&&f.source==='assets/pmd/0007/Idle-Anim.png'));
 assert.equal(r.officialAlpha,'0.69.5');
}));
test('Moltres uses exact 14/16-frame equivalent metadata and maintains original move timings',()=>fixture(async({candidate,approved,current})=>{
 const r=await stageApprovedVisualFallbacks(candidate,approved,verify);
 const after=JSON.parse(await fs.readFile(path.join(candidate,'assets/pmd/manifest.json'),'utf8'));
 assert.equal(after['0146'].anims.Strike.fh,136);
 assert.equal(after['0146'].anims.Double.fh,96);
 assert.deepEqual(after['0146'].anims.Strike.durations,current['0146'].anims.Strike.durations);
 assert.equal(r.remappedAnimations.length,2);
}));
test('previous approved source must be verified, no arbitrary replacement',()=>fixture(async({candidate,approved})=>{
 await assert.rejects(stageApprovedVisualFallbacks(candidate,approved,async()=>({alpha:'0.69.5',prebuilt:false})),
  /Approved fallback version/);
}));
test('current config mismatch blocks image staging',()=>fixture(async({candidate,approved,put})=>{
 await put(candidate,'src-0123456789/config.js','const VERSION="0.65.8";');
 await assert.rejects(stageApprovedVisualFallbacks(candidate,approved,verify),/not the official Alpha 0.69.5/);
}));
test('if approved source is missing a required genuine animation, fail rather than fabricate',()=>fixture(async({candidate,approved})=>{
 await fs.rm(path.join(approved,'arena2d/assets/pmd/0146/Attack-Anim.png'));
 await assert.rejects(stageApprovedVisualFallbacks(candidate,approved,verify),/ENOENT/);
}));
