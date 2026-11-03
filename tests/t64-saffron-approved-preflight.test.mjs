import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedMap,approvedMapNeighbours} from '../tools/pokearena/torre2-approved-maps-atlas.js';
import {firstApprovedHotspots,firstApprovedDestination} from '../tools/pokearena/torre2-approved-map-first-scenes.js';
import {planApprovedMapOverlays,MAP_CANVAS} from '../tools/pokearena/torre2-approved-map-renderer.js';

test('T64: Saffron uses only original atlas building coordinates',()=>{
 const entry=approvedMap('saffron-city');
 assert.equal(entry.index,32);
 const hotspots=firstApprovedHotspots(entry);
 assert.deepEqual(hotspots.map(h=>h.id),['silph','center','mart','gym']);
 for(const h of hotspots){
  const source=entry.hotspots.find(x=>x.id===h.id);
  assert.ok(source);
  for(const k of ['cx','cy','w','h'])assert.equal(h[k],source[k]);
 }
 assert.equal(planApprovedMapOverlays({...entry,hotspots},MAP_CANVAS,[]).ok,true);
 assert.equal(firstApprovedDestination('saffron-city','silph'),'silph-co');
 assert.equal(firstApprovedDestination('saffron-city','dojo'),null);
 assert.equal(firstApprovedDestination('saffron-city','gym'),'gym-sabrina');
 for(const gate of ['route5','route6','route7','route8'])
  assert.equal(firstApprovedDestination('saffron-city',gate),null);
 assert.ok(approvedMapNeighbours('saffron-city').includes('celadon-city'));
});
