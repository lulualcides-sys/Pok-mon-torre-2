import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createWeather,setWeather,tickWeather,weatherSpeciesMultiplier} from '../tools/pokearena/torre2-weather.js';
import {WEATHER_STATUS_FLOAT_MS,weatherStatusDescriptor,installWeatherStatusFloat}
 from '../tools/pokearena/torre2-weather-status-float.js';

function fixture(){
 const events=new EventEmitter(),objects=[],tweens=[];
 const scene={events,fase:'lucha',scene:{isActive:()=>true},
  add:{text(x,y,value,style){
   const object={x,y,text:value,style,active:true,data:{},
    setOrigin(){return this},setDepth(n){this.depth=n;return this},
    setAlpha(){return this},setScale(){return this},
    setData(k,v){this.data[k]=v;return this},destroy(){this.active=false}};
   objects.push(object);return object;
  }},
  tweens:{add(c){tweens.push(c);return c;}}};
 const weather=createWeather();
 const actors=[
  {x:160,y:190,alto:38,tipos:['GRASS'],hp:80,ko:false,spr:{visible:true}},
  {x:510,y:195,alto:36,tipos:['WATER'],hp:80,ko:false,spr:{visible:true}}
 ];
 const party={playerIndex:0,enemyIndex:0,friend:[{id:'bulbasaur',uid:'p-1'},{id:'charmander',uid:'p-2'}],
  foes:[{id:'squirtle',uid:'e-1'}]};
 const ui=installWeatherStatusFloat(scene,weather,actors,party);
 const update=()=>events.emit('update',0,16);
 return {scene,weather,actors,party,ui,objects,tweens,update};
}
test('descriptor always reuses real ±20% species damage and respects neutral dual types',()=>{
 const w=createWeather();
 for(const [climate,positive,negative] of [
  ['sun','FIRE','WATER'],['rain','WATER','FIRE'],
  ['sand','ROCK','GRASS'],['hail','ICE','DRAGON']]){
  setWeather(w,climate);
  assert.equal(weatherStatusDescriptor(w,[positive]).text,'ATK +20%');
  assert.equal(weatherStatusDescriptor(w,[negative]).text,'ATK -20%');
  assert.equal(weatherStatusDescriptor(w,[positive]).kind,'bonus');
  assert.equal(weatherStatusDescriptor(w,[negative]).kind,'penalty');
  assert.equal(weatherStatusDescriptor(w,[positive,negative]),null);
  assert.equal(weatherStatusDescriptor(w,['NORMAL']),null);
  assert.equal(weatherStatusDescriptor(w,[positive])?.kind,
    weatherSpeciesMultiplier(w,[positive])>1?'bonus':'penalty');
 }
 setWeather(w,'rain');
 assert.equal(weatherStatusDescriptor(w,['ELECTRIC']),null,
  'Electric should not display a misleading ATK +20% under rain');
 setWeather(w,'hail');
 assert.equal(weatherStatusDescriptor(w,['WATER']),null,
  'Pure Water should not display a hail offensive bonus');
 setWeather(w,'none');
 assert.equal(weatherStatusDescriptor(w,['FIRE']),null);
 assert.equal(WEATHER_STATUS_FLOAT_MS,1120);
});
test('sprite-side labels animate once per active climate, do not spam, expire',()=>{
 const f=fixture();
 f.update();assert.equal(f.objects.length,0);
 setWeather(f.weather,'sun');f.update();
 assert.deepEqual(f.ui.debug.shown.map(x=>x.text),['ATK +20%','ATK -20%']);
 assert.equal(f.objects.length,2);
 assert.equal(f.objects[0].style.fontFamily,'Pixelify Sans,monospace');
 assert.equal(f.objects[0].data['torre2-weather-status'],0);
 assert.equal(f.objects[1].data['torre2-weather-status-kind'],'penalty');
 assert.ok(f.objects[0].x>f.actors[0].x&&f.objects[1].x<f.actors[1].x);
 for(let i=0;i<90;i++)f.update();
 assert.equal(f.objects.length,2,'same weather revision must not keep repeating');
 assert.deepEqual(f.tweens.map(x=>x.duration),[1120,1120]);
 f.tweens[0].onComplete();
 assert.equal(f.objects[0].active,false);
 assert.equal(f.ui.debug.active[0],null);
 tickWeather(f.weather,20,[]);f.update();
 assert.equal(f.ui.debug.active[1],null,'weather expiry clears pending negatives');
 assert.equal(f.ui.debug.shown.length,2,'no neutral toast when climate expires');
});
test('weather replacement and real teammate switch re-announce only affected Pokémon',()=>{
 const f=fixture();setWeather(f.weather,'sun');
 f.scene.fase='torre2-sendout';f.update();
 assert.equal(f.objects.length,0,'do not draw through original Pokeball choreography');
 f.scene.fase='lucha';f.update();assert.equal(f.objects.length,2);
 setWeather(f.weather,'rain');f.update();
 assert.equal(f.ui.debug.shown.length,3,'rain = neutral Bulbasaur, +20% Squirtle');
 assert.deepEqual(f.ui.debug.shown.at(-1),{
  side:1,species:'squirtle',revision:f.weather.revision,
  kind:'bonus',text:'ATK +20%',climate:'CHUVA'
 });
 f.scene.__torre2Changing=true;
 f.party.playerIndex=1;f.actors[0].tipos=['FIRE'];f.update();
 assert.equal(f.ui.debug.shown.length,3,'do not show before switch ends');
 f.scene.__torre2Changing=false;f.update();
 assert.equal(f.ui.debug.shown.at(-1).species,'charmander');
 assert.equal(f.ui.debug.shown.at(-1).text,'ATK -20%');
 const n=f.ui.debug.shown.length;f.update();f.update();assert.equal(f.ui.debug.shown.length,n);
 f.scene.events.emit('shutdown');
 assert.equal(f.ui.debug.disposed,true);
 assert.equal(f.scene.events.listenerCount('update'),0);
 assert.equal(f.ui.debug.active.every(x=>x===null),true);
 f.update();assert.equal(f.ui.debug.shown.length,n);
});
