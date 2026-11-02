import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureNativeAbilityImport as fix} from '../tools/pokearena/torre2-native-weather-import-compat.mjs';
const old='import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";';
test('T44 injects signature first, weather second into original source',()=>{
 let out=fix(old+'const a=1;','TORRE2_FORMS');
 out=fix(out,'weatherFromMove');
 assert.ok(out.startsWith(old));
 assert.equal(out.match(/import\{TORRE2_FORMS\}/g)?.length,1);
 assert.equal(out.match(/import\{weatherFromMove\}/g)?.length,1);
 assert.ok(out.endsWith('const a=1;'));
});
test('T44 handles upstream reordered config and extra symbols',()=>{
 const changed="import { CAMPO, RADIO, VISTA, limitarCampo, fueraCampo, nuevaFuncion } from './config.js';";
 let out=fix(changed+'\nconst z=3;','TORRE2_FORMS');
 out=fix(out,'weatherFromMove');
 assert.ok(out.startsWith(changed));
 assert.match(out,/nuevaFuncion/);
});
test('T44 each import is idempotent',()=>{
 let out=fix(old,'TORRE2_FORMS');
 assert.equal(fix(out,'TORRE2_FORMS'),out);
 out=fix(out,'weatherFromMove');
 assert.equal(fix(out,'weatherFromMove'),out);
});
test('T44 rejects ambiguous native imports and unknown module',()=>{
 for(const src of [old+old,'import{VISTA}from"./config.js";',
 'import{CAMPO,RADIO,limitarCampo}from"./config-alt.js";',old+'TORRE2_FORMS(x);'])
  assert.throws(()=>fix(src,'TORRE2_FORMS'));
 assert.throws(()=>fix(old,'unsafeSymbol'));
});
