import test from 'node:test';
import assert from 'node:assert/strict';
import {allowIndependentSpriteCollabPMDInNativePacks as patch} from '../tools/pokearena/torre2-pmd-pack-compat.mjs';

test('Native Alpha 0.65.8 public pack remains first choice for every original sprite',()=>{
 const original='const INDICE={comun:"original"};function load(){'+
  'if(!abierto.hojas[ruta]||escena.textures.exists(clave2))continue;'+
  'const url=urlDe(abierto,ruta);return urlDe(await abiertos.get(nombre),ruta)}';
 const revised=patch(original);
 assert.ok(revised.includes('if(!abierto.hojas[ruta])'));
 assert.ok(revised.includes('return urlDe(abierto,ruta)'));
 assert.ok(revised.includes('assets/pmd/'));
 assert.ok(revised.includes('Missing native/installed PMD sprite'));
 assert.ok(revised.includes('if(!abierto.hojas[ruta]){if(!'));
 assert.ok(!revised.includes('if(!abierto.hojas[ruta]||escena.textures.exists(clave2))continue;'));
 assert.ok(revised.includes('const INDICE={comun:"original"}'));
});
test('Fail closed when pack implementation differs instead of corrupting native game',()=>{
 assert.throws(()=>patch('old client without INDICE'),/Not recognized/);
 assert.throws(()=>patch('const INDICE={};return urlDe(await abiertos.get(nombre),ruta)'),/filecomplete/);
});
