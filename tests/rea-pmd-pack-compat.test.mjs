import test from 'node:test';
import assert from 'node:assert/strict';
import {allowIndependentSpriteCollabPMDInNativePacks as patch} from '../tools/pokearena/torre2-pmd-pack-compat.mjs';

function sample(){
 return 'const INDICE={comun:"native"};const INTENTOS=3;'+
  'function cargarHoja(){const nombre=INDICE&&paqueteDe(ruta);'+
  'if(!abierto.hojas[ruta]||escena.textures.exists(clave2))continue;'+
  'const url=urlDe(abierto,ruta);return url}'+
  'async function urlHoja(){const nombre=INDICE&&paqueteDe(ruta);'+
  'return urlDe(await abiertos.get(nombre),ruta)}';
}
test('Uses only verified present 0.65.8 binary packs; remaining species load local genuine PNGs',()=>{
 const allowed='3a51c65d5b95ec1257bf';
 const after=patch(sample(),[allowed]);
 assert.ok(after.includes('const INDICE={comun:"native"}'));
 assert.ok(after.includes('const TORRE2_AVAILABLE_PACKS=new Set(["'+allowed+'"])'));
 assert.equal(after.split('TORRE2_AVAILABLE_PACKS.has(candidate)').length-1,2);
 assert.ok(after.includes('if(!abierto.hojas[ruta])'));
 assert.ok(after.includes('return urlDe(aberto,ruta)')===false);
});
test('Fails closed on unknown code or package identifiers',()=>{
 assert.throws(()=>patch('old client without INDICE'),/Not recognized/);
 assert.throws(()=>patch('const INDICE={};const INTENTOS=3;'),/native packet selectors/);
 assert.throws(()=>patch(sample(),['not-a-sha']),/Unverified/);
});
