import test from 'node:test';
import assert from 'node:assert/strict';
import {acceptRemovedVersusEntry,acceptRemovedTrainingTile,fitJohtoLabTitleMenu} from '../tools/pokearena/torre2-native-title-0713.mjs';
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

test('modern 0.71.3 six-button menu stays untouched when lab tile does not exist',()=>{
 const source='const MENUS={jugar:[{id:"kanto",txt:"KANTO CAMPAIGN"},'+
 '{id:"cpu",txt:"LOCAL",escena:"seleccion"},{id:"arena",txt:"ARENA"}]};'+
 'jugar:{y:114+BAJA,paso:PASO}';
 const result=fitJohtoLabTitleMenu(source,'0.71.3');
 assert.equal(result.source,source);
 assert.equal(result.labIncluded,false);
});
test('legacy lab tile fits only seven-button menus with known geometry',()=>{
 const source='jugar:{y:114+BAJA,paso:PASO}'+
 '{id:"johto-lab",txt:"MEWTWO TEST LAB"';
 const result=fitJohtoLabTitleMenu(source,'0.70.0');
 assert.equal(result.labIncluded,true);
 assert.match(result.source,/jugar:\{y:104\+BAJA,paso:26,alto:25\}/);
 assert.throws(()=>fitJohtoLabTitleMenu(source.replace('paso:PASO','paso:999'),'0.70.0'),
  /Unrecognized legacy/);
});
test('unknown new title UI fails closed instead of masking layout changes',()=>{
 assert.throws(()=>fitJohtoLabTitleMenu('new title scene','0.71.3'),/Unrecognized official/);
});
