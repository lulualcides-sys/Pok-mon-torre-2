import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptRemovedVersusEntry,acceptRemovedTrainingTile} from '../tools/pokearena/torre2-native-title-0713.mjs';
const current='const MENUS={jugar:[{id:"liga",txt:"LEAGUE",escena:"liga"},'+
 '{id:"online",txt:"ONLINE"},'+
 '{id:"cpu",txt:"LOCAL",escena:"seleccion",datos:{previo:{modo:"cpu"}}},'+
 '{id:"arena",txt:"ARENA",escena:"preparar"}]};';
test('existing official CPU LOCAL menu is retained without obsolete 2P deletion',()=>{
 assert.equal(acceptRemovedVersusEntry(current,'0.71.3'),true);
});
test('legacy Alpha still uses its old exact patch',()=>{
 assert.equal(acceptRemovedVersusEntry(current,'0.70.0'),false);
});
test('do not silently skip a real 2-players entry',()=>{
 assert.throws(()=>acceptRemovedVersusEntry(
  current.replace('jugar:[','jugar:[{id:"versus",txt:"2 PLAYERS"},'),'0.71.3'),/Unrecognized/);
});
test('unknown menu or missing local CPU fail closed',()=>{
 assert.throws(()=>acceptRemovedVersusEntry(current.replace('"cpu"','"ranked"'),'0.71.3'),/Unrecognized/);
});

test('Alpha 0.71.3 title retains Kanto and LOCAL without inventing a lab tile',()=>{
 const body='const MENUS={jugar:[{id:"kanto",txt:"KANTO CAMPAIGN"},'+
 '{id:"liga",txt:"LEAGUE"},{id:"cpu",txt:"LOCAL",escena:"seleccion"},'+
 '{id:"arena",txt:"ARENA"}]};';
 assert.equal(acceptRemovedTrainingTile(body,'0.71.3'),true);
 assert.equal(acceptRemovedTrainingTile(body,'0.70.0'),false);
 assert.throws(()=>acceptRemovedTrainingTile(body.replace('id:"arena"','id:"johto-lab",txt:"MEWTWO TEST LAB"'),'0.71.3'),
  /Unrecognized/);
});
