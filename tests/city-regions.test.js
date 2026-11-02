import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hasCampaignCity} from '../tools/pokearena/torre2-city-atlas.js';
import {REGIONAL_SIGNATURES} from '../tools/pokearena/torre2-region-identity.js';
const source=fs.readFileSync('tools/pokearena/torre2-city-regions.js','utf8').replaceAll("'./city-layout.js'",JSON.stringify(new URL('../tools/pokearena/torre2-city-layout.js',import.meta.url).href)).replaceAll("'./city-atlas.js'",JSON.stringify(new URL('../tools/pokearena/torre2-city-atlas.js',import.meta.url).href)).replaceAll("'./region-identity.js'",JSON.stringify(new URL('../tools/pokearena/torre2-region-identity.js',import.meta.url).href));
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

test('regional landscape signatures are genuinely distinct and purely decorative',()=>{
 const themes=['stone','electric','garden','poison','psychic','volcano','forest','league'];
 assert.deepEqual(Object.keys(REGIONAL_SIGNATURES),themes);
 assert.equal(new Set(themes.map(t=>REGIONAL_SIGNATURES[t].feature)).size,8);
 for(const t of themes){
  assert.equal(Object.isFrozen(REGIONAL_SIGNATURES[t]),true);
  assert.ok(REGIONAL_SIGNATURES[t].feature.length>10);
 }
});
test('Viridian and League hit areas include the centers of their visible atlas doors',()=>{
 for(const [stage,x,y]of [[7,320,217],[8,320,128],[12,320,128]]){
  const p=cityProfile(stage).landmarks.find(p=>p.id==='gym');
  assert.ok(Math.abs(x-p.x)<41&&y>=p.doorY-12&&y<=p.y+15);
 }
});
