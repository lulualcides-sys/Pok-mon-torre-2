import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {checkIndex,parsePublicManifest}=
 require('../tools/pokearena/rea-public-pmd-manifest.cjs');
const fixture=()=>Object.fromEntries(Array.from({length:210},(_,i)=>{
 const d=String(i+1).padStart(4,'0');
 return [d,{anims:{Idle:{file:d+'/Idle-Anim.png'}},shadowSize:1}];
}));
test('public current source index is checked exactly, not by Alpha guess',()=>{
 assert.doesNotThrow(()=>checkIndex('<script src="src-3cc4979f18/main.js"></script>','src-3cc4979f18'));
 assert.throws(()=>checkIndex('<script src="src-a000000000/main.js"></script>','src-3cc4979f18'));
 assert.throws(()=>checkIndex('fake index','src-3cc4979f18'));
});
test('manifest accepts only substantial publicly observed native form metadata',()=>{
 const bytes=Buffer.from(JSON.stringify(fixture()));
 const v=parsePublicManifest(bytes);
 assert.equal(v.forms,210);
 assert.equal(v.validIdle,210);
 assert.deepEqual(v.manifest['0001'].anims.Idle.file,'0001/Idle-Anim.png');
});
test('unknown structure, bad keys, missing idle sprites and empty responses fail closed',()=>{
 assert.throws(()=>parsePublicManifest(Buffer.from('{}')));
 const bad=fixture();bad['../../secret']={anims:{Idle:{file:'x.png'}}};
 assert.throws(()=>parsePublicManifest(Buffer.from(JSON.stringify(bad))));
 const noIdle=fixture();for(const key of Object.keys(noIdle).slice(0,70))delete noIdle[key].anims.Idle;
 assert.throws(()=>parsePublicManifest(Buffer.from(JSON.stringify(noIdle))));
});
