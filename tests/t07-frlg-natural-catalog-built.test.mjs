/* T07/T08: actual compiled Phaser inventory, 151 Kanto × current native installed
 * attacks. An FRLG level-up attack must never disappear merely because it
 * also appears in the TM table. Laboratory Mewtwo is a distinct test mode.
 * Fixtures are NOT evidence of a complete naturally played campaign.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const load=p=>import(pathToFileURL(path.join(root,modules,p)).href);
const [{KANTO_151},
 {TEST_LIBRARY,availableMoves,campaignLearnset,moveUnlockLevel,
  selectedMoves,equipMove,resolveLoadout,campaignMoveSlotReason},
 {FRLG_LEVEL_UP,frlgUnlockLevel,frlgMachineCompatible}]=await Promise.all([
 load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),
 load('torre2/frlg-learnsets.js')
]);

const member=(id,level,tmMoves=[])=>({
 id,progression:{species:id,level},tmMoves
});
assert.equal(KANTO_151.length,151);
assert.ok(TEST_LIBRARY.length>=227,'Approved baseline has lost installed move entries');
assert.equal(new Set(TEST_LIBRARY.map(m=>m.id)).size,TEST_LIBRARY.length,'Duplicate native move IDs');
assert.ok(TEST_LIBRARY.every(m=>m.forma),'Installed attack has no renderer');
const expectedProtectSpecies=[
 'blastoise','cloyster','kingler','krabby','omanyte','omastar',
 'shellder','squirtle','wartortle'
];
const naturallyProtect=[],lostNatural=[],mismatchedTM=[];
let installedNaturalPairs=0,checked=0;
for(const {id} of KANTO_151){
 if(id==='mewtwo'){
  assert.equal(availableMoves(member(id,50)).length,TEST_LIBRARY.length,
   'Original Mewtwo laboratory must remain unrestricted');
  continue;
 }
 checked++;
 const learned=availableMoves(member(id,50));
 const ids=new Set(learned.map(m=>m.id));
 const dex=new Map(campaignLearnset(id).map(row=>[row.id,row]));
 for(const move of TEST_LIBRARY){
  const official=frlgUnlockLevel(id,move.id);
  if(official===null)continue;
  installedNaturalPairs++;
  if(!ids.has(move.id)||dex.get(move.id)?.method!=='LEVEL')
   lostNatural.push({species:id,move:move.id,official});
 }
 const first=frlgUnlockLevel(id,'protect');
 if(first!==null){
  naturallyProtect.push(id);
  assert.ok(ids.has('protect'),id+' lost native FRLG Protect');
  assert.ok(first>=1&&first<=50,id+' incorrect natural Protect level');
  assert.ok(!availableMoves(member(id,first-1)).some(m=>m.id==='protect'),
   id+' learned Protect before legitimate level');
  assert.ok(availableMoves(member(id,first)).some(m=>m.id==='protect'),
   id+' did not learn Protect at FRLG level');
  assert.equal(dex.get('protect')?.level,first,
   id+' Pokédex reported the wrong natural level');
  assert.equal(dex.get('protect')?.method,'LEVEL');
  assert.equal(moveUnlockLevel(member(id,50),'protect'),first,
   id+' move editor and Pokédex disagree');
  const equipped=member(id,50);
  const move=availableMoves(equipped).find(m=>m.id==='protect');
  const slots=['lmb','rmb','q','e'];
  const allowed=slots.map((_,i)=>i).filter(i=>!campaignMoveSlotReason(equipped,i,move));
  assert.ok(allowed.length,id+' earned Protect but no legal native slot exists');
  // Protect is a learned defensive technique, not automatically an RMB.
  // Original P2 role metadata may reserve it for another compatible role;
  // a forced HAB2 assertion must not bypass the charged-ULT rule.
  const already=Object.values(resolveLoadout(equipped)).some(m=>m?.id==='protect');
  if(!already){
   const slot=allowed.includes(1)?1:allowed.includes(2)?2:allowed.includes(3)?3:allowed[0];
   assert.equal(equipMove(equipped,slot,'protect'),true,
    id+' cannot manually equip learned Protect in '+slots[slot]);
   assert.equal(resolveLoadout(equipped)[slots[slot]]?.id,'protect',
    id+' learned Protect did not become executable in its legal role');
  }
 }else{
  if(ids.has('protect')||dex.get('protect')?.method==='LEVEL')
   mismatchedTM.push({species:id,reason:'TM-only granted by level'});
 }
 const compatible=frlgMachineCompatible(id,'protect');
 const taught=availableMoves(member(id,5,['protect'])).some(m=>m.id==='protect');
 if(taught!==compatible)
  mismatchedTM.push({species:id,reason:'invalid taught TM17 eligibility'});
}
assert.equal(checked,150);
assert.deepEqual(naturallyProtect.sort(),expectedProtectSpecies,
 'Reaudit FRLG natural Protect species when official metadata changes');
assert.deepEqual(lostNatural,[],
 'An installed FRLG natural level-up move was hidden in the battle or Pokédex');
assert.deepEqual(mismatchedTM,[],
 'Protect TM17 may not bypass real species compatibility');
assert.equal(Object.entries(FRLG_LEVEL_UP)
 .filter(([,moves])=>Object.hasOwn(moves,'protect')).length,9);
console.log('PASS_T07_FRLG_NATURAL_CATALOG_151x227',JSON.stringify({
 species:KANTO_151.length,installedMoves:TEST_LIBRARY.length,
 checkedRegularSpecies:checked,naturalInstalledPairs:installedNaturalPairs,
 naturalProtectSpecies:naturallyProtect,lostNatural:lostNatural.length,
 invalidTMGrants:mismatchedTM.length,mode:'compiled-fixtures'
}));
