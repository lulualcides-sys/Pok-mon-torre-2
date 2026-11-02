import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FRLG_LOCALE_NAMES,KANTO_BACKDROP_SPANS,routeBackdropForCampaign}
 from '../tools/pokearena/torre2-frlg-location.js';

const choose=(stage,trainer,total,fallback='indigo')=>
 routeBackdropForCampaign(stage,trainer,total,fallback);

test('Kanto routes use the available FireRed sprites from Pallet through Misty',()=>{
 assert.equal(KANTO_BACKDROP_SPANS.length,13);
 assert.deepEqual([0,4,7,10,13].map(n=>choose(0,n,13,'pewter').locale),
  ['pallet','route1','viridian','forest','pewter']);
 assert.deepEqual([0,5,10,15].map(n=>choose(1,n,15,'cerulean').locale),
  ['route3','mtmoon','route4','cerulean']);
 assert.ok(FRLG_LOCALE_NAMES.includes('mtmoon'),'cave uses existing native source');
});

test('late Kanto continues through Victory Road and Indigo Plateau, no extra stage',()=>{
 assert.deepEqual([0,9].map(n=>choose(8,n,9,'indigo').locale),
  ['victory','indigo']);
 for(let stage=9;stage<=12;stage++){
  const c=choose(stage,0,1,'indigo');
  assert.equal(c.locale,'indigo');
  assert.equal(c.mapped,true);
 }
 assert.equal(choose(13,0,1,'indigo').mapped,false);
});

test('missing FireRed sheets are explicit gaps, never mislabeled as native',()=>{
 const absent=choose(2,7,17,'vermilion');
 assert.equal(absent.mapped,false);
 assert.equal(absent.requested,null);
 assert.equal(absent.locale,'vermilion');
 const rock=choose(3,0,19,'celadon');
 assert.equal(rock.mapped,false,'Route 9/10 needs its own real sheet');
 assert.equal(rock.locale,'celadon');
 const existing=choose(3,13,19,'celadon');
 assert.equal(existing.locale,'pokemontower');
 assert.equal(existing.mapped,true);
});

test('every existing route asset selector resolves safely and never writes game state',()=>{
 const totals=[13,15,17,19,21,23,25,27,9,1,1,1,1];
 for(let stage=0;stage<13;stage++)for(const n of [0,Math.floor(totals[stage]/2),totals[stage]]){
  const p=choose(stage,n,totals[stage],'indigo');
  assert.ok(FRLG_LOCALE_NAMES.includes(p.locale),stage+' / '+n+' must use installed asset ID');
  assert.ok(p.chapterPage>=0&&p.chapterPage<KANTO_BACKDROP_SPANS[stage]);
  assert.ok(Object.isFrozen(p));
 }
 const fn=fs.readFileSync('tools/pokearena/torre2-frlg-location.js','utf8');
 const route=fs.readFileSync('tools/pokearena/torre2-battle-path.js','utf8');
 const scene=fs.readFileSync('tools/pokearena/torre2-campaign-scene.js','utf8');
 assert.match(route,/renderBackdrop\(scene,stage,progress,total\)/);
 assert.match(scene,/routeBackdropForCampaign\(stage,state\?\.trainer/);
 assert.doesNotMatch(fn.slice(fn.indexOf('export function routeBackdropForCampaign'),
  fn.indexOf('// A full map-image sheet')),/saveCampaign|Math\.random|localStorage|resolveBattle/);
});
