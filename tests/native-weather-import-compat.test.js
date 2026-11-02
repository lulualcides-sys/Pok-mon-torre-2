import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureNativeWeatherFromMoveImport as fix} from '../tools/pokearena/torre2-native-weather-import-compat.mjs';
const old = 'import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";';
test('T44 original config import preserves all native symbols and adds one weather hook',()=>{
 const out=fix(old+'const a=1;');
 assert.ok(out.startsWith(old));
 assert.equal(out.match(/import\{weatherFromMove\}/g)?.length,1);
 assert.ok(out.endsWith('const a=1;'));
});
test('T44 upstream whitespace, quotes and added symbols are preserved',()=>{
 const changed="import { CAMPO, RADIO, VISTA, limitarCampo, fueraCampo, nuevaFuncion } from './config.js';";
 const out=fix(changed+'\nconst z=3;');
 assert.ok(out.startsWith(changed));
 assert.match(out,/nuevaFuncion/);
 assert.equal(out.match(/weatherFromMove/g)?.length,1);
});
test('T44 existing native weather import is not duplicated',()=>{
 const src=old+'import{weatherFromMove}from"./torre2/weather.js";';
 assert.equal(fix(src),src);
});
test('T44 unknown/ambiguous native imports fail closed',()=>{
 for(const src of [old+old,'import{VISTA}from"./config.js";',
 'import{CAMPO,RADIO,limitarCampo}from"./config-alt.js";',old+'weatherFromMove(x);'])
  assert.throws(()=>fix(src));
});
