import test from 'node:test';
import assert from 'node:assert/strict';
import {APPROVED_MAPS_ATLAS, approvedMap, approvedMapNeighbours, approvedPointToScreen} from '../tools/pokearena/torre2-approved-maps-atlas.js';

test('atlas includes sixty unique approved backgrounds, preserving S.S. Anne', () => {
 assert.equal(APPROVED_MAPS_ATLAS.maps.length, 60);
 assert.equal(new Set(APPROVED_MAPS_ATLAS.maps.map(x=>x.id)).size,60);
 assert.ok(approvedMap('ss-anne'));
 assert.equal(approvedMap('silph-co').name.includes('Lapras'), true);
 assert.equal(approvedMap('gym-blaine').name.includes('sem Blaine Arcanine'), true);
});
test('all edges point to existing scenes, neighbours are symmetric',()=>{
 for(const [a,b] of APPROVED_MAPS_ATLAS.edges){
  assert.ok(approvedMap(a),a); assert.ok(approvedMap(b),b);
  assert.ok(approvedMapNeighbours(a).includes(b));
  assert.ok(approvedMapNeighbours(b).includes(a));
 }
});
test('hotspots have bounded normalized coordinates',()=>{
 for(const m of APPROVED_MAPS_ATLAS.maps) for(const h of m.hotspots){
  const pos=approvedPointToScreen(h,{x:20,y:70,width:600,height:270});
  assert.ok(pos.x>=20&&pos.x<=620);assert.ok(pos.y>=70&&pos.y<=340);
  assert.ok(pos.width>0&&pos.height>0);
 }
});
test('no map requires HM to display; game progression remains independent',()=>{
 for(const m of APPROVED_MAPS_ATLAS.maps) assert.equal((m.min_story_flags||[]).some(x=>x.startsWith('hm:')),false);
});