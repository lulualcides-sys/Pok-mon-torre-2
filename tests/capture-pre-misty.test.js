import test from 'node:test';
import assert from 'node:assert/strict';
import {captureChance,catchRate,rollCapture} from '../tools/pokearena/torre2-capture-mechanics.js';
import {ballArc,captureImpact} from '../tools/pokearena/torre2-ball-choreography.js';
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
test('Emerald-inspired ballistic capture has a high arc and real miss tolerance',()=>{
 const a={x:70,y:280},b={x:430,y:180};
 assert.deepEqual(ballArc(a,b,0),a);
 assert.deepEqual(ballArc(a,b,1),b);
 assert.ok(ballArc(a,b,.5).y<Math.min(a.y,b.y),'arcing throw must climb above the ball flight line');
 assert.equal(captureImpact({x:425,y:190},{x:430,y:190},22),true);
 assert.equal(captureImpact({x:300,y:270},{x:430,y:190},22),false);
});
test('four capture rolls produce at most three visible shakes',()=>{
 const target={id:'pikachu',wild:true,hpPercent:80};
 assert.deepEqual((({caught,shakes})=>({caught,shakes}))(rollCapture(target,'pokeball',()=>.99999)),{caught:false,shakes:0});
 assert.deepEqual((({caught,shakes})=>({caught,shakes}))(rollCapture(target,'pokeball',()=>0)),{caught:true,shakes:3});
});
