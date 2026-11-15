import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {stageObservedPacks} from '../tools/pokearena/stage-verified-lazy-packs.mjs';

const hash=b=>createHash('sha256').update(b).digest('hex');
async function sample() {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'rea-lazy-integration-'));
  const parent=path.join(root,'site-capture');
  const capture=path.join(parent,'rea-lazy-pack-probe');
  const client=path.join(parent,'pokearena-client');
  const common='a'.repeat(20),first='b'.repeat(20),missing='c'.repeat(20);
  const bin='assets/p/'+first+'.bin', bytes=Buffer.alloc(180,19);
  await fs.mkdir(path.join(capture,'observed','assets/p'),{recursive:true});
  await fs.mkdir(client,{recursive:true});
  await fs.writeFile(path.join(capture,'observed',bin),bytes);
  await fs.writeFile(path.join(client,'version.json'),JSON.stringify({
    officialAlpha:'0.69.2',src:'src-96bf6dc2f4'
  }));
  await fs.writeFile(path.join(client,'index.html'),
    '<script src="src-96bf6dc2f4/main.js"></script>'+
    '<script id="paq">'+JSON.stringify({comun:common,
      formas:{'0001':first,'0092-amarillogengar':missing}})+'</script>');
  const report={
    status:'PUBLIC_UI_OBSERVED',version:'0.69.2',src:'src-96bf6dc2f4',
    errors:[],denied:[],observed:[{
      asset:bin,bytes:bytes.length,sha256:hash(bytes),
      provenance:'HTTP 200 emitted by public browser while using UI'
    }]
  };
  await fs.writeFile(path.join(capture,'report.json'),JSON.stringify(report));
  return {root,capture,client,bin,bytes,report};
}
async function withSample(fn) {
  const value=await sample();
  try {return await fn(value);} finally {await fs.rm(value.root,{recursive:true,force:true});}
}
test('stage original observed bytes without claiming missing Gengar forms are complete',
  ()=>withSample(async ({capture,client,bin,bytes})=>{
    const result=await stageObservedPacks(capture,client);
    assert.equal(result.installed,1);
    assert.equal(result.coveredFormsByPacks,1);
    assert.equal(result.missingFormsByPacks,1);
    assert.equal(result.missing[0].dex,'0092-amarillogengar');
    assert.equal(result.complete,false);
    assert.deepEqual(await fs.readFile(path.join(client,bin)),bytes);
    const again=await stageObservedPacks(capture,client);
    assert.equal(again.installed,0);
    assert.equal(again.reusedVerified,1);
  }));
test('fail closed if source Alpha differs from isolated candidate',
  ()=>withSample(async ({capture,client})=>{
    await fs.writeFile(path.join(client,'version.json'),JSON.stringify({
      officialAlpha:'0.69.1',src:'src-96bf6dc2f4'
    }));
    await assert.rejects(()=>stageObservedPacks(capture,client),/fingerprint/);
  }));
test('reject tampered captured pack before writing anything',
  ()=>withSample(async ({capture,client,bin})=>{
    await fs.writeFile(path.join(capture,'observed',bin),Buffer.alloc(180,30));
    await assert.rejects(()=>stageObservedPacks(capture,client),/mismatch/);
    await assert.rejects(()=>fs.access(path.join(client,bin)),/ENOENT/);
  }));
test('do not overwrite a genuinely existing pack with different bytes',
  ()=>withSample(async ({capture,client,bin})=>{
    await fs.mkdir(path.dirname(path.join(client,bin)),{recursive:true});
    const old=Buffer.alloc(180,55);
    await fs.writeFile(path.join(client,bin),old);
    await assert.rejects(()=>stageObservedPacks(capture,client),/Refusing to replace/);
    assert.deepEqual(await fs.readFile(path.join(client,bin)),old);
  }));
test('reject writing outside isolated site-capture workspace',
  ()=>withSample(async ({capture,client})=>{
    await assert.rejects(()=>stageObservedPacks(capture,path.join(client,'_site')),
      /quarantine/);
  }));
test('reject incomplete or blocked capture reports',
  ()=>withSample(async ({capture,client,report})=>{
    await fs.writeFile(path.join(capture,'report.json'),JSON.stringify({
      ...report,denied:[{asset:'assets/p/x',status:403}]
    }));
    await assert.rejects(()=>stageObservedPacks(capture,client),/incomplete/);
  }));
