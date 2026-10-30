import test from 'node:test';
import assert from 'node:assert/strict';
import {improveGymLeaderLoadout} from '../tools/pokearena/gym-leader-loadouts.js';
import {createTrainerStrategy,chooseTrainerSwitch,pressureGymLeaderInput}
 from '../tools/pokearena/torre2-trainer-strategy.js';
import {gen3Effectiveness} from '../tools/pokearena/torre2-gen3-types.js';
import {createPartyMatch} from '../tools/pokearena/torre2-party-battle.js';
import {GYMS,createCampaign,currentOpponent,TRAINERS_PER_GYM}
 from '../tools/pokearena/torre2-campaign-core.js';
import {availableMoves,campaignMoveSlotReason,resolveLoadout}
 from '../tools/pokearena/torre2-move-pool.js';
const atk=(name,dano=9,tipo='ROCK')=>({
 id:name,nombre:name,forma:'approved-pixel-art',dano,tipo,alcance:220,coste:14,cd:5
});
test('all eight gym parties preserve FRLG species, ace levels and earned legal attacks',()=>{
 for(let stage=0;stage<8;stage++){
  const state=createCampaign('bulbasaur');
  state.stage=stage;state.trainer=TRAINERS_PER_GYM(stage);
  const opponent=currentOpponent(state),party=createPartyMatch(state,opponent);
  const gym=GYMS[stage];
  assert.equal(opponent.leader,true);
  assert.equal(party.gymLeader,true);
  assert.deepEqual(party.foes.map(m=>m.id),gym.leaderTeam);
  assert.deepEqual(party.foes.map(m=>m.level),gym.leaderLevels);
  assert.deepEqual(party.trainerItems,stage===0?{potion:1}:
   stage===1?{superpotion:1}:stage===2?{superpotion:2}:
   stage===3?{hyperpotion:1}:{hyperpotion:2});
  for(const foe of party.foes){
   const member={id:foe.id,progression:{species:foe.id,level:foe.level}};
   const baseline=resolveLoadout(member);
   assert.equal(foe.loadout.lmb?.id,baseline.lmb?.id);
   assert.deepEqual(foe.loadout.esp,baseline.esp);
   assert.ok(Object.values(foe.loadout).every(m=>!m?.pendiente));
   if(stage!==2){
    const legal=new Set(availableMoves(member).map(m=>m.id));
    for(const [slot,index] of [['rmb',1],['q',2],['e',3]]){
     const move=foe.loadout[slot];
     if(move?.id!==baseline[slot]?.id){
      assert.ok(legal.has(move.id),'new leader move must be legitimately available');
      assert.equal(campaignMoveSlotReason(member,index,move),null);
      assert.notEqual(move.id,'surf');
      assert.ok(move.forma,'real native pixel renderer must exist');
     }
    }
   }
  }
 }
});
test('ordinary trainers and wild encounters keep non-gym AI and original moves',()=>{
 const state=createCampaign('bulbasaur');
 state.trainer=2;const opponent=currentOpponent(state);
 const t=createPartyMatch(state,opponent);
 assert.equal(t.gymLeader,false);
 for(const foe of t.foes){
  const base=resolveLoadout({id:foe.id,progression:{species:foe.id,level:foe.level}});
  assert.deepEqual(foe.loadout,base);
 }
 assert.equal(createPartyMatch(state,{...opponent,leader:false},true).gymLeader,false);
});
test('Surge approved authored kits remain distinct and untouched',()=>{
 const s=createCampaign('bulbasaur');s.stage=2;s.trainer=TRAINERS_PER_GYM(2);
 const party=createPartyMatch(s,currentOpponent(s));
 assert.deepEqual(party.foes.map(m=>m.id),['voltorb','pikachu','raichu']);
 const names=party.foes.map(x=>['lmb','rmb','q','e'].map(k=>x.loadout[k]?.nombre));
 assert.deepEqual(names,[
  ['Tackle','Sonic Boom','Screech','Shock Wave'],
  ['Quick Attack','Thunder Shock','Thunder Wave','Shock Wave'],
  ['Quick Attack','Thunder Wave','Shock Wave','Thunderbolt']
 ]);
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
