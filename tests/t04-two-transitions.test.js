import test from 'node:test';
import assert from 'node:assert/strict';
import {clearDepartingCombat} from '../tools/pokearena/torre2-combat-boundary.js';

test('T04 two consecutive recalls discard each queued hit once without altering HP/status',()=>{
 const first={hp:37,est:{veneno:{remaining:4}},accion:{kind:'hit'},vx:8,vy:1};
 const second={hp:71,est:{paralizado:{remaining:6}},accion:{kind:'charge'},vx:2,vy:3};
 const scene={luchadores:[first,second],efectos:[],tareas:[],foco:first};
 const count={destroy:0,executed:0};
 const addPending=()=>{
  const effect={destroy(){count.destroy++}};
  scene.efectos.push(effect,null,effect);
  scene.tareas.push({fn(){count.executed++;first.hp-=11}});
  scene.tareas.push({fn(){count.executed++;second.hp-=12}});
 };
 addPending();clearDepartingCombat(scene);
 assert.equal(count.destroy,1);
 assert.deepEqual(scene.tareas,[]);
 assert.deepEqual(scene.efectos,[]);
 assert.equal(scene.foco,null);
 first.accion={kind:'second'};second.accion={kind:'second'};
 addPending();clearDepartingCombat(scene);clearDepartingCombat(scene);
 assert.equal(count.destroy,2,'Each effect destroyed once per transition');
 assert.equal(count.executed,0,'No delayed hit executed by cleanup');
 assert.deepEqual([first.hp,second.hp],[37,71]);
 assert.deepEqual(first.est,{veneno:{remaining:4}});
 assert.deepEqual(second.est,{paralizado:{remaining:6}});
 for(const actor of scene.luchadores){
  assert.equal(actor.accion,null);
  assert.equal(actor.vx,0);assert.equal(actor.vy,0);
 }
});
