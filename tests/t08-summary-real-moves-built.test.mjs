/* T08 mobile summary regression: genuine move names, four selectable roles,
 * legal low-level gates and immutable approved 227-move renderer catalogue.
 * Built Phaser fixtures only; not a naturally completed campaign.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const base=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const {modules}=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
const load=name=>import(pathToFileURL(path.join(base,modules,name)).href);
const [{KANTO_151},{TEST_LIBRARY,availableMoves,selectedMoves,resolveLoadout,
 equipMove,canonicalMoveKey},{KANTO_INTRO}]=await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
 load('torre2/kanto-intro-moves.js')
]);
const member=(id,level)=>({id,progression:{species:id,level},tmMoves:[]});
assert.equal(KANTO_151.length,151);
assert.equal(TEST_LIBRARY.length,227);
assert.equal(new Set(TEST_LIBRARY.map(m=>m.id)).size,227);
let checked=0;
for(const {id} of KANTO_151){
 if(id==='mewtwo')continue; // explicit original unrestricted lab
 for(const level of [5,8,11]){
  const p=member(id,level),options=availableMoves(p);
  assert.ok(options.length>=3,id+' missing native/preview choices Lv'+level);
  assert.ok(options.every(m=>!(/\btreino\b/i).test(m.nombre)),
   id+' displays a fake named Treino variant Lv'+level);
  const kit=resolveLoadout(p);
  for(const slot of ['lmb','rmb','q']){
   assert.ok(kit[slot]?.forma,id+' missing real rendered '+slot+' Lv'+level);
   assert.ok(!(/\btreino\b/i).test(kit[slot].nombre),
    id+' battle still shows Treino '+slot+' Lv'+level);
  }
  if(level===5)assert.equal(kit.e,undefined,id+' early ULT unlocked');
  if(level>=8)assert.ok(kit.e?.ulti,id+' energy-gated ULT missing');
 }
 checked++;
}
assert.equal(checked,150);
for(const [id,real] of [['nidoran-m','poison-sting'],['mankey','karate-chop']]){
 const p=member(id,11);
 const pool=availableMoves(p);
 assert.ok(pool.some(m=>m.id===real&&!m.torre2IntroPractice),
  id+' lacks official installed '+real);
 assert.ok(equipMove(p,0,real),id+' Lv11 cannot select learned attack for ATK');
 assert.equal(p.moves[0],real,id+' editor did not select real '+real);
 assert.equal(resolveLoadout(p).lmb?.id,real,
  id+' battle ignores manually selected '+real);
 assert.equal(p.movePlanSpecies,id,'Save should retain chosen evolution species');
 assert.ok(selectedMoves(p).includes(real),'Editor lost manually equipped '+real);
 const locked=pool.find(m=>m.torre2IntroSlot==='e');
 assert.ok(locked,'Early ULT missing '+id);
 assert.equal(equipMove(p,3,real),false,
  id+' ULT must stay weak through Lv12');
}
for(const [id,level] of [['nidoran-m',25],['charizard',50]]){
 const p=member(id,level);
 const equipped=selectedMoves(p);
 const option=availableMoves(p).find(m=>!m.torre2IntroPractice&&
  !equipped.includes(m.id)&&m.forma);
 assert.ok(option,'Expected later real option '+id);
 assert.equal(equipMove(p,3,option.id),true,
  id+' cannot replace late ULT with legal installed move');
 assert.equal(resolveLoadout(p).e?.id,option.id);
 assert.equal(resolveLoadout(p).e?.ulti,true);
}
assert.ok(KANTO_INTRO.ultAt===8&&KANTO_INTRO.tutorialUntil===13);
console.log('PASS_T08_REAL_MOVES_SUMMARY_151',JSON.stringify({
 species:checked,installedVfx:TEST_LIBRARY.length,
 userReported:['nidoran-m','mankey'],levels:[5,8,11,25],
 tested:['native-names','Lv11-ATK-equip','Lv8-ULT-gate','Lv25-ULT-choice']
}));
