import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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
const {addAllJohtoSpecies}=await import(
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
    e:{nombre:'Hyper Beam',forma:'native-hyper',tipo:'NORMAL',dano:32}},
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
 const unown=created.find(p=>p.id==='unown'),smeargle=created.find(p=>p.id==='smeargle');
 assert.equal(unown?.kit.lmb?.nombre,'Hidden Power');
 assert.equal(unown?.kit.lmb?.torre2JohtoSpecialUnown,true);
 assert.deepEqual(['lmb','rmb','q','e'].map(k=>smeargle?.kit[k]?.nombre),
  ['Tackle','Quick Attack','Swift','Hyper Beam']);
 assert.equal(smeargle?.kit.e?.torre2JohtoLegal,'FRLG-SKETCH-DEMO');
 assert.equal(original[0].kit.lmb,undefined,'Native Ho-Oh must remain empty');

});
