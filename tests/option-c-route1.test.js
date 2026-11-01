import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ROUTE1_ART_VERSION,ROUTE1_EXITS,ROUTE1_TREES,ROUTE1_GRASS_PATCHES,
 route1Path,route1IsClear,drawOptionCRoute1
} from '../tools/pokearena/torre2-option-c-route1.js';

test('Option C Route 1: canonical Pallet to Viridian, preview only',()=>{
 assert.deepEqual(ROUTE1_EXITS,{south:'pallet',north:'viridian'});
 assert.match(ROUTE1_ART_VERSION,/option-c-route1/);
});
test('Option C Route 1: continuous traversable north-south corridor',()=>{
 for(let y=35;y<=318;y++){
  const p=route1Path(y);
  assert.ok(p.left>250 && p.right<391 && p.right-p.left>=78);
  assert.equal(route1IsClear(p.center,y),false);
  assert.equal(route1IsClear(p.left-50,y,15),true);
  assert.equal(route1IsClear(p.right+50,y,15),true);
 }
});
test('Option C Route 1: tree geometry and tall grass never cover center path',()=>{
 assert.ok(ROUTE1_TREES.length>=12);
 assert.ok(new Set(ROUTE1_TREES.map(t=>t.kind)).size>=2);
 for(const t of ROUTE1_TREES)
  assert.ok(route1IsClear(t.x,t.y,29),JSON.stringify(t));
 assert.ok(ROUTE1_GRASS_PATCHES.length>=6);
 for(const b of ROUTE1_GRASS_PATCHES){
  for(let y=b.y;y<b.y+b.h;y+=4)
   for(let x=b.x;x<b.x+b.w;x+=4)
    assert.ok(route1IsClear(x,y,8),'grass encroaches at '+x+','+y);
 }
});
test('Option C Route 1: original Phaser Graphics artwork is isolated',()=>{
 const drawn=[];
 const g={
  fillStyle(c,a){assert.ok(Number.isFinite(c));return this},
  fillRect(x,y,w,h){
   assert.ok([x,y,w,h].every(Number.isFinite));
   assert.ok(w>=0 && h>=0);
   drawn.push([x,y,w,h]);
   return this;
  }
 };
 const scene={add:{text(x,y,value,options){
  assert.equal(value,'ROTA 1');
  return {setDepth(depth){assert.ok(depth<40);return this}};
 }}};
 const meta=drawOptionCRoute1(scene,g);
 assert.equal(meta.previewOnly,true);
 assert.equal(meta.trainers,0);
 assert.equal(meta.pixelArt,true);
 assert.deepEqual(meta.exits,ROUTE1_EXITS);
 assert.ok(drawn.length>10000,'more than plain blocks required');
});
