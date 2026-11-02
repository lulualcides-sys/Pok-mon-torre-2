import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ART_SPRITES,makePixelSprite} from '../tools/pokearena/kanto-art-directed-v1.mjs';
const root='reference-assets/kanto/vector-reference-v1/art-directed/';
test('all six native art-directed SVGs are reproducible and pixel-perfect',()=>{
 assert.equal(Object.keys(ART_SPRITES).length,6);
 const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 assert.equal(manifest.assets.length,6);
 for(const [name,meta] of Object.entries(ART_SPRITES)){
  const generated=makePixelSprite(name);
  const committed=fs.readFileSync(root+name+'.svg','utf8');
  assert.equal(generated.svg,committed);
  assert.ok(generated.meta.shapes>=75);
  assert.match(committed,/shape-rendering="crispEdges"/);
  assert.match(committed,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.ok(!/<script|foreignObject|onload=|onerror=|href=|<image/i.test(committed));
  assert.match(committed,new RegExp('width="'+meta.w+'" height="'+meta.h+'"'));
  assert.equal(manifest.assets.find(x=>x.name===name)?.shapes,generated.meta.shapes);
 }
});
test('region silhouettes are distinctive and no duplicate textures exist',()=>{
 const all=Object.keys(ART_SPRITES).map(k=>makePixelSprite(k).svg);
 assert.equal(new Set(all).size,6);
 assert.equal(Object.values(ART_SPRITES).filter(x=>x.kind==='scene-module').length,3);
 assert.throws(()=>makePixelSprite('../../bad'),/Unknown art asset/);
});
