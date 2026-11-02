import test from 'node:test';
import assert from 'node:assert/strict';
import {captureChance,catchRate,rollCapture,captureThreshold,CATCH_RATES,fighterCaptureStatus} from '../tools/pokearena/torre2-capture-mechanics.js';
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

test('FRLG rates cover all 151 species without a generic fallback',()=>{
 assert.equal(Object.keys(CATCH_RATES).length,151);
 assert.equal(catchRate('missing'),0);
 assert.equal(catchRate('jigglypuff'),170);
 assert.equal(catchRate('articuno'),3);
 assert.equal(catchRate('snorlax'),25);
});
test('integer FRLG ball/status ordering and 16-bit shake boundary',()=>{
 const p={id:'mewtwo',wild:true,hp:1,hpMax:100,status:'sleep'};
 // floor(3 * 1.5)=4; floor(4 * 298 / 300)=3; sleep -> 6.
 const expected=Math.floor(1048560/Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680/6))))));
 assert.equal(captureThreshold(p,'greatball'),expected);
 assert.equal(rollCapture(p,'greatball',()=>expected/65536).caught,false);
 assert.equal(rollCapture(p,'greatball',()=>(expected-1)/65536).caught,true);
 assert.equal(captureChance({...p,wild:false},'masterball'),0);
 let calls=0;assert.equal(rollCapture(p,'masterball',()=>{calls++;return 1}).caught,true);assert.equal(calls,0);
 for(let fail=0;fail<4;fail++){
  let call=0;const result=rollCapture(p,'greatball',()=>call++===fail?1:0);
  assert.equal(result.caught,false);assert.equal(result.shakes,Math.min(fail,3));assert.equal(call,fail+1);
 }
});

test('capture reads live fighter status flags',()=>{
 for(const [key,expected] of [['dormido','sleep'],['congelado','freeze'],['paralizado','paralyzed'],['veneno','poison'],['quema','burn'],['quemado','burn']]){
  assert.equal(fighterCaptureStatus({est:{[key]:{dur:3}}}),expected);
 }
 assert.equal(fighterCaptureStatus({est:{confuso:{dur:3}}}),'none');
});
