/* T08: the Lv9 editor must not equip the SAME installed technique twice
 * under a tutorial-preview ID and a genuine native ID. A legal native
 * upgrade rehomes an obsolete preview instead of silently duplicating it.
 * This is a compiled
 * resolver fixture, NOT XP earned through a natural trainer battle.
 * ULT (E) remains a separate, energy-gated action by design.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{KANTO_151},{availableMoves,selectedMoves,equipMove,canonicalMoveKey}]=
 await Promise.all([load('torre2/all-kanto-species.js'),load('torre2/move-pool.js')]);
const slots=['lmb','rmb','q','e'];
const technique=m=>canonicalMoveKey(m?.torre2IntroSource||m?.nombre);
let duplicateAttempts=0,autoRehomed=0,rejected=0,legalReplacements=0;
const examples=[];
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // unrestricted laboratory character
 const member={id,progression:{species:id,level:9},tmMoves:[]};
 const pool=availableMoves(member);
 const preview=slots.map(slot=>pool.find(m=>m.torre2IntroSlot===slot));
 assert.ok(preview.every(Boolean),id+' missing tutorial move at Lv9');
 const originals=preview.map(m=>m.id);
 member.moves=[...originals];
 member.movePlanSpecies=id;
 assert.deepEqual(selectedMoves(member),originals,id+' preview fixture drift');
 for(let from=0;from<3;from++){
  const native=pool.find(m=>!m.torre2IntroPractice&&m.id!==preview[from].id&&
   technique(m)===technique(preview[from]));
  if(!native)continue;
  // The genuine technique is NOT currently equipped by ID; the collision
  // would have been accepted before this fix, because preview IDs differ.
  assert.ok(!originals.includes(native.id),id+' native ID unexpectedly equipped');
  const target=(from+1)%3;
  member.moves=[...originals];member.movePlanSpecies=id;
  const equipped=equipMove(member,target,native.id);
  if(equipped){
   assert.equal(member.moves[target],native.id,id+' native equip was lost');
   const now=member.moves.map(moveId=>pool.find(m=>m.id===moveId));
   assert.notEqual(technique(now[from]),technique(now[target]),
    id+' left duplicate native/practice names in HAB slots');
   assert.ok(now[from]?.forma,'Replacement must use installed renderer');
   assert.ok(pool.some(m=>m.id===now[from].id),
    'Replacement cannot invent a new move');
   autoRehomed++;
  }else{
   assert.deepEqual(member.moves,originals,id+' rejected equip changed save');
   rejected++;
  }
  assert.equal(member.movePlanSpecies,id);
  duplicateAttempts++;
  if(examples.length<12)examples.push({id,from:slots[from],target:slots[target],
   native:native.id,practice:preview[from].id,equipped});
 }
 // Replacing the preview IN ITS OWN SLOT is still permitted when another
 // basic slot does not already use the same underlying technique.
 for(let from=0;from<3;from++){
  const native=pool.find(m=>!m.torre2IntroPractice&&
   technique(m)===technique(preview[from])&&
   preview.every((p,i)=>i===from||technique(p)!==technique(m)));
  if(!native)continue;
  member.moves=[...originals];member.movePlanSpecies=id;
  assert.equal(equipMove(member,from,native.id),true,
   id+' must be able to upgrade its own preview slot');
  assert.equal(member.moves[from],native.id);
  assert.equal(member.movePlanSpecies,id);
  legalReplacements++;
  break;
 }
}
assert.ok(duplicateAttempts>0,'No genuine native/preview alias was exercised');
assert.ok(legalReplacements>0,'No legal in-place upgrade was exercised');
assert.ok(autoRehomed>0,'No native upgrade rehomed its obsolete preview');
console.log('T08 EQUIVALENT PRACTICE/NATIVE EDITOR GUARD PASS',
 JSON.stringify({species:150,duplicateAttempts,autoRehomed,rejected,legalReplacements,examples}));
