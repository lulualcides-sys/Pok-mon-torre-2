/* Kanto campaign: 151 official FireRed level/tutor/TM gates, P2 slot roles. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.env.PREVIEW_ROOT||'_site','arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(root,modules,name)));
const [{FRLG_LEVEL_UP,FRLG_MACHINES,frlgUnlockLevel,frlgKnownMoves,frlgMachineCompatible},
 {KANTO_151}, {availableMoves,moveUnlockLevel,TEST_LIBRARY,selectedMoves,resolveLoadout,campaignLearnset,
   equipMove,campaignMoveSlotReason,isCampaignUltimateOnlyMove}, {buscar}]
 =await Promise.all([
  load('torre2/frlg-learnsets.js'),load('torre2/all-kanto-species.js'),
  load('torre2/move-pool.js'),load('datos.js')
 ]);
assert.equal(KANTO_151.length,151,'Full Kanto dex data');
for(const p of KANTO_151){
 assert.ok(Object.keys(FRLG_LEVEL_UP[p.id]||{}).length>0,'Real level-up table missing: '+p.id);
 assert.ok(Array.isArray(FRLG_MACHINES[p.id]),'TM compatibility missing: '+p.id);
 assert.ok(frlgKnownMoves(p.id).length>0,'Inherited moves missing: '+p.id);
 const {def}=buscar(p.id);
 assert.ok(def,'Pokemon must remain in captured roster: '+p.id);
}
assert.equal(frlgUnlockLevel('bulbasaur','tackle'),1);
assert.equal(frlgUnlockLevel('bulbasaur','vine-whip'),10);
assert.equal(frlgUnlockLevel('charmander','ember'),7);
assert.equal(frlgUnlockLevel('charmander','metal-claw'),13);
assert.equal(frlgUnlockLevel('magikarp','tackle'),15);
assert.equal(frlgUnlockLevel('magikarp','flail'),30);
assert.ok(frlgMachineCompatible('bulbasaur','protect'));
assert.ok(!frlgMachineCompatible('magikarp','protect'));
const member=(id,level,tmMoves=[])=>({id,progression:{species:id,level},tmMoves});
// T07: incompatible TM records in a legacy/imported save cannot grant
// illegal attacks, while genuinely compatible and taught TMs remain valid.
assert.equal(frlgMachineCompatible('bulbasaur','thunderbolt'),false);
assert.ok(!availableMoves(member('bulbasaur',5,['thunderbolt'])).some(x=>x.id==='thunderbolt'),
 'Bulbasaur cannot use saved Thunderbolt from an incompatible TM record');
assert.ok(!availableMoves(member('magikarp',5,['protect'])).some(x=>x.id==='protect'),
 'Magikarp cannot equip an incompatible saved Protect');
assert.ok(availableMoves(member('bulbasaur',5,['protect'])).some(x=>x.id==='protect'),
 'Bulbasaur retains explicitly taught compatible Protect');
assert.ok(!availableMoves(member('charmander',5)).some(x=>x.id==='flamethrower'),
 'Early Charmander cannot use its late FireRed flamethrower');
assert.ok(!availableMoves(member('bulbasaur',5)).some(x=>x.id==='solar-beam'),
 'Solar Beam cannot appear at Lv5');
assert.ok(!availableMoves(member('bulbasaur',5)).some(x=>x.id==='protect'),
 'Protect must not auto-unlock from TM compatibility');
assert.ok(availableMoves(member('bulbasaur',5,['protect'])).some(x=>x.id==='protect'),
 'Teaching Protect should grant the installed approved shield');
assert.equal(moveUnlockLevel(member('bulbasaur',5),'vine-whip'),10,
 'Pokédex must know Gen3 Vine Whip learning level');
assert.equal(availableMoves(member('mewtwo',50)).length,TEST_LIBRARY.length,
 'Test Mewtwo must remain unrestricted');

/* Species signatures must be genuinely selectable in a legal native role.
 * Strong attacks are now charged ULTs (E); the old hardcoded Q expectation
 * would encourage reintroducing precisely the balance bug T08 fixed.
 */
