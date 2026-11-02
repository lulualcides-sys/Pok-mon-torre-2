import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotBody,poseBody,restoreBody,drawRedBeam} from '../tools/pokearena/torre2-ball-choreography.js';
const visual=()=>({active:true,x:240,y:180,scaleX:2,scaleY:2,alpha:1,visible:true,
 setPosition(x,y){this.x=x;this.y=y;return this},setScale(x,y=x){this.scaleX=x;this.scaleY=y;return this},
 setAlpha(a){this.alpha=a;return this},setVisible(v){this.visible=v;return this}});
test('body anchor uses PMD head/feet and remains attached throughout absorption',()=>{
 const spr=visual(),shadow=visual(),body=snapshotBody({spr,sombra:shadow,manif:{head:-18,feet:6,width:22}});
 assert.deepEqual(body.center,{x:240,y:168});
 for(const t of [0,.25,.5,.75,1]){
  const center={x:240-160*t,y:168+100*t};poseBody(body,center,1-.99*t,1-t);
  assert.equal(spr.x,center.x);
  assert.equal(spr.y+body.offset*spr.scaleY,center.y);
  assert.equal(shadow.visible,false);
 }
 assert.equal(spr.visible,false);
 restoreBody(body);assert.equal(spr.x,240);assert.equal(spr.y,180);
 assert.equal(spr.scaleY,2);assert.equal(shadow.visible,true);
});
test('beam uses bounded pixel cells rather than a widening triangle',()=>{
 let cells=0;const g={fillStyle(){},fillRect(x,y,w,h){assert.ok(Number.isFinite(x+y));assert.ok(w<=12&&h<=12);cells++}};
 drawRedBeam(g,{x:90,y:200},{x:190,y:100},1,6);
 assert.ok(cells>100&&cells<300);
});

import {EventEmitter} from 'node:events';
import {animateBallActor} from '../tools/pokearena/torre2-ball-choreography.js';
test('release duration follows elapsed time and clears listeners on completion/shutdown',()=>{
 for(const fps of [30,60,120]){
  const events=new EventEmitter(),game={events:new EventEmitter()};
  const g={active:true,setDepth(){return this},clear(){},fillStyle(){},fillRect(){},lineStyle(){},strokeCircle(){},destroy(){this.active=false}};
  const scene={events,game,scene:{isActive:()=>true},add:{graphics:()=>g}};
  const sprite=visual(),actor={spr:sprite,manif:{head:-18,feet:6,width:22}};
  let completed=0;
  animateBallActor(scene,actor,{from:{x:50,y:240},drawBall(){},onComplete:()=>completed++});
  assert.equal(sprite.visible,false);
  let elapsed=0;
  while(!completed&&elapsed<1000){game.events.emit('poststep',elapsed,1000/fps);elapsed+=1000/fps;}
  assert.equal(completed,1);assert.ok(elapsed>=780&&elapsed<820);
  assert.equal(sprite.visible,true);assert.equal(sprite.scaleY,2);
  assert.equal(scene.__torre2BallTransitions,0);
  assert.equal(game.events.listenerCount('poststep'),0);
  animateBallActor(scene,actor,{from:{x:50,y:240},drawBall(){}});
  events.emit('shutdown');
  assert.equal(scene.__torre2BallTransitions,0);assert.equal(game.events.listenerCount('poststep'),0);
 }
});
