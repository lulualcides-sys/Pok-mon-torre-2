import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CITY_ATLAS_FRAMES,CITY_ATLAS_SIZE,citySpriteRect,needsCeruleanAtlas} from '../tools/pokearena/torre2-city-atlas.js';
test('each reusable city asset is a bounded isolated atlas frame',()=>{
 assert.deepEqual(Object.keys(CITY_ATLAS_FRAMES),['center','gym','mart','house','tree','planter']);
 const [w,h]=CITY_ATLAS_SIZE;
 for(const [name,[x,y,fw,fh]]of Object.entries(CITY_ATLAS_FRAMES)){
  assert.ok(x>=0&&y>=0&&fw>0&&fh>0&&x+fw<=w&&y+fh<=h,name);
  assert.ok(fw<w/2&&fh<h*.55,'must crop individual asset, never show entire sheet');
 }
});
test('sprites keep source proportions and align bottom center to their entrance',()=>{
 for(const name of Object.keys(CITY_ATLAS_FRAMES)){
  const a=citySpriteRect(name,123,155,90),r=CITY_ATLAS_FRAMES[name];
  assert.equal(a.x,123);assert.equal(a.y,155);assert.equal(a.height,90);
  assert.equal(a.width,90*r[2]/r[3]);
 }
 assert.equal(citySpriteRect('missing',0,0,90),null);
});
test('the generated atlas is bundled as WebP rather than referenced from a temporary path',()=>{
 const b=fs.readFileSync('reference-assets/kanto/city-original/cerulean-atlas-v1.webp');
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.ok(b.length<700000,'bounded one-time city texture download');
});

test('first Brock victory preloads Cerulean without changing progress',()=>{
 const state={stage:0,trainer:15};
 const result={finished:true,won:true,marker:{stage:0,trainer:15}};
 assert.equal(needsCeruleanAtlas(state,result,15),true);
 assert.deepEqual(state,{stage:0,trainer:15});
 assert.equal(needsCeruleanAtlas(state,{...result,won:false},15),false);
 for(const marker of [{stage:0,trainer:14},{stage:0,trainer:15,kind:'wild'},
  {stage:0,trainer:15,kind:'rematch'},{stage:0,trainer:15,training:true}])
  assert.equal(needsCeruleanAtlas(state,{...result,marker},15),false);
 assert.equal(needsCeruleanAtlas({stage:1},null,15),true);
 assert.equal(needsCeruleanAtlas({stage:2},null,15),false);
});
