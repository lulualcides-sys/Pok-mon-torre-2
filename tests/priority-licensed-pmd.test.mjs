import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {stagePriorityLicensedPMD,PRIORITY_FORMS,candidates} from '../tools/pokearena/priority-licensed-pmd.mjs';
import {auditNativePacks} from '../tools/pokearena/audit-native-packs.mjs';
const common='a'.repeat(20), ditto='b'.repeat(20);
const makePng=(w=64,h=32)=>{
 const b=Buffer.alloc(180,0);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(b);
 b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return b;
};
async function fixture(run){
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'torre-priority-'));
 const root=path.join(temp,'site-capture','pokearena-client');
 const cache=path.join(temp,'site-capture','native-pack-cache');
 await fs.mkdir(path.join(root,'assets','p'),{recursive:true});
 await fs.mkdir(path.join(root,'assets','pmd'),{recursive:true});
 await fs.writeFile(path.join(root,'version.json'),JSON.stringify({
  officialAlpha:'0.71.3',src:'src-5ccc174cb8'
 }));
 await fs.writeFile(path.join(root,'index.html'),
  '<script id="paq">'+JSON.stringify({comun:common,formas:{'0132':ditto}})+'</script>');
 await fs.writeFile(path.join(root,'assets/p',common+'.bin'),Buffer.alloc(100,1));
 await fs.writeFile(path.join(root,'assets/pmd/manifest.json'),JSON.stringify({
  '0132':{anims:{
   Idle:{file:'0132/Idle-Anim.png',fw:32,fh:32,durations:[1,1]},
   Attack:{file:'0132/Attack-Anim.png',fw:32,fh:32,durations:[1,1]}
  }}
 }));
 try {return await run({root,cache})}
 finally{await fs.rm(temp,{recursive:true,force:true})}
}
function mock(ok=true){
 const urls=[];
 const fetcher=async url=>{
  urls.push(url);
  if(!ok&&url.includes('Idle-Anim'))return new Response('Not found',{status:404});
  return new Response(makePng(),{status:200,headers:{'content-type':'image/png'}});
 };
 return {urls,fetcher};
}
test('11 priority IDs are exact and separate from 19 older costume forms',()=>{
 assert.equal(PRIORITY_FORMS.length,11);
 assert.equal(new Set(PRIORITY_FORMS).size,11);
 assert.ok(PRIORITY_FORMS.includes('0132')&&PRIORITY_FORMS.includes('0133'));
 assert.ok(!PRIORITY_FORMS.includes('0007-squad'));
 assert.throws(()=>candidates('0132','../secrets'),/Unsafe/);
});
test('one species is atomically installed with SHA256, license and audit provenance',()=>
 fixture(async({root,cache})=>{
  const {fetcher,urls}=mock();
  const report=await stagePriorityLicensedPMD(root,cache,fetcher);
  assert.equal(report.completed.length,1);
  assert.equal(report.licensed.length,1);
  assert.equal(report.licensed[0].files.length,3);
  assert.equal(report.noncommercialOnly,true);
  assert.equal(report.redistributionCleared,false);
  assert.equal(report.license,'MIXED_OR_UNVERIFIED');
  assert.equal(urls.length,3);
  const audited=await auditNativePacks(root);
  assert.equal(audited.missingFormCount,0);
  assert.equal(audited.verifiedSubstitutes,1);
  assert.equal(audited.sourceAuthentic,false);
  assert.deepEqual(audited.pendingRightsForms,['0132']);
  assert.equal(audited.redistributionCleared,false);
  const b=await fs.readFile(path.join(root,'assets/pmd/0132/Idle-Anim.png'));
  assert.equal(b.readUInt32BE(16),64);
 }));
test('missing licensed animation does not create partially visible Pokemon',()=>
 fixture(async({root,cache})=>{
  const r=await stagePriorityLicensedPMD(root,cache,mock(false).fetcher);
  assert.equal(r.completed.length,0);
  assert.equal(r.pending.find(x=>x.dex==='0132')?.reason?.includes('unavailable'),true);
  await assert.rejects(fs.access(path.join(root,'assets/pmd/0132/portrait.png')),/ENOENT/);
  await assert.rejects(fs.access(path.join(root,'assets/pmd/0132/Attack-Anim.png')),/ENOENT/);
  assert.equal((await auditNativePacks(root)).missingFormCount,1);
 }));
test('same-source cache restores verified species without network requests',()=>
 fixture(async({root,cache})=>{
  await stagePriorityLicensedPMD(root,cache,mock().fetcher);
  for(const p of ['portrait.png','Idle-Anim.png','Attack-Anim.png'])
   await fs.unlink(path.join(root,'assets/pmd/0132',p));
  const r=await stagePriorityLicensedPMD(root,cache,async()=>{
   throw Error('unnecessary network request');
  });
  assert.equal(r.restored.length,1);
  assert.equal((await auditNativePacks(root)).verifiedSubstitutes,1);
 }));
test('corrupt cached sprites are rejected, not silently repaired',()=>
 fixture(async({root,cache})=>{
  await stagePriorityLicensedPMD(root,cache,mock().fetcher);
  for(const p of ['portrait.png','Idle-Anim.png','Attack-Anim.png'])
   await fs.unlink(path.join(root,'assets/pmd/0132',p));
  await fs.writeFile(path.join(cache,'priority-pmd/0132/Idle-Anim.png'),Buffer.alloc(180,1));
  const r=await stagePriorityLicensedPMD(root,cache,async()=>{
   throw Error('cache error must not cause bypass');
  });
  assert.equal(r.restored.length,0);
  assert.match(r.pending.find(x=>x.dex==='0132').reason,/cache-validation/);
  assert.equal((await auditNativePacks(root)).missingFormCount,1);
 }));
test('a new client revision cannot silently reuse stale licensed artwork',()=>
 fixture(async({root,cache})=>{
  await fs.writeFile(path.join(root,'version.json'),JSON.stringify({
   officialAlpha:'0.71.4',src:'src-aaaaaaaaaa'
  }));
  await assert.rejects(stagePriorityLicensedPMD(root,cache,mock().fetcher),
   /requires verified Alpha 0.71.3/);
 }));
