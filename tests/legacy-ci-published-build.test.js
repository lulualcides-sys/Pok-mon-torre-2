// Owner list 2026-11-20, item 30: legacy CI tests no longer depend on the
// Poké Arena 2D site (HTTP 403). They use our authorized archived build.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PUBLISHED_RELEASE,MARKER} from '../tools/pokearena/published-build-fallback.mjs';

const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
test('fallback is pinned to our own release and the same pins as Pages',()=>{
 assert.match(PUBLISHED_RELEASE.sha256,/^[a-f0-9]{64}$/);
 const wf=fs.readFileSync(new URL('../.github/workflows/torre2-alpha0762-publish.yml',import.meta.url),'utf8');
 const run=wf.match(/TORRE2_ALPHA0773_RUN: '(\d+)'/)[1],commit=wf.match(/TORRE2_ALPHA0773_COMMIT: '([a-f0-9]+)'/)[1],
  digest=wf.match(/TORRE2_ALPHA0773_DIGEST: '([^']+)'/)[1];
 assert.deepEqual(PUBLISHED_RELEASE.manifest,['run='+run,'commit='+commit,'torre2-alpha0773-port='+digest]);
 const src=read('published-build-fallback.mjs');
 assert.ok(!/pokearena2d\.com/.test(src),'never touches the Poké Arena 2D site');
 assert.match(src,/if\(sha\(data\)!==PUBLISHED_RELEASE\.sha256\)fail/);
 assert.match(src,/tools\/pokearena\/publish-alpha0762\.mjs/);
});
test('capture-client only falls back on a 403, never retries the site',()=>{
 const cc=read('capture-client.mjs');
 assert.match(cc,/if\(\/HTTP 403\/\.test\(String\(e\?\.message\|\|e\)\)&&process\.env\.TORRE2_NO_PUBLISHED_FALLBACK!=='1'\)/);
 assert.match(cc,/restorePublishedBuild\(\)/);
 const bp=read('build-preview.mjs');
 assert.match(bp,/publishedBuildPresent\(\)/);
 assert.equal(MARKER,'site-capture/TORRE2-PUBLISHED-BUILD.json');
});
