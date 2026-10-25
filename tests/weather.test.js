import test from 'node:test';import assert from 'node:assert/strict';
import {createWeather,setWeather,tickWeather,weatherDamageMultiplier as damage,weatherResidualImmune as immune,weatherAccuracy as accuracy,weatherRecoveryFraction as recovery,weatherFromMove} from '../tools/pokearena/torre2-weather.js';
const mon=(tipos=['NORMAL'])=>({hp:160,hpMax:160,tipos});
test('one global weather, replacement, finite five-window expiration',()=>{
 const w=createWeather(),a=mon();setWeather(w,'sand');tickWeather(w,3.9,[a]);assert.equal(a.hp,160);tickWeather(w,.1,[a]);assert.equal(a.hp,150);tickWeather(w,0,[a]);assert.equal(a.hp,150);
 setWeather(w,'rain');assert.equal(w.remaining,20);tickWeather(w,20,[a]);assert.equal(w.kind,'none');assert.equal(a.hp,150);
 setWeather(w,'hail');tickWeather(w,999,[a]);assert.equal(a.hp,100);assert.equal(w.kind,'none');
});
test('Gen III weather modifiers, healing and no later-generation hail accuracy',()=>{
 const w=createWeather();assert.equal(recovery(w),.5);setWeather(w,'sun');assert.equal(damage(w,'FIRE'),1.5);assert.equal(damage(w,'WATER'),.5);assert.equal(recovery(w),2/3);assert.equal(accuracy(w,'Thunder',70),50);
 setWeather(w,'rain');assert.equal(damage(w,'WATER'),1.5);assert.equal(damage(w,'FIRE'),.5);assert.equal(damage(w,'GRASS','Solar Beam'),.5);assert.equal(accuracy(w,'Thunder',70),100);assert.equal(recovery(w),.25);
 setWeather(w,'hail');assert.equal(accuracy(w,'Blizzard',70),70);assert.equal(damage(w,'ROCK'),1);
});
test('residual applies to both sides, immunities and bounded fainting',()=>{
 for(const type of ['ROCK','GROUND','STEEL'])assert.ok(immune('sand',[type]));assert.ok(immune('hail',['ICE']));assert.ok(!immune('hail',['WATER']));
 const w=createWeather(),a=mon(),b=mon(['ICE']);setWeather(w,'hail');a.hp=1;assert.deepEqual(tickWeather(w,4,[a,b]),[a]);assert.equal(a.hp,0);assert.equal(b.hp,160);assert.deepEqual(tickWeather(w,4,[a,b]),[]);
 const next=createWeather();tickWeather(next,20,[b]);assert.equal(b.hp,160);
});
test('successful weather move affects only campaign battle state',()=>{
 const a={escena:{datos:{torre2:{}}}};weatherFromMove(a,{nombre:'Rain Dance'});assert.equal(a.escena.__torre2Weather.kind,'rain');
 const b={escena:{datos:{}}};weatherFromMove(b,{nombre:'Sunny Day'});assert.equal(b.escena.__torre2Weather,undefined);
});
