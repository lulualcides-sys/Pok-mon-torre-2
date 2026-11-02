import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hasCampaignCity} from '../tools/pokearena/torre2-city-atlas.js';
const source=fs.readFileSync('tools/pokearena/torre2-city-regions.js','utf8').replaceAll("'./city-layout.js'",JSON.stringify(new URL('../tools/pokearena/torre2-city-layout.js',import.meta.url).href)).replaceAll("'./city-atlas.js'",JSON.stringify(new URL('../tools/pokearena/torre2-city-atlas.js',import.meta.url).href));
const {cityProfile}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
test('every Kanto city and Elite checkpoint has exactly three reachable services',()=>{
 for(let stage=0;stage<=12;stage++){
  assert.equal(hasCampaignCity(stage),true);
  const p=cityProfile(stage);assert.deepEqual(p.landmarks.map(x=>x.id),['center','mart','gym']);
  for(const point of p.landmarks){assert.ok(point.x>40&&point.x<600);assert.ok(point.y>80&&point.y<290);assert.ok(point.doorY<point.y);}
 }
 for(const stage of [-1,13,NaN,1.5])assert.equal(hasCampaignCity(stage),false);
});
test('regional city layouts and gym identities are distinct, Elite shares its palace',()=>{
 const profiles=Array.from({length:9},(_,i)=>cityProfile(i));
 assert.equal(new Set(profiles.map(p=>p.theme)).size,9);
 assert.equal(new Set(profiles.map(p=>JSON.stringify(p.landmarks))).size,9);
 assert.deepEqual(cityProfile(12),cityProfile(8));
 for(const file of ['regional-gyms-v1.webp','boat-v2.webp']){
  const b=fs.readFileSync('reference-assets/kanto/city-original/'+file);
  assert.equal(b.toString('ascii',8,12),'WEBP');assert.ok(b.length<450000);
 }
});
