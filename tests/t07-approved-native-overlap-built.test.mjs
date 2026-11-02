/* Protect user-approved Kanto VFX when current Poké Arena adds a namesake.
 * This tests the compiled Phaser client, not invented new renderers.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {SIGNATURE_MOVES,TEST_LIBRARY,APPROVED_KANTO_NATIVE_OVERLAPS,
 canonicalMoveKey,availableMoves}=await import(
 pathToFileURL(path.join(root,modules,'torre2/move-pool.js')).href);
assert.deepEqual(APPROVED_KANTO_NATIVE_OVERLAPS,[
 'ice-shard','psychic','shadow-ball','ice-beam'
]);
assert.ok(TEST_LIBRARY.length>=227,'The original approved effect inventory was truncated');
assert.equal(new Set(TEST_LIBRARY.map(move=>canonicalMoveKey(move.nombre))).size,
 TEST_LIBRARY.length,'Same-named native/custom moves must never duplicate editor rows');
const verified=[];
for(const key of APPROVED_KANTO_NATIVE_OVERLAPS){
 const signature=SIGNATURE_MOVES.find(m=>canonicalMoveKey(m.nombre)===key);
 const actual=TEST_LIBRARY.find(m=>canonicalMoveKey(m.nombre)===key);
 assert.ok(signature?.approved&&signature.forma,
  'No existing approved signature renderer '+key);
 assert.ok(actual,'Approved move hidden from the battle editor '+key);
 assert.equal(actual.id,signature.id,key+' original Torre 2 move ID was replaced');
 assert.equal(actual.forma,signature.forma,key+' approved VFX was silently replaced');
 assert.equal(actual.source,'new-phaser-fx',key+' native client replaced Torre 2 signature');
 verified.push({id:actual.id,form:actual.forma});
}
const member=(id,level=50)=>({id,progression:{species:id,level},tmMoves:[]});
for(const [species,key] of [['gengar','shadow-ball'],['lapras','ice-beam'],
 ['alakazam','psychic']]){
 const unlocked=availableMoves(member(species)).find(m=>canonicalMoveKey(m.nombre)===key);
 const approved=SIGNATURE_MOVES.find(m=>canonicalMoveKey(m.nombre)===key);
 assert.ok(unlocked?.forma,'Natural level 50 species lost approved attack '+species+' '+key);
 assert.equal(unlocked.forma,approved.forma,'Approved existing effect changed for '+species);
}
console.log('PASS_T07_NATIVE_OVERLAP_PRESERVED',JSON.stringify({
 nativeLibrary:TEST_LIBRARY.length,approvedUserVfx:verified,
 noDuplicateNames:true,nativeArenaUntouched:true
}));
