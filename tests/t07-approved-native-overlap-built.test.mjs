/* Every installed Poké Arena 2D animation wins over a same-name Torre 2
 * signature. All remaining Torre 2-exclusive approved effects are preserved.
 * Assert the compiled actual Phaser roster: never guess the upstream catalog.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(root,modules,name)).href);
const [{ROSTER},{earlyKantoSlotPlan},{SIGNATURE_MOVES,TEST_LIBRARY,
 APPROVED_KANTO_NATIVE_OVERLAPS,canonicalMoveKey,availableMoves}]=await Promise.all([
 load('datos.js'),load('torre2/early-kanto-species.js'),load('torre2/move-pool.js')
]);
assert.deepEqual(APPROVED_KANTO_NATIVE_OVERLAPS,[],
 'No previously-approved custom renderer may override an actual Poké Arena move');
assert.ok(TEST_LIBRARY.length>=227,'The installed original move inventory was truncated');
assert.equal(new Set(TEST_LIBRARY.map(m=>canonicalMoveKey(m.nombre))).size,
 TEST_LIBRARY.length,'Duplicate native/custom editor rows');
// Mirror the installed roster's inherited/evolution-kit resolution. Native
// capabilities can appear in a Mega/evolution slot without a base-level name.
const upstream=new Map();
const slots=['lmb','rmb','esp','q','e'];
const merge=(a,b)=>Object.fromEntries(
 [...new Set([...Object.keys(a||{}),...Object.keys(b||{})])]
  .map(key=>[key,{...(a?.[key]||{}),...(b?.[key]||{})}]));
for(const def of ROSTER.filter(p=>!p.torre2ArenaAdded&&
 !p.torre2Kanto151&&!p.torre2Johto100)){
 const read=kit=>{
  for(const slot of slots){
   if(slot==='esp'&&earlyKantoSlotPlan(def.id))continue;
   const move=kit?.[slot];if(!move?.nombre||!move.forma)continue;
   const key=canonicalMoveKey(move.nombre);
   if(!upstream.has(key))upstream.set(key,move);
  }
 };
 let current=def.kit||{};read(current);
 for(const evo of def.evoluciones||[]){
  current=merge(current,evo.kit||{});read(current);
  if(evo.mega?.kit)read(merge(current,evo.mega.kit));
 }
}
const byName=new Map(TEST_LIBRARY.map(m=>[canonicalMoveKey(m.nombre),m]));
const signatures=new Map(SIGNATURE_MOVES.map(m=>[canonicalMoveKey(m.nombre),m]));
let overlaps=0,preservedExclusives=0;
for(const [key,signature] of signatures){
 const actual=byName.get(key);
 assert.ok(actual,'Torre 2 signature disappeared from move editor: '+key);
 const native=upstream.get(key);
 if(native){
  overlaps++;
  assert.equal(actual.forma,native.forma,
   key+' must use the actual P2 animation, not '+signature.forma);
  assert.equal(actual.source,'arena2d-original',
   key+' must be attributed to the native source');
  // A duplicate renderer must NEVER silently rewrite Torre 2-only damage,
  // cooldown or ULT balance: P2 supplies ART, not a new campaign ruleset.
  for(const prop of ['dano','poder','precisao','pp','cd','coste'])
   if(signature[prop]!==undefined)
    assert.equal(actual[prop],signature[prop],
     key+' original visual must not change approved Torre 2 '+prop);
 }else{
  preservedExclusives++;
  assert.equal(actual.forma,signature.forma,
   key+' is Torre 2-exclusive and must retain its existing approved visual');
  assert.equal(actual.source,'new-phaser-fx',
   key+' exclusive visual was lost');
 }
}
for(const key of ['peck','double-kick','psychic','ice-shard','shadow-ball','x-scissor']){
 assert.ok(upstream.has(key),'Original P2 move is absent: '+key);
 assert.equal(byName.get(key)?.forma,upstream.get(key).forma,
  'Native effect not selected: '+key);
}
// A legal Kanto loadout must resolve from the same battle library as the UI.
const member=(id,level=50)=>({id,progression:{species:id,level},tmMoves:[]});
for(const [species,key] of [['gengar','shadow-ball'],['lapras','ice-beam'],
 ['alakazam','psychic']]){
 const selected=availableMoves(member(species)).find(m=>canonicalMoveKey(m.nombre)===key);
 assert.ok(selected?.forma,'Legal move missing for '+species+': '+key);
 assert.equal(selected.forma,byName.get(key).forma,
  'Campaign loadout bypasses global native priority for '+key);
}
assert.ok(overlaps>=5,'Upstream overlap scan did not find enough real moves');
assert.ok(preservedExclusives>0,'Torre 2-exclusive approved moves disappeared');
console.log('PASS_NATIVE_P2_ALL_OVERLAPS',JSON.stringify({
 originalMoveCount:upstream.size,nativeOverlaps:overlaps,
 preservedTorre2Exclusives:preservedExclusives,
 noDuplicateNames:true,originalArenaUntouched:true
}));
