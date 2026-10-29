/* T07 coverage report: what is genuinely missing from the 227 APPROVED
 * move renderers, versus a LEGAL move that exists but is level/TM locked.
 * All 151 Kanto families, full FRLG level-up tables, including >Lv50.
 * Evidence only. A missing VFX MUST NOT be auto-granted or fabricated.
 * Output is a stable machine-readable file for the next implementation patch.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{KANTO_151},{TEST_LIBRARY,canonicalMoveKey,availableMoves},
 {FRLG_LEVEL_UP}]=await Promise.all([
  load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
  load('torre2/frlg-learnsets.js')
 ]);
assert.equal(KANTO_151.length,151,'Expected complete Kanto roster');
assert.equal(TEST_LIBRARY.length,227,'Check whether approved renderer catalogue changed');
const installed=new Set(TEST_LIBRARY.map(m=>canonicalMoveKey(m.nombre)));
assert.equal(installed.size,TEST_LIBRARY.length,'Library must not double-count aliases');
const missingByName=new Map(),bySpecies=[];
let missingPairs=0,missingEarlyPairs=0;
for(const {id} of KANTO_151){
 const official=FRLG_LEVEL_UP[id]||{};
 const missing=Object.entries(official)
  .filter(([move])=>!installed.has(canonicalMoveKey(move)))
  .map(([move,level])=>({move,level}))
  .sort((a,b)=>a.level-b.level||a.move.localeCompare(b.move));
 for(const {move,level} of missing){
  const key=canonicalMoveKey(move);
  const rows=missingByName.get(key)||[];
  rows.push({species:id,level});missingByName.set(key,rows);
  missingPairs++;
  if(level<=8)missingEarlyPairs++;
 }
 bySpecies.push({species:id,missingFRLG:missing.length,missing,
  installedOfficial:Object.keys(official).length-missing.length});
}
const byMove=[...missingByName].map(([move,species])=>({
 move,pokemonCount:species.length,species
})).sort((a,b)=>b.pokemonCount-a.pokemonCount||a.move.localeCompare(b.move));
const summary={
 source:'official FRLG_LEVEL_UP vs versioned approved TEST_LIBRARY',
 provenance:'compiled Phaser source, not a played campaign',
 kantoSpecies:KANTO_151.length,installedRenderers:TEST_LIBRARY.length,
 distinctFRLGMovesWithoutRenderer:byMove.length,
 missingSpeciesMovePairs:missingPairs,missingPairsLearnedByLevel8:missingEarlyPairs,
 distinction:'Absent renderers cannot be added to availableMoves merely by changing unlock levels',
 topGaps:byMove.slice(0,18).map(({move,pokemonCount})=>({move,pokemonCount})),
 byMove,bySpecies
};
assert.ok(byMove.some(row=>row.move==='withdraw'&&row.species.some(s=>s.species==='squirtle')),
 'Squirtle Withdraw absence should be reported until a real renderer is added');
assert.ok(byMove.some(row=>row.move==='transform'&&row.species.some(s=>s.species==='ditto')),
 'Ditto Transform gap must remain visible until implemented');
assert.equal(new Set(bySpecies.map(r=>r.species)).size,151);
assert.equal(byMove.reduce((n,row)=>n+row.species.length,0),missingPairs);
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t07-frlg-151-missing-renderers.json',
 JSON.stringify(summary,null,2)+'\n');
console.log('T07_FRLG_151_MISSING_RENDERERS',JSON.stringify({
 species:151,installed:227,distinctGaps:byMove.length,
 missingPairs,earlyMissingPairs:missingEarlyPairs,top:summary.topGaps
}));
