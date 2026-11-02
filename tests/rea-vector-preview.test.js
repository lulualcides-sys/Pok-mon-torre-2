import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {REA_FRAME_REFERENCES,frameOrdinal,vectorSmoothstep,vectorBezier,
 vectorLerp,movePrototypePoint,sweptVectorHit} from '../tools/pokearena/torre2-rea-vector-math.js';
import {createReaVectorPreview} from '../tools/pokearena/torre2-rea-vector-preview.js';

const near=(x,y,eps=1e-4)=>assert.ok(Math.abs(x-y)<=eps,`${x} not near ${y}`);
test('reference metadata are frame positions, not milliseconds or copied VFX',()=>{
 assert.equal(REA_FRAME_REFERENCES.Attack.sample,236);
 assert.equal(REA_FRAME_REFERENCES.Attack.medianFrames,12);
 near(REA_FRAME_REFERENCES.Attack.hitOrdinal,1/3);
 near(REA_FRAME_REFERENCES.Shoot.hitOrdinal,2/11);
 assert.equal(frameOrdinal(3,12),3/11);
 assert.equal(frameOrdinal(0,1),0);
 assert.equal(frameOrdinal(4,4),null);
 assert.equal(frameOrdinal(-1,5),null);
});
test('original arc and dash endpoints remain anchored and finite',()=>{
 const a={x:110,y:202},b={x:500,y:202};
 assert.deepEqual(movePrototypePoint('arc',0),a);
 assert.deepEqual(movePrototypePoint('arc',1),b);
 assert.deepEqual(movePrototypePoint('arc',.5),{x:305,y:154});
 assert.deepEqual(movePrototypePoint('dash',0),a);
 assert.deepEqual(movePrototypePoint('dash',1),b);
 assert.deepEqual(movePrototypePoint('dash',.5),{x:305,y:202});
 assert.deepEqual(movePrototypePoint('beam',0),a);
 assert.deepEqual(movePrototypePoint('beam',1),b);
 near(vectorSmoothstep(.5),.5);
 assert.deepEqual(vectorLerp({x:0,y:0},{x:10,y:20},.25),{x:2.5,y:5});
 assert.deepEqual(vectorBezier({x:0,y:0},{x:0,y:1},{x:1,y:1},{x:1,y:0},.5),{x:.5,y:.75});
 assert.throws(()=>movePrototypePoint('invalid',.5),/Unknown preview mode/);
 assert.throws(()=>vectorLerp(null,b,.5),/Invalid 2D/);
});
test('continuous disc sweep detects small target crossed between frames without auto-hit',()=>{
 const t={x:0,y:0},before={x:-20,y:0},after={x:20,y:0};
 const out=sweptVectorHit(before,after,3,t,t,3);
 assert.equal(out.hit,true);near(out.firstFraction,.35);
 assert.equal(sweptVectorHit(before,after,3,{x:0,y:30},{x:0,y:30},3).hit,false);
 assert.equal(sweptVectorHit(t,t,3,t,t,3).firstFraction,0);
 assert.equal(sweptVectorHit(before,before,3,t,t,3).hit,false);
 const moving=sweptVectorHit(before,after,3,{x:20,y:0},{x:-20,y:0},3);
 assert.equal(moving.hit,true);near(moving.firstFraction,.425);
 assert.throws(()=>sweptVectorHit(before,after,-1,t,t,3),/hitboxes/);
});
function stubScene(laboratory=true){
 const events=new EventEmitter(),draw={calls:0,destroyed:false,visible:false};
 function shape(){
  return {
   setDepth(){return this},setVisible(v){draw.visible=v;return this},
   clear(){draw.calls++;return this},fillStyle(){return this},fillRect(){return this},
   destroy(){draw.destroyed=true}
  };
 }
 const textNodes=[];
 const scene={datos:{torre2:{laboratory}},events,
  add:{graphics:shape,text:(_x,_y,_s,_opts)=>{
   const o={text:'',destroyed:false,setDepth(){return this},setVisible(){return this},
    setText(s){this.text=s;return this},destroy(){this.destroyed=true}};
   textNodes.push(o);return o;
  }}};
 return {scene,events,draw,textNodes};
}
test('preview is opt-in, lab-only, visual-only, stops and cleans up on shutdown',()=>{
 const {scene,events,draw,textNodes}=stubScene(true);
 assert.throws(()=>createReaVectorPreview(stubScene(false).scene),/requires laboratory/);
 const preview=createReaVectorPreview(scene);
 assert.equal(preview.debug.active,false);assert.equal(draw.calls,0);
 const save={hp:47,bags:3},before=JSON.stringify(save);
 assert.equal(preview.toggle(),true);
 for(let i=0;i<300;i++)events.emit('update',i*16.66,16.66);
 assert.ok(draw.calls>200);
 assert.ok(preview.debug.hitCount>=1,'must demonstrate at least one real swept contact');
 assert.deepEqual(['beam','dash','arc'].includes(preview.debug.mode),true);
 assert.equal(preview.debug.isolation,'LAB_VISUAL_ONLY');
 assert.equal(preview.debug.containsThirdPartyAssets,false);
 assert.equal(preview.debug.doesNotChangeDamage,true);
 assert.equal(JSON.stringify(save),before);
 assert.match(textNodes[1].text,/SEM DANO/);
 assert.equal(preview.toggle(),false);
 const count=draw.calls;events.emit('update',100000,16);assert.equal(draw.calls,count);
 events.emit('shutdown');
 assert.equal(draw.destroyed,true);
 assert.ok(textNodes.every(n=>n.destroyed));
 assert.equal(scene.__torre2ReaMathPreview,undefined);
 assert.equal(preview.toggle(),false);
});
