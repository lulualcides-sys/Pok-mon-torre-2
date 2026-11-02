import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {choreographyDelta,ballArc,clamp01} from '../tools/pokearena/torre2-ball-choreography.js';

test('first-entry frame catch-up honors elapsed real time while preserving original 60 FPS timing',()=>{
 for(const dt of [1,8.333,16.667,33.333,50,64]){
  assert.equal(choreographyDelta(dt,180),choreographyDelta(dt),
   'normal frame speeds must render with exactly the previous animation step');
 }
 assert.equal(choreographyDelta(100),64,'native recall remains capped');
 assert.equal(choreographyDelta(100,180),100,'initial release can recover a 100ms frame');
 assert.equal(choreographyDelta(500,180),180,'background/tab hitch stays bounded');
 assert.equal(choreographyDelta(500),64,'capture, recall and manual swap remain unchanged');
 assert.equal(choreographyDelta(0),16.667);
 assert.equal(choreographyDelta(-10,180),1);
 assert.equal(choreographyDelta(NaN,180),16.667);
 assert.equal(choreographyDelta(300,Infinity),64);
});
test('Pokeball launch curve and graphical endpoints stay identical',()=>{
 assert.deepEqual(ballArc({x:0,y:0},{x:100,y:20},0),{x:0,y:0});
 assert.deepEqual(ballArc({x:0,y:0},{x:100,y:20},1),{x:100,y:20});
 assert.equal(ballArc({x:0,y:0},{x:100,y:20},.5,52).y,-42);
 assert.equal(clamp01(3),1);
});
test('only first Kanto sendout opts into catch-up; recall and swap retain native frame limit',()=>{
 const content=readFileSync('tools/pokearena/torre2-party-battle.js','utf8');
 const marker='maxFrameMs:180';
 assert.equal(content.split(marker).length-1,1,'one and only one opted-in battle entry');
 const intro=content.indexOf('if(party.changes===0){');
 const token=content.indexOf(marker);
 const hud=content.indexOf('const graphics=scene.add.graphics().setDepth(2480)',intro);
 assert.ok(intro>=0&&token>intro&&hud>token,
  'new budget must be inside first-entry choreography, not recalls or battle effects');
 const source=readFileSync('tools/pokearena/torre2-ball-choreography.js','utf8');
 assert.match(source,/maxFrameMs=64/,'original animation cap remains the default');
});
