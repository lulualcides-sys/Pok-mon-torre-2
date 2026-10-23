import test from 'node:test';
import assert from 'node:assert/strict';
import {BATCH24_MOVES,BATCH24_NATIVE_REUSE} from '../tools/pokearena/batch24/catalog.js';
import {PALETTES,SHAPES} from '../tools/pokearena/batch24/pixels.js';
test('the requested 24 move names consist of 23 new plus 1 existing approved native Dragon Pulse',()=>{
 assert.equal(BATCH24_MOVES.length,23);
 assert.equal(new Set(BATCH24_MOVES.map(x=>x.id)).size,23);
 const visuallyApproved=new Set(["fury-cutter","earth-power","giga-drain","energy-ball","ice-fang","icicle-spear","mega-drain","leaf-blade","pin-missile","night-slash","poison-fang","sludge","acid","acid-spray","icy-wind","mud-shot","mud-bomb","silver-wind","twister","dark-pulse"]);
 assert.equal(BATCH24_MOVES.filter(h=>h.approved).length,20);
 assert.equal(BATCH24_MOVES.filter(h=>!h.approved).length,3);
 assert.equal(BATCH24_NATIVE_REUSE.id,'dragon-pulse');
 assert.equal(BATCH24_NATIVE_REUSE.source,'arena2d-original');
 assert.ok(!BATCH24_MOVES.some(x=>x.id===BATCH24_NATIVE_REUSE.id));
 assert.equal(new Set([...BATCH24_MOVES.map(x=>x.id),BATCH24_NATIVE_REUSE.id]).size,24);
 for(const h of BATCH24_MOVES){
  assert.equal(h.approved,visuallyApproved.has(h.id),h.id+' wrong approval status');assert.equal(h.frames,12);
  assert.ok(PALETTES[h.palette]);assert.ok(h.poder>0&&h.dano>0);
  assert.ok(h.precisao>0&&h.precisao<=100);assert.ok(h.pp>0);
  assert.ok(['PHYSICAL','SPECIAL'].includes(h.categoria));
 }
 for(const rows of Object.values(SHAPES))assert.ok(rows.every(row=>/^[.0-4]+$/.test(row)));
});
test('contact attacks cannot become ranged projectiles; multi-hit power is per hit',()=>{
 const contacts=BATCH24_MOVES.filter(x=>x.fazContato);
 assert.equal(contacts.length,6);
 assert.ok(contacts.every(x=>x.speed===0&&x.alcance<=78));
 for(const id of ['pin-missile','icicle-spear']){
  const h=BATCH24_MOVES.find(x=>x.id===id);assert.equal(h.poder,25);assert.equal(h.secondary,'multi');
 }
 assert.equal(BATCH24_MOVES.find(x=>x.id==='ice-shard').secondary,'priority');
});

import {stepFragment,FRAGMENT_POSES} from '../tools/pokearena/batch24/emerald-fragments.js';
test('ported debris applies ground bounce, friction and bounded pose storage',()=>{
 const f={x:0,y:0,z:1,vx:256,vy:-256,vz:-200,bounces:0};
 stepFragment(f);assert.equal(f.z,0);assert.equal(f.bounces,1);
 assert.equal(f.vz,Math.trunc(242*90/256));assert.equal(f.vx,180);assert.equal(f.vy,-180);
 f.z=1;f.vz=-200;f.bounces=3;stepFragment(f);assert.equal(f.vz,0);
 assert.equal(FRAGMENT_POSES.length,7);assert.ok(FRAGMENT_POSES.every(p=>p.length===12));
});
