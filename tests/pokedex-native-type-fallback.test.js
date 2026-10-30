import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync(new URL('../tools/pokearena/torre2-pokedex-pages.mjs',import.meta.url),'utf8');
const begin=src.indexOf(' const sync=String.raw`');
const start=begin+' const sync=String.raw`'.length;
const end=src.indexOf('function kantoDexStages(def){',start);
assert.ok(begin>0&&end>start,'Could not locate the exact native Pokédex color helper');
const helpers=src.slice(start,end);
const color=(type,native)=>vm.runInNewContext(helpers+'; kantoDexTypeColor('+JSON.stringify(type)+')',
 native===undefined?{}:{TIPOS:native});

test('Pokédex draws ALL Kanto type stripes even when upstream no longer exports TIPOS',()=>{
 assert.equal(color('FIRE'),0xf0804d);
 assert.equal(color('WATER'),0x6fb7f0);
 assert.equal(color('POISON'),0xb98cd9);
 assert.equal(color('FAIRY'),0xe5a8d6);
 assert.equal(color('MISSING'),0x9db1c7);
});
test('Pokédex retains authoritative original native colors if upstream still provides TIPOS',()=>{
 assert.equal(color('FIRE',{FIRE:0x123456}),0x123456);
 assert.equal(color('FIRE',{FIRE:'red'}),0xf0804d);
 assert.equal(color('FIRE',null),0xf0804d);
});
test('Native card generator uses the safe type palette, never the removed TIPOS variable directly',()=>{
 assert.ok(src.includes('g.fillStyle(kantoDexTypeColor(t),1)'));
 assert.ok(!src.includes('g.fillStyle(TIPOS[t],1)'));
});
