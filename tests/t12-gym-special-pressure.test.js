import test from 'node:test';
import assert from 'node:assert/strict';
import {pressureGymLeaderInput,createTrainerStrategy,chooseTrainerSwitch}
 from '../tools/pokearena/torre2-trainer-strategy.js';
import {gen3Effectiveness} from '../tools/pokearena/torre2-gen3-types.js';

const move=(name,type,damage=10,extras={})=>({
 id:name,nombre:name,tipo:type,dano:damage,forma:'native-approved',
 alcance:180,coste:15,cd:5,...extras
});
const ctx=(extras={})=>{
 const actor={x:0,y:0,t:6,hp:95,hpMax:100,tipos:['WATER'],
  energia:80,calor:0,cd:{lmb:0,rmb:0,q:0,e:0},est:{},kit:{
   lmb:move('water-gun','WATER',6),
   rmb:move('bubble-beam','WATER',11),
   q:move('ice-beam','ICE',14)}};
 const foe={x:120,y:0,hp:100,hpMax:100,tipos:['GRASS'],est:{}};
 const scene={fase:'lucha',t:6,datos:{torre2:{party:{gymLeader:true}}},efectos:[]};
 const input={mx:0,my:0,ax:0,ay:0};
 const state={nextBasicAt:0,nextSpecialAt:0,assisted:0,assistedSpecials:0};
 return {scene,actor,foe,input,state,...extras};
};
const decide=c=>pressureGymLeaderInput(c.scene,c.actor,c.foe,c.input,c.state);

test('T12 Gym uses equipped super-effective Q over resisted Water and keeps target/controls',()=>{
 const c=ctx(),before=JSON.stringify(c.actor);
 const result=decide(c);
 assert.equal(result.q,true);
 assert.equal(result.lmb,false);
 assert.equal(result.rmb,false);
 assert.deepEqual([result.ax,result.ay],[120,0]);
 assert.equal(c.state.nextSpecialAt,8.3);
 assert.equal(c.state.nextBasicAt,0);
 assert.equal(JSON.stringify(c.actor),before,'No energy, damage, cooldown or move mutation');
 assert.equal(c.input.q,undefined,'Do not mutate original CPU input');
});

test('T12 Gym can prefer RMB when stronger against opponent but never selects E',()=>{
 const c=ctx();c.foe.tipos=['FIRE'];c.actor.kit.q=move('weak-ice','ICE',2);
 c.actor.kit.rmb=move('hydro-pump','WATER',18);
 c.actor.kit.e=move('high-ult','WATER',1000);
 const result=decide(c);
 assert.equal(result.rmb,true);
 assert.equal(result.q,false);
 assert.equal(result.e,undefined);
});

test('T12 Gym does not replace useful LMB with a weaker secondary',()=>{
 const c=ctx();c.foe.tipos=['WATER'];
 c.actor.kit.lmb=move('thunderbolt','ELECTRIC',16);
 c.actor.kit.rmb=move('tackle','NORMAL',5);
 c.actor.kit.q=move('weak-ice','ICE',2);
 const output=decide(c);
 assert.equal(output.lmb,true);
 assert.equal(output.q,undefined);assert.equal(output.rmb,undefined);
 assert.equal(c.state.nextSpecialAt,0);
});

test('T12 no special when cooldown, insufficient energy, heat or unsafe provenance',()=>{
 const cases=[
  c=>{c.actor.cd.q=3;c.actor.cd.rmb=5;},
  c=>{c.actor.energia=1;},
  c=>{c.actor.calor=85;},
  c=>{c.actor.kit.q.pendiente=true;c.actor.kit.rmb.pendiente=true;},
  c=>{c.actor.kit.q.torre2Unavailable=true;c.actor.kit.rmb.torre2Unavailable=true;},
  c=>{c.actor.kit.q.forma=null;c.actor.kit.rmb.forma=null;},
  c=>{c.actor.kit.q.torre2RequiresTM=true;c.actor.kit.rmb.torre2RequiresHM=true;},
  c=>{c.actor.kit.q.coste=Infinity;c.actor.kit.rmb.coste=-1;},
  c=>{c.actor.cd.q=NaN;c.actor.cd.rmb=NaN;}
 ];
 for(const mutate of cases){
  const c=ctx();mutate(c);const result=decide(c);
  assert.equal(result.q,undefined);
  assert.equal(result.rmb,undefined);
  assert.equal(c.state.nextSpecialAt,0,'Illegal cast should not arm throttle');
 }
});

