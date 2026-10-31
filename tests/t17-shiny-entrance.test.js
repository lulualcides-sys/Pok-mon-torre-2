// Original T17 cosmetic component — mock only checks timing and teardown.
// Production Phaser/WebGL rendering is checked in the separate browser gate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {installShinyEntrance,SHINY_DURATION_MS} from '../tools/pokearena/torre2-shiny-fx.js';
function fixture(){
 const events=new EventEmitter(),gfx=[];
 const scene={events,add:{graphics(){
  const graphic={active:true,destroyed:false,
   setDepth(){return this},setData(key,value){this.data??={};this.data[key]=value;return this},
   fillStyle(){return this},fillRect(){return this},clear(){return this},
   destroy(){this.active=false;this.destroyed=true}};
  gfx.push(graphic);return graphic;
 }}};
 const actor={x:200,y:180,alto:40,ko:false,spr:{active:true},def:{id:'pikachu'}};
 return {scene,actor,gfx};
}
test('Shiny stars use exact 1.5s lifecycle with native Graphics and no hitbox mutation',()=>{
 const {scene,actor,gfx}=fixture(),original={...actor};
 const star=installShinyEntrance(scene,actor,0);
 assert.ok(star);assert.equal(SHINY_DURATION_MS,1500);
 assert.equal(gfx[0].data['torre2-shiny-stars'],true);
 assert.equal(scene.events.listenerCount('update'),1);
 assert.deepEqual(scene.__torre2ShinyDebug.entrances,[{side:0,species:'pikachu'}]);
 scene.events.emit('update',0,1490);
 assert.equal(star.disposed,false);
 assert.equal(scene.__torre2ShinyDebug.active.length,1);
 scene.events.emit('update',0,10);
 assert.equal(star.disposed,true);
 assert.equal(gfx[0].destroyed,true);
 assert.equal(scene.events.listenerCount('update'),0);
 assert.equal(scene.__torre2ShinyDebug.active.length,0);
 assert.deepEqual(actor,original,'Shiny FX must not mutate real fighter state');
});
test('shutdown, KO and repeated destroy release all Phaser listeners',()=>{
 for(const cancel of ['shutdown','destroy','ko']){
  const {scene,actor,gfx}=fixture();
  const star=installShinyEntrance(scene,actor,1);
  if(cancel==='ko'){actor.ko=true;scene.events.emit('update',0,16)}
  else scene.events.emit(cancel);
  assert.equal(star.disposed,true);
  assert.equal(gfx[0].destroyed,true);
  for(const event of ['update','shutdown','destroy'])assert.equal(scene.events.listenerCount(event),0);
  star.destroy();assert.equal(scene.__torre2ShinyDebug.active.length,0);
 }
});
test('invalid or disabled scene does not install cosmetics',()=>{
 assert.equal(installShinyEntrance(null,{}),null);
 assert.equal(installShinyEntrance({add:{},events:{}},{}),null);
});
