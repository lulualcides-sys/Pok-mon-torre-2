import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const url=new URL('../tools/pokearena/torre2-magmar-family.js',import.meta.url);
let source=readFileSync(url,'utf8');
source=source.replace("import {nativeAttacks} from './early-kanto-species.js';",`
const nativeAttacks=roster=>{
 const moves=new Map();
 for(const p of roster)for(const m of Object.values(p.kit||{}))
  if(m?.nombre&&m?.forma&&!moves.has(m.nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-')))
   moves.set(m.nombre.toLowerCase().replace(/[^a-z0-9]+/g,'-'),m);
 return moves;
};`);
const {attachMagmortarEvolution}=await import('data:text/javascript;base64,'+
 Buffer.from(source).toString('base64'));
const kit={
 lmb:{nombre:'Fire Punch',forma:'native-fire-punch',tipo:'FIRE',dano:14},
 rmb:{nombre:'Flamethrower',forma:'native-flamethrower',tipo:'FIRE',dano:15},
 q:{nombre:'Lava Plume',forma:'native-lava-plume',tipo:'FIRE',dano:12},
 e:{nombre:'Overheat',forma:'native-overheat',tipo:'FIRE',dano:22}
};
test('Magmortar is a playable evolution but preserves all source P2 moves and Kanto stages',()=>{
 const original={id:'source',kit:structuredClone(kit),evoluciones:[]};
 const magmar={id:'magmar',dex:'0126',torre2ArenaAdded:true,kit:structuredClone(kit),evoluciones:[]};
 const roster=[original,magmar];
 const snapshot=JSON.stringify(original);
 assert.equal(attachMagmortarEvolution(roster),true);
 assert.equal(attachMagmortarEvolution(roster),true,'Must be idempotent');
 assert.equal(magmar.evoluciones.length,1);
 const stage=magmar.evoluciones[0];
 assert.equal(stage.dex,'0467');
 assert.equal(stage.nombre,'MAGMORTAR');
 assert.equal(stage.torre2LaterGeneration,true);
 assert.deepEqual(['lmb','rmb','q','e'].map(role=>stage.kit[role]?.nombre),
  ['Fire Punch','Flamethrower','Lava Plume','Overheat']);
 assert.equal(stage.kit.e.ulti,true);
 assert.equal(stage.kit.e.forma,'native-overheat');
 assert.equal(new Set(['lmb','rmb','q','e'].map(k=>stage.kit[k].nombre)).size,4);
 assert.equal(JSON.stringify(original),snapshot);
 assert.equal(roster.length,2,'Do not create an extra standalone Magmortar card');
});
test('An original Poké Arena Magmar is never rewritten',()=>{
 const source={id:'magmar',torre2ArenaAdded:false,kit:structuredClone(kit),evoluciones:[]};
 const roster=[source];
 const before=JSON.stringify(roster);
 assert.equal(attachMagmortarEvolution(roster),false);
 assert.equal(JSON.stringify(roster),before);
});
