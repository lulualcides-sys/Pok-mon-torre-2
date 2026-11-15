import test from 'node:test';
import assert from 'node:assert/strict';
import {labelModernPokedexRoles} from '../tools/pokearena/torre2-pokedex-roles-0713.mjs';
const source='const COLS=5;const CEL=44;const PAGE_SIZE=COLS*5;'+
 'const BOTON_TACTIL={lmb:"BASIC",rmb:"SKILL",esp:"DASH",q:"Q",e:"ULT"};'+
 'movimientos(c,p,et,tam){return esTactil()?BOTON_TACTIL[slot]:tecla}';
test('UI labels retain the five slot names across keyboard and touch with no kit rewrite',()=>{
 const out=labelModernPokedexRoles(source,'0.71.3');
 assert.ok(out.includes('lmb:"ATK",rmb:"HAB 2",esp:"ESQUIVA",q:"HAB 3",e:"ULT"'));
 assert.ok(out.includes('return BOTON_TACTIL[slot]'));
 assert.ok(!out.includes('esTactil()?BOTON_TACTIL[slot]:tecla'));
 assert.ok(!out.includes('resolveLoadout('));
});
test('previous Alpha source stays untouched; changed native slot mapping fails closed',()=>{
 assert.equal(labelModernPokedexRoles(source,'0.70.0'),source);
 assert.throws(()=>labelModernPokedexRoles(source.replace('rmb:"SKILL"','rmb:"CHANGED"'),'0.71.3'),/Unrecognized native/);
 assert.throws(()=>labelModernPokedexRoles(source.replace('esTactil()?BOTON_TACTIL[slot]:tecla','slot'),'0.71.3'),/Unrecognized native/);
});
