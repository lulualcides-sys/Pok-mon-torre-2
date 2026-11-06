import test from 'node:test';
import assert from 'node:assert/strict';
import {buildPokedexFamilies} from '../tools/pokearena/torre2-pokedex-families.js';

const unit=(id,dex,evos=[])=>({
 id,dex:String(dex).padStart(4,'0'),nombre:id.toUpperCase(),
 tipos:['GRASS'],kit:{lmb:{nombre:'Tackle',forma:'golpe'}},
 evoluciones:evos.map(([name,num])=>({
  nombre:name.toUpperCase(),dex:String(num).padStart(4,'0')
 }))
});
test('Poké Arena native family keeps one card for all stages, no ROSTER mutation',()=>{
 const roster=[
  unit('bulbasaur',1,[['ivysaur',2],['venusaur',3]]),
  unit('chikorita',152,[['bayleef',153],['meganium',154]]),
  unit('ivysaur',2),unit('bayleef',153),unit('meganium',154),
  unit('articuno',144),unit('venusaur',3),
  unit('eevee',133,[['vaporeon',134],['jolteon',135],['flareon',136]]),
  unit('espeon',196),unit('umbreon',197),
  unit('wobbuffet',202)
 ];
 const before=JSON.stringify(roster);
 const johto=[[152,'chikorita',[],0,0,0,0,0,0,null,[]],
 [153,'bayleef',[],0,0,0,0,0,0,152,[]],
 [154,'meganium',[],0,0,0,0,0,0,153,[]],
 [196,'espeon',[],0,0,0,0,0,0,133,[]],
 [197,'umbreon',[],0,0,0,0,0,0,133,[]]];
 const model=buildPokedexFamilies(roster,johto,{
  bulbasaur:[{to:'ivysaur'}],ivysaur:[{to:'venusaur'}]
 });
 assert.equal(JSON.stringify(roster),before);
 assert.equal(model.order.length,5);
 assert.deepEqual(new Set(model.order),new Set([0,1,5,7,10]));
 assert.equal(model.rootIndexForIndex[2],0);
 assert.equal(model.rootIndexForIndex[6],0);
 assert.equal(model.rootIndexForIndex[3],1);
 assert.equal(model.rootIndexForIndex[4],1);
 assert.equal(model.rootIndexForIndex[8],7);
 assert.equal(model.rootIndexForIndex[9],7);
 assert.equal(model.membersByRoot.get(7).length,3);
 assert.equal(model.rank.length,roster.length);
 assert.ok(model.order.every(i=>model.rootSet.has(i)));
});
test('Cross-generation baby pre-evolution joins Pikachu without changing battle roster',()=>{
 const roster=[
  unit('pikachu',25,[['raichu',26]]),
  unit('raichu',26),unit('pichu',172),unit('nidoran-f',29),
  unit('nidoran-m',32)
 ];
 const model=buildPokedexFamilies(roster,[],{
  pichu:[{to:'pikachu'}],pikachu:[{to:'raichu'}]
 });
 assert.equal(model.rootIndexForIndex[0],2);
 assert.equal(model.rootIndexForIndex[1],2);
 assert.equal(model.order.length,3);
 assert.notEqual(model.rootIndexForIndex[3],model.rootIndexForIndex[4]);
});
