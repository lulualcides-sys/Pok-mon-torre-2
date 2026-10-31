import test from 'node:test';
import assert from 'node:assert/strict';
import {gymInteriorModel,gymRouteCount,ACE_ANCHORS} from '../tools/pokearena/torre2-gym-interior.js';
const aces=['onix','starmie','raichu','vileplume','weezing','alakazam','arcanine','rhyhorn'];
const gyms=aces.map((boss,i)=>({city:i?'Cerulean':'Pewter',leader:i?'Misty':'Brock',boss,leaderTeam:[boss]}));
const limit=s=>13+2*s;
const route=(s,i,n)=>({type:i>0&&i%9===3?'rival':i>0&&i%7===5?'rocket':'trainer',
 name:i>0&&i%9===3?'RIVAL':i>0&&i%7===5?'ROCKET':'TREINADOR'});
test('Brock: ten routes + three original gym encounters, rival identity intact',()=>{
 const s={stage:0,trainer:10},before=JSON.stringify(s),m=gymInteriorModel(s,gyms,limit,route);
 assert.equal(m.routeCount,10);assert.deepEqual(m.trainers.map(x=>x.index),[10,11,12]);
 assert.equal(m.trainers[2].identity,'RIVAL');assert.equal(JSON.stringify(s),before);
});
test('Misty: eleven routes + four original gym encounters; leader gated',()=>{
 const m=gymInteriorModel({stage:1,trainer:11},gyms,limit,route);
 assert.equal(m.routeCount,11);assert.deepEqual(m.trainers.map(x=>x.index),[11,12,13,14]);
 assert.equal(m.trainers[1].kind,'rival');assert.equal(m.leaderReady,false);
 assert.equal(gymInteriorModel({stage:1,trainer:15},gyms,limit,route).leaderReady,true);
});
test('all eight boss species match the existing gym team without state changes',()=>{
 aces.forEach((ace,stage)=>{
  const s={stage,trainer:limit(stage),team:[],badges:[]},before=JSON.stringify(s);
  const m=gymInteriorModel(s,gyms,limit,route);
  assert.equal(m.ace,ace);assert.equal(m.aceInTeam,true);
  assert.equal(m.gymCount,stage===0?3:4);assert.equal(JSON.stringify(s),before);
 });
 assert.ok(ACE_ANCHORS.ace[0]-ACE_ANCHORS.leader[0]>80);
 assert.equal(gymInteriorModel({stage:8},gyms,limit,route),null);
});

test('route CTA never diverts Brock trainer 9 to the gym before route trainer 10',()=>{
 assert.equal(gymRouteCount(0,limit),10);
 assert.equal(9>=gymRouteCount(0,limit),false);
 assert.equal(10>=gymRouteCount(0,limit),true);
 assert.equal(gymRouteCount(1,limit),11);
 assert.equal(10>=gymRouteCount(1,limit),false);
 assert.equal(11>=gymRouteCount(1,limit),true);
 assert.equal(gymRouteCount(8,limit),null);
});