test('T12 special respects range, native protected input and defensive transitions',()=>{
 const c=ctx();c.foe.x=220;
 assert.equal(decide(c).q,undefined,'Native reach cannot be bypassed');
 for(const input of [{...c.input,lmb:true},{...c.input,rmb:true},
  {...c.input,esp:true},{...c.input,e:true},{...c.input,mega:true}]){
  const v={...ctx(),input};assert.strictEqual(decide(v),input);
 }
 for(const mutate of [
  c=>{c.scene.fase='intro';},c=>{c.scene.pausado=true;},
  c=>{c.scene.__torre2Changing=true;},
  c=>{c.scene.__torre2BattleBagOpen=true;},
  c=>{c.actor.dash={};},c=>{c.actor.accion={};},
  c=>{c.actor.est.dormido=true;},c=>{c.actor.est.congelado=true;},
  c=>{c.actor.hp=30;},c=>{c.foe.hp=0;},
  c=>{c.foe.est.contra=true;},c=>{c.foe.est.invul={hasta:10};},
  c=>{c.scene.efectos=[{vivo:true,dueno:c.foe,x:30,y:0}];}
 ]){const v=ctx();mutate(v);const result=decide(v);
  assert.equal(result.q,undefined,'Unsafe actor/scene must not force a special');
 }
});

test('T12 throttles assisted specials without bypassing native cooldowns',()=>{
 const c=ctx();
 assert.equal(decide(c).q,true);
 c.scene.t=7;c.actor.t=7;assert.equal(decide(c).q,undefined);
 c.scene.t=8.3;c.actor.t=8.3;assert.equal(decide(c).q,true);
 assert.equal(c.state.nextSpecialAt,10.6);
 c.actor.cd.q=2;c.actor.cd.rmb=4;c.scene.t=11;c.actor.t=11;
 assert.equal(decide(c).q,undefined);
});

test('T12 immune and dual types obey Gen III, not a fabricated advantage',()=>{
 const c=ctx();c.actor.tipos=['GROUND'];c.foe.tipos=['FLYING'];
 c.actor.kit.lmb=move('tackle','NORMAL',5);
 c.actor.kit.q=move('earthquake','GROUND',100);
 c.actor.kit.rmb=move('rock-blast','ROCK',12);
 assert.equal(decide(c).rmb,true,'Rock can hit flying; Ground cannot');
 const d=ctx();d.foe.tipos=['GHOST'];
 d.actor.kit.lmb=move('tackle','NORMAL',90);
 d.actor.kit.q=move('confusion','PSYCHIC',12);
 d.actor.kit.rmb=move('shadow-ball','GHOST',11);
 assert.equal(decide(d).rmb,true,'Ghost hits Ghost super-effectively');
});

test('T12 still preserves gym 3-switch limit and original ordinary-trainer setup',()=>{
 const gym=createTrainerStrategy(true,{gymLeader:true});
 assert.equal(gym.switches,0);
 assert.deepEqual(createTrainerStrategy(true),{
  enabled:true,gymLeader:false,nextCheck:8,nextSwitch:8,switches:0
 });
 const members=[{types:['FIRE'],hp:100,loadout:{lmb:move('ember','FIRE',10)}},
 {types:['GRASS'],hp:100,loadout:{lmb:move('vine','GRASS',10)}}];
 const args=time=>({time,activeIndex:0,members,opponentTypes:['WATER']});
 for(const time of [5,21,37])assert.equal(
  chooseTrainerSwitch(gym,args(time),gen3Effectiveness),1);
 assert.equal(chooseTrainerSwitch(gym,args(53),gen3Effectiveness),-1);
 assert.equal(gym.switches,3);
});

test('T12 Gym tactics never leak to common trainers or Arena/VS',()=>{
 for(const scene of [
  {fase:'lucha',t:6,datos:{torre2:{party:{gymLeader:false}}}},
  {fase:'lucha',t:6,datos:{modo:'arena'}},
  {fase:'lucha',t:6,datos:{modo:'versus'}}
 ]){
  const c=ctx({scene});assert.strictEqual(decide(c),c.input);
 }
});
