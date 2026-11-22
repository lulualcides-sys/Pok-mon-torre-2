// Owner list 2026-11-20, item 16: route weather (visual + encounter weights).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeWeather,ROUTE_WEATHERS,weatherWeight,pickWeighted,weatherShares,WEATHER_MORE,WEATHER_LESS}
 from '../tools/pokearena/torre2-route-weather.js';

test('weather is deterministic per route and 3-hour window',()=>{
 const a=new Date(2026,10,20,9,5),b=new Date(2026,10,20,11,59),c=new Date(2026,10,20,12,0);
 assert.equal(routeWeather(2,a),routeWeather(2,b));
 for(let st=0;st<9;st++)assert.ok(ROUTE_WEATHERS[routeWeather(st,c)]);
 // Over a month every stage sees more than one kind of weather.
 for(let st=0;st<9;st++){
  const kinds=new Set();for(let d=1;d<=30;d++)for(let h=0;h<24;h+=3)kinds.add(routeWeather(st,new Date(2026,10,d,h)));
  assert.ok(kinds.size>=3,'stage '+st);
 }
 // Hail only near Seafoam (stage 6).
 for(let st=0;st<9;st++)if(st!==6)for(let d=1;d<=30;d++)for(let h=0;h<24;h+=3)
  assert.notEqual(routeWeather(st,new Date(2026,10,d,h)),'hail');
});
test('weights: matching type more, opposed less, mixed neutral, clear uniform',()=>{
 assert.equal(weatherWeight('rain',['WATER']),WEATHER_MORE);
 assert.equal(weatherWeight('rain',['FIRE']),WEATHER_LESS);
 assert.equal(weatherWeight('rain',['WATER','GROUND']),1);
 assert.equal(weatherWeight('clear',['WATER']),1);
 assert.equal(weatherWeight('nope',['WATER']),1);
});
test('uniform weights give exactly the old pick',()=>{
 const list=['a','b','c','d','e'];
 for(const r of [0,.1,.2,.39,.5,.8,.999999,1])
  assert.equal(pickWeighted(list,[1,1,1,1,1],r),list[Math.min(4,Math.floor(Math.max(0,Math.min(.999999,r))*5))]);
 assert.equal(pickWeighted([],[],.5),null);
});
test('weighted pick only returns species of the list, more often the favoured one',()=>{
 const list=['psyduck','growlithe','pidgey'];
 const types={psyduck:['WATER'],growlithe:['FIRE'],pidgey:['NORMAL','FLYING']};
 const w=list.map(id=>weatherWeight('rain',types[id]));
 const count={psyduck:0,growlithe:0,pidgey:0};
 for(let i=0;i<1000;i++)count[pickWeighted(list,w,i/1000)]++;
 assert.ok(count.psyduck>count.pidgey&&count.pidgey>count.growlithe,JSON.stringify(count));
 const sh=weatherShares('rain',list,id=>types[id]);
 assert.ok(Math.abs(Object.values(sh).reduce((a,b)=>a+b,0)-1)<1e-9);
});
test('campaign: weather passed to the encounter, never to battles',()=>{
 const core=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-core.js',import.meta.url),'utf8');
 assert.match(core,/export function startWildEncounter\(s,random=Math\.random,areaStage=null,weather=null(,phase=timeOfDay\(\))?\)/);
 assert.match(core,/pickWeighted\(area\.available,/);
 const scene=fs.readFileSync(new URL('../tools/pokearena/torre2-campaign-scene.js',import.meta.url),'utf8');
 assert.match(scene,/startWildEncounter\(state,Math\.random,revisit\?areaStage:null,sky\)/);
 assert.ok(!/setWeather\([^)]*sky/.test(scene),'route weather must not set battle weather');
});
