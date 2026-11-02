/* Kanto 001-151: actual PMD animations, available moves and search. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const ver=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,ver,p)));
const {ROSTER,buscar}=await load('datos.js');
const {KANTO_151,KANTO_151_IDS,kanto151SlotPlan}=await load('torre2/all-kanto-species.js');
const {KANTO_LEVEL_EVOLUTIONS}=await load('torre2/frlg-learnsets.js');
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
   // Transform remains Ditto's ONLY canonical FireRed level-up move.
   // The campaign now supplies four weak, uniquely identified training
   // controls to meet the user's 3-at-Lv5 / ULT-at-Lv8 requirement.
   // Never let Ditto borrow another species' full-power native attacks.
   assert.equal(equipped.length,4,'Ditto must have four usable practice controls');
   assert.ok(equipped.every(slot=>kit[slot].torre2IntroPractice===true&&
    kit[slot].dano<=12),'Ditto cannot borrow unrelated full-power attacks');
  }else assert.ok(equipped.length>=1,'No real move at all: '+p.id);
  // T13 uses a real installed P2 dash/flight ESP, not necessarily 'Dodge'.
  assert.ok(['dash','vuelo'].includes(kit.esp?.forma),
   'Missing real native campaign ESP: '+p.id);
  assert.ok(Number.isFinite(kit.esp.cd)&&kit.esp.cd>0,
   'Invalid real ESP cooldown: '+p.id);
  assert.ok(!equipped.some(slot=>kit[slot]?.nombre===kit.esp.nombre),
   'ESP duplicates equipped attack: '+p.id);
  const e=etapa?def.evoluciones[etapa-1]:def;
  assert.ok([e.hp,e.vel,e.atk,e.def].every(Number.isFinite),
   'No invalid NaN stat allowed: '+p.id);
 }
}

// Non-campaign evolution stages must produce REAL usable battle moves.
// Pokédex shows exactly these stage.kit entries, not the campaign loadout.
const roleSlots=['lmb','rmb','q','e'];
const name=h=>String(h?.nombre||'').toLowerCase();
let totalEvolutions=0,changedEvolutions=0;
for(const def of ROSTER){
 if(!def.evoluciones?.length)continue;
 const family=new Map([[def.id,def],
  ...def.evoluciones.map(e=>[String(e.nombre||'').toLowerCase(),e])]);
 for(const stage of def.evoluciones){
  const id=String(stage.nombre||'').toLowerCase();
  if(!KANTO_151_IDS.includes(id)||!KANTO_LEVEL_EVOLUTIONS[id])continue;
  totalEvolutions++;
  const parent=family.get(KANTO_LEVEL_EVOLUTIONS[id]?.[0])||def;
  const parentKit={...(def.kit||{}),...(parent.kit||{})};
  const realKit={...parentKit,...(stage.kit||{})};
  if(roleSlots.some(slot=>name(realKit[slot])!==name(parentKit[slot])))
   changedEvolutions++;
  for(const slot of roleSlots){
   if(!realKit[slot]?.nombre)continue;
   assert.ok(realKit[slot].forma&&!realKit[slot].pendiente,
    'Evolved '+id+' must have real unlocked attack for '+slot);
  }
  // Native Poké Arena has species-specific defensive actions (e.g.
  // Charizard's Flying dodge = 'vuelo'). Keep EXACT original action,
  // never force every evolution to use the generic Kanto 'dash'.
  const expectedDodge=stage.torre2OriginalKit?.esp?.forma||
   parentKit.esp?.forma||'dash';
  assert.equal(realKit.esp?.forma,expectedDodge,
   'Evolution must preserve its original non-damaging Dodge: '+id);
 }
}
assert.ok(totalEvolutions>=60,'Must cover all Kanto evolution species');
assert.ok(changedEvolutions>=45,
 'Most Kanto evolutions must replace at least one attack, not clone their base forms');
const diglett=ROSTER.find(p=>p.id==='diglett');
assert.ok(diglett,'Diglett family absent');
const dugtrio=diglett.evoluciones.find(e=>e.nombre.toLowerCase()==='dugtrio');
assert.equal(dugtrio.kit.q?.nombre,'Tri Attack','Dugtrio HAB 3 must be Tri Attack');
assert.equal(dugtrio.kit.q?.forma,'torre2_triattack','Use real approved Tri Attack FX');
assert.notEqual(diglett.kit.q?.nombre,'Tri Attack','Diglett must not inherit its future form');
console.log('PASS: 151 Kanto Pokémon with real PMD sprites, '+changedEvolutions+'/'+totalEvolutions+' improved evolutions, four attacks and working evolution tabs.');
