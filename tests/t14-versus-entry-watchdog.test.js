import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {scheduleVsEntry,VS_WATCHDOG_GRACE_MS} from '../tools/pokearena/torre2-versus-transition.js';

function fixture(){
 const events=new EventEmitter(),call=[],timeouts=[],cleared=[];
 let active=true,phaserCallback=null;
 const timer={removed:0,remove(){this.removed++}};
 const scene={
  events,scene:{isActive:()=>active},
  time:{delayedCall(ms,fn){call.push(ms);phaserCallback=fn;return timer;}}
 };
 const after=(fn,ms)=>{const id=timeouts.length;timeouts.push({fn,ms});return id};
 const cancelAfter=id=>cleared.push(id);
 return {scene,timer,call,timeouts,cleared,after,cancelAfter,
  get phaser(){return phaserCallback},deactivate(){active=false}};
}
test('normal Phaser 2.5s VS transitions exactly once with cancelled watchdog',()=>{
 const f=fixture();let count=0;
 scheduleVsEntry(f.scene,()=>count++,2500,f);
 assert.deepEqual(f.call,[2500]);
 assert.equal(f.timeouts[0].ms,2500+VS_WATCHDOG_GRACE_MS);
 f.phaser();
 f.timeouts[0].fn();
 assert.equal(count,1);
 assert.deepEqual(f.cleared,[0]);
 assert.equal(f.timer.removed,1);
 assert.equal(f.scene.events.listenerCount('shutdown'),0);
});
test('stalled Phaser clock invokes 3.4s fallback once and removes stale Phaser timer',()=>{
 const f=fixture();let count=0;
 scheduleVsEntry(f.scene,()=>count++,2500,f);
 f.timeouts[0].fn();
 f.phaser();
 assert.equal(count,1);
 assert.equal(f.timer.removed,1);
 assert.equal(f.scene.events.listenerCount('shutdown'),0);
});
test('shutdown cancels both clocks, and never launches combat',()=>{
 const f=fixture();let count=0;
 scheduleVsEntry(f.scene,()=>count++,2500,f);
 f.deactivate();f.scene.events.emit('shutdown');
 f.phaser();f.timeouts[0].fn();
 assert.equal(count,0);
 assert.equal(f.timer.removed,1);
 assert.deepEqual(f.cleared,[0]);
});
test('inactive scene never calls combat even when delayed Phaser fires',()=>{
 const f=fixture();let count=0;
 scheduleVsEntry(f.scene,()=>count++,2500,f);
 f.deactivate();f.phaser();
 assert.equal(count,0);
});
