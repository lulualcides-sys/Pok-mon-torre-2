/* T08: native P2 role plans must never equip the same real move twice.
 * Uses the versioned Phaser catalogue, not an independent synthetic pool.
 * We preserve every existing renderer, TM restriction and player save.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [{KANTO_151},{availableMoves,defaultLoadout,selectedMoves,
 resolveLoadout,TEST_LIBRARY,canonicalMoveKey}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js')
]);
const make=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
assert.equal(new Set(TEST_LIBRARY.map(x=>x.id)).size,227);
let tested=0,chosenMoves=0;
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // independent original battle laboratory
 for(const level of [5,8,11,13,20,25,30,40,50]){
  const member=make(id,level);
  const available=availableMoves(member),names=new Set(available.map(m=>m.id));
  const loadout=resolveLoadout(member);
  const selected=['lmb','rmb','q','e'].map(s=>loadout[s]).filter(Boolean);
  assert.equal(selected.length,level<8?3:4,
   id+' Lv'+level+' has missing battle controls');
  assert.equal(new Set(selected.map(m=>m.id)).size,selected.length,
   id+' Lv'+level+' duplicates a native move in two slots');
  for(const move of selected){
   assert.ok(move.forma&&!move.pendiente,id+' Lv'+level+' missing renderer');
   // resolveKantoIntro may retain a pre-existing native P2 evolved-form
   // action (e.g. Ninetales Confuse Ray) outside the generic move editor.
   // This test only forbids invented effects and duplicated active IDs.
   assert.ok(move.torre2IntroPractice||TEST_LIBRARY.some(x=>x.id===move.id),
    id+' Lv'+level+' equipped an effect missing from the approved client');
  }
  tested++;chosenMoves+=selected.length;
 }
}
const squirtle=make('squirtle',50);
const squirtleSelected=selectedMoves(squirtle);
assert.ok(squirtleSelected.includes('bubble-beam'));
assert.ok(squirtleSelected.includes('hydro-pump'));
assert.ok(!squirtleSelected.some((x,i)=>squirtleSelected.indexOf(x)!==i));
assert.ok(squirtleSelected.includes('bite'),
 'An approved species-legal alternative must replace repeated Bubble Beam');
assert.ok(!squirtleSelected.includes('surf'),
 'Do not auto-equip the previously rejected Surf effect');
const egg=selectedMoves(make('exeggcute',50));
assert.equal(new Set(egg).size,4,'Exeggcute Barrage duplicated');
const fish=selectedMoves(make('magikarp',50));
assert.equal(new Set(fish).size,4,'Magikarp should use weak Struggle fallback instead of duplicate Tackle');
// Existing saves are immutable until the explicit save-first equip action;
// the battle and summary safely resolve old duplicate slots at read time.
const legacy=make('squirtle',50);
legacy.moves=['water-gun','bubble-beam','bubble-beam','hydro-pump'];
legacy.movePlanSpecies='squirtle';
const before=JSON.stringify(legacy.moves);
const fixed=selectedMoves(legacy);
assert.equal(new Set(fixed).size,4,'Legacy save still displays duplicate moves');
assert.equal(JSON.stringify(legacy.moves),before,'Read-time repair mutated saved choices');
assert.equal(resolveLoadout(legacy).q?.id,'bubble-beam');
assert.ok(fixed.every(x=>availableMoves(legacy).some(m=>m.id===x)),
 'Legacy repair equipped a move the Pokémon cannot learn');
assert.ok(resolveLoadout(make('bulbasaur',8)).e?.torre2IntroPractice,
 'Do not alter the Lv8 weak ULT cap');
const m=make('ponyta',49),kit=resolveLoadout(m);
assert.equal(kit.q?.id,'flare-blitz','Ponyta native signature must remain');
assert.equal(kit.rmb?.id,'flame-charge','Ponyta learned signature must remain');
console.log('PASS_T08_KANTO_UNIQUE_NATIVE_SLOTS',JSON.stringify({
 species:150,installed:TEST_LIBRARY.length,fixtures:tested,
 checkedEquipped:chosenMoves,levelSamples:[5,8,11,13,20,25,30,40,50],
 corrected:['squirtle','exeggcute','magikarp'],legacySavePreserved:true
}));
