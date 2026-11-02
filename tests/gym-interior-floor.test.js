import test from 'node:test';
import assert from 'node:assert/strict';
import {ROOM_CROPS,addGymInteriorFloor,renderInteriorScene,renderGymStage,GYM_STAGE_BOUNDS} from '../tools/pokearena/torre2-frlg-interiors.js';
test('T35 genuine FireRed floor frame stays inside each existing gym interior crop',()=>{
 for(const location of ['pewter','cerulean','vermilion','celadon','fuchsia','saffron','cinnabar','viridian']){
  const rect=ROOM_CROPS[location]?.gym;
  assert.ok(rect,'gym crop required '+location);
  const frames=new Map(),created=[];
  const tex={source:[{width:2500,height:2500}],has:k=>frames.has(k),
   add(k,source,x,y,w,h){frames.set(k,{x,y,w,h})},setFilter(){}};
  const obj=()=>({setOrigin(){return this},setTileScale(){return this},setDepth(){return this},setData(k,v){this[k]=v;return this},setDisplaySize(){return this}});
  const scene={textures:{exists:()=>true,get:()=>tex},
   add:{tileSprite(...args){created.push(args);return obj()},image(...args){created.push(args);return obj()}}};
  const floor=addGymInteriorFloor(scene,location);
  assert.equal(floor['torre2-gym-floor'],location);
  const frame=frames.get('torre2-gym-floor-'+location);
  assert.ok(frame.x>=rect[0]&&frame.y>=rect[1]);
  assert.ok(frame.x+16<=rect[0]+rect[2]&&frame.y+16<=rect[1]+rect[3]);
  assert.equal(renderInteriorScene(scene,location,'gym',{centerX:320,centerY:150,maxHeight:136}),true);
  assert.equal(created.length,61,'60 independent batched Images + one interior, never TileSprite');
 }
});

test('T35 full-width stage uses native floor, no zoomed room thumbnail or new hitboxes',async()=>{
 const rects=[];
 const g={setDepth(){return this},fillStyle(){return this},fillRect(...r){rects.push(r);return this}};
 const scene={add:{graphics:()=>g}};
 for(const city of ['pewter','cerulean','vermilion','celadon','fuchsia','saffron','cinnabar','viridian']){
  const m=renderGymStage(scene,city);
  assert.equal(m.mode,'full-width');
  assert.equal(m.zoom,1);
  assert.deepEqual(m.bounds,GYM_STAGE_BOUNDS);
  assert.equal(m.leaderPlatform.x,258);
  assert.deepEqual([...m.trainerColumns],[157,483]);
  assert.equal(m.staticDraw,true);
  assert.equal(scene.__torre2GymStage,m);
 }
 assert.ok(rects.length>100,'pixel-aligned thematic platforms rendered');
 const src=(await import('node:fs')).readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.match(src,/renderGymStage\(this,location\)/);
 assert.doesNotMatch(src,/renderInteriorScene\(this,location,'gym'/);
 assert.doesNotMatch(src,/cameras\.main\.setZoom\(/);
});
