import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {synchronizedArenaSpeed as speed, ARENA_SPEED_REFERENCE as ref} from '../tools/pokearena/torre2-arena-tempo.js';

test('native Poké Arena 2D Pokémon move exactly at their original speed',()=>{
 for(const raw of [86,104,118,129,142,156,160])
  assert.equal(speed(raw,{added:false}),raw);
});

test('Kanto campaign and Arena always share identical new-roster walking speed',()=>{
 for(const raw of [70,80,104,121,142,169])
  for(const kanto151 of [false,true]){
   const arena=speed(raw,{added:true,kanto151});
   const kanto=speed(raw,{added:true,kanto151,campaign:true});
   assert.equal(kanto,arena);
   assert.ok(kanto>=ref.min&&kanto<=ref.max);
  }
 for(const raw of [70,100,129,172])assert.equal(
  speed(raw,{added:false,campaign:true}),raw,'original species remain native');
});

test('both added Kanto batches align their central walking pace with the original',()=>{
 assert.equal(speed(ref.earlyKanto,{added:true}),ref.native);
 assert.equal(speed(ref.extendedKanto,{added:true,kanto151:true}),ref.native);
 assert.ok(speed(108,{added:true})>108,'Koffing walks closer to native pacing');
 assert.ok(speed(104,{added:true,kanto151:true})>104,'extended Kanto gets full speed harmonization');
});

test('relative species speed identity remains meaningful and safe',()=>{
 for(const kanto151 of [true,false]){
  const inputs=[60,75,95,105,118,130,145,165];
  const adjusted=inputs.map(raw=>speed(raw,{added:true,kanto151}));
  assert.ok(adjusted.every(x=>Number.isInteger(x)&&x>=ref.min&&x<=ref.max));
  assert.ok(adjusted.every((n,i)=>i===0||n>=adjusted[i-1]));
  assert.ok(adjusted[3]>adjusted[1]);
 }
});

test('no unrequested animation, combat or move-system patch',()=>{
 const builder=readFileSync(new URL('../tools/pokearena/build-preview.mjs',import.meta.url),'utf8');
 assert.match(builder,/synchronizedArenaSpeed\(this\.forma\.vel/);
 assert.match(builder,/kanto151:this\.def\.torre2Kanto151===true/);
 assert.match(builder,/campaign:!!this\.escena\.datos\?\.torre2/);
 assert.match(builder,/\['tools\/pokearena\/torre2-arena-tempo\.js','arena-tempo\.js'\]/);
});
