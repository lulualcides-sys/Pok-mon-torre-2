import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureLeagueSpriteImports} from '../tools/pokearena/torre2-league-sprite-import.mjs';

test('October native League keeps ponerRetratoA, never imports obsolete ponerRetrato',()=>{
 const src='import{dexAspecto,ponerRetratoA}from"../sprites.js";const x=ponerRetratoA(this,img,dex,72);';
 const out=ensureLeagueSpriteImports(src);
 assert.match(out,/import\{dexAspecto,ponerRetratoA,cargarPMD,soloFormas\}from/);
 assert.doesNotMatch(out,/[,\{]ponerRetrato[,\}]/);
 assert.match(out,/ponerRetratoA\(this,img,dex,72\)/);
 assert.equal(ensureLeagueSpriteImports(out),out);
});
test('legacy native League retains ponerRetrato without adding newer helper',()=>{
 const src='import{dexAspecto,ponerRetrato}from"../sprites.js";';
 const out=ensureLeagueSpriteImports(src);
 assert.match(out,/ponerRetrato,cargarPMD,soloFormas/);
 assert.doesNotMatch(out,/ponerRetratoA/);
});
test('unknown League sprite imports fail closed rather than inventing exports',()=>{
 assert.throws(()=>ensureLeagueSpriteImports('import{dexAspecto}from"../sprites.js";'),/Unknown native League portrait/);
 assert.throws(()=>ensureLeagueSpriteImports('const x=0;'),/Unknown League native sprites import/);
});
