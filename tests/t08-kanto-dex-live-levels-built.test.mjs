/* T08: the visible level must be the first level ACTUALLY selectable
 * in the compiled Phaser campaign. Mewtwo is the explicit legacy test lab.
 * These are fixtures, not a full natural Pallet-to-Champion playthrough.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [
 {KANTO_151},{TEST_LIBRARY,availableMoves,campaignLearnset,
  moveUnlockLevel,canonicalMoveKey},
 {frlgMachineCompatible}
]=await Promise.all([
 load('torre2/all-kanto-species.js'),
 load('torre2/move-pool.js'),
 load('torre2/frlg-learnsets.js')
]);
const member=(id,level=50)=>({id,progression:{species:id,level},tmMoves:[]});
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
const discrepancies=[],stats={species:0,catalogue:TEST_LIBRARY.length,cells:0,exactLevelMatches:0,tmOnly:0};
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // deliberately unrestricted original test fixture
 stats.species++;
 const rows=campaignLearnset(id);
 const natural=new Map(rows.filter(r=>r.method==='LEVEL'&&!r.practice)
  .map(r=>[canonicalMoveKey(r.id),r.level]));
 for(const move of TEST_LIBRARY){
  const key=canonicalMoveKey(move.id);
  const expected=natural.get(key)??null;
  const level=moveUnlockLevel(member(id),move.id);
  stats.cells++;
  if(level!==expected)discrepancies.push({species:id,move:move.id,expected,level});
  if(level!==null)stats.exactLevelMatches++;
 }
 for(const row of rows.filter(r=>r.method==='TM')){
  if(natural.has(canonicalMoveKey(row.id)))continue;
  assert.equal(moveUnlockLevel(member(id),row.id),null,
   'TM-only ability falsely assigned a level: '+id+' '+row.id);
  stats.tmOnly++;
 }
}
assert.deepEqual(discrepancies,[],
 'Battle, editor and Pokédex have mismatched level gates');
const checks=[
 {id:'squirtle',move:'rain-dance',at:25},
 {id:'charizard',move:'aerial-ace',at:25},
 {id:'beedrill',move:'poison-punch',at:24},
 {id:'rapidash',move:'flame-wheel',at:18},
 {id:'ponyta',move:'flare-blitz',at:49},
 {id:'charizard',move:'fire-blast',at:50}
];
for(const {id,move,at} of checks){
 assert.ok(availableMoves(member(id,at)).some(m=>m.id===move),
  'Expected existing native/approved attack unavailable '+id+' '+move);
 assert.equal(moveUnlockLevel(member(id,50),move),at,
  'Pokédex advertised wrong level '+id+' '+move);
}
assert.equal(moveUnlockLevel(member('rattata'),'blizzard'),null);
assert.equal(moveUnlockLevel(member('magikarp'),'fire-blast'),null);
assert.equal(moveUnlockLevel(member('mewtwo'),'psychic'),1);
const practice=availableMoves(member('charmander',8)).find(m=>m.torre2IntroPractice&&m.torre2IntroSlot==='e');
assert.ok(practice?.id,'Intro ULT not available at Lv8');
assert.equal(moveUnlockLevel(member('charmander',8),practice.id),8);
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t08-kanto-151-dex-level-sync.json',
 JSON.stringify({note:'Built Phaser availability fixtures, not natural XP.',...stats,
  mismatchCount:discrepancies.length,checks},null,2)+'\n');
console.log('PASS_T08_DEX_LEVEL_SYNC_151',JSON.stringify(stats));
