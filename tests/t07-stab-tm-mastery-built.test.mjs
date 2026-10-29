/* Compiled, real client T07: user-custom STAB TM mastery by level.
 * 151 Kanto species × installed catalogue; NOT natural XP gameplay.
 * Moves are reused from the native/approved 227-effect inventory only. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=p=>import(pathToFileURL(path.join(root,modules,p)));
const [
 {KANTO_151}, {TEST_LIBRARY,availableMoves,campaignLearnset,moveUnlockLevel,
  isPendingApprovalMove,equipMove,selectedMoves,resolveLoadout},
 {KANTO_STAB_TM_MASTERY_LEVELS,kantoStabTmMasteryLevel},
 {frlgMachineCompatible,frlgUnlockLevel}
] =await Promise.all([
 load('torre2/all-kanto-species.js'),load('torre2/move-pool.js'),
 load('torre2/stab-tm-mastery.js'),load('torre2/frlg-learnsets.js')
]);
const m=(id,level,tmMoves=[])=>({id,progression:{species:id,level},tmMoves});
const installed=new Map(TEST_LIBRARY.map(x=>[x.id,x]));
assert.equal(TEST_LIBRARY.length,227,'Do not invent/duplicate approved moves');
assert.equal(KANTO_151.length,151);
assert.equal(kantoStabTmMasteryLevel('rattata','blizzard','ICE'),null,
 'Rattata is not an Ice-type even though it may learn Blizzard TM');
assert.equal(kantoStabTmMasteryLevel('charmander','overheat','FIRE'),50);
assert.equal(kantoStabTmMasteryLevel('charmander','overheat','WATER'),null);
assert.equal(kantoStabTmMasteryLevel('magikarp','earthquake','GROUND'),null);
assert.ok(!('surf' in KANTO_STAB_TM_MASTERY_LEVELS),
 'Previously rejected Surf must not be auto-unlocked');
assert.ok(!('fire-blast' in KANTO_STAB_TM_MASTERY_LEVELS),
 'Keep the independently approved Fire Blast Lv50 rule untouched');

let compatible=0,renderable=0,newChoices=0;const byType={},examples=[];
for(const pokemon of KANTO_151){
 if(pokemon.id==='mewtwo')continue; // laboratory Mewtwo has separate unrestricted kit
 for(const [key,level] of Object.entries(KANTO_STAB_TM_MASTERY_LEVELS)){
  const native=installed.get(key);
  const type=native?.tipo;
  const at=kantoStabTmMasteryLevel(pokemon.id,key,type);
  if(at===null)continue;
  compatible++;
  assert.ok(pokemon.tipos.includes(type),'STAB type mismatched '+pokemon.id+' '+key);
  assert.ok(frlgMachineCompatible(pokemon.id,key),
   'Illegal FireRed TM for '+pokemon.id+' '+key);
  assert.ok(level>=30,'High tier cannot unlock in first gyms');
  // FireRed's ORIGINAL level-up always wins over optional TM mastery.
  // Paras naturally learns Giga Drain at Lv43; never demand it at Lv38.
  if(frlgUnlockLevel(pokemon.id,key)!==null)continue;
  if(!native?.forma||isPendingApprovalMove(native))continue;
  renderable++;
  const actual=availableMoves(m(pokemon.id,level)).find(x=>x.id===key);
  assert.ok(actual?.forma,'Native attack not available at level '+level+
   ' for '+pokemon.id+' '+key);
  assert.equal(actual.forma,native.forma,'VFX changed for '+key);
  assert.equal(actual.cd,native.cd,'Cooldown changed for '+key);
  const before=availableMoves(m(pokemon.id,level-1)).some(x=>x.id===key);
  const dex=campaignLearnset(pokemon.id).find(x=>x.id===key);
  assert.equal(dex?.method,'LEVEL',
   'Pokédex and battle editor disagree '+pokemon.id+' '+key);
  if(!before){
   newChoices++;
   assert.equal(dex?.level,level,
    'Pokédex reports an incorrect first learn level '+pokemon.id+' '+key);
   assert.equal(moveUnlockLevel(m(pokemon.id,level),key),level,
    'Level table differs from battle availability '+pokemon.id+' '+key);
   if(examples.length<25)examples.push({id:pokemon.id,move:key,level,source:native.source});
  }
  byType[type]=(byType[type]||0)+1;
 }
}
assert.ok(renderable>=10,'No usable type-matched native moves found');
assert.ok(newChoices>=1,'No improvement beyond earlier audited learnsets');
// A compatible off-type TM remains teach-only, never a free level-up attack.
for(const [species,move] of [['rattata','blizzard'],['pikachu','ice-beam'],
 ['bulbasaur','flamethrower']]){
 if(frlgUnlockLevel(species,move)===null)
  assert.ok(!availableMoves(m(species,50)).some(x=>x.id===move),
   'Wrong-type TM automatically granted: '+species+' '+move);
}
assert.ok(!availableMoves(m('charmander',49)).some(x=>x.id==='fire-blast'));
assert.ok(availableMoves(m('charizard',50)).some(x=>x.id==='fire-blast'));
assert.ok(!availableMoves(m('bulbasaur',5)).some(x=>x.id==='solar-beam'));
assert.ok(!availableMoves(m('charmander',5)).some(x=>x.id==='flamethrower'));
// Manual choice is the key deliverable: a previously TM-only strong attack
// must become equipable at its LV gate without modifying pre-existing saves.
for(const [id,move,level] of [['raticate','hyper-beam',50],
 ['charmander','overheat',50],['lapras','blizzard',50],
 ['pikachu','shock-wave',31],['nidoqueen','sludge-bomb',44]]){
 if(!installed.has(move)||!frlgMachineCompatible(id,move))continue;
 const p=m(id,level),before=selectedMoves(p);
 if(before.includes(move)){
  assert.ok(Object.values(resolveLoadout(p)).some(x=>x?.id===move));
  continue;
 }
 assert.ok(equipMove(p,2,move),
  'Manual HAB 3 blocked despite late Lv unlock '+id+' '+move);
 assert.equal(p.moves[2],move);
 assert.equal(resolveLoadout(p).q?.id,move);
}
const summary={species:KANTO_151.length,library:TEST_LIBRARY.length,
 highTierMoves:Object.keys(KANTO_STAB_TM_MASTERY_LEVELS).length,
 compatibleTypeSpeciesPairs:compatible,renderablePairs:renderable,
 firstUnlockedAtCustomGate:newChoices,byType,examples};
console.log('T07_STAB_TM_MASTERY_AUDIT',JSON.stringify(summary));
console.log('PASS_T07_STAB_TM_151_SPECIES_LEVEL_GATES');
