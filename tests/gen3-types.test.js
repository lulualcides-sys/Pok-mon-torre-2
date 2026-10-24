import test from 'node:test';
import assert from 'node:assert/strict';
import {GEN3_TYPES,GEN3_CHART,gen3Effectiveness as effect,gen3Category,gen3Stab,gen3BurnModifier,gen3Types} from '../tools/pokearena/torre2-gen3-types.js';
test('all 289 single-type and 4913 ordered dual-type combinations are bounded and compose correctly',()=>{
 assert.equal(GEN3_TYPES.length,17);
 for(const attack of GEN3_TYPES)for(const first of GEN3_TYPES){
  assert.ok([0,.5,1,2].includes(effect(attack,[first])));
  for(const second of GEN3_TYPES){
   const expected=effect(attack,[first])*(first===second?1:effect(attack,[second]));
   assert.equal(effect(attack,[first,second]),expected);
  }
 }
 assert.equal(Object.keys(GEN3_CHART).length,17);
});
test('FRLG immunities and pre-generation-VI Steel resistances',()=>{
 for(const [a,b] of [['NORMAL','GHOST'],['FIGHTING','GHOST'],['GHOST','NORMAL'],['ELECTRIC','GROUND'],['GROUND','FLYING'],['POISON','STEEL'],['PSYCHIC','DARK']])assert.equal(effect(a,[b]),0);
 assert.equal(effect('GHOST',['STEEL']),.5);assert.equal(effect('DARK',['STEEL']),.5);
 assert.equal(effect('ROCK',['FIRE','FLYING']),4);
 assert.equal(effect('GRASS',['FIRE','FLYING']),.25);
 assert.equal(effect('ELECTRIC',['WATER','GROUND']),0);
});
test('Gen III category, species types, STAB and physical burn penalty',()=>{
 assert.equal(gen3Category('GHOST'),'PHYSICAL');assert.equal(gen3Category('DARK'),'SPECIAL');
 assert.deepEqual(gen3Types(['PSYCHIC','FAIRY']),['PSYCHIC']);assert.deepEqual(gen3Types(['FAIRY']),['NORMAL']);
 assert.equal(gen3Stab('FIRE',['FIRE','FLYING']),1.5);assert.equal(gen3Stab('WATER',['FIRE']),1);
 assert.equal(gen3BurnModifier('GHOST',{quemado:{}}),.5);assert.equal(gen3BurnModifier('DARK',{quema:{}}),1);
});
