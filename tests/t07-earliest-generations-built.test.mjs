/* T07/T08 regression: compiled Phaser move-pool / Pokédex / editor agree
 * on the earliest VERIFIED level-up from Gen IV/V/VII for existing VFX.
 * Fixtures validate availability only; NOT a natural campaign or Android.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [
 {KANTO_151},
 {TEST_LIBRARY,availableMoves,moveUnlockLevel,campaignLearnset,equipMove,resolveLoadout},
 {gen45KantoUnlockLevel,GEN4_HGSS_KANTO_LEVEL_UP,GEN5_B2W2_KANTO_LEVEL_UP},
 {gen7LetsGoUnlockLevel},
 {frlgUnlockLevel,frlgMachineCompatible}
]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
 load('torre2/gen45-kanto-learnsets.js'),
 load('torre2/gen7-letsgo-learnsets.js'),load('torre2/frlg-learnsets.js')
]);
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
const has=(id,level,move)=>availableMoves(member(id,level)).some(x=>x.id===move);
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
assert.equal(new Set(TEST_LIBRARY.map(x=>x.id)).size,227);
const samples=[
 {id:'kangaskhan',move:'crunch',gen7:39,gen45:31,unlock:31},
 {id:'magnemite',move:'flash-cannon',gen7:38,gen45:35,unlock:35}
];
const evidence=[];
for(const sample of samples){
 const {id,move,gen7,gen45,unlock}=sample;
 assert.equal(gen7LetsGoUnlockLevel(id,move),gen7);
 assert.equal(gen45KantoUnlockLevel(id,move),gen45);
 assert.equal(frlgUnlockLevel(id,move),null,'FireRed level-up wins if present');
 assert.equal(frlgMachineCompatible(id,move),false,'TM-only path must not be bypassed');
 const native=TEST_LIBRARY.find(x=>x.id===move);
 assert.ok(native?.forma,'No installed renderer for '+id+' '+move);
 assert.equal(moveUnlockLevel(member(id,50),move),unlock,'Pokédex calculator drift: '+id);
 assert.ok(!has(id,unlock-1,move),'Level gate opened early: '+id+' '+move);
 assert.ok(has(id,unlock,move),'Level gate did not open: '+id+' '+move);
 const dex=campaignLearnset(id).find(x=>x.id===move);
 assert.equal(dex?.method,'LEVEL','Pokédex missing legal level: '+id+' '+move);
 assert.equal(dex.level,unlock,'Pokédex differs from battle: '+id+' '+move);
 const training=member(id,unlock);
 assert.ok(equipMove(training,2,move),'HAB3 editor rejected learned move '+id+' '+move);
 assert.equal(resolveLoadout(training).q?.id,move);
 assert.equal(resolveLoadout(training).q?.forma,native.forma,'Approved renderer changed');
 evidence.push({species:id,move,sourceGen7:gen7,sourceGen45:gen45,unlock,
  renderer:native.forma,source:native.source});
}
// HGSS and B2W2 disagree: the earlier VERIFIED HGSS level is not discarded.
assert.equal(GEN4_HGSS_KANTO_LEVEL_UP.kangaskhan.crunch,31);
assert.equal(GEN5_B2W2_KANTO_LEVEL_UP.kangaskhan.crunch,37);
assert.equal(gen45KantoUnlockLevel('kangaskhan','crunch'),31);
assert.equal(gen45KantoUnlockLevel('geodude','stone-edge'),39);
// The user-approved cap, special moves and TM protections cannot regress.
assert.ok(!has('charmander',49,'fire-blast'));
assert.ok(has('charizard',50,'fire-blast'));
assert.ok(!has('rattata',50,'blizzard'));
assert.ok(has('ponyta',49,'flare-blitz'));
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // unrestricted legacy test fixture
 const levels=[5,8,13,21,31,35,49,50];
 let previous=new Set();
 for(const level of levels){
  const moves=availableMoves(member(id,level));
  const now=new Set(moves.map(x=>x.id));
  assert.ok(moves.length,'No battle moves '+id+' Lv'+level);
  for(const move of moves)assert.ok(move.forma,'Renderer missing '+id+' '+move.id);
  for(const key of previous)assert.ok(now.has(key),'Move lost '+id+' '+key+' at Lv'+level);
  previous=now;
 }
}
fs.mkdirSync('test-evidence',{recursive:true});
fs.writeFileSync('test-evidence/t07-earliest-generations-levels.json',
 JSON.stringify({note:'Compiled Phaser client fixtures; not naturally earned XP.',
  auditedSpecies:151,catalogue:TEST_LIBRARY.length,examples:evidence},null,2)+'\n');
console.log('PASS_T07_EARLIEST_GENERATION_UNLOCK',JSON.stringify(evidence));
