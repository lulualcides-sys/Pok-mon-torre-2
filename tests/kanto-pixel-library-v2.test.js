import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='reference-assets/kanto/pixel-library-v2';
const m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
test('Kanto procedural atlas has unique addresses and correct group counts',()=>{
 assert.equal(m.assets.length,210);
 assert.equal(new Set(m.assets.map(e=>e.path)).size,m.assets.length);
 assert.equal(m.assets.filter(e=>e.kind==='terrain').length,120);
 assert.equal(m.assets.filter(e=>e.kind==='prop').length,90);
});
test('Kanto SVG sprites are script-free, self-contained, with exact dimensions',()=>{
 for(const entry of m.assets){
  const svg=fs.readFileSync(root+'/'+entry.path,'utf8');
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 32 32"/);
  assert.ok(!/<script|<image|<foreignObject|onload=|href=|<use|<style/i.test(svg));
  assert.ok((svg.match(/<rect /g)||[]).length>=4);
 }
});
