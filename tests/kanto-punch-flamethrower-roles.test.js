import test from 'node:test';
import assert from 'node:assert/strict';
import {isKantoNormalAbilityName,isKantoSignatureUltNameAllowed,
 chooseKantoSignatureUlt} from '../tools/pokearena/kanto-ultimate-policy.js';

const ordinary=['Fire Punch','Ice Punch','Thunder Punch','Poison Punch',
 'Mega Punch','Mach Punch','Focus Punch','Dynamic Punch',
 'Power-Up Punch','ThunderPunch','Flamethrower','Thunderbolt','Gust'];
test('Every Punch and Flamethrower is a normal HAB, not an ULT signature',()=>{
 for(const name of ordinary){
  assert.equal(isKantoNormalAbilityName(name),true,name);
  assert.equal(isKantoSignatureUltNameAllowed(name),false,name);
 }
 for(const name of ['Fire Blast','Hydro Pump','Solar Beam','Shadow Ball','Thunder']){
  assert.equal(isKantoNormalAbilityName(name),false,name);
  assert.equal(isKantoSignatureUltNameAllowed(name),true,name);
 }
});
test('Species ULT selector skips powerful Punch and Flamethrower',()=>{
 const library=[
  {nombre:'Fire Punch',id:'fire-punch',forma:'native',tipo:'FIRE',dano:29},
  {nombre:'Flamethrower',id:'flamethrower',forma:'native',tipo:'FIRE',dano:26},
  {nombre:'Fire Blast',id:'fire-blast',forma:'native',tipo:'FIRE',dano:15}
 ];
 const selected=chooseKantoSignatureUlt('magmar',library,{
  speciesTypes:['FIRE'],levelUp:{'fire-punch':25,flamethrower:30,'fire-blast':50}
 });
 assert.equal(selected?.id,'fire-blast',
  'The stronger ordinary HAB cannot steal the charged ULT');
 assert.equal(chooseKantoSignatureUlt('magmar',library.slice(0,2),{
  speciesTypes:['FIRE'],levelUp:{'fire-punch':25,flamethrower:30}
 }),null,'Never create a fake ultimate just to fill E');
});

test('Thunder remains ULT, while stronger Thunderbolt and Gust cannot steal E',()=>{
 const pool=[
  {nombre:'Thunderbolt',id:'thunderbolt',forma:'native',tipo:'ELECTRIC',dano:35},
  {nombre:'Thunder',id:'thunder',forma:'native',tipo:'ELECTRIC',dano:13},
  {nombre:'Gust',id:'gust',forma:'native',tipo:'FLYING',dano:25}
 ];
 const chosen=chooseKantoSignatureUlt('zapdos',pool,{
  speciesTypes:['ELECTRIC','FLYING'],
  levelUp:{thunderbolt:25,thunder:40,gust:1}
 });
 assert.equal(chosen?.id,'thunder','Thunder is the permitted E finisher');
 assert.equal(isKantoNormalAbilityName('Thunder'),false);
 assert.equal(isKantoSignatureUltNameAllowed('Thunder'),true);
});
