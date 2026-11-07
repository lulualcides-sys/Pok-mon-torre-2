import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOHTO_100_ROWS} from '../tools/pokearena/torre2-johto-100-data.js';
const root=new URL('../tools/pokearena/',import.meta.url);
let src=readFileSync(new URL('torre2-johto-100-species.js',root),'utf8');
// This data-URL test isolates move policy from the Magmortar roster hook.
src=src.replace('import {attachMagmortarEvolution} from "./magmar-family.js";',
 'const attachMagmortarEvolution=()=>false;');
for(const [from,to] of [
 ['johto-100-data.js','torre2-johto-100-data.js'],
 ['early-kanto-species.js','torre2-early-kanto-species.js'],
 ['johto-lab-catalog.js','torre2-johto-lab-catalog.js'],
 ['batch24/catalog.js','batch24/catalog.js'],
 ['wobbuffet-native.js','torre2-wobbuffet-native.js'],
 ['gen45-johto-learnsets.js','torre2-gen45-johto-learnsets.js']
])src=src.replace('from "./'+from+'"','from '+JSON.stringify(new URL(to,root).href));
const {selectJohto100Moves,JOHTO_EVOLUTION_KIT_PLAN,addAllJohtoSpecies}=await import(
 'data:text/javascript;base64,'+Buffer.from(src).toString('base64')
);
const mk=(name,type='NORMAL',dmg=7)=>({id:name,nombre:name.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' '),
 forma:'native-executable',tipo:type,dano:dmg});
const entries=[
 ['tackle','NORMAL',3],['ember','FIRE',5],['smokescreen','NORMAL',0],
 ['flame-wheel','FIRE',11],['flamethrower','FIRE',16],['lava-plume','FIRE',15],
 ['overheat','FIRE',21],['fire-punch','FIRE',13],['fire-spin','FIRE',9],
 ['smog','POISON',5],['fire-fang','FIRE',13],['crunch','DARK',18],
 ['earthquake','GROUND',19],['rock-slide','ROCK',15],['stone-edge','ROCK',20],
 ['bite','DARK',7],['thrash','NORMAL',11],['sandstorm','ROCK',0],
 ['quick-attack','NORMAL',6],['hidden-power','PSYCHIC',9],['fire-blast','FIRE',19]
];
const library=new Map(entries.map(([id,type,damage])=>[id,mk(id,type,damage)]));
const row=id=>JOHTO_100_ROWS.find(p=>p[1]===id);
const names=id=>selectJohto100Moves(row(id),library).map(x=>x.id);
test('Tyranitar Stone Edge is the only ULT; Crunch is not ULT',()=>{
 const roles=names('tyranitar');
 assert.equal(roles.length,4);
 assert.equal(roles[3],'stone-edge');
 assert.equal(roles.includes('crunch'),true);
 assert.notEqual(roles[3],'crunch');
 assert.equal(new Set(roles).size,4);
});
test('Johto starter third evolution gets a genuinely stronger set than baby',()=>{
 const baby=names('cyndaquil'),mid=names('quilava'),final=names('typhlosion');
 assert.equal(baby[3],'flame-wheel');
 assert.equal(mid[3],'flamethrower');
 assert.equal(final[3],'overheat');
 assert.ok(final.includes('lava-plume'),'Final form must gain installed Lava Plume');
 assert.notDeepEqual(final,baby);
});
test('Larvitar and Pupitar do not get the strongest final-evolution ULT',()=>{
 assert.equal(names('larvitar')[3],'thrash');
 assert.equal(names('pupitar')[3],'earthquake');
 assert.equal(names('tyranitar')[3],'stone-edge');
});
test('Magby has real baby moves instead of evolved Overheat ULT',()=>{
 const moves=names('magby');
 assert.equal(moves[3],'fire-punch');
 assert.ok(!moves.includes('overheat'));
 assert.ok(!moves.includes('fire-blast'));
});
test('Unown officially has only Hidden Power: never fabricate illegal moves',()=>{
 assert.deepEqual(names('unown'),['hidden-power']);
 assert.ok(JOHTO_EVOLUTION_KIT_PLAN.tyranitar);
});

test('Magby evolves into installed Magmar without changing original P2 species',()=>{
 const original=[
  {id:'magmar',dex:'0126',nombre:'MAGMAR',torre2ArenaAdded:true,
   tipos:['FIRE'],hp:93,vel:112,atk:1.1,def:.9,regen:4,
   kit:{lmb:mk('ember','FIRE',5),rmb:mk('fire-punch','FIRE',12),
    q:mk('fire-spin','FIRE',7),e:mk('flamethrower','FIRE',20)},evoluciones:[]}
 ];
 const saved=structuredClone(original);
 const added=addAllJohtoSpecies(original);
 const magby=added.find(p=>p.id==='magby');
 assert.ok(magby?.torre2ArenaAdded&&magby.evoluciones.length,
  'Magby must have actual battle evolution, not only visual Pokédex family');
 const stage=magby.evoluciones[0];
 assert.equal(stage.nombre,'MAGMAR');
 assert.equal(stage.dex,'0126');
 for(const slot of ['lmb','rmb','q','e'])
  assert.equal(stage.kit[slot].nombre,original[0].kit[slot].nombre,
   'Magby evolution must use installed Magmar native move');
 assert.deepEqual(original,saved,'Do not edit the existing Magmar entry');
});
test('Togepi/Togetic have installed legal damaging moves, with no fabricated VFX',()=>{
 const installed=new Map(library);
 for(const [name,type,damage] of [
  ['metronome','NORMAL',0],['ancient-power','ROCK',10],
  ['double-edge','NORMAL',17],['psychic','PSYCHIC',21],
  ['magical-leaf','GRASS',13]
 ])installed.set(name,mk(name,type,damage));
 for(const id of ['togepi','togetic']){
  const moves=selectJohto100Moves(row(id),installed);
  assert.ok(moves.length>=3,id+' lost available legal attack slots');
  assert.ok(moves[0].move.dano>0,id+' ATK is non-damaging despite legal attack availability');
  assert.ok(moves.every(x=>installed.get(x.id)===x.move&&x.move.forma),
   'No invented VFX or unauthorised move');
  assert.equal(new Set(moves.map(x=>x.id)).size,moves.length);
  assert.ok(moves.some(x=>x.id==='hidden-power'),id+' must retain the already-installed legal Hidden Power');
 }
});
