import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 NATIVE_WALK_ROUTES,fieldRoad,roadPoint,closestRoadPoint,fieldStartDistance
} from '../tools/pokearena/torre2-map-playable-hud.js';
import {APPROVED_MAPS_ATLAS,USER_OPENING_MAPS} from '../tools/pokearena/torre2-approved-maps-atlas.js';

test('T89 all six stage-0 roads are valid bounded math vectors',()=>{
 assert.equal(Object.keys(NATIVE_WALK_ROUTES).length,6);
 for(const [id,route] of Object.entries(NATIVE_WALK_ROUTES)){
  const road=fieldRoad(route);
  assert.ok(road.total>.5&&road.total<3,id);
  for(const n of route)assert.ok(n.x>=0&&n.x<=1&&n.y>=0&&n.y<=1,id);
  const start=roadPoint(road,0),end=roadPoint(road,road.total);
  assert.equal(start.y,route[0].y,id);
  assert.equal(end.y,route.at(-1).y,id);
  const middle=roadPoint(road,road.total/2);
  assert.ok(closestRoadPoint(road,middle.x,middle.y).distance<1e-8,id);
  const nearest=closestRoadPoint(road,.5,.6);
  assert.ok(nearest.d>=0&&nearest.d<=road.total,id);
 }
});
test('T89 reversing routes enters the correct gate without changing save data',()=>{
 const r=fieldRoad(NATIVE_WALK_ROUTES['route-1']);
 const fromSouth=fieldStartDistance('route-1','pallet-town');
 const fromNorth=fieldStartDistance('route-1','viridian-city');
 assert.ok(fromSouth<fromNorth);
 assert.equal(fieldStartDistance('route-1',null,r.total*.4),r.total*.4);
 assert.throws(()=>closestRoadPoint(r,NaN,.3),TypeError);
 assert.throws(()=>fieldRoad([{x:0,y:0},{x:0,y:0}]),RangeError);
});
test('T89 the map is one native Phaser scene with original summaries and all six controls',()=>{
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 const renderer=readFileSync('tools/pokearena/torre2-approved-map-renderer.js','utf8');
 const hud=readFileSync('tools/pokearena/torre2-map-playable-hud.js','utf8');
 const build=readFileSync('tools/pokearena/build-preview.mjs','utf8');
 assert.match(source,/this\.scene\.stop\('titulo'\)/);
 assert.match(source,/this\.input\.setTopOnly\(true\)/);
 assert.match(source,/hideBackButton:!!NATIVE_WALK_ROUTES\[id\]/);
 assert.match(source,/installPlayableOverworld\(this,result/);
 assert.match(source,/onSummary:index=>this\.showSummary/);
 assert.match(source,/onBag:\(\)=>this\.bagScreen/);
 assert.match(source,/onDex:\(\)=>this\.dexScreen/);
 assert.match(source,/onBattle:\(\)=>this\.enterBattle/);
 assert.match(source,/onCapture:\(\)=>this\.grassScreen/);
 assert.match(renderer,/const back=hideBackButton\?null:/);
 for(const button of ['party','summary','bag','dex','battle','capture'])
  assert.ok(hud.includes("'"+button+"'"),button);
 assert.doesNotMatch(hud,/saveCampaign\(/);
 assert.match(build,/torre2-map-playable-hud\.js/);
 assert.equal(APPROVED_MAPS_ATLAS.maps.length,60);
 assert.equal(USER_OPENING_MAPS.length,4);
});
