import test from 'node:test';
import assert from 'node:assert/strict';
import {allowIndependentSpriteCollabPMDInNativePacks as patch}
 from '../tools/pokearena/torre2-pmd-pack-compat.mjs';

const source=()=>[
 'const INDICE={comun:"native"};const INTENTOS=3;',
 'function cargarHoja(){const nombre=INDICE&&paqueteDe(ruta);',
 'if(!abierto.hojas[ruta]||escena.textures.exists(clave2))continue;',
 'const url=urlDe(abierto,ruta)}',
 'async function urlHoja(){const nombre=INDICE&&paqueteDe(ruta);',
 'return urlDe(await abiertos.get(nombre),ruta)}'
].join('');

test('Original binary pack first, backed by verified local PNGs only when absent',()=>{
 const hash='3a51c65d5b95ec1257bf';
 const text=patch(source(),[hash]);
 assert.ok(text.includes('const TORRE2_AVAILABLE_PACKS=new Set(["'+hash+'"])'));
 assert.equal(text.split('TORRE2_AVAILABLE_PACKS.has(candidate)').length-1,2);
 assert.ok(text.includes('if(!abierto.hojas[ruta])'));
 assert.ok(text.includes('return urlDe(abierto,ruta)'));
 assert.ok(text.includes('assets/pmd/'));
 assert.ok(text.includes('Missing native/installed PMD sprite'));
 assert.ok(text.includes('const INDICE={comun:"native"}'));
});

test('Reject unknown native module layouts and unverified binary hashes',()=>{
 assert.throws(()=>patch('old client without INDICE'),/Not recognized/);
 assert.throws(()=>patch('const INDICE={};const INTENTOS=3;'),/native packet selectors/);
 assert.throws(()=>patch(source(),['not-a-real-hash']),/Unverified/);
});
