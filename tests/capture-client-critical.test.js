import test from 'node:test';
import assert from 'node:assert/strict';
import {requiredCaptureFiles,missingCaptureFiles,recoverCriticalCapture} from '../tools/pokearena/capture-client-critical.mjs';

const version='src-012345abcd';
test('critical Phaser graph contains original selection and combat modules',()=>{
  const paths=requiredCaptureFiles(version);
  assert.ok(paths.includes(version+'/escenas/seleccion.js'));
  assert.ok(paths.includes(version+'/escenas/combate.js'));
  assert.ok(paths.includes(version+'/main.js'));
  assert.equal(new Set(paths).size,paths.length);
  assert.deepEqual(missingCaptureFiles(version,new Set(paths)),[]);
  assert.deepEqual(missingCaptureFiles(version,new Set(paths.slice(1))),[paths[0]]);
  assert.throws(()=>requiredCaptureFiles('src-not-a-version'),/invalid versioned/);
});
test('transient missing selection.js recovers after retries without touching captured files',async()=>{
  const paths=requiredCaptureFiles(version);
  const captured=new Set(paths.filter(p=>!p.endsWith('/escenas/seleccion.js')));
  const writes=[],calls=[],waits=[];
  const recovered=await recoverCriticalCapture({
    version,captured,maxAttempts:3,
    fetchFile:async p=>{
      calls.push(p);
      if(calls.length<3)throw new Error('HTTP 503');
      return {data:Buffer.from('export const selection = true;'),contentType:'text/javascript'};
    },
    saveFile:async(p,v)=>writes.push([p,v.data.length]),
    wait:async ms=>waits.push(ms)
  });
  assert.equal(calls.length,3);
  assert.deepEqual(waits,[1000,2000]);
  assert.equal(writes.length,1);
  assert.equal(recovered[0].attempts,3);
  assert.deepEqual(missingCaptureFiles(version,captured),[]);
});
test('permanently missing boot module fails rather than reporting capture success',async()=>{
  const paths=requiredCaptureFiles(version),captured=new Set(paths.slice(1));
  let calls=0;
  await assert.rejects(recoverCriticalCapture({
    version,captured,maxAttempts:2,
    fetchFile:async()=>{calls++;throw new Error('HTTP 404')},
    saveFile:async()=>assert.fail('should not save a missing file')
  }),/Critical Phaser client module unavailable.*main\.js.*2 attempts/);
  assert.equal(calls,2);
  assert.ok(!captured.has(paths[0]));
});
test('empty module never counts as successful recovery',async()=>{
  const paths=requiredCaptureFiles(version),captured=new Set(paths.slice(1));
  await assert.rejects(recoverCriticalCapture({
    version,captured,maxAttempts:1,
    fetchFile:async()=>({data:Buffer.alloc(0)}),
    saveFile:async()=>assert.fail('should not persist empty module')
  }),/Empty critical module/);
  assert.ok(!captured.has(paths[0]));
});
