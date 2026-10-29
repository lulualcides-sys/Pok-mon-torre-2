import test from 'node:test';
import assert from 'node:assert/strict';
import {GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP,gen45KantoUnlockLevel}
 from '../tools/pokearena/torre2-gen45-kanto-learnsets.js';
import {FRLG_LEVEL_UP} from '../tools/pokearena/torre2-frlg-learnsets.js';
const expected=Object.keys(FRLG_LEVEL_UP).sort();
test('PokeAPI factual Gen IV HGSS and Gen V B2W2 learnsets cover 151 Kanto species',()=>{
 for(const [source,table] of Object.entries({HGSS:GEN4_HGSS_KANTO_LEVEL_UP,B2W2:GEN5_B2W2_KANTO_LEVEL_UP})){
  assert.deepEqual(Object.keys(table).sort(),expected,source);
  let rows=0;
  for(const [species,moves] of Object.entries(table)){
   assert.ok(Object.keys(moves).length>0,'no level-up metadata: '+species);
   for(const [move,level] of Object.entries(moves)){
    assert.match(move,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(Number.isInteger(level)&&level>=0&&level<=100,source+species+move);
    rows++;
   }
  }
  assert.ok(rows>=1800,source+' missing source rows: '+rows);
 }
});
test('Exact HGSS/B2W2 examples, no borrowed species and inherited evolutions',()=>{
 assert.equal(GEN4_HGSS_KANTO_LEVEL_UP.charmander['fire-fang'],25);
 assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.charmander['flame-burst'],28);
 assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.squirtle['aqua-tail'],28);
 assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.pikachu['electro-ball'],18);
 assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.ponyta['flame-charge'],21);
 assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.ponyta['flare-blitz'],49);
 assert.equal(gen45KantoUnlockLevel('charmander','fire fang'),25);
 assert.equal(gen45KantoUnlockLevel('charizard','fire fang'),25);
 assert.equal(gen45KantoUnlockLevel('ponyta','Flame Charge'),21);
 assert.equal(gen45KantoUnlockLevel('rapidash','Flare Blitz'),49);
 assert.equal(gen45KantoUnlockLevel('magikarp','Thunderbolt'),null);
 assert.equal(gen45KantoUnlockLevel('bulbasaur','Flare Blitz'),null);
 assert.equal(gen45KantoUnlockLevel('missing-pokemon','Flame Charge'),null);
});
