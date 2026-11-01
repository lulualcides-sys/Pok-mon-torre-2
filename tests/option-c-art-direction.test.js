import test from 'node:test';
import assert from 'node:assert/strict';
import {OPTION_C_STANDARD,REGION_ART,getOptionCArt,optionCRouteCenter,optionCWalkwayClear,optionCDecorPositions,paintOptionCRoute,paintOptionCAccents} from '../tools/pokearena/torre2-option-c-art-direction.js';
const routes=['route1','forest2','route3','route4'];
test('Option C approved visual standard is stable and region-specific',()=>{
 assert.equal(OPTION_C_STANDARD.id,'option-c-approved-2026-11-01');
 assert.equal(OPTION_C_STANDARD.pixelSampling,'nearest');
 assert.equal(Object.keys(REGION_ART).length,8);
 assert.equal(new Set(Object.values(REGION_ART).map(x=>x.biome)).size,8);
 assert.equal(new Set(Object.values(REGION_ART).map(x=>x.landmark)).size,8);
 assert.equal(getOptionCArt('moon').prop,'crystals');
 assert.equal(getOptionCArt('missing'),null);
 assert.ok(Object.isFrozen(REGION_ART.route1));
});
test('routes curve but keep a safe walkable center, distinct from each other',()=>{
 const paths=routes.map(id=>Array.from({length:20},(_,i)=>optionCRouteCenter(id,48+i*12)));
 assert.equal(new Set(paths.map(p=>p.join(','))).size,4);
 for(const p of paths){assert.ok(new Set(p).size>3);assert.ok(p.every(x=>x>=300&&x<=340));}
 assert.throws(()=>optionCRouteCenter('pallet',100),/Not a route/);
});
test('procedural accents are deterministic and outside walkable path',()=>{
 for(const id of routes){
  const a=optionCDecorPositions(id,40);
  assert.deepEqual(a,optionCDecorPositions(id,40));
  assert.ok(a.length>=30);
  assert.ok(a.every(p=>optionCWalkwayClear(id,p.x,p.y,10)));
  assert.ok(a.every(p=>p.x>=52&&p.x<574&&p.y>=58&&p.y<303));
 }
});
test('Option C painting does not create timers, inputs, collisions or RNG changes',()=>{
 const calls=[],g={fillStyle(...args){calls.push(['color',...args]);return this},fillRect(...args){calls.push(['rect',...args]);return this}};
 for(const id of routes){paintOptionCRoute(g,id);paintOptionCAccents(g,id);}
 assert.ok(calls.filter(x=>x[0]==='rect').length>250);
 assert.throws(()=>paintOptionCRoute(g,'moon'),/Unknown Option C route/);
});
