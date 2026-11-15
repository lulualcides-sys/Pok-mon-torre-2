import test from 'node:test';
import assert from 'node:assert/strict';
import {recordNativeAdapterMismatch} from '../tools/pokearena/native-adapter-drift.mjs';
test('audit records every unmatched anchor without leaking full JS source',()=>{
 const issues=[];
 recordNativeAdapterMismatch({audit:true,filename:'escenas/titulo.js',
  anchor:'old-string',source:'new-source',issues});
 assert.equal(issues.length,1);
 assert.equal(issues[0].expectedAnchor,'old-string');
 assert.match(issues[0].sourceSha256,/^[a-f0-9]{64}$/);
 assert.ok(!JSON.stringify(issues).includes('new-source'));
});
test('production refuses any unknown legacy modification',()=>{
 assert.throws(()=>recordNativeAdapterMismatch({
  audit:false,filename:'escenas/seleccion.js',anchor:'old',source:'new',issues:[]}),/Unrecognized/);
});
