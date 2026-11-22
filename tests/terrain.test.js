// Owner 2026-11-22 (README 8): terrains from real ULT casts, campaign only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../tools/pokearena/torre2-terrain.js',import.meta.url),'utf8');
// The module imports ../config.js (native client); test the pure part in isolation.
const pure=await import('data:text/javascript,'+encodeURIComponent(src.replace("import {LIENZO} from '../arena.js';","const LIENZO={x:-20,y:-40,w:700,h:460};")));
test('only a real ULT of Electric/Grass/Water/Psychic, with a 25% chance',()=>{
 const yes=()=>.1,no=()=>.3;
 assert.equal(pure.TERRAIN_CHANCE,.25);
 assert.equal(pure.terrainFromCast('e',{tipo:'ELECTRIC'},yes),'eletrico');
 assert.equal(pure.terrainFromCast('e',{tipo:'GRASS'},yes),'gramado');
 assert.equal(pure.terrainFromCast('e',{tipo:'WATER'},yes),'aquatico');
 assert.equal(pure.terrainFromCast('e',{tipo:'PSYCHIC'},yes),'psiquico');
 assert.equal(pure.terrainFromCast('e',{tipo:'ELECTRIC'},no),null,'not every ULT');
 assert.equal(pure.terrainFromCast('rmb',{tipo:'ELECTRIC'},yes),null,'HAB moves do not');
 assert.equal(pure.terrainFromCast('e',{tipo:'FIRE'},yes),null);
 let n=0;for(let i=0;i<4000;i++)if(pure.terrainFromCast('e',{tipo:'WATER'}))n++;assert.ok(n>800&&n<1200,String(n));
});
test('effects: same type +30%, water weakens fire, grass heals 1/16 per 4 s',()=>{
 assert.equal(pure.terrainDamage('eletrico','ELECTRIC'),1.3);assert.equal(pure.terrainDamage('eletrico','FIRE'),1);
 assert.equal(pure.terrainDamage('aquatico','FIRE'),.7);assert.equal(pure.terrainDamage('none','WATER'),1);
 assert.ok(Math.abs(pure.terrainHeal('gramado',160,.2)*20-10)<1e-9,'4 s → 1/16 of 160');
 assert.equal(pure.terrainHeal('eletrico',160,.2),0);
});
test('pixel pattern covers the whole arena and animates',()=>{
 const rect={x:-20,y:-40,w:700,h:460};
 for(const k of Object.keys(pure.TERRAINS)){
  const a=pure.terrainPattern(k,3,rect),b=pure.terrainPattern(k,9,rect);
  assert.ok(a.length>=20);
  for(const p of a)if(k!=='psiquico')assert.ok(p.x>=rect.x&&p.x<=rect.x+rect.w&&p.y>=rect.y&&p.y<=rect.y+rect.h,k);
  // spread over the whole area, not only the centre
  assert.ok(a.some(p=>p.x<rect.x+rect.w*.15)&&a.some(p=>p.x>rect.x+rect.w*.85),k+' spread');
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
