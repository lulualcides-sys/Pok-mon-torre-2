import test from 'node:test';
import assert from 'node:assert/strict';
import {REGIONS,PREVIEW_ORDER,REGION_TYPES,getRegion,nextRegion} from '../tools/pokearena/torre2-kanto-gallery.js';
test('eight regions follow Brock before Misty and canonical Pallet start',()=>{
 assert.deepEqual(PREVIEW_ORDER,['pallet','route1','viridian','forest2','pewter','route3','moon','route4']);
 assert.equal(new Set(PREVIEW_ORDER).size,8);
 assert.ok(REGIONS.every(r=>REGION_TYPES.includes(r.kind)));
 assert.equal(getRegion('moon').kind,'cave');
 assert.equal(getRegion('forest2').kind,'route');
 assert.equal(getRegion('pallet').exit,'Rota 1');
});
test('cities never contain trainers and Pallet has no invented Mart or Gym',()=>{
 assert.ok(REGIONS.filter(r=>r.kind==='city').every(r=>r.trainers===0));
 assert.deepEqual(getRegion('pallet').buildings,['Casa do Red','Casa do Rival','Laboratório Oak']);
 assert.ok(!getRegion('pallet').buildings.some(x=>/Ginásio|Mart/.test(x)));
 assert.equal(getRegion('route1').trainers,0);
});
test('native gallery navigation covers all regions and wraps',()=>{
 let id='pallet',seen=[];
 for(let i=0;i<8;i++){seen.push(id);id=nextRegion(id)}
 assert.deepEqual(seen,PREVIEW_ORDER);
 assert.equal(id,'pallet');
 assert.equal(nextRegion('pallet',-1),'route4');
 assert.equal(getRegion('unknown'),null);
});
