import test from 'node:test';
import assert from 'node:assert/strict';
import {PLATINUM_EXISTING_LEVELS,platinumInstalledUnlockLevel}
 from '../tools/pokearena/torre2-platinum-existing-levels.js';

test('Platinum: Ponyta only unlocks already installed Flame Wheel at level 15',()=>{
 assert.equal(platinumInstalledUnlockLevel('ponyta','flame-wheel'),null);
 assert.equal(platinumInstalledUnlockLevel('ponyta','flame-wheel',{installed:true}),15);
 assert.equal(platinumInstalledUnlockLevel('ponyta','ember',{installed:true}),10);
 assert.equal(platinumInstalledUnlockLevel('ponyta','fire-blast',{installed:true}),37);
});
test('Rapidash never borrows level-up attacks before its evolution at level 40',()=>{
 const check=move=>platinumInstalledUnlockLevel('rapidash',move,{
  installed:true,evolutionLevel:40
 });
 assert.equal(check('flame-wheel'),40);
 assert.equal(check('fire-blast'),40);
 assert.equal(check('fury-attack'),40);
 assert.equal(check('bounce'),47);
});
test('No invented Flare Blitz, breeding moves, late-generation attacks, other species or TMs',()=>{
 for(const species of ['ponyta','rapidash']){
  for(const name of ['flare-blitz','double-kick','steel-beam','protect','poison-jab'])
   assert.equal(platinumInstalledUnlockLevel(species,name,{installed:true,evolutionLevel:40}),null);
  assert.equal('flare-blitz' in PLATINUM_EXISTING_LEVELS[species],false);
 }
 assert.equal(platinumInstalledUnlockLevel('charmander','flame-wheel',{installed:true}),null);
});
test('Platinum metadata does not mutate installed attack properties or chosen slots',()=>{
 const original={id:'flame-wheel',dano:12,cd:4.2,forma:'approved-renderer'};
 const before=JSON.stringify(original);
 assert.equal(platinumInstalledUnlockLevel('ponyta',original.id,{installed:true}),15);
 assert.equal(JSON.stringify(original),before);
 assert.equal(Object.isFrozen(PLATINUM_EXISTING_LEVELS.ponyta),true);
});
