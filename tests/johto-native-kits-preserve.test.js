import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JOHTO_100_ROWS} from '../tools/pokearena/torre2-johto-100-data.js';

// The source tree uses torre2-* file names. The Phaser build rewrites the
// same imports to short names. Test actual source logic with only the two
// module specifiers remapped; do not change production build imports.
const folder=new URL('../tools/pokearena/',import.meta.url);
let source=readFileSync(new URL('torre2-johto-100-species.js',folder),'utf8');
for(const [from,to] of [
 ['johto-100-data.js','torre2-johto-100-data.js'],
 ['early-kanto-species.js','torre2-early-kanto-species.js'],
 ['johto-lab-catalog.js','torre2-johto-lab-catalog.js']
]){
 const needle='from "./'+from+'"';
 assert.ok(source.includes(needle),'Original build import missing: '+from);
 source=source.replace(needle,'from '+JSON.stringify(new URL(to,folder).href));
}
const {addAllJohtoSpecies,selectJohto100Moves,johto100Kit,johtoMoveLibrary}=await import(
 'data:text/javascript;base64,'+Buffer.from(source).toString('base64')
);

test('species from P2 keep original kits and slots, even if incomplete',()=>{
 const original=[
  // A native species with no executable slots MUST remain empty. Fire Blast
  // exists in the shared installed library, so an autopopulate fallback
  // would incorrectly change Ho-Oh and must fail this regression test.
  {id:'ho-oh',kit:{},evoluciones:[]},
  {id:'zubat',kit:{lmb:{nombre:'Leech Life',forma:'native-leech',dano:4}},
   evoluciones:[{nombre:'Crobat',dex:'0169',
    kit:{e:{nombre:'Cross Poison',forma:'native-poison',dano:11}},
    mega:{nombre:'Mega Crobat',dex:'0169',kit:{lmb:{nombre:'Wing Attack',forma:'native-wing'}}}}]},
  {id:'onix',kit:{lmb:{nombre:'Tackle',forma:'native-tackle'}},
   evoluciones:[{nombre:'Steelix',dex:'0208',kit:{e:{nombre:'Heavy Slam',forma:'native-steel'}}}]},
  {id:'raikou',kit:{lmb:{nombre:'Thunder Fang',forma:'native-electric'},
    rmb:{nombre:'Shock Wave',forma:'native-shock'},q:{nombre:'Discharge',forma:'native-d'},
    e:{nombre:'Wild Charge',forma:'native-w'},esp:{nombre:'Dodge',forma:'dash'}},
   evoluciones:[]},
  {id:'installed-source',kit:{
    lmb:{nombre:'Tackle',forma:'native-tackle',tipo:'NORMAL',dano:5},
    rmb:{nombre:'Quick Attack',forma:'native-quick',tipo:'NORMAL',dano:7},
    q:{nombre:'Swift',forma:'native-swift',tipo:'NORMAL',dano:10},
    e:{nombre:'Body Slam',forma:'native-body',tipo:'NORMAL',dano:20}},
   evoluciones:[]},
  {id:'test-fire-and-dark-moves',kit:{
    lmb:{nombre:'Ember',forma:'native-ember',tipo:'FIRE',dano:5},
    rmb:{nombre:'Bite',forma:'native-bite',tipo:'DARK',dano:12},
    q:{nombre:'Crunch',forma:'native-crunch',tipo:'DARK',dano:14},
    e:{nombre:'Flamethrower',forma:'native-flame',tipo:'FIRE',dano:19}},
   evoluciones:[]},
  {id:'test-machine-moves',kit:{
    lmb:{nombre:'Solar Beam',forma:'native-solar',tipo:'GRASS',dano:90},
    rmb:{nombre:'Hyper Beam',forma:'native-hyper',tipo:'NORMAL',dano:100},
    e:{nombre:'Fire Blast',forma:'native-fireblast',tipo:'FIRE',dano:26}},
   evoluciones:[]}
 ];
 const snapshot=structuredClone(original);
 const created=addAllJohtoSpecies(original);
 assert.deepEqual(original,snapshot,
  'Native P2 kits/evolution slots must never change as a side effect of Johto injection');
 assert.equal(original[0].kit.lmb,undefined,'Empty native Ho-Oh must stay empty');
 assert.equal(original[0].torre2JohtoNativeLegalKit,undefined,'Do not silently mark native repaired');
 for(const id of ['ho-oh','crobat','steelix','raikou'])
  assert.equal(created.some(p=>p.id===id),false,'Do not re-add a native P2 species: '+id);
 assert.equal(created.some(p=>p.id==='chikorita'),true,'Genuinely new Johto species should still be added');
 assert.ok(created.every(p=>['FISICO','MIXTO'].includes(p.rol)),
  'New Johto must use real native P2 ROLES, never CUERPO_A_CUERPO');
 const unown=created.find(p=>p.id==='unown'),smeargle=created.find(p=>p.id==='smeargle');
 assert.equal(unown?.kit.lmb?.nombre,'Hidden Power');
 assert.equal(unown?.kit.lmb?.torre2JohtoSpecialUnown,true);
 assert.deepEqual(['lmb','rmb','q','e'].map(k=>smeargle?.kit[k]?.nombre),
  ['Tackle','Quick Attack','Swift','Body Slam']);
 assert.equal(smeargle?.kit.e?.torre2JohtoLegal,'FRLG-SKETCH-DEMO');
 for(const id of ['houndour','houndoom']){
  const added=created.find(p=>p.id===id);
  assert.ok(added,'Missing new '+id);
  const names=['lmb','rmb','q','e'].map(slot=>added.kit[slot]?.nombre);
  assert.ok(!names.includes('Hyper Beam'),'Generic Hyper Beam in '+id);
  assert.ok(!names.includes('Solar Beam'),'Off-type Solar Beam in '+id);
  assert.equal(added.kit.e?.nombre,'Fire Blast','Strongest FIRE attack must be ULT for '+id);
 }
 assert.equal(original[0].kit.lmb,undefined,'Native Ho-Oh must remain empty');

});

