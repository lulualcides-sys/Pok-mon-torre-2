import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyNativeVisualGate} from '../tools/pokearena/native-0713-release-gate.mjs';
const base={alpha:'0.71.3',src:'src-5ccc174cb8',forms:278};
test('diagnostic preview is allowed but cannot become a release with 27 missing forms',()=>{
 const r=verifyNativeVisualGate({...base,missing:27,diagnostic:true});
 assert.equal(r.diagnosticOnly,true);
 assert.equal(r.releaseReady,false);
 assert.equal(r.missing,27);
 assert.throws(()=>verifyNativeVisualGate({...base,missing:27,diagnostic:false}),
  /Native release blocked/);
});
test('no declared form absent qualifies as fully covered (not full game QA)',()=>{
 const r=verifyNativeVisualGate({...base,missing:0});
 assert.equal(r.releaseReady,true);
 assert.equal(r.diagnosticOnly,false);
});
test('source hash, alpha and total form count must be independently exact',()=>{
 assert.throws(()=>verifyNativeVisualGate({...base,src:'src-3cc4979f18',missing:0}),/fingerprint/);
 assert.throws(()=>verifyNativeVisualGate({...base,alpha:'0.71.4',missing:0}),/fingerprint/);
 assert.throws(()=>verifyNativeVisualGate({...base,forms:267,missing:0}),/form count/);
 assert.throws(()=>verifyNativeVisualGate({...base,missing:-1}),/Invalid native/);
});
test('previous Alpha 0.70 is still supported without weakening production block',()=>{
 const known={alpha:'0.70.0',src:'src-3cc4979f18',forms:267};
 assert.throws(()=>verifyNativeVisualGate({...known,missing:19}),/release blocked/);
 assert.equal(verifyNativeVisualGate({...known,missing:0}).releaseReady,true);
});

test('even full visual coverage cannot pass if artist rights remain unverified',()=>{
 const r=verifyNativeVisualGate({...base,missing:0,unclearedRights:11,diagnostic:true});
 assert.equal(r.releaseReady,false);
 assert.equal(r.diagnosticOnly,true);
 assert.equal(r.unclearedRights,11);
 assert.throws(()=>verifyNativeVisualGate({...base,missing:0,unclearedRights:11}),
  /redistribution clearance/);
});
