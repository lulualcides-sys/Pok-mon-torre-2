import test from 'node:test';
import assert from 'node:assert/strict';
import {fingerprint,compare,health,probe,incident,officialAlpha,officialSourceDir} from '../tools/pokearena/watch-upstream.mjs';
const read = async () => JSON.stringify({siteVersion:'src-123456789a'});
const response = (status, html) => ({ok:status===200,status,text:async()=>html});
test('hash is not an Alpha version',()=>{
  assert.equal(fingerprint('<script src="/src-abcdef1234/init.js">'), 'src-abcdef1234');
  assert.equal(fingerprint('no hash'),null);
});
test('detects changed and equal source',()=>{
  assert.equal(compare('src-abcdef1234','src-123456789a'),'new-fingerprint');
  assert.equal(compare('src-123456789a','src-123456789a'),'same-fingerprint');
  assert.equal(compare(null,'src-123456789a'),'unverified');
});
test('403 is visible and never declared up-to-date',async()=>{
  const r=await probe(async()=>response(403,''), read);
  assert.equal(r.status,'unverified');assert.equal(r.needsAttention,true);
  assert.match(r.error,/HTTP 403/);assert.equal(r.alpha,null);
});
test('changed upstream opens incident',async()=>{
  const r=await probe(async()=>response(200,'src-abcdef1234'), read);
  assert.equal(r.needsAttention,true);assert.match(incident(r),/new-fingerprint/);
});
test('capture failure is surfaced even with equal hashes',async()=>{
  const fetcher=async url=>url.includes('api.github.com')
    ?response(200,JSON.stringify({workflow_runs:[{status:'completed',conclusion:'failure'}]}))
    :response(200,'src-123456789a');
  const r=await probe(fetcher,read,'token','owner/repo');
  assert.equal(r.needsAttention,true);assert.equal(r.captures['pokearena-source-snapshot.yml'].status,'failed');
});
test('no false incident when both captures succeeded',async()=>{
  const fetcher=async url=>url.includes('api.github.com')
    ?response(200,JSON.stringify({workflow_runs:[{status:'completed',conclusion:'success'}]}))
    :response(200,'src-123456789a');
  assert.equal((await probe(fetcher,read,'token','owner/repo')).needsAttention,false);
});
test('latest completed capture is used',()=>assert.equal(health([{status:'in_progress'},{status:'completed',conclusion:'failure'}]).status,'failed'));

test('actual official Alpha comes only from config.js',()=>{
  assert.equal(officialSourceDir('<script type="module" src="src-ccbd93e75a/main.js"></script>'),'src-ccbd93e75a');
  assert.equal(officialAlpha('const VERSION = "0.67.3";'),'0.67.3');
  assert.equal(officialAlpha('const other = "src-ccbd93e75a";'),null);
});
test('official 0.67.3 versus approved 0.65.8 stays pending even if hashes match',async()=>{
  const fetcher=async url=>response(200,url.includes('config.js')
    ?'const VERSION="0.67.3";':'<script src="src-123456789a/main.js"></script>');
  const readVersion=async path=>path.includes('approved-alpha')
    ?JSON.stringify({approvedAlpha:'0.65.8'})
    :JSON.stringify({siteVersion:'src-123456789a'});
  const r=await probe(fetcher,readVersion);
  assert.equal(r.alpha,'0.67.3');assert.equal(r.approvedAlpha,'0.65.8');
  assert.equal(r.status,'same-fingerprint');assert.equal(r.needsAttention,true);
  assert.match(incident(r),/Alpha oficial: \*\*0.67.3\*\*/);
});
test('denied public config never invents Alpha',async()=>{
  const fetcher=async url=>url.endsWith('config.js')
    ?response(403,'blocked'):response(200,'<script src="src-123456789a/main.js"></script>');
  const r=await probe(fetcher,read);
  assert.equal(r.alpha,null);
  assert.match(r.alphaError,/HTTP 403/);
});
