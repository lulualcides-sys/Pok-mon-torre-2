import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {parseClientSnapshot,loadClientSnapshot,SNAPSHOT_VERSION}
 from '../tools/pokearena/capture-source-snapshot.mjs';
const bytes=readFileSync('reference-assets/pokearena-client/source-src-97f03e6e1b.json.gz');
test('bundled verified source contains homepage and a closed relative module graph',async()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex'),
  '0684f9db2d7c8efa81cba16e3b6ba8ecb68e35c10c6bf308a7b98c1fdb628fc2');
 const snapshot=await loadClientSnapshot(SNAPSHOT_VERSION);
 assert.equal(Object.keys(snapshot.files).length,76);
 for(const [file,entry]of Object.entries(snapshot.files)){
  if(!file.endsWith('.js'))continue;
  for(const match of entry.text.matchAll(/\b(?:from\s*|import\s*)(?:["'])([^"']+)(?:["'])/g)){
   if(!match[1].startsWith('.'))continue;
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]));
   assert.ok(snapshot.files[target],file+' imports missing '+target);
  }
 }
 assert.equal(await loadClientSnapshot('src-2755ffa8ef'),null,'audits must not silently use the old snapshot');
});
test('snapshot rejects wrong identity, corrupted code and path traversal',()=>{
 assert.throws(()=>parseClientSnapshot(bytes,'src-2755ffa8ef'),/identity/);
 const value=JSON.parse(gunzipSync(bytes));
 value.files[SNAPSHOT_VERSION+'/main.js'].text+='\n// corrupted';
 assert.throws(()=>parseClientSnapshot(gzipSync(JSON.stringify(value)),SNAPSHOT_VERSION),/hash mismatch/);
 const unsafe=JSON.parse(gunzipSync(bytes));
 unsafe.files[SNAPSHOT_VERSION+'/../escape.js']=unsafe.files[SNAPSHOT_VERSION+'/main.js'];
 assert.throws(()=>parseClientSnapshot(gzipSync(JSON.stringify(unsafe)),SNAPSHOT_VERSION),/Unsafe/);
});
