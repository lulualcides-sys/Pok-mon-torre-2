import test from 'node:test';
import assert from 'node:assert/strict';
import {weatherPixelScene,WEATHER_PIXEL_BUDGET,WEATHER_FRAME_MS} from '../tools/pokearena/torre2-weather-pixels.js';
test('T16 deterministic original pixel weather with strict 48 particle budget',()=>{
 assert.equal(WEATHER_PIXEL_BUDGET,48);assert.ok(WEATHER_FRAME_MS>=80);
 for(const kind of ['sun','rain','sand','hail']){
  const first=weatherPixelScene(kind,0,640,360);
  assert.ok(first.length>0&&first.length<=WEATHER_PIXEL_BUDGET,kind);
  assert.deepEqual(first,weatherPixelScene(kind,0,640,360));
  assert.notDeepEqual(first,weatherPixelScene(kind,10,640,360));
  for(const p of first){
   assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y),kind);
   assert.ok(p.x>=0&&p.x<640&&p.y>=0&&p.y<360,kind);
   assert.ok(Number.isInteger(p.w)&&p.w>0&&p.w<=15);
   assert.ok(Number.isInteger(p.h)&&p.h>0&&p.h<=9);
   assert.ok(p.alpha>0&&p.alpha<=.75,kind);
   assert.ok(Number.isInteger(p.color)&&p.color>=0&&p.color<=0xffffff,kind);
  }
 }
 assert.deepEqual(weatherPixelScene('none'),[]);
 assert.deepEqual(weatherPixelScene('unexpected'),[]);
});
test('T16 weather overlay remains bounded in mobile and desktop viewports',()=>{
 for(const [w,h] of [[320,180],[640,360],[854,480],[1280,720]])
  for(const kind of ['sun','rain','sand','hail'])
   for(const tick of [0,1,999,60000]){
    const sample=weatherPixelScene(kind,tick,w,h);
    assert.ok(sample.length<=WEATHER_PIXEL_BUDGET);
    assert.ok(sample.every(p=>p.x>=0&&p.x<w&&p.y>=0&&p.y<h));
   }
});
