/* T07 Fire Blast: compiled real Poké Arena client, not a natural campaign. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [{TEST_LIBRARY,availableMoves,moveUnlockLevel,equipMove,resolveLoadout,
 selectedMoves,campaignLearnset,KANTO_FIRE_BLAST_LEVEL,KANTO_FIRE_BLAST_SPECIES},
 {FRLG_MACHINES,frlgMachineCompatible}, {buscar}]
 =await Promise.all([
  load('torre2/move-pool.js'),load('torre2/frlg-learnsets.js'),load('datos.js')
 ]);
const member=(id,level,tmMoves=[])=>({id,
 progression:{species:id,level},tmMoves});
const blast=TEST_LIBRARY.find(m=>m.id==='fire-blast');
assert.ok(blast?.forma,'Fire Blast must reuse captured existing renderer');
assert.equal(blast.source,'arena2d-original','Do not replace the approved P2 VFX');
assert.equal(TEST_LIBRARY.length,227,'Do not grow the 227-move catalog');
assert.equal(KANTO_FIRE_BLAST_LEVEL,50);
assert.equal(KANTO_FIRE_BLAST_SPECIES.length,12);
for(const species of KANTO_FIRE_BLAST_SPECIES){
 assert.ok(frlgMachineCompatible(species,'fire-blast'),
  'Never hand out Fire Blast to incompatible Pokémon: '+species);
 assert.ok((buscar(species).def?.tipos||[]).includes('FIRE')||
   (buscar(species).def?.evoluciones||[]).some(e=>e.nombre?.toLowerCase()===species&&e.tipos?.includes('FIRE')),
  'Fire Blast adaptation must only cover real Fire-type species: '+species);
 for(const level of [5,8,13,34,49]){
  assert.ok(!availableMoves(member(species,level)).some(m=>m.id==='fire-blast'),
   species+' illegally knows Fire Blast Lv'+level);
  assert.ok(!availableMoves(member(species,level,['fire-blast'])).some(m=>m.id==='fire-blast'),
   species+' bypassed level gate with old saved TM record at Lv'+level);
  assert.equal(equipMove(member(species,level),2,'fire-blast'),false);
 }
 const at50=member(species,50);
 const move=availableMoves(at50).find(m=>m.id==='fire-blast');
 assert.ok(move?.forma,species+' has no Fire Blast Lv50 renderer');
 assert.equal(move.forma,blast.forma,'Native renderer must not change');
 assert.equal(move.cd,blast.cd,'Approved cooldown must not change');
 assert.equal(moveUnlockLevel(at50,'fire-blast'),50);
 assert.equal(campaignLearnset(species).find(m=>m.id==='fire-blast')?.level,50);
 const oldKit=selectedMoves(at50);
 const initial=selectedMoves(at50);
 // Some native Poké Arena kits already equip Fire Blast as their ULT.
 // Do not force a duplicate into HAB3; preserve the owner's chosen slots.
 if(!initial.includes('fire-blast')){
  assert.ok(equipMove(at50,2,'fire-blast'),
   species+' must allow manual selection in HAB 3 once Lv50');
  assert.equal(at50.movePlanSpecies,species,'Save must track current species');
  assert.equal(at50.moves?.[2],'fire-blast','Manual loadout must persist');
 }else{
  console.log('FIRE_BLAST_ALREADY_EQUIPPED',species,
   JSON.stringify({slot:initial.indexOf('fire-blast'),loadout:initial}));
 }
 const blastSlot=selectedMoves(at50).indexOf('fire-blast');
 assert.ok(blastSlot>=0,species+' cannot equip its legal Fire Blast');
 const slot=['lmb','rmb','q','e'][blastSlot];
 assert.equal(resolveLoadout(at50)[slot]?.id,'fire-blast',
  species+' must equip the original native Fire Blast in battle');
 const again={...at50,moves:at50.moves?.length?[...at50.moves]:undefined};
 assert.equal(resolveLoadout(again)[slot]?.id,'fire-blast',
  species+' existing/manual selection must survive reload');
 console.log('FIRE_BLAST_KANTO',species,
  JSON.stringify({firstLevel:50,forma:move.forma,cd:move.cd,
   manualEquipped:true,previousSlots:oldKit}));
}
for(const species of ['bulbasaur','pikachu','squirtle','magikarp']){
 assert.equal(KANTO_FIRE_BLAST_SPECIES.includes(species),false);
 assert.ok(!availableMoves(member(species,50)).some(m=>m.id==='fire-blast'),
  'Not a free level-50 bonus for non-Fire Pokémon: '+species);
}
assert.ok(availableMoves(member('charizard',50)).some(m=>m.id==='fire-blast'));
console.log('PASS_T07_NATIVE_FIRE_BLAST_12_SPECIES_LV50_FIXTURES');
