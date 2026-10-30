import test from 'node:test';import assert from 'node:assert/strict';
import {createTrainerStrategy,chooseTrainerSwitch} from '../tools/pokearena/torre2-trainer-strategy.js';
import {gen3Effectiveness} from '../tools/pokearena/torre2-gen3-types.js';
const mon=(types,type,hp=100)=>({types,hp,loadout:{lmb:{tipo:type,dano:10}}});
const request=(members,time=8,extra={})=>({time,activeIndex:0,members,opponentTypes:['WATER'],...extra});
const choose=(s,r)=>chooseTrainerSwitch(s,r,gen3Effectiveness);
test('important trainer switches from weak matchup to healthy useful reserve',()=>{
 const s=createTrainerStrategy(true),members=[mon(['FIRE'],'FIRE'),mon(['GRASS'],'GRASS')];
 assert.equal(choose(s,request(members,7)),-1);assert.equal(choose(s,request(members)),1);
 assert.equal(s.switches,1);assert.equal(s.nextSwitch,28);
 assert.equal(choose(s,request(members,9)),-1);assert.equal(choose(s,request(members,27)),-1);
});
test('never switches common trainers, during action/item/transition, to fainted or weak reserves',()=>{
 const members=[mon(['FIRE'],'FIRE'),mon(['GRASS'],'GRASS')];
 assert.equal(choose(createTrainerStrategy(),request(members)),-1);
 const s=createTrainerStrategy(true);assert.equal(choose(s,request(members,8,{blocked:true})),-1);assert.equal(s.switches,0);
 for(const hp of [0,1,25])assert.equal(choose(createTrainerStrategy(true),request([members[0],mon(['GRASS'],'GRASS',hp)])),-1);
 const locked=mon(['GRASS'],'GRASS');locked.loadout.lmb.pendiente=true;
 assert.equal(choose(createTrainerStrategy(true),request([members[0],locked])),-1);
});
test('healthy good matchup stays and low HP is preserved without changing HP or moves',()=>{
 const healthy=[mon(['GRASS'],'GRASS'),mon(['GRASS'],'GRASS')];assert.equal(choose(createTrainerStrategy(true),request(healthy)),-1);
 const members=[mon(['GRASS'],'GRASS',20),mon(['GRASS'],'GRASS',100)],before=JSON.stringify(members);
 assert.equal(choose(createTrainerStrategy(true),request(members)),1);assert.equal(JSON.stringify(members),before);
});
test('maximum three tactical switches per battle',()=>{
 const s=createTrainerStrategy(true),members=[mon(['FIRE'],'FIRE'),mon(['GRASS'],'GRASS')];
 for(const time of [8,28,48])assert.equal(choose(s,request(members,time)),1);
 assert.equal(choose(s,request(members,68)),-1);assert.equal(s.switches,3);
});

test('gym can swap to a healthy weather-favored reserve but never dodge the switch cap',()=>{
 const boss=createTrainerStrategy(true,{gymLeader:true});
 const foes=[mon(['FIRE'],'FIRE'),mon(['WATER'],'WATER')];
 const context=(weather,time=5)=>({time,activeIndex:0,members:foes,
  opponentTypes:['NORMAL'],weather});
 const rain={kind:'rain',remaining:12};
 assert.equal(choose(boss,context(rain)),1,'visible rain favors healthy Water');
 assert.equal(boss.switches,1);
 assert.equal(choose(boss,context(rain,10)),-1,'native cooldown remains active');
 assert.equal(choose(createTrainerStrategy(true),context(rain,8)),-1,
  'common trainers retain their approved tactical policy');
 assert.equal(choose(createTrainerStrategy(true,{gymLeader:true}),
  context({kind:'rain',remaining:0})),-1,'expired climate never counts');
});
test('gym cannot prefer friendly weather if the opposing matchup is worse',()=>{
 const boss=createTrainerStrategy(true,{gymLeader:true});
 const request={time:5,activeIndex:0,
  members:[mon(['FIRE'],'FIRE'),mon(['WATER'],'WATER')],
  opponentTypes:['GRASS'],weather:{kind:'rain',remaining:10}};
 assert.equal(choose(boss,request),-1);
 assert.equal(boss.switches,0);
});
