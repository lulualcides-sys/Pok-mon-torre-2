import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {
 contextFor,writeProgressFolders,restoreCachedPacks,saveCachedPacks
} from '../tools/pokearena/native-progress-folders.mjs';

const sha=b=>createHash('sha256').update(b).digest('hex');
const ids={common:'a'.repeat(20),ditto:'b'.repeat(20),eevee:'c'.repeat(20)};
async function fixture(run){
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'torre2-native-progress-'));
 const space=path.join(tmp,'site-capture'),root=path.join(space,'pokearena-client');
 const cache=path.join(space,'native-pack-cache'),output=path.join(space,'native-progress');
 const packed=Buffer.alloc(100,42),common=Buffer.alloc(100,21);
 await fs.mkdir(path.join(root,'assets/p'),{recursive:true});
 await fs.mkdir(path.join(root,'assets/pmd'),{recursive:true});
 await fs.writeFile(path.join(root,'version.json'),
  JSON.stringify({officialAlpha:'0.71.3',src:'src-5ccc174cb8'}));
 await fs.writeFile(path.join(root,'index.html'),
  '<script id="paq">'+JSON.stringify({comun:ids.common,
   formas:{'0132':ids.ditto,'0133':ids.eevee}})+'</script>');
 await fs.writeFile(path.join(root,'assets/pmd/manifest.json'),
  JSON.stringify({'0132':{anims:{Idle:{file:'0132/Idle-Anim.png'}}},
   '0133':{anims:{Idle:{file:'0133/Idle-Anim.png'}}}}));
 await fs.writeFile(path.join(root,'assets/p',ids.common+'.bin'),common);
 await fs.writeFile(path.join(root,'assets/p',ids.ditto+'.bin'),packed);
 await fs.writeFile(path.join(space,'CAPTURE-REPORT.json'),JSON.stringify({
  retrieved:[
   {path:'assets/p/'+ids.common+'.bin',sha256:sha(common)},
   {path:'assets/p/'+ids.ditto+'.bin',sha256:sha(packed)}
  ]
 }));
 await fs.writeFile(path.join(root,'public-missing-packs-report.json'),JSON.stringify({
  denied:[{path:'assets/p/'+ids.eevee+'.bin',status:403}]
 }));
 try{return await run({tmp,root,cache,output,space,packed})}
 finally{await fs.rm(tmp,{recursive:true,force:true})}
}
test('separate SHA-indexed verified, pending and blocked folders without copying assets',()=>
 fixture(async({root,output})=>{
  const result=await writeProgressFolders(root,output);
  assert.equal(result.verified,1);
  assert.equal(result.pending,1);
  assert.equal(result.denied,1);
  assert.equal(result.complete,false);
  const verified=JSON.parse(await fs.readFile(
   path.join(result.directory,'verificados/formas.json'),'utf8'));
  const pending=JSON.parse(await fs.readFile(
   path.join(result.directory,'pendentes/formas.json'),'utf8'));
  const blocked=JSON.parse(await fs.readFile(
   path.join(result.directory,'bloqueados/http.json'),'utf8'));
  assert.equal(verified.forms[0].dex,'0132');
  assert.equal(verified.forms[0].provenance,'pinned-capture');
  assert.equal(pending.forms[0].dex,'0133');
  assert.equal(blocked.denied[0].status,403);
  assert.match(result.directory,/0\.71\.3\/src-5ccc174cb8\/[0-9a-f]{16}$/);
  const all=await fs.readdir(path.join(result.directory,'verificados'));
  assert.deepEqual(all,['formas.json'],'never copy third-party sprite blobs into report folders');
 }));
test('cache reuses SHA-verified public pack only for same Alpha and exact #paq',()=>
 fixture(async({root,cache,packed})=>{
  const key=await contextFor(root);
  assert.match(key.key,/0-71-3-src-5ccc174cb8-[0-9a-f]{16}/);
  const saved=await saveCachedPacks(root,cache);
  assert.equal(saved.saved,2,'native common + Ditto, not missing Eevee');
  const bin=path.join(root,'assets/p',ids.ditto+'.bin');
  await fs.unlink(bin);
  const restored=await restoreCachedPacks(root,cache);
  assert.equal(restored.restored,1);
  assert.deepEqual(await fs.readFile(bin),packed);
  await fs.unlink(bin);
  await fs.writeFile(path.join(root,'version.json'),
   JSON.stringify({officialAlpha:'0.71.4',src:'src-aaaa000001'}));
  const blocked=await restoreCachedPacks(root,cache);
  assert.equal(blocked.restored,0);
  await assert.rejects(fs.access(bin),/ENOENT/);
 }));
test('cache digest corruption blocks restore instead of hiding error',()=>
 fixture(async({root,cache})=>{
  await saveCachedPacks(root,cache);
  await fs.writeFile(path.join(cache,'assets/p',ids.ditto+'.bin'),Buffer.alloc(100,3));
  await fs.unlink(path.join(root,'assets/p',ids.ditto+'.bin'));
  await assert.rejects(restoreCachedPacks(root,cache),/SHA256 mismatch/);
  await assert.rejects(
   fs.access(path.join(root,'assets/p',ids.ditto+'.bin')),/ENOENT/);
 }));
test('the cache cannot be used as approval for a missing or unproved original',()=>
 fixture(async({root,cache})=>{
  await fs.unlink(path.join(path.dirname(root),'CAPTURE-REPORT.json'));
  const s=await saveCachedPacks(root,cache);
  assert.equal(s.saved,0,'no provenance, no binary cache');
  const r=await writeProgressFolders(root,path.join(path.dirname(root),'native-progress'));
  assert.equal(r.verified,1,'inventory is separate from release authorization');
  assert.equal(r.complete,false);
 }));
test('report and cache cannot target published _site or arbitrary folders',()=>
 fixture(async({root,tmp})=>{
  await assert.rejects(writeProgressFolders(root,path.join(tmp,'_site')),/quarantine/);
  await assert.rejects(saveCachedPacks(root,path.join(tmp,'outside')),/quarantine/);
 }));


test('cached denial is displayed in blocked folder without claiming coverage',()=>
 fixture(async({root,cache,output})=>{
  const first=await saveCachedPacks(root,cache);
  assert.equal(first.priorDenialsSaved,1);
  await fs.unlink(path.join(root,'public-missing-packs-report.json'));
  const restored=await restoreCachedPacks(root,cache);
  assert.equal(restored.previousDenied,1);
  const progress=await writeProgressFolders(root,output);
  const block=JSON.parse(await fs.readFile(
   path.join(progress.directory,'bloqueados/http.json'),'utf8'));
  assert.equal(block.denied.length,1);
  assert.equal(progress.pending,1);
 }));
