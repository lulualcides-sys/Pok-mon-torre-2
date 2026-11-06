/* Built-client audit of actual Poké Arena + Torre 2 evolution families.
 * This is the real installed roster, not only synthetic unit-test fixtures.
 * Never mutate the native P2 battle roster to satisfy a Pokédex page.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const site=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(site,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(site,modules,p)).href);
const [{ROSTER},{JOHTO_100_ROWS},{LEVEL_EVOLUTIONS},
 {buildPokedexFamilies}]=await Promise.all([
 load('datos.js'),load('torre2/johto-100-data.js'),
 load('torre2/progression.js'),load('torre2/pokedex-families.js')
]);
const snapshot=JSON.stringify(ROSTER);
const families=buildPokedexFamilies(ROSTER,JOHTO_100_ROWS,LEVEL_EVOLUTIONS);
const get=id=>ROSTER.findIndex(p=>p.id===id);
const findRoot=id=>{
 const index=get(id);
 assert.ok(index>=0,'Missing installed species: '+id);
 return families.rootIndexForIndex[index];
};
for(const [baby,evolved] of [
 ['smoochum','jynx'],['elekid','electabuzz'],
 ['magby','magmar'],['tyrogue','hitmonlee'],
 ['tyrogue','hitmonchan'],['tyrogue','hitmontop']
]){
 assert.equal(findRoot(baby),findRoot(evolved),
  baby+' and '+evolved+' must share the same PUBLIC Pokédex family');
}
for(const id of ['smoochum','elekid','magby','tyrogue']){
 const root=findRoot(id),members=families.membersByRoot.get(root);
 assert.ok(members.length>=2,id+' must have actual evolution tabs');
 assert.equal(families.order.filter(index=>index===root).length,1,
  id+' generated duplicate cards');
}
const nationalStart=root=>Math.min(...families.membersByRoot.get(root)
 .map(i=>Number(ROSTER[i].dex)));
const nationalOrder=families.order.map(nationalStart);
assert.deepEqual(nationalOrder,[...nationalOrder].sort((a,b)=>a-b),
 'Family cards must follow National Dex, not late-generation baby root Dex');
assert.deepEqual(JSON.stringify(ROSTER),snapshot,
 'Display-only family indexing changed the native P2 battle roster');
console.log('PASS_BUILT_P2_FAMILY_TREE',JSON.stringify({
 release:modules,roster:ROSTER.length,families:families.order.length,
 smoohcumStages:families.membersByRoot.get(findRoot('smoochum')).length,
 elekidStages:families.membersByRoot.get(findRoot('elekid')).length,
 tyrogueStages:families.membersByRoot.get(findRoot('tyrogue')).length
}));