test('Kanto evolution upgrade cannot rewrite original P2 family slots',()=>{
 const source=readFileSync(new URL('../tools/pokearena/torre2-evolution-kits.js',import.meta.url),'utf8');
 assert.match(source,/if\(!def\?\.torre2ArenaAdded\)continue;/,
  'Native client species must be excluded before any evolution kit reassignment');
});

test('all new Johto autokits exclude generic Hyper Beam and off-type Solar Beam',()=>{
 const installed=new Map([
  ['hyper-beam',{nombre:'Hyper Beam',forma:'native-hyper',tipo:'NORMAL',dano:100}],
  ['solar-beam',{nombre:'Solar Beam',forma:'native-solar',tipo:'GRASS',dano:90}],
  ['tackle',{nombre:'Tackle',forma:'native-tackle',tipo:'NORMAL',dano:5}],
  ['ember',{nombre:'Ember',forma:'native-ember',tipo:'FIRE',dano:5}],
  ['bite',{nombre:'Bite',forma:'native-bite',tipo:'DARK',dano:12}],
  ['crunch',{nombre:'Crunch',forma:'native-crunch',tipo:'DARK',dano:14}],
  ['flamethrower',{nombre:'Flamethrower',forma:'native-flame',tipo:'FIRE',dano:19}]
 ]);
 for(const p of JOHTO_100_ROWS){
  if(p[1]==='smeargle')continue;
  const moves=selectJohto100Moves(p,installed);
  assert.ok(!moves.some(m=>m.id==='hyper-beam'),p[1]+' received Hyper Beam');
  if(!p[2].includes('GRASS'))
   assert.ok(!moves.some(m=>m.id==='solar-beam'),p[1]+' received off-type Solar Beam');
 }
});

test('only existing executable library moves can be equipped in any Johto slot',()=>{
 const good={
  nombre:'Mirror Coat',forma:'native-mirror',tipo:'PSYCHIC',dano:12
 };
 const available=new Map([
  ['mirror-coat',good],
  ['counter',{nombre:'Counter',forma:'ghost-factory',pendiente:true}],
  ['safeguard',{nombre:'Safeguard',forma:'native-status',torre2Unavailable:true}],
  ['destiny-bond',{nombre:'Destiny Bond'}]
 ]);
 const wob=JOHTO_100_ROWS.find(row=>row[1]==='wobbuffet');
 assert.ok(wob,'Missing Wobbuffet in FRLG data');
 const kit=johto100Kit(wob,available);
 assert.equal(kit.lmb?.nombre,'Mirror Coat');
 assert.equal(kit.rmb,undefined);
 assert.equal(kit.q,undefined);
 assert.equal(kit.e,undefined);
 assert.equal(kit.esp?.forma,'dash');
 assert.deepEqual(Object.keys(kit).sort(),['esp','lmb'],
  'A Wobbuffet with one installed move must not gain three imaginary attacks');
 const unavailable=new Map([
  ['mirror-coat',{...good,pendiente:true}]
 ]);
 const empty=johto100Kit(wob,unavailable);
 assert.deepEqual(Object.keys(empty),['esp'],
  'Unavailable only move must NOT be substituted with a fake one');
});

test('new Johto kits never equip a move absent from an approved installed catalog',()=>{
 const original=[
  {id:'test-moves',kit:{
    lmb:{nombre:'Ember',forma:'ember',tipo:'FIRE',dano:7},
    rmb:{nombre:'Bite',forma:'bite',tipo:'DARK',dano:11},
    q:{nombre:'Crunch',forma:'crunch',tipo:'DARK',dano:19},
    e:{nombre:'Flamethrower',forma:'flame',tipo:'FIRE',dano:25}
  },evoluciones:[]}
 ];
 const library=johtoMoveLibrary(original);
 const snapshot=structuredClone(original);
 const created=addAllJohtoSpecies(original);
 assert.deepEqual(original,snapshot,'Source P2 attacks must remain immutable');
 const unown=created.find(x=>x.id==='unown');
 assert.ok(unown?.kit.lmb?.nombre==='Hidden Power',
  'Only already approved Hidden Power may extend the native move catalog');
 for(const p of created){
  for(const stage of [p,...p.evoluciones||[]]){
   for(const slot of ['lmb','rmb','q','e']){
    const move=stage.kit?.[slot];
    if(!move)continue;
    const same=[...library.values()].find(src=>
      src.nombre===move.nombre&&src.forma===move.forma);
    assert.ok(same,
     p.id+' '+(stage.nome||stage.nombre||'base')+' slot '+slot+' is not in installed library');
    assert.equal(move.pendiente,false);
    assert.notEqual(move.torre2Unavailable,true);
   }
  }
 }
});
