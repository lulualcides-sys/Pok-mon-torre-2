import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 VECTOR_REFERENCE_VERSION,validateVectorGuide,renderVectorGuide,
 inspectRectOnlySvg,compareReferenceGeometry,analyzePixelGrid
} from '../tools/pokearena/torre2-vector-reference.mjs';
const folder='reference-assets/kanto/vector-reference-v1/guides/';
const read=name=>JSON.parse(fs.readFileSync(folder+name+'.json','utf8'));
const names=['cerulean-canal','pewter-ridge','viridian-oak'];
test('reference guides follow strict native 32px integer-pixel pipeline',()=>{
 for(const name of names){
  const guide=read(name);assert.equal(guide.schema,VECTOR_REFERENCE_VERSION);
  assert.equal(validateVectorGuide(guide),true);
  const one=renderVectorGuide(guide),two=renderVectorGuide(guide);
  assert.equal(one.svg,two.svg);
  assert.match(one.svg,/shape-rendering="crispEdges"/);
  assert.equal(one.grid.length,32);
  assert.ok(one.metrics.paletteCount>=3);
  assert.equal(one.warnings.length,0);
  assert.deepEqual(inspectRectOnlySvg(one.svg).grid,one.grid);
  assert.deepEqual(compareReferenceGeometry(one,one).pass,true);
 }
});
test('Kanto visual signatures are not duplicates',()=>{
 const signatures=names.map(n=>renderVectorGuide(read(n)).metrics);
 assert.notEqual(signatures[0].foregroundCoverage,signatures[1].foregroundCoverage);
 assert.notEqual(signatures[1].foregroundCoverage,signatures[2].foregroundCoverage);
 assert.notEqual(signatures[0].edgeTransitions,signatures[1].edgeTransitions);
 assert.ok(signatures[2].foregroundCoverage<.8);
});
test('guide validator prevents script insertion, invalid geometry and palette inflation',()=>{
 const x=read('viridian-oak');
 assert.throws(()=>validateVectorGuide({...x,palette:{...x.palette,leak:'url(http://external)'}}),/hex RGB/);
 assert.throws(()=>validateVectorGuide({...x,shapes:[{type:'ellipse',cx:.5,cy:.5,rx:2,ry:.2,color:'trunk'},...x.shapes]}),/outside guide/);
 assert.throws(()=>validateVectorGuide({...x,name:'../../escape'}),/safe slug/);
 assert.throws(()=>inspectRectOnlySvg('<svg><script>alert(1)</script></svg>'),/SVG opening tag|unsafe/);
});
test('existing 210 candidate SVG library can be read for vector diagnostics',()=>{
 const root='reference-assets/kanto/pixel-library-v2/';
 const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 assert.equal(manifest.assets.length,210);
 for(const entry of manifest.assets){
  const {grid,metrics}=inspectRectOnlySvg(fs.readFileSync(root+entry.path,'utf8'));
  assert.equal(grid.length,32);
  assert.equal(metrics.width,32);assert.equal(metrics.height,32);
  assert.ok(metrics.paletteCount<=16);
  assert.ok(metrics.edgeTransitions>=0);
 }
});
test('seam inspection detects incompatible edge pixels before use as autotiles',()=>{
 const grid=Array.from({length:16},()=>Array(16).fill('#223344'));
 grid[0][4]='#ffffff';
 const metrics=analyzePixelGrid(grid,{background:'#223344'});
 assert.equal(metrics.seamMismatches.vertical,1);
 assert.equal(metrics.seamMismatches.horizontal,0);
});
