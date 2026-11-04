import test from 'node:test';
import assert from 'node:assert/strict';
import {ZAP_NATIVE_CLIENT_TEXTURES,zapClientLightningGeometry}
 from '../tools/pokearena/torre2-native-zap.js';

test('Zap Cannon reuses the exact native client electrical textures',()=>{
 assert.deepEqual([...ZAP_NATIVE_CLIENT_TEXTURES],['p-rayo','p-electro']);
});

test('Zap Cannon beam advances to real target and fragments only at impact',()=>{
 const start={x:174,y:165},target={x:283,y:165};
 assert.deepEqual(zapClientLightningGeometry(start,target,0),[]);
 const mid=zapClientLightningGeometry(start,target,.32,4);
 assert.ok(mid.length>=8&&mid.length<=32);
 assert.ok(mid.some(p=>p.texture==='p-rayo'));
 assert.ok(mid.every(p=>p.texture==='p-rayo'));
 assert.ok(Math.max(...mid.map(p=>p.x))<target.x);
 const contact=zapClientLightningGeometry(start,target,.71,9);
 assert.ok(contact.some(p=>p.texture==='p-electro'));
 assert.ok(contact.some(p=>Math.abs(p.x-target.x)<=20&&Math.abs(p.y-target.y)<=20));
 assert.ok(contact.length<=32,'One finite preallocated object pool');
 assert.ok(contact.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)&&
  Number.isFinite(p.angle)&&p.alpha>=0&&p.alpha<=1));
 const off=zapClientLightningGeometry(start,target,1,12);
 assert.ok(off.length<=6,'No long ray after hit window');
 assert.ok(off.every(p=>p.texture==='p-electro'&&p.alpha===0));
});

test('Zap Cannon geometry is deterministic and pixel-snapped',()=>{
 const args=[{x:130.4,y:141.6},{x:281.1,y:169.9},.5,6];
 assert.deepEqual(zapClientLightningGeometry(...args),zapClientLightningGeometry(...args));
 assert.notDeepEqual(zapClientLightningGeometry(...args),
  zapClientLightningGeometry(args[0],args[1],args[2],7));
 const items=zapClientLightningGeometry(...args);
 assert.ok(items.every(p=>Number.isInteger(p.x)&&Number.isInteger(p.y)));
 assert.deepEqual(zapClientLightningGeometry({x:2,y:2},{x:2,y:2},.5),[]);
});
