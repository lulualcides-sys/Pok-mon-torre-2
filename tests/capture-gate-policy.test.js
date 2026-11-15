import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureDecision} from '../tools/pokearena/capture-gate.mjs';

const approved=JSON.parse(readFileSync(new URL('../data/pokearena-approved-alpha.json',import.meta.url),'utf8'));
const verified={observed:'src-5ccc174cb8',alpha:'0.71.3',
  alphaProof:'https://www.pokearena2d.com/src-5ccc174cb8/config.js'};

test('approved Alpha metadata describes the real audited public release, not historical 0.65.8',()=>{
 assert.equal(approved.approvedAlpha,'0.71.3');
 assert.equal(approved.approvedSource,'src-5ccc174cb8');
 assert.equal(approved.publishedCommit,'c45c8e42c91012abf87d8bb5e2715573f8190f38');
});
test('scheduled capture is skipped for the same real official VERSION + fingerprint',()=>{
 assert.deepEqual(captureDecision(verified,approved,'schedule'),
  {capture:false,reason:'no-verified-upstream-change',attention:false});
});
test('changed VERSION or source fingerprint requires a real independent capture',()=>{
 for(const report of [
  {...verified,alpha:'0.72.0'},
  {...verified,observed:'src-123456789a'}
 ]){
  assert.deepEqual(captureDecision(report,approved,'schedule'),
   {capture:true,reason:'verified-upstream-change',attention:true});
 }
});
test('blocked config, missing manifest evidence or unresolved approved baseline never fakes success',()=>{
 for(const report of [
  {...verified,alpha:null,alphaProof:null},
  {...verified,observed:null},
  {...verified,alphaProof:null}
 ]){
  const result=captureDecision(report,approved,'schedule');
  assert.equal(result.capture,false);
  assert.equal(result.attention,true);
 }
 const invalid=captureDecision(verified,{approvedAlpha:'0.71.3'},'schedule');
 assert.equal(invalid.capture,false);
 assert.equal(invalid.reason,'approved-baseline-unverified');
});
test('explicit manual recheck may attempt a legitimate source capture',()=>{
 assert.equal(captureDecision({...verified,alpha:null},approved,'workflow_dispatch').capture,true);
});
test('source capture workflow no longer downloads third-party assets on every internal push',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/pokearena-source-snapshot.yml',import.meta.url),'utf8');
 const triggers=workflow.slice(0,workflow.indexOf('\npermissions:'));
 assert.doesNotMatch(triggers,/^  push:/m);
 assert.match(triggers,/^  schedule:/m);
 assert.match(triggers,/^  workflow_dispatch:/m);
 assert.match(workflow,/node tools\/pokearena\/capture-gate\.mjs/);
 assert.match(workflow,/if: needs\.daily-gate\.outputs\.capture == 'true'/);
});
