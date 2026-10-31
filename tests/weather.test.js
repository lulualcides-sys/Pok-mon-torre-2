import test from 'node:test';import assert from 'node:assert/strict';
import {createWeather,setWeather,tickWeather,weatherDamageMultiplier as damage,weatherResidualImmune as immune,weatherAccuracy as accuracy,weatherRecoveryFraction as recovery,weatherThunderMiss as miss,weatherFromMove} from '../tools/pokearena/torre2-weather.js';
const mon=(tipos=['NORMAL'])=>({hp:160,hpMax:160,tipos});
test('one global weather, replacement, finite five-window expiration',()=>{
 const w=createWeather(),a=mon();setWeather(w,'sand');tickWeather(w,3.9,[a]);assert.equal(a.hp,160);tickWeather(w,.1,[a]);assert.equal(a.hp,150);tickWeather(w,0,[a]);assert.equal(a.hp,150);
 setWeather(w,'rain');assert.equal(w.remaining,20);tickWeather(w,20,[a]);assert.equal(w.kind,'none');assert.equal(a.hp,150);
 setWeather(w,'hail');tickWeather(w,999,[a]);assert.equal(a.hp,100);assert.equal(w.kind,'none');
});
test('Gen III weather modifiers, healing and no later-generation hail accuracy',()=>{
 const w=createWeather();assert.equal(recovery(w),.5);setWeather(w,'sun');assert.equal(damage(w,'FIRE','',['FIRE']),1.2);assert.equal(damage(w,'WATER'),.5);assert.equal(recovery(w),2/3);assert.equal(accuracy(w,'Thunder',70),50);
 setWeather(w,'rain');assert.equal(damage(w,'WATER','',['WATER']),1.2);assert.equal(damage(w,'FIRE'),.5);assert.equal(damage(w,'GRASS','Solar Beam'),.5);assert.equal(accuracy(w,'Thunder',70),100);assert.equal(recovery(w),.25);
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

test('FRLG Thunder sunlight accuracy applies on native hit, not other moves',()=>{
 const w=createWeather();
 let rolls=0;const high=()=>{rolls++;return .99};
 assert.equal(miss(w,'Thunder',high),false);
 assert.equal(rolls,0);
 setWeather(w,'rain');
 assert.equal(accuracy(w,'Thunder',70),100);
 assert.equal(accuracy(w,'Trueno',70),100);
 assert.equal(miss(w,'Thunder',high),false);
 assert.equal(rolls,0,'Rain cannot add an unwanted miss roll');
 setWeather(w,'sun');
 assert.equal(accuracy(w,'Thunder',70),50);
 assert.equal(accuracy(w,'Trueno',70),50);
 assert.equal(miss(w,'Thunder',high),true,'High sunlight roll misses');
 assert.equal(miss(w,'Thunder',()=>0),false,'Low sunlight roll hits');
 assert.equal(miss(w,'Trueno',()=>.75),true);
 assert.equal(miss(w,'Thunderbolt',high),false);
 assert.equal(miss(w,'Thunder Wave',high),false);
 assert.equal(accuracy(w,'Thunderbolt',70),70);
 assert.equal(accuracy(w,'Blizzard',70),70);
 assert.equal(damage(w,'FIRE','',['FIRE']),1.2);
 assert.equal(damage(w,'WATER'),.5);
 setWeather(w,'sand');
 assert.equal(miss(w,'Thunder',high),false);
 assert.equal(accuracy(w,'Thunder',70),70);
});
test('Solar Beam alternative names are halved in rain, sand or hail',()=>{
 const w=createWeather();
 for(const kind of ['rain','sand','hail']){
  setWeather(w,kind);
  for(const name of ['Solar Beam','Solarbeam','Rayo Solar'])
   assert.equal(damage(w,'GRASS',name),.5,kind+' '+name);
  assert.equal(damage(w,'GRASS','Razor Leaf'),1);
 }
 setWeather(w,'sun');
 assert.equal(damage(w,'GRASS','Rayo Solar'),1);
});

test('each matching Kanto weather affinity boosts exactly 20% direct damage',()=>{
 const w=createWeather();
 const cases=[
  ['sun',['FIRE'],'FIRE'],
  ['rain',['WATER'],'WATER'],
  ['sand',['ROCK'],'ROCK'],['sand',['GROUND'],'GROUND'],
  ['sand',['STEEL'],'STEEL'],
  ['hail',['ICE'],'ICE']
 ];
 for(const [kind,types,attackType] of cases){
  setWeather(w,kind);
  assert.equal(damage(w,attackType,'',types),1.2,kind+' '+types);
  assert.equal(damage(w,'NORMAL','Tackle',types),1.2,
   'Coverage moves also get one species bonus: '+kind+' '+types);
  assert.equal(damage(w,attackType),1,
   'No species data must never gift +20% to every attacker');
  assert.equal(damage(w,attackType,'',['NORMAL']),1,
   'Wrong-type attacker is not weather-affine');
  assert.equal(damage(w,attackType,'',[...types,...types]),1.2,
   'Repeated typing must not double the buff');
  assert.equal(damage(w,attackType,'',[...types,'NORMAL']),1.2,
   'Dual types must not stack multiple bonuses');
  tickWeather(w,19.999,[]);
  assert.equal(damage(w,'NORMAL','Tackle',types),1.2,
   'Bonus stays on until the current weather expires');
  tickWeather(w,.001,[]);
  assert.equal(w.kind,'none');
  assert.equal(damage(w,'NORMAL','Tackle',types),1,
   'Normal damage is restored at 20 seconds');
 }
});

test('weather changes and residual penalties are never overpowered or stacked',()=>{
 const w=createWeather();
 setWeather(w,'sun');
 assert.equal(damage(w,'WATER','Surf',['FIRE']),.6,
  'A Fire species retains the -50% sun penalty for Water moves');
 assert.equal(damage(w,'FIRE','Ember',['WATER']),.8,
  'Water attackers lose 20% direct damage in sunlight, even with Fire moves');
 setWeather(w,'rain');
 assert.equal(damage(w,'FIRE','Ember',['WATER']),.6);
 assert.equal(damage(w,'GRASS','Solar Beam',['WATER']),.6,
  'Rain weakens Solar Beam while Water species gains only +20%');
 setWeather(w,'sand');
 assert.equal(damage(w,'GRASS','Solar Beam',['ROCK']),.6);
 setWeather(w,'hail');
 assert.equal(damage(w,'GRASS','Solar Beam',['ICE']),.6);
 assert.equal(damage(w,'ICE','Ice Beam',['ICE','WATER']),1.2);
 assert.equal(damage(w,'ICE','Ice Beam',['FIRE']),.8);
 assert.equal(damage({kind:'sun',remaining:0},'FIRE','Ember',['FIRE']),1,
  'An expired weather state cannot grant a hidden buff');
 setWeather(w,'none');
 assert.equal(damage(w,'NORMAL','Tackle',['ROCK','ICE']),1);
});

test('fractional final frame expires weather and never extends bonus to a sixth window',()=>{
 const w=createWeather();
 setWeather(w,'sun');
 tickWeather(w,19.999,[]);
 assert.equal(w.kind,'sun');
 tickWeather(w,.001,[]);
 assert.equal(w.kind,'none');
 assert.equal(damage(w,'NORMAL','Tackle',['FIRE']),1);
});

test('friendly and opposing climate species have ±20% for ALL four climates',()=>{
 const w=createWeather();
 const matrix=[
  ['sun',['FIRE','GRASS'],['WATER','ICE']],
  ['rain',['WATER'],['FIRE','GROUND','ROCK']],
  ['sand',['ROCK','GROUND','STEEL'],['GRASS','FLYING','ICE']],
  ['hail',['ICE'],['FIRE','GRASS','DRAGON']]
 ];
 for(const [kind,plus,minus] of matrix){
  setWeather(w,kind);
  for(const species of plus){
   assert.equal(damage(w,'NORMAL','Tackle',[species]),1.2,kind+' favorable '+species);
   assert.equal(damage(w,'NORMAL','Tackle',[species,species]),1.2,
    'Same side dual types never stack: '+kind+' '+species);
  }
  for(const species of minus){
   assert.equal(damage(w,'NORMAL','Tackle',[species]),.8,kind+' opposing '+species);
   assert.equal(damage(w,'NORMAL','Tackle',[species,species]),.8,
    'Same side adverse dual types never stack: '+kind+' '+species);
  }
  assert.equal(damage(w,'NORMAL','Tackle',[plus[0],minus[0]]),1,
   'Conflicting two-type affinity cancels: '+kind);
  assert.equal(damage(w,'NORMAL','Tackle',[minus[0],plus[0]]),1,
   'Dual type order cannot bias climate modifier: '+kind);
  assert.equal(damage(w,'NORMAL','Tackle',['NORMAL']),1,
   'Unrelated Normal remains neutral: '+kind);
  tickWeather(w,20,[]);
  assert.equal(damage(w,'NORMAL','Tackle',[minus[0]]),1,
   'Penalty must expire exactly with its weather: '+kind);
 }
});

test('original move-specific penalties and new species penalties cannot compound',()=>{
 const w=createWeather();
 setWeather(w,'sun');
 assert.equal(damage(w,'WATER','Water Gun',['WATER']),.5,
  'Water species already suffers the stronger original -50% Water-move penalty');
 assert.equal(damage(w,'WATER','Water Gun',['ICE']),.5);
 assert.equal(damage(w,'WATER','Water Gun',['FIRE']),.6,
  'Friendly Fire species can still use a disadvantaged Water coverage move');
 assert.equal(damage(w,'WATER','Water Gun',['GRASS','WATER']),.5,
  'Opposed and favorable dual types neutralize; old move penalty remains');
 setWeather(w,'rain');
 assert.equal(damage(w,'FIRE','Flamethrower',['FIRE']),.5);
 assert.equal(damage(w,'FIRE','Flamethrower',['WATER']),.6);
 assert.equal(damage(w,'FIRE','Flamethrower',['ELECTRIC','GROUND']),.5);
 setWeather(w,'hail');
 assert.equal(damage(w,'GRASS','Solar Beam',['GRASS']),.5);
 assert.equal(damage(w,'GRASS','Solar Beam',['ICE']),.6);
});

test('water-only rain offense, electric Thunder accuracy preserved, ice-only hail affinity',()=>{
 const w=createWeather();
 setWeather(w,'rain');
 assert.equal(damage(w,'NORMAL','Tackle',['ELECTRIC']),1,
  'Electric attacks must not gain a general 20% rain buff');
 assert.equal(damage(w,'ELECTRIC','Thunder',['ELECTRIC']),1);
 assert.equal(accuracy(w,'Thunder',70),100,
  'Thunder still receives its canonical perfect accuracy in rain');
 assert.equal(damage(w,'NORMAL','Tackle',['WATER']),1.2);
 setWeather(w,'hail');
 assert.equal(damage(w,'NORMAL','Tackle',['WATER']),1);
 assert.equal(damage(w,'ICE','Ice Beam',['ICE','WATER']),1.2);
});
