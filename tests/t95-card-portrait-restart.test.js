import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {requestCardPortrait,resetCardPortraitRequests} from
 '../tools/pokearena/torre2-card-portrait-cache.js';

const setup=()=>{
 const emitter=new EventEmitter(),images=[],textures=new Set();
 let starts=0,loading=false;
 const scene={textures:{exists:key=>textures.has(key)},
  load:Object.assign(emitter,{
   image:(key,url)=>images.push({key,url}),
   start:()=>{starts++;loading=true;},
   isLoading:()=>loading
  })};
 return {scene,images,textures,emitter,counts:()=>({starts,listeners:emitter.listenerCount('loaderror')})};
};
const KEY='torre2-portrait-0019';
const URL='assets/pmd/0019/portrait.png';

test('T95: one PMD request serves repeated card renderers without duplicate downloads',()=>{
 const {scene,images,textures,emitter,counts}=setup();
 let displayed=0;
 assert.equal(requestCardPortrait(scene,KEY,URL,()=>displayed++),'pending');
 assert.equal(requestCardPortrait(scene,KEY,URL,()=>displayed++),'pending');
 assert.equal(images.length,1);
 assert.equal(counts().starts,1);
 assert.equal(counts().listeners,1);
 textures.add(KEY);
 emitter.emit('filecomplete-image-'+KEY);
 assert.equal(displayed,2);
 assert.equal(scene.__torre2CardPortraitRequests.size,0);
 assert.equal(counts().listeners,0,'no loaderror listener retained');
 assert.equal(requestCardPortrait(scene,KEY,URL,()=>displayed++),'ready');
 assert.equal(displayed,3);
 assert.equal(images.length,1);
});
test('T95: unrelated asset failures do not erase a pending portrait',()=>{
 const {scene,emitter,images,textures,counts}=setup();
 let rendered=0;
 requestCardPortrait(scene,KEY,URL,()=>rendered++);
 emitter.emit('loaderror',{key:'unrelated-world-map'});
 assert.equal(scene.__torre2CardPortraitRequests.has(KEY),true);
 textures.add(KEY);emitter.emit('filecomplete-image-'+KEY);
 assert.equal(rendered,1);
 assert.equal(images.length,1);
 assert.equal(counts().listeners,0);
});
test('T95: missing sprite fails once; scene restart permits a clean retry',()=>{
 const {scene,emitter,images,counts}=setup();
 requestCardPortrait(scene,KEY,URL,()=>{});
 emitter.emit('loaderror',{key:KEY});
 assert.equal(scene.__torre2CardPortraitRequests.size,0);
 assert.equal(counts().listeners,0);
 assert.equal(requestCardPortrait(scene,KEY,URL,()=>{}),'failed');
 assert.equal(images.length,1);
 resetCardPortraitRequests(scene);
 assert.equal(requestCardPortrait(scene,KEY,URL,()=>{}),'pending');
 assert.equal(images.length,2);
 resetCardPortraitRequests(scene);
 assert.equal(counts().listeners,0);
 assert.equal(emitter.listenerCount('filecomplete-image-'+KEY),0);
});
test('T95: rapid pagination cannot build an unbounded subscriber list',()=>{
 const {scene,images,emitter,textures}=setup();
 let displayed=0;
 for(let i=0;i<100;i++)
  requestCardPortrait(scene,KEY,URL,()=>displayed++);
 assert.equal(images.length,1);
 assert.ok(scene.__torre2CardPortraitRequests.get(KEY).subscribers.length<=8);
 textures.add(KEY);emitter.emit('filecomplete-image-'+KEY);
 assert.equal(displayed,8);
});
test('T95: invalid keys cannot load arbitrary asset paths',()=>{
 const {scene,images}=setup();
 assert.equal(requestCardPortrait(scene,'../../bad','file:///bad',()=>{}),'invalid');
 assert.equal(images.length,0);
});
