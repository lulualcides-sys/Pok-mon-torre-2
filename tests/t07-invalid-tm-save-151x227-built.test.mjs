/* T07/T08 integrity: an old/imported save containing TM claims that the
 * Kanto species cannot learn in FireRed must never create extra attack
 * options. This covers all 151 species against the live installed catalogue\n * (227 approved baseline effects plus any later valid entries), not just Protect.
 * Compiled Phaser fixtures only; no natural XP or Android claim.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{KANTO_151},{TEST_LIBRARY,availableMoves,campaignLearnset,
  equipMove,resolveLoadout},{frlgMachineCompatible}]=await Promise.all([
  load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
  load('torre2/frlg-learnsets.js')
]);

assert.equal(KANTO_151.length,151);
assert.ok(TEST_LIBRARY.length>=227,'The approved 227-effect baseline was truncated');
assert.equal(new Set(TEST_LIBRARY.map(m=>m.id)).size,TEST_LIBRARY.length,
  'The installed catalogue contains duplicate move IDs');
const levels=[5,8,13,25,50];
const make=(id,level,tmMoves=[])=>({
  id,progression:{species:id,level},tmMoves
});
const ids=moves=>moves.map(m=>m.id).sort();
const violations=[],speciesRows=[],learnedInKanto=new Set();
let incompatibleClaims=0,comparisons=0,checked=0;
for(const {id} of KANTO_151){
  if(id==='mewtwo')continue; // legacy unrestricted test laboratory.
  checked++;
  const incompatible=TEST_LIBRARY.filter(m=>!frlgMachineCompatible(id,m.id))
    .map(m=>m.id);
  incompatibleClaims+=incompatible.length;
  const legalTM=TEST_LIBRARY.filter(m=>frlgMachineCompatible(id,m.id)).length;
  for(const level of levels){
    const baseline=make(id,level);
    const poisoned=make(id,level,incompatible);
    const original=ids(availableMoves(baseline));
    const after=ids(availableMoves(poisoned));
    comparisons+=TEST_LIBRARY.length;
    if(JSON.stringify(original)!==JSON.stringify(after)){
      const extra=after.filter(move=>!original.includes(move));
      const lost=original.filter(move=>!after.includes(move));
      violations.push({species:id,level,extra,lost});
    }
    // A forged TM must not allow manual equipping a new forbidden move.
    // All existing legal/learned options remain available and untouched.
    if(level===50){
      const chosen=new Set(original);
      const forged=incompatible.find(move=>!chosen.has(move));
      if(forged){
        const before=JSON.stringify(baseline);
        assert.equal(equipMove(baseline,1,forged),false,
          id+' equipped a forbidden forged TM '+forged);
        assert.equal(JSON.stringify(baseline),before,
          id+' changed save after refusing forged TM');
      }
    }
  }
  const learnset=campaignLearnset(id);
  for(const row of learnset)if(!row.practice)learnedInKanto.add(row.id);
  speciesRows.push({species:id,illegalFRLGTMClaims:incompatible.length,
    legalFRLGTMs:legalTM,level50Options:availableMoves(make(id,50)).length});
}
assert.equal(checked,150);
assert.equal(comparisons,150*TEST_LIBRARY.length*levels.length);
assert.deepEqual(violations,[],
  'Incompatible imported TM claims leaked into battle/editor');
const unassigned=TEST_LIBRARY.filter(move=>!learnedInKanto.has(move.id))
  .map(move=>({id:move.id,name:move.nombre,source:move.source,
    status:'NOT_ASSIGNED_IN_CURRENT_KANTO_CAMPAIGN'}));
const report={
  note:'Compiled Phaser fixtures, NOT naturally earned XP, full campaign or physical Android.',
  classification:'Unassigned means no Kanto level/TM grant in current game; it does NOT prove the move is illegal in all Pokémon generations.',
  species:KANTO_151.length,normalCampaignSpecies:checked,
  mewtwo:'UNRESTRICTED_LAB_EXCLUDED',
  installed:TEST_LIBRARY.length,approvedBaseline:227,levels,
  matrixCells:KANTO_151.length*TEST_LIBRARY.length,
  invalidTMClaimsTested:incompatibleClaims,
  levelComparisons:comparisons,leaks:violations.length,
  unassignedInstalledMoves:unassigned,
  speciesRows
};
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t07-kanto-151x227-invalid-tm-exclusions.json',
  JSON.stringify(report,null,2)+'\n');
console.log('PASS_T07_INVALID_TM_151x227',JSON.stringify({
  species:checked,installed:TEST_LIBRARY.length,levels,
  comparisons,invalidTMClaims:incompatibleClaims,
  unassignedInstalledMoves:unassigned.length,leaks:violations.length,
  evidence:'compiled-fixtures'
}));
