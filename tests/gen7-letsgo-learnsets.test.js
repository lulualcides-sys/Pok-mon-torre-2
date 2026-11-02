import test from 'node:test';
import assert from 'node:assert/strict';
import {GEN7_LETSGO_LEVEL_UP,gen7LetsGoUnlockLevel}
 from '../tools/pokearena/torre2-gen7-letsgo-learnsets.js';
import {gen5KantoUnlockLevel} from '../tools/pokearena/torre2-gen5-existing-levels.js';

test('Gen7 Lets Go: 151 Kanto species have legitimate level-up entries',()=>{
 assert.equal(Object.keys(GEN7_LETSGO_LEVEL_UP).length,151);
 for(const [species,moves] of Object.entries(GEN7_LETSGO_LEVEL_UP)){
  assert.ok(Object.keys(moves).length>0,species);
  for(const [name,level] of Object.entries(moves)){
   assert.match(name,/^[a-z0-9]+$/,species+' '+name);
   assert.ok(Number.isInteger(level)&&level>=0&&level<=100,species+' '+name);
  }
 }
});
test('Ponyta and Rapidash: exact Gen7 levels; Flare Blitz metadata is not a renderer',()=>{
 assert.equal(gen7LetsGoUnlockLevel('ponyta','double-kick'),15);
 assert.equal(gen7LetsGoUnlockLevel('ponyta','Flare Blitz'),51);
 assert.equal(gen7LetsGoUnlockLevel('rapidash','flare-blitz'),65);
 assert.equal(gen7LetsGoUnlockLevel('ponyta','flame-charge'),null);
 assert.equal(gen7LetsGoUnlockLevel('ponyta','flame-wheel'),null);
});
test('Gen7 level-up is species-specific, no TMs or invented universal attacks',()=>{
 assert.equal(gen7LetsGoUnlockLevel('magikarp','thunderbolt'),null);
 assert.equal(gen7LetsGoUnlockLevel('bulbasaur','thunderbolt'),null);
 assert.equal(gen7LetsGoUnlockLevel('ponyta','protect'),null);
 assert.equal(gen7LetsGoUnlockLevel('charmander','double-kick'),null);
 assert.equal(gen7LetsGoUnlockLevel('not-a-pokemon','tackle'),null);
});

test('Gen V Black/White confirmed: Ponyta/Rapidash Flame Charge 21 and Flare Blitz 49',()=>{
 for(const species of ['ponyta','rapidash']){
  assert.equal(gen5KantoUnlockLevel(species,'flame-charge'),21);
  assert.equal(gen5KantoUnlockLevel(species,'flare-blitz'),49);
  assert.equal(gen5KantoUnlockLevel(species,'Flare Blitz'),49);
 }
 assert.equal(gen5KantoUnlockLevel('charmander','flame-charge'),null);
 assert.equal(gen5KantoUnlockLevel('ponyta','fire-spin'),null);
});
