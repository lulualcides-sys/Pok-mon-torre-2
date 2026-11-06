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

test('Magby Magmar Magmortar share one native-family card and 3 tabs',()=>{
 const roster=[
  unit('magby',240),
  unit('magmar',126,[['magmortar',467]]),
  unit('larvitar',246,[['pupitar',247],['tyranitar',248]]),
  unit('tyranitar',248)
 ];
 const snapshot=JSON.stringify(roster);
 const johto=[
  [240,'magby',[],0,0,0,0,0,0,0,[]],
  [246,'larvitar',[],0,0,0,0,0,0,0,[]],
  [247,'pupitar',[],0,0,0,0,0,0,246,[]],
  [248,'tyranitar',[],0,0,0,0,0,0,247,[]]
 ];
 const groups=buildPokedexFamilies(roster,johto,{});
 assert.equal(groups.rootIndexForIndex[1],0,'Magmar must belong to Magby');
 assert.equal(groups.membersByRoot.get(0).length,2,'Magmortar remains nested in Magmar');
 assert.equal(groups.rootIndexForIndex[3],2,'Tyranitar grouped under Larvitar');
 assert.equal(groups.order.length,2,'Only Magby and Larvitar cards should appear');
 assert.equal(JSON.stringify(roster),snapshot,'Never change the original battle ROSTER');
});

test('Smoochum, Elekid, Tyrogue and Magby families cross generations without changing P2 kits',()=>{
 const roster=[
  unit('jynx',124),unit('electabuzz',125),unit('magmar',126),
  unit('hitmonlee',106),unit('hitmonchan',107),unit('hitmontop',237),
  unit('smoochum',238),unit('elekid',239),unit('magby',240),
  unit('tyrogue',236),unit('electivire',466),unit('magmortar',467),
  unit('pikachu',25),unit('pichu',172)
 ];
 const before=structuredClone(roster);
 const group=buildPokedexFamilies(roster,[],{});
 const root=(id)=>group.rootIndexForIndex[roster.findIndex(p=>p.id===id)];
 for(const [a,b] of [['smoochum','jynx'],['elekid','electabuzz'],
  ['elekid','electivire'],['magby','magmar'],['magby','magmortar'],
  ['tyrogue','hitmonlee'],['tyrogue','hitmonchan'],['tyrogue','hitmontop'],
  ['pichu','pikachu']])
  assert.equal(root(a),root(b),a+' and '+b+' must occupy one family card');
 assert.equal(group.membersByRoot.get(root('smoochum')).length,2);
 assert.equal(group.membersByRoot.get(root('elekid')).length,3);
 assert.equal(group.membersByRoot.get(root('tyrogue')).length,4);
 assert.equal(group.order.length,5,'One card for each of five evolution families');
 // The national list puts the Pikachu lineage at #25 despite its
 // pre-evolution Pichu having Dex #172 (similarly Jynx #124 / Smoochum #238).
 assert.equal(group.order[0],root('pichu'),'sort by earliest National Dex family member');
 assert.ok(group.order.indexOf(root('smoochum'))<group.order.indexOf(root('elekid')));
 assert.deepEqual(roster,before,'Presentation cannot mutate native P2 Pokémon');
});

test('Absent cross-generation forms never generate phantom Pokédex stages',()=>{
 const roster=[unit('smoochum',238),unit('elekid',239),unit('magby',240)];
 const group=buildPokedexFamilies(roster,[],{});
 assert.equal(group.order.length,3);
 assert.ok(group.order.every(i=>group.membersByRoot.get(i).length===1),
  'Do not invent Jynx/Electabuzz/Magmar if not installed in ROSTER');
});
