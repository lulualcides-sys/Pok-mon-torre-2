import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {REA_FRAME_REFERENCES,frameOrdinal,vectorSmoothstep,vectorBezier,
 vectorLerp,movePrototypePoint,sweptVectorHit,sweptVectorCurveHit} from '../tools/pokearena/torre2-rea-vector-math.js';
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
 const events=new EventEmitter(),draw={calls:0,destroyed:false,visible:false},graphics=[];
 function shape(){
  const rec={clearCalls:0,rectCalls:0,destroyed:false,visible:false};
  graphics.push(rec);
  return {
   setDepth(){return this},setVisible(v){rec.visible=v;draw.visible=v;return this},
   clear(){rec.clearCalls++;draw.calls++;return this},
   fillStyle(){return this},fillRect(){rec.rectCalls++;return this},
   destroy(){rec.destroyed=true;draw.destroyed=true}
  };
 }
 const textNodes=[],zones=[];
 const scene={datos:{torre2:{laboratory}},events,
  add:{graphics:shape,zone:(_x,_y,_w,_h)=>{
   const zone={input:{enabled:false},destroyed:false,setDepth(){return this},
    setInteractive(){return this},destroy(){this.destroyed=true}};
   zones.push(zone);return zone;
  },text:(_x,_y,_s,_opts)=>{
   const o={text:'',textCalls:0,destroyed:false,setDepth(){return this},setVisible(){return this},
    setText(s){this.text=s;this.textCalls++;return this},destroy(){this.destroyed=true}};
   textNodes.push(o);return o;
  }}};
 return {scene,events,draw,textNodes,zones,graphics};
}
test('preview is opt-in, lab-only, visual-only, stops and cleans up on shutdown',()=>{
 const {scene,events,draw,textNodes,zones}=stubScene(true);
 assert.throws(()=>createReaVectorPreview(stubScene(false).scene),/requires laboratory/);
 const preview=createReaVectorPreview(scene);
 assert.equal(preview.debug.active,false);assert.equal(draw.calls,0);
 assert.equal(zones.length,1);assert.equal(zones[0].input.enabled,false);
 const save={hp:47,bags:3},before=JSON.stringify(save);
 assert.equal(preview.toggle(),true);assert.equal(zones[0].input.enabled,true);
 for(let i=0;i<350;i++)events.emit('update',i*16.66,16.66);
 assert.ok(draw.calls>200);
 assert.ok(preview.debug.hitCount>=3,'must hit at least once in each demonstration mode');
 assert.ok(Object.values(preview.debug.byMode).every(n=>n>=1),JSON.stringify(preview.debug.byMode));
 assert.deepEqual(['beam','dash','arc'].includes(preview.debug.mode),true);
 assert.equal(preview.debug.isolation,'LAB_VISUAL_ONLY');
 assert.equal(preview.debug.containsThirdPartyAssets,false);
 assert.equal(preview.debug.doesNotChangeDamage,true);
 assert.equal(JSON.stringify(save),before);
 assert.match(textNodes[1].text,/SEM DANO/);
 assert.equal(preview.toggle(),false);assert.equal(zones[0].input.enabled,false);
 assert.equal(preview.toggle(),true);assert.equal(preview.debug.hitCount,0);
 assert.deepEqual(preview.debug.byMode,{beam:0,dash:0,arc:0});
 assert.equal(preview.toggle(),false);
 const count=draw.calls;events.emit('update',100000,16);assert.equal(draw.calls,count);
 events.emit('shutdown');
 assert.equal(draw.destroyed,true);assert.equal(zones[0].destroyed,true);
 assert.ok(textNodes.every(n=>n.destroyed));
 assert.equal(scene.__torre2ReaMathPreview,undefined);
 assert.equal(preview.toggle(),false);
});

test('deterministic continuous contact: tangent, opposite moving target, near miss and scaling',()=>{
 const o={x:0,y:0};
 const tangent=sweptVectorHit({x:-10,y:3},{x:10,y:3},1,o,o,2);
 assert.equal(tangent.hit,true);near(tangent.firstFraction,.5);
 const miss=sweptVectorHit({x:-10,y:3.02},{x:10,y:3.02},1,o,o,2);
 assert.equal(miss.hit,false);assert.equal(miss.firstFraction,null);
 const same=sweptVectorHit({x:0,y:0},{x:0,y:0},0,{x:4,y:0},{x:0,y:0},0);
 assert.equal(same.hit,true);near(same.firstFraction,1);
 const crossing=sweptVectorHit({x:-10,y:0},{x:10,y:0},2,{x:10,y:0},{x:-10,y:0},2);
 near(crossing.firstFraction,.4);
 const k=37,p=x=>({x:x.x*k,y:x.y*k});
 const scaled=sweptVectorHit(p({x:-10,y:0}),p({x:10,y:0}),2*k,p({x:10,y:0}),p({x:-10,y:0}),2*k);
 assert.equal(scaled.hit,true);near(scaled.firstFraction,crossing.firstFraction);
});
test('bounded delta and repeated preview re-open never accumulate multiple impacts or listeners',()=>{
 const {scene,events,zones}=stubScene(true);
 const baseline=events.listenerCount('update');
 const preview=createReaVectorPreview(scene);
 assert.equal(events.listenerCount('update'),baseline+1);
 for(let loop=0;loop<10;loop++){
  assert.equal(preview.toggle(),true);
  assert.equal(zones[0].input.enabled,true);
  for(let i=0;i<350;i++)events.emit('update',i*16.67,16.67);
  assert.equal(preview.debug.hitCount,3,'one impact per each of the three modes in a full cycle');
  assert.deepEqual(preview.debug.byMode,{beam:1,dash:1,arc:1});
  assert.equal(preview.toggle(),false);
  assert.equal(zones[0].input.enabled,false);
  assert.equal(events.listenerCount('update'),baseline+1);
 }
 events.emit('shutdown');
 assert.equal(events.listenerCount('update'),baseline);
 assert.equal(zones[0].destroyed,true);
});

