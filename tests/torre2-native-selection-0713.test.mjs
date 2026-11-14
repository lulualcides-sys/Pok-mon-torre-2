import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptModernSelection} from '../tools/pokearena/torre2-native-selection-0713.mjs';
const source='class Seleccion extends Phaser.Scene{'+
 'init(datos){this.previo=datos?.previo;if(this.previo?.modo==="elegir")this.sys.settings.data={}}create(){}'+
 'const MODOS=[{id:"cpu",nombre:"VS CPU"},{id:"versus",nombre:"2 PLAYERS"},{id:"entreno",nombre:"TRAINING"}];'+
 'trioMenu;ponerRetratoA;const h=p.kit[slot];const ky=117;}';
test('new selection preserves elegir mode, two-player metadata and trio portraits',()=>{
 const updated=adaptModernSelection(source,'0.71.3');
 assert.ok(updated.includes('if(this.previo?.modo==="elegir")'));
 assert.ok(updated.includes('trioMenu;ponerRetratoA'));
 assert.ok(updated.includes('2 PLAYERS'));
 assert.ok(updated.includes('const h=p.kit?.[slot]??'));
 assert.ok(!updated.includes('const h=p.kit[slot];'));
 assert.equal(adaptModernSelection(updated,'0.71.3'),updated);
});
test('older verified releases still use their original selection transforms',()=>{
 assert.equal(adaptModernSelection(source,'0.70.0'),null);
});
test('unknown new selection source fails without manufacturing missing APIs',()=>{
 assert.throws(()=>adaptModernSelection(source.replace('trioMenu','trioChanged'),'0.71.3'),/Unrecognized/);
 assert.throws(()=>adaptModernSelection(source.replace('const h=p.kit[slot];const ky=',''),'0.71.3'),/slot/);
});
