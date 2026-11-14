import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndividualDexRoster} from '../tools/pokearena/torre2-pokedex-individual-roster.js';
import {installIndividualPokedex0713} from '../tools/pokearena/torre2-pokedex-individual-0713.mjs';
const kit=name=>({lmb:{nombre:name,forma:'golpe'},rmb:{nombre:'Skill',forma:'golpe'},
 q:{nombre:'Skill Q',forma:'dash'},e:{nombre:'Ult',forma:'golpe'},
 esp:{nombre:'Dodge',forma:'dash'}});
const ch={id:'chikorita',dex:'0152',nombre:'CHIKORITA',hp:60,
 vel:50,atk:1,def:1,kit:kit('Tackle'),
 evoluciones:[{dex:'0153',nombre:'BAYLEEF',hp:70,kit:{lmb:{nombre:'Razor Leaf',forma:'proyectil'}}},
 {dex:'0154',nombre:'MEGANIUM',hp:90,kit:{lmb:{nombre:'Solar Beam',forma:'rayo'}}}]};
const ghost={id:'lago',dex:'0481',nombre:'LAKE GUARDIANS',kit:kit('Confusion'),
 evoluciones:[{dex:'0481',nombre:'LAKE GUARDIANS',kit:{lmb:{nombre:'Confusion',forma:'golpe'}}}],
 trio:[{dex:'0480',nombre:'UXIE'},{dex:'0482',nombre:'AZELF'}]};
const def=(id,dex)=>({id,dex,nombre:id.toUpperCase(),hp:100,kit:kit(id)});
const original=[ch,ghost,def('ditto','0132'),def('tauros','0128')];
const resolve=p=>[p,...(p.evoluciones||[]).map(e=>({
 ...p,...e,hp:e.hp??p.hp,kit:{...p.kit,...e.kit}
}))];
test('three guardians are distinct cards with native moves and no trio',()=>{
 const list=buildIndividualDexRoster(original,resolve,1);
 assert.deepEqual(list.filter(x=>['0480','0481','0482'].includes(x.dex))
   .map(x=>x.nombre),['UXIE','MESPRIT','AZELF']);
 for(const p of list.filter(x=>Number(x.dex)>=480)){
  assert.equal(p.kit.lmb.nombre,'Confusion');
  assert.equal(p.trio,null);
 }
 assert.equal(original[1].trio.length,2);
});
test('Chikorita, Bayleef, Meganium get independent entries and inherited moves',()=>{
 const list=buildIndividualDexRoster(original,resolve,1);
 const trio=list.filter(p=>[152,153,154].includes(Number(p.dex)));
 assert.deepEqual(trio.map(p=>p.dex),['0152','0153','0154']);
 assert.equal(trio[0].torre2DexNext,'BAYLEEF');
 assert.equal(trio[1].kit.lmb.nombre,'Razor Leaf');
 assert.equal(trio[2].kit.lmb.nombre,'Solar Beam');
 assert.equal(trio[2].torre2DexNext,null);
 assert.ok(trio.every(p=>p.evoluciones.length===0));
 assert.equal(original[0].evoluciones.length,2);
});
test('Tauros and Ditto keep independent native moves; no roster mutation',()=>{
 const list=buildIndividualDexRoster(original,resolve,1);
 assert.notEqual(list.find(x=>x.dex==='0128').id,list.find(x=>x.dex==='0132').id);
 assert.notStrictEqual(list.find(x=>x.dex==='0128'),original[3]);
 assert.equal(original[0].kit.lmb.nombre,'Tackle');
});
test('future upstream trio drift fails safely',()=>{
 assert.throws(()=>buildIndividualDexRoster([{...ghost,trio:[ghost.trio[0]]},ch,
 def('tauros','0128'),def('ditto','0132')],resolve,1),/required independent/);
});
test('0.71.3 injects independent roster and preloads all Johto Idles',()=>{
 const raw='import{ROSTER,RANURAS,ROLES,REGLAS,etapaDe}from"../datos.js";'+
 'const PAGE_SIZE=COLS*5;function etapasDe(def){return []}'+
 'function cifras(){return ""}class Pokedex extends Phaser.Scene{'+
 'torre2CargarPagina(page){}'+
 'let page=new Set(ROSTER.slice(start,start+PAGE_SIZE).map(p=>p.dex));'+
 'movimientos(c,p,et,tam){describir(p.id,h.nombre,h.forma);'+
 'const info=et.mega?foo:bar}}';
 const s=installIndividualPokedex0713(raw,'0.71.3');
 assert.match(s,/ROSTER as BATTLE_ROSTER/);
 assert.match(s,/buildIndividualDexRoster\(BATTLE_ROSTER,etapasDe,REGLAS.vidaGlobal\)/);
 assert.match(s,/Number\(p.dex\);return n>=152&&n<=251/);
 assert.match(s,/p.torre2DexNext/);
 assert.equal(installIndividualPokedex0713(raw,'0.70.0'),raw);
});
