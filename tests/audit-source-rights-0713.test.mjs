import test from 'node:test';
import assert from 'node:assert/strict';
import {creditSource,classifyCurrentCredits,collectProvenances}
 from '../tools/pokearena/audit-source-rights-0713.mjs';
const base='https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/';
const cur=(author,license,anim)=>'2026-11-14\t'+author+'\tCUR\t'+license+'\t'+anim+'\n';
test('derive exact credit source and animation from installed PNG URL',()=>{
 const p=creditSource(base+'sprite/0094/0003/Attack-Anim.png');
 assert.equal(p.creditPath,'sprite/0094/0003/credits.txt');
 assert.equal(p.animation,'Attack');
 assert.equal(creditSource(base+'portrait/0133/Normal.png').animation,'Normal');
 assert.throws(()=>creditSource('https://elsewhere.net/sprite/0133/Idle-Anim.png'),/origin/);
 assert.throws(()=>creditSource(base+'sprite/0133/../../Idle-Anim.png'),/Unsafe/);
});
test('all contributing artists must have individually CC BY-NC credits',()=>{
 assert.equal(classifyCurrentCredits(cur('A','CC_BY-NC_4','Idle,Attack'),'Attack').status,
  'ALL_CURRENT_CC_BY_NC');
 assert.equal(classifyCurrentCredits(cur('A','CC_BY-NC_4','Attack')+
   cur('CHUNSOFT','Unspecified','Attack'),'Attack').status,'UNSPECIFIED_RIGHTS');
 assert.equal(classifyCurrentCredits(cur('A','CC_BY-NC_4','Idle')+
   cur('B','PMDCollab_2','Attack'),'Attack').status,'POLICY_NONCOMMERCIAL_CREDITED');
 assert.equal(classifyCurrentCredits(cur('A','PMDCollab_1','Walk'),'Walk').status,
  'POLICY_NONCOMMERCIAL_CREDITED');
 assert.equal(classifyCurrentCredits(cur('A','Unauthorized','Walk'),'Walk').status,
  'OTHER_LICENSE_REVIEW');
 assert.equal(classifyCurrentCredits(cur('A','CC_BY-NC_4','Idle'),'Normal').status,
  'MISSING_CURRENT_CREDIT');
 assert.throws(()=>classifyCurrentCredits('bad line','Idle'),/Malformed/);
});
test('only exact audited source entries contribute to 30-form manifest',()=>{
 const id='0132',rel=id+'/portrait.png',source=base+'portrait/0132/Normal.png';
 const m=collectProvenances({licensed:[{dex:id,files:[{relative:rel,source}]}]},
  {files:[]},[id]);
 assert.equal(m.get(id).length,1);
 assert.equal(m.get(id)[0].creditPath,'portrait/0132/credits.txt');
 assert.throws(()=>collectProvenances({licensed:[{dex:id,files:[{relative:rel,source}]}]},
  {files:[{relative:rel,source}]},[id]),/Duplicate/);
});
