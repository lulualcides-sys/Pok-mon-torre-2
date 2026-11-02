import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrainerItems,trainerItemStep} from '../tools/pokearena/torre2-trainer-items.js';
import {makeBattleReport} from '../tools/pokearena/torre2-battle-report.js';
import {createWeather,setWeather,tickWeather,weatherResidualImmune,
 weatherAccuracy,weatherThunderMiss,weatherRecoveryFraction,weatherFromMove}
 from '../tools/pokearena/torre2-weather.js';

const mon=(id,uid,level)=>({id,uid,progression:{level}});
const snapshot=team=>({team,money:0,wins:0,losses:0,badges:[],gymTMClaims:[],leagueHonors:[]});

test('T31 leader Full Restore completes safely when native actor has no status object',()=>{
 const s=createTrainerItems({fullrestore:1});
 const actor={hp:14,hpMax:100};
 assert.equal(trainerItemStep(s,actor,'leader',0)?.kind,'started');
 assert.equal(trainerItemStep(s,actor,'leader',1.2)?.kind,'healed');
 assert.equal(actor.hp,100);
 assert.equal(s.uses,1);
 assert.equal(s.inventory.fullrestore,0);
});

test('T31 invalid pending item, KO and missing actor cannot crash a native fight',()=>{
 const s=createTrainerItems({potion:1});
 s.pending={item:'unknown-old-item',identity:'boss',until:1};
 assert.doesNotThrow(()=>{
  assert.equal(trainerItemStep(s,{hp:20,hpMax:100,est:{}},'boss',2)?.kind,'cancelled');
 });
 assert.equal(s.pending,null);
 assert.equal(trainerItemStep(s,null,'boss',3),null);
 const a={hp:20,hpMax:100};
 assert.equal(trainerItemStep(s,a,'boss',4)?.kind,'started');
 assert.equal(trainerItemStep(s,null,'boss',5),null);
});

test('T31 invalid clock, HP and infinite stock cannot create unlimited trainer heals',()=>{
 const empty=createTrainerItems({potion:Infinity,superpotion:-2});
 const a={hp:10,hpMax:100,est:{}};
 assert.equal(trainerItemStep(empty,a,1,0),null);
 assert.equal(empty.uses,0);
 const s=createTrainerItems({potion:1});
 assert.equal(trainerItemStep(s,a,1,NaN),null);
 assert.equal(trainerItemStep(s,{hp:NaN,hpMax:100,est:{}},1,0),null);
 assert.equal(trainerItemStep(s,a,1,0)?.kind,'started');
});

test('T31 report must not confuse a new captured UID with a previous party slot',()=>{
 const before=snapshot([mon('bulbasaur','old-a',8),mon('squirtle','old-b',8)]);
 const after=snapshot([mon('rattata','new-c',7),mon('squirtle','old-b',9)]);
 const oldCopy=JSON.stringify(before),newCopy=JSON.stringify(after);
 const r=makeBattleReport(before,after,{won:true,sharedExp:[
  {uid:'new-c',index:0,reward:0},{uid:'old-b',index:1,reward:29}
 ]});
 assert.deepEqual(r.evolutions,[],'A replacement is not an evolution');
 assert.deepEqual(r.team.map(m=>m.id),['squirtle']);
 assert.equal(r.team[0].experience,29);
 assert.equal(JSON.stringify(before),oldCopy);
 assert.equal(JSON.stringify(after),newCopy);
});

test('T31 migrated legacy UID can still report an earned level without inventing evolution',()=>{
 const before=snapshot([mon('pidgey',undefined,6)]);
 const after=snapshot([mon('pidgey','generated-uid',7)]);
 const r=makeBattleReport(before,after,{won:true,sharedExp:[
  {uid:'generated-uid',index:0,reward:80}
 ]});
 assert.deepEqual(r.evolutions,[]);
 assert.equal(r.team.length,1);
 assert.equal(r.team[0].levelBefore,6);
 assert.equal(r.team[0].levelAfter,7);
});

test('T31 unexpected shared experience payload must not crash results or invent rewards',()=>{
 const before=snapshot([mon('pikachu','p',12)]);
 const after=snapshot([mon('pikachu','p',12)]);
 const r=makeBattleReport(before,after,{won:true,sharedExp:{oops:true}});
 assert.equal(r.team[0].experience,0);
 assert.deepEqual(r.moves,[]);
 assert.deepEqual(r.badges,[]);
});

test('T31 climate residual tolerates partial native actor data without poisoning HP',()=>{
 const w=createWeather();setWeather(w,'sand');
 assert.equal(weatherResidualImmune('sand',null),false);
 const unknown={hp:160,hpMax:160,tipos:null};
 const malformed={hp:160,hpMax:NaN,tipos:['NORMAL']};
 assert.deepEqual(tickWeather(w,4,[unknown,malformed]),[]);
 assert.equal(unknown.hp,150,'Unknown typing does not receive imaginary immunity');
 assert.equal(malformed.hp,160,'Invalid HP maximum cannot create NaN health');
 assert.equal(tickWeather(null,4,[]).length,0);
 assert.equal(weatherFromMove(null,{nombre:'Rain Dance'}),undefined);
});

test('T31 expired weather cannot keep Thunder accuracy/roll or sun healing',()=>{
 const expired={kind:'sun',remaining:0};
 assert.equal(weatherAccuracy(expired,'Thunder',70),70);
 assert.equal(weatherRecoveryFraction(expired),.5);
 assert.equal(weatherThunderMiss(expired,'Thunder',()=>{
  throw new Error('Expired weather must not roll RNG');
 }),false);
 const active=createWeather();setWeather(active,'sun');
 assert.equal(weatherAccuracy(active,'Thunder',70),50);
 assert.equal(weatherThunderMiss(active,'Thunder',()=>.9),true);
});
