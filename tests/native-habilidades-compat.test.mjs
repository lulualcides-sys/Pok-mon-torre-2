import test from 'node:test';
import assert from 'node:assert/strict';
import {injectNativeTorre2FormsImport} from '../tools/pokearena/torre2-native-habilidades-compat.mjs';
const original='import{CAMPO,RADIO,VISTA,limitarCampo,fueraCampo}from"./config.js";const FORMAS={proyectil,chorro,cono,zona,rayo,pulso};';
test('T44 adds independent Kanto VFX only after original config import',()=>{
 const out=injectNativeTorre2FormsImport(original.replace('CAMPO,RADIO,VISTA,limitarCampo,fueraCampo','RADIO,CAMPO,VISTA,fueraCampo,limitarCampo'));
 assert.ok(out.includes('import{CAMPO')===false);
 assert.ok(out.includes('import{RADIO,CAMPO,VISTA,fueraCampo,limitarCampo}from"./config.js";'));
 assert.ok(out.includes('import{TORRE2_FORMS}from"./torre2/signature-fx.js";'));
 assert.ok(out.endsWith('const FORMAS={proyectil,chorro,cono,zona,rayo,pulso};'));
 assert.equal(injectNativeTorre2FormsImport(out),out);
});
test('T44 supports native whitespace and extra imports without rewriting them',()=>{
 const code='import { VISTA, CAMPO, OTHER } from "./config.js";const FORMAS={chorro};';
 const out=injectNativeTorre2FormsImport(code);
 assert.ok(out.startsWith('import { VISTA, CAMPO, OTHER } from "./config.js";'));
 assert.ok(out.includes('TORRE2_FORMS'));
});
test('T44 refuses changed skill layout rather than injecting in unknown code',()=>{
 for(const code of [
 'import{USER}from"./config.js";const FORMAS={};',
 'import{CAMPO}from"./config.js";const SOMETHING={};',
 'import{CAMPO}from"./config.js";import{VISTA}from"./config.js";const FORMAS={};',
 'import{CAMPO}from"./config.js";const FORMAS={};use(TORRE2_FORMS)'
 ])assert.throws(()=>injectNativeTorre2FormsImport(code));
});
