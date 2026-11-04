import test from 'node:test';
import assert from 'node:assert/strict';
import {
 ZAP_ELECTRO_BALL_TEXTURE,ZAP_ELECTRO_BALL_FRAMES,
 ZAP_ELECTRO_BALL_REFERENCE,zapCannonMotion
} from '../tools/pokearena/torre2-native-zap.js';

test('Zap Cannon uses the original Raichu Electro Ball sprite and frames',()=>{
 assert.equal(ZAP_ELECTRO_BALL_TEXTURE,'vfx-electroball');
 assert.deepEqual(ZAP_ELECTRO_BALL_FRAMES.flight,[0,1,2,3,4,5]);
 assert.deepEqual(ZAP_ELECTRO_BALL_FRAMES.impact,[6,7,8,9,10,11]);
 assert.equal(ZAP_ELECTRO_BALL_REFERENCE.frameWidth,40);
 assert.equal(ZAP_ELECTRO_BALL_REFERENCE.frameHeight,40);
 assert.equal(ZAP_ELECTRO_BALL_REFERENCE.columns,6);
 assert.equal(ZAP_ELECTRO_BALL_REFERENCE.flightAnimation,'vfx-electroball');
 assert.equal(ZAP_ELECTRO_BALL_REFERENCE.impactAnimation,'vfx-electroball-fin');
});

test('One large Electro Ball flies to target and impact uses second sprite row',()=>{
 const a={x:178,y:168},b={x:280,y:168};
 const start=zapCannonMotion(a,b,.1,2);
 assert.equal(start.stage,'charge');
 assert.equal(start.ball.x,a.x);
 assert.equal(start.impact.alpha,0);
 const flying=zapCannonMotion(a,b,.5,6);
 assert.equal(flying.stage,'flight');
 assert.ok(flying.ball.x>a.x&&flying.ball.x<b.x);
 assert.ok(flying.ball.frame>=0&&flying.ball.frame<=5);
 assert.equal(flying.impact.alpha,0);
 assert.ok(flying.sparks.length<=6);
 const collision=zapCannonMotion(a,b,.74,9);
 assert.equal(collision.stage,'impact');
 assert.equal(collision.ball.alpha,0);
 assert.equal(collision.impact.x,b.x);
 assert.ok(collision.impact.frame>=6&&collision.impact.frame<=11);
 assert.ok(collision.impact.alpha>0);
 assert.ok(collision.sparks.length<=6);
 const end=zapCannonMotion(a,b,1,12);
 assert.equal(end.impact.alpha,0);
 assert.equal(end.sparks.length,0);
});

test('Pure sprite positioning is deterministic, nearest-pixel and bounded',()=>{
 const args=[{x:132.4,y:155.7},{x:280.4,y:181.7},.48,7];
 assert.deepEqual(zapCannonMotion(...args),zapCannonMotion(...args));
 for(const phase of [0,.08,.17,.22,.35,.55,.68,.71,.83,.92,1]){
  const m=zapCannonMotion(args[0],args[1],phase,11);
  assert.ok(m.sparks.length<=6);
  assert.ok([m.ball,m.impact,...m.sparks].every(o=>
   Number.isInteger(o.x)&&Number.isInteger(o.y)&&
   Number.isFinite(o.alpha)&&o.alpha>=0&&o.alpha<=1));
 }
});
