import test from 'node:test';
import assert from 'node:assert/strict';
import {modernPokedexOrLegacy,guardNativePokedexPagination} from '../tools/pokearena/torre2-pokedex-final-gate-0713.mjs';
const modern='import{atacarEnMenu,trioMenu}from"../sprites.js";'+
 'const COLS=(()=>{for(let c=5;c<12;c++){return c}})();'+
 'const out=slot==="e"?["ULT"]:[];';
test('0.71.3 final stage preserves responsive Pokédex and never calls legacy transform',()=>{
 let calls=0;
 const result=modernPokedexOrLegacy(modern,'0.71.3',()=>{calls++;throw Error('legacy should not run')});
 assert.equal(calls,0);
 assert.equal(result,modern);
});
test('old approved Alpha still applies its original family-grid adjustments',()=>{
 assert.equal(modernPokedexOrLegacy('legacy','0.70.0',s=>'patched-'+s),'patched-legacy');
});
test('unrecognized new Pokédex fails closed rather than skipping source checks',()=>{
 assert.throws(()=>modernPokedexOrLegacy(modern.replace('trioMenu','trioUnknown'),'0.71.3',
  ()=>{throw Error('should not run legacy')}),/Unrecognized modern Pokedex/);
});

test('0.71.3 final pagination stage preserves the native form-aware Pokédex',()=>{
 const source=modern+'class Pokedex extends Phaser.Scene{movimientos(c,p,et,tam){return et}}';
 let legacyCalls=0;
 const actual=guardNativePokedexPagination(source,'0.71.3',()=>{
  legacyCalls++;throw Error('Legacy Kanto grid must not run on 0.71.3');
 });
 assert.equal(legacyCalls,0);
 assert.equal(actual,source);
 assert.ok(actual.includes('trioMenu'));
});
test('full native move-renderer contract is required, not just matching titles',()=>{
 assert.throws(()=>guardNativePokedexPagination(modern,'0.71.3',()=>modern),
  /Unrecognized modern Pokédex move renderer/);
});
test('0.70.0 final pagination still uses approved Kanto family grid',()=>{
 const s=guardNativePokedexPagination('old-client','0.70.0',v=>'paginated-'+v);
 assert.equal(s,'paginated-old-client');
});
