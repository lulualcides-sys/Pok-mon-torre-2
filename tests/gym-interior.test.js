import test from 'node:test';
import assert from 'node:assert/strict';
import {gymInteriorModel,gymRouteCount,ACE_ANCHORS} from '../tools/pokearena/torre2-gym-interior.js';
import {encounterRole} from '../tools/pokearena/torre2-encounter-layout.js';
// Shares the actual pure role selector consumed by routeNode in the game.
const routeNode=(stage,index,max)=>({type:encounterRole(stage,index,max)});


const aces=['onix','starmie','raichu','vileplume','weezing','alakazam','arcanine','rhyhorn'];
const gyms=aces.map((boss,i)=>({city:i?'Cerulean':'Pewter',leader:i?'Misty':'Brock',boss,leaderTeam:[boss]}));
const limit=s=>13+2*s;
const classicType=i=>i>0&&i%9===3?'rival':i>0&&i%7===5?'rocket':'trainer';

test('Brock: ten route encounters, three genuine gym trainers, no rival at the leader',()=>{
 const s={stage:0,trainer:10},before=JSON.stringify(s);
 const m=gymInteriorModel(s,gyms,limit,routeNode);
 assert.equal(m.routeCount,10);
 assert.deepEqual(m.trainers.map(x=>x.index),[10,11,12]);
 assert.ok(m.trainers.every(x=>x.kind==='trainer'),'No rival belongs to Brock gym');
 assert.equal(routeNode(0,9,limit(0)).type,'rival','Rival belongs on Route before the gym');
 assert.equal(routeNode(0,12,limit(0)).type,'trainer','Rival position replaced by gym trainer');
 assert.equal(JSON.stringify(s),before);
});
test('Misty: eleven route encounters, four gym trainers, and locked leader',()=>{
 const m=gymInteriorModel({stage:1,trainer:11},gyms,limit,routeNode);
 assert.equal(m.routeCount,11);
 assert.deepEqual(m.trainers.map(x=>x.index),[11,12,13,14]);
 assert.ok(m.trainers.every(x=>x.kind==='trainer'),'No rival belongs to Misty gym');
 assert.equal(routeNode(1,10,limit(1)).type,'rival');
 assert.equal(routeNode(1,12,limit(1)).type,'trainer');
 assert.equal(m.leaderReady,false);
 assert.equal(gymInteriorModel({stage:1,trainer:15},gyms,limit,routeNode).leaderReady,true);
});
test('every Kanto gym keeps original encounter count and rival battles on route only',()=>{
 aces.forEach((ace,stage)=>{
  const state={stage,trainer:limit(stage),team:[],badges:[]},before=JSON.stringify(state);
  const m=gymInteriorModel(state,gyms,limit,routeNode);
  assert.equal(m.ace,ace);assert.equal(m.aceInTeam,true);
  assert.equal(m.gymCount,stage===0?3:4);
  assert.equal(JSON.stringify(state),before,'Pure model cannot mutate saved data');
  assert.equal(m.trainers.length,m.gymCount);
  assert.ok(m.trainers.every(t=>t.kind==='trainer'),
   'Only specialist trainers may appear inside stage '+stage+' gym');
  assert.ok(m.trainers.every(t=>t.index>=m.routeCount&&t.index<limit(stage)));
  const all=Array.from({length:limit(stage)},(_,i)=>routeNode(stage,i,limit(stage)).type);
  const original=Array.from({length:limit(stage)},(_,i)=>classicType(i));
  assert.equal(all.length,original.length,'Encounter count must remain exact');
  assert.equal(all.filter(x=>x==='rival').length,original.filter(x=>x==='rival').length,
   'Rival encounter count must remain exact at stage '+stage);
  assert.equal(all.filter(x=>x==='rocket').length,original.filter(x=>x==='rocket').length,
   'Rocket encounter count must remain exact at stage '+stage);
  assert.ok(all.slice(m.routeCount).every(x=>x==='trainer'),
   'Neither Rival nor Rocket should appear inside any gym');
  assert.equal(all.at(-1),'trainer','The last gym battle cannot be Rival');
 });
 assert.ok(ACE_ANCHORS.ace[0]-ACE_ANCHORS.leader[0]>80);
 assert.equal(gymInteriorModel({stage:8},gyms,limit,routeNode),null);
});
test('route CTA never diverts a route Rival to the gym',()=>{
 for(const stage of [0,1,5,6]){
  const count=gymRouteCount(stage,limit);
  assert.ok(count>0);
  assert.equal(routeNode(stage,count-1,limit(stage)).type,'rival',
   'Final route Rival is outside gym stage '+stage);
  assert.notEqual(routeNode(stage,count,limit(stage)).type,'rival');
  assert.equal(count-1>=gymRouteCount(stage,limit),false);
  assert.equal(count>=gymRouteCount(stage,limit),true);
 }
 assert.equal(gymRouteCount(8,limit),null);
});

test('Rocket encounters remain on routes before Erika, Sabrina and Giovanni',()=>{
 for(const stage of [4,5,7]){
  const routeCount=gymRouteCount(stage,limit);
  const routeRoles=Array.from({length:routeCount},(_,i)=>routeNode(stage,i,limit(stage)).type);
  const gymRoles=Array.from({length:limit(stage)-routeCount},(_,i)=>
   routeNode(stage,routeCount+i,limit(stage)).type);
  assert.ok(routeRoles.includes('rocket'),'Rocket stays on route at stage '+stage);
  assert.ok(gymRoles.every(x=>x==='trainer'),'No Rocket in gym at stage '+stage);
 }
});