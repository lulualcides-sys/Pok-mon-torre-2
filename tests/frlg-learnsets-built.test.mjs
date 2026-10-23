/* Kanto campaign: 151 official FireRed level/tutor/TM gates, P2 slot roles. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve('_site/arena2d');
const modules=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8')).modules;
const load=name=>import(pathToFileURL(path.join(root,modules,name)));
const [{FRLG_LEVEL_UP,FRLG_MACHINES,frlgUnlockLevel,frlgKnownMoves,frlgMachineCompatible},
 {KANTO_151}, {availableMoves,moveUnlockLevel,TEST_LIBRARY,selectedMoves,resolveLoadout}, {buscar}]
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

/* Species signatures must actually appear in the battle kit, not only Dex. */
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
 const kit=resolveLoadout(member(species,level));
 assert.equal(kit[slot]?.id,id,
  'Characteristic move needs to be ACTIVE in battle: '+species+' '+slot+' '+id);
}
assert.ok(!availableMoves(member('cubone',10)).some(x=>x.id==='bonemerang'),
 'Cubone must reach Bonemerang level before using the move');
const ghost=member('gengar',70);
assert.ok(!availableMoves(ghost).some(x=>x.id==='shadow-ball'),
 'Shadow Ball is a taught TM, not an automatic level-up for Gengar');
ghost.tmMoves=['shadow-ball'];
assert.equal(resolveLoadout(ghost).q?.id,'shadow-ball',
 'After teaching the real TM, Gengar equips its approved Shadow Ball');
const oldPorygon=member('porygon',70);
oldPorygon.moves=['tackle','quick-attack','swift','hyper-beam'];
oldPorygon.movePlanSpecies='porygon';
assert.equal(resolveLoadout(oldPorygon).q?.id,'tri-attack',
 'Old campaign saves must install Porygons signature once');
assert.equal(oldPorygon.moves[2],'tri-attack',
 'One-time upgrade should survive the next campaign save');

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
const pokedex=fs.readFileSync(path.join(root,modules,'escenas/pokedex.js'),'utf8');
assert.ok(pokedex.includes('moveUnlockLevel')&&pokedex.includes('torre2RequiresTM'),
 'Dex must display level and TM-gated moves next to five standardized slots');
assert.ok(pokedex.includes('HAB 2')&&pokedex.includes('HAB 3')&&pokedex.includes('ESQUIVA'),
 'Dex needs original ATK/HAB 2/HAB 3/ULT/ESQUIVA roles');
const original=fs.readFileSync(path.join(root,modules,'luchador.js'),'utf8');
assert.ok(original.includes('nome:"LOCKED"')||
 original.includes('nombre:"LOCKED"'),
 'Locked campaign moves must be inert dummies to keep native AI safe');
assert.ok(original.includes('coste:999999')&&original.includes('pendiente:true'),
 'Native IA needs safe inert slot objects, never real skills before level unlock');
console.log('PASS FireRed/LeafGreen: 151 species level/TM data, 4 Kanto roles, locked battle abilities, Pokedex, test Mewtwo.');
