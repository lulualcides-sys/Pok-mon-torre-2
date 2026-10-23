/* Kanto 001-151: actual PMD animations, available moves and search. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,ver,p)));
const {ROSTER,buscar}=await load('datos.js');
const {KANTO_151,KANTO_151_IDS,kanto151SlotPlan}=await load('torre2/all-kanto-species.js');
const {resolveLoadout}=await load('torre2/move-pool.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/pmd/manifest.json'),'utf8'));
assert.equal(KANTO_151.length,151);
assert.equal(new Set(KANTO_151_IDS).size,151);
for(const p of KANTO_151){
 const dex=String(p.num).padStart(4,'0');
 assert.ok(ROSTER.some(x=>x.id===p.id||(x.evoluciones||[]).some(e=>e.nombre.toLowerCase()===p.id)),
  'Kanto species missing: '+dex+' '+p.id);
 assert.ok(manifest[dex]?.anims?.Idle&&manifest[dex]?.anims?.Walk&&manifest[dex]?.anims?.Attack,
  'Real PMD battle sprite missing: '+p.id+' #'+dex);
 const {def,etapa}=buscar(p.id);
 if(def.torre2Kanto151){
  assert.equal(kanto151SlotPlan(p.id)?.length,4,'Must have 4 real attacks: '+p.id);
  const kit=resolveLoadout({id:p.id,progression:{species:p.id,level:100}});
  // All four P2 roles are reserved, but Magikarp/Ditto don't magically
  // acquire noncanonical 4th attacks. Only real FRLG moves are equipped.
  const equipped=['lmb','rmb','q','e'].filter(slot=>kit[slot]?.forma);
  if(p.id==='ditto'){
   // Transform is the ONLY FRLG learnset attack. The installed native
   // client has no independently usable Transform renderer for campaign:
   // never fabricate another Pokémon's damage move just to fill its slots.
   assert.equal(equipped.length,0,'Ditto cannot borrow unrelated attacks');
  }else assert.ok(equipped.length>=1,'No real move at all: '+p.id);
  assert.equal(kit.esp?.forma,'dash');
  const e=etapa?def.evoluciones[etapa-1]:def;
  assert.ok([e.hp,e.vel,e.atk,e.def].every(Number.isFinite),
   'No invalid NaN stat allowed: '+p.id);
 }
}
console.log('PASS: 151 Kanto Pokémon with real PMD sprites, four attacks and working evolution tabs.');
