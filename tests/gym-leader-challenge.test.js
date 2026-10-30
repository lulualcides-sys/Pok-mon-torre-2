import test from 'node:test';
import assert from 'node:assert/strict';
import {improveGymLeaderLoadout} from '../tools/pokearena/gym-leader-loadouts.js';
import {createTrainerStrategy,chooseTrainerSwitch,pressureGymLeaderInput}
 from '../tools/pokearena/torre2-trainer-strategy.js';
import {gen3Effectiveness} from '../tools/pokearena/torre2-gen3-types.js';
const atk=(name,dano=9,tipo='ROCK')=>({
 id:name,nombre:name,forma:'approved-pixel-art',dano,tipo,alcance:220,coste:14,cd:5
});
test('gym upgrades legal earned moves without touching existing approved attacks',()=>{
 const base={lmb:atk('tackle',5),rmb:atk('weak',4),q:atk('harden',0),
  e:atk('ult',10),esp:{nome:'dodge',forma:'dash'}};
 const approved=[atk('rock-tomb',8),atk('rock-blast',12),
  atk('earthquake',30,'GROUND')];
 const locked=(_m,slot,move)=>move.id==='earthquake'?'not-learned':
   move.id==='rock-blast'&&slot!==2?'slot':'';
 const out=improveGymLeaderLoadout({id:'onix',level:14,loadout:base,
  available:approved,slotReason:locked,types:['ROCK','GROUND']});
 assert.strictEqual(out.lmb,base.lmb);assert.strictEqual(out.esp,base.esp);
 assert.equal(out.rmb.id,'rock-tomb');assert.equal(out.q.id,'rock-blast');
 assert.equal(out.e.id,'ult');assert.equal(base.q.nombre,'harden');
 assert.equal(improveGymLeaderLoadout({}),undefined);
});
test('gym pressure only fires cooldown/energy-legal basic, never overrides native attacks or evasion',()=>{
 const actor={x:0,y:0,t:4,hp:80,hpMax:100,energia:50,calor:10,
  cd:{lmb:0},est:{},kit:{lmb:{alcance:175,coste:10}}};
 const foe={x:90,y:0,hp:100,est:{}},input={mx:0,my:0,ax:0,ay:0};
 const scene={fase:'lucha',t:5,datos:{torre2:{party:{gymLeader:true}}}};
 const meter={nextBasicAt:2},pressed=pressureGymLeaderInput(scene,actor,foe,input,meter);
 assert.equal(pressed.lmb,true);assert.deepEqual([pressed.ax,pressed.ay],[90,0]);
 assert.equal(meter.nextBasicAt,6.2);assert.equal(input.lmb,undefined);
 assert.strictEqual(pressureGymLeaderInput(scene,actor,foe,input,meter),input);
 for(const change of [{cd:{lmb:2}},{energia:0},{calor:98},
   {kit:{lmb:{alcance:175,coste:10,pendiente:true}}},{est:{aturdido:true}}]){
  const x={...actor,...change};
  assert.equal(pressureGymLeaderInput({...scene,t:8},x,foe,input,{nextBasicAt:0}).lmb,
   undefined,'leader attack must respect native readiness and status');
 }
 for(const kind of [{...input,e:true},{...input,rmb:true},{...input,esp:true}]){
  assert.strictEqual(pressureGymLeaderInput(scene,actor,foe,kind,{nextBasicAt:0}),kind);
 }
 assert.strictEqual(pressureGymLeaderInput({...scene,datos:{modo:'arena'}},actor,foe,input,{}),input);
});
test('gym tactics react earlier, but stay limited to three swaps with timeouts',()=>{
 const m=(type,hp=100)=>({types:[type],hp,
  loadout:{lmb:atk(type,10,type)}});
 const list=[m('FIRE'),m('GRASS')],s=createTrainerStrategy(true,{gymLeader:true});
 const ctx=time=>({time,activeIndex:0,members:list,opponentTypes:['WATER']});
 assert.equal(chooseTrainerSwitch(s,ctx(4),gen3Effectiveness),-1);
 assert.equal(chooseTrainerSwitch(s,ctx(5),gen3Effectiveness),1);
 assert.equal(s.nextSwitch,21);
 assert.equal(chooseTrainerSwitch(s,ctx(20),gen3Effectiveness),-1);
 assert.equal(chooseTrainerSwitch(s,ctx(21),gen3Effectiveness),1);
 assert.equal(chooseTrainerSwitch(s,ctx(37),gen3Effectiveness),1);
 assert.equal(chooseTrainerSwitch(s,ctx(53),gen3Effectiveness),-1);
 assert.equal(s.switches,3);
 assert.deepEqual(createTrainerStrategy(true),{
  enabled:true,gymLeader:false,nextCheck:8,nextSwitch:8,switches:0
 });
});

test('leader pressure respects native airborne immunity and resumes after landing',()=>{
 const actor={x:0,y:0,t:6,hp:100,hpMax:100,energia:40,calor:0,
  cd:{lmb:0},est:{},kit:{lmb:{alcance:180,coste:12}}};
 const foe={x:60,y:0,hp:100,est:{vuelo:{hasta:9}}};
 const scene={fase:'lucha',t:8,datos:{torre2:{party:{gymLeader:true}}}};
 const input={mx:0,my:0},before=JSON.stringify(input);
 const blocked=pressureGymLeaderInput(scene,actor,foe,input,{nextBasicAt:0});
 assert.equal(blocked.lmb,undefined);
 assert.equal(JSON.stringify(input),before,'no native input mutation');
 foe.est.vuelo.hasta=6;
 const allowed=pressureGymLeaderInput(scene,actor,foe,input,{nextBasicAt:0});
 assert.equal(allowed.lmb,true);
 assert.equal(allowed.ax,foe.x);
});
