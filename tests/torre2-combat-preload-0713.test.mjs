import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptModernCombatPreload} from '../tools/pokearena/torre2-combat-preload-0713.mjs';
const native="import{REGLAS,buscar,arenaElegible}from\"../datos.js\";const dexs=formasDe(d.jugadores?d.jugadores.flatMap(j=>j.lista??[j.id]):d.equipos?d.equipos.flat():[d.p1,d.p2],d.jugadores?d.jugadores.flatMap(j=>j.listaAsp??(j.lista?j.lista.map(()=>null):[j.aspecto])):d.equipos?d.aspectosEq?.flat()??[]:d.aspectos);soltarPMD(this,m,dexs);const formas=soloFormas(m,dexs);";
test('retains native grouped teams, trio forms and alternate form lists',()=>{
 const updated=adaptModernCombatPreload(native,'0.71.3');
 assert.ok(updated.includes('d.torre2?.party?new Set('));
 assert.ok(updated.includes('d.jugadores.flatMap(j=>j.lista??[j.id])'));
 assert.ok(updated.includes('d.equipos?d.equipos.flat()'));
 assert.ok(updated.includes('d.aspectosEq?.flat()??[]'));
 assert.ok(updated.includes('soltarPMD(this,m,dexs)'));
 assert.equal(adaptModernCombatPreload(updated,'0.71.3'),updated);
});
test('old client retains its previous Kanto-only patch implementation',()=>{
 assert.equal(adaptModernCombatPreload(native,'0.70.0'),null);
});
test('changed or ambiguous official combat preload fails closed',()=>{
 assert.throws(()=>adaptModernCombatPreload(native.replace('formasDe(','different('),'0.71.3'),
  /absent or ambiguous/);
 assert.throws(()=>adaptModernCombatPreload(native+"const dexs=formasDe(d.jugadores?d.jugadores.flatMap(j=>j.lista??[j.id]):d.equipos?d.equipos.flat():[d.p1,d.p2],d.jugadores?d.jugadores.flatMap(j=>j.listaAsp??(j.lista?j.lista.map(()=>null):[j.aspecto])):d.equipos?d.aspectosEq?.flat()??[]:d.aspectos);",'0.71.3'),
  /absent or ambiguous/);
});
