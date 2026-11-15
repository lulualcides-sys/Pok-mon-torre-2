import test from 'node:test';
import assert from 'node:assert/strict';
import {skinMenuScene} from '../tools/pokearena/torre2-noncombat-button-skin.mjs';
const modern='import{atacarEnMenu,trioMenu}from"../sprites.js";'+
 'const COLS=(()=>{for(let c=5;c<12;c++){return c}})();'+
 'const out=slot==="e"?["ULT"]:[];';
const legacy='marco(g,x0,PY+3,w,14,i===this.etapa?"oro":"azul");'+
 'efectosBoton(g,luz,x0,PY+3,w,14,this.time.now)';
test('0.71.3 dynamic Pokedex keeps official tab renderer without old pixel coordinates',()=>{
 assert.equal(skinMenuScene(modern,'pokedex','0.71.3'),modern);
});
test('0.70 old evolution tabs still get the original small pixel detail',()=>{
 const after=skinMenuScene(legacy,'pokedex','0.70.0');
 assert.match(after,/fillRect\(x0\+4,PY\+5/);
 assert.notEqual(after,legacy);
});
test('0.71.3 unknown Pokedex cannot silently pass skin',()=>{
 assert.throws(()=>skinMenuScene(modern.replace('trioMenu','other'),'pokedex','0.71.3'),
  /Unrecognized/);
});
test('unapproved scene remains rejected',()=>{
 assert.throws(()=>skinMenuScene(modern,'combate','0.71.3'),/unapproved/);
});
