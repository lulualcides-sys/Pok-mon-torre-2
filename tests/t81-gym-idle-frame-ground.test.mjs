import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {nativePmdFootOrigin,lockNativePmdIdleFeet,visibleFootOrigin} from
 '../tools/pokearena/torre2-gym-ace-ground.js';

test('T81: animated PMD feet follow each source-sheet frame, not frame zero',()=>{
 const originalDocument=globalThis.document;
 const samples=[];
 globalThis.document={createElement:()=>({getContext:()=>({
  drawImage:(_image,sx,sy,w,h)=>samples.push([sx,sy,w,h]),
  getImageData:()=>{
   const pixels=new Uint8ClampedArray(2*6*4);
   const lastVisible=samples.at(-1)[0]===0?3:1;
   pixels[(lastVisible*2)*4+3]=255;
   return {data:pixels};
  }
 })})};
 try{
  const texture={source:[{image:{}}],get:frame=>({cutX:Number(frame)*2,cutY:0})};
  const plan={fw:2,fh:6},events={};
  const sprite={active:true,y:123,originY:1,
   setOrigin(_x,y){this.originY=y;return this;},
   on(name,handler){events[name]=handler;return this;}};
  assert.equal(lockNativePmdIdleFeet(sprite,texture,plan),true);
  assert.equal(sprite.originY,4/6);
  events.animationupdate(null,{textureFrame:1});
  assert.equal(sprite.originY,2/6,'second Idle frame must be grounded separately');
  assert.equal(sprite.y,123,'floor coordinates and shadow remain unchanged');
  events.animationupdate(null,{textureFrame:0});
  assert.equal(sprite.originY,4/6);
  assert.equal(samples.length,2,'each frame has one canvas read, cached on repeat');
  assert.deepEqual(samples.map(s=>s[0]),[0,2]);
 }finally{globalThis.document=originalDocument;}
});

test('T81: Vileplume retains T79b first-frame alpha origin calibration',()=>{
 const old=globalThis.document;
 globalThis.document={createElement:()=>({getContext:()=>({
  drawImage:()=>{},
  getImageData:()=>({data:new Uint8ClampedArray(2*6*4)})
 })})};
 try{
  const texture={source:[{image:{}}],get:frame=>({cutX:Number(frame)*2,cutY:0})};
  const events={};
  const sprite={active:true,y:208,setOrigin(_x,y){this.originY=y;return this;},
   on(name,handler){events[name]=handler;return this;}};
  assert.equal(lockNativePmdIdleFeet(sprite,texture,{fw:2,fh:6},26/40),true);
  assert.equal(sprite.originY,26/40);
  events.animationupdate(null,{textureFrame:0});
  assert.equal(sprite.originY,26/40,'never overwrite approved first-frame origin');
  assert.equal(sprite.y,208);
 }finally{globalThis.document=old;}
});

test('T81: invalid alpha plans are safe and all five aces stay on native Idle',()=>{
 assert.equal(visibleFootOrigin(null,2,6),1);
 assert.equal(nativePmdFootOrigin(null,null),1);
 assert.equal(lockNativePmdIdleFeet(null,null,null),false);
 const source=readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.equal((source.match(/lockNativePmdIdleFeet\(sprite,texture,plan/g)||[]).length,3);
 assert.ok(source.includes('lockNativePmdIdleFeet(sprite,texture,plan,26/40)'));
 assert.ok(source.includes('const ace=project(actors.ace.cx,actors.leader.cy);'));
 assert.ok(source.includes('.setOrigin(.5,26/40).setScale(scale)'));
 assert.ok(source.includes("setData('torre2-gym-ace-source','pmd-idle')"));
});