test('Phaser may destroy inputShield.input before shutdown: cleanup still succeeds',()=>{
 const {scene,events,zones,textNodes,draw}=stubScene(true);
 const preview=createReaVectorPreview(scene);
 assert.equal(preview.toggle(),true);
 assert.equal(zones[0].input.enabled,true);
 // Reproduce the real Chromium #41402178064 failure exactly.
 zones[0].input=undefined;
 assert.doesNotThrow(()=>events.emit('shutdown'));
 assert.equal(zones[0].destroyed,true);
 assert.equal(draw.destroyed,true);
 assert.ok(textNodes.every(t=>t.destroyed));
 assert.equal(scene.__torre2ReaMathPreview,undefined);
 assert.equal(preview.toggle(),false);
});

test('performance invariants: static scene draws exactly once, text not rerasterized every frame',()=>{
 const {scene,events,graphics,textNodes}=stubScene(true);
 const preview=createReaVectorPreview(scene);
 assert.equal(graphics.length,2,'one static backdrop and one animated overlay');
 const [background,dynamic]=graphics;
 assert.ok(background.rectCalls>=100,'static scene should contain original pixel-art details');
 const staticTotal=background.rectCalls;
 assert.equal(dynamic.rectCalls,0);
 assert.equal(preview.toggle(),true);
 for(let i=0;i<370;i++)events.emit('update',i*16.667,16.667);
 assert.equal(background.rectCalls,staticTotal,'no pixel-art background redraws per frame');
 assert.equal(background.clearCalls,0);
 assert.ok(dynamic.clearCalls>=370);
 assert.ok(textNodes[0].textCalls<=15,'labels must not regenerate each frame');
 assert.ok(textNodes[1].textCalls<=5,'details must not regenerate each frame');
 assert.ok(dynamic.rectCalls>0);
 const [labelsBefore,detailBefore]=textNodes.map(t=>t.textCalls);
 preview.toggle();preview.toggle();
 for(let i=0;i<370;i++)events.emit('update',i*16.667,16.667);
 assert.equal(background.rectCalls,staticTotal,'reopening must reuse static art');
 assert.ok(textNodes[0].textCalls-labelsBefore<=15);
 assert.ok(textNodes[1].textCalls-detailBefore<=5);
 events.emit('shutdown');
 assert.equal(background.destroyed,true);
 assert.equal(dynamic.destroyed,true);
});

test('curved swept geometry rejects chord-only false hits and detects true arc contacts',()=>{
 const arc=t=>({x:10*t,y:40*t*(1-t)});
 const stationary=(x,y)=>()=>({x,y});
 assert.equal(sweptVectorHit(arc(0),arc(1),.5,{x:5,y:0},{x:5,y:0},.5).hit,true,
  'straight chord alone would claim an incorrect hit');
 const noContact=sweptVectorCurveHit(arc,.5,stationary(5,0),.5,0,1,32);
 assert.deepEqual(noContact,{hit:false,firstFraction:null,segment:null});
 const contact=sweptVectorCurveHit(arc,.5,stationary(5,10),.5,0,1,32);
 assert.equal(contact.hit,true);
 assert.ok(contact.firstFraction>.35&&contact.firstFraction<.5);
 // Resuming two consecutive sampled intervals must preserve a global contact ratio.
 const first=sweptVectorCurveHit(arc,.5,stationary(5,10),.5,0,.5,16);
 near(first.firstFraction,contact.firstFraction,.0005);
 const degenerate=sweptVectorCurveHit(arc,1,stationary(5,10),1,.5,.5);
 assert.equal(degenerate.hit,true);near(degenerate.firstFraction,.5);
 assert.equal(sweptVectorCurveHit(arc,1,stationary(5,0),1,.5,.5).hit,false);
 assert.throws(()=>sweptVectorCurveHit(arc,1,stationary(5,10),1,0,1,0),/segments/);
 assert.throws(()=>sweptVectorCurveHit(arc,1,stationary(5,10),1,.8,.2),/interval/);
 assert.throws(()=>sweptVectorCurveHit(arc,-1,stationary(5,10),1,0,1),/hitboxes/);
});
