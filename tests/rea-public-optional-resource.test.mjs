import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyPublicResourceFailures} from '../tools/pokearena/rea-public-optional-resource.mjs';

const path='assets/noticias/2026-11-14-codigo-instagram.webp';
test('known missing decorative NEWS webp is reported but does not fail capture',()=>{
 const result=classifyPublicResourceFailures([{path,status:404}]);
 assert.deepEqual(result,{optional:[{path,status:404}],fatal:[]});
});
test('NEVER waive 403 even for optional NEWS graphics',()=>{
 const result=classifyPublicResourceFailures([{path,status:403}]);
 assert.equal(result.fatal.length,1);
 assert.equal(result.optional.length,0);
});
test('PMD combat manifest, sprites and current JS always block on missing response',()=>{
 const items=['assets/pmd/manifest.json','assets/pmd/0132/Idle-Anim.png',
 'src-5ccc174cb8/datos.js'].map(path=>({path,status:404}));
 assert.deepEqual(classifyPublicResourceFailures(items).fatal,items);
});
test('unknown/modified news resource or other HTTP status remains blocked',()=>{
 const items=[{path:'assets/noticias/unknown.webp',status:404},
 {path,status:500},{path:'assets/noticias/2026-11-14-codigo-instagram.webp?bypass=1',status:404}];
 assert.equal(classifyPublicResourceFailures(items).fatal.length,3);
});
test('reject malformed REA blocked report rather than assume no blocked resources',()=>{
 for(const value of [null,{},''])assert.throws(
  ()=>classifyPublicResourceFailures(value),TypeError);
});
