import test from 'node:test';
import assert from 'node:assert/strict';
import {captureChance,catchRate,rollCapture} from '../tools/pokearena/torre2-capture-mechanics.js';
test('wild catch rates depend on species, HP, ball and status',()=>{
 const caterpie={id:'caterpie',wild:true,hpPercent:15};
 const mewtwo={id:'mewtwo',wild:true,hpPercent:15};
 assert.equal(catchRate('caterpie'),255);
 assert.equal(catchRate('mewtwo'),3);
 assert.ok(captureChance(caterpie)>captureChance(mewtwo)*30);
 assert.ok(captureChance(caterpie,'ultraball')>=captureChance(caterpie));
 const pikachu={id:'pikachu',wild:true,hpPercent:100};
 assert.ok(captureChance({...pikachu,hpPercent:20})>captureChance(pikachu));
 assert.ok(captureChance({...pikachu,hpPercent:20,status:'sleep'})>captureChance({...pikachu,hpPercent:20}));
});
test('four capture rolls produce at most three visible shakes',()=>{
 const target={id:'pikachu',wild:true,hpPercent:80};
 assert.deepEqual((({caught,shakes})=>({caught,shakes}))(rollCapture(target,'pokeball',()=>.99999)),{caught:false,shakes:0});
 assert.deepEqual((({caught,shakes})=>({caught,shakes}))(rollCapture(target,'pokeball',()=>0)),{caught:true,shakes:3});
});
