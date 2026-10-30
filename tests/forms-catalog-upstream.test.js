import test from 'node:test';
import assert from 'node:assert/strict';
import {addTorre2FormsToNativeCatalog} from '../tools/pokearena/torre2-forms-compat.mjs';
const header='import{TORRE2_FORMS}from"./torre2/signature-fx.js";';
test('October reordered native FORMAS still includes all original renderers',()=>{
 const native=header+'const FORMAS={pulso,proyectil,cono,rayo,chorro,zona,halo};';
 const patched=addTorre2FormsToNativeCatalog(native);
 assert.ok(patched.includes('...TORRE2_FORMS'));
 assert.ok(patched.includes('torre2_metronome:(l,h,extra)=>'));
 assert.ok(patched.includes('pulso,proyectil,cono,rayo,chorro,zona,halo'));
 assert.ok(patched.indexOf('...TORRE2_FORMS')<patched.indexOf('pulso,proyectil'));
 assert.ok(!patched.includes('const FORMAS={proyectil,chorro'));
});
test('Legacy ordered FORMAS works without changing native VFX parameters',()=>{
 const native=header+'const FORMAS={proyectil,chorro,cono,zona,rayo,pulso,halo};';
 const patched=addTorre2FormsToNativeCatalog(native);
 assert.ok(patched.includes('proyectil,chorro,cono,zona,rayo,pulso,halo'));
 assert.equal(patched.split('const FORMAS={').length,2);
});
test('Unknown or previously patched upstream refuses unsafe double injection',()=>{
 assert.throws(()=>addTorre2FormsToNativeCatalog(
  'const FORMAS={rayo};'+header),/safe additive injection/);
 const original=header+'const FORMAS={proyectil,chorro};';
 const patched=addTorre2FormsToNativeCatalog(original);
 assert.throws(()=>addTorre2FormsToNativeCatalog(patched),
  /already patched or has ambiguous/);
});
