import test from "node:test";
import assert from "node:assert/strict";
import {MAGNITUDE_TABLE,magnitudeGen3,presentGen3,tripleKickGen3,friendshipPowerGen3,
 hiddenPowerGen3,beatUpGen3Participants} from "../tools/pokearena/torre2-johto-gen3-mechanics.js";
test("Magnitude Gen III has seven correct weighted powers",()=>{
 assert.deepEqual(MAGNITUDE_TABLE.map(t=>t.level),[4,5,6,7,8,9,10]);
 assert.deepEqual(MAGNITUDE_TABLE.map(t=>t.power),[10,30,50,70,90,110,150]);
 assert.deepEqual(MAGNITUDE_TABLE.map(t=>t.weight),[5,10,20,30,20,10,5]);
 assert.equal(MAGNITUDE_TABLE.reduce((s,x)=>s+x.weight,0),100);
 for(const [u,tier] of [[0,4],[.049,4],[.05,5],[.149,5],[.15,6],[.349,6],[.35,7],[.649,7],[.65,8],[.849,8],[.85,9],[.949,9],[.95,10],[.999,10]])
  assert.equal(magnitudeGen3(()=>u).level,tier,"roll "+u);
});
test("Present Gen III outcome distribution 40/30/10 damage and 20 heal",()=>{
 for(const [r,kind,power] of [[0,"damage",40],[.399,"damage",40],[.4,"damage",80],[.699,"damage",80],[.7,"damage",120],[.799,"damage",120],[.8,"heal",null],[.999,"heal",null]]){
  const p=presentGen3(()=>r);assert.equal(p.kind,kind);
  if(kind==="damage")assert.equal(p.power,power);
  else assert.equal(p.fraction,.25);
 }
});
test("Triple Kick hit windows 10, 20, 30 always accuracy gated",()=>{
 for(let i=0;i<3;i++){
  const a=tripleKickGen3(i);assert.equal(a.power,10*(i+1));assert.equal(a.checkAccuracy,true);
  assert.equal(a.stopOnMiss,true);
 }
 assert.throws(()=>tripleKickGen3(3),RangeError);
});
test("Gen III IV-based Hidden Power and Friendship only resolve with actual input",()=>{
 assert.equal(hiddenPowerGen3(null),null);
 assert.deepEqual({...hiddenPowerGen3(Object.fromEntries(
 ["hp","attack","defense","speed","spAttack","spDefense"].map(n=>[n,31])))},{type:"DARK",power:70});
 assert.deepEqual({...hiddenPowerGen3(Object.fromEntries(
 ["hp","attack","defense","speed","spAttack","spDefense"].map(n=>[n,0])))},{type:"FIGHTING",power:30});
 assert.equal(friendshipPowerGen3(null),null);
 assert.equal(friendshipPowerGen3(255),102);
 assert.equal(friendshipPowerGen3(255,true),1);
});
test("Beat Up doesn't invent 6 allies in one-on-one Mewtwo lab",()=>{
 assert.equal(beatUpGen3Participants(null),1);
 assert.equal(beatUpGen3Participants([{hp:10,est:{}},{hp:0,est:{}}]),1);
 assert.equal(beatUpGen3Participants([{hp:10,est:{}},{hp:10,est:{veneno:true}},{hp:20,est:{}}]),2);
});
