'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const m=require('../tools/research/pb-ranked-math-atlas.cjs');
const read=x=>JSON.parse(fs.readFileSync(path.resolve('reference-library/pb-ranked',x),'utf8'));
const approx=(a,b,tolerance=1e-5)=>assert.ok(Math.abs(a-b)<tolerance,a+' != '+b);

test('vector ball: parabolic arc has anchored endpoints and maximum height at midpoint',()=>{
 const p0=m.point(10,30),p1=m.point(110,30);
 assert.deepEqual(m.parabolicArc(p0,p1,20,0),p0);
 assert.deepEqual(m.parabolicArc(p0,p1,20,1),p1);
 assert.deepEqual(m.parabolicArc(p0,p1,20,.5),{x:60,y:10});
 assert.deepEqual(m.parabolicArc(p0,p1,20,-1),p0);
 assert.throws(()=>m.parabolicArc(p0,p1,-1,.5),/invalid arc/);
});
test('quadratic and cubic Bezier interpolation are stable and bounded at the endpoints',()=>{
 const a=m.point(0,0),b=m.point(20,20),c=m.point(40,0),d=m.point(80,30);
 assert.deepEqual(m.quadraticBezier(a,b,c,0),a);
 assert.deepEqual(m.quadraticBezier(a,b,c,1),c);
 assert.deepEqual(m.quadraticBezier(a,b,c,.5),{x:20,y:10});
 assert.deepEqual(m.cubicBezier(a,b,c,d,0),a);
 assert.deepEqual(m.cubicBezier(a,b,c,d,1),d);
 approx(m.cubicBezier(a,b,c,d,.5).x,32.5);
 assert.deepEqual(m.dashMotion(a,d,0),a);
 assert.deepEqual(m.dashMotion(a,d,1),d);
 assert.deepEqual(m.dashMotion(a,d,.5),{x:40,y:15});
});
test('swept collision catches inter-frame impact that endpoint-only hitboxes miss',()=>{
 const a0=m.point(-10,0),a1=m.point(10,0),target=m.point(0,0);
 const hit=m.sweptCircleCollision(a0,a1,1,target,target,1);
 assert.equal(hit.hit,true);
 approx(hit.firstHitFraction01,.4);
 approx(hit.closestFraction01,.5);
 assert.equal(hit.minCenterDistance,0);
 assert.equal(m.sweptCircleCollision(m.point(-10,20),m.point(10,20),1,target,target,1).hit,false);
 assert.equal(m.sweptCircleCollision(target,target,1,target,target,1).firstHitFraction01,0);
 assert.throws(()=>m.sweptCircleCollision(a0,a1,-1,target,target,1),/radius/);
});
test('frame markers produce frame-ordinal positions and unknown-time caveats, not fake seconds',()=>{
 const a=m.sourceAnimation('1005',{state:'Attack',frames:12,durationSum:26,hitFrame:3,returnFrame:6,rushFrame:2});
 assert.equal(a.n,12);
 approx(a.markers.hit.ordinalFraction01,3/11);
 approx(a.averageUnitsPerFrame,26/12);
 approx(a.markers.hit.uniformDurationEstimate,26*3.5/12);
 assert.equal(a.markerOrdering,'rush_hit_return');
 assert.throws(()=>m.sourceAnimation('x',{state:'Attack',frames:3,durationSum:5,hitFrame:3,returnFrame:null,rushFrame:null}),/Marker outside/);
 assert.equal(m.frameMarker(null,4,9),null);
 assert.equal(m.frameMarker(0,1,6).ordinalFraction01,0);
});
test('3815 metadata rows, 283 references and updated 246/176 coverage are reproducible',()=>{
 const atlas=m.model({animations:read('animacoes-marcadores-estados.json'),
  families:read('FAMILIAS-ESTRUTURAIS-283-GOLPES.json'),
  progress:read('PROGRESSO-GOLPES-283-2026-10-31.json'),
  delta:read('DELTA-REAL-2026-11-01.json')});
 assert.deepEqual(atlas.coverage,{
  spriteIds:237,animationStateEntries:3815,staticMoves:283,
  rosterMoves:246,rosterMovesWithReportedUse:70,rosterMovesPendingBattleUse:176,
  protectedMoveNames:45
 });
 assert.equal(atlas.animationMathRows.length,3815);
 assert.equal(atlas.moveResearchMath.length,283);
 assert.equal(new Set(atlas.moveResearchMath.map(x=>m.norm(x.name))).size,283);
 assert.equal(atlas.stateStatistics.Attack.sampleSize,236);
 assert.equal(atlas.stateStatistics.Attack.frames.median,12);
 assert.equal(atlas.stateStatistics.Attack.sourceDurationUnits.median,25);
 approx(atlas.stateStatistics.Attack.markers.hit.medianOrdinalFraction01,1/3);
 assert.equal(atlas.stateStatistics.Shoot.sampleSize,229);
 approx(atlas.stateStatistics.Shoot.markers.hit.medianOrdinalFraction01,2/11);
 assert.equal(atlas.moveResearchMath.find(x=>x.name==='Grassy Glide').publicRoster,true);
 assert.equal(atlas.moveResearchMath.find(x=>x.name==='Grassy Glide').defaultReady,null);
 assert.equal(atlas.moveResearchMath.find(x=>x.name==='Grassy Glide').reportedUse,false);
 assert.equal(atlas.moveResearchMath.filter(x=>x.exactVisualFramesArchived).length,0);
 assert.match(atlas.evidence.durationUnits,/NOT established/);
 assert.match(atlas.evidence.markerIndexAssumption,/NOT timing/);
});
test('committed derived atlas matches generator output byte-for-byte when generated',()=>{
 const filename=path.resolve('reference-library/pb-ranked/ATLAS-MATEMATICO-REA-2026-11-01.json');
 if(!fs.existsSync(filename))return; // created by generator before CI deterministic check
 const existing=JSON.parse(fs.readFileSync(filename,'utf8'));
 const recalculated=m.model({animations:read('animacoes-marcadores-estados.json'),
  families:read('FAMILIAS-ESTRUTURAIS-283-GOLPES.json'),
  progress:read('PROGRESSO-GOLPES-283-2026-10-31.json'),
  delta:read('DELTA-REAL-2026-11-01.json')});
 assert.deepEqual(existing,recalculated);
});
