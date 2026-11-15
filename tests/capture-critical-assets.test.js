import test from 'node:test';
import assert from 'node:assert/strict';
import {NATIVE_PMD_MANIFEST,prioritizedNativeSourceTasks}
 from '../tools/pokearena/capture-critical-assets.mjs';

test('legacy inventory missing PMD manifest still captures it FIRST',()=>{
 const tasks=new Map([
  ['index.html',{source:'homepage'}],
  ['src-123456789a/main.js',{source:'REA script'}]
 ]);
 const prioritized=prioritizedNativeSourceTasks(tasks);
 assert.equal(prioritized[0][0],NATIVE_PMD_MANIFEST);
 assert.equal(prioritized[0][1].source,'mandatory original PMD manifest');
 assert.equal(prioritized.length,tasks.size+1);
 assert.deepEqual(prioritized.slice(1),[...tasks]);
 assert.equal(tasks.has(NATIVE_PMD_MANIFEST),false,'input inventory never modified');
});

test('already listed critical manifest remains single with original provenance',()=>{
 const tasks=new Map([
  ['src-123456789a/config.js',{source:'REA script'}],
  [NATIVE_PMD_MANIFEST,{source:'REA network asset',expectedHash:'verified'}]
 ]);
 const prioritized=prioritizedNativeSourceTasks(tasks);
 assert.equal(prioritized.length,tasks.size);
 assert.equal(prioritized[0][0],NATIVE_PMD_MANIFEST);
 assert.equal(prioritized[0][1].expectedHash,'verified');
 assert.equal(prioritized.filter(([p])=>p===NATIVE_PMD_MANIFEST).length,1);
});

test('source capture must rely on mandatory manifest as native asset dependency',async()=>{
 const {readFileSync}=await import('node:fs');
 const source=readFileSync(new URL('../tools/pokearena/capture-client.mjs',import.meta.url),'utf8');
 assert.match(source,/const queue=prioritizedNativeSourceTasks\(tasks\)/);
 assert.match(source,/details\.planned=queue\.length/);
 assert.match(source,/if\(!allManifest\.size\)throw Error\('Critical native PMD manifest unavailable/);
 assert.match(source,/details\.manifestAssets\.missing/);
 assert.throws(()=>prioritizedNativeSourceTasks([]),TypeError);
});