for(const [species,level,id,slot] of [
 ['meowth',30,'pay-day','q'],['persian',50,'pay-day','q'],
 ['cubone',70,'bone-club','rmb'],['cubone',70,'bonemerang','q'],
 ['marowak',70,'bone-club','rmb'],['marowak',70,'bonemerang','q'],
 ['porygon',70,'tri-attack','q'],['dugtrio',70,'tri-attack','q'],
 ['jigglypuff',70,'sing','rmb'],['krabby',70,'crabhammer','q'],
 ['kingler',70,'crabhammer','q'],['pinsir',70,'guillotine','q'],
 ['vileplume',70,'petal-dance','q'],['clefairy',70,'metronome','q'],
 ['jynx',70,'lovely-kiss','rmb'],['chansey',70,'soft-boiled','q'],
 ['scyther',70,'x-scissor','q'],['beedrill',70,'x-scissor','q'],
 ['sandshrew',70,'swift','q'],['magnemite',70,'sonic-boom','q']
]){
 const p=member(species,level),move=availableMoves(p).find(m=>m.id===id);
 assert.ok(move?.forma,'Species-legal installed move missing: '+species+' '+id);
 const roles=['lmb','rmb','q','e'];
 const legal=roles.map((_,i)=>i).filter(i=>!campaignMoveSlotReason(p,i,move));
 const strong=isCampaignUltimateOnlyMove(move);
 const intended=strong?3:(legal.includes(roles.indexOf(slot))?roles.indexOf(slot):
  legal.find(i=>i!==3)??3);
 assert.ok(legal.includes(intended),'Characteristic move has no legal role: '+species+' '+id);
 if(strong){
  assert.equal(intended,3,'Strong characteristic attack must use E');
  for(let i=0;i<3;i++)assert.ok(campaignMoveSlotReason(p,i,move),
   'Strong characteristic move leaked into ordinary slot: '+species+' '+id);
 }
 const kit=resolveLoadout(p);
 if(!Object.values(kit).some(m=>m?.id===id)){
  assert.equal(equipMove(p,intended,id),true,
   'Learned characteristic move cannot be selected: '+species+' '+roles[intended]+' '+id);
  assert.equal(resolveLoadout(p)[roles[intended]]?.id,id,
   'Selected characteristic move is not active: '+species+' '+id);
 }
}
assert.ok(!availableMoves(member('cubone',10)).some(x=>x.id==='bonemerang'),
 'Cubone must reach Bonemerang level before using the move');
const ghost=member('gengar',30);
assert.ok(!availableMoves(ghost).some(x=>x.id==='shadow-ball'),
 'The Gastly line must reach its inherited FireRed Shadow Ball level');
assert.equal(frlgUnlockLevel('gengar','shadow-ball'),36,
 'Gengar inherits Gastly natural Shadow Ball from level 36');
ghost.progression.level=70;
const shadowBall=availableMoves(ghost).find(m=>m.id==='shadow-ball');
assert.ok(shadowBall?.forma,'Gengar must retain the approved Shadow Ball renderer');
const shadowSlot=isCampaignUltimateOnlyMove(shadowBall)?3:2;
assert.equal(campaignMoveSlotReason(ghost,shadowSlot,shadowBall),null);
assert.ok(resolveLoadout(ghost)[['lmb','rmb','q','e'][shadowSlot]]?.id==='shadow-ball'||
 equipMove(ghost,shadowSlot,'shadow-ball'),
 'Gengar must be able to select learned Shadow Ball in its legal role');
assert.equal(resolveLoadout(ghost)[['lmb','rmb','q','e'][shadowSlot]]?.id,'shadow-ball');
assert.ok(!availableMoves(member('bulbasaur',70)).some(x=>x.id==='protect'),
 'TM-only Protect stays locked until explicitly taught');
const oldPorygon=member('porygon',70);
oldPorygon.moves=['tackle','quick-attack','swift','hyper-beam'];
oldPorygon.movePlanSpecies='porygon';
assert.notEqual(resolveLoadout(oldPorygon).q?.id,'tri-attack',
 'Legacy Porygon saves cannot cast strong Tri Attack with uncharged Q');
assert.ok(availableMoves(oldPorygon).some(m=>m.id==='tri-attack'),
 'Porygon must not lose its learned signature after a legacy save');
assert.equal(equipMove(oldPorygon,3,'tri-attack'),true,
 'Porygon must be able to manually equip its strong signature in E');
assert.equal(resolveLoadout(oldPorygon).e?.id,'tri-attack',
 'Porygon Tri Attack must be executable only from charged E');
