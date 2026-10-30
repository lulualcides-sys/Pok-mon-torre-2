import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {writeDiagnostics} from '../tools/dev/ci-diagnostics.mjs';

test('failed browser captures summary, SHA, images and JSON',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pt2-report-'));
 try{
  const ev=path.join(root,'test-evidence');await mkdir(path.join(ev,'visual-guard'),{recursive:true});
  await writeFile(path.join(ev,'visual-guard','browser-result.json'),JSON.stringify({ok:false,scene:'campanha',error:'Phaser scene did not start'}));
  await writeFile(path.join(ev,'visual-guard','campaign-failure.png'),Buffer.from([137,80,78,71]));
  const report=await writeDiagnostics({root,commit:'abcdef12',runId:'1337',status:'failure',stage:'pages-predeploy'});
  assert.equal(report.ok,false);assert.equal(report.evidence.some(x=>x.endsWith('campaign-failure.png')),true);
  const md=await readFile(path.join(ev,'visual-guard','diagnostic.md'),'utf8');
  assert.match(md,/Phaser scene did not start/);assert.match(md,/abcdef12/);assert.match(md,/campaign-failure.png/);
  const json=JSON.parse(await readFile(path.join(ev,'visual-guard','diagnostic.json'),'utf8'));
  assert.equal(json.stage,'pages-predeploy');
 }finally{await rm(root,{recursive:true,force:true})}
});
test('diagnostics avoid serializing arbitrary save fields and cap large errors',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'pt2-report-'));
 try{
  const ev=path.join(root,'test-evidence');await mkdir(path.join(ev,'visual-guard'),{recursive:true});
  await writeFile(path.join(ev,'visual-guard','browser-result.json'),JSON.stringify({ok:false,error:'BAD'+('x'.repeat(12000)),playerSave:'SECRET-SAVE'}));
  const report=await writeDiagnostics({root,status:'failure'});
  const md=await readFile(path.join(ev,'visual-guard','diagnostic.md'),'utf8');
  assert.ok(md.length<8000);assert.equal(md.includes('SECRET-SAVE'),false);assert.equal(report.ok,false);
 }finally{await rm(root,{recursive:true,force:true})}
});
