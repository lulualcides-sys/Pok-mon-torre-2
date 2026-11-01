import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
// Source imports are rewritten only by build-preview.mjs; inspect the real GYMS
// constant without importing unbuilt aliases like './rematch-policy.js'.
const coreSource=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
const gymsLiteral=coreSource.match(/export const GYMS=Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(gymsLiteral,'canonical GYMS source must be readable');
const GYMS=JSON.parse(JSON.stringify(vm.runInNewContext('('+gymsLiteral[1]+')',Object.create(null),{timeout:1000})));
assert.match(coreSource,/export const TRAINERS_PER_GYM=stage=>stage<8\?13\+stage\*2/);
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
  assert.equal(13+stage*2,[13,15,17,19,21,23,25,27][stage],'no additional battles');
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
  assert.ok(p.aceX+p.maxWidth/2<415);
  assert.ok(p.leaderX-14>250);
  assert.ok(p.baseline<215,'must not overlap battle CTA y231');
 }
});
test('T35 native idle sheet renders one sprite, one shadow and no gameplay writes',()=>{
 const objects=[],animations=[];
 const obj=()=>({active:true,setOrigin(){return this},setScale(n){this.scale=n;return this},
  setDepth(n){this.depth=n;return this},setData(k,v){this[k]=v;return this},
  once(){return this},play(k){this.animation=k;return this}});
 let fileReady=null,queued=null;const handlers=new Map();
 const scene={
  scene:{isActive:()=>true},
  add:{ellipse(){const x=obj();objects.push(x);return x},sprite(){const x=obj();objects.push(x);return x}},
  textures:{exists:()=>false,get:()=>({frameTotal:8,setFilter(){}})},
  load:{once(k,fn){assert.equal(k,'filecomplete-spritesheet-torre2-gym-ace-0121');fileReady=fn;handlers.set(k,fn)},
   on(k,fn){handlers.set(k,fn)},off(k,fn){if(handlers.get(k)===fn)handlers.delete(k)},
   spritesheet(...args){queued=args},
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
 fileReady();
 assert.equal(handlers.size,0,'no lingering loader callbacks');
 assert.equal(report.ready,true);
 assert.equal(report.sprite['torre2-gym-ace'],'starmie');
 assert.equal(leader['torre2-gym-leader'],'Misty');
 assert.equal(animations.length,1);
 assert.equal(JSON.stringify(state),before);
});
test('T35 delayed asset load cannot draw on a destroyed gym view',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),token={active:true};
 let fileReady=null,created=0;const handlers=new Map();
 const obj=()=>({setDepth(){return this},setData(){return this}});
 const scene={scene:{isActive:()=>true},add:{ellipse(){return obj()},sprite(){created++;return obj()}},
  textures:{exists:()=>false},load:{once(k,fn){fileReady=fn;handlers.set(k,fn)},on(k,fn){handlers.set(k,fn)},
   off(k,fn){if(handlers.get(k)===fn)handlers.delete(k)},
   spritesheet(){},isLoading:()=>false,start(){}}};
 drawGymAce(scene,plan,()=>obj(),{token});
 token.active=false;scene.textures.exists=()=>true;fileReady();
 assert.equal(created,0,'never draw the ace on city/route/PC after navigation');
});

test('T35 unrelated global loader completion cannot hide the gym ace',()=>{
 const plan=gymAcePlan(GYMS,1,manifest),events=new Map();
 let loaded=false,sprites=0;
 const obj=()=>({setDepth(){return this},setData(){return this},setOrigin(){return this},
  setScale(){return this},once(){return this},play(){return this}});
 const scene={scene:{isActive:()=>true},
  add:{ellipse(){return obj()},sprite(){sprites++;return obj()}},
  textures:{exists:()=>loaded,get:()=>({frameTotal:1,setFilter(){}})},
  load:{once(k,fn){events.set(k,fn)},on(k,fn){events.set(k,fn)},
   off(k,fn){if(events.get(k)===fn)events.delete(k)},
   spritesheet(){},isLoading:()=>true,start(){}},
  anims:{exists:()=>true},tweens:{add(){}}
 };
 const report=drawGymAce(scene,plan,()=>obj());
 assert.equal(events.has('complete'),false,'never subscribe to unrelated global completion');
 assert.equal(report.ready,false);
 events.get('loaderror')({key:'unrelated-sheet'});
 assert.equal(report.reason,null,'unrelated asset errors must not affect ace');
 assert.equal(sprites,0);
 loaded=true;
 events.get('filecomplete-spritesheet-'+plan.textureKey)();
 assert.equal(report.ready,true);
 assert.equal(sprites,1);
 assert.equal(events.size,0,'file-specific listeners must be released');
});
test('T35 a failed PMD sheet leaves an explicit reason and no false sprite',()=>{
 const plan=gymAcePlan(GYMS,0,manifest),events=new Map();
 const obj=()=>({setDepth(){return this},setData(){return this}});
 const scene={scene:{isActive:()=>true},add:{ellipse(){return obj()},sprite(){throw Error('unexpected sprite')}},
  textures:{exists:()=>false},load:{once(k,fn){events.set(k,fn)},on(k,fn){events.set(k,fn)},
   off(k,fn){if(events.get(k)===fn)events.delete(k)},spritesheet(){},isLoading:()=>false,start(){}}};
 const report=drawGymAce(scene,plan,()=>obj());
 events.get('loaderror')({key:plan.textureKey});
 assert.equal(report.ready,false);
 assert.match(report.reason,/failed to load/);
 assert.equal(events.size,0);
});
