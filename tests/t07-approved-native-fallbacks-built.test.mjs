/* T07: protect two existing native Poké Arena effects removed by upstream
 * roster churn. These are the exact previously published native move objects,
 * not new animations. The original Arena/VS kits remain untouched.
 * Compiled fixtures are NOT naturally played Kanto battles.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {TEST_LIBRARY,availableMoves,canonicalMoveKey}=await import(
 pathToFileURL(path.join(root,modules,'torre2/move-pool.js')).href);
const named=name=>TEST_LIBRARY.filter(m=>canonicalMoveKey(m.nombre)===name);
const aurora=named('aurora-beam'),calm=named('calm-mind');
assert.equal(aurora.length,1,'Original Aurora Beam renderer must not disappear or duplicate');
assert.equal(calm.length,1,'Original Calm Mind renderer must not disappear or duplicate');
assert.equal(aurora[0].forma,'chorro');
assert.equal(aurora[0].paleta,'aurora');
assert.equal(aurora[0].dano,15);
assert.equal(aurora[0].cd,7);
assert.equal(calm[0].forma,'potenciar');
assert.equal(calm[0].mult,1.25);
assert.equal(calm[0].cd,14);
assert.ok(TEST_LIBRARY.length>=227,'Original approved catalogue was truncated');
assert.equal(new Set(TEST_LIBRARY.map(m=>canonicalMoveKey(m.nombre))).size,
 TEST_LIBRARY.length,'Duplicate editor rows after native fallback');
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
// Intro Lv8 previews may share the technique name but are NOT the full move.
const legal=(id,level,key)=>availableMoves(member(id,level))
 .some(m=>!m.torre2IntroPractice&&canonicalMoveKey(m.nombre)===key);
assert.ok(legal('seel',21,'aurora-beam'),'FRLG Seel Lv21 must retain Aurora Beam');
assert.ok(!legal('seel',20,'aurora-beam'),'FRLG Seel Lv20 cannot learn Aurora Beam early');
assert.ok(legal('dewgong',34,'aurora-beam'),'FRLG Dewgong knows Aurora Beam after legal evolution');
assert.ok(legal('shellder',22,'aurora-beam'),'FRLG Shellder Lv22 must retain Aurora Beam');
assert.ok(legal('vaporeon',36,'aurora-beam'),'FRLG Vaporeon Lv36 must retain Aurora Beam');
assert.ok(legal('alakazam',33,'calm-mind'),'FRLG Alakazam Lv33 must retain Calm Mind');
assert.ok(!legal('alakazam',32,'calm-mind'),'FRLG Alakazam Lv32 cannot learn Calm Mind early');
assert.ok(!legal('bulbasaur',50,'aurora-beam'),'Unrelated Kanto species cannot gain Aurora Beam');
assert.ok(!legal('rattata',50,'calm-mind'),'Unrelated Kanto species cannot gain Calm Mind');
console.log('PASS_T07_APPROVED_NATIVE_FALLBACKS',JSON.stringify({
 catalogue:TEST_LIBRARY.length,restored:['aurora-beam','calm-mind'],
 forms:['chorro','potenciar'],newVfx:0,mode:'compiled-fixtures'
}));
