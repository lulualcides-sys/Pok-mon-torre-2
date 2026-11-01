import test from 'node:test';
import assert from 'node:assert/strict';
import {GYMS,TRAINERS_PER_GYM} from '../tools/pokearena/torre2-campaign-core.js';
import {GYM_ACE_VERSION,gymAcePlan,gymAcePlacement,drawGymAce} from '../tools/pokearena/torre2-gym-ace.js';

const expected=['onix','starmie','raichu','vileplume','weezing','alakazam','arcanine','rhyhorn'];
const dex=['0095','0121','0026','0045','0110','0065','0059','0111'];
const manifest=Object.fromEntries(dex.map(id=>[id,{anims:{Idle:{
 file:id+'/Idle-Anim.png',fw:48,fh:52,durations:[6,7,6,7]
}}}]));
test('T35 aces always reflect current GYMS boss, without replacing Giovanni with Nidoking',()=>{
 assert.equal(GYM_ACE_VERSION,'t35-native-idle-v1');
 assert.deepEqual(GYMS.map(x=>x.boss),expected);
 for(let stage=0;stage<8;stage++){
  const plan=gymAcePlan(GYMS,stage,manifest);
  assert.equal(plan.species,GYMS[stage].boss);
  assert.equal(plan.dex,dex[stage]);
  assert.ok(GYMS[stage].leaderTeam.includes(plan.species));
  assert.equal(plan.assetReady,true);
  assert.match(plan.file,/^assets\/pmd\/\d{4}\/Idle-Anim\.png$/);
  assert.equal(TRAINERS_PER_GYM(stage),13+stage*2,'no additional battles');
 }
 assert.equal(gymAcePlan(GYMS,8,manifest),null);
});
test('T35 rejects missing or malformed authentic Idle assets instead of using icons',()=>{
 assert.equal(gymAcePlan(GYMS,0,{}).assetReady,false);
 for(const bad of ['../../fake.png','0095/portrait.png','0095/../evil-Anim.png']){
  const m={'0095':{anims:{Idle:{file:bad,fw:32,fh:32,durations:[5]}}}};
  assert.equal(gymAcePlan(GYMS,0,m).assetReady,false,bad);
 }
 assert.throws(()=>gymAcePlan([{...GYMS[0],leaderTeam:['geodude']}],0,manifest));
});
test('T35 gym layout keeps leader, ace and touch buttons spatially separate',()=>{
 for(let stage=0;stage<8;stage++){
  const p=gymAcePlacement(gymAcePlan(GYMS,stage,manifest));
  assert.ok(p.aceX-p.leaderX>=50);
  assert.ok(p.aceX+p.maxWidth/2<405);
  assert.ok(p.leaderX-14>250);
  assert.ok(p.baseline<215,'must not overlap battle CTA y231');
 }
});
test('T35 native idle sheet renders one sprite, one shadow and no gameplay writes',()=>{
 const objects=[],animations=[];
 const obj=()=>({active:true,setOrigin(){return this},setScale(n){this.scale=n;return this},
  setDepth(n){this.depth=n;return this},setData(k,v){this[k]=v;return this},
  once(){return this},play(k){this.animation=k;return this}});
 let complete=null,queued=null;
 const scene={
  scene:{isActive:()=>true},
  add:{ellipse(){const x=obj();objects.push(x);return x},sprite(){const x=obj();objects.push(x);return x}},
  textures:{exists:()=>false,get:()=>({frameTotal:8,setFilter(){}})},
  load:{once(k,fn){assert.equal(k,'complete');complete=fn},spritesheet(...args){queued=args},
   isLoading:()=>false,start(){}},
  anims:{exists:()=>false,create(x){animations.push(x)},generateFrameNumbers:(_key,r)=>[r.start,r.end]},
  tweens:{add(){},killTweensOf(){}}
 };
 const state={stage:1,trainer:4,money:1400,team:[{id:'bulbasaur'}]};
 const before=JSON.stringify(state),plan=gymAcePlan(GYMS,1,manifest);
 const leader=obj();
 const report=drawGymAce(scene,plan,()=>leader);
 assert.equal(report.ready,false);
 assert.equal(queued[0],'torre2-gym-ace-0121');
 assert.equal(queued[1],'assets/pmd/0121/Idle-Anim.png');
 scene.textures.exists=()=>true;
 complete();
 assert.equal(report.ready,true);
 assert.equal(report.sprite['torre2-gym-ace'],'starmie');
 assert.equal(leader['torre2-gym-leader'],'Misty');
 assert.equal(animations.length,1);
 assert.equal(JSON.stringify(state),before);
});
test('T35 delayed asset load cannot draw on a destroyed gym view',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),token={active:true};
 let complete=null,created=0;
 const obj=()=>({setDepth(){return this},setData(){return this}});
 const scene={scene:{isActive:()=>true},add:{ellipse(){return obj()},sprite(){created++;return obj()}},
  textures:{exists:()=>false},load:{once(_k,fn){complete=fn},spritesheet(){},isLoading:()=>false,start(){}}};
 drawGymAce(scene,plan,()=>obj(),{token});
 token.active=false;scene.textures.exists=()=>true;complete();
 assert.equal(created,0,'never draw the ace on city/route/PC after navigation');
});
