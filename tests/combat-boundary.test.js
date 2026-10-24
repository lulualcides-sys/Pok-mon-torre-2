import test from 'node:test';
import assert from 'node:assert/strict';
import {clearDepartingCombat} from '../tools/pokearena/torre2-combat-boundary.js';
test('switch cancels queued contact and projectiles without healing or clearing peer status',()=>{
 let destroyed=0;const actor={hp:30,est:{veneno:{dur:4}},accion:{},vx:22};
 const scene={efectos:[{destroy(){destroyed++}}],tareas:[{fn(){actor.hp-=20}}],luchadores:[actor]};
 clearDepartingCombat(scene);clearDepartingCombat(scene);
 assert.equal(destroyed,1);assert.deepEqual(scene.tareas,[]);assert.deepEqual(scene.efectos,[]);
 assert.equal(actor.hp,30);assert.equal(actor.est.veneno.dur,4);assert.equal(actor.accion,null);assert.equal(actor.vx,0);
});
