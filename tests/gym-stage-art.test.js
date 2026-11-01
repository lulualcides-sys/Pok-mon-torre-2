import test from 'node:test';
import assert from 'node:assert/strict';
import {gymStageArtModel,GYM_ART_PROTECTED,renderGymStageArt} from '../tools/pokearena/torre2-gym-stage-art.js';
const overlap=(a,b)=>a.x<b[0]+b[2]&&a.x+a.w>b[0]&&a.y<b[1]+b[3]&&a.y+a.h>b[1];
test('Brock and Misty biome decorations never cover boss, walkway or trainer platforms',()=>{
 for(const stage of [0,1]){
  const m=gymStageArtModel(stage);
  assert.equal(m.regions.length,6);
  for(const r of m.regions){
   assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=640&&r.y+r.h<=360);
   for(const p of GYM_ART_PROTECTED)assert.equal(overlap(r,p),false,
    'stage '+stage+' decoration must not cover a platform');
  }
 }
 assert.equal(gymStageArtModel(2),null);
 assert.equal(gymStageArtModel(-1),null);
});
test('decorative stage art creates only a static Phaser Graphics layer',()=>{
 const calls=[];
 const g={fillStyle(){return this},fillRect(){return this},setDepth(n){calls.push(['depth',n]);return this},
  setData(k,v){calls.push(['data',k,v]);return this}};
 const scene={add:{graphics(){calls.push(['graphics']);return g},
  zone(){throw Error('Decoration cannot create input zones')}},
  time:{addEvent(){throw Error('Decoration cannot create timers')}}};
 for(const stage of [0,1]){
  const out=renderGymStageArt(scene,stage);
  assert.equal(out.regions,6);assert.equal(out.interactive,false);
  assert.equal(out.animated,false);assert.equal(scene.__torre2GymStageArt.stage,stage);
 }
 assert.deepEqual(calls.filter(x=>x[0]==='depth'),[['depth',2],['depth',2]]);
 assert.equal(renderGymStageArt(scene,3),null);
});
