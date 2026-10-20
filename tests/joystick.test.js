import test from 'node:test';
import assert from 'node:assert/strict';
import {stickVector,keyboardOrStick} from '../src/joystick.js';
import {createBattle,movePlayer} from '../src/combat-core.js';

const bounds={left:20,top:30,width:120,height:120};
test('joystick returns neutral when idle or within dead-zone',()=>{
 for(const [x,y] of [[80,90],[82,91]]){
  assert.deepEqual(stickVector(x,y,bounds),{x:0,y:0,magnitude:0,offsetX:0,offsetY:0});
 }
});
test('stick supports precise 360-degree diagonal input and clamps at full strength',()=>{
 const v=stickVector(120,52,bounds);
 assert.ok(v.x>.65);assert.ok(v.y<-.65);
 assert.ok(v.magnitude<=1);
 assert.ok(Math.hypot(v.x,v.y)<=1.00001);
 assert.ok(Math.hypot(v.offsetX,v.offsetY)<=38.41);
});
test('half-stick movement is slower than full-stick movement',()=>{
 const light=stickVector(90,90,bounds);
 const full=stickVector(200,90,bounds);
 assert.ok(light.magnitude>0&&light.magnitude<1);
 assert.equal(full.magnitude,1);
 const a=createBattle(),b=createBattle();
 movePlayer(a,light.x,light.y,.1);
 movePlayer(b,full.x,full.y,.1);
 assert.ok(b.player.x-a.player.x>0.1,'full tilt must move farther than partial tilt');
});
test('keyboard overrides held joystick; neutral reverts to touch',()=>{
 const v={x:.3,y:-.4};
 assert.deepEqual(keyboardOrStick(new Set(),v),{x:.3,y:-.4});
 assert.deepEqual(keyboardOrStick(new Set(['w','d']),v),{x:1,y:-1});
});
test('zero analog motion must not move the player',()=>{
 const s=createBattle(),before={x:s.player.x,y:s.player.y};
 movePlayer(s,0,0,.1);
 assert.equal(s.player.x,before.x);assert.equal(s.player.y,before.y);
});
