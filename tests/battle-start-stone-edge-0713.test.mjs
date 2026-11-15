import test from 'node:test';
import assert from 'node:assert/strict';
import {unblockLocalBattleStarts} from '../tools/pokearena/torre2-local-battle-start-0713.mjs';
import {setNativeStoneEdgeCooldown0713} from '../tools/pokearena/torre2-stone-edge-0713.mjs';
const original='class Seleccion extends Phaser.Scene{empezar(){'+
'const datos=datosReto(this.dispositivos,this.eleccion[0]);alTerminarCarga(this,()=>this.scene.start("combate",datos));return'+
'if(this.liga){alTerminarCarga(this,()=>this.scene.start("combate",{p1:this.eleccion[0],p2:this.liga.pokemon??this.liga.rival,arena:this.liga.arena,nivel:this.liga.nivel,modo:"cpu",mandos:[...this.dispositivos],liga:this.liga,aspectos,jefes,etapas,cerebros:cerebrosJefe(rivalLiga(this.liga.rival))}));return}'+
'alTerminarCarga(this,()=>this.scene.start("combate",{p1:this.eleccion[0],p2:this.eleccion[1],arena:this.arena,nivel:this.nivel,modo:this.modo,mandos:[...this.dispositivos],aspectos}))'+
'const online="ranked";alTerminarCarga(this,()=>this.scene.start("jefe",script));}}';
test('offline Arena and League launch immediately; online and boss unchanged',()=>{
 const s=unblockLocalBattleStarts(original,'0.71.3');
 assert.ok(s.includes('this.scene.start("combate",{p1:this.eleccion[0],p2:this.eleccion[1]'));
 assert.ok(s.includes('this.scene.start("combate",{p1:this.eleccion[0],p2:this.liga.pokemon'));
 assert.ok(s.includes('this.scene.start("combate",datos);return'));
 assert.ok(s.includes('const online="ranked";alTerminarCarga(this,()=>this.scene.start("jefe",script))'));
 assert.equal(unblockLocalBattleStarts(original,'0.70.0'),original);
 assert.throws(()=>unblockLocalBattleStarts('class Seleccion extends Phaser.Scene{}','0.71.3'),/contract/);
});
test('Stone Edge exact native instance has 3.5 seconds, not shortened globally',()=>{
 const entry='nombre:"Stone Edge",forma:"erupcion",estilo:"roca",tipo:"ROCK",dano:2.5,golpes:8,paso:38,radio:22,cada:.11,persigue:.45,aturdeFinal:.3,cd:1,anim:"Charge"';
 const s='const TODOS=[{id:"rhydon",kit:{e:{'+entry+'}}}];const other={cd:1};';
 const patched=setNativeStoneEdgeCooldown0713(s,'0.71.3');
 assert.ok(patched.includes('aturdeFinal:.3,cd:3.5,anim:"Charge"'));
 assert.ok(patched.includes('const other={cd:1}'));
 assert.equal(setNativeStoneEdgeCooldown0713(s,'0.70.0'),s);
 assert.throws(()=>setNativeStoneEdgeCooldown0713(s.replace('Stone Edge','Hyper Beam'),'0.71.3'),/Expected one/);
});
