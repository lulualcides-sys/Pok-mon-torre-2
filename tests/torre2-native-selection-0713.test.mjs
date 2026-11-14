import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptModernSelection} from '../tools/pokearena/torre2-native-selection-0713.mjs';
import {loadNativeSelectionPage0713} from '../tools/pokearena/torre2-selection-load-0713.mjs';
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

test('the real 0.71.3 PMD loader and later selection guard accept the same approved source',()=>{
 const native=source.replace('class Seleccion extends Phaser.Scene{',
  'class Seleccion extends Phaser.Scene{constructor(){super("seleccion")}');
 const fixture='import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetratoA,encajarSprite,retratoA,trioMenu}from"../sprites.js";'+
  'const bloqueado=this.encargo?!!this.encargo.bloqueado?.(p.id):false;'+native+
  'torre2LoadPortraitPage(page){this.__torre2PortraitQueued??=new Set();this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png")}'+
  'refrescar(){this.torre2Page=0;this.torre2PageLabel?.setText("PAG")}';
 const loaded=loadNativeSelectionPage0713(fixture,'0.71.3');
 assert.ok(loaded.includes('preload(){const m=this.registry.get("manifiesto")'));
 assert.ok(!loaded.includes('assets/pmd/"+c.p.dex+"/portrait.png'));
 const adapted=adaptModernSelection(loaded,'0.71.3');
 assert.ok(adapted.includes('const h=p.kit?.[slot]??'));
 assert.equal(adaptModernSelection(adapted,'0.71.3'),adapted);
 assert.throws(()=>adaptModernSelection(loaded.replace('preload(){const m=', 'preloadChanged(){const m='),'0.71.3'),/Unrecognized/);
});
