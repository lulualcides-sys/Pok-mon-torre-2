/* T08 — 151 Kanto species battle-only starter safety, not a natural route run.
 * Uses the real versioned Phaser build and the installed approved move library.
 * Checks early level gates without mutating original move sprites or animations.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{KANTO_151},{resolveLoadout,availableMoves,TEST_LIBRARY},
 {KANTO_INTRO}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
 load('torre2/kanto-intro-moves.js')
]);
assert.equal(KANTO_151.length,151);
const slots=['lmb','rmb','q'];
const report={checked:0,levels:[5,7,8],exempt:['mewtwo'],
 failures:[],weakLimit:KANTO_INTRO.maxStarterDamage,ultLimit:KANTO_INTRO.maxIntroUltDamage};
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // The explicit Lv50 QA Mewtwo intentionally has no locks.
 for(const level of report.levels){
  const member={id,progression:{species:id,level},tmMoves:[]};
  const availableBefore=availableMoves(member).map(x=>x.id).sort();
  const kit=resolveLoadout(member);
  for(const slot of slots){
   const move=kit[slot];
   assert.ok(move?.forma,id+' Lv'+level+' missing rendered '+slot);
   assert.notEqual(move.pendiente,true,id+' Lv'+level+' locked '+slot);
   assert.ok(Number.isFinite(move.dano)&&move.dano>=0&&
     move.dano<=KANTO_INTRO.maxStarterDamage,
    id+' Lv'+level+' strong tutorial attack '+slot+': '+move.nombre+' / '+move.dano);
   assert.ok(move.torre2IntroPractice===true,
    id+' Lv'+level+' must use battle-only weak practice slot '+slot);
  }
  assert.equal(new Set(slots.map(slot=>kit[slot].id)).size,3,
   id+' Lv'+level+' must expose three independent controls');
  if(level<8)assert.equal(kit.e,undefined,
   id+' Lv'+level+' must not have an ultimate before Lv8');
  else{
   assert.equal(kit.e?.ulti,true,id+' Lv8 ultimate must exist');
   assert.equal(kit.e?.pendiente,false,id+' Lv8 ultimate cannot be locked');
   assert.ok(Number.isFinite(kit.e?.dano)&&kit.e.dano<=KANTO_INTRO.maxIntroUltDamage,
    id+' Lv8 ULT too powerful '+kit.e?.nombre);
   assert.ok(kit.e?.torre2IntroPractice,id+' Lv8 ULT must be temporary training-only');
  }
  assert.deepEqual(availableMoves(member).map(x=>x.id).sort(),availableBefore,
   id+' Lv'+level+' overlay must not unlock a permanent learnset move');
  assert.ok(Object.values(kit).every(m=>m?.forma&&
   (m.torre2IntroPractice||TEST_LIBRARY.some(k=>k.forma===m.forma)||
    m.forma==='dash')),
   id+' Lv'+level+' must reuse installed renderers, not synthetic VFX');
 }
 report.checked++;
}
// The verified HGSS/Let's Go Lv1 Tackle is an authentic Ponyta option.
// Previously its third Lv5 button was an invented Struggle duplicate because
// only FRLG/curated early entries were considered for training previews.
const ponyta5=resolveLoadout({id:'ponyta',progression:{species:'ponyta',level:5},tmMoves:[]});
const ponytaSources=['lmb','rmb','q'].map(slot=>ponyta5[slot]?.torre2IntroSource);
assert.ok(ponytaSources.includes('tackle'),'Ponyta must preview its verified installed Tackle');
assert.ok(ponytaSources.includes('ember'),'Ponyta must keep its approved weak Ember preview');
assert.ok(ponytaSources.includes('quick-attack'),'Ponyta must keep native Quick Attack');
assert.ok(!ponytaSources.includes('struggle'),'Verified real move should replace Struggle');
report.ponytaLv5=ponytaSources;
assert.equal(report.checked,150,'All 150 Kanto species other than test Mewtwo should be audited');
console.log('T08 KANTO ONBOARDING 151',JSON.stringify(report));
