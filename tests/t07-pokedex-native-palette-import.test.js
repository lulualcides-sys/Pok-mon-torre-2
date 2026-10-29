import test from 'node:test';
import assert from 'node:assert/strict';
import {ensurePokedexTypePaletteImport} from '../tools/pokearena/torre2-pokedex-pages.mjs';

test('native Pokédex without TIPOS receives exactly one original palette import',()=>{
 const src='import{ROSTER,RANURAS,REGLAS}from"../datos.js";const card=TIPOS["ICE"];';
 const result=ensurePokedexTypePaletteImport(src);
 assert.match(result,/import\{TIPOS\}from"\.\.\/datos\.js";/);
 assert.equal((result.match(/import\{TIPOS\}from/g)||[]).length,1);
 assert.equal(ensurePokedexTypePaletteImport(result),result);
});
test('existing original Pokédex TIPOS import remains byte-for-byte unchanged',()=>{
 const src='import{ROSTER,TIPOS,RANURAS}from"../datos.js";';
 assert.equal(ensurePokedexTypePaletteImport(src),src);
});
test('unrecognized upstream Pokédex imports fail closed',()=>{
 assert.throws(()=>ensurePokedexTypePaletteImport('const TIPOS={};'),
  /Unrecognized original Pokédex datos import/);
});
