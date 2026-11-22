// Owner 2026-11-22 (README 8): terrains from real ULT casts, campaign only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../tools/pokearena/torre2-terrain.js',import.meta.url),'utf8');
// The module imports ../config.js (native client); test the pure part in isolation.
const pure=await import('data:text/javascript,'+encodeURIComponent(src.replace("import {CAMPO} from '../config.js';","const CAMPO={x:0,y:0,w:600,h:240};")));
test('only a real ULT of Electric/Grass/Water/Psychic creates a terrain',()=>{
 assert.equal(pure.terrainFromCast('e',{tipo:'ELECTRIC'}),'eletrico');
 assert.equal(pure.terrainFromCast('e',{tipo:'GRASS'}),'gramado');
 assert.equal(pure.terrainFromCast('e',{tipo:'WATER'}),'aquatico');
 assert.equal(pure.terrainFromCast('e',{tipo:'PSYCHIC'}),'psiquico');
 assert.equal(pure.terrainFromCast('rmb',{tipo:'ELECTRIC'}),null,'HAB moves do not');
 assert.equal(pure.terrainFromCast('e',{tipo:'FIRE'}),null);
});
test('effects: same type +30%, water weakens fire, grass heals 1/16 per 4 s',()=>{
 assert.equal(pure.terrainDamage('eletrico','ELECTRIC'),1.3);assert.equal(pure.terrainDamage('eletrico','FIRE'),1);
 assert.equal(pure.terrainDamage('aquatico','FIRE'),.7);assert.equal(pure.terrainDamage('none','WATER'),1);
 assert.ok(Math.abs(pure.terrainHeal('gramado',160,.2)*20-10)<1e-9,'4 s → 1/16 of 160');
 assert.equal(pure.terrainHeal('eletrico',160,.2),0);
});
test('pixel pattern stays inside the floor ellipse and animates',()=>{
 const ell={cx:300,cy:120,rx:280,ry:110};
 for(const k of Object.keys(pure.TERRAINS)){
  const a=pure.terrainPattern(k,3,ell),b=pure.terrainPattern(k,9,ell);
  assert.ok(a.length>=10);
  for(const p of a)if(k!=='psiquico')assert.ok(((p.x-ell.cx)/ell.rx)**2+((p.y-ell.cy)/ell.ry)**2<=1.01,k);
  if(k!=='gramado')assert.notDeepEqual(a,b,k+' animates');
 }
});
test('wiring: cast hook chain, damage through the individuality hook, published',()=>{
 const read=f=>fs.readFileSync(new URL('../tools/pokearena/'+f,import.meta.url),'utf8');
 assert.match(read('torre2-arena-trainers.js'),/previous\?\.\(l,slot,h\)/,'trainers keep other listeners');
 assert.match(src,/previous\?\.\(l,slot,h\)/);
 assert.match(read('torre2-individuality.js'),/__torre2Terrain\?\.damage/);
 assert.match(read('torre2-party-battle.js'),/installTerrain\(scene/);
 assert.match(read('publish-alpha0762.mjs'),/torre2-terrain\.js','torre2\/terrain\.js'/);
});
