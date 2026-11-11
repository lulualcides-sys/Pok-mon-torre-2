'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  safeAssetPath, readNativeIndex, officialSourceDir,
  packCoverage, isValidObservedBytes
} = require('../tools/pokearena/rea-public-lazy-pack-probe.cjs');

const html=(forms={
  '0092-amarillogengar':'b'.repeat(20),
  '0146-sombrio':'c'.repeat(20)
})=>'<html><script src="src-8823a75d60/main.js"></script>' +
  '<script id="paq" type="application/json">' +
  JSON.stringify({comun:'a'.repeat(20),formas:forms}) +
  '</script></html>';

test('identify source hash separately from independently verified Alpha',()=>{
  assert.equal(officialSourceDir(html()),'src-8823a75d60');
  assert.equal(readNativeIndex(html()).comun,'a'.repeat(20));
});
test('reject malformed or missing public pack index',()=>{
  assert.throws(()=>readNativeIndex(''),/missing/);
  assert.throws(()=>readNativeIndex(html({'../secret':'f'.repeat(20)})),/Unsafe/);
  assert.throws(()=>readNativeIndex(html({'0146':'not-hash'})),/Unsafe/);
});
test('only allow exact public origin and native asset paths',()=>{
  const origin='https://www.pokearena2d.com/';
  assert.equal(safeAssetPath(origin+'assets/p/'+'a'.repeat(20)+'.bin'),
    'assets/p/'+'a'.repeat(20)+'.bin');
  assert.equal(safeAssetPath(origin+'assets/pmd/0092-amarillogengar/portrait.png'),
    'assets/pmd/0092-amarillogengar/portrait.png');
  for(const bad of [
    'https://other.example.com/assets/p/'+'a'.repeat(20)+'.bin',
    origin+'assets/p/'+'a'.repeat(20)+'.bin?token=abc',
    origin+'assets/p/../../private.txt',
    origin+'assets/pmd/0092-amarillogengar/test.js',
    origin+'src-8823a75d60/datos.js',
    origin+'assets/p/INVALID.bin'
  ])assert.equal(safeAssetPath(bad),null,bad);
});
test('coverage does not falsely count old or unobserved packs as captured',()=>{
  const index=readNativeIndex(html());
  const coverage=packCoverage(index,['assets/p/'+'b'.repeat(20)+'.bin']);
  assert.equal(coverage.declaredForms,2);
  assert.equal(coverage.coveredFormsByObservedPack,1);
  assert.equal(coverage.commonObserved,false);
  assert.deepEqual(coverage.missingFromTHISBrowserProbe.map(x=>x.dex),['0146-sombrio']);
});
test('coverage accepts observed original common and form packs',()=>{
  const index=readNativeIndex(html());
  const paths=['a','b','c'].map(x=>'assets/p/'+x.repeat(20)+'.bin');
  const coverage=packCoverage(index,paths);
  assert.equal(coverage.coveredFormsByObservedPack,2);
  assert.equal(coverage.commonObserved,true);
  assert.equal(coverage.missingFromTHISBrowserProbe.length,0);
});
test('reject invalid screenshots and do not manufacture assets',()=>{
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  assert.equal(isValidObservedBytes('assets/pmd/0092/portrait.png',
    Buffer.concat([sig,Buffer.alloc(90)])),true);
  assert.equal(isValidObservedBytes('assets/pmd/0092/portrait.png',
    Buffer.alloc(100)),false);
  assert.equal(isValidObservedBytes('assets/p/'+'a'.repeat(20)+'.bin',
    Buffer.alloc(100)),true);
  assert.equal(isValidObservedBytes('assets/p/'+'a'.repeat(20)+'.bin',
    Buffer.alloc(4)),false);
});
