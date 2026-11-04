import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createWeather,setWeather,weatherDamageMultiplier,weatherFromMove} from
 '../tools/pokearena/torre2-weather.js';
import {installCampaignMoveLabelGuard} from '../tools/pokearena/torre2-combat-visual-guard.js';
import {weatherStatusDescriptor} from '../tools/pokearena/torre2-weather-status-float.js';
import {KANTO_CAMPAIGN_QUICK_COOLDOWNS,balanceCampaignQuickCooldown} from
 '../tools/pokearena/torre2-move-pool.js';
test('both campaigns abilities last four seconds, without touching native move',()=>{
 for(const name of ['Seismic Toss','Egg Bomb']){
  const original={nombre:name,cd:1.4,forma:'native'};
  const updated=balanceCampaignQuickCooldown(original);
  assert.equal(updated.cd,4);
  assert.equal(original.cd,1.4);
 }
 assert.equal(KANTO_CAMPAIGN_QUICK_COOLDOWNS.gust,.7);
});
test('actual weather state begins with the native status move and multiplies coverage damage',()=>{
 for(const [move,kind,positive,negative] of [
  ['Rain Dance','rain','WATER','FIRE'],['Sunny Day','sun','FIRE','WATER'],
  ['Sandstorm','sand','ROCK','GRASS'],['Hail','hail','ICE','DRAGON']
 ]){
  const actor={escena:{datos:{torre2:{party:{}}}}};
  weatherFromMove(actor,{nombre:move});
  const state=actor.escena.__torre2Weather;
  assert.equal(state.kind,kind);
  assert.equal(weatherDamageMultiplier(state,'NORMAL','Tackle',[positive]),1.2);
  assert.equal(weatherDamageMultiplier(state,'NORMAL','Tackle',[negative]),.8);
  assert.equal(weatherStatusDescriptor(state,[positive]).text,'ATK +20%');
  assert.equal(weatherStatusDescriptor(state,[negative]).text,'ATK -20%');
 }
 const id={escena:{datos:{torre2:{party:{}}}}};
 weatherFromMove(id,{id:'rain-dance'});
 assert.equal(id.escena.__torre2Weather.kind,'rain');
 assert.equal(weatherDamageMultiplier(id.escena.__torre2Weather,
  'ELECTRIC','Thunderbolt',['ELECTRIC']),1,'rain must NOT buff electric attack');
 const outside={escena:{datos:{}}};
 weatherFromMove(outside,{nombre:'Rain Dance'});
 assert.equal(outside.escena.__torre2Weather,undefined,'Arena/VS weather untouched');
});
function fixture(){
 const game=new EventEmitter(),events=new EventEmitter(),created=[];
 const actor={kit:{rmb:{nombre:'Hydro Cannon'},q:{nombre:'Acid'}},hp:80};
 const scene={datos:{torre2:{party:{}}},scene:{isActive:()=>true},
  fase:'lucha',game:{events},events,children:{list:created}};
 return {scene,game,events,created,actor};
}
test('campaign label guard clamps giant Hydro Cannon/Acid without removing FX or HUD',()=>{
 const {scene,game,created,actor}=fixture(),effects=[{alive:true}],other={active:true,type:'Text',text:'Nv.40',
   displayWidth:80,displayHeight:80};
 scene.efectos=effects;
 const label={active:true,type:'Text',text:'Hydro Cannon!',displayWidth:610,
  displayHeight:92,scaleX:1,scaleY:1,x:620,y:4,
  setScale(x,y){this.scaleX=x;this.scaleY=y;this.displayWidth=610*x;this.displayHeight=92*y;return this},
  setPosition(x,y){this.x=x;this.y=y;return this}};
 created.push(label,other);
 const guard=installCampaignMoveLabelGuard(scene,[actor]);
 assert.equal(guard.check(),1);
 assert.ok(label.displayWidth<=208&&label.displayHeight<=24);
 assert.ok(label.x<=530&&label.y>=42,'top HP banner should not be covered');
 assert.equal(other.displayHeight,80,'HP and level HUD untouched');
 assert.strictEqual(scene.efectos,effects,'never destroy native projectile effects');
 const acid={...label,text:'Acid',displayWidth:80,displayHeight:38,scaleX:1,scaleY:1,
  setScale(x,y){this.scaleX=x;this.scaleY=y;this.displayWidth=80*x;this.displayHeight=38*y;return this}};
 created.push(acid);assert.equal(guard.check(),1);assert.ok(acid.displayHeight<=24);
 scene.events.emit('shutdown');
 assert.equal(scene.game.events.listenerCount('poststep'),0);
 assert.equal(guard.check(),0);
});
test('no label visual changes occur for Arena and standard native battles',()=>{
 const {scene,created,actor}=fixture();
 scene.datos={modo:'arena'};
 const giant={active:true,type:'Text',text:'Hydro Cannon!',displayWidth:600,
  displayHeight:90};created.push(giant);
 const guard=installCampaignMoveLabelGuard(scene,[actor]);
 assert.equal(guard.check(),0);
 assert.equal(giant.displayWidth,600);
});
