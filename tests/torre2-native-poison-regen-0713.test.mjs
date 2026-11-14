import test from 'node:test';
import assert from 'node:assert/strict';
import {patchNativePoisonRegen} from '../tools/pokearena/torre2-native-poison-regen-0713.mjs';
const before='if(t-this.ultimoDano>=REGLAS.curaTras&&this.hp<this.hpMax&&'+
 '!this.est.enfermo&&!this.escena.muerteSubita&&!this.escena.datos?.torre2){heal()}';
test('new poison guard preserves sudden death and only excludes added Arena species',()=>{
 const after=patchNativePoisonRegen(before,'0.71.3');
 assert.ok(after.includes('!this.escena.muerteSubita'));
 assert.ok(after.includes('this.def?.torre2ArenaAdded===true'));
 assert.ok(after.includes('this.est.veneno'));
 assert.ok(after.includes('!this.escena.datos?.torre2'));
 assert.equal(after.split('REGLAS.curaTras').length,2);
});
test('approved old 0.70 condition remains compatible',()=>{
 const old=before.replace('&&!this.escena.muerteSubita','');
 assert.ok(patchNativePoisonRegen(old,'0.70.0').includes('torre2ArenaAdded'));
});
test('unknown future healing change or duplicate guard is rejected',()=>{
 assert.throws(()=>patchNativePoisonRegen(before.replace('muerteSubita','newMuerte'),'0.71.3'),
  /Unrecognized/);
 assert.throws(()=>patchNativePoisonRegen(before+before,'0.71.3'),/Unrecognized/);
 assert.throws(()=>patchNativePoisonRegen(before,'0.71.4'),/Unrecognized/);
});
