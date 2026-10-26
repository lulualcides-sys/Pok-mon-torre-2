import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePokedexNameColumn} from '../tools/pokearena/torre2-pokedex-pages.mjs';
test('Pokédex accepts fixed and measured upstream name columns without removing name clipping',()=>{
 const legacy='const nx=TX+(esTactil()?52:38);';
 assert.equal(normalizePokedexNameColumn(legacy),'const nx=TX+72;');
 const measured='const nx=Math.max(TX+(esTactil()?52:38),TX+6+Math.max(...etiquetas.map(t=>t.width))+8);';
 const clip='c.add(estrechar(texto(this,nx,y+3,h.nombre,{tam:8}),PX+PW-14-tw-nx));';
 const result=normalizePokedexNameColumn(measured+clip);
 assert.ok(result.includes('Math.max(TX+72,TX+6+Math.max(...etiquetas.map(t=>t.width))+8)'));
 assert.ok(result.endsWith(clip));
 assert.throws(()=>normalizePokedexNameColumn('const nx=UNRECOGNIZED;'),/unexpectedly changed/);
});
