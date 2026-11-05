import test from 'node:test';
import assert from 'node:assert/strict';
import {addAllJohtoSpecies} from '../tools/pokearena/torre2-johto-100-species.js';

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
  {id:'installed-source',kit:{lmb:{nombre:'Fire Blast',forma:'native-fire',tipo:'FIRE',dano:100}},
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
});
