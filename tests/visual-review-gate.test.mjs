import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {inspectPng,validateManifest,reviewScreenshots} from '../tools/dev/visual-review-gate.mjs';

// Minimal PNG IHDR metadata fixture; the comparator is intentionally stubbed.
// The Chromium decoding path is exercised when real approved baselines exist.
const png=()=>{
 const b=Buffer.alloc(24);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(b,0);
 b.write('IHDR',12,'ascii');b.writeUInt32BE(640,16);b.writeUInt32BE(360,20);
 return b;
};
const fixture=async()=>{
 const root=await mkdtemp(join(tmpdir(),'pt2-visual-review-'));
 const p=join(root,'art','cinnabar.png');
 await mkdir(join(root,'art'),{recursive:true});
 await writeFile(p,png());
 const doc={schemaVersion:1,requiredScenes:[{
  id:'cinnabar',screenshot:'art/cinnabar.png',approval:'pending',
  approvedBaseline:null,maxDifferentPixelRatio:0.02,reviewedBy:null,reviewedAt:null
 }]};
 return {root,doc};
};
test('PNG dimensions are read without approving arbitrary image files',()=>{
 assert.deepEqual(inspectPng(png()),{width:640,height:360,bytes:24});
 assert.throws(()=>inspectPng(Buffer.from('not PNG')),/PNG signature/);
});
test('review manifest rejects duplicate scenes and unbounded comparison tolerances',()=>{
 const scene={id:'cinnabar',screenshot:'cinnabar.png',approval:'pending',maxDifferentPixelRatio:0.02};
 assert.deepEqual(validateManifest({schemaVersion:1,requiredScenes:[scene]}),[]);
 assert.ok(validateManifest({schemaVersion:1,requiredScenes:[scene,scene]}).some(x=>x.includes('duplicate')));
 assert.ok(validateManifest({schemaVersion:1,requiredScenes:[{...scene,maxDifferentPixelRatio:0.8}]}).length);
});
test('captured screenshot is evidence only, never implicit visual approval',async()=>{
 const {root,doc}=await fixture();
 try{
  const evidence=await reviewScreenshots(doc,root,{mode:'evidence'});
  assert.equal(evidence.ok,true);
  assert.equal(evidence.status,'pending_visual_review');
  assert.equal(evidence.approved,false);
  const release=await reviewScreenshots(doc,root,{mode:'release'});
  assert.equal(release.ok,false);
  assert.equal(release.status,'pending_visual_review');
 }finally{await rm(root,{recursive:true,force:true})}
});
test('signed baseline is mandatory and even approved art can regress',async()=>{
 const {root,doc}=await fixture();
 try{
  doc.requiredScenes[0].approval='approved';
  assert.equal((await reviewScreenshots(doc,root,{mode:'release'})).ok,false);
  const base=png(),path=join(root,'art','baseline.png');
  await writeFile(path,base);
  Object.assign(doc.requiredScenes[0],{
   approvedBaseline:'art/baseline.png',
   baselineSha256:createHash('sha256').update(base).digest('hex'),
   reviewedBy:'human-reviewer',reviewedAt:'2026-11-04'
  });
  assert.equal((await reviewScreenshots(doc,root,{mode:'release',
   compare:async()=>({ratio:0.03})})).ok,false);
  const approved=await reviewScreenshots(doc,root,{mode:'release',
   compare:async()=>({ratio:0.001})});
  assert.equal(approved.ok,true);
  assert.equal(approved.status,'approved');
  doc.requiredScenes[0].approvedBaseline='../outside.png';
  assert.equal((await reviewScreenshots(doc,root,{mode:'release'})).ok,false);
 }finally{await rm(root,{recursive:true,force:true})}
});
