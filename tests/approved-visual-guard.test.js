import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {gitBlobSha,checkApprovedVisualAssets} from '../tools/dev/approved-visual-guard.mjs';

async function withTree(run){
 const root=await mkdtemp(path.join(os.tmpdir(),'pt2-guard-'));
 try{await mkdir(path.join(root,'reference-assets'),{recursive:true});await run(root)}
 finally{await rm(root,{recursive:true,force:true})}
}
test('Git blob digest uses Git object header, not plain SHA1',()=>{
 assert.equal(gitBlobSha(Buffer.from('hello\n')),'ce013625030ba8dba906f756967f9e9ca394464a');
});
test('approved pixels remain byte-identical without a Phaser build',async()=>withTree(async root=>{
 const file='reference-assets/locked.png',bytes=Buffer.from([1,2,3,4]);
 await writeFile(path.join(root,file),bytes);
 const result=await checkApprovedVisualAssets({schemaVersion:1,assets:[{path:file,gitBlobSha:gitBlobSha(bytes)}]},root);
 assert.equal(result.ok,true);assert.equal(result.checked,1);assert.deepEqual(result.failures,[]);
}));
test('modified or missing approved assets fail with exact path',async()=>withTree(async root=>{
 const file='reference-assets/locked.png',bytes=Buffer.from([1,2,3]);
 const manifest={schemaVersion:1,assets:[{path:file,gitBlobSha:gitBlobSha(bytes)}]};
 await writeFile(path.join(root,file),Buffer.from([1,2,9]));
 const altered=await checkApprovedVisualAssets(manifest,root);
 assert.equal(altered.ok,false);assert.match(altered.failures[0].reason,/checksum mismatch/i);
 await rm(path.join(root,file));
 const missing=await checkApprovedVisualAssets(manifest,root);
 assert.equal(missing.ok,false);assert.equal(missing.failures[0].path,file);
}));
test('unsafe traversal, duplicate entries and bogus digests fail closed',async()=>withTree(async root=>{
 const wrap=assets=>({schemaVersion:1,assets});
 for(const assets of [
  [{path:'../outside.png',gitBlobSha:'a'.repeat(40)}],
  [{path:'/absolute.png',gitBlobSha:'a'.repeat(40)}],
  [{path:'reference-assets/ok.png',gitBlobSha:'bad'}],
  [{path:'reference-assets/ok.png',gitBlobSha:'a'.repeat(40)},
   {path:'reference-assets/ok.png',gitBlobSha:'a'.repeat(40)}]
 ]){
  const result=await checkApprovedVisualAssets(wrap(assets),root);
  assert.equal(result.ok,false);assert.ok(result.failures.length>0);
 }
}));
test('empty manifest is never a green result',async()=>withTree(async root=>{
 const result=await checkApprovedVisualAssets({schemaVersion:1,assets:[]},root);
 assert.equal(result.ok,false);assert.match(result.failures[0].reason,/empty/i);
}));
