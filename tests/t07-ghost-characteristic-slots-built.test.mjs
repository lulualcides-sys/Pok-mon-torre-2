/* T07 ghost signature regression: a learned Confuse Ray must not be evicted
 * when the player legally teaches Shadow Ball. No new VFX or auto-granted TM.
 * Species, level and taught TM are fixtures, not a naturally played run.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{availableMoves,selectedMoves,resolveLoadout,TEST_LIBRARY},
 {frlgMachineCompatible}]=await Promise.all([
 load('torre2/move-pool.js'),load('torre2/frlg-learnsets.js')
]);
for(const id of ['gastly','haunter','gengar']){
 assert.ok(frlgMachineCompatible(id,'shadow-ball'),id+' TM30 incompatible');
 const member={id,progression:{species:id,level:50},tmMoves:['shadow-ball']};
 const available=availableMoves(member);
 assert.ok(available.some(m=>m.id==='confuse-ray'),id+' missing learned Confuse Ray');
 assert.ok(available.some(m=>m.id==='shadow-ball'),id+' missing taught TM30');
 const selected=selectedMoves(member);
 assert.ok(selected.includes('confuse-ray'),id+' lost Confuse Ray to HAB slot collision');
 assert.ok(selected.includes('shadow-ball'),id+' lost taught Shadow Ball');
 assert.equal(new Set(selected.filter(Boolean)).size,selected.filter(Boolean).length,
  id+' duplicate equipped VFX');
 const kit=resolveLoadout(member);
 const active=Object.values(kit).filter(m=>m?.id);
 for(const key of ['confuse-ray','shadow-ball']){
  assert.ok(active.some(m=>m.id===key&&m.forma),id+' native battle lost '+key);
  assert.ok(TEST_LIBRARY.some(m=>m.id===key),'Invented '+key);
 }
 console.log('T07_GHOST_SIGNATURE_PASS',JSON.stringify({id,selected}));
}