assert.equal(oldPorygon.moves[3],'tri-attack',
 'A deliberate E selection must survive the next campaign save');

for(const p of KANTO_151){
 const older=member(p.id,5),later=member(p.id,100);
 const oldMoves=availableMoves(older).map(x=>x.id);
 const learned=availableMoves(later).map(x=>x.id);
 for(const id of oldMoves)
  assert.ok(learned.includes(id),'Lv100 must not forget already known move '+p.id+' '+id);
 assert.ok(selectedMoves(older).length<=4,'Four Kanto move slots only: '+p.id);
 const kit=resolveLoadout(later);
 assert.ok(Object.keys(kit).filter(s=>['lmb','rmb','q','e'].includes(s)).length<=4,
  'No fifth attack slot: '+p.id);
}

// Regression: all 151 Kanto families can inspect the full installed
// learnset in Pokédex without silently auto-learning TMs, wrong-species
// moves, or an extra fifth attack slot.
let availableFamilies=0;
for(const entry of KANTO_151){
 const levels=campaignLearnset(entry.id);
 const ids=levels.map(x=>x.id);
 assert.equal(new Set(ids).size,ids.length,'One renderer per installed move '+entry.id);
 // A separate campaign TRAINING option reuses an installed renderer but has
 // its own ID, so it must be verified through the actual unlocked move pool,
 // not treated as a newly introduced VFX catalog entry.
 assert.ok(levels.every(move=>move.practice?
  availableMoves(member(entry.id,move.level)).some(x=>x.id===move.id&&
   x.torre2IntroPractice&&x.forma&&x.torre2IntroSlot===move.slot):
  TEST_LIBRARY.some(x=>x.id===move.id)),
  'Pokédex must use an installed VFX or legitimate practice adapter: '+entry.id);
 const atMax=availableMoves(member(entry.id,100)).map(x=>x.id).sort();
 const learned=levels.filter(x=>x.method==='LEVEL').map(x=>x.id).sort();
 assert.deepEqual(learned,atMax,'Pokédex must exactly match combat unlocks '+entry.id);
 assert.ok(levels.every(x=>x.method==='TM'||Number.isInteger(x.level)),
  'Missing level or TM gate '+entry.id);
 availableFamilies++;
}
assert.equal(availableFamilies,151);
assert.equal(campaignLearnset('bulbasaur').find(x=>x.id==='vine-whip')?.level,10);
assert.ok(campaignLearnset('bulbasaur').some(x=>x.id==='protect'&&x.method==='TM'));
assert.ok(campaignLearnset('mewtwo').length===TEST_LIBRARY.length,
 'Test Mewtwo can display every installed attack');

const pokedex=fs.readFileSync(path.join(root,modules,'escenas/pokedex.js'),'utf8');
assert.ok(pokedex.includes('campaignLearnset')&&pokedex.includes('GOLPES POR LEVEL'),
 'Separate campaign learnset must display level and TM requirements');
assert.ok(pokedex.includes('selectPokedexArenaMove(stage.kit?.[slot],original[slot],plan[i],canonicalMoveKey)'),
 'Main Pokédex must prioritize the real Arena evolution-stage kit over the level-100 fallback');
assert.ok(pokedex.includes('showKantoCampaignLearnset')&&pokedex.includes('GOLPES POR LEVEL'),
 'Native Pokédex must expose all installed compatible moves for selected evolution');
assert.ok(pokedex.includes('NÃO DISPONÍVEL')||pokedex.includes('INATIVO'),
 'Missing ultimate slots must remain visible but non-playable');
assert.ok(pokedex.includes('HAB 2')&&pokedex.includes('HAB 3')&&pokedex.includes('ESQUIVA'),
 'Dex needs original ATK/HAB 2/HAB 3/ULT/ESQUIVA roles');
const original=fs.readFileSync(path.join(root,modules,'luchador.js'),'utf8');
assert.ok(original.includes('nome:"LOCKED"')||
 original.includes('nombre:"LOCKED"'),
 'Locked campaign moves must be inert dummies to keep native AI safe');
assert.ok(original.includes('coste:999999')&&original.includes('pendiente:true'),
 'Native IA needs safe inert slot objects, never real skills before level unlock');
console.log('PASS FireRed/LeafGreen: 151 species level/TM data, 4 Kanto roles, locked battle abilities, Pokedex, test Mewtwo.');
