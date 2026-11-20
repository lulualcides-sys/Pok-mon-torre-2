import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareVersions} from '../tools/pokearena/p2-version-scan.mjs';
const seen=JSON.parse(readFileSync(new URL('../tools/pokearena/p2-upstream-seen.json',import.meta.url),'utf8'));
test('scan only flags a NEW upstream version; never needs their game files',()=>{
 assert.equal(compareVersions(seen,{version:'0.77.3',src:'src-712ba03dbb'}).changed,false);
 const r=compareVersions(seen,{version:'0.78.0',src:'src-aaaaaaaaaa'});
 assert.equal(r.changed,true);assert.equal(r.base.version,'0.76.2');
 assert.equal(compareVersions(seen,{version:'x'}).ok,false);
 const wf=readFileSync(new URL('../.github/workflows/p2-version-scan.yml',import.meta.url),'utf8');
 assert.match(wf,/schedule:/);assert.doesNotMatch(wf,/capture-client|capture-resilient/,'scan never captures their client');
});
