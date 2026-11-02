import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ROUTE_VIEW,nativeRouteCrop,routeRailSpots,routeVisualCast}
 from '../tools/pokearena/torre2-route-landscape.js';

test('T37 FireRed panoramic crop is a bounded authentic native tile region',()=>{
 const cases=[['pallet',1000,920],['pewter',1030,900],
  ['cerulean',1500,720],['mtmoon',700,590],['victory',1000,750],
  ['indigo',800,560]];
 for(const [id,w,h]of cases){
  const a=nativeRouteCrop(id,w,h);
  assert.ok(a,id+' missing native view');
  assert.ok(a.x>=0&&a.y>=0&&a.x+a.w<=w&&a.y+a.h<=h,id);
  assert.ok(Math.abs(a.w/a.h-ROUTE_VIEW.width/ROUTE_VIEW.height)<0.07,id);
  assert.ok(Object.isFrozen(a));
 }
 assert.equal(nativeRouteCrop('mtmoon',0,0),null);
 assert.equal(nativeRouteCrop(null,500,400),null);
});

test('T37 keeps every existing checkpoint in compact, navigable rails',()=>{
 for(const total of [0,13,15,17,19,25,27]){
  for(let offset=0;offset<=total;offset+=13){
   const length=Math.min(14,total+1-offset),items=routeRailSpots(offset,length,total);
   assert.equal(items.length,length);
   assert.deepEqual(items.map(s=>s.global),
    Array.from({length},(_,i)=>offset+i));
   assert.ok(items.every(s=>s.x>=27&&s.x<=470&&s.y===291));
   assert.ok(items.every(s=>s.global!==total||s.boss));
   assert.ok(Object.isFrozen(items));
  }
 }
 assert.throws(()=>routeRailSpots(-1,14,15),RangeError);
});

test('T37 only current trainer is drawn on route terrain, leader stays in interior',()=>{
 assert.deepEqual(routeVisualCast(0,13),{trainer:true,player:true});
 assert.deepEqual(routeVisualCast(13,13),{trainer:false,player:true});
 assert.deepEqual(routeVisualCast(12,13,true),{trainer:false,player:true});
});

test('T37 visual route refactor cannot change battle/save/RNG/control systems',()=>{
 const code=fs.readFileSync('tools/pokearena/torre2-route-landscape.js','utf8');
 assert.doesNotMatch(code,/saveCampaign|startBattle|resolveBattle|Math\.random|localStorage|xp\s*=|money\s*=/);
 const src=fs.readFileSync('tools/pokearena/torre2-battle-path.js','utf8');
 assert.match(src,/routeRailSpots\(offset,length,total\)/);
 assert.match(src,/nativeRouteCrop\(locale,src\.width,src\.height\)/);
 assert.match(src,/torre2-central-cta/);
 assert.match(src,/torre2-path-node/);
});
