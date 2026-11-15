import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNativeSelectionPage0713} from '../tools/pokearena/torre2-selection-load-0713.mjs';
const source='import{atacarEnMenu,precargarLineas,alTerminarCarga,dexAspecto,auraAspecto,ponerRetratoA,encajarSprite,retratoA,trioMenu}from"../sprites.js";'+
 'const bloqueado=this.encargo?!!this.encargo.bloqueado?.(p.id):false;'+
 'class Seleccion extends Phaser.Scene{constructor(){super("seleccion")}init(datos){this.previo=datos?.previo;if(this.previo?.modo==="elegir")this.sys.settings.data={}}create(){const ok=true;}'+
 'torre2LoadPortraitPage(page){this.__torre2PortraitQueued??=new Set();this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png")}'+
 'refrescar(){this.torre2Page=0;this.torre2PageLabel?.setText("PAG")}}';
test('first 8 cards plus Zubat/Golbat use original binary PMD router in preload',()=>{
 const out=loadNativeSelectionPage0713(source,'0.71.3');
 assert.ok(out.includes('ROSTER.slice(0,8)'));
 assert.ok(out.includes('["0041","0042"]'));
 assert.ok(out.includes('cargarPMD(this,this._torre2InitialSelectionForms,["Idle"])'));
 assert.ok(out.includes('crearAnimsPMD(this,this._torre2InitialSelectionForms,["Idle"])'));
 assert.ok(!out.includes('this.load.image(key,"assets/pmd/"+c.p.dex+"/portrait.png")'));
});
test('page navigation keeps native packs and animation creation instead of static PNG paths',()=>{
 const out=loadNativeSelectionPage0713(source,'0.71.3');
 assert.ok(out.includes('const forms=soloFormas(this.registry.get("manifiesto")'));
 assert.ok(out.includes('const count=cargarPMD(this,forms,["Idle"])'));
 assert.ok(out.includes('crearAnimsPMD(this,forms,["Idle"])'));
 assert.ok(out.includes('this.__torre2PagePending.has(page)'));
 assert.ok(out.includes('this.torre2PageLabel?.setText('));
});
test('old picker untouched and unexpected official layout fails closed',()=>{
 assert.equal(loadNativeSelectionPage0713(source,'0.70.0'),source);
 assert.throws(()=>loadNativeSelectionPage0713(source.replace('trioMenu','otherTrio'),'0.71.3'),/Unrecognized modern/);
 assert.throws(()=>loadNativeSelectionPage0713(source.replace('torre2LoadPortraitPage(page){','newLoader(page){'),'0.71.3'),/Unrecognized modern/);
});
