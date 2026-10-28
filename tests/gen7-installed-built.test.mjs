/* Gen7 Lets Go adds only installed, approved Kanto attacks to the real
 * generated Phaser module. FRLG, tutorial levels, TMs and saves stay intact. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [{GEN7_LETSGO_LEVEL_UP,gen7LetsGoUnlockLevel},
 {availableMoves,moveUnlockLevel,campaignLearnset,TEST_LIBRARY,resolveLoadout},
 {frlgUnlockLevel,frlgMachineCompatible}]
 =await Promise.all([load('torre2/gen7-letsgo-learnsets.js'),
  load('torre2/move-pool.js'),load('torre2/frlg-learnsets.js')]);
const member=(id,level,tmMoves=[])=>({id,progression:{species:id,level},tmMoves});
assert.equal(Object.keys(GEN7_LETSGO_LEVEL_UP).length,151);
assert.equal(gen7LetsGoUnlockLevel('ponyta','double-kick'),15);
assert.equal(frlgUnlockLevel('ponyta','double-kick'),null);
assert.ok(!frlgMachineCompatible('ponyta','double-kick'));
assert.ok(TEST_LIBRARY.some(x=>x.id==='double-kick'&&x.forma&&x.approved===true),
 'Ponyta may use Gen7 Double Kick ONLY because existing approved renderer exists');
assert.ok(!availableMoves(member('ponyta',5)).some(x=>x.id==='double-kick'),
 'Lv5 tutorial must not auto-equip Gen7 Double Kick');
assert.ok(!availableMoves(member('ponyta',14)).some(x=>x.id==='double-kick'),
 'Gen7 Double Kick must remain locked before actual level 15');
assert.ok(availableMoves(member('ponyta',15)).some(x=>x.id==='double-kick'),
 'Existing Double Kick should become available at Gen7 Lv15');
assert.equal(moveUnlockLevel(member('ponyta',15),'double-kick'),15);
assert.equal(campaignLearnset('ponyta').find(x=>x.id==='double-kick')?.level,15);
assert.ok(!availableMoves(member('rapidash',39)).some(x=>x.id==='double-kick'),
 'Evolved species cannot unlock its Gen7 attacks before evolution');
assert.ok(availableMoves(member('rapidash',40)).some(x=>x.id==='double-kick'));
assert.equal(moveUnlockLevel(member('rapidash',40),'double-kick'),40);
// Do not guess which moves the online client contains: inspect the REAL
// captured catalogue. Each original attack is legal only at the audited
// Gen V level, and an absent/pending renderer cannot be synthesized.
const installedFire=TEST_LIBRARY.filter(x=>['flare-blitz','flame-charge'].includes(x.id));
console.log('REAL_CLIENT_FIRE_MOVES',JSON.stringify(installedFire.map(x=>({
 id:x.id,name:x.nombre,source:x.source,approved:x.approved===true,forma:x.forma
}))));
for(const [key,unlock] of [['flame-charge',21],['flare-blitz',49]]){
 const found=installedFire.find(x=>x.id===key&&x.forma&&
  (x.source!=='new-phaser-fx'||x.approved===true));
 assert.ok(!availableMoves(member('ponyta',unlock-1)).some(x=>x.id===key),
  key+' cannot be unlocked before its authentic Gen V level');
 assert.equal(availableMoves(member('ponyta',unlock)).some(x=>x.id===key),
  Boolean(found),key+' can only unlock when an approved native VFX exists');
 if(found){
  assert.equal(moveUnlockLevel(member('ponyta',unlock),key),unlock);
  assert.ok(campaignLearnset('ponyta').some(x=>x.id===key&&x.level===unlock));
  assert.ok(!availableMoves(member('rapidash',39)).some(x=>x.id===key));
  assert.ok(availableMoves(member('rapidash',50)).some(x=>x.id===key));
 }
}
assert.ok(!availableMoves(member('bulbasaur',70)).some(x=>x.id==='thunderbolt'),
 'A level-up table must not leak incompatible moves between species');
assert.ok(!availableMoves(member('bulbasaur',70)).some(x=>x.id==='protect'),
 'A later-generation TM must not become a free move');
assert.ok(availableMoves(member('bulbasaur',70,['protect'])).some(x=>x.id==='protect'),
 'FireRed taught compatible TM still works');
assert.equal(frlgUnlockLevel('charmander','metal-claw'),13);
assert.ok(!availableMoves(member('charmander',5)).some(x=>x.id==='metal-claw'));
assert.equal(resolveLoadout(member('ponyta',5)).e?.torre2IntroPractice??false,false,
 'Early Lv5 ultimate must remain locked');
assert.ok(resolveLoadout(member('ponyta',8)).e,
 'Lv8 must preserve its weak tutorial ultimate');
console.log('PASS Gen7 installed-only Ponyta/Rapidash, FRLG compatibility, 151 species, no new VFX or early ultimate');
