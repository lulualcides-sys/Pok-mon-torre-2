import test from 'node:test';
import assert from 'node:assert/strict';
import {preflightPinnedSource} from '../tools/pokearena/capture-source-selection.mjs';
const pin='src-97f03e6e1b';
test('T31 preflight returns verified config bytes without changing approved source',async()=>{
 let calls=0;const result=await preflightPinnedSource(pin,async p=>{
  calls++;assert.equal(p,pin+'/config.js');return {data:Buffer.from('export const OK=true;')}
 });
 assert.equal(calls,1);assert.equal(result.path,pin+'/config.js');
 assert.ok(result.response.data.length);
});
test('T31 preflight retries a transient error and fails closed on persistent 404',async()=>{
 let calls=0;const waits=[];
 await assert.rejects(preflightPinnedSource(pin,async()=>{
  calls++;throw Error('HTTP 404');
 },{attempts:2,wait:async ms=>waits.push(ms)}),
 /Pinned Phaser source src-97f03e6e1b unavailable.*HTTP 404/);
 assert.equal(calls,2);assert.deepEqual(waits,[400]);
});
test('T31 preflight rejects empty modules, invalid versions and excessive retries',async()=>{
 await assert.rejects(preflightPinnedSource(pin,async()=>({data:Buffer.alloc(0)}),{attempts:1}),/Empty critical module/);
 await assert.rejects(preflightPinnedSource('src-latest',async()=>({data:Buffer.from('x')})),/Invalid pinned Phaser source/);
 await assert.rejects(preflightPinnedSource(pin,async()=>({data:Buffer.from('x')}),{attempts:100}),/Invalid preflight retry count/);
});
