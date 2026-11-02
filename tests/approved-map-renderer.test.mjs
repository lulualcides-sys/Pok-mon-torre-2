import test from 'node:test';
import assert from 'node:assert/strict';
import {preloadApprovedMap,renderApprovedMap,planApprovedMapOverlays,APPROVED_MAP_ASSETS_READY} from '../tools/pokearena/torre2-approved-map-renderer.js';
function fakeScene(hasAsset=true,dimensions={width:1280,height:720}){
 const zones=[],images=[],rectangles=[];
 const box=()=>({setDepth(){return this},setOrigin(){return this},setDisplaySize(){return this},
  setInteractive(){return this},setData(key,value){this.data={key,value};return this},on(event,cb){this[event]=cb;return this}});
 const scene={textures:{exists:()=>hasAsset,get:()=>({getSourceImage:()=>dimensions})},
  add:{image:()=>{images.push(1);return box()},zone:(...v)=>{const z=box();z.pos=v;zones.push(z);return z},
   rectangle:(...args)=>{rectangles.push(args);return box()},text:()=>box(),graphics:()=>({setDepth(){return this},lineStyle(){return this},strokeRect(){return this}})},load:{image(){throw Error('Must not load preview without assets')}}};
 return {scene,zones,images,rectangles};
}
test('fails closed when images are absent, preserving existing campaign',()=>{
 const {scene,zones}=fakeScene(false);
 assert.equal(renderApprovedMap(scene,'ss-anne').reason,'asset-not-installed');
 assert.equal(zones.length,0);
 assert.equal(APPROVED_MAP_ASSETS_READY,false);
 assert.equal(preloadApprovedMap(scene,'ss-anne'),false);
});
test('draws approved pixels and separate clickable zones without mutating save',()=>{
 const {scene,zones}=fakeScene(true);
 const pressed=[];
 const view=renderApprovedMap(scene,'ss-anne',{onHotspot:(id,h)=>pressed.push(id+':'+h)});
 assert.equal(view.ok,true);
 assert.equal(view.rect.width,640);assert.equal(view.rect.height,360);
 assert.ok(view.zones.length>=4);
 view.zones[0].pointerdown(null,0,0,{stopPropagation(){}});
 assert.equal(pressed[0],'ss-anne:captain');
 assert.ok(zones.find(z=>z['pointerdown']));
});
test('does not automatically unlock or jump to a neighboring city',()=>{
 const {scene}=fakeScene(true);
 const view=renderApprovedMap(scene,'vermilion-city');
 assert.equal(view.ok,true);
 assert.deepEqual(view.neighbors,[]);
});
test('T40 RED regression: unsafe Saffron/Trainer Tower touch zones fail before any Phaser drawing',()=>{
 for(const id of ['saffron-city','trainer-tower']){
  const {scene,images,zones}=fakeScene(true);
  const view=renderApprovedMap(scene,id);
  assert.equal(view.ok,false,id);
  assert.equal(view.reason,'hotspot-overlap',id);
  assert.equal(images.length,0,id);
  assert.equal(zones.length,0,id);
 }
});
test('T40 approved S.S. Anne exit is not covered by a false locked footer or back button',()=>{
 const {scene,rectangles,zones}=fakeScene(true);
 const view=renderApprovedMap(scene,'ss-anne');
 assert.equal(view.ok,true);
 assert.equal(view.footer,null);
 assert.equal(rectangles.length,0);
 assert.equal(view.back.pos[0],39); // top-right overlaps the deck hotspot
 assert.equal(view.back.pos[1],20);
 assert.ok(zones.some(z=>z.data?.value==='ss-anne:exit'));
});
test('T40 dynamic navigation moves above S.S. Anne exit and reserves a separate back target',()=>{
 const {scene,rectangles}=fakeScene(true);
 const view=renderApprovedMap(scene,'ss-anne',{isUnlocked:()=>true});
 assert.equal(view.ok,true);
 assert.equal(rectangles.length,1);
 assert.equal(rectangles[0][1],13); // top bar does not cover the southern exit
 assert.equal(view.back.pos[1],314);
});
test('T40 never silently drops Cerulean fifth connection; lock is rechecked on native tap',()=>{
 let unlocked=true;const navigated=[],locked=[];
 const {scene,zones}=fakeScene(true);
 const view=renderApprovedMap(scene,'cerulean-city',{
  isUnlocked:()=>unlocked,onNavigate:(a,b)=>navigated.push([a,b]),onLocked:(a,b)=>locked.push([a,b])
 });
 assert.equal(view.ok,true);
 assert.equal(view.neighbors.length,5);
 const routes=zones.filter(z=>z.data?.key==='torre2-approved-route');
 assert.equal(routes.length,5);
 unlocked=false;
 routes[4].pointerdown(null,0,0,{stopPropagation(){}});
 assert.equal(navigated.length,0);
 assert.equal(locked.length,1);
 unlocked=true;
 routes[4].pointerdown(null,0,0,{stopPropagation(){}});
 assert.equal(navigated.length,1);
});
test('T40 rejects corrupt texture dimensions before creating an image',()=>{
 for(const dimensions of [{width:0,height:720},{width:NaN,height:720},{width:1280,height:-2}]){
  const {scene,images}=fakeScene(true,dimensions);
  assert.equal(renderApprovedMap(scene,'ss-anne').reason,'invalid-texture-size');
  assert.equal(images.length,0);
 }
});

test('T40 Fuchsia keeps five native route buttons even when both full-width bars collide',()=>{
 const {scene,zones,rectangles}=fakeScene(true);
 const view=renderApprovedMap(scene,'fuchsia-city',{isUnlocked:()=>true});
 assert.equal(view.ok,true);
 assert.equal(view.neighbors.length,5);
 assert.equal(rectangles.length,0); // compact chips, not an opaque footer
 assert.equal(zones.filter(z=>z.data?.key==='torre2-approved-route').length,5);
});
test('T40 pure preflight detects an overlapping hotspot before sprite creation',()=>{
 const rect={x:0,y:0,width:640,height:360};
 const entry={hotspots:[
  {id:'a',cx:.5,cy:.5,w:.3,h:.3,validated:'visual'},
  {id:'b',cx:.55,cy:.5,w:.3,h:.3,validated:'visual'}
 ]};
 const plan=planApprovedMapOverlays(entry,rect,[]);
 assert.equal(plan.ok,false);
 assert.equal(plan.reason,'hotspot-overlap');
 assert.deepEqual(plan.ids,['a','b']);
});
