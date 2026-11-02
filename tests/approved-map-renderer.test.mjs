import test from 'node:test';
import assert from 'node:assert/strict';
import {preloadApprovedMap,renderApprovedMap,APPROVED_MAP_ASSETS_READY} from '../tools/pokearena/torre2-approved-map-renderer.js';
function fakeScene(hasAsset=true){
 const zones=[];
 const box=()=>({setDepth(){return this},setOrigin(){return this},setDisplaySize(){return this},
  setInteractive(){return this},setData(){return this},on(event,cb){this[event]=cb;return this}});
 const scene={textures:{exists:()=>hasAsset,get:()=>({getSourceImage:()=>({width:1280,height:720})})},
  add:{image:()=>box(),zone:(...v)=>{const z=box();z.pos=v;zones.push(z);return z},
   rectangle:()=>box(),text:()=>box(),graphics:()=>({setDepth(){return this},lineStyle(){return this},strokeRect(){return this}})},load:{image(){throw Error('Must not load preview without assets')}}};
 return {scene,zones};
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