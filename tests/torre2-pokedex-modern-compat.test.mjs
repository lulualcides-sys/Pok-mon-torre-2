import test from 'node:test';
import assert from 'node:assert/strict';
import {preserveModernPokedex} from '../tools/pokearena/torre2-pokedex-modern-compat.mjs';
const native='import{atacarEnMenu,trioMenu}from"../sprites.js";'+
 'const COLS=(()=>{for(let c=5;c<12;c++){return c}})();'+
 'const out=slot==="e"?["ULT"]:[];';
test('Alpha 0.71.3 keeps its native responsive Pokedex',()=>{
 assert.equal(preserveModernPokedex(native,'0.71.3'),true);
});
test('older approved client still receives its own legacy patch',()=>{
 assert.equal(preserveModernPokedex(native,'0.70.0'),false);
});
test('unknown newer Pokedex fails closed rather than silently deleting controls',()=>{
 assert.throws(()=>preserveModernPokedex(native.replace('trioMenu','otherMenu'),'0.71.3'),
  /Unrecognized modern Pokedex/);
});
