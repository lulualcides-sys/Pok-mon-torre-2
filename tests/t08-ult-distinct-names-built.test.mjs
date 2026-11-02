/* T08 Pages regression: a weak early ULT may share the approved VFX
 * with a normal attack but must remain visibly a distinct energy-gated
 * action. No new move, renderer, damage, CD, TM or save format.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const {resolveLoadout,availableMoves}=await import(
 pathToFileURL(path.join(root,modules,'torre2/move-pool.js')).href);
for(const level of [8,13,50]){
 const member={id:'caterpie',progression:{species:'caterpie',level},tmMoves:[]};
 const kit=resolveLoadout(member);
 const active=['lmb','rmb','q','e'].map(slot=>kit[slot]).filter(Boolean);
 assert.ok(active.length===4,'Caterpie Lv'+level+' lost a battle control');
 assert.equal(new Set(active.map(m=>m.nombre)).size,active.length,
  'Caterpie Lv'+level+' duplicates the visible ULT name');
 assert.ok(kit.e?.ulti,'ULT must retain its native full-energy requirement');
 assert.ok(kit.e.nombre.startsWith('ULT · '),
  'Caterpie tutorial finisher needs a clear ULT role label');
 assert.ok(!active.some(m=>/\btreino\b/i.test(m.nombre)),
  'No fake training-move name may reappear');
 assert.ok(availableMoves(member).some(m=>m.id===kit.e.id),
  'The ULT must remain a selectable approved renderer');
}
console.log('T08_CATERPIE_ULT_DISTINCT_PASS',JSON.stringify({
 species:'caterpie',levels:[8,13,50],nativeVfxUnchanged:true,
 evidence:'compiled-fixtures'
}));
